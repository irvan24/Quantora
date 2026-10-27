package com.quantora.backend.marketdata.fmp;

import com.quantora.backend.marketdata.model.AssetType;
import com.quantora.backend.marketdata.model.InstrumentMatch;
import org.junit.jupiter.api.Test;
import tools.jackson.databind.ObjectMapper;
import tools.jackson.databind.json.JsonMapper;

import java.math.BigDecimal;
import java.time.Instant;

import static org.assertj.core.api.Assertions.assertThat;

class FmpCompanyMapperTest {

    private final ObjectMapper mapper = JsonMapper.builder().build();

    @Test
    void mapsProfileIncomeAndRatiosIntoQuantoraModel() {
        var profile = mapper.readTree("""
                {
                  "symbol": "AAPL",
                  "companyName": "Apple Inc.",
                  "exchangeShortName": "NASDAQ",
                  "currency": "USD",
                  "country": "US",
                  "sector": "Technology",
                  "industry": "Consumer Electronics",
                  "website": "https://www.apple.com",
                  "description": "Apple designs consumer electronics.",
                  "fullTimeEmployees": "164000",
                  "ceo": "Tim Cook",
                  "ipoDate": "1980-12-12",
                  "price": 189.5,
                  "changes": 3.24,
                  "changePercentage": 1.74,
                  "range": "164.08-260.10",
                  "mktCap": 2900000000000,
                  "isEtf": false,
                  "isFund": false
                }
                """);
        var income = mapper.readTree("""
                {
                  "date": "2024-09-28",
                  "period": "FY",
                  "revenue": 391035000000,
                  "netIncome": 93736000000,
                  "eps": 6.11
                }
                """);
        var ratios = mapper.readTree("""
                {
                  "peRatioTTM": 31.2,
                  "netProfitMarginTTM": 0.2397,
                  "returnOnEquityTTM": 1.365,
                  "debtToEquityRatioTTM": 1.87,
                  "dividendYielPercentageTTM": 0.44
                }
                """);

        var company = FmpCompanyMapper.map(profile, income, ratios, Instant.parse("2026-10-19T12:00:00Z"));

        assertThat(company.symbol()).isEqualTo("AAPL");
        assertThat(company.logoUrl()).isNull();
        assertThat(company.name()).isEqualTo("Apple Inc.");
        assertThat(company.assetType()).isEqualTo(AssetType.STOCK);
        assertThat(company.employees()).isEqualTo(164000);
        assertThat(company.quote().price()).isEqualByComparingTo("189.5");
        assertThat(company.quote().changePercent()).isEqualByComparingTo("1.74");
        assertThat(company.quote().week52Low()).isEqualByComparingTo("164.08");
        assertThat(company.quote().week52High()).isEqualByComparingTo("260.10");
        assertThat(company.financials().revenue()).isEqualByComparingTo("391035000000");
        assertThat(company.financials().peRatio()).isEqualByComparingTo("31.2");
        assertThat(company.financials().dividendYieldPercent()).isEqualByComparingTo("0.44");
        assertThat(company.financials().period()).isEqualTo("FY");
    }

    @Test
    void keepsLogoOnlyFromTheProviderHost() {
        var allowed = mapper.readTree("""
                {"symbol":"AAPL","companyName":"Apple","image":"https://financialmodelingprep.com/image-stock/AAPL.png"}
                """);
        var rejected = mapper.readTree("""
                {"symbol":"AAPL","companyName":"Apple","image":"https://evil.example/a.png"}
                """);

        assertThat(FmpCompanyMapper.map(allowed, null, null, Instant.parse("2026-10-19T12:00:00Z")).logoUrl())
                .isEqualTo("https://financialmodelingprep.com/image-stock/AAPL.png");
        assertThat(FmpCompanyMapper.map(rejected, null, null, Instant.parse("2026-10-19T12:00:00Z")).logoUrl())
                .isNull();
    }

    @Test
    void mapsEtfFlag() {
        var profile = mapper.readTree("""
                { "symbol": "VWCE", "companyName": "Vanguard FTSE All-World", "isEtf": true, "price": 120 }
                """);

        var company = FmpCompanyMapper.map(profile, null, null, Instant.parse("2026-10-19T12:00:00Z"));

        assertThat(company.assetType()).isEqualTo(AssetType.ETF);
        assertThat(company.financials().revenue()).isNull();
    }

    @Test
    void ignoresUnknownNumericNoise() {
        var profile = mapper.readTree("""
                { "symbol": "X", "companyName": "X", "price": "not-a-number" }
                """);

        var company = FmpCompanyMapper.map(profile, null, null, Instant.parse("2026-10-19T12:00:00Z"));

        assertThat(company.quote().price()).isNull();
        assertThat(company.name()).isEqualTo("X");
    }

