package com.quantora.backend.marketdata.fmp;

import com.quantora.backend.marketdata.model.AnnualFigure;
import com.quantora.backend.marketdata.model.AssetType;
import com.quantora.backend.marketdata.model.BalanceSheet;
import com.quantora.backend.marketdata.model.CashFlowStatement;
import com.quantora.backend.marketdata.model.CompanyFinancials;
import com.quantora.backend.marketdata.model.CompanyProfile;
import com.quantora.backend.marketdata.model.CompanyQuote;
import com.quantora.backend.marketdata.model.CompanyStatements;
import com.quantora.backend.marketdata.model.IncomeStatement;
import com.quantora.backend.marketdata.model.InstrumentMatch;
import com.quantora.backend.marketdata.model.PricePoint;
import com.quantora.backend.marketdata.model.StatementLine;
import com.quantora.backend.marketdata.model.StatementPeriod;
import tools.jackson.databind.JsonNode;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.Instant;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Set;
import java.util.TreeSet;

final class FmpCompanyMapper {

    private static final Set<String> IGNORED_EXCHANGES = Set.of("CRYPTO", "FOREX", "CCC", "COMMODITY");

    private FmpCompanyMapper() {
    }

    static List<InstrumentMatch> matches(JsonNode names, JsonNode symbols, String query, int limit) {
        Map<String, InstrumentMatch> unique = new LinkedHashMap<>();
        for (JsonNode node : asList(names)) {
            putMatch(unique, node);
        }
        for (JsonNode node : asList(symbols)) {
            putMatch(unique, node);
        }
        String needle = query == null ? "" : query.trim().toLowerCase(Locale.ROOT);
        List<InstrumentMatch> ranked = unique.values().stream()
                .sorted(Comparator
                        .comparingInt((InstrumentMatch match) -> relevance(match, needle))
                        .thenComparingInt(match -> exchangeRank(match.exchange()))
                        .thenComparingInt(match -> match.symbol().indexOf('.') >= 0 ? 1 : 0)
                        .thenComparing(InstrumentMatch::symbol))
                .toList();
        Map<String, InstrumentMatch> byIssuer = new LinkedHashMap<>();
        for (InstrumentMatch match : ranked) {
            byIssuer.putIfAbsent(issuerKey(match.name()), match);
        }
        return byIssuer.values().stream()
                .limit(Math.max(0, limit))
                .toList();
    }

    static CompanyProfile map(JsonNode profile, JsonNode income, JsonNode ratios, Instant fetchedAt) {
        return map(profile, asList(income), List.of(), null, ratios, null, fetchedAt);
    }

    static CompanyProfile map(
            JsonNode profile,
            List<JsonNode> incomeStatements,
            List<JsonNode> cashFlows,
            JsonNode balance,
            JsonNode ratios,
            JsonNode metrics,
            Instant fetchedAt
    ) {
        JsonNode latestIncome = incomeStatements.isEmpty() ? null : incomeStatements.getFirst();
        JsonNode latestCash = cashFlows.isEmpty() ? null : cashFlows.getFirst();
        String symbol = FmpJson.text(profile, "symbol");
        String name = FmpJson.text(profile, "companyName", "name");
        return new CompanyProfile(
                symbol,
                name != null ? name : symbol,
                assetType(profile),
                FmpJson.text(profile, "exchangeShortName", "exchange"),
                FmpJson.text(profile, "currency"),
                FmpJson.text(profile, "country"),
                FmpJson.text(profile, "sector"),
                FmpJson.text(profile, "industry"),
                FmpJson.text(profile, "website"),
                logoUrl(FmpJson.text(profile, "image")),
                FmpJson.text(profile, "description"),
                FmpJson.integer(profile, "fullTimeEmployees"),
                FmpJson.text(profile, "ceo"),
                FmpJson.text(profile, "ipoDate"),
                quote(profile, fetchedAt),
                financials(profile, latestIncome, latestCash, balance, ratios, metrics, incomeStatements),
                annuals(incomeStatements, cashFlows)
        );
    }

    static List<PricePoint> prices(JsonNode payload) {
        List<PricePoint> points = new ArrayList<>();
        for (JsonNode node : asList(payload)) {
            String date = FmpJson.text(node, "date");
            BigDecimal close = FmpJson.decimal(node, "close", "price", "adjClose");
            if (date == null || close == null) {
                continue;
            }
            try {
                points.add(new PricePoint(LocalDate.parse(date), close));
            } catch (Exception ignored) {
                // skip malformed rows
            }
        }
        points.sort(Comparator.comparing(PricePoint::date));
        return points;
    }

