package com.quantora.backend.reflect.service;

import com.quantora.backend.auth.exception.UnauthorizedException;
import com.quantora.backend.reflect.dto.ThesisRequest;
import com.quantora.backend.reflect.dto.ThesisResponse;
import com.quantora.backend.reflect.entity.InvestmentThesis;
import com.quantora.backend.reflect.entity.ThesisReview;
import com.quantora.backend.reflect.enums.ReviewVerdict;
import com.quantora.backend.reflect.repository.InvestmentThesisRepository;
import com.quantora.backend.reflect.repository.ThesisReviewRepository;
import com.quantora.backend.user.entity.User;
import com.quantora.backend.user.repository.UserRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
public class ThesisService {

    private static final int STALE_REVIEW_DAYS = 90;

    private final InvestmentThesisRepository thesisRepository;
    private final ThesisReviewRepository thesisReviewRepository;
    private final UserRepository userRepository;

    public ThesisService(
            InvestmentThesisRepository thesisRepository,
            ThesisReviewRepository thesisReviewRepository,
            UserRepository userRepository
    ) {
        this.thesisRepository = thesisRepository;
        this.thesisReviewRepository = thesisReviewRepository;
        this.userRepository = userRepository;
    }

    @Transactional(readOnly = true)
    public List<ThesisResponse> list(Long userId) {
        requireActiveUser(userId);
        return thesisRepository.findAllByUserIdOrderByCreatedAtDesc(userId)
                .stream()
                .map(ThesisResponse::from)
                .toList();
    }

    @Transactional(readOnly = true)
    public ThesisResponse get(Long userId, Long thesisId) {
        requireActiveUser(userId);
        return thesisRepository.findByIdAndUserId(thesisId, userId)
                .map(ThesisResponse::from)
                .orElseThrow(UnauthorizedException::new);
    }

    @Transactional
    public ThesisResponse create(Long userId, ThesisRequest request) {
        User user = requireActiveUser(userId);
        InvestmentThesis thesis = InvestmentThesis.builder()
                .user(user)
                .title(request.title())
                .symbol(request.symbol())
                .thesisBody(request.thesisBody())
                .invalidation(request.invalidation())
                .points(request.points())
                .build();
        return ThesisResponse.from(thesisRepository.save(thesis));
    }

    @Transactional
    public ThesisResponse update(Long userId, Long thesisId, ThesisRequest request) {
        requireActiveUser(userId);
        InvestmentThesis thesis = thesisRepository.findByIdAndUserId(thesisId, userId)
                .orElseThrow(UnauthorizedException::new);
        thesis.setTitle(request.title());
        thesis.setSymbol(request.symbol());
        thesis.setThesisBody(request.thesisBody());
        thesis.setInvalidation(request.invalidation());
        thesis.setPoints(request.points());
        return ThesisResponse.from(thesisRepository.save(thesis));
    }

    @Transactional
    public void delete(Long userId, Long thesisId) {
        requireActiveUser(userId);
        InvestmentThesis thesis = thesisRepository.findByIdAndUserId(thesisId, userId)
                .orElseThrow(UnauthorizedException::new);
        thesisRepository.delete(thesis);
    }

    @Transactional(readOnly = true)
    public long count(Long userId) {
        requireActiveUser(userId);
        return thesisRepository.countByUserId(userId);
    }

    /**
     * A thesis needs review when it has never been reviewed, the last review did not
     * confirm it is still valid, or that confirmation is older than {@link #STALE_REVIEW_DAYS} days.
     */
    @Transactional(readOnly = true)
    public long countNeedingReview(Long userId) {
        requireActiveUser(userId);
        List<InvestmentThesis> theses = thesisRepository.findAllByUserIdOrderByCreatedAtDesc(userId);
        if (theses.isEmpty()) {
            return 0;
        }
        List<Long> thesisIds = theses.stream().map(InvestmentThesis::getId).toList();
        Map<Long, ThesisReview> latestReviewByThesisId = thesisReviewRepository
                .findAllByThesisIdInOrderByCreatedAtDesc(thesisIds).stream()
                .collect(Collectors.toMap(
                        review -> review.getThesis().getId(),
                        review -> review,
                        (first, second) -> first
                ));
        LocalDateTime staleBefore = LocalDateTime.now().minusDays(STALE_REVIEW_DAYS);
        return theses.stream().filter(thesis -> needsReview(latestReviewByThesisId.get(thesis.getId()), staleBefore)).count();
    }

    private boolean needsReview(ThesisReview latestReview, LocalDateTime staleBefore) {
        if (latestReview == null) {
            return true;
        }
        if (latestReview.getVerdict() != ReviewVerdict.STILL_VALID) {
            return true;
        }
        return latestReview.getCreatedAt().isBefore(staleBefore);
    }

    private User requireActiveUser(Long userId) {
        return userRepository.findById(userId)
                .filter(user -> user.getDeletedAt() == null)
                .orElseThrow(UnauthorizedException::new);
    }
}
