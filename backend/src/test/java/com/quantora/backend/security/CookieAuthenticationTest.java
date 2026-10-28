package com.quantora.backend.security;

import com.quantora.backend.support.ApiTestSupport;
import jakarta.servlet.http.Cookie;
import org.junit.jupiter.api.Test;
import org.springframework.test.context.TestPropertySource;
import org.springframework.test.web.servlet.MvcResult;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

/**
 * Exercises the HttpOnly-cookie auth mode (what production actually runs,
 * {@code AUTH_COOKIES_ENABLED=true}) end to end. Every other security test authenticates via
 * the {@code Authorization: Bearer} header instead, which is the dev-only mode.
 */
@TestPropertySource(properties = "quantora.auth.cookies.enabled=true")
class CookieAuthenticationTest extends ApiTestSupport {

    @Test
    void registerWritesHttpOnlyAuthCookies() throws Exception {
        MvcResult result = mockMvc.perform(jsonPost("/api/auth/register", registerPayload(uniqueEmail("cookie-register"), PASSWORD)))
                .andExpect(status().isCreated())
                .andReturn();

        Cookie access = result.getResponse().getCookie("quantora_access");
        Cookie refresh = result.getResponse().getCookie("quantora_refresh");
        assertThat(access).isNotNull();
        assertThat(access.isHttpOnly()).isTrue();
        assertThat(refresh).isNotNull();
        assertThat(refresh.isHttpOnly()).isTrue();
    }

    @Test
    void registerResponseBodyOmitsTheTokensTheCookiesAlreadyCarry() throws Exception {
        // The whole point of HttpOnly cookies is keeping the tokens out of page JS; shipping
        // the same tokens in the JSON body would hand them right back to any script (or XSS).
        mockMvc.perform(jsonPost("/api/auth/register", registerPayload(uniqueEmail("cookie-body"), PASSWORD)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.accessToken").doesNotExist())
                .andExpect(jsonPath("$.refreshToken").doesNotExist())
                .andExpect(jsonPath("$.user.email").exists());
    }

    @Test
    void meWorksFromTheAccessCookieAloneNoBearerHeader() throws Exception {
        Cookie access = registerAndGetCookie(uniqueEmail("cookie-me"), "quantora_access");

        mockMvc.perform(get("/api/auth/me").cookie(access))
                .andExpect(status().isOk());
    }

    @Test
    void protectedRouteWithNoCookieAndNoHeaderIsUnauthorized() throws Exception {
        mockMvc.perform(get("/api/auth/me"))
                .andExpect(status().isUnauthorized());
    }

    @Test
    void refreshRotatesCookiesAndRejectsReuseOfTheOldOne() throws Exception {
        Cookie originalRefresh = registerAndGetCookie(uniqueEmail("cookie-refresh"), "quantora_refresh");

        MvcResult refreshResult = mockMvc.perform(post("/api/auth/refresh").cookie(originalRefresh))
                .andExpect(status().isOk())
                .andReturn();
        Cookie rotatedRefresh = refreshResult.getResponse().getCookie("quantora_refresh");
        assertThat(rotatedRefresh).isNotNull();
        assertThat(rotatedRefresh.getValue()).isNotEqualTo(originalRefresh.getValue());

        // Reusing the superseded refresh cookie is rejected.
        mockMvc.perform(post("/api/auth/refresh").cookie(originalRefresh))
                .andExpect(status().isUnauthorized());

        // Reuse revokes the whole family, so even the freshly rotated cookie is now dead too.
        mockMvc.perform(post("/api/auth/refresh").cookie(rotatedRefresh))
                .andExpect(status().isUnauthorized());
    }

    @Test
    void logoutClearsCookiesAndRevokesTheRefreshToken() throws Exception {
        Cookie refresh = registerAndGetCookie(uniqueEmail("cookie-logout"), "quantora_refresh");

        MvcResult logoutResult = mockMvc.perform(post("/api/auth/logout").cookie(refresh))
                .andExpect(status().isNoContent())
                .andReturn();

        Cookie clearedAccess = logoutResult.getResponse().getCookie("quantora_access");
        Cookie clearedRefresh = logoutResult.getResponse().getCookie("quantora_refresh");
        assertThat(clearedAccess.getMaxAge()).isZero();
        assertThat(clearedRefresh.getMaxAge()).isZero();

        mockMvc.perform(post("/api/auth/refresh").cookie(refresh))
                .andExpect(status().isUnauthorized());
    }

    private Cookie registerAndGetCookie(String email, String cookieName) throws Exception {
        MvcResult result = mockMvc.perform(jsonPost("/api/auth/register", registerPayload(email, PASSWORD)))
                .andExpect(status().isCreated())
                .andReturn();
        return result.getResponse().getCookie(cookieName);
    }
}
