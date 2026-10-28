package com.quantora.backend.reflect.dto;

import com.quantora.backend.reflect.entity.InvestmentThesis;

import java.time.LocalDateTime;

public record ThesisResponse(
        Long id,
        String title,
        String symbol,
        String thesisBody,
        String invalidation,
        String points,
        LocalDateTime createdAt,
        LocalDateTime updatedAt
) {
    public static ThesisResponse from(InvestmentThesis thesis) {
        return new ThesisResponse(
                thesis.getId(),
                thesis.getTitle(),
                thesis.getSymbol(),
                thesis.getThesisBody(),
                thesis.getInvalidation(),
                thesis.getPoints(),
                thesis.getCreatedAt(),
                thesis.getUpdatedAt()
        );
    }
}
