package com.quantora.backend.marketdata.model;

import java.util.List;

public record CompanyProfile(
        String symbol,
        String name,
        AssetType assetType,
        String exchange,
        String currency,
        String country,
        String sector,
        String industry,
        String website,
        String logoUrl,
        String summary,
        Integer employees,
        String ceo,
        String ipoDate,
        CompanyQuote quote,
        CompanyFinancials financials,
        List<AnnualFigure> annuals
) {
    public CompanyProfile {
        annuals = annuals == null ? List.of() : List.copyOf(annuals);
    }
}