    @Test
    void ranksNameSearchAheadOfWeakerTickerHitsAndDropsCrypto() {
        var names = mapper.readTree("""
                [
                  {"symbol": "APLE", "name": "Apple Hospitality REIT", "exchange": "NYSE", "currency": "USD"},
                  {"symbol": "AAPL", "name": "Apple Inc.", "exchange": "NASDAQ", "currency": "USD"},
                  {"symbol": "AAPLUSD", "name": "Apple USD", "exchange": "CRYPTO", "currency": "USD"}
                ]
                """);
        var symbols = mapper.readTree("""
                [
                  {"symbol": "AAPB", "name": "GraniteShares 2x Long AAPL", "exchange": "NASDAQ", "currency": "USD"}
                ]
                """);

        var matches = FmpCompanyMapper.matches(names, symbols, "Apple", 8);

        assertThat(matches).extracting(InstrumentMatch::symbol).containsExactly("AAPL", "APLE", "AAPB");
        assertThat(matches.getFirst().name()).isEqualTo("Apple Inc.");
        assertThat(matches.getFirst().exchange()).isEqualTo("NASDAQ");
    }

    @Test
    void exactTickerOutranksNameContains() {
        var names = mapper.readTree("""
                [
                  {"symbol": "MSFT", "name": "Microsoft Corporation", "exchange": "NASDAQ", "currency": "USD"},
                  {"symbol": "AAPL", "name": "Apple Inc.", "exchange": "NASDAQ", "currency": "USD"}
                ]
                """);

        var matches = FmpCompanyMapper.matches(names, null, "AAPL", 8);

        assertThat(matches.getFirst().symbol()).isEqualTo("AAPL");
    }

    @Test
    void keepsPrimaryListingWhenTheSameCompanyTradesOnSeveralExchanges() {
        var names = mapper.readTree("""
                [
                  {"symbol": "AAPL.NE", "name": "Apple Inc.", "exchange": "NEO", "currency": "CAD"},
                  {"symbol": "AAPL.TO", "name": "Apple Inc.", "exchange": "TSX", "currency": "CAD"},
                  {"symbol": "AAPL", "name": "Apple Inc.", "exchange": "NASDAQ", "currency": "USD"},
                  {"symbol": "APLE", "name": "Apple Hospitality REIT", "exchange": "NYSE", "currency": "USD"}
                ]
                """);

        var matches = FmpCompanyMapper.matches(names, null, "Apple", 8);

        assertThat(matches).extracting(InstrumentMatch::symbol).containsExactly("AAPL", "APLE");
    }

    @Test
    void alignsFilingsByDateAndDerivesMissingTotals() {
        var income = mapper.readTree("""
                [
                  {"date":"2024-09-28","period":"FY","reportedCurrency":"USD","revenue":391,"costOfRevenue":210,"researchAndDevelopmentExpenses":31,"sellingGeneralAndAdministrativeExpenses":26,"operatingIncome":123,"incomeBeforeTax":123,"incomeTaxExpense":30,"netIncome":93,"eps":6.11,"epsdiluted":6.08,"weightedAverageShsOutDil":15.3},
                  {"date":"2023-09-30","period":"FY","reportedCurrency":"USD","revenue":383,"costOfRevenue":214,"netIncome":97}
                ]
                """);
        var balance = mapper.readTree("""
                [{"date":"2024-09-28","cashAndCashEquivalents":30,"shortTermInvestments":35,"longTermInvestments":91,"totalCurrentAssets":153,"totalAssets":365,"shortTermDebt":21,"longTermDebt":86,"totalCurrentLiabilities":176,"totalLiabilities":308,"totalStockholdersEquity":57}]
                """);
        var cash = mapper.readTree("""
                [{"date":"2024-09-28","operatingCashFlow":118,"capitalExpenditure":-9.4,"dividendsPaid":-15}]
                """);

        var statements = FmpCompanyMapper.statements("AAPL", com.quantora.backend.marketdata.model.StatementPeriod.ANNUAL, income, balance, cash);

        assertThat(statements.currency()).isEqualTo("USD");
        assertThat(statements.lines()).hasSize(2);
        var latest = statements.lines().get(1);
        assertThat(latest.label()).isEqualTo("2024");
        assertThat(latest.income().grossProfit()).isEqualByComparingTo("181");
        assertThat(latest.income().operatingExpenses()).isEqualByComparingTo("57");
        assertThat(latest.income().dilutedShares()).isEqualByComparingTo("15.3");
        assertThat(latest.balance().totalDebt()).isEqualByComparingTo("107");
        assertThat(latest.balance().cashAndInvestments()).isEqualByComparingTo("156");
        assertThat(latest.cashFlow().freeCashFlow()).isEqualByComparingTo("108.6");
    }
}
