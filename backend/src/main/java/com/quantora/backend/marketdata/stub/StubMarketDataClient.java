package com.quantora.backend.marketdata.stub;

import com.quantora.backend.marketdata.MarketDataClient;
import com.quantora.backend.marketdata.model.AnnualFigure;
import com.quantora.backend.marketdata.model.AssetType;
import com.quantora.backend.marketdata.model.CompanyFinancials;
import com.quantora.backend.marketdata.model.CompanyProfile;
import com.quantora.backend.marketdata.model.BalanceSheet;
import com.quantora.backend.marketdata.model.CashFlowStatement;
import com.quantora.backend.marketdata.model.CompanyQuote;
import com.quantora.backend.marketdata.model.CompanyStatements;
import com.quantora.backend.marketdata.model.IncomeStatement;
import com.quantora.backend.marketdata.model.InstrumentMatch;
import com.quantora.backend.marketdata.model.PricePoint;
import com.quantora.backend.marketdata.model.StatementLine;
import com.quantora.backend.marketdata.model.StatementPeriod;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;
import java.util.Locale;
import java.util.Optional;

/**
 * Deterministic provider for tests. Unknown symbols return empty; never calls the network.
 */
public class StubMarketDataClient implements MarketDataClient {

    public static final String KNOWN_SYMBOL = "AAPL";

    @Override
    public Optional<CompanyProfile> fetchCompany(String symbol) {
        if (!KNOWN_SYMBOL.equals(symbol)) {
            return Optional.empty();
        }
        return Optional.of(new CompanyProfile(
                "AAPL",
                "Apple Inc.",
                AssetType.STOCK,
                "NASDAQ",
                "USD",
                "US",
                "Technology",
                "Consumer Electronics",
                "https://www.apple.com",
                null,
                "Apple designs and sells consumer electronics, software and services. iPhone, Mac and services are the main engines of the business.",
                164000,
                "Tim Cook",
                "1980-12-12",
                new CompanyQuote(
                        new BigDecimal("189.50"),
                        new BigDecimal("3.24"),
                        new BigDecimal("1.74"),
                        new BigDecimal("2900000000000"),
                        new BigDecimal("164.08"),
                        new BigDecimal("260.10"),
                        Instant.parse("2026-10-19T12:00:00Z")
                ),
                new CompanyFinancials(
                        "FY",
                        "2024-09-28",
                        new BigDecimal("391035000000"),
                        new BigDecimal("93736000000"),
                        new BigDecimal("6.11"),
                        new BigDecimal("31.2"),
                        new BigDecimal("28.4"),
                        new BigDecimal("0.2397"),
                        new BigDecimal("0.462"),
                        new BigDecimal("0.315"),
                        new BigDecimal("1.365"),
                        new BigDecimal("1.87"),
                        new BigDecimal("0.44"),
                        new BigDecimal("98800000000"),
                        new BigDecimal("0.021"),
                        new BigDecimal("0.074"),
                        new BigDecimal("132400000000"),
                        new BigDecimal("98700000000"),
                        new BigDecimal("0.89")
                ),
                List.of(
                        new AnnualFigure(2022, new BigDecimal("394328000000"), new BigDecimal("99803000000"), new BigDecimal("111443000000")),
                        new AnnualFigure(2023, new BigDecimal("383285000000"), new BigDecimal("96995000000"), new BigDecimal("99584000000")),
                        new AnnualFigure(2024, new BigDecimal("391035000000"), new BigDecimal("93736000000"), new BigDecimal("108807000000"))
                )
        ));
    }

    @Override
    public List<PricePoint> fetchPrices(String symbol) {
        if (!KNOWN_SYMBOL.equals(symbol)) {
            return List.of();
        }
        List<PricePoint> points = new ArrayList<>();
        LocalDate start = LocalDate.of(2025, 1, 2);
        BigDecimal price = new BigDecimal("180.00");
        for (int i = 0; i < 40; i++) {
            price = price.add(new BigDecimal("0.40"));
            points.add(new PricePoint(start.plusDays(i * 7L), price));
        }
        return points;
    }

    @Override
    public CompanyStatements fetchStatements(String symbol, StatementPeriod period) {
        if (!KNOWN_SYMBOL.equals(symbol)) {
            return CompanyStatements.empty(symbol, period);
        }
        if (period == StatementPeriod.QUARTERLY) {
            return new CompanyStatements("AAPL", "USD", period, List.of(
                    line("2024-12-28", "Q1", 2025, "Q1 FY25", "Q1 ’25", "100", "25"),
                    line("2025-03-29", "Q2", 2025, "Q2 FY25", "Q2 ’25", "95", "24"),
                    line("2025-06-28", "Q3", 2025, "Q3 FY25", "Q3 ’25", "90", "22"),
                    line("2025-09-27", "Q4", 2025, "Q4 FY25", "Q4 ’25", "106", "27")
            ));
        }
        return new CompanyStatements("AAPL", "USD", period, List.of(
                line("2023-09-30", "FY", 2023, "2023", "’23", "383285000000", "96995000000"),
                line("2024-09-28", "FY", 2024, "2024", "’24", "391035000000", "93736000000")
        ));
    }

    private static StatementLine line(
            String date,
            String fiscal,
            int year,
            String label,
            String shortLabel,
            String revenue,
            String netIncome
    ) {
        BigDecimal revenueValue = new BigDecimal(revenue);
        BigDecimal net = new BigDecimal(netIncome);
        return new StatementLine(
                date,
                fiscal,
                year,
                label,
                shortLabel,
                new IncomeStatement(revenueValue, null, null, null, null, null, null, null, null, null, net, null, null, null, null, null),
                new BalanceSheet(null, null, null, null, null, null, null, null, null, null, null, null),
                new CashFlowStatement(null, null, null, null, null, null, null, null, null, null)
        );
    }

    @Override
    public List<InstrumentMatch> search(String query) {
        return fetchCompany(KNOWN_SYMBOL)
                .filter(company -> matches(company, query))
                .map(company -> List.of(new InstrumentMatch(
                        company.symbol(),
                        company.name(),
                        company.assetType(),
                        company.exchange(),
                        company.currency()
                )))
                .orElse(List.of());
    }

    private static boolean matches(CompanyProfile company, String query) {
        String needle = query.toLowerCase(Locale.ROOT);
        return company.symbol().toLowerCase(Locale.ROOT).contains(needle)
                || company.name().toLowerCase(Locale.ROOT).contains(needle);
    }
}
