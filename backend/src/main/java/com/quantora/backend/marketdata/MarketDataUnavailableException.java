package com.quantora.backend.marketdata;

public class MarketDataUnavailableException extends RuntimeException {

    public MarketDataUnavailableException() {
        super("Company data is temporarily unavailable. Try again shortly.");
    }

    public MarketDataUnavailableException(Throwable cause) {
        super("Company data is temporarily unavailable. Try again shortly.", cause);
    }
}
