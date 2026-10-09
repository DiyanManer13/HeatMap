package com.heatbudget.sim;

import java.time.Instant;

public record ScenarioSummary(long seed, Instant startAt, int riderCount, int totalOrderCount, int openOrderCount,
                              int cancelledOrderCount, int totalRestaurantWaitMinutes) {
}
