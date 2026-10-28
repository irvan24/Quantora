package com.quantora.backend.instrument;

import java.util.regex.Pattern;

/**
 * Search-box input, not tickers. Invalid queries become empty results rather than
 * 400s so typeahead does not flash errors while the user is still typing.
 */
public final class InstrumentQueries {

    public static final int MIN_LENGTH = 2;
    public static final int MAX_LENGTH = 64;
    public static final int MAX_RESULTS = 8;

    private static final Pattern QUERY = Pattern.compile("^[\\p{L}\\p{N} .,'&/+\\-]{2,64}$");

    private InstrumentQueries() {
    }

    public static String normalize(String raw) {
        if (raw == null) {
            return null;
        }
        String query = raw.trim().replaceAll("\\s+", " ");
        if (query.length() < MIN_LENGTH || query.length() > MAX_LENGTH || !QUERY.matcher(query).matches()) {
            return null;
        }
        return query;
    }
}
