package com.heatbudget.dispatch;

import com.heatbudget.sim.PuneLocation;
import java.util.UUID;

public record RiderMapMarker(UUID riderId, PuneLocation location, double dose, boolean onHeatPause) {
}
