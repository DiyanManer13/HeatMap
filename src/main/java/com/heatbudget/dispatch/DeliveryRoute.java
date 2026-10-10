package com.heatbudget.dispatch;

import com.heatbudget.sim.PuneLocation;
import java.math.BigDecimal;
import java.time.Instant;
import java.util.UUID;

public record DeliveryRoute(UUID orderId, UUID riderId, PuneLocation pickup, PuneLocation dropoff, Instant assignedAt,
                            Instant completedAt, BigDecimal deliveryFee, double doseAfter, boolean heatLimitOverride) {
}
