package com.quantora.backend.config;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.validation.annotation.Validated;

@ConfigurationProperties(prefix = "quantora.mail")
@Validated
public record MailProperties(
        @NotBlank String provider,
        @NotNull @Valid Resend resend
) {
    public record Resend(
            @NotBlank String baseUrl,
            String apiKey,
            @NotBlank String fromEmail
    ) {
        public boolean apiKeyConfigured() {
            return apiKey != null && !apiKey.isBlank();
        }
    }
}
