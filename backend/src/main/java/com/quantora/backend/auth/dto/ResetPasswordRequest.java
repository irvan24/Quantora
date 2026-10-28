package com.quantora.backend.auth.dto;

import jakarta.validation.constraints.AssertTrue;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

import java.nio.charset.StandardCharsets;

public record ResetPasswordRequest(
        @NotBlank(message = "Reset token is required")
        @Size(max = 128, message = "Invalid reset token")
        String token,

        @NotBlank(message = "Password is required")
        @Size(min = 8, max = RegisterRequest.MAX_PASSWORD_BYTES, message = "Password must contain between 8 and 72 characters")
        String password
) {
    @AssertTrue(message = "Password must be at most 72 bytes")
    public boolean isPasswordWithinBcryptLimit() {
        return password == null || password.getBytes(StandardCharsets.UTF_8).length <= RegisterRequest.MAX_PASSWORD_BYTES;
    }

    @AssertTrue(message = "Password must contain at least one letter and one number")
    public boolean isPasswordStrongEnough() {
        if (password == null || password.isBlank()) {
            return true;
        }
        boolean letter = password.chars().anyMatch(Character::isLetter);
        boolean digit = password.chars().anyMatch(Character::isDigit);
        return letter && digit;
    }
}