    static CompanyStatements statements(
            String symbol,
            StatementPeriod period,
            JsonNode incomePayload,
            JsonNode balancePayload,
            JsonNode cashPayload
    ) {
        Map<String, JsonNode> income = byDate(incomePayload);
        Map<String, JsonNode> balance = byDate(balancePayload);
        Map<String, JsonNode> cash = byDate(cashPayload);
        Set<String> dates = new TreeSet<>();
        dates.addAll(income.keySet());
        dates.addAll(balance.keySet());
        dates.addAll(cash.keySet());
        List<StatementLine> lines = new ArrayList<>();
        String currency = null;
        for (String date : dates) {
            JsonNode inc = income.get(date);
            JsonNode bal = balance.get(date);
            JsonNode flow = cash.get(date);
            JsonNode any = inc != null ? inc : bal != null ? bal : flow;
            Integer year = yearOf(any);
            if (year == null) {
                continue;
            }
            if (currency == null) {
                currency = FmpJson.text(any, "reportedCurrency", "currency");
            }
            String fiscal = FmpJson.text(any, "period");
            String yearText = String.valueOf(year);
            String yy = yearText.length() >= 2 ? yearText.substring(yearText.length() - 2) : yearText;
            String label = yearText;
            String shortLabel = "’" + yy;
            if (period == StatementPeriod.QUARTERLY && fiscal != null && fiscal.startsWith("Q")) {
                label = fiscal + " FY" + yy;
                shortLabel = fiscal + " ’" + yy;
            }
            lines.add(new StatementLine(date, fiscal, year, label, shortLabel, incomeOf(inc), balanceOf(bal), cashOf(flow)));
        }
        return new CompanyStatements(symbol, currency, period, lines);
    }

    private static AssetType assetType(JsonNode profile) {
        if (FmpJson.bool(profile, "isEtf")) {
            return AssetType.ETF;
        }
        if (FmpJson.bool(profile, "isFund")) {
            return AssetType.FUND;
        }
        return AssetType.STOCK;
    }

    private static CompanyQuote quote(JsonNode profile, Instant fetchedAt) {
        BigDecimal[] range = week52Range(FmpJson.text(profile, "range"));
        return new CompanyQuote(
                FmpJson.decimal(profile, "price"),
                FmpJson.decimal(profile, "change", "changes"),
                FmpJson.decimal(profile, "changePercentage", "changesPercentage"),
                FmpJson.decimal(profile, "mktCap", "marketCap"),
                range[0],
                range[1],
                fetchedAt
        );
    }

    private static CompanyFinancials financials(
            JsonNode profile,
            JsonNode income,
            JsonNode cashFlow,
            JsonNode balance,
            JsonNode ratios,
            JsonNode metrics,
            List<JsonNode> incomeStatements
    ) {
        JsonNode statements = present(income) ? income : profile;
        String period = FmpJson.text(statements, "period", "calendarYear");
        if (period == null) {
            period = "TTM";
        }
        return new CompanyFinancials(
                period,
                FmpJson.text(statements, "date", "calendarYear", "ipoDate"),
                FmpJson.decimal(statements, "revenue"),
                FmpJson.decimal(statements, "netIncome"),
                FmpJson.decimal(statements, "eps", "epsdiluted"),
                firstDecimal(ratios, metrics, profile, "peRatioTTM", "priceEarningsRatioTTM", "peRatio"),
                firstDecimal(ratios, metrics, profile, "forwardPE", "forwardPERatio", "peRatioForward"),
                firstDecimal(ratios, metrics, profile, "netProfitMarginTTM", "netProfitMargin"),
                firstDecimal(ratios, metrics, profile, "grossProfitMarginTTM", "grossProfitMargin", "grossMargin"),
                firstDecimal(ratios, metrics, profile, "operatingProfitMarginTTM", "operatingProfitMargin", "operatingMargin"),
                firstDecimal(ratios, metrics, profile, "returnOnEquityTTM", "roeTTM", "returnOnEquity"),
                firstDecimal(ratios, metrics, profile, "debtToEquityRatioTTM", "debtToEquityTTM", "debtEquityRatio"),
                firstDecimal(
                        ratios,
                        metrics,
                        profile,
                        "dividendYieldPercentageTTM",
                        "dividendYielPercentageTTM",
                        "dividendYieldTTM",
                        "dividendYield"
                ),
                firstDecimal(cashFlow, metrics, statements, "freeCashFlow", "freeCashFlowTTM"),
                firstNonNull(growth(incomeStatements, "revenue"), FmpJson.decimal(statements, "growthRevenue")),
                firstNonNull(growth(incomeStatements, "eps"), FmpJson.decimal(statements, "growthEps", "growthEPS")),
                firstDecimal(balance, metrics, profile, "cashAndShortTermInvestments", "cashAndCashEquivalents", "cash"),
                firstDecimal(balance, metrics, profile, "totalDebt", "netDebt"),
                firstDecimal(ratios, metrics, balance, "currentRatioTTM", "currentRatio")
        );
    }

