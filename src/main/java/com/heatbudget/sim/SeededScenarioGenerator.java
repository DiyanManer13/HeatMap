package com.heatbudget.sim;

import com.heatbudget.config.SimulationProperties;
import com.heatbudget.rider.ActivityLevel;
import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.Duration;
import java.time.Instant;
import java.util.ArrayList;
import java.util.List;
import java.util.SplittableRandom;
import java.util.UUID;
import org.springframework.stereotype.Service;

@Service
public class SeededScenarioGenerator {
    private static final double MINIMUM_LATITUDE = 18.43;
    private static final double MAXIMUM_LATITUDE = 18.63;
    private static final double MINIMUM_LONGITUDE = 73.75;
    private static final double MAXIMUM_LONGITUDE = 73.95;

    private final SimulationProperties properties;

    public SeededScenarioGenerator(SimulationProperties properties) {
        this.properties = properties;
    }

    public SimulationScenario generateDefault() {
        return generate(properties.defaultSeed(), properties.riderCount(), properties.orderCount(), properties.scenarioStart());
    }

    public SimulationScenario generate(long seed) {
        return generate(seed, properties.riderCount(), properties.orderCount(), properties.scenarioStart());
    }

    SimulationScenario generate(long seed, int riderCount, int orderCount, Instant startAt) {
        SplittableRandom random = new SplittableRandom(seed);
        List<SimulatedRider> riders = new ArrayList<>(riderCount);
        List<SimulatedOrder> orders = new ArrayList<>(orderCount);

        for (int riderIndex = 0; riderIndex < riderCount; riderIndex++) {
            riders.add(new SimulatedRider(nextUuid(random), nextLocation(random), nextActivityLevel(random)));
        }
        for (int orderIndex = 0; orderIndex < orderCount; orderIndex++) {
            orders.add(nextOrder(random, startAt));
        }
        return new SimulationScenario(seed, startAt, riders, orders);
    }

    public ScenarioSummary summarize(SimulationScenario scenario) {
        int cancelledOrders = 0;
        int restaurantWaitMinutes = 0;
        for (SimulatedOrder order : scenario.orders()) {
            if (order.status() == SimulatedOrderStatus.CANCELLED) {
                cancelledOrders++;
            }
            restaurantWaitMinutes += Duration.between(order.createdAt(), order.readyAt()).toMinutes();
        }
        return new ScenarioSummary(scenario.seed(), scenario.startAt(), scenario.riders().size(), scenario.orders().size(),
                scenario.orders().size() - cancelledOrders, cancelledOrders, restaurantWaitMinutes);
    }

    private SimulatedOrder nextOrder(SplittableRandom random, Instant scenarioStart) {
        Instant createdAt = scenarioStart.plus(Duration.ofSeconds(random.nextLong(Duration.ofHours(16).toSeconds())));
        int restaurantWaitMinutes = random.nextInt(4, 13);
        BigDecimal deliveryFee = BigDecimal.valueOf(random.nextDouble(30, 121)).setScale(2, RoundingMode.HALF_UP);
        SimulatedOrderStatus status = random.nextDouble() < 0.05
                ? SimulatedOrderStatus.CANCELLED
                : SimulatedOrderStatus.OPEN;
        return new SimulatedOrder(nextUuid(random), nextLocation(random), nextLocation(random), createdAt,
                createdAt.plus(Duration.ofMinutes(restaurantWaitMinutes)), deliveryFee, status);
    }

    private PuneLocation nextLocation(SplittableRandom random) {
        return new PuneLocation(random.nextDouble(MINIMUM_LATITUDE, MAXIMUM_LATITUDE),
                random.nextDouble(MINIMUM_LONGITUDE, MAXIMUM_LONGITUDE));
    }

    private ActivityLevel nextActivityLevel(SplittableRandom random) {
        double selection = random.nextDouble();
        if (selection < 0.15) {
            return ActivityLevel.WALKING;
        }
        if (selection < 0.45) {
            return ActivityLevel.CYCLING;
        }
        return ActivityLevel.SCOOTER;
    }

    private UUID nextUuid(SplittableRandom random) {
        return new UUID(random.nextLong(), random.nextLong());
    }
}
