package com.quantora.backend.security.ratelimit;

import com.quantora.backend.config.ApiSecurityProperties;
import org.junit.jupiter.api.Test;

import java.time.Clock;
import java.time.Duration;
import java.time.Instant;
import java.time.ZoneOffset;
import java.util.concurrent.atomic.AtomicLong;

import static org.assertj.core.api.Assertions.assertThat;

class InMemoryRateLimiterTest {

    private static ApiSecurityProperties properties(boolean enabled) {
        return new ApiSecurityProperties(65_536, new ApiSecurityProperties.RateLimit(enabled, Duration.ofMinutes(1), 3, 2));
    }

    private static Clock mutableClock(AtomicLong millis) {
        return new Clock() {
            @Override
            public ZoneOffset getZone() {
                return ZoneOffset.UTC;
            }

            @Override
            public Clock withZone(java.time.ZoneId zone) {
                return this;
            }

            @Override
            public Instant instant() {
                return Instant.ofEpochMilli(millis.get());
            }
        };
    }

    @Test
    void enforcesLimitPerKeyAndResetsAfterTheWindow() {
        AtomicLong now = new AtomicLong(0);
        InMemoryRateLimiter limiter = new InMemoryRateLimiter(properties(true), mutableClock(now));

        assertThat(limiter.tryAcquire("ip:a", 2)).isTrue();
        assertThat(limiter.tryAcquire("ip:a", 2)).isTrue();
        assertThat(limiter.tryAcquire("ip:a", 2)).isFalse();
        assertThat(limiter.tryAcquire("ip:b", 2)).isTrue();

        now.addAndGet(Duration.ofMinutes(1).toMillis());
        assertThat(limiter.tryAcquire("ip:a", 2)).isTrue();
    }

    @Test
    void canBeDisabled() {
        InMemoryRateLimiter limiter = new InMemoryRateLimiter(properties(false), Clock.systemUTC());

        for (int i = 0; i < 100; i++) {
            assertThat(limiter.tryAcquire("ip:a", 1)).isTrue();
        }
    }

    @Test
    void reportsRetryAfterInSeconds() {
        InMemoryRateLimiter limiter = new InMemoryRateLimiter(properties(true), Clock.systemUTC());
        assertThat(limiter.retryAfterSeconds()).isEqualTo(60);
    }
}
