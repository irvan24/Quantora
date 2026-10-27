package com.quantora.backend.security;

import com.quantora.backend.support.ApiTestSupport;
import org.junit.jupiter.api.Test;

import java.util.Map;

import static org.assertj.core.api.Assertions.assertThat;
import static org.hamcrest.Matchers.not;
import static org.hamcrest.Matchers.containsString;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.content;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.header;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

class AuthenticationSecurityTest extends ApiTestSupport {

    @Test
    void protectedEndpointsRejectAnonymousRequests() throws Exception {
        mockMvc.perform(get("/api/onboarding"))
                .andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.message").value("Unauthorized"));

        mockMvc.perform(get("/api/instruments/AAPL"))
                .andExpect(status().isUnauthorized());

        mockMvc.perform(get("/api/auth/me"))
                .andExpect(status().isUnauthorized());

        mockMvc.perform(jsonPut("/api/onboarding", Map.of("goal", "BUILD_WEALTH")))
                .andExpect(status().isUnauthorized());
    }

    @Test
    void publicAuthEndpointsOnlyAcceptPost() throws Exception {
        mockMvc.perform(get("/api/auth/login"))
                .andExpect(status().isUnauthorized());
    }

    @Test
    void healthEndpointIsPublicAndTerse() throws Exception {
        mockMvc.perform(get("/actuator/health"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("UP"))
                .andExpect(jsonPath("$.components").doesNotExist());
    }

    @Test
    void responsesCarrySecurityHeaders() throws Exception {
        mockMvc.perform(get("/api/auth/me"))
                .andExpect(header().string("X-Content-Type-Options", "nosniff"))
                .andExpect(header().string("X-Frame-Options", "DENY"))
                .andExpect(header().string("Content-Security-Policy", "default-src 'none'; frame-ancestors 'none'"))
                .andExpect(header().string("Referrer-Policy", "no-referrer"))
                .andExpect(header().string("Cache-Control", containsString("no-store")));
    }

    @Test
    void validAccessTokenGrantsAccess() throws Exception {
        Session session = register(uniqueEmail("valid"));

        mockMvc.perform(get("/api/auth/me").with(bearer(session.accessToken())))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.email").value(session.email()))
                .andExpect(jsonPath("$.role").value("USER"));
    }

    @Test
    void rejectsTamperedToken() throws Exception {
        Session session = register(uniqueEmail("tampered"));
        String token = session.accessToken();
        char last = token.charAt(token.length() - 1);
        String tampered = token.substring(0, token.length() - 1) + (last == 'a' ? 'b' : 'a');

        mockMvc.perform(get("/api/auth/me").with(bearer(tampered)))
                .andExpect(status().isUnauthorized());
    }

    @Test
    void rejectsExpiredToken() throws Exception {
        Session session = register(uniqueEmail("expired"));
        String expired = signedToken(session.email(), accessClaims("USER"), -60_000);

        mockMvc.perform(get("/api/auth/me").with(bearer(expired)))
                .andExpect(status().isUnauthorized());
    }

    @Test
    void rejectsTokenSignedWithAnotherKey() throws Exception {
        Session session = register(uniqueEmail("forged"));
        String forged = signedToken(
                "attacker-controlled-key-that-is-long-enough-0123456789",
                session.email(),
                accessClaims("ADMIN"),
                60_000
        );

        mockMvc.perform(get("/api/auth/me").with(bearer(forged)))
                .andExpect(status().isUnauthorized());
    }

    @Test
    void rejectsTokenWithoutAccessType() throws Exception {
        Session session = register(uniqueEmail("type"));
        Map<String, Object> claims = accessClaims("USER");
        claims.put("type", "refresh");

        mockMvc.perform(get("/api/auth/me").with(bearer(signedToken(session.email(), claims, 60_000))))
                .andExpect(status().isUnauthorized());
    }

    @Test
    void rejectsTokenForUnknownUser() throws Exception {
        String ghost = signedToken(uniqueEmail("ghost"), accessClaims("USER"), 60_000);

        mockMvc.perform(get("/api/auth/me").with(bearer(ghost)))
                .andExpect(status().isUnauthorized());
    }

    @Test
    void roleClaimInTokenIsNotTrusted() throws Exception {
        Session session = register(uniqueEmail("escalate"));
        String elevated = signedToken(session.email(), accessClaims("ADMIN"), 60_000);

        mockMvc.perform(get("/api/auth/me").with(bearer(elevated)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.role").value("USER"));
    }

    @Test
    void malformedAuthorizationHeaderIsTreatedAsAnonymous() throws Exception {
        mockMvc.perform(get("/api/auth/me").header("Authorization", "Bearer not-a-jwt"))
                .andExpect(status().isUnauthorized());
        mockMvc.perform(get("/api/auth/me").header("Authorization", "Basic dXNlcjpwYXNz"))
                .andExpect(status().isUnauthorized());
    }

    @Test
    void duplicateRegistrationDoesNotEchoTheEmail() throws Exception {
        String email = uniqueEmail("duplicate");
        register(email);

        mockMvc.perform(jsonPost("/api/auth/register", registerPayload(email.toUpperCase(), PASSWORD)))
                .andExpect(status().isConflict())
                .andExpect(jsonPath("$.message").value("Email already in use"))
                .andExpect(content().string(not(containsString(email))));
    }

    @Test
    void loginFailuresAreIndistinguishable() throws Exception {
        Session session = register(uniqueEmail("login"));

        String wrongPassword = mockMvc.perform(jsonPost("/api/auth/login",
                        Map.of("email", session.email(), "password", "wrong-password-1")))
                .andExpect(status().isUnauthorized())
                .andReturn().getResponse().getContentAsString();

        String unknownUser = mockMvc.perform(jsonPost("/api/auth/login",
                        Map.of("email", uniqueEmail("nobody"), "password", PASSWORD)))
                .andExpect(status().isUnauthorized())
                .andReturn().getResponse().getContentAsString();

        assertThat(wrongPassword).isEqualTo(unknownUser);
        assertThat(wrongPassword).contains("Invalid email or password");
    }

    @Test
    void refreshTokensRotateAndRejectReuse() throws Exception {
        Session session = register(uniqueEmail("rotate"));

        String rotated = mockMvc.perform(jsonPost("/api/auth/refresh", Map.of("refreshToken", session.refreshToken())))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.refreshToken").isNotEmpty())
                .andReturn().getResponse().getContentAsString();

        String newRefreshToken = com.jayway.jsonpath.JsonPath.read(rotated, "$.refreshToken");
        assertThat(newRefreshToken).isNotEqualTo(session.refreshToken());

        mockMvc.perform(jsonPost("/api/auth/refresh", Map.of("refreshToken", newRefreshToken)))
                .andExpect(status().isOk());

        mockMvc.perform(jsonPost("/api/auth/refresh", Map.of("refreshToken", session.refreshToken())))
                .andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.message").value("Invalid or expired refresh token"));
    }

    @Test
    void refreshTokenReuseRevokesTheWholeFamily() throws Exception {
        Session session = register(uniqueEmail("reuse"));

        String rotated = mockMvc.perform(jsonPost("/api/auth/refresh", Map.of("refreshToken", session.refreshToken())))
                .andExpect(status().isOk())
                .andReturn().getResponse().getContentAsString();
        String newRefreshToken = com.jayway.jsonpath.JsonPath.read(rotated, "$.refreshToken");

        mockMvc.perform(jsonPost("/api/auth/refresh", Map.of("refreshToken", session.refreshToken())))
                .andExpect(status().isUnauthorized());

        mockMvc.perform(jsonPost("/api/auth/refresh", Map.of("refreshToken", newRefreshToken)))
                .andExpect(status().isUnauthorized());
    }

    @Test
    void logoutRevokesTheRefreshToken() throws Exception {
        Session session = register(uniqueEmail("logout"));

        mockMvc.perform(jsonPost("/api/auth/logout", Map.of("refreshToken", session.refreshToken())))
                .andExpect(status().isNoContent());

        mockMvc.perform(jsonPost("/api/auth/refresh", Map.of("refreshToken", session.refreshToken())))
                .andExpect(status().isUnauthorized());
    }

    @Test
    void refreshWithGarbageTokenIsRejected() throws Exception {
        mockMvc.perform(jsonPost("/api/auth/refresh", Map.of("refreshToken", "' OR 1=1 --")))
                .andExpect(status().isUnauthorized());
        mockMvc.perform(jsonPost("/api/auth/refresh", Map.of("refreshToken", "x".repeat(129))))
                .andExpect(status().isBadRequest());
    }

    @Test
    void unknownRoutesReturnStructuredErrors() throws Exception {
        Session session = register(uniqueEmail("routes"));

        mockMvc.perform(get("/api/does-not-exist").with(bearer(session.accessToken())))
                .andExpect(status().isNotFound())
                .andExpect(jsonPath("$.message").value("Not Found"));

        mockMvc.perform(get("/api/does-not-exist"))
                .andExpect(status().isUnauthorized());
    }
}
