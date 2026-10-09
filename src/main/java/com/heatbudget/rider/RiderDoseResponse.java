package com.heatbudget.rider;

import java.time.Instant;
import java.util.UUID;

public record RiderDoseResponse(UUID riderId, UUID shiftId, double dose, double budget, String guidance, Instant measuredAt) {
}
