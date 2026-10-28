package com.quantora.backend.watchlist.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record WatchlistItemRequest(
        @NotBlank(message = "Symbol is required")
        @Size(max = 20, message = "Symbol must be at most 20 characters")
        String symbol
) {
}
