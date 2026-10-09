package com.heatbudget.sim;

import java.time.Instant;
import java.util.List;

public record SimulationScenario(long seed, Instant startAt, List<SimulatedRider> riders, List<SimulatedOrder> orders) {
    public SimulationScenario {
        riders = List.copyOf(riders);
        orders = List.copyOf(orders);
    }
}
