package com.quantora.backend.auth.security;

import com.quantora.backend.config.AuthCookieProperties;
import com.quantora.backend.config.JwtProperties;
import jakarta.servlet.http.Cookie;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.http.ResponseCookie;
import org.springframework.stereotype.Service;

@Service
public class AuthCookieService {

    public static final String ACCESS_COOKIE = "quantora_access";
    public static final String REFRESH_COOKIE = "quantora_refresh";

    private final AuthCookieProperties cookieProperties;
    private final JwtProperties jwtProperties;

    public AuthCookieService(AuthCookieProperties cookieProperties, JwtProperties jwtProperties) {
        this.cookieProperties = cookieProperties;
        this.jwtProperties = jwtProperties;
    }

    public boolean isEnabled() {
        return cookieProperties.enabled();
    }

    public void writeAuthCookies(HttpServletResponse response, String accessToken, String refreshToken) {
        if (!cookieProperties.enabled()) {
            return;
        }
        response.addHeader("Set-Cookie", buildCookie(ACCESS_COOKIE, accessToken, jwtProperties.expirationMs() / 1000).toString());
        response.addHeader("Set-Cookie", buildCookie(REFRESH_COOKIE, refreshToken, jwtProperties.refreshExpirationMs() / 1000).toString());
    }

    public void clearAuthCookies(HttpServletResponse response) {
        if (!cookieProperties.enabled()) {
            return;
        }
        response.addHeader("Set-Cookie", buildCookie(ACCESS_COOKIE, "", 0).toString());
        response.addHeader("Set-Cookie", buildCookie(REFRESH_COOKIE, "", 0).toString());
    }

    private ResponseCookie buildCookie(String name, String value, long maxAgeSeconds) {
        return ResponseCookie.from(name, value)
                .httpOnly(true)
                .secure(cookieProperties.secure())
                .sameSite(cookieProperties.sameSite())
                .path("/")
                .maxAge(maxAgeSeconds)
                .build();
    }

    /** Legacy servlet cookie helper for tests that inspect raw cookies. */
    public static Cookie readCookie(jakarta.servlet.http.HttpServletRequest request, String name) {
        if (request.getCookies() == null) {
            return null;
        }
        for (Cookie cookie : request.getCookies()) {
            if (name.equals(cookie.getName())) {
                return cookie;
            }
        }
        return null;
    }
}
