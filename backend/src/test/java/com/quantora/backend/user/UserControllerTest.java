package com.quantora.backend.user;

import com.quantora.backend.support.ApiTestSupport;
import org.junit.jupiter.api.Test;

import java.util.Map;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

class UserControllerTest extends ApiTestSupport {

    @Test
    void updateProfileRequiresAuthentication() throws Exception {
        mockMvc.perform(put("/api/users/me").contentType("application/json").content("{}"))
                .andExpect(status().isUnauthorized());
    }

    @Test
    void updateProfileChangesTheNameReturnedByMe() throws Exception {
        Session session = register(uniqueEmail("profile-update"));

        mockMvc.perform(jsonPut("/api/users/me", Map.of("firstName", "Ada", "lastName", "Lovelace"))
                        .with(bearer(session.accessToken())))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.firstName").value("Ada"))
                .andExpect(jsonPath("$.lastName").value("Lovelace"));

        mockMvc.perform(get("/api/auth/me").with(bearer(session.accessToken())))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.firstName").value("Ada"));
    }

    @Test
    void updateProfileRejectsBlankNames() throws Exception {
        Session session = register(uniqueEmail("profile-invalid"));

        mockMvc.perform(jsonPut("/api/users/me", Map.of("firstName", "", "lastName", "Lovelace"))
                        .with(bearer(session.accessToken())))
                .andExpect(status().isBadRequest());
    }

    @Test
    void changePasswordSucceedsAndRevokesExistingSessions() throws Exception {
        Session session = register(uniqueEmail("password-change"));

        mockMvc.perform(jsonPut("/api/users/me/password", Map.of("currentPassword", PASSWORD, "newPassword", "NewPass1!"))
                        .with(bearer(session.accessToken())))
                .andExpect(status().isNoContent());

        mockMvc.perform(jsonPost("/api/auth/refresh", Map.of("refreshToken", session.refreshToken())))
                .andExpect(status().isUnauthorized());

        mockMvc.perform(jsonPost("/api/auth/login", Map.of("email", session.email(), "password", "NewPass1!")))
                .andExpect(status().isOk());
    }

    @Test
    void changePasswordRejectsTheWrongCurrentPassword() throws Exception {
        Session session = register(uniqueEmail("password-wrong"));

        mockMvc.perform(jsonPut("/api/users/me/password", Map.of("currentPassword", "WrongPass1!", "newPassword", "NewPass1!"))
                        .with(bearer(session.accessToken())))
                .andExpect(status().isUnauthorized());
    }

    @Test
    void deleteAccountRequiresThePassword() throws Exception {
        Session session = register(uniqueEmail("delete-wrong"));

        mockMvc.perform(deleteWithBody("/api/users/me", Map.of("password", "WrongPass1!"))
                        .with(bearer(session.accessToken())))
                .andExpect(status().isUnauthorized());
    }

    @Test
    void deleteAccountSoftDeletesAndLogsOutEverywhere() throws Exception {
        Session session = register(uniqueEmail("delete-ok"));

        mockMvc.perform(deleteWithBody("/api/users/me", Map.of("password", PASSWORD))
                        .with(bearer(session.accessToken())))
                .andExpect(status().isNoContent());

        mockMvc.perform(jsonPost("/api/auth/login", Map.of("email", session.email(), "password", PASSWORD)))
                .andExpect(status().isUnauthorized());
    }

    private org.springframework.test.web.servlet.request.MockHttpServletRequestBuilder deleteWithBody(String path, Object payload) {
        return delete(path).contentType("application/json").content(json(payload));
    }
}
