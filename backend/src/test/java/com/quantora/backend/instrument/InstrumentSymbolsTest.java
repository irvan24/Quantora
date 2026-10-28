package com.quantora.backend.instrument;

import com.quantora.backend.instrument.exception.InvalidInstrumentSymbolException;
import org.junit.jupiter.api.Test;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

class InstrumentSymbolsTest {

    @Test
    void normalizesTickerCaseAndWhitespace() {
        assertThat(InstrumentSymbols.normalize(" aapl ")).isEqualTo("AAPL");
        assertThat(InstrumentSymbols.normalize("BRK.B")).isEqualTo("BRK.B");
        assertThat(InstrumentSymbols.normalize("VWCE.DE")).isEqualTo("VWCE.DE");
    }

    @Test
    void rejectsEmptyAndUnsafeValues() {
        assertThatThrownBy(() -> InstrumentSymbols.normalize(" "))
                .isInstanceOf(InvalidInstrumentSymbolException.class);
        assertThatThrownBy(() -> InstrumentSymbols.normalize("AAPL/../etc"))
                .isInstanceOf(InvalidInstrumentSymbolException.class);
        assertThatThrownBy(() -> InstrumentSymbols.normalize("this-ticker-is-way-too-long"))
                .isInstanceOf(InvalidInstrumentSymbolException.class);
    }

    @Test
    void isValidDoesNotThrow() {
        assertThat(InstrumentSymbols.isValid("aapl")).isTrue();
        assertThat(InstrumentSymbols.isValid("Apple Inc")).isFalse();
        assertThat(InstrumentSymbols.isValid(" ")).isFalse();
    }
}
