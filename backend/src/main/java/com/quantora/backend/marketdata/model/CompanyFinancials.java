package com.quantora.backend.marketdata.model;

import java.math.BigDecimal;

public record CompanyFinancials(
        String period,
        String asOf,
        BigDecimal revenue,
        BigDecimal netIncome,
        BigDecimal eps,
        BigDecimal peRatio,
        BigDecimal forwardPe,
        BigDecimal profitMargin,
        BigDecimal grossMargin,
        BigDecimal operatingMargin,
        BigDecimal roe,
        BigDecimal debtToEquity,
        BigDecimal dividendYieldPercent,
        BigDecimal freeCashFlow,
        BigDecimal revenueGrowth,
        BigDecimal epsGrowth,
        BigDecimal cashAndInvestments,
        BigDecimal totalDebt,
        BigDecimal currentRatio
) {
}
