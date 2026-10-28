package com.quantora.backend.research;

import com.quantora.backend.support.ApiTestSupport;
import org.junit.jupiter.api.Test;

import java.util.Map;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

class CompanyVisitControllerTest extends ApiTestSupport {

    @Test
    void listRequiresAuthentication() throws Exception {
        mockMvc.perform(get("/api/research/visits"))
                .andExpect(status().isUnauthorized());
    }

    @Test
    void firstVisitIsRecordedWithTheVisitedSection() throws Exception {
        Session session = register(uniqueEmail("visit-first"));

        mockMvc.perform(jsonPost("/api/research/visits", Map.of("symbol", "aapl", "section", "FINANCIALS"))
                        .with(bearer(session.accessToken())))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.symbol").value("AAPL"))
                .andExpect(jsonPath("$.maxSectionRank").value(1))
                .andExpect(jsonPath("$.viewCount").value(1));

        mockMvc.perform(get("/api/research/visits").with(bearer(session.accessToken())))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.length()").value(1))
                .andExpect(jsonPath("$[0].symbol").value("AAPL"));
    }

    @Test
    void laterVisitKeepsTheFurthestSectionReached() throws Exception {
        Session session = register(uniqueEmail("visit-progress"));

        mockMvc.perform(jsonPost("/api/research/visits", Map.of("symbol", "AAPL", "section", "VALUATION"))
                        .with(bearer(session.accessToken())))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.maxSectionRank").value(2));

        mockMvc.perform(jsonPost("/api/research/visits", Map.of("symbol", "AAPL", "section", "OVERVIEW"))
                        .with(bearer(session.accessToken())))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.maxSectionRank").value(2))
                .andExpect(jsonPath("$.viewCount").value(2));
    }

    @Test
    void invalidSymbolIsRejected() throws Exception {
        Session session = register(uniqueEmail("visit-invalid"));

        mockMvc.perform(jsonPost("/api/research/visits", Map.of("symbol", "way-too-long-a-ticker", "section", "OVERVIEW"))
                        .with(bearer(session.accessToken())))
                .andExpect(status().isBadRequest());
    }
}
