package com.quantora.backend.reflect.dto;

import com.quantora.backend.reflect.entity.JournalEntry;

import java.time.LocalDateTime;

public record JournalEntryResponse(Long id, String body, LocalDateTime createdAt) {

    public static JournalEntryResponse from(JournalEntry entry) {
        return new JournalEntryResponse(entry.getId(), entry.getBody(), entry.getCreatedAt());
    }
}
