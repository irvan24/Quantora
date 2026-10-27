package com.quantora.backend.instrument;

import org.junit.jupiter.api.Test;

import static org.assertj.core.api.Assertions.assertThat;

class InstrumentQueriesTest {

    @Test
    void trimsAndCollapsesWhitespace() {
        assertThat(InstrumentQueries.normalize("  Apple   Inc ")).isEqualTo("Apple Inc");
    }

    @Test
    void rejectsTooShortUnsafeOrBlank() {
        assertThat(InstrumentQueries.normalize("A")).isNull();
        assertThat(InstrumentQueries.normalize(" ")).isNull();
        assertThat(InstrumentQueries.normalize("Apple<script>")).isNull();
        assertThat(InstrumentQueries.normalize("a".repeat(65))).isNull();
    }

    @Test
    void acceptsNamesAndTickers() {
        assertThat(InstrumentQueries.normalize("Apple")).isEqualTo("Apple");
        assertThat(InstrumentQueries.normalize("BRK.B")).isEqualTo("BRK.B");
        assertThat(InstrumentQueries.normalize("L'Oréal")).isEqualTo("L'Oréal");
        assertThat(InstrumentQueries.normalize("AT&T")).isEqualTo("AT&T");
    }
}
