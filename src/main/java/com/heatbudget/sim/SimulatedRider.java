package com.heatbudget.sim;

import com.heatbudget.rider.ActivityLevel;
import java.util.UUID;

public record SimulatedRider(UUID id, PuneLocation startingLocation, ActivityLevel activityLevel) {
}
