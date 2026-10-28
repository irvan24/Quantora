package com.quantora.backend.reflect.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record JournalEntryRequest(
        @NotBlank(message = "Entry is required")
        @Size(max = 2000, message = "Entry must be at most 2000 characters")
        String body
) {
    public JournalEntryRequest {
        body = body == null ? null : body.trim();
    }
}
