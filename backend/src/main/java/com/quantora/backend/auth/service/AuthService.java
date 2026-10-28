package com.quantora.backend.auth.service;

import com.quantora.backend.auth.dto.AuthResponse;
import com.quantora.backend.auth.dto.ForgotPasswordRequest;
import com.quantora.backend.auth.dto.ForgotPasswordResponse;
import com.quantora.backend.auth.dto.LoginRequest;
import com.quantora.backend.auth.dto.RefreshRequest;
import com.quantora.backend.auth.dto.RegisterRequest;
import com.quantora.backend.auth.dto.ResetPasswordRequest;
import com.quantora.backend.auth.dto.UserResponse;
import com.quantora.backend.auth.security.AuthCookieService;
import com.quantora.backend.config.PasswordResetProperties;
import com.quantora.backend.mail.MailClient;
import com.quantora.backend.auth.exception.EmailAlreadyExistsException;
import com.quantora.backend.auth.exception.InvalidCredentialsException;
import com.quantora.backend.auth.exception.InvalidRefreshTokenException;
import com.quantora.backend.auth.exception.TooManyRequestsException;
import com.quantora.backend.auth.exception.UnauthorizedException;
import com.quantora.backend.auth.security.JwtService;
import com.quantora.backend.auth.security.UserPrincipal;
import com.quantora.backend.config.ApiSecurityProperties;
import com.quantora.backend.config.JwtProperties;
import com.quantora.backend.security.ratelimit.InMemoryRateLimiter;
import com.quantora.backend.user.entity.Role;
import com.quantora.backend.user.entity.User;
import com.quantora.backend.user.repository.UserRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.security.crypto.password.PasswordEncoder;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;
import java.util.Optional;

@Service
public class AuthService {

    private static final Logger log = LoggerFactory.getLogger(AuthService.class);

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtService jwtService;
    private final JwtProperties jwtProperties;
    private final RefreshTokenService refreshTokenService;
    private final PasswordResetService passwordResetService;
    private final AuthCookieService authCookieService;
    private final PasswordResetProperties passwordResetProperties;
    private final InMemoryRateLimiter rateLimiter;
    private final int loginAttemptsPerEmail;
    private final MailClient mailClient;

    public AuthService(
            UserRepository userRepository,
            PasswordEncoder passwordEncoder,
            JwtService jwtService,
            JwtProperties jwtProperties,
            RefreshTokenService refreshTokenService,
            PasswordResetService passwordResetService,
            AuthCookieService authCookieService,
            PasswordResetProperties passwordResetProperties,
            InMemoryRateLimiter rateLimiter,
            ApiSecurityProperties securityProperties,
            MailClient mailClient
    ) {
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
        this.jwtService = jwtService;
        this.jwtProperties = jwtProperties;
        this.refreshTokenService = refreshTokenService;
        this.passwordResetService = passwordResetService;
        this.authCookieService = authCookieService;
        this.passwordResetProperties = passwordResetProperties;
        this.rateLimiter = rateLimiter;
        this.loginAttemptsPerEmail = securityProperties.rateLimit().loginAttemptsPerEmail();
        this.mailClient = mailClient;
    }

    @Transactional
    public AuthResponse register(RegisterRequest request, HttpServletResponse response) {
        String email = request.email();
        if (userRepository.existsByEmailIgnoreCase(email)) {
            throw new EmailAlreadyExistsException();
        }

        User user = User.builder()
                .firstName(request.firstName())
                .lastName(request.lastName())
                .email(email)
                .password(passwordEncoder.encode(request.password()))
                .role(Role.USER)
                .build();

        try {
            User savedUser = userRepository.saveAndFlush(user);
            log.info("auth.register.success userId={}", savedUser.getId());
            return issueAuthResponse(savedUser, response);
        } catch (DataIntegrityViolationException ex) {
            throw new EmailAlreadyExistsException();
        }
    }

