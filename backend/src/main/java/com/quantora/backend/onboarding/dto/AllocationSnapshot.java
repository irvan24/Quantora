package com.quantora.backend.onboarding.dto;

import jakarta.validation.constraints.AssertTrue;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;

import java.util.stream.Stream;

public record AllocationSnapshot(
        @Min(0) @Max(100) Integer etfs,
        @Min(0) @Max(100) Integer stocks,
        @Min(0) @Max(100) Integer bonds,
        @Min(0) @Max(100) Integer cash
) {
    public boolean isEmpty() {
        return etfs == null && stocks == null && bonds == null && cash == null;
    }

    @AssertTrue(message = "Allocation must be empty or add up to 100%")
    public boolean isCompleteOrEmpty() {
        if (isEmpty()) {
            return true;
        }
        if (Stream.of(etfs, stocks, bonds, cash).anyMatch(value -> value == null)) {
            return false;
        }
        return etfs + stocks + bonds + cash == 100;
    }
}
