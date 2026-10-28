package com.quantora.backend.security;

import com.quantora.backend.mail.MailClient;
import com.quantora.backend.mail.stub.StubMailClient;
import com.quantora.backend.support.ApiTestSupport;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;

import java.util.Map;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

class PasswordResetFlowTest extends ApiTestSupport {

    @Autowired
    private MailClient mailClient;

    private StubMailClient stubMailClient;

    @BeforeEach
    void resetStubMail() {
        stubMailClient = (StubMailClient) mailClient;
        stubMailClient.clear();
    }

    @Test
    void fullResetFlowSendsTheLinkChangesThePasswordAndRevokesSessions() throws Exception {
        String email = uniqueEmail("reset-flow");
        Session original = register(email);

        String response = mockMvc.perform(jsonPost("/api/auth/forgot-password", Map.of("email", email)))
                .andExpect(status().isOk())
                .andReturn().getResponse().getContentAsString();
        String token = com.jayway.jsonpath.JsonPath.read(response, "$.resetToken");

        assertThat(stubMailClient.sent()).hasSize(1);
        StubMailClient.SentMail sent = stubMailClient.sent().get(0);
        assertThat(sent.to()).isEqualTo(email);
        assertThat(sent.resetUrl())
                .startsWith("http://localhost:3001/reset-password?token=")
                .contains(token);

        mockMvc.perform(jsonPost("/api/auth/reset-password", Map.of("token", token, "password", "NewPassword1!")))
                .andExpect(status().isNoContent());

        mockMvc.perform(jsonPost("/api/auth/login", Map.of("email", email, "password", PASSWORD)))
                .andExpect(status().isUnauthorized());

        mockMvc.perform(jsonPost("/api/auth/login", Map.of("email", email, "password", "NewPassword1!")))
                .andExpect(status().isOk());

        mockMvc.perform(jsonPost("/api/auth/refresh", Map.of("refreshToken", original.refreshToken())))
                .andExpect(status().isUnauthorized());
    }

    @Test
    void resetTokenIsSingleUse() throws Exception {
        String email = uniqueEmail("reset-single-use");
        register(email);

        String response = mockMvc.perform(jsonPost("/api/auth/forgot-password", Map.of("email", email)))
                .andExpect(status().isOk())
                .andReturn().getResponse().getContentAsString();
        String token = com.jayway.jsonpath.JsonPath.read(response, "$.resetToken");

        mockMvc.perform(jsonPost("/api/auth/reset-password", Map.of("token", token, "password", "NewPassword1!")))
                .andExpect(status().isNoContent());

        mockMvc.perform(jsonPost("/api/auth/reset-password", Map.of("token", token, "password", "AnotherPassword1!")))
                .andExpect(status().isBadRequest());
    }

    @Test
    void aNewRequestInvalidatesThePreviousToken() throws Exception {
        String email = uniqueEmail("reset-superseded");
        register(email);

        String first = mockMvc.perform(jsonPost("/api/auth/forgot-password", Map.of("email", email)))
                .andExpect(status().isOk())
                .andReturn().getResponse().getContentAsString();
        String firstToken = com.jayway.jsonpath.JsonPath.read(first, "$.resetToken");

        String second = mockMvc.perform(jsonPost("/api/auth/forgot-password", Map.of("email", email)))
                .andExpect(status().isOk())
                .andReturn().getResponse().getContentAsString();
        String secondToken = com.jayway.jsonpath.JsonPath.read(second, "$.resetToken");

        assertThat(stubMailClient.sent()).hasSize(2);

        mockMvc.perform(jsonPost("/api/auth/reset-password", Map.of("token", firstToken, "password", "NewPassword1!")))
                .andExpect(status().isBadRequest());

        mockMvc.perform(jsonPost("/api/auth/reset-password", Map.of("token", secondToken, "password", "NewPassword1!")))
                .andExpect(status().isNoContent());
    }

    @Test
    void garbageOrUnknownTokenIsRejected() throws Exception {
        mockMvc.perform(jsonPost("/api/auth/reset-password", Map.of("token", "not-a-real-token", "password", "NewPassword1!")))
                .andExpect(status().isBadRequest());
    }

    @Test
    void weakOrMissingNewPasswordIsRejected() throws Exception {
        String email = uniqueEmail("reset-weak-password");
        register(email);

        String response = mockMvc.perform(jsonPost("/api/auth/forgot-password", Map.of("email", email)))
                .andExpect(status().isOk())
                .andReturn().getResponse().getContentAsString();
        String token = com.jayway.jsonpath.JsonPath.read(response, "$.resetToken");

        mockMvc.perform(jsonPost("/api/auth/reset-password", Map.of("token", token, "password", "short1")))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.errors.password").exists());
    }

    @Test
    void unknownEmailRespondsTheSameWayWithoutIssuingATokenOrSendingMail() throws Exception {
        mockMvc.perform(jsonPost("/api/auth/forgot-password", Map.of("email", uniqueEmail("ghost"))))
                .andExpect(status().isNoContent());

        assertThat(stubMailClient.sent()).isEmpty();
    }
}
