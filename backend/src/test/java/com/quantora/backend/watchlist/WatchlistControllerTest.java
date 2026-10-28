package com.quantora.backend.watchlist;

import com.quantora.backend.support.ApiTestSupport;
import org.junit.jupiter.api.Test;

import java.util.Map;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

class WatchlistControllerTest extends ApiTestSupport {

    @Test
    void listRequiresAuthentication() throws Exception {
        mockMvc.perform(get("/api/watchlist"))
                .andExpect(status().isUnauthorized());
    }

    @Test
    void addListAndRemoveRoundTrip() throws Exception {
        Session session = register(uniqueEmail("watchlist-roundtrip"));

        mockMvc.perform(jsonPost("/api/watchlist", Map.of("symbol", "aapl")).with(bearer(session.accessToken())))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.symbol").value("AAPL"))
                .andExpect(jsonPath("$.addedAt").isNotEmpty());

        mockMvc.perform(get("/api/watchlist").with(bearer(session.accessToken())))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.length()").value(1))
                .andExpect(jsonPath("$[0].symbol").value("AAPL"));

        mockMvc.perform(delete("/api/watchlist/AAPL").with(bearer(session.accessToken())))
                .andExpect(status().isNoContent());

        mockMvc.perform(get("/api/watchlist").with(bearer(session.accessToken())))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.length()").value(0));
    }

    @Test
    void addingTheSameSymbolTwiceStaysIdempotent() throws Exception {
        Session session = register(uniqueEmail("watchlist-idempotent"));

        mockMvc.perform(jsonPost("/api/watchlist", Map.of("symbol", "MSFT")).with(bearer(session.accessToken())))
                .andExpect(status().isCreated());
        mockMvc.perform(jsonPost("/api/watchlist", Map.of("symbol", "msft")).with(bearer(session.accessToken())))
                .andExpect(status().isCreated());

        mockMvc.perform(get("/api/watchlist").with(bearer(session.accessToken())))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.length()").value(1));
    }

    @Test
    void invalidSymbolIsRejected() throws Exception {
        Session session = register(uniqueEmail("watchlist-invalid"));

        mockMvc.perform(jsonPost("/api/watchlist", Map.of("symbol", "not a symbol")).with(bearer(session.accessToken())))
                .andExpect(status().isBadRequest());
    }

    @Test
    void removingASymbolNotOnTheWatchlistIsANoop() throws Exception {
        Session session = register(uniqueEmail("watchlist-remove-missing"));

        mockMvc.perform(delete("/api/watchlist/AAPL").with(bearer(session.accessToken())))
                .andExpect(status().isNoContent());
    }

    @Test
    void aUsersWatchlistIsIsolatedFromAnother() throws Exception {
        Session first = register(uniqueEmail("watchlist-isolated-a"));
        Session second = register(uniqueEmail("watchlist-isolated-b"));

        mockMvc.perform(jsonPost("/api/watchlist", Map.of("symbol", "AAPL")).with(bearer(first.accessToken())))
                .andExpect(status().isCreated());

        mockMvc.perform(get("/api/watchlist").with(bearer(second.accessToken())))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.length()").value(0));
    }
}
