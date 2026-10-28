package com.quantora.backend.security.ratelimit;

import com.quantora.backend.config.ApiSecurityProperties;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.core.Ordered;
import org.springframework.core.annotation.Order;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.lang.NonNull;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.nio.charset.StandardCharsets;

/**
 * Throttles the unauthenticated authentication endpoints per client IP. Runs as a plain
 * servlet filter ahead of Spring Security so that rejected requests never reach the
 * BCrypt / database code paths.
 */
@Component
@Order(Ordered.HIGHEST_PRECEDENCE + 20)
public class AuthRateLimitFilter extends OncePerRequestFilter {

    private static final Logger log = LoggerFactory.getLogger(AuthRateLimitFilter.class);
    private static final String AUTH_PATH_PREFIX = "/api/auth/";

    private final InMemoryRateLimiter rateLimiter;
    private final int authRequestsPerIp;

    public AuthRateLimitFilter(InMemoryRateLimiter rateLimiter, ApiSecurityProperties properties) {
        this.rateLimiter = rateLimiter;
        this.authRequestsPerIp = properties.rateLimit().authRequestsPerIp();
    }

    @Override
    protected boolean shouldNotFilter(@NonNull HttpServletRequest request) {
        return !"POST".equalsIgnoreCase(request.getMethod())
                || !request.getRequestURI().startsWith(AUTH_PATH_PREFIX);
    }

    @Override
    protected void doFilterInternal(
            @NonNull HttpServletRequest request,
            @NonNull HttpServletResponse response,
            @NonNull FilterChain filterChain
    ) throws ServletException, IOException {
        String clientIp = request.getRemoteAddr();
        if (!rateLimiter.tryAcquire("auth-ip:" + clientIp, authRequestsPerIp)) {
            log.warn("Rate limit exceeded for {} on {}", clientIp, request.getRequestURI());
            writeTooManyRequests(response);
            return;
        }
        filterChain.doFilter(request, response);
    }

    private void writeTooManyRequests(HttpServletResponse response) throws IOException {
        response.setStatus(HttpStatus.TOO_MANY_REQUESTS.value());
        response.setHeader("Retry-After", String.valueOf(rateLimiter.retryAfterSeconds()));
        response.setContentType(MediaType.APPLICATION_JSON_VALUE);
        response.setCharacterEncoding(StandardCharsets.UTF_8.name());
        response.getWriter().write("{\"message\":\"Too many requests. Please try again later.\"}");
    }
}
