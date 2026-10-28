package com.quantora.backend.marketdata.fmp;

import com.quantora.backend.auth.exception.TooManyRequestsException;
import com.quantora.backend.marketdata.MarketDataClient;
import com.quantora.backend.marketdata.MarketDataUnavailableException;
import com.quantora.backend.marketdata.model.CompanyProfile;
import com.quantora.backend.marketdata.model.CompanyStatements;
import com.quantora.backend.marketdata.model.InstrumentMatch;
import com.quantora.backend.marketdata.model.LogoImage;
import com.quantora.backend.marketdata.model.PricePoint;
import com.quantora.backend.marketdata.model.StatementPeriod;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpStatusCode;
import org.springframework.web.client.RestClient;
import org.springframework.web.client.RestClientException;
import tools.jackson.databind.JsonNode;
import tools.jackson.databind.ObjectMapper;

import java.io.IOException;
import java.net.URI;
import java.time.Instant;
import java.time.LocalDate;
import java.util.List;
import java.util.Optional;
import java.util.concurrent.Callable;
import java.util.concurrent.ExecutionException;
import java.util.concurrent.Executors;

/**
 * Financial Modeling Prep adapter. Keep FMP URLs, field names and errors inside this package.
 */
public class FmpMarketDataClient implements MarketDataClient {

    private static final Logger log = LoggerFactory.getLogger(FmpMarketDataClient.class);
    private static final int SEARCH_LIMIT = 8;
    private static final int MAX_LOGO_BYTES = 1_000_000;

    private final RestClient restClient;
    private final String apiKey;
    private final ObjectMapper objectMapper;

    public FmpMarketDataClient(RestClient restClient, String apiKey, ObjectMapper objectMapper) {
        this.restClient = restClient;
        this.apiKey = apiKey;
        this.objectMapper = objectMapper;
    }

    @Override
    public Optional<CompanyProfile> fetchCompany(String symbol) {
        Optional<JsonNode> profile = getJson("/profile", "symbol", symbol);
        List<JsonNode> profiles = FmpCompanyMapper.asList(profile.orElse(null));
        if (profiles.isEmpty() || profiles.getFirst().has("Error Message")) {
            return Optional.empty();
        }
        JsonNode profileNode = profiles.getFirst();
        try (var executor = Executors.newVirtualThreadPerTaskExecutor()) {
            var income = executor.submit(fetch("/income-statement", symbol, "period", "annual", "limit", "5"));
            var cash = executor.submit(fetch("/cash-flow-statement", symbol, "period", "annual", "limit", "5"));
            var balance = executor.submit(fetch("/balance-sheet-statement", symbol, "period", "annual", "limit", "1"));
            var ratios = executor.submit(fetch("/ratios-ttm", symbol));
            var metrics = executor.submit(fetch("/key-metrics-ttm", symbol));
            return Optional.of(FmpCompanyMapper.map(
                    profileNode,
                    FmpCompanyMapper.asList(get(income).orElse(null)),
                    FmpCompanyMapper.asList(get(cash).orElse(null)),
                    first(get(balance).orElse(null)),
                    first(get(ratios).orElse(null)),
                    first(get(metrics).orElse(null)),
                    Instant.now()
            ));
        }
    }

    @Override
    public List<PricePoint> fetchPrices(String symbol) {
        LocalDate from = LocalDate.now().minusYears(5);
        Optional<JsonNode> payload = getJson(
                "/historical-price-eod/light",
                "symbol",
                symbol,
                "from",
                from.toString()
        );
        return payload.map(FmpCompanyMapper::prices).orElse(List.of());
    }

    @Override
    public CompanyStatements fetchStatements(String symbol, StatementPeriod period) {
        String filing = period.providerValue();
        try (var executor = Executors.newVirtualThreadPerTaskExecutor()) {
            var income = executor.submit(() -> filings("/income-statement", symbol, filing));
            var balance = executor.submit(() -> filings("/balance-sheet-statement", symbol, filing));
            var cash = executor.submit(() -> filings("/cash-flow-statement", symbol, filing));
            return FmpCompanyMapper.statements(
                    symbol,
                    period,
                    get(income).orElse(null),
                    get(balance).orElse(null),
                    get(cash).orElse(null)
            );
        }
    }

