package com.heatbudget.sim;

import java.time.Duration;
import java.time.Instant;
import java.util.Objects;

public class VirtualClock {
    private Instant currentTime;

    public VirtualClock(Instant startAt) {
        this.currentTime = Objects.requireNonNull(startAt, "startAt is required");
    }

    public Instant now() {
        return currentTime;
    }

    public Instant advance(Duration duration) {
        if (duration.isNegative()) {
            throw new IllegalArgumentException("Virtual clock cannot move backwards");
        }
        currentTime = currentTime.plus(duration);
        return currentTime;
    }
}
