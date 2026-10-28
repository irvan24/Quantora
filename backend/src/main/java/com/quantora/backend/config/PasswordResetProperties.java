package com.quantora.backend.config;

import org.springframework.boot.context.properties.ConfigurationProperties;

@ConfigurationProperties(prefix = "quantora.auth.password-reset")
public record PasswordResetProperties(
        long expirationMs,
        boolean exposeTokenInResponse,
        String linkBaseUrl
) {
}
