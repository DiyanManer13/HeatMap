package com.heatbudget.sim;

import static org.assertj.core.api.Assertions.assertThat;

import com.heatbudget.config.SimulationProperties;
import java.time.Instant;
import org.junit.jupiter.api.Test;

class SeededScenarioGeneratorTests {
    private final SeededScenarioGenerator generator = new SeededScenarioGenerator(
            new SimulationProperties(440026, 300, 2000, Instant.parse("2026-05-01T05:30:00Z")));

    @Test
    void sameSeedProducesTheSameScenarioForEveryDispatcher() {
        SimulationScenario firstScenario = generator.generate(101L);
        SimulationScenario secondScenario = generator.generate(101L);

        assertThat(firstScenario).isEqualTo(secondScenario);
        assertThat(firstScenario.riders()).hasSize(300);
        assertThat(firstScenario.orders()).hasSize(2000);
    }

    @Test
    void simulatorModelsRestaurantWaitsAndCancelledOrders() {
        ScenarioSummary summary = generator.summarize(generator.generate(440026L));

        assertThat(summary.totalRestaurantWaitMinutes()).isGreaterThan(0);
        assertThat(summary.cancelledOrderCount()).isGreaterThan(0);
        assertThat(summary.openOrderCount() + summary.cancelledOrderCount()).isEqualTo(2000);
    }
}
