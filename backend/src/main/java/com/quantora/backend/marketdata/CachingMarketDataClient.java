package com.quantora.backend.marketdata;

import com.quantora.backend.marketdata.model.CompanyProfile;
import com.quantora.backend.marketdata.model.CompanyStatements;
import com.quantora.backend.marketdata.model.InstrumentMatch;
import com.quantora.backend.marketdata.model.LogoImage;
import com.quantora.backend.marketdata.model.PricePoint;
import com.quantora.backend.marketdata.model.StatementPeriod;

import java.time.Duration;
import java.time.Instant;
import java.util.List;
import java.util.Locale;
import java.util.Optional;
import java.util.concurrent.ConcurrentHashMap;

/**
 * In-process cache so a company page does not hit the provider on every refresh.
 * Swap for Redis later without changing {@link MarketDataClient} callers.
 */
public class CachingMarketDataClient implements MarketDataClient {

    private static final Duration MISS_TTL = Duration.ofMinutes(15);

    private final MarketDataClient delegate;
    private final Duration hitTtl;
    private final ConcurrentHashMap<String, CacheEntry> companies = new ConcurrentHashMap<>();
    private final ConcurrentHashMap<String, PriceCache> prices = new ConcurrentHashMap<>();
    private final ConcurrentHashMap<String, SearchCache> searches = new ConcurrentHashMap<>();
    private final ConcurrentHashMap<String, StatementCache> statements = new ConcurrentHashMap<>();
    private final ConcurrentHashMap<String, LogoCache> logos = new ConcurrentHashMap<>();

    public CachingMarketDataClient(MarketDataClient delegate, Duration hitTtl) {
        this.delegate = delegate;
        this.hitTtl = hitTtl.isZero() || hitTtl.isNegative() ? Duration.ofHours(6) : hitTtl;
    }

    @Override
    public Optional<CompanyProfile> fetchCompany(String symbol) {
        Instant now = Instant.now();
        CacheEntry cached = companies.get(symbol);
        if (cached != null && cached.expiresAt().isAfter(now)) {
            return cached.profile();
        }
        Optional<CompanyProfile> fetched = delegate.fetchCompany(symbol);
        Duration ttl = fetched.isPresent() ? hitTtl : MISS_TTL;
        companies.put(symbol, new CacheEntry(fetched, now.plus(ttl)));
        return fetched;
    }

    @Override
    public List<PricePoint> fetchPrices(String symbol) {
        Instant now = Instant.now();
        PriceCache cached = prices.get(symbol);
        if (cached != null && cached.expiresAt().isAfter(now)) {
            return cached.points();
        }
        List<PricePoint> fetched = List.copyOf(delegate.fetchPrices(symbol));
        Duration ttl = fetched.isEmpty() ? MISS_TTL : hitTtl;
        prices.put(symbol, new PriceCache(fetched, now.plus(ttl)));
        return fetched;
    }

    @Override
    public List<InstrumentMatch> search(String query) {
        String key = query.trim().toLowerCase(Locale.ROOT);
        Instant now = Instant.now();
        SearchCache cached = searches.get(key);
        if (cached != null && cached.expiresAt().isAfter(now)) {
            return cached.matches();
        }
        List<InstrumentMatch> fetched = List.copyOf(delegate.search(query));
        Duration ttl = fetched.isEmpty() ? MISS_TTL : hitTtl;
        searches.put(key, new SearchCache(fetched, now.plus(ttl)));
        return fetched;
    }

    @Override
    public CompanyStatements fetchStatements(String symbol, StatementPeriod period) {
        String key = symbol + ":" + period.name();
        Instant now = Instant.now();
        StatementCache cached = statements.get(key);
        if (cached != null && cached.expiresAt().isAfter(now)) {
            return cached.statements();
        }
        CompanyStatements fetched = delegate.fetchStatements(symbol, period);
        Duration ttl = fetched.lines().isEmpty() ? MISS_TTL : hitTtl;
        statements.put(key, new StatementCache(fetched, now.plus(ttl)));
        return fetched;
    }

    @Override
    public Optional<LogoImage> fetchLogo(String symbol) {
        Instant now = Instant.now();
        LogoCache cached = logos.get(symbol);
        if (cached != null && cached.expiresAt().isAfter(now)) {
            return cached.image();
        }
        String url = fetchCompany(symbol).map(CompanyProfile::logoUrl).orElse(null);
        if (url == null || url.isBlank()) {
            logos.put(symbol, new LogoCache(Optional.empty(), now.plus(MISS_TTL)));
            return Optional.empty();
        }
        try {
            Optional<LogoImage> fetched = delegate.downloadLogo(url);
            Duration ttl = fetched.isPresent() ? hitTtl : MISS_TTL;
            logos.put(symbol, new LogoCache(fetched, now.plus(ttl)));
            return fetched;
        } catch (RuntimeException ex) {
            return Optional.empty();
        }
    }

    private record CacheEntry(Optional<CompanyProfile> profile, Instant expiresAt) {
    }

    private record PriceCache(List<PricePoint> points, Instant expiresAt) {
    }

    private record SearchCache(List<InstrumentMatch> matches, Instant expiresAt) {
    }

    private record StatementCache(CompanyStatements statements, Instant expiresAt) {
    }

    private record LogoCache(Optional<LogoImage> image, Instant expiresAt) {
    }
}
