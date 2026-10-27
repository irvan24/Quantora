package com.quantora.backend.security;

import com.quantora.backend.support.ApiTestSupport;
import org.junit.jupiter.api.Test;
import org.springframework.http.MediaType;

import java.util.Map;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

class RegistrationValidationTest extends ApiTestSupport {

    @Test
    void rejectsShortPassword() throws Exception {
        mockMvc.perform(jsonPost("/api/auth/register", registerPayload(uniqueEmail("short"), "Abcdef1")))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.message").value("Validation failed"))
                .andExpect(jsonPath("$.errors.password").exists());
    }

    @Test
    void rejectsPasswordWithoutALetterAndANumber() throws Exception {
        mockMvc.perform(jsonPost("/api/auth/register", registerPayload(uniqueEmail("letters"), "Abcdefgh")))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.errors.passwordStrongEnough").exists());

        mockMvc.perform(jsonPost("/api/auth/register", registerPayload(uniqueEmail("digits"), "12345678")))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.errors.passwordStrongEnough").exists());
    }

    @Test
    void rejectsPasswordBeyondBcryptLimit() throws Exception {
        mockMvc.perform(jsonPost("/api/auth/register", registerPayload(uniqueEmail("long"), "a".repeat(73))))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.errors.password").exists());

        // 40 two-byte characters: 40 chars but 80 bytes.
        mockMvc.perform(jsonPost("/api/auth/register", registerPayload(uniqueEmail("bytes"), "é".repeat(40))))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.errors.passwordWithinBcryptLimit").exists());
    }

    @Test
    void rejectsOversizedIdentityFields() throws Exception {
        Map<String, Object> longEmail = registerPayload("a".repeat(250) + "@quantora.test", PASSWORD);
        mockMvc.perform(jsonPost("/api/auth/register", longEmail))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.errors.email").exists());

        Map<String, Object> longName = registerPayload(uniqueEmail("name"), PASSWORD);
        longName.put("firstName", "x".repeat(101));
        mockMvc.perform(jsonPost("/api/auth/register", longName))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.errors.firstName").exists());
    }

    @Test
    void rejectsInvalidEmailAndMissingConsent() throws Exception {
        mockMvc.perform(jsonPost("/api/auth/register", registerPayload("not-an-email", PASSWORD)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.errors.email").exists());

        Map<String, Object> noConsent = registerPayload(uniqueEmail("consent"), PASSWORD);
        noConsent.put("termsAccepted", false);
        mockMvc.perform(jsonPost("/api/auth/register", noConsent))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.errors.termsAccepted").exists());
    }

    @Test
    void rejectsMalformedJson() throws Exception {
        mockMvc.perform(post("/api/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"email\": \"broken\""))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.message").value("Invalid request body"));
    }

    @Test
    void ignoresMassAssignmentOfPrivilegedFields() throws Exception {
        String email = uniqueEmail("mass");
        Map<String, Object> payload = registerPayload(email, PASSWORD);
        payload.put("id", 1);
        payload.put("role", "ADMIN");
        payload.put("onboardingCompleted", true);
        payload.put("deletedAt", null);

        String body = mockMvc.perform(jsonPost("/api/auth/register", payload))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.user.role").value("USER"))
                .andExpect(jsonPath("$.user.onboardingCompleted").value(false))
                .andReturn().getResponse().getContentAsString();

        String accessToken = com.jayway.jsonpath.JsonPath.read(body, "$.accessToken");
        mockMvc.perform(get("/api/auth/me").with(bearer(accessToken)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.role").value("USER"))
                .andExpect(jsonPath("$.onboardingCompleted").value(false));
    }

    @Test
    void rejectsOversizedRequestBodies() throws Exception {
        Map<String, Object> payload = registerPayload(uniqueEmail("huge"), PASSWORD);
        payload.put("firstName", "x".repeat(70_000));

        mockMvc.perform(jsonPost("/api/auth/register", payload))
                .andExpect(status().isPayloadTooLarge())
                .andExpect(jsonPath("$.message").value("Request body too large"));
    }
}
