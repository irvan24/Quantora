package com.quantora.backend.config;

import org.springframework.core.env.Environment;
import org.springframework.core.env.Profiles;
import org.springframework.stereotype.Component;

/**
 * Fails fast at startup when the application is about to run with development-only
 * security settings outside of the dev/test profiles.
 */
@Component
public class SecurityConfigurationValidator {

    static final String DEV_JWT_SECRET = "quantora-dev-secret-key-change-in-production-min-32-chars";
    private static final Profiles RELAXED_PROFILES = Profiles.of("dev", "test");

    public SecurityConfigurationValidator(
            JwtProperties jwtProperties,
            CorsProperties corsProperties,
            Environment environment
    ) {
        validate(jwtProperties, corsProperties, environment);
    }

    static void validate(JwtProperties jwtProperties, CorsProperties corsProperties, Environment environment) {
        if (environment.acceptsProfiles(RELAXED_PROFILES)) {
            return;
        }
        if (DEV_JWT_SECRET.equals(jwtProperties.secret())) {
            throw new IllegalStateException(
                    "The development JWT secret cannot be used outside the dev profile. "
                            + "Set the JWT_SECRET environment variable to a random value of at least 32 characters."
            );
        }
        for (String origin : corsProperties.allowedOriginPatterns()) {
            if (isUnsafeProductionOrigin(origin)) {
                throw new IllegalStateException(
                        "CORS origin '" + origin + "' is not allowed outside the dev profile. "
                                + "Set CORS_ALLOWED_ORIGINS to exact https origins."
                );
            }
        }
    }

    static boolean isUnsafeProductionOrigin(String origin) {
        if (origin == null || origin.isBlank()) {
            return true;
        }
        String value = origin.trim();
        return "*".equals(value)
                || value.startsWith("*.")
                || value.startsWith("http://");
    }
}
