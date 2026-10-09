package com.heatbudget.rider;

import jakarta.validation.constraints.DecimalMax;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotNull;
import java.time.Instant;
import java.util.UUID;

public record LocationPingRequest(
        @NotNull UUID clientEventId,
        @NotNull Instant recordedAt,
        @DecimalMin("-90") @DecimalMax("90") double latitude,
        @DecimalMin("-180") @DecimalMax("180") double longitude,
        @NotNull ActivityLevel activityLevel
) {
}