    @Transactional
    public AuthResponse login(LoginRequest request, HttpServletResponse response) {
        String email = request.email();
        // Per-account throttle: complements the per-IP filter against distributed guessing.
        if (!rateLimiter.tryAcquire("login-email:" + email, loginAttemptsPerEmail)) {
            log.warn("auth.login.throttled email={}", maskEmail(email));
            throw new TooManyRequestsException();
        }

        User user = userRepository.findByEmailIgnoreCase(email)
                .filter(u -> u.getDeletedAt() == null)
                .orElse(null);

        if (user == null || !passwordEncoder.matches(request.password(), user.getPassword())) {
            log.warn("auth.login.failure email={}", maskEmail(email));
            throw new InvalidCredentialsException();
        }

        log.info("auth.login.success userId={}", user.getId());
        return issueAuthResponse(user, response);
    }

    @Transactional(noRollbackFor = InvalidRefreshTokenException.class)
    public AuthResponse refresh(String refreshToken, HttpServletResponse response) {
        User user = refreshTokenService.consumeRefreshToken(refreshToken);
        log.info("auth.refresh.success userId={}", user.getId());
        return issueAuthResponse(user, response);
    }

    @Transactional
    public void logout(String refreshToken, HttpServletResponse response) {
        if (refreshToken != null && !refreshToken.isBlank()) {
            refreshTokenService.revokeRefreshToken(refreshToken);
        }
        authCookieService.clearAuthCookies(response);
    }

    @Transactional
    public Optional<ForgotPasswordResponse> forgotPassword(ForgotPasswordRequest request) {
        Optional<String> token = passwordResetService.requestReset(request.email());
        if (token.isEmpty()) {
            return Optional.empty();
        }
        mailClient.sendPasswordReset(request.email(), resetUrl(token.get()));
        if (passwordResetProperties.exposeTokenInResponse()) {
            return Optional.of(new ForgotPasswordResponse(token.get()));
        }
        return Optional.empty();
    }

    private String resetUrl(String token) {
        String encoded = URLEncoder.encode(token, StandardCharsets.UTF_8);
        return passwordResetProperties.linkBaseUrl() + "/reset-password?token=" + encoded;
    }

    @Transactional
    public void resetPassword(ResetPasswordRequest request) {
        User user = passwordResetService.consumeValidToken(request.token());
        user.setPassword(passwordEncoder.encode(request.password()));
        userRepository.save(user);
        refreshTokenService.revokeAllForUser(user.getId());
        log.info("auth.password-reset.success userId={}", user.getId());
    }

    @Transactional(readOnly = true)
    public UserResponse getCurrentUser(Long userId) {
        User user = userRepository.findById(userId)
                .filter(u -> u.getDeletedAt() == null)
                .orElseThrow(UnauthorizedException::new);
        return UserResponse.from(user);
    }

    /**
     * When cookies carry the session, the tokens must stay out of the JSON body too — a
     * response field is readable by any page script, which defeats the point of HttpOnly
     * cookies (the whole reason to use them is to keep tokens out of JS reach for XSS).
     */
    private AuthResponse issueAuthResponse(User user, HttpServletResponse response) {
        UserPrincipal userPrincipal = UserPrincipal.from(user);
        String accessToken = jwtService.generateToken(userPrincipal);
        String refreshToken = refreshTokenService.createRefreshToken(user);
        authCookieService.writeAuthCookies(response, accessToken, refreshToken);
        boolean cookiesCarrySession = authCookieService.isEnabled();
        return AuthResponse.of(
                cookiesCarrySession ? null : accessToken,
                cookiesCarrySession ? null : refreshToken,
                jwtProperties.expirationMs(),
                UserResponse.from(user)
        );
    }

    /** Keeps audit logs useful without writing full e-mail addresses (PII) to disk. */
    static String maskEmail(String email) {
        int at = email.indexOf('@');
        if (at <= 0) {
            return "***";
        }
        String local = email.substring(0, at);
        String visible = local.substring(0, Math.min(2, local.length()));
        return visible + "***" + email.substring(at);
    }
}
