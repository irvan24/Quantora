package com.quantora.backend.config;

import com.quantora.backend.marketdata.CachingMarketDataClient;
import com.quantora.backend.marketdata.MarketDataClient;
import com.quantora.backend.marketdata.UnavailableMarketDataClient;
import com.quantora.backend.marketdata.fmp.FmpMarketDataClient;
import com.quantora.backend.marketdata.stub.StubMarketDataClient;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.client.SimpleClientHttpRequestFactory;
import org.springframework.web.client.RestClient;
import tools.jackson.databind.ObjectMapper;

import java.time.Duration;

@Configuration
public class MarketDataConfiguration {

    private static final Logger log = LoggerFactory.getLogger(MarketDataConfiguration.class);

    @Bean
    public MarketDataClient marketDataClient(MarketDataProperties properties, ObjectMapper objectMapper) {
        String provider = properties.provider().trim().toLowerCase();
        MarketDataClient delegate = switch (provider) {
            case "stub" -> new StubMarketDataClient();
            case "fmp" -> fmpClient(properties, objectMapper);
            default -> throw new IllegalStateException(
                    "Unknown market-data provider '" + properties.provider()
                            + "'. Supported values: fmp, stub."
            );
        };
        return new CachingMarketDataClient(delegate, properties.cacheTtl());
    }

    private static MarketDataClient fmpClient(MarketDataProperties properties, ObjectMapper objectMapper) {
        if (!properties.fmp().apiKeyConfigured()) {
            log.warn("quantora.market-data: FMP_API_KEY is missing; company lookup is disabled");
            return new UnavailableMarketDataClient();
        }
        SimpleClientHttpRequestFactory factory = new SimpleClientHttpRequestFactory();
        factory.setConnectTimeout(Duration.ofSeconds(4));
        factory.setReadTimeout(Duration.ofSeconds(8));
        RestClient restClient = RestClient.builder()
                .baseUrl(trimTrailingSlash(properties.fmp().baseUrl()))
                .requestFactory(factory)
                .build();
        return new FmpMarketDataClient(restClient, properties.fmp().apiKey().trim(), objectMapper);
    }

    private static String trimTrailingSlash(String baseUrl) {
        if (baseUrl.endsWith("/")) {
            return baseUrl.substring(0, baseUrl.length() - 1);
        }
        return baseUrl;
    }
}
