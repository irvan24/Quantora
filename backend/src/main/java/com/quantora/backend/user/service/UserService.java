package com.quantora.backend.user.service;

import com.quantora.backend.auth.dto.UserResponse;
import com.quantora.backend.auth.exception.UnauthorizedException;
import com.quantora.backend.auth.security.AuthCookieService;
import com.quantora.backend.auth.service.RefreshTokenService;
import com.quantora.backend.user.dto.ChangePasswordRequest;
import com.quantora.backend.user.dto.DeleteAccountRequest;
import com.quantora.backend.user.dto.UpdateProfileRequest;
import com.quantora.backend.user.entity.User;
import com.quantora.backend.user.exception.InvalidCurrentPasswordException;
import com.quantora.backend.user.repository.UserRepository;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;

@Service
public class UserService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final RefreshTokenService refreshTokenService;
    private final AuthCookieService authCookieService;

    public UserService(
            UserRepository userRepository,
            PasswordEncoder passwordEncoder,
            RefreshTokenService refreshTokenService,
            AuthCookieService authCookieService
    ) {
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
        this.refreshTokenService = refreshTokenService;
        this.authCookieService = authCookieService;
    }

    @Transactional
    public UserResponse updateProfile(Long userId, UpdateProfileRequest request) {
        User user = requireActiveUser(userId);
        user.setFirstName(request.firstName());
        user.setLastName(request.lastName());
        return UserResponse.from(userRepository.save(user));
    }

    /**
     * Revokes every refresh token for the account, the same as the email reset flow: a
     * changed password should not leave old sessions silently valid.
     */
    @Transactional
    public void changePassword(Long userId, ChangePasswordRequest request) {
        User user = requireActiveUser(userId);
        if (!passwordEncoder.matches(request.currentPassword(), user.getPassword())) {
            throw new InvalidCurrentPasswordException();
        }
        user.setPassword(passwordEncoder.encode(request.newPassword()));
        userRepository.save(user);
        refreshTokenService.revokeAllForUser(userId);
    }

    @Transactional
    public void deleteAccount(Long userId, DeleteAccountRequest request, HttpServletResponse response) {
        User user = requireActiveUser(userId);
        if (!passwordEncoder.matches(request.password(), user.getPassword())) {
            throw new InvalidCurrentPasswordException();
        }
        user.setDeletedAt(LocalDateTime.now());
        userRepository.save(user);
        refreshTokenService.revokeAllForUser(userId);
        authCookieService.clearAuthCookies(response);
    }

    private User requireActiveUser(Long userId) {
        return userRepository.findById(userId)
                .filter(user -> user.getDeletedAt() == null)
                .orElseThrow(UnauthorizedException::new);
    }
}
