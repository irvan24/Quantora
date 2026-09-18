package com.quantora.backend.auth.dto;

import com.quantora.backend.user.entity.Role;
import com.quantora.backend.user.entity.User;

public record UserResponse(
        Long id,
        String firstName,
        String lastName,
        String email,
        Role role,
        boolean onboardingCompleted
) {

    public static UserResponse from(User user) {
        return new UserResponse(
                user.getId(),
                user.getFirstName(),
                user.getLastName(),
                user.getEmail(),
                user.getRole(),
                user.isOnboardingCompleted()
        );
    }
}
