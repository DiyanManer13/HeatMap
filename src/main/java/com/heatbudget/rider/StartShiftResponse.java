package com.heatbudget.rider;

import java.time.Instant;
import java.util.UUID;

public record StartShiftResponse(UUID riderId, UUID shiftId, Instant startedAt) {
}
