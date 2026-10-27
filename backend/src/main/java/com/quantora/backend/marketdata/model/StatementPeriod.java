package com.quantora.backend.marketdata.model;

import com.quantora.backend.instrument.exception.InvalidStatementPeriodException;

public enum StatementPeriod {
    ANNUAL,
    QUARTERLY;

    public static StatementPeriod parse(String raw) {
        if (raw == null || raw.isBlank() || "annual".equalsIgnoreCase(raw) || "year".equalsIgnoreCase(raw)) {
            return ANNUAL;
        }
        if ("quarterly".equalsIgnoreCase(raw) || "quarter".equalsIgnoreCase(raw)) {
            return QUARTERLY;
        }
        throw new InvalidStatementPeriodException();
    }

    public String providerValue() {
        return this == QUARTERLY ? "quarter" : "annual";
    }
}
