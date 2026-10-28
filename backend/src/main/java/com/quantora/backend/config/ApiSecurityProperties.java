package com.quantora.backend.config;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.validation.annotation.Validated;

import java.time.Duration;

@ConfigurationProperties(prefix = "quantora.security")
@Validated
public record ApiSecurityProperties(
        @Positive long maxRequestBodyBytes,
        @NotNull @Valid RateLimit rateLimit
) {

    public record RateLimit(
            boolean enabled,
            @NotNull Duration window,
            @Positive int authRequestsPerIp,
            @Positive int loginAttemptsPerEmail
    ) {
    }
}
