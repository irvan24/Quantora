package com.quantora.backend.auth.service;

import com.quantora.backend.auth.repository.RefreshTokenRepository;
import com.quantora.backend.config.JwtProperties;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;

/**
 * Keeps the refresh_tokens table bounded. Every login/refresh inserts a row and nothing
 * removed them before; an attacker hammering /register or /refresh could grow the table
 * indefinitely. Revoked rows are kept for one refresh lifetime so reuse attempts still
 * fail loudly instead of silently "not found".
 */
@Component
public class RefreshTokenCleanupJob {

    private static final Logger log = LoggerFactory.getLogger(RefreshTokenCleanupJob.class);

    private final RefreshTokenRepository refreshTokenRepository;
    private final JwtProperties jwtProperties;

    public RefreshTokenCleanupJob(RefreshTokenRepository refreshTokenRepository, JwtProperties jwtProperties) {
        this.refreshTokenRepository = refreshTokenRepository;
        this.jwtProperties = jwtProperties;
    }

    @Scheduled(cron = "${quantora.security.refresh-token-cleanup-cron:0 0 3 * * *}")
    @Transactional
    public void purge() {
        LocalDateTime now = LocalDateTime.now();
        LocalDateTime revokedBefore = now.minusSeconds(jwtProperties.refreshExpirationMs() / 1000);
        int deleted = refreshTokenRepository.deleteExpiredOrRevoked(now, revokedBefore);
        if (deleted > 0) {
            log.info("Purged {} expired or revoked refresh tokens", deleted);
        }
    }
}
