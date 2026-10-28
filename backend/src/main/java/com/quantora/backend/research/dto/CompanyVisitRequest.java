package com.quantora.backend.research.dto;

import com.quantora.backend.research.enums.ResearchSection;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

public record CompanyVisitRequest(
        @NotBlank(message = "Symbol is required")
        @Size(max = 20, message = "Symbol must be at most 20 characters")
        String symbol,

        @NotNull(message = "Section is required")
        ResearchSection section
) {
}
