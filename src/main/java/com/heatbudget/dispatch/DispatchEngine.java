package com.heatbudget.dispatch;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.Duration;
import java.time.Instant;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

import org.springframework.stereotype.Service;

import com.heatbudget.config.DispatchProperties;
import com.heatbudget.rider.ActivityLevel;
import com.heatbudget.sim.PuneLocation;
import com.heatbudget.sim.SimulatedOrder;
import com.heatbudget.sim.SimulatedOrderStatus;
import com.heatbudget.sim.SimulationScenario;

@Service
public class DispatchEngine {
    private static final double SCOOTER_SPEED_KPH = 25.0;

    private final DispatchProperties properties;
    private final PauseCreditService pauseCreditService;
    private final SimulatedHeatProfile heatProfile;

    public DispatchEngine(DispatchProperties properties, PauseCreditService pauseCreditService, SimulatedHeatProfile heatProfile) {
        this.properties = properties;
        this.pauseCreditService = pauseCreditService;
        this.heatProfile = heatProfile;
    }

    public DispatchComparison compare(SimulationScenario scenario) {
        return new DispatchComparison(runBaseline(scenario), runHeatAware(scenario));
    }

    public DispatchResult runBaseline(SimulationScenario scenario) {
        return run(scenario, DispatchMode.BASELINE);
    }

    public DispatchResult runHeatAware(SimulationScenario scenario) {
        return run(scenario, DispatchMode.HEAT_AWARE);
    }

    private DispatchResult run(SimulationScenario scenario, DispatchMode mode) {
        List<DispatchRiderState> riderStates = scenario.riders().stream()
                .map(rider -> DispatchRiderState.from(rider, scenario.startAt()))
                .toList();
        List<DispatchAssignment> assignments = new ArrayList<>();
        scenario.orders().stream()
                .filter(order -> order.status() == SimulatedOrderStatus.OPEN)
                .sorted(Comparator.comparing(SimulatedOrder::createdAt))
                .forEach(order -> assignments.add(assign(order, riderStates, mode)));
        return new DispatchResult(mode, scenario.seed(), assignments, metricsFor(assignments, riderStates));
    }

    private DispatchAssignment assign(SimulatedOrder order, List<DispatchRiderState> riderStates, DispatchMode mode) {
        DispatchRiderState rider = mode == DispatchMode.BASELINE ? nearestRider(order, riderStates) : heatAwareRider(order, riderStates);
        Instant assignedAt = latest(order.createdAt(), rider.availableAt());
        double tripKilometres = distanceKilometres(rider.location(), order.pickup()) + distanceKilometres(order.pickup(), order.dropoff());
        Duration tripDuration = Duration.ofSeconds(Math.max(60, Math.round(tripKilometres / SCOOTER_SPEED_KPH * 3600)));
        Instant completedAt = assignedAt.plus(tripDuration);
        double doseAfter = round(rider.dose() + heatDose(tripDuration, rider.activityLevel(), heatProfile.wbgtAt(assignedAt)));
        boolean softLimitOverride = mode == DispatchMode.HEAT_AWARE && doseAfter > properties.heatBudgetPoints();
        boolean late = completedAt.isAfter(order.createdAt().plus(Duration.ofMinutes(properties.expectedDeliveryMinutes())));
        rider.completeDelivery(order.dropoff(), completedAt, doseAfter, order.deliveryFee());
        if (mode == DispatchMode.HEAT_AWARE && doseAfter >= properties.heatBudgetPoints() * properties.warningRatio()
                && !rider.pauseCreditAwarded()) {
            rider.takeHeatPause(completedAt.plus(properties.heatPauseDuration()), pauseCreditService.creditFor(order.deliveryFee()));
        }
        return new DispatchAssignment(order.id(), rider.riderId(), assignedAt, completedAt, late, softLimitOverride,
                order.deliveryFee(), doseAfter);
    }

    private DispatchRiderState nearestRider(SimulatedOrder order, List<DispatchRiderState> riderStates) {
        return riderStates.stream().min(Comparator.comparingDouble(rider -> distanceKilometres(rider.location(), order.pickup())))
                .orElseThrow();
    }

