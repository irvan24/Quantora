package com.quantora.backend.auth.dto;

import jakarta.validation.constraints.AssertTrue;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

import java.nio.charset.StandardCharsets;
import java.util.Locale;

public record RegisterRequest(

    @NotBlank(message = "First name is required")
    @Size(max = 100, message = "First name must be at most 100 characters")
    String firstName,

    @NotBlank(message = "Last name is required")
    @Size(max = 100, message = "Last name must be at most 100 characters")
    String lastName,

    @NotBlank(message = "Email is required")
    @Email(message = "Invalid email")
    @Size(max = 254, message = "Email must be at most 254 characters")
    String email,

    @NotBlank(message = "Password is required")
    @Size(min = 8, max = MAX_PASSWORD_BYTES, message = "Password must contain between 8 and 72 characters")
    String password,

    @AssertTrue(message = "You must accept the terms and conditions")
    Boolean termsAccepted
) {
    /** BCrypt only hashes the first 72 bytes; longer inputs would be silently truncated or rejected. */
    public static final int MAX_PASSWORD_BYTES = 72;

    public RegisterRequest {
        firstName = trimToNull(firstName);
        lastName = trimToNull(lastName);
        email = normalizeEmail(email);
    }

    @AssertTrue(message = "Password must be at most 72 bytes")
    public boolean isPasswordWithinBcryptLimit() {
        return password == null || password.getBytes(StandardCharsets.UTF_8).length <= MAX_PASSWORD_BYTES;
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

    private static String trimToNull(String value) {
        return value == null ? null : value.trim();
    }

    private static String normalizeEmail(String value) {
        return value == null ? null : value.trim().toLowerCase(Locale.ROOT);
    }
}
