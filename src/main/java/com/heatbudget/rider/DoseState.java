package com.heatbudget.rider;

import java.time.Instant;
import java.util.Objects;

public record DoseState(double dose, Instant measuredAt) {
    public DoseState {
        if (dose < 0) {
            throw new IllegalArgumentException("dose cannot be negative");
        }
        Objects.requireNonNull(measuredAt, "measuredAt is required");
    }
}
