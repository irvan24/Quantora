package com.quantora.backend.instrument.exception;

public class InvalidStatementPeriodException extends RuntimeException {

    public InvalidStatementPeriodException() {
        super("Choose annual or quarterly filings.");
    }
}
