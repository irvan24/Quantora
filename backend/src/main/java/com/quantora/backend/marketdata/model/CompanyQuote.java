package com.quantora.backend.marketdata.model;

import java.math.BigDecimal;
import java.time.Instant;

public record CompanyQuote(
        BigDecimal price,
        BigDecimal change,
        BigDecimal changePercent,
        BigDecimal marketCap,
        BigDecimal week52Low,
        BigDecimal week52High,
        Instant asOf
) {
}
