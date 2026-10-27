package com.quantora.backend.reflect.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record ThesisRequest(
        @NotBlank(message = "Title is required")
        @Size(max = 120, message = "Title must be at most 120 characters")
        String title,

        @Size(max = 20, message = "Symbol must be at most 20 characters")
        String symbol,

        @NotBlank(message = "Thesis is required")
        @Size(max = 4000, message = "Thesis must be at most 4000 characters")
        String thesisBody,

        @Size(max = 2000, message = "Invalidation must be at most 2000 characters")
        String invalidation,

        @Size(max = 8000, message = "Thesis points must be at most 8000 characters")
        String points
) {
    public ThesisRequest {
        title = title == null ? null : title.trim();
        symbol = symbol == null || symbol.isBlank() ? null : symbol.trim().toUpperCase();
        thesisBody = thesisBody == null ? null : thesisBody.trim();
        invalidation = invalidation == null || invalidation.isBlank() ? null : invalidation.trim();
        points = points == null || points.isBlank() ? null : points.trim();
    }
}
