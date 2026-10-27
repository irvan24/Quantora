package com.quantora.backend.marketdata.model;

public record InstrumentMatch(
        String symbol,
        String name,
        AssetType assetType,
        String exchange,
        String currency
) {
}
