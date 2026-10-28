package com.quantora.backend.marketdata;

import com.quantora.backend.marketdata.model.CompanyProfile;
import com.quantora.backend.marketdata.model.CompanyStatements;
import com.quantora.backend.marketdata.model.InstrumentMatch;
import com.quantora.backend.marketdata.model.PricePoint;
import com.quantora.backend.marketdata.model.StatementPeriod;

import java.util.List;
import java.util.Optional;

public class UnavailableMarketDataClient implements MarketDataClient {

    @Override
    public Optional<CompanyProfile> fetchCompany(String symbol) {
        throw new MarketDataUnavailableException();
    }

    @Override
    public List<PricePoint> fetchPrices(String symbol) {
        throw new MarketDataUnavailableException();
    }

    @Override
    public List<InstrumentMatch> search(String query) {
        throw new MarketDataUnavailableException();
    }

    @Override
    public CompanyStatements fetchStatements(String symbol, StatementPeriod period) {
        throw new MarketDataUnavailableException();
    }
}
