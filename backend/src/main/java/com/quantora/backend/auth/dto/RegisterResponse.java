package com.quantora.backend.auth.dto;

import com.quantora.backend.user.entity.Role;

public record RegisterResponse(
        Long id,
        String firstName,
        String lastName,
        String email,
        Role role
) {
}
