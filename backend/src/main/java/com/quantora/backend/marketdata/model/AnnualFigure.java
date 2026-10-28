package com.quantora.backend.marketdata.model;

import java.math.BigDecimal;

public record AnnualFigure(
        int year,
        BigDecimal revenue,
        BigDecimal netIncome,
        BigDecimal freeCashFlow
) {
}
