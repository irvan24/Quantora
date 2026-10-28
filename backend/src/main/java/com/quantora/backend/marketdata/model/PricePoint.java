package com.quantora.backend.marketdata.model;

import java.math.BigDecimal;
import java.time.LocalDate;

public record PricePoint(LocalDate date, BigDecimal close) {
}
