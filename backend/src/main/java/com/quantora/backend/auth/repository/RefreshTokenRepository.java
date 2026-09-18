package com.quantora.backend.auth.repository;

import com.quantora.backend.auth.entity.RefreshToken;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.LocalDateTime;
import java.util.Optional;

public interface RefreshTokenRepository extends JpaRepository<RefreshToken, Long> {

    @Query("SELECT rt FROM RefreshToken rt JOIN FETCH rt.user WHERE rt.tokenHash = :tokenHash")
    Optional<RefreshToken> findByTokenHash(@Param("tokenHash") String tokenHash);

    @Modifying(clearAutomatically = true, flushAutomatically = true)
    @Query("""
            UPDATE RefreshToken rt
            SET rt.revoked = true
            WHERE rt.tokenHash = :tokenHash
              AND rt.revoked = false
              AND rt.expiresAt > :now
            """)
    int revokeIfActive(@Param("tokenHash") String tokenHash, @Param("now") LocalDateTime now);

    void deleteByUserId(Long userId);
}
