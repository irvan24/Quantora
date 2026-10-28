package com.quantora.backend.security;

import com.quantora.backend.support.ApiTestSupport;
import org.junit.jupiter.api.Test;

import java.util.Map;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

class ReflectAuthorizationTest extends ApiTestSupport {

    private static Map<String, Object> thesisPayload(String title) {
        return Map.of(
                "title", title,
                "symbol", "ACME",
                "thesisBody", "Growth driven by recurring revenue.",
                "invalidation", "Margin compression for two quarters."
        );
    }

    @Test
    void usersOnlyAccessTheirOwnTheses() throws Exception {
        Session alice = register(uniqueEmail("alice-thesis"));
        Session bob = register(uniqueEmail("bob-thesis"));

        String created = mockMvc.perform(jsonPost("/api/theses", thesisPayload("Alice thesis")).with(bearer(alice.accessToken())))
                .andExpect(status().isCreated())
                .andReturn().getResponse().getContentAsString();
        Number thesisId = com.jayway.jsonpath.JsonPath.read(created, "$.id");

        mockMvc.perform(get("/api/theses").with(bearer(bob.accessToken())))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$").isEmpty());

        mockMvc.perform(get("/api/theses/" + thesisId.longValue()).with(bearer(bob.accessToken())))
                .andExpect(status().isUnauthorized());

        mockMvc.perform(jsonPut("/api/theses/" + thesisId.longValue(), thesisPayload("Hijack")).with(bearer(bob.accessToken())))
                .andExpect(status().isUnauthorized());

        mockMvc.perform(delete("/api/theses/" + thesisId.longValue()).with(bearer(bob.accessToken())))
                .andExpect(status().isUnauthorized());

        mockMvc.perform(get("/api/theses/" + thesisId.longValue()).with(bearer(alice.accessToken())))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.title").value("Alice thesis"));
    }

    @Test
    void journalEntriesAreIsolatedPerUser() throws Exception {
        Session alice = register(uniqueEmail("alice-journal"));
        Session bob = register(uniqueEmail("bob-journal"));

        String created = mockMvc.perform(jsonPost("/api/journal", Map.of("body", "Alice note")).with(bearer(alice.accessToken())))
                .andExpect(status().isCreated())
                .andReturn().getResponse().getContentAsString();
        Number entryId = com.jayway.jsonpath.JsonPath.read(created, "$.id");

        mockMvc.perform(get("/api/journal").with(bearer(bob.accessToken())))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$").isEmpty());

        mockMvc.perform(delete("/api/journal/" + entryId.longValue()).with(bearer(bob.accessToken())))
                .andExpect(status().isUnauthorized());

        mockMvc.perform(get("/api/journal").with(bearer(alice.accessToken())))
                .andExpect(jsonPath("$[0].body").value("Alice note"));
    }

    @Test
    void usersOnlyAccessReviewsOnTheirOwnThesis() throws Exception {
        Session alice = register(uniqueEmail("alice-review"));
        Session bob = register(uniqueEmail("bob-review"));

        String created = mockMvc.perform(jsonPost("/api/theses", thesisPayload("Alice thesis")).with(bearer(alice.accessToken())))
                .andExpect(status().isCreated())
                .andReturn().getResponse().getContentAsString();
        Number thesisId = com.jayway.jsonpath.JsonPath.read(created, "$.id");
        String reviewsPath = "/api/theses/" + thesisId.longValue() + "/reviews";

        mockMvc.perform(jsonPost(reviewsPath, Map.of("verdict", "STILL_VALID", "note", "Checked Q2 filing.")).with(bearer(bob.accessToken())))
                .andExpect(status().isUnauthorized());

        mockMvc.perform(get(reviewsPath).with(bearer(bob.accessToken())))
                .andExpect(status().isUnauthorized());

        mockMvc.perform(jsonPost(reviewsPath, Map.of("verdict", "STILL_VALID", "note", "Checked Q2 filing.")).with(bearer(alice.accessToken())))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.verdict").value("STILL_VALID"))
                .andExpect(jsonPath("$.note").value("Checked Q2 filing."));

        mockMvc.perform(jsonPost(reviewsPath, Map.of("verdict", "WATCHING")).with(bearer(alice.accessToken())))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.note").doesNotExist());

        mockMvc.perform(get(reviewsPath).with(bearer(alice.accessToken())))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].verdict").value("WATCHING"))
                .andExpect(jsonPath("$[1].verdict").value("STILL_VALID"));
    }

    @Test
    void reviewRequiresAVerdict() throws Exception {
        Session alice = register(uniqueEmail("alice-review-validation"));
        String created = mockMvc.perform(jsonPost("/api/theses", thesisPayload("Alice thesis")).with(bearer(alice.accessToken())))
                .andExpect(status().isCreated())
                .andReturn().getResponse().getContentAsString();
        Number thesisId = com.jayway.jsonpath.JsonPath.read(created, "$.id");

        mockMvc.perform(jsonPost("/api/theses/" + thesisId.longValue() + "/reviews", Map.of("note", "No verdict given")).with(bearer(alice.accessToken())))
                .andExpect(status().isBadRequest());
    }

    @Test
    void deletingAThesisAlsoDeletesItsReviews() throws Exception {
        Session alice = register(uniqueEmail("alice-review-delete"));
        String created = mockMvc.perform(jsonPost("/api/theses", thesisPayload("Alice thesis")).with(bearer(alice.accessToken())))
                .andExpect(status().isCreated())
                .andReturn().getResponse().getContentAsString();
        Number thesisId = com.jayway.jsonpath.JsonPath.read(created, "$.id");

        mockMvc.perform(jsonPost("/api/theses/" + thesisId.longValue() + "/reviews", Map.of("verdict", "STILL_VALID")).with(bearer(alice.accessToken())))
                .andExpect(status().isCreated());

        mockMvc.perform(delete("/api/theses/" + thesisId.longValue()).with(bearer(alice.accessToken())))
                .andExpect(status().isNoContent());
    }
}
