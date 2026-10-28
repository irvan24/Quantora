package com.quantora.backend.marketdata.model;

import java.math.BigDecimal;

public record CashFlowStatement(
        BigDecimal operatingCashFlow,
        BigDecimal depreciationAndAmortization,
        BigDecimal stockBasedCompensation,
        BigDecimal capex,
        BigDecimal freeCashFlow,
        BigDecimal dividendsPaid,
        BigDecimal shareRepurchases,
        BigDecimal investingCashFlow,
        BigDecimal financingCashFlow,
        BigDecimal netChangeInCash
) {
}
