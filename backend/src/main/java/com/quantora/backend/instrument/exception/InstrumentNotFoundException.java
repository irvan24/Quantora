package com.quantora.backend.instrument.exception;

public class InstrumentNotFoundException extends RuntimeException {

    public InstrumentNotFoundException(String symbol) {
        super("We could not find a company for ticker " + symbol + ".");
    }
}
