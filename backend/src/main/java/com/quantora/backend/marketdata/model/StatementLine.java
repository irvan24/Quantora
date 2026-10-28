package com.quantora.backend.marketdata.model;

public record StatementLine(
        String date,
        String fiscalPeriod,
        Integer fiscalYear,
        String label,
        String shortLabel,
        IncomeStatement income,
        BalanceSheet balance,
        CashFlowStatement cashFlow
) {
}
