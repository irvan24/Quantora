package com.quantora.backend.reflect;

import com.quantora.backend.support.ApiTestSupport;
import org.junit.jupiter.api.Test;

import java.util.Map;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

class ThesisSummaryTest extends ApiTestSupport {

    @Test
    void aFreshThesisNeedsReviewUntilConfirmedStillValid() throws Exception {
        Session session = register(uniqueEmail("thesis-summary"));

        String body = mockMvc.perform(jsonPost("/api/theses", Map.of(
                        "title", "Apple thesis",
                        "symbol", "AAPL",
                        "thesisBody", "Durable ecosystem and pricing power."
                )).with(bearer(session.accessToken())))
                .andExpect(status().isCreated())
                .andReturn().getResponse().getContentAsString();
        Long thesisId = ((Number) com.jayway.jsonpath.JsonPath.read(body, "$.id")).longValue();

        mockMvc.perform(get("/api/theses/summary").with(bearer(session.accessToken())))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.count").value(1))
                .andExpect(jsonPath("$.needingReview").value(1));

        mockMvc.perform(jsonPost("/api/theses/" + thesisId + "/reviews", Map.of("verdict", "STILL_VALID"))
                        .with(bearer(session.accessToken())))
                .andExpect(status().isCreated());

        mockMvc.perform(get("/api/theses/summary").with(bearer(session.accessToken())))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.count").value(1))
                .andExpect(jsonPath("$.needingReview").value(0));
    }

    @Test
    void aWatchingVerdictStillCountsAsNeedingReview() throws Exception {
        Session session = register(uniqueEmail("thesis-summary-watching"));

        String body = mockMvc.perform(jsonPost("/api/theses", Map.of(
                        "title", "Nike thesis",
                        "symbol", "NKE",
                        "thesisBody", "Brand strength against promotional pressure."
                )).with(bearer(session.accessToken())))
                .andExpect(status().isCreated())
                .andReturn().getResponse().getContentAsString();
        Long thesisId = ((Number) com.jayway.jsonpath.JsonPath.read(body, "$.id")).longValue();

        mockMvc.perform(jsonPost("/api/theses/" + thesisId + "/reviews", Map.of("verdict", "WATCHING"))
                        .with(bearer(session.accessToken())))
                .andExpect(status().isCreated());

        mockMvc.perform(get("/api/theses/summary").with(bearer(session.accessToken())))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.needingReview").value(1));
    }
}
