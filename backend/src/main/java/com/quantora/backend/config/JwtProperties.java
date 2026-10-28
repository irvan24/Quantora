package com.quantora.backend.config;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Positive;
import jakarta.validation.constraints.Size;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.validation.annotation.Validated;

@ConfigurationProperties(prefix = "jwt")
@Validated
public record JwtProperties(
        // HS256 requires a key of at least 256 bits; anything shorter is rejected at startup.
        @NotBlank @Size(min = 32, message = "jwt.secret must be at least 32 characters (256 bits)") String secret,
        @Positive long expirationMs,
        @Positive long refreshExpirationMs
) {
}
