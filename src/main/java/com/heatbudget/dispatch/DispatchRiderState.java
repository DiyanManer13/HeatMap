package com.heatbudget.dispatch;

import com.heatbudget.rider.ActivityLevel;
import com.heatbudget.sim.PuneLocation;
import com.heatbudget.sim.SimulatedRider;
import java.math.BigDecimal;
import java.time.Instant;
import java.util.UUID;

final class DispatchRiderState {
    private final UUID riderId;
    private final ActivityLevel activityLevel;
    private PuneLocation location;
    private Instant availableAt;
    private double dose;
    private BigDecimal earnings = BigDecimal.ZERO;
    private BigDecimal pauseCredits = BigDecimal.ZERO;
    private boolean pauseCreditAwarded;

    private DispatchRiderState(SimulatedRider rider, Instant startAt) {
        riderId = rider.id();
        activityLevel = rider.activityLevel();
        location = rider.startingLocation();
        availableAt = startAt;
    }

    static DispatchRiderState from(SimulatedRider rider, Instant startAt) {
        return new DispatchRiderState(rider, startAt);
    }

    UUID riderId() { return riderId; }
    ActivityLevel activityLevel() { return activityLevel; }
    PuneLocation location() { return location; }
    Instant availableAt() { return availableAt; }
    double dose() { return dose; }
    BigDecimal earnings() { return earnings; }
    BigDecimal pauseCredits() { return pauseCredits; }
    boolean pauseCreditAwarded() { return pauseCreditAwarded; }

    void completeDelivery(PuneLocation dropoff, Instant completedAt, double newDose, BigDecimal deliveryFee) {
        location = dropoff;
        availableAt = completedAt;
        dose = newDose;
        earnings = earnings.add(deliveryFee);
    }

    void takeHeatPause(Instant pauseEndsAt, BigDecimal credit) {
        availableAt = pauseEndsAt;
        pauseCredits = pauseCredits.add(credit);
        pauseCreditAwarded = true;
    }
}