    private static List<AnnualFigure> annuals(List<JsonNode> incomeStatements, List<JsonNode> cashFlows) {
        Map<Integer, BigDecimal> fcfByYear = new LinkedHashMap<>();
        for (JsonNode cash : cashFlows) {
            Integer year = yearOf(cash);
            BigDecimal fcf = FmpJson.decimal(cash, "freeCashFlow");
            if (year != null && fcf != null) {
                fcfByYear.putIfAbsent(year, fcf);
            }
        }
        List<AnnualFigure> annuals = new ArrayList<>();
        for (JsonNode income : incomeStatements) {
            Integer year = yearOf(income);
            if (year == null) {
                continue;
            }
            annuals.add(new AnnualFigure(
                    year,
                    FmpJson.decimal(income, "revenue"),
                    FmpJson.decimal(income, "netIncome"),
                    fcfByYear.get(year)
            ));
        }
        annuals.sort(Comparator.comparingInt(AnnualFigure::year));
        return annuals;
    }

    private static Integer yearOf(JsonNode node) {
        String calendar = FmpJson.text(node, "calendarYear");
        if (calendar != null) {
            try {
                return Integer.parseInt(calendar.replaceAll("[^0-9]", "").substring(0, Math.min(4, calendar.replaceAll("[^0-9]", "").length())));
            } catch (Exception ignored) {
                // fall through to date
            }
        }
        String date = FmpJson.text(node, "date");
        if (date != null && date.length() >= 4) {
            try {
                return Integer.parseInt(date.substring(0, 4));
            } catch (NumberFormatException ignored) {
                return null;
            }
        }
        return null;
    }

    private static BigDecimal growth(List<JsonNode> statements, String field) {
        if (statements.size() < 2) {
            return null;
        }
        String[] keys = "eps".equals(field) ? new String[] { "eps", "epsdiluted" } : new String[] { field };
        BigDecimal latest = FmpJson.decimal(statements.getFirst(), keys);
        BigDecimal previous = FmpJson.decimal(statements.get(1), keys);
        if (latest == null || previous == null || previous.compareTo(BigDecimal.ZERO) == 0) {
            return null;
        }
        return latest.subtract(previous).divide(previous.abs(), 4, RoundingMode.HALF_UP);
    }

    static BigDecimal[] week52Range(String range) {
        BigDecimal[] values = new BigDecimal[2];
        if (range == null || !range.contains("-")) {
            return values;
        }
        String[] parts = range.split("-");
        if (parts.length < 2) {
            return values;
        }
        try {
            values[0] = new BigDecimal(parts[0].trim());
            values[1] = new BigDecimal(parts[parts.length - 1].trim());
        } catch (NumberFormatException ignored) {
            return new BigDecimal[2];
        }
        return values;
    }

    static List<JsonNode> asList(JsonNode node) {
        if (!present(node)) {
            return List.of();
        }
        JsonNode items = node;
        if (node.has("historical") && node.get("historical").isArray()) {
            items = node.get("historical");
        }
        if (!items.isArray()) {
            return List.of(items);
        }
        List<JsonNode> list = new ArrayList<>();
        items.forEach(list::add);
        return list;
    }

    private static boolean present(JsonNode node) {
        return node != null && !node.isNull() && !node.isMissingNode();
    }

    private static BigDecimal firstDecimal(JsonNode first, JsonNode second, JsonNode third, String... keys) {
        for (JsonNode node : new JsonNode[] { first, second, third }) {
            if (!present(node)) {
                continue;
            }
            BigDecimal value = FmpJson.decimal(node, keys);
            if (value != null) {
                return value;
            }
        }
        return null;
    }

