package com.heatbudget.rider;

import java.time.Duration;
import java.time.Instant;
import org.springframework.stereotype.Service;

@Service
public class DoseTracker {
    private static final double NEUTRAL_WBGT_CELSIUS = 20.0;
    private static final double COOL_RECOVERY_WBGT_CELSIUS = 26.0;
    private static final double RECOVERY_PER_HOUR = 8.0;

    public DoseState advance(DoseState state, Instant nextMeasurementAt, double wbgtCelsius, ActivityLevel activityLevel) {
        if (nextMeasurementAt.isBefore(state.measuredAt())) {
            throw new IllegalArgumentException("measurements must be chronological");
        }
        Duration elapsed = Duration.between(state.measuredAt(), nextMeasurementAt);
        double hours = elapsed.toSeconds() / 3600.0;
        double nextDose = activityLevel == ActivityLevel.RESTING && wbgtCelsius <= COOL_RECOVERY_WBGT_CELSIUS
                ? Math.max(0, state.dose() - RECOVERY_PER_HOUR * hours)
                : state.dose() + Math.max(0, wbgtCelsius - NEUTRAL_WBGT_CELSIUS) * hours * activityLevel.effortMultiplier();
        return new DoseState(round(nextDose), nextMeasurementAt);
    }

    private double round(double value) {
        return Math.round(value * 100.0) / 100.0;
    }
}
