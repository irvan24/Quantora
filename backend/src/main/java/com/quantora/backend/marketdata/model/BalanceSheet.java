package com.quantora.backend.marketdata.model;

import java.math.BigDecimal;

public record BalanceSheet(
        BigDecimal cash,
        BigDecimal shortTermInvestments,
        BigDecimal cashAndInvestments,
        BigDecimal totalCurrentAssets,
        BigDecimal longTermInvestments,
        BigDecimal totalAssets,
        BigDecimal shortTermDebt,
        BigDecimal longTermDebt,
        BigDecimal totalDebt,
        BigDecimal totalCurrentLiabilities,
        BigDecimal totalLiabilities,
        BigDecimal equity
) {
}
