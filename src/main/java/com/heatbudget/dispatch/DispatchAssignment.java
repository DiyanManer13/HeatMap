package com.heatbudget.dispatch;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.UUID;

public record DispatchAssignment(UUID orderId, UUID riderId, Instant assignedAt, Instant completedAt,
                                 boolean late, boolean softLimitOverride, BigDecimal deliveryFee,
                                 double doseAfter) {
}
