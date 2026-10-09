package com.heatbudget.dispatch;

import java.math.BigDecimal;

public record DispatchMetrics(int completedOrders, int lateDeliveries, int ridersOverHeatLimit,
                              int softLimitOverrides, BigDecimal deliveryEarnings, BigDecimal pauseCredits,
                              double averageEarningsPerHeatPoint) {
}
