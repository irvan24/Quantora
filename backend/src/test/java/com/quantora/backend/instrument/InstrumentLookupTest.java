package com.quantora.backend.instrument;

import com.quantora.backend.support.ApiTestSupport;
import org.junit.jupiter.api.Test;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

class InstrumentLookupTest extends ApiTestSupport {

    @Test
    void companyLookupRequiresAuthentication() throws Exception {
        mockMvc.perform(get("/api/instruments/AAPL"))
                .andExpect(status().isUnauthorized());
    }

    @Test
    void knownSymbolReturnsVendorAgnosticProfile() throws Exception {
        Session session = register(uniqueEmail("instrument-known"));

        mockMvc.perform(get("/api/instruments/aapl").with(bearer(session.accessToken())))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.symbol").value("AAPL"))
                .andExpect(jsonPath("$.name").value("Apple Inc."))
                .andExpect(jsonPath("$.assetType").value("STOCK"))
                .andExpect(jsonPath("$.sector").value("Technology"))
                .andExpect(jsonPath("$.summary").isNotEmpty())
                .andExpect(jsonPath("$.quote.price").value(189.50))
                .andExpect(jsonPath("$.financials.revenue").value(391035000000L))
                .andExpect(jsonPath("$.financials.peRatio").value(31.2));
    }

    @Test
    void unknownSymbolReturnsNotFound() throws Exception {
        Session session = register(uniqueEmail("instrument-missing"));

        mockMvc.perform(get("/api/instruments/ZZNOPE").with(bearer(session.accessToken())))
                .andExpect(status().isNotFound())
                .andExpect(jsonPath("$.message").value("We could not find a company for ticker ZZNOPE."));
    }

    @Test
    void invalidSymbolReturnsBadRequest() throws Exception {
        Session session = register(uniqueEmail("instrument-invalid"));

        mockMvc.perform(get("/api/instruments/{symbol}", "TOOLONGSYMBOL").with(bearer(session.accessToken())))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.message").value("Enter a ticker like AAPL or VWCE."));
    }

    @Test
    void searchRequiresAuthentication() throws Exception {
        mockMvc.perform(get("/api/instruments").param("q", "Apple"))
                .andExpect(status().isUnauthorized());
    }

    @Test
    void searchByNameReturnsMatches() throws Exception {
        Session session = register(uniqueEmail("instrument-search-name"));

        mockMvc.perform(get("/api/instruments").param("q", "Apple").with(bearer(session.accessToken())))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].symbol").value("AAPL"))
                .andExpect(jsonPath("$[0].name").value("Apple Inc."))
                .andExpect(jsonPath("$[0].exchange").value("NASDAQ"));
    }

    @Test
    void searchByTickerReturnsMatches() throws Exception {
        Session session = register(uniqueEmail("instrument-search-ticker"));

        mockMvc.perform(get("/api/instruments").param("q", "aap").with(bearer(session.accessToken())))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].symbol").value("AAPL"));
    }

    @Test
    void annualStatementsReturnFiledLines() throws Exception {
        Session session = register(uniqueEmail("instrument-statements"));

        mockMvc.perform(get("/api/instruments/aapl/statements").with(bearer(session.accessToken())))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.symbol").value("AAPL"))
                .andExpect(jsonPath("$.period").value("ANNUAL"))
                .andExpect(jsonPath("$.lines[1].label").value("2024"))
                .andExpect(jsonPath("$.lines[1].income.revenue").value(391035000000L));
    }

    @Test
    void invalidStatementPeriodReturnsBadRequest() throws Exception {
        Session session = register(uniqueEmail("instrument-statements-period"));

        mockMvc.perform(get("/api/instruments/AAPL/statements").param("period", "weekly").with(bearer(session.accessToken())))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.message").value("Choose annual or quarterly filings."));
    }

    @Test
    void shortOrUnknownSearchReturnsEmptyList() throws Exception {
        Session session = register(uniqueEmail("instrument-search-empty"));

        mockMvc.perform(get("/api/instruments").param("q", "A").with(bearer(session.accessToken())))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.length()").value(0));

        mockMvc.perform(get("/api/instruments").param("q", "zzzz-unknown").with(bearer(session.accessToken())))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.length()").value(0));
    }
}