    private static BigDecimal firstNonNull(BigDecimal first, BigDecimal second) {
        return first != null ? first : second;
    }

    private static void putMatch(Map<String, InstrumentMatch> unique, JsonNode node) {
        InstrumentMatch match = match(node);
        if (match != null) {
            unique.putIfAbsent(match.symbol(), match);
        }
    }

    private static InstrumentMatch match(JsonNode node) {
        String symbol = FmpJson.text(node, "symbol");
        String name = FmpJson.text(node, "name", "companyName");
        if (symbol == null || name == null) {
            return null;
        }
        String normalized = symbol.trim().toUpperCase(Locale.ROOT);
        String exchange = FmpJson.text(node, "exchange", "exchangeShortName");
        if (exchange != null && IGNORED_EXCHANGES.contains(exchange.toUpperCase(Locale.ROOT))) {
            return null;
        }
        return new InstrumentMatch(
                normalized,
                name,
                assetType(node),
                exchange,
                FmpJson.text(node, "currency")
        );
    }

    private static int relevance(InstrumentMatch match, String query) {
        if (query.isEmpty()) {
            return 50;
        }
        String symbol = match.symbol().toLowerCase(Locale.ROOT);
        String name = match.name().toLowerCase(Locale.ROOT);
        if (symbol.equals(query)) {
            return 0;
        }
        if (symbol.startsWith(query)) {
            return 1;
        }
        if (name.equals(query) || name.startsWith(query + " ") || name.startsWith(query + ".")) {
            return 2;
        }
        if (name.startsWith(query)) {
            return 3;
        }
        if (name.contains(query)) {
            return 4;
        }
        if (symbol.contains(query)) {
            return 5;
        }
        return 20;
    }

    private static int exchangeRank(String exchange) {
        if (exchange == null) {
            return 40;
        }
        return switch (exchange.toUpperCase(Locale.ROOT)) {
            case "NASDAQ", "NYSE", "AMEX", "NASDAQGS", "NASDAQGM", "NYSEARCA", "BATS" -> 0;
            case "EURONEXT", "LSE", "XETRA", "TSX", "ASX", "AMS", "EPA", "FRA" -> 10;
            case "OTC", "PNK" -> 25;
            default -> 30;
        };
    }

    private static String logoUrl(String image) {
        if (image == null || !image.startsWith("https://")) {
            return null;
        }
        try {
            String host = java.net.URI.create(image).getHost();
            if (host == null) {
                return null;
            }
            String normalized = host.toLowerCase(java.util.Locale.ROOT);
            if (normalized.equals("financialmodelingprep.com") || normalized.endsWith(".financialmodelingprep.com")) {
                return image;
            }
        } catch (IllegalArgumentException ignored) {
            return null;
        }
        return null;
    }

    private static Map<String, JsonNode> byDate(JsonNode payload) {
        Map<String, JsonNode> indexed = new LinkedHashMap<>();
        for (JsonNode node : asList(payload)) {
            if (node.has("Error Message")) {
                continue;
            }
            String date = FmpJson.text(node, "date");
            if (date != null) {
                indexed.putIfAbsent(date, node);
            }
        }
        return indexed;
    }

    private static IncomeStatement incomeOf(JsonNode node) {
        if (!present(node)) {
            return new IncomeStatement(null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null);
        }
        BigDecimal revenue = FmpJson.decimal(node, "revenue");
        BigDecimal cost = FmpJson.decimal(node, "costOfRevenue");
        BigDecimal gross = firstNonNull(FmpJson.decimal(node, "grossProfit"), subtract(revenue, cost));
        BigDecimal research = FmpJson.decimal(node, "researchAndDevelopmentExpenses", "researchAndDevelopment");
        BigDecimal sga = FmpJson.decimal(node, "sellingGeneralAndAdministrativeExpenses", "sellingGeneralAndAdministrative");
        BigDecimal opex = firstNonNull(FmpJson.decimal(node, "operatingExpenses"), add(research, sga));
        BigDecimal operating = FmpJson.decimal(node, "operatingIncome");
        BigDecimal depreciation = FmpJson.decimal(node, "depreciationAndAmortization");
        return new IncomeStatement(
                revenue,
                cost,
                gross,
                research,
                sga,
                opex,
                operating,
                FmpJson.decimal(node, "totalOtherIncomeExpensesNet", "interestIncome"),
                FmpJson.decimal(node, "incomeBeforeTax"),
                FmpJson.decimal(node, "incomeTaxExpense", "incomeTax"),
                FmpJson.decimal(node, "netIncome"),
                FmpJson.decimal(node, "eps"),
                FmpJson.decimal(node, "epsdiluted", "epsDiluted"),
                firstNonNull(FmpJson.decimal(node, "ebitda"), add(operating, depreciation)),
                depreciation,
                FmpJson.decimal(node, "weightedAverageShsOutDil", "weightedAverageShsOut")
        );
    }

