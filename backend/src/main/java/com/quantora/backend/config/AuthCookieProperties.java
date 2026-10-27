package com.quantora.backend.config;

import org.springframework.boot.context.properties.ConfigurationProperties;

@ConfigurationProperties(prefix = "quantora.auth.cookies")
public record AuthCookieProperties(
        boolean enabled,
        boolean secure,
        String sameSite
) {
    public AuthCookieProperties {
        if (sameSite == null || sameSite.isBlank()) {
            sameSite = "Lax";
        }
    }
}
