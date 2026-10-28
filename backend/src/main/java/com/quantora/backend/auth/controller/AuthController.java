package com.quantora.backend.auth.controller;

import com.quantora.backend.auth.dto.AuthResponse;
import com.quantora.backend.auth.dto.ForgotPasswordRequest;
import com.quantora.backend.auth.dto.ForgotPasswordResponse;
import com.quantora.backend.auth.dto.LoginRequest;
import com.quantora.backend.auth.dto.RefreshRequest;
import com.quantora.backend.auth.dto.RegisterRequest;
import com.quantora.backend.auth.dto.ResetPasswordRequest;
import com.quantora.backend.auth.dto.UserResponse;
import com.quantora.backend.auth.exception.UnauthorizedException;
import com.quantora.backend.auth.security.AuthCookieService;
import com.quantora.backend.auth.security.UserPrincipal;
import com.quantora.backend.auth.service.AuthService;
import jakarta.servlet.http.Cookie;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/auth")
public class AuthController {

    private final AuthService authService;

    public AuthController(AuthService authService) {
        this.authService = authService;
    }

    @PostMapping("/register")
    @ResponseStatus(HttpStatus.CREATED)
    public AuthResponse register(
            @Valid @RequestBody RegisterRequest request,
            HttpServletResponse response
    ) {
        return authService.register(request, response);
    }

    @PostMapping("/login")
    public AuthResponse login(
            @Valid @RequestBody LoginRequest request,
            HttpServletResponse response
    ) {
        return authService.login(request, response);
    }

    @PostMapping("/refresh")
    public AuthResponse refresh(
            @Valid @RequestBody(required = false) RefreshRequest request,
            HttpServletRequest httpRequest,
            HttpServletResponse response
    ) {
        String refreshToken = resolveRefreshToken(request, httpRequest);
        return authService.refresh(refreshToken, response);
    }

    @PostMapping("/logout")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void logout(
            @Valid @RequestBody(required = false) RefreshRequest request,
            HttpServletRequest httpRequest,
            HttpServletResponse response
    ) {
        authService.logout(resolveRefreshToken(request, httpRequest), response);
    }

    @PostMapping("/forgot-password")
    public ResponseEntity<?> forgotPassword(@Valid @RequestBody ForgotPasswordRequest request) {
        return authService.forgotPassword(request)
                .map(body -> ResponseEntity.ok(body))
                .orElseGet(() -> ResponseEntity.noContent().build());
    }

    @PostMapping("/reset-password")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void resetPassword(@Valid @RequestBody ResetPasswordRequest request) {
        authService.resetPassword(request);
    }

    @GetMapping("/me")
    public UserResponse me(@AuthenticationPrincipal UserPrincipal principal) {
        if (principal == null) {
            throw new UnauthorizedException();
        }
        return authService.getCurrentUser(principal.getId());
    }

    private static String resolveRefreshToken(RefreshRequest request, HttpServletRequest httpRequest) {
        if (request != null && request.refreshToken() != null && !request.refreshToken().isBlank()) {
            return request.refreshToken();
        }
        Cookie cookie = AuthCookieService.readCookie(httpRequest, AuthCookieService.REFRESH_COOKIE);
        if (cookie != null && cookie.getValue() != null && !cookie.getValue().isBlank()) {
            return cookie.getValue();
        }
        throw new UnauthorizedException();
    }
}
