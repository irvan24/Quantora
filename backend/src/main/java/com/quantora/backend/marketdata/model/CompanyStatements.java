package com.quantora.backend.marketdata.model;

import java.util.List;

public record CompanyStatements(
        String symbol,
        String currency,
        StatementPeriod period,
        List<StatementLine> lines
) {
    public CompanyStatements {
        lines = lines == null ? List.of() : List.copyOf(lines);
    }

    public static CompanyStatements empty(String symbol, StatementPeriod period) {
        return new CompanyStatements(symbol, null, period, List.of());
    }
}
