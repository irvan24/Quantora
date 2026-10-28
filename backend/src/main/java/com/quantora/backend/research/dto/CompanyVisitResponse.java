package com.quantora.backend.research.dto;

import com.quantora.backend.research.entity.CompanyVisit;

import java.time.LocalDateTime;

public record CompanyVisitResponse(
        String symbol,
        int maxSectionRank,
        int viewCount,
        LocalDateTime firstViewedAt,
        LocalDateTime lastViewedAt
) {
    public static CompanyVisitResponse from(CompanyVisit visit) {
        return new CompanyVisitResponse(
                visit.getSymbol(),
                visit.getMaxSectionRank(),
                visit.getViewCount(),
                visit.getFirstViewedAt(),
                visit.getLastViewedAt()
        );
    }
}
