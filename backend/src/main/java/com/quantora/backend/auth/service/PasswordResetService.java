package com.quantora.backend.auth.service;

import com.quantora.backend.auth.entity.PasswordResetToken;
import com.quantora.backend.auth.exception.InvalidResetTokenException;
import com.quantora.backend.auth.repository.PasswordResetTokenRepository;
import com.quantora.backend.config.PasswordResetProperties;
import com.quantora.backend.user.entity.User;
import com.quantora.backend.user.repository.UserRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.time.LocalDateTime;
import java.util.HexFormat;
import java.util.Optional;
import java.util.UUID;

@Service
public class PasswordResetService {

    private final PasswordResetTokenRepository tokenRepository;
    private final UserRepository userRepository;
    private final PasswordResetProperties properties;

    public PasswordResetService(
            PasswordResetTokenRepository tokenRepository,
            UserRepository userRepository,
            PasswordResetProperties properties
    ) {
        this.tokenRepository = tokenRepository;
        this.userRepository = userRepository;
        this.properties = properties;
    }

    /**
     * Creates a reset token when the account exists. Returns the raw token only for callers that
     * will deliver it (email in production; dev fixture when explicitly enabled).
     */
    @Transactional
    public Optional<String> requestReset(String email) {
        Optional<User> user = userRepository.findByEmailIgnoreCase(email)
                .filter(u -> u.getDeletedAt() == null);
        if (user.isEmpty()) {
            return Optional.empty();
        }
        tokenRepository.invalidateActiveForUser(user.get().getId());
        String raw = UUID.randomUUID().toString();
        PasswordResetToken entity = PasswordResetToken.builder()
                .tokenHash(hash(raw))
                .user(user.get())
                .expiresAt(LocalDateTime.now().plusSeconds(properties.expirationMs() / 1000))
                .used(false)
                .build();
        tokenRepository.save(entity);
        return Optional.of(raw);
    }

    @Transactional
    public User consumeValidToken(String rawToken) {
        PasswordResetToken token = tokenRepository.findByTokenHash(hash(rawToken))
                .orElseThrow(InvalidResetTokenException::new);
        if (token.isUsed() || token.getExpiresAt().isBefore(LocalDateTime.now())) {
            throw new InvalidResetTokenException();
        }
        User user = token.getUser();
        if (user.getDeletedAt() != null) {
            throw new InvalidResetTokenException();
        }
        token.setUsed(true);
        tokenRepository.save(token);
        return user;
    }

    private static String hash(String raw) {
        try {
            MessageDigest digest = MessageDigest.getInstance("SHA-256");
            byte[] hash = digest.digest(raw.getBytes(StandardCharsets.UTF_8));
            return HexFormat.of().formatHex(hash);
        } catch (NoSuchAlgorithmException ex) {
            throw new IllegalStateException("SHA-256 not available", ex);
        }
    }

}
