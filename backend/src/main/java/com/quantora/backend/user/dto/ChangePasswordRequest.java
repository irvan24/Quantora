package com.quantora.backend.user.dto;

import com.quantora.backend.auth.dto.RegisterRequest;
import jakarta.validation.constraints.AssertTrue;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

import java.nio.charset.StandardCharsets;

public record ChangePasswordRequest(
        @NotBlank(message = "Current password is required")
        String currentPassword,

        @NotBlank(message = "New password is required")
        @Size(min = 8, max = RegisterRequest.MAX_PASSWORD_BYTES, message = "Password must contain between 8 and 72 characters")
        String newPassword
) {
    @AssertTrue(message = "Password must be at most 72 bytes")
    public boolean isNewPasswordWithinBcryptLimit() {
        return newPassword == null || newPassword.getBytes(StandardCharsets.UTF_8).length <= RegisterRequest.MAX_PASSWORD_BYTES;
    }

    @AssertTrue(message = "Password must contain at least one letter and one number")
    public boolean isNewPasswordStrongEnough() {
        if (newPassword == null || newPassword.isBlank()) {
            return true;
        }
        boolean letter = newPassword.chars().anyMatch(Character::isLetter);
        boolean digit = newPassword.chars().anyMatch(Character::isDigit);
        return letter && digit;
    }
}
