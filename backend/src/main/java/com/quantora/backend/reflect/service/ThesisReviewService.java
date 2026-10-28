package com.quantora.backend.reflect.service;

import com.quantora.backend.auth.exception.UnauthorizedException;
import com.quantora.backend.reflect.dto.ThesisReviewRequest;
import com.quantora.backend.reflect.dto.ThesisReviewResponse;
import com.quantora.backend.reflect.entity.InvestmentThesis;
import com.quantora.backend.reflect.entity.ThesisReview;
import com.quantora.backend.reflect.repository.InvestmentThesisRepository;
import com.quantora.backend.reflect.repository.ThesisReviewRepository;
import com.quantora.backend.user.repository.UserRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
public class ThesisReviewService {

    private final ThesisReviewRepository reviewRepository;
    private final InvestmentThesisRepository thesisRepository;
    private final UserRepository userRepository;

    public ThesisReviewService(
            ThesisReviewRepository reviewRepository,
            InvestmentThesisRepository thesisRepository,
            UserRepository userRepository
    ) {
        this.reviewRepository = reviewRepository;
        this.thesisRepository = thesisRepository;
        this.userRepository = userRepository;
    }

    @Transactional(readOnly = true)
    public List<ThesisReviewResponse> list(Long userId, Long thesisId) {
        InvestmentThesis thesis = requireOwnedThesis(userId, thesisId);
        return reviewRepository.findAllByThesisIdOrderByCreatedAtDesc(thesis.getId())
                .stream()
                .map(ThesisReviewResponse::from)
                .toList();
    }

    @Transactional
    public ThesisReviewResponse create(Long userId, Long thesisId, ThesisReviewRequest request) {
        InvestmentThesis thesis = requireOwnedThesis(userId, thesisId);
        ThesisReview review = ThesisReview.builder()
                .thesis(thesis)
                .verdict(request.verdict())
                .note(request.note())
                .build();
        return ThesisReviewResponse.from(reviewRepository.save(review));
    }

    private InvestmentThesis requireOwnedThesis(Long userId, Long thesisId) {
        requireActiveUser(userId);
        return thesisRepository.findByIdAndUserId(thesisId, userId)
                .orElseThrow(UnauthorizedException::new);
    }

    private void requireActiveUser(Long userId) {
        userRepository.findById(userId)
                .filter(user -> user.getDeletedAt() == null)
                .orElseThrow(UnauthorizedException::new);
    }
}
