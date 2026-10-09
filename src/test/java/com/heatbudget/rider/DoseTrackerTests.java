package com.heatbudget.rider;

import static org.assertj.core.api.Assertions.assertThat;

import java.time.Instant;
import org.junit.jupiter.api.Test;

class DoseTrackerTests {
    private final DoseTracker doseTracker = new DoseTracker();

    @Test
    void hotActivityAccumulatesDoseAndCoolRestRecoversIt() {
        DoseState initial = new DoseState(10, Instant.parse("2026-05-01T06:00:00Z"));
        DoseState afterDelivery = doseTracker.advance(initial, Instant.parse("2026-05-01T07:00:00Z"), 32, ActivityLevel.CYCLING);
        DoseState afterRest = doseTracker.advance(afterDelivery, Instant.parse("2026-05-01T07:30:00Z"), 24, ActivityLevel.RESTING);

        assertThat(afterDelivery.dose()).isGreaterThan(initial.dose());
        assertThat(afterRest.dose()).isLessThan(afterDelivery.dose());
    }
}
