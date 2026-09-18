package com.quantora.backend.auth.dto;

public record AuthResponse(
        String accessToken,
        String refreshToken,
        String tokenType,
        long expiresIn,
        UserResponse user
) {

    private static final String BEARER = "Bearer";

    public static AuthResponse of(
            String accessToken,
            String refreshToken,
            long expirationMs,
            UserResponse user
    ) {
        return new AuthResponse(
                accessToken,
                refreshToken,
                BEARER,
                expirationMs / 1000,
                user
        );
    }
}
