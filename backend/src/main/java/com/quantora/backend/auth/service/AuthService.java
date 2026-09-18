package com.quantora.backend.auth.service;

import com.quantora.backend.auth.dto.AuthResponse;
import com.quantora.backend.auth.dto.LoginRequest;
import com.quantora.backend.auth.dto.RefreshRequest;
import com.quantora.backend.auth.dto.RegisterRequest;
import com.quantora.backend.auth.dto.RegisterResponse;
import com.quantora.backend.auth.dto.UserResponse;
import com.quantora.backend.auth.exception.EmailAlreadyExistsException;
import com.quantora.backend.auth.exception.InvalidCredentialsException;
import com.quantora.backend.auth.security.JwtService;
import com.quantora.backend.auth.security.UserPrincipal;
import com.quantora.backend.config.JwtProperties;
import com.quantora.backend.user.entity.Role;
import com.quantora.backend.user.entity.User;
import com.quantora.backend.user.repository.UserRepository;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class AuthService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtService jwtService;
    private final JwtProperties jwtProperties;
    private final RefreshTokenService refreshTokenService;

    public AuthService(
            UserRepository userRepository,
            PasswordEncoder passwordEncoder,
            JwtService jwtService,
            JwtProperties jwtProperties,
            RefreshTokenService refreshTokenService
    ) {
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
        this.jwtService = jwtService;
        this.jwtProperties = jwtProperties;
        this.refreshTokenService = refreshTokenService;
    }

    public RegisterResponse register(RegisterRequest request) {
        if (userRepository.existsByEmail(request.email())) {
            throw new EmailAlreadyExistsException(request.email());
        }

        User user = User.builder()
                .firstName(request.firstName())
                .lastName(request.lastName())
                .email(request.email())
                .password(passwordEncoder.encode(request.password()))
                .role(Role.USER)
                .build();

        User savedUser = userRepository.save(user);

        return new RegisterResponse(
                savedUser.getId(),
                savedUser.getFirstName(),
                savedUser.getLastName(),
                savedUser.getEmail(),
                savedUser.getRole()
        );
    }

    @Transactional
    public AuthResponse login(LoginRequest request) {
        User user = userRepository.findByEmail(request.email())
                .filter(u -> u.getDeletedAt() == null)
                .orElseThrow(InvalidCredentialsException::new);

        if (!passwordEncoder.matches(request.password(), user.getPassword())) {
            throw new InvalidCredentialsException();
        }

        return buildAuthResponse(user);
    }

    @Transactional
    public AuthResponse refresh(RefreshRequest request) {
        User user = refreshTokenService.verifyRefreshToken(request.refreshToken());

        // Rotation : l'ancien refresh token est invalidé
        refreshTokenService.revokeRefreshToken(request.refreshToken());

        return buildAuthResponse(user);
    }

    @Transactional
    public void logout(RefreshRequest request) {
        refreshTokenService.revokeRefreshToken(request.refreshToken());
    }

    private AuthResponse buildAuthResponse(User user) {
        UserPrincipal userPrincipal = UserPrincipal.from(user);
        String accessToken = jwtService.generateToken(userPrincipal);
        String refreshToken = refreshTokenService.createRefreshToken(user);

        return AuthResponse.of(
                accessToken,
                refreshToken,
                jwtProperties.expirationMs(),
                UserResponse.from(user)
        );
    }
}
