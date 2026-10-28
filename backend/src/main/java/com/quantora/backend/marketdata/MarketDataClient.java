package com.quantora.backend.marketdata;

import com.quantora.backend.marketdata.model.CompanyProfile;
import com.quantora.backend.marketdata.model.CompanyStatements;
import com.quantora.backend.marketdata.model.InstrumentMatch;
import com.quantora.backend.marketdata.model.LogoImage;
import com.quantora.backend.marketdata.model.PricePoint;
import com.quantora.backend.marketdata.model.StatementPeriod;

import java.util.List;
import java.util.Optional;

/**
 * Vendor-agnostic market data port. Implementations (FMP, stub, a future provider)
 * must map into Quantora models and never leak vendor DTOs past this boundary.
 */
public interface MarketDataClient {

    Optional<CompanyProfile> fetchCompany(String symbol);

    default List<PricePoint> fetchPrices(String symbol) {
        return List.of();
    }

    /**
     * Typeahead by company name or ticker. Empty list on no hits — never a vendor error
     * payload. Implementations should already be ranked and de-duplicated.
     */
    default List<InstrumentMatch> search(String query) {
        return List.of();
    }

    default CompanyStatements fetchStatements(String symbol, StatementPeriod period) {
        return CompanyStatements.empty(symbol, period);
    }

    default Optional<LogoImage> fetchLogo(String symbol) {
        return Optional.empty();
    }

    /**
     * Downloads a logo from a URL the provider already returned. Callers must pass
     * a URL that was validated when the profile was mapped.
     */
    default Optional<LogoImage> downloadLogo(String url) {
        return Optional.empty();
    }
}
