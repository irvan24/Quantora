package com.quantora.backend.marketdata;

import com.quantora.backend.marketdata.model.AssetType;
import com.quantora.backend.marketdata.model.CompanyFinancials;
import com.quantora.backend.marketdata.model.CompanyProfile;
import com.quantora.backend.marketdata.model.CompanyQuote;
import com.quantora.backend.marketdata.model.InstrumentMatch;
import org.junit.jupiter.api.Test;

import java.math.BigDecimal;
import java.time.Duration;
import java.time.Instant;
import java.util.List;
import java.util.Optional;
import java.util.concurrent.atomic.AtomicInteger;

import static org.assertj.core.api.Assertions.assertThat;

class CachingMarketDataClientTest {

    @Test
    void cachesSuccessfulLookups() {
        AtomicInteger calls = new AtomicInteger();
        CompanyProfile profile = fixture("AAPL");
        MarketDataClient inner = symbol -> {
            calls.incrementAndGet();
            return Optional.of(profile);
        };

        CachingMarketDataClient cached = new CachingMarketDataClient(inner, Duration.ofHours(1));
        assertThat(cached.fetchCompany("AAPL")).contains(profile);
        assertThat(cached.fetchCompany("AAPL")).contains(profile);
        assertThat(calls.get()).isEqualTo(1);
    }

    @Test
    void cachesMissesSeparatelyFromHits() {
        AtomicInteger calls = new AtomicInteger();
        MarketDataClient inner = symbol -> {
            calls.incrementAndGet();
            return Optional.empty();
        };

        CachingMarketDataClient cached = new CachingMarketDataClient(inner, Duration.ofHours(1));
        assertThat(cached.fetchCompany("ZZNOPE")).isEmpty();
        assertThat(cached.fetchCompany("ZZNOPE")).isEmpty();
        assertThat(calls.get()).isEqualTo(1);
    }

    @Test
    void cachesSearchResultsCaseInsensitively() {
        AtomicInteger calls = new AtomicInteger();
        InstrumentMatch apple = new InstrumentMatch("AAPL", "Apple Inc.", AssetType.STOCK, "NASDAQ", "USD");
        MarketDataClient inner = new MarketDataClient() {
            @Override
            public Optional<CompanyProfile> fetchCompany(String symbol) {
                return Optional.empty();
            }

            @Override
            public List<InstrumentMatch> search(String query) {
                calls.incrementAndGet();
                return List.of(apple);
            }
        };

        CachingMarketDataClient cached = new CachingMarketDataClient(inner, Duration.ofHours(1));
        assertThat(cached.search("Apple")).containsExactly(apple);
        assertThat(cached.search("apple")).containsExactly(apple);
        assertThat(calls.get()).isEqualTo(1);
    }

    private static CompanyProfile fixture(String symbol) {
        return new CompanyProfile(
                symbol,
                symbol,
                AssetType.STOCK,
                "NASDAQ",
                "USD",
                "US",
                "Technology",
                "Software",
                null,
                null,
                "Summary",
                10,
                null,
                null,
                new CompanyQuote(new BigDecimal("1"), null, null, new BigDecimal("2"), null, null, Instant.parse("2026-01-01T00:00:00Z")),
                new CompanyFinancials("TTM", "2024", null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null),
                java.util.List.of()
        );
    }
}