    /**
     * Some plans reject a long history with HTTP 402 and an empty body. Ask for the
     * useful window first, then the shorter one the current key is known to allow.
     */
    private Optional<JsonNode> filings(String path, String symbol, String filing) {
        Optional<JsonNode> extended = getJson(path, "symbol", symbol, "period", filing, "limit", "10");
        if (extended.isPresent() && !extended.get().isEmpty()) {
            return extended;
        }
        return getJson(path, "symbol", symbol, "period", filing, "limit", "5");
    }

    @Override
    public Optional<LogoImage> downloadLogo(String url) {
        if (url == null || url.isBlank()) {
            return Optional.empty();
        }
        try {
            return restClient.get()
                    .uri(URI.create(url))
                    .exchange((request, response) -> {
                        if (response.getStatusCode().isError()) {
                            return Optional.empty();
                        }
                        byte[] bytes = response.getBody().readNBytes(MAX_LOGO_BYTES + 1);
                        if (bytes.length == 0 || bytes.length > MAX_LOGO_BYTES) {
                            return Optional.empty();
                        }
                        String type = response.getHeaders().getContentType() != null
                                ? response.getHeaders().getContentType().toString()
                                : "image/png";
                        if (!type.startsWith("image/")) {
                            return Optional.empty();
                        }
                        return Optional.of(new LogoImage(bytes, type));
                    });
        } catch (RestClientException ex) {
            log.warn("market-data.logo-fetch-failed");
            return Optional.empty();
        }
    }

    @Override
    public List<InstrumentMatch> search(String query) {
        try (var executor = Executors.newVirtualThreadPerTaskExecutor()) {
            var byName = executor.submit(() -> getJson("/search-name", "query", query, "limit", "10"));
            var bySymbol = executor.submit(() -> getJson("/search-symbol", "query", query, "limit", "10"));
            return FmpCompanyMapper.matches(
                    get(byName).orElse(null),
                    get(bySymbol).orElse(null),
                    query,
                    SEARCH_LIMIT
            );
        }
    }

    private Callable<Optional<JsonNode>> fetch(String path, String symbol, String... extraQuery) {
        String[] query = new String[extraQuery.length + 2];
        query[0] = "symbol";
        query[1] = symbol;
        System.arraycopy(extraQuery, 0, query, 2, extraQuery.length);
        return () -> getJson(path, query);
    }

    private static Optional<JsonNode> get(java.util.concurrent.Future<Optional<JsonNode>> future) {
        try {
            return future.get();
        } catch (InterruptedException ex) {
            Thread.currentThread().interrupt();
            throw new MarketDataUnavailableException(ex);
        } catch (ExecutionException ex) {
            if (ex.getCause() instanceof RuntimeException runtime) {
                throw runtime;
            }
            throw new MarketDataUnavailableException(ex);
        }
    }

    private static JsonNode first(JsonNode node) {
        List<JsonNode> items = FmpCompanyMapper.asList(node);
        return items.isEmpty() ? null : items.getFirst();
    }

    private Optional<JsonNode> getJson(String path, String... extraQuery) {
        try {
            return restClient.get()
                    .uri(uriBuilder -> {
                        uriBuilder.path(path).queryParam("apikey", apiKey);
                        for (int i = 0; i + 1 < extraQuery.length; i += 2) {
                            uriBuilder.queryParam(extraQuery[i], extraQuery[i + 1]);
                        }
                        return uriBuilder.build();
                    })
                    .exchange((request, response) -> {
                        HttpStatusCode status = response.getStatusCode();
                        if (status.value() == 401 || status.value() == 403) {
                            log.error("market-data.provider-auth-failed");
                            throw new MarketDataUnavailableException();
                        }
                        if (status.value() == 429) {
                            throw new TooManyRequestsException();
                        }
                        if (status.isError()) {
                            log.warn("market-data.provider-http status={} path={}", status.value(), path);
                            return Optional.empty();
                        }
                        try {
                            return Optional.ofNullable(objectMapper.readTree(response.getBody().readAllBytes()));
                        } catch (IOException ex) {
                            throw new MarketDataUnavailableException(ex);
                        }
                    });
        } catch (MarketDataUnavailableException | TooManyRequestsException ex) {
            throw ex;
        } catch (RestClientException ex) {
            throw new MarketDataUnavailableException(ex);
        }
    }
}
