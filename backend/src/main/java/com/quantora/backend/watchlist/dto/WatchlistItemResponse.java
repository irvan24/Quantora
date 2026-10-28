package com.quantora.backend.watchlist.dto;

import com.quantora.backend.watchlist.entity.WatchlistItem;

import java.time.LocalDateTime;

public record WatchlistItemResponse(
        String symbol,
        LocalDateTime addedAt
) {
    public static WatchlistItemResponse from(WatchlistItem item) {
        return new WatchlistItemResponse(item.getSymbol(), item.getCreatedAt());
    }
}
