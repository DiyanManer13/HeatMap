package com.heatbudget.dispatch;

import java.math.BigDecimal;
import java.time.Duration;
import java.time.Instant;

import static org.assertj.core.api.Assertions.assertThat;
import org.junit.jupiter.api.Test;

import com.heatbudget.config.DispatchProperties;
import com.heatbudget.config.SimulationProperties;
import com.heatbudget.sim.SeededScenarioGenerator;
import com.heatbudget.sim.SimulationScenario;

class DispatchEngineTests {
    private final DispatchProperties properties = new DispatchProperties(100, 0.80, 45, Duration.ofMinutes(15), 0.75);
    private final DispatchEngine dispatchEngine = new DispatchEngine(properties, new PauseCreditService(properties), new SimulatedHeatProfile());
    private final SeededScenarioGenerator scenarioGenerator = new SeededScenarioGenerator(
            new SimulationProperties(440026, 300, 2000, Instant.parse("2026-05-01T05:30:00Z")));

    @Test
    void comparisonUsesTheSameOpenOrdersForBothStrategies() {
        SimulationScenario scenario = scenarioGenerator.generate(440026L);
        DispatchComparison comparison = dispatchEngine.compare(scenario);

        assertThat(comparison.baseline().seed()).isEqualTo(comparison.heatAware().seed());
        assertThat(comparison.baseline().metrics().completedOrders()).isEqualTo(comparison.heatAware().metrics().completedOrders());
    }

    @Test
    void heatAwareDispatchKeepsCapsSoftAndTracksEarnings() {
        DispatchResult heatAware = dispatchEngine.runHeatAware(scenarioGenerator.generate(440026L));

        assertThat(heatAware.metrics().completedOrders()).isGreaterThan(0);
        assertThat(heatAware.metrics().deliveryEarnings()).isGreaterThan(BigDecimal.ZERO);
        assertThat(heatAware.metrics().pauseCredits()).isGreaterThanOrEqualTo(BigDecimal.ZERO);
    }

    @Test
    void heatAwareDispatchDoesNotIncreaseLateDeliveriesForTheDefaultSeed() {
        SimulationScenario scenario = scenarioGenerator.generate(440026L);

        DispatchComparison comparison = dispatchEngine.compare(scenario);

        assertThat(comparison.heatAware().metrics().lateDeliveries())
                .isLessThanOrEqualTo(comparison.baseline().metrics().lateDeliveries());
    }
}
