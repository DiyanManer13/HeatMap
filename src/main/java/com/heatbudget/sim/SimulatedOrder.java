package com.heatbudget.sim;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.UUID;

public record SimulatedOrder(
        UUID id,
        PuneLocation pickup,
        PuneLocation dropoff,
        Instant createdAt,
        Instant readyAt,
        BigDecimal deliveryFee,
        SimulatedOrderStatus status
) {
}
