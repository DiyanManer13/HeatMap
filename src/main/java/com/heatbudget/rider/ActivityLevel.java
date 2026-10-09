package com.heatbudget.rider;

public enum ActivityLevel {
    WALKING(1.20),
    CYCLING(1.10),
    SCOOTER(1.00),
    RESTING(0.00);

    private final double effortMultiplier;

    ActivityLevel(double effortMultiplier) {
        this.effortMultiplier = effortMultiplier;
    }

    public double effortMultiplier() {
        return effortMultiplier;
    }
}
