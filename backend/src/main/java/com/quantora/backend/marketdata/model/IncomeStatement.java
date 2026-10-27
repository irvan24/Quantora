package com.quantora.backend.marketdata.model;

import java.math.BigDecimal;

public record IncomeStatement(
        BigDecimal revenue,
        BigDecimal costOfRevenue,
        BigDecimal grossProfit,
        BigDecimal researchAndDevelopment,
        BigDecimal sellingGeneralAndAdmin,
        BigDecimal operatingExpenses,
        BigDecimal operatingIncome,
        BigDecimal interestAndOther,
        BigDecimal incomeBeforeTax,
        BigDecimal incomeTax,
        BigDecimal netIncome,
        BigDecimal eps,
        BigDecimal epsDiluted,
        BigDecimal ebitda,
        BigDecimal depreciationAndAmortization,
        BigDecimal dilutedShares
) {
}