    private static BalanceSheet balanceOf(JsonNode node) {
        if (!present(node)) {
            return new BalanceSheet(null, null, null, null, null, null, null, null, null, null, null, null);
        }
        BigDecimal cash = FmpJson.decimal(node, "cashAndCashEquivalents", "cash");
        BigDecimal shortTerm = FmpJson.decimal(node, "shortTermInvestments");
        BigDecimal longTerm = FmpJson.decimal(node, "longTermInvestments");
        BigDecimal shortDebt = FmpJson.decimal(node, "shortTermDebt");
        BigDecimal longDebt = FmpJson.decimal(node, "longTermDebt");
        return new BalanceSheet(
                cash,
                shortTerm,
                firstNonNull(sum(cash, shortTerm, longTerm), FmpJson.decimal(node, "cashAndShortTermInvestments")),
                FmpJson.decimal(node, "totalCurrentAssets"),
                longTerm,
                FmpJson.decimal(node, "totalAssets"),
                shortDebt,
                longDebt,
                firstNonNull(FmpJson.decimal(node, "totalDebt"), add(shortDebt, longDebt)),
                FmpJson.decimal(node, "totalCurrentLiabilities"),
                FmpJson.decimal(node, "totalLiabilities"),
                FmpJson.decimal(node, "totalStockholdersEquity", "totalEquity")
        );
    }

    private static CashFlowStatement cashOf(JsonNode node) {
        if (!present(node)) {
            return new CashFlowStatement(null, null, null, null, null, null, null, null, null, null);
        }
        BigDecimal operating = FmpJson.decimal(node, "operatingCashFlow", "netCashProvidedByOperatingActivities");
        BigDecimal capex = FmpJson.decimal(node, "capitalExpenditure", "investmentsInPropertyPlantAndEquipment");
        BigDecimal investing = FmpJson.decimal(node, "netCashUsedForInvestingActivites", "netCashUsedForInvestingActivities");
        BigDecimal financing = FmpJson.decimal(node, "netCashUsedProvidedByFinancingActivities", "netCashProvidedByFinancingActivities");
        return new CashFlowStatement(
                operating,
                FmpJson.decimal(node, "depreciationAndAmortization"),
                FmpJson.decimal(node, "stockBasedCompensation"),
                capex,
                firstNonNull(FmpJson.decimal(node, "freeCashFlow"), freeCashFlow(operating, capex)),
                FmpJson.decimal(node, "dividendsPaid", "commonDividendsPaid"),
                FmpJson.decimal(node, "commonStockRepurchased", "commonStockRepurchase"),
                investing,
                financing,
                firstNonNull(FmpJson.decimal(node, "netChangeInCash"), add(add(operating, investing), financing))
        );
    }

    private static BigDecimal freeCashFlow(BigDecimal operating, BigDecimal capex) {
        if (operating == null || capex == null) {
            return null;
        }
        return operating.subtract(capex.abs());
    }

    private static BigDecimal subtract(BigDecimal left, BigDecimal right) {
        if (left == null || right == null) {
            return null;
        }
        return left.subtract(right);
    }

    private static BigDecimal add(BigDecimal left, BigDecimal right) {
        if (left == null) {
            return right;
        }
        if (right == null) {
            return left;
        }
        return left.add(right);
    }

    private static BigDecimal sum(BigDecimal first, BigDecimal second, BigDecimal third) {
        if (first == null && second == null && third == null) {
            return null;
        }
        return add(add(first, second), third);
    }

    private static String issuerKey(String name) {
        return name.toLowerCase(Locale.ROOT)
                .replace("'", " ")
                .replaceAll("[.,]", " ")
                .replaceAll("\\b(inc|incorporated|corp|corporation|ltd|limited|plc|sa|ag|nv|se|co|company)\\b", " ")
                .replaceAll("\\s+", " ")
                .trim();
    }
}
