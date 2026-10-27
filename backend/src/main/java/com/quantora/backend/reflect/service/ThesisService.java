package com.quantora.backend.reflect.service;

import com.quantora.backend.auth.exception.UnauthorizedException;
import com.quantora.backend.reflect.dto.ThesisRequest;
import com.quantora.backend.reflect.dto.ThesisResponse;
import com.quantora.backend.reflect.entity.InvestmentThesis;
import com.quantora.backend.reflect.repository.InvestmentThesisRepository;
import com.quantora.backend.user.entity.User;
import com.quantora.backend.user.repository.UserRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
public class ThesisService {

    private final InvestmentThesisRepository thesisRepository;
    private final UserRepository userRepository;

    public ThesisService(InvestmentThesisRepository thesisRepository, UserRepository userRepository) {
        this.thesisRepository = thesisRepository;
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

    private User requireActiveUser(Long userId) {
        return userRepository.findById(userId)
                .filter(user -> user.getDeletedAt() == null)
                .orElseThrow(UnauthorizedException::new);
    }
}
