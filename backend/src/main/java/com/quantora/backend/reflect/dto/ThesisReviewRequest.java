package com.quantora.backend.reflect.dto;

import com.quantora.backend.reflect.enums.ReviewVerdict;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

public record ThesisReviewRequest(
        @NotNull(message = "Verdict is required")
        ReviewVerdict verdict,

        @Size(max = 2000, message = "Note must be at most 2000 characters")
        String note
) {
    public ThesisReviewRequest {
        note = note == null || note.isBlank() ? null : note.trim();
    }
}
