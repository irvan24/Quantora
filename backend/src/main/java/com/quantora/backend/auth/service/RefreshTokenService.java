package com.quantora.backend.auth.service;

import com.quantora.backend.auth.entity.RefreshToken;
import com.quantora.backend.auth.exception.InvalidRefreshTokenException;
import com.quantora.backend.auth.repository.RefreshTokenRepository;
import com.quantora.backend.config.JwtProperties;
import com.quantora.backend.user.entity.User;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.time.LocalDateTime;
import java.util.HexFormat;
import java.util.UUID;

@Service
public class RefreshTokenService {

    private final RefreshTokenRepository refreshTokenRepository;
    private final JwtProperties jwtProperties;

    public RefreshTokenService(RefreshTokenRepository refreshTokenRepository, JwtProperties jwtProperties) {
        this.refreshTokenRepository = refreshTokenRepository;
        this.jwtProperties = jwtProperties;
    }

    @Transactional
    public String createRefreshToken(User user) {
        String rawToken = UUID.randomUUID().toString();

        RefreshToken refreshToken = RefreshToken.builder()
                .tokenHash(hashToken(rawToken))
                .user(user)
                .expiresAt(LocalDateTime.now().plusSeconds(jwtProperties.refreshExpirationMs() / 1000))
                .revoked(false)
                .build();

        refreshTokenRepository.save(refreshToken);
        return rawToken;
    }

    @Transactional
    public User consumeRefreshToken(String rawToken) {
        String tokenHash = hashToken(rawToken);
        RefreshToken refreshToken = refreshTokenRepository.findByTokenHash(tokenHash)
                .orElseThrow(InvalidRefreshTokenException::new);

        User user = refreshToken.getUser();
        if (refreshToken.isRevoked()
                || refreshToken.getExpiresAt().isBefore(LocalDateTime.now())
                || user.getDeletedAt() != null) {
            throw new InvalidRefreshTokenException();
        }

        int revoked = refreshTokenRepository.revokeIfActive(tokenHash, LocalDateTime.now());
        if (revoked != 1) {
            throw new InvalidRefreshTokenException();
        }

        return user;
    }

    @Transactional
    public void revokeRefreshToken(String rawToken) {
        refreshTokenRepository.revokeIfActive(hashToken(rawToken), LocalDateTime.now());
    }

    private String hashToken(String rawToken) {
        try {
            MessageDigest digest = MessageDigest.getInstance("SHA-256");
            byte[] hash = digest.digest(rawToken.getBytes(StandardCharsets.UTF_8));
            return HexFormat.of().formatHex(hash);
        } catch (NoSuchAlgorithmException ex) {
            throw new IllegalStateException("SHA-256 not available", ex);
        }
    }
}
