package com.quantora.backend.instrument;

import com.quantora.backend.instrument.exception.InvalidInstrumentSymbolException;

import java.util.Locale;
import java.util.regex.Pattern;

public final class InstrumentSymbols {

    private static final Pattern SYMBOL = Pattern.compile("^[A-Z0-9][A-Z0-9.\\-]{0,11}$");

    private InstrumentSymbols() {
    }

    public static String normalize(String raw) {
        if (!isValid(raw)) {
            throw new InvalidInstrumentSymbolException();
        }
        return raw.trim().toUpperCase(Locale.ROOT);
    }

    public static boolean isValid(String raw) {
        if (raw == null || raw.isBlank()) {
            return false;
        }
        return SYMBOL.matcher(raw.trim().toUpperCase(Locale.ROOT)).matches();
    }
}
