package com.quantora.backend.reflect.dto;

import com.quantora.backend.reflect.entity.ThesisReview;
import com.quantora.backend.reflect.enums.ReviewVerdict;

import java.time.LocalDateTime;

public record ThesisReviewResponse(
        Long id,
        ReviewVerdict verdict,
        String note,
        LocalDateTime createdAt
) {
    public static ThesisReviewResponse from(ThesisReview review) {
        return new ThesisReviewResponse(
                review.getId(),
                review.getVerdict(),
                review.getNote(),
                review.getCreatedAt()
        );
    }
}
