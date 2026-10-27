package com.quantora.backend.instrument.service;

import com.quantora.backend.instrument.InstrumentQueries;
import com.quantora.backend.instrument.InstrumentSymbols;
import com.quantora.backend.instrument.exception.InstrumentNotFoundException;
import com.quantora.backend.marketdata.MarketDataClient;
import com.quantora.backend.marketdata.MarketDataUnavailableException;
import com.quantora.backend.marketdata.model.CompanyProfile;
import com.quantora.backend.marketdata.model.CompanyStatements;
import com.quantora.backend.marketdata.model.InstrumentMatch;
import com.quantora.backend.marketdata.model.LogoImage;
import com.quantora.backend.marketdata.model.PricePoint;
import com.quantora.backend.marketdata.model.StatementPeriod;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Optional;

@Service
public class InstrumentService {

    private final MarketDataClient marketDataClient;

    public InstrumentService(MarketDataClient marketDataClient) {
        this.marketDataClient = marketDataClient;
    }

    public CompanyProfile getBySymbol(String rawSymbol) {
        String symbol = InstrumentSymbols.normalize(rawSymbol);
        return marketDataClient.fetchCompany(symbol)
                .or(() -> primaryListing(symbol))
                .orElseThrow(() -> new InstrumentNotFoundException(symbol));
    }

    public CompanyStatements statements(String rawSymbol, String rawPeriod) {
        String symbol = InstrumentSymbols.normalize(rawSymbol);
        return marketDataClient.fetchStatements(symbol, StatementPeriod.parse(rawPeriod));
    }

    public Optional<LogoImage> logo(String rawSymbol) {
        String symbol = InstrumentSymbols.normalize(rawSymbol);
        try {
            return marketDataClient.fetchLogo(symbol);
        } catch (MarketDataUnavailableException ex) {
            return Optional.empty();
        }
    }

    public List<PricePoint> prices(String rawSymbol) {
        String symbol = InstrumentSymbols.normalize(rawSymbol);
        return marketDataClient.fetchPrices(symbol);
    }

    public List<InstrumentMatch> search(String rawQuery) {
        String query = InstrumentQueries.normalize(rawQuery);
        if (query == null) {
            return List.of();
        }
        return marketDataClient.search(query).stream()
                .filter(match -> InstrumentSymbols.isValid(match.symbol()))
                .limit(InstrumentQueries.MAX_RESULTS)
                .toList();
    }

    private Optional<CompanyProfile> primaryListing(String symbol) {
        List<InstrumentMatch> matches = marketDataClient.search(symbol);
        Optional<CompanyProfile> fromSymbol = firstFetchable(symbol, matches);
        if (fromSymbol.isPresent()) {
            return fromSymbol;
        }
        if (matches.isEmpty()) {
            return Optional.empty();
        }
        String name = matches.getFirst().name();
        if (name == null || name.length() < InstrumentQueries.MIN_LENGTH) {
            return Optional.empty();
        }
        return firstFetchable(symbol, marketDataClient.search(name));
    }

    private Optional<CompanyProfile> firstFetchable(String requested, List<InstrumentMatch> matches) {
        return matches.stream()
                .map(InstrumentMatch::symbol)
                .filter(candidate -> !candidate.equalsIgnoreCase(requested))
                .limit(3)
                .map(marketDataClient::fetchCompany)
                .flatMap(Optional::stream)
                .findFirst();
    }
}
