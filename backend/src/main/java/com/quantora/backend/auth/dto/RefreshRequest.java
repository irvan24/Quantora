package com.quantora.backend.auth.dto;

import jakarta.validation.constraints.Size;

public record RefreshRequest(

        @Size(max = 128, message = "Invalid or expired refresh token")
        String refreshToken
) {
}