    private DispatchRiderState heatAwareRider(SimulatedOrder order, List<DispatchRiderState> riderStates) {
        Map<DispatchRiderState, Double> predictedDoses = new HashMap<>();
        for (DispatchRiderState rider : riderStates) {
            double distance = distanceKilometres(rider.location(), order.pickup()) + distanceKilometres(order.pickup(), order.dropoff());
            Duration duration = Duration.ofSeconds(Math.max(60, Math.round(distance / SCOOTER_SPEED_KPH * 3600)));
            double predictedDose = rider.dose() + heatDose(duration, rider.activityLevel(), heatProfile.wbgtAt(latest(order.createdAt(), rider.availableAt())));
            predictedDoses.put(rider, predictedDose);
        }
        return riderStates.stream()
                .filter(rider -> predictedDoses.get(rider) <= properties.heatBudgetPoints())
            .min(Comparator.comparingLong((DispatchRiderState rider) -> projectedLatenessSeconds(order, rider))
                .thenComparing(Comparator.comparingDouble(
                    (DispatchRiderState rider) -> earningsPerAdditionalHeat(order, rider, predictedDoses.get(rider)))
                    .reversed()))
                .orElseGet(() -> riderStates.stream().min(Comparator.comparingDouble(predictedDoses::get)).orElseThrow());
    }

        private long projectedLatenessSeconds(SimulatedOrder order, DispatchRiderState rider) {
        double tripKilometres = distanceKilometres(rider.location(), order.pickup())
            + distanceKilometres(order.pickup(), order.dropoff());
        Duration tripDuration = Duration.ofSeconds(Math.max(60, Math.round(tripKilometres / SCOOTER_SPEED_KPH * 3600)));
        Instant projectedCompletion = latest(order.createdAt(), rider.availableAt()).plus(tripDuration);
        Instant deadline = order.createdAt().plus(Duration.ofMinutes(properties.expectedDeliveryMinutes()));
        return projectedCompletion.isAfter(deadline) ? Duration.between(deadline, projectedCompletion).toSeconds() : 0;
        }

    private double earningsPerAdditionalHeat(SimulatedOrder order, DispatchRiderState rider, double predictedDose) {
        return order.deliveryFee().doubleValue() / Math.max(0.1, predictedDose - rider.dose());
    }

    private DispatchMetrics metricsFor(List<DispatchAssignment> assignments, List<DispatchRiderState> riderStates) {
        int lateDeliveries = (int) assignments.stream().filter(DispatchAssignment::late).count();
        int ridersOverHeatLimit = (int) riderStates.stream().filter(rider -> rider.dose() > properties.heatBudgetPoints()).count();
        int overrides = (int) assignments.stream().filter(DispatchAssignment::softLimitOverride).count();
        BigDecimal earnings = riderStates.stream().map(DispatchRiderState::earnings).reduce(BigDecimal.ZERO, BigDecimal::add);
        BigDecimal pauseCredits = riderStates.stream().map(DispatchRiderState::pauseCredits).reduce(BigDecimal.ZERO, BigDecimal::add);
        double totalDose = riderStates.stream().mapToDouble(DispatchRiderState::dose).sum();
        return new DispatchMetrics(assignments.size(), lateDeliveries, ridersOverHeatLimit, overrides, earnings, pauseCredits,
                totalDose == 0 ? 0 : round(earnings.doubleValue() / totalDose));
    }

    private Instant latest(Instant first, Instant second) { return first.isAfter(second) ? first : second; }

    private double heatDose(Duration duration, ActivityLevel activityLevel, double wbgtCelsius) {
        return Math.max(0, wbgtCelsius - 20) * (duration.toSeconds() / 3600.0) * activityLevel.effortMultiplier();
    }

    private double distanceKilometres(PuneLocation first, PuneLocation second) {
        double latitudeDifference = Math.toRadians(second.latitude() - first.latitude());
        double longitudeDifference = Math.toRadians(second.longitude() - first.longitude());
        double haversine = Math.pow(Math.sin(latitudeDifference / 2), 2)
                + Math.cos(Math.toRadians(first.latitude())) * Math.cos(Math.toRadians(second.latitude()))
                * Math.pow(Math.sin(longitudeDifference / 2), 2);
        return 6371.0 * 2 * Math.atan2(Math.sqrt(haversine), Math.sqrt(1 - haversine));
    }

    private double round(double value) { return BigDecimal.valueOf(value).setScale(2, RoundingMode.HALF_UP).doubleValue(); }
}
