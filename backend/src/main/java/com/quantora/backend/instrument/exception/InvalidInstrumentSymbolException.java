package com.quantora.backend.instrument.exception;

public class InvalidInstrumentSymbolException extends RuntimeException {

    public InvalidInstrumentSymbolException() {
        super("Enter a ticker like AAPL or VWCE.");
    }
}
