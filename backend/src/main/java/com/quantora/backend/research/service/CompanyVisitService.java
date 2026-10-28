package com.quantora.backend.research.service;

import com.quantora.backend.auth.exception.UnauthorizedException;
import com.quantora.backend.instrument.InstrumentSymbols;
import com.quantora.backend.research.dto.CompanyVisitResponse;
import com.quantora.backend.research.entity.CompanyVisit;
import com.quantora.backend.research.enums.ResearchSection;
import com.quantora.backend.research.repository.CompanyVisitRepository;
import com.quantora.backend.user.entity.User;
import com.quantora.backend.user.repository.UserRepository;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;

@Service
public class CompanyVisitService {

    private final CompanyVisitRepository companyVisitRepository;
    private final UserRepository userRepository;

    public CompanyVisitService(CompanyVisitRepository companyVisitRepository, UserRepository userRepository) {
        this.companyVisitRepository = companyVisitRepository;
        this.userRepository = userRepository;
    }

    @Transactional(readOnly = true)
    public List<CompanyVisitResponse> list(Long userId) {
        requireActiveUser(userId);
        return companyVisitRepository.findAllByUserIdOrderByLastViewedAtDesc(userId).stream()
                .map(CompanyVisitResponse::from)
                .toList();
    }

    /**
     * Deliberately not {@code @Transactional}: each repository call below gets its own
     * transaction from Spring Data. That matters here because a racing insert (two visits
     * for the same company arriving at once, e.g. a double-mounted React effect) must fail
     * and roll back in its own transaction; catching it inside one shared transaction left
     * Hibernate's session unusable for the fallback read that follows.
     */
    public CompanyVisitResponse recordVisit(Long userId, String rawSymbol, ResearchSection section) {
        User user = requireActiveUser(userId);
        String symbol = InstrumentSymbols.normalize(rawSymbol);
        LocalDateTime now = LocalDateTime.now();

        CompanyVisit visit = companyVisitRepository.findByUserIdAndSymbol(userId, symbol).orElse(null);
        if (visit == null) {
            CompanyVisit created = CompanyVisit.builder()
                    .user(user)
                    .symbol(symbol)
                    .maxSectionRank(section.ordinal())
                    .viewCount(1)
                    .firstViewedAt(now)
                    .lastViewedAt(now)
                    .build();
            try {
                return CompanyVisitResponse.from(companyVisitRepository.saveAndFlush(created));
            } catch (DataIntegrityViolationException raced) {
                // The other request's insert already committed; fall through and update
                // the row it created instead of failing this one.
                visit = companyVisitRepository.findByUserIdAndSymbol(userId, symbol).orElseThrow(() -> raced);
            }
        }

        visit.setMaxSectionRank(Math.max(visit.getMaxSectionRank(), section.ordinal()));
        visit.setViewCount(visit.getViewCount() + 1);
        visit.setLastViewedAt(now);
        return CompanyVisitResponse.from(companyVisitRepository.save(visit));
    }

    @Transactional(readOnly = true)
    public long count(Long userId) {
        requireActiveUser(userId);
        return companyVisitRepository.countByUserId(userId);
    }

    private User requireActiveUser(Long userId) {
        return userRepository.findById(userId)
                .filter(u -> u.getDeletedAt() == null)
                .orElseThrow(UnauthorizedException::new);
    }
}
