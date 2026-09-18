package com.quantora.backend.auth.dto;

import jakarta.validation.constraints.AssertTrue;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

import java.util.Locale;

public record RegisterRequest(

    @NotBlank(message = "First name is required")
    String firstName,

    @NotBlank(message = "Last name is required")
    String lastName,

    @NotBlank(message = "Email is required")
    @Email(message = "Invalid email")
    String email,

    @NotBlank(message = "Password is required")
    @Size(min = 8, message = "Password must contain at least 8 characters")
    String password,

    @AssertTrue(message = "You must accept the terms and conditions")
    Boolean termsAccepted
) {
    public RegisterRequest {
        firstName = trimToNull(firstName);
        lastName = trimToNull(lastName);
        email = normalizeEmail(email);
    }

    private static String trimToNull(String value) {
        return value == null ? null : value.trim();
    }

    private static String normalizeEmail(String value) {
        return value == null ? null : value.trim().toLowerCase(Locale.ROOT);
    }
}