package com.quantora.backend.auth.repository;

import com.quantora.backend.auth.entity.PasswordResetToken;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.LocalDateTime;
import java.util.Optional;

public interface PasswordResetTokenRepository extends JpaRepository<PasswordResetToken, Long> {

    Optional<PasswordResetToken> findByTokenHash(String tokenHash);

    @Modifying(clearAutomatically = true, flushAutomatically = true)
    @Query("""
            UPDATE PasswordResetToken t
            SET t.used = true
            WHERE t.user.id = :userId AND t.used = false
            """)
    int invalidateActiveForUser(@Param("userId") Long userId);

    @Modifying(clearAutomatically = true, flushAutomatically = true)
    @Query("""
            DELETE FROM PasswordResetToken t
            WHERE t.expiresAt < :now OR (t.used = true AND t.createdAt < :usedBefore)
            """)
    int deleteExpiredOrUsed(@Param("now") LocalDateTime now, @Param("usedBefore") LocalDateTime usedBefore);
}
