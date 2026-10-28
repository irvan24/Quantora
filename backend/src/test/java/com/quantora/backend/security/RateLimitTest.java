package com.quantora.backend.security;

import com.quantora.backend.support.ApiTestSupport;
import org.junit.jupiter.api.Test;
import org.springframework.test.context.TestPropertySource;

import java.util.Map;

import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.header;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@TestPropertySource(properties = {
        "quantora.security.rate-limit.auth-requests-per-ip=3",
        "quantora.security.rate-limit.login-attempts-per-email=2"
})
class RateLimitTest extends ApiTestSupport {

    private static Map<String, String> guess(String email) {
        return Map.of("email", email, "password", "wrong-password");
    }

    @Test
    void blocksBurstsFromTheSameIp() throws Exception {
        // Credential stuffing: one client, many different accounts.
        for (int i = 0; i < 3; i++) {
            mockMvc.perform(jsonPost("/api/auth/login", guess(uniqueEmail("burst"))).with(fromIp("10.0.0.1")))
                    .andExpect(status().isUnauthorized());
        }

        mockMvc.perform(jsonPost("/api/auth/login", guess(uniqueEmail("burst"))).with(fromIp("10.0.0.1")))
                .andExpect(status().isTooManyRequests())
                .andExpect(header().exists("Retry-After"))
                .andExpect(jsonPath("$.message").value("Too many requests. Please try again later."));

        // The limit is per client, other users are unaffected.
        mockMvc.perform(jsonPost("/api/auth/login", guess(uniqueEmail("burst"))).with(fromIp("10.0.0.2")))
                .andExpect(status().isUnauthorized());
    }

    @Test
    void throttlesRepeatedLoginsForOneAccountAcrossIps() throws Exception {
        Session victim = register(uniqueEmail("victim"));
        Map<String, String> attempt = guess(victim.email());

        mockMvc.perform(jsonPost("/api/auth/login", attempt).with(fromIp("192.0.2.1")))
                .andExpect(status().isUnauthorized());
        mockMvc.perform(jsonPost("/api/auth/login", attempt).with(fromIp("192.0.2.2")))
                .andExpect(status().isUnauthorized());

        mockMvc.perform(jsonPost("/api/auth/login", attempt).with(fromIp("192.0.2.3")))
                .andExpect(status().isTooManyRequests());
    }

    @Test
    void registrationIsRateLimitedToo() throws Exception {
        for (int i = 0; i < 3; i++) {
            mockMvc.perform(jsonPost("/api/auth/register", registerPayload(uniqueEmail("spam"), PASSWORD))
                            .with(fromIp("203.0.113.9")))
                    .andExpect(status().isCreated());
        }

        mockMvc.perform(jsonPost("/api/auth/register", registerPayload(uniqueEmail("spam"), PASSWORD))
                        .with(fromIp("203.0.113.9")))
                .andExpect(status().isTooManyRequests());
    }
}
