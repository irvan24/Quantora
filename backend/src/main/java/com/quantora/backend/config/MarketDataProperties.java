package com.quantora.backend.config;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.validation.annotation.Validated;

import java.time.Duration;

@ConfigurationProperties(prefix = "quantora.market-data")
@Validated
public record MarketDataProperties(
        @NotBlank String provider,
        @NotNull Duration cacheTtl,
        @NotNull @Valid Fmp fmp
) {
    public record Fmp(
            @NotBlank String baseUrl,
            String apiKey
    ) {
        public boolean apiKeyConfigured() {
            return apiKey != null && !apiKey.isBlank();
        }
    }
}
