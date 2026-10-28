package com.quantora.backend.security.ratelimit;

import com.quantora.backend.config.ApiSecurityProperties;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Component;

import java.time.Clock;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.atomic.AtomicInteger;
import java.util.concurrent.atomic.AtomicLong;

/**
 * Fixed-window counter keyed by an arbitrary string (client IP, e-mail, ...).
 * <p>
 * Deliberately dependency-free and per-instance: it protects a single JVM against
 * brute force and credential stuffing. Behind several replicas, move this to the
 * reverse proxy / API gateway or a shared store (Redis) for a global limit.
 */
@Component
public class InMemoryRateLimiter {

    private static final int EVICTION_INTERVAL_MULTIPLIER = 2;

    private final ConcurrentHashMap<String, Counter> counters = new ConcurrentHashMap<>();
    private final AtomicLong lastEvictionWindow = new AtomicLong();
    private final long windowMillis;
    private final boolean enabled;
    private final Clock clock;

    @Autowired
    public InMemoryRateLimiter(ApiSecurityProperties properties) {
        this(properties, Clock.systemUTC());
    }

    InMemoryRateLimiter(ApiSecurityProperties properties, Clock clock) {
        this.windowMillis = Math.max(1, properties.rateLimit().window().toMillis());
        this.enabled = properties.rateLimit().enabled();
        this.clock = clock;
    }

    /**
     * Registers one hit for {@code key} and reports whether it is still within {@code limit}
     * for the current window.
     */
    public boolean tryAcquire(String key, int limit) {
        if (!enabled) {
            return true;
        }
        long window = clock.millis() / windowMillis;
        Counter counter = counters.compute(key, (ignored, existing) ->
                existing == null || existing.window != window ? new Counter(window) : existing
        );
        evictStaleCounters(window);
        return counter.hits.incrementAndGet() <= limit;
    }

    public long retryAfterSeconds() {
        return Math.max(1, windowMillis / 1000);
    }

    private void evictStaleCounters(long currentWindow) {
        long previous = lastEvictionWindow.get();
        if (currentWindow - previous < EVICTION_INTERVAL_MULTIPLIER
                || !lastEvictionWindow.compareAndSet(previous, currentWindow)) {
            return;
        }
        counters.entrySet().removeIf(entry -> entry.getValue().window < currentWindow);
    }

    private static final class Counter {
        private final long window;
        private final AtomicInteger hits = new AtomicInteger();

        private Counter(long window) {
            this.window = window;
        }
    }
}
