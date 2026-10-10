package com.heatbudget.dispatch;

import java.util.ArrayList;
import java.util.Comparator;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;

import org.springframework.stereotype.Service;

import com.heatbudget.sim.SimulatedOrder;
import com.heatbudget.sim.SimulatedRider;
import com.heatbudget.sim.SimulationScenario;

@Service
public class DispatchMapService {
    private final DispatchEngine dispatchEngine;
    private final RestPointCatalog restPointCatalog;

    public DispatchMapService(DispatchEngine dispatchEngine, RestPointCatalog restPointCatalog) {
        this.dispatchEngine = dispatchEngine;
        this.restPointCatalog = restPointCatalog;
    }

    public DispatchMapResponse mapFor(SimulationScenario scenario, DispatchMode mode, int limit) {
        DispatchResult result = mode == DispatchMode.BASELINE
                ? dispatchEngine.runBaseline(scenario)
                : dispatchEngine.runHeatAware(scenario);
        Map<UUID, SimulatedOrder> orders = new HashMap<>();
        for (SimulatedOrder order : scenario.orders()) {
            orders.put(order.id(), order);
        }
        Map<UUID, DispatchAssignment> latestAssignments = new HashMap<>();
        List<DeliveryRoute> deliveries = new ArrayList<>();
        result.assignments().stream()
                .sorted(Comparator.comparing(DispatchAssignment::assignedAt))
                .limit(limit)
                .forEach(assignment -> {
                    SimulatedOrder order = orders.get(assignment.orderId());
                    deliveries.add(new DeliveryRoute(assignment.orderId(), assignment.riderId(), order.pickup(), order.dropoff(),
                            assignment.assignedAt(), assignment.completedAt(), assignment.deliveryFee(), assignment.doseAfter(),
                            assignment.softLimitOverride()));
                    latestAssignments.put(assignment.riderId(), assignment);
                });

        List<RiderMapMarker> riders = scenario.riders().stream()
                .map(rider -> markerFor(rider, latestAssignments.get(rider.id()), orders))
                .toList();
        RestPointCatalog.Snapshot restPoints = restPointCatalog.current();
        return new DispatchMapResponse(scenario.seed(), mode, riders, restPoints.points(), restPoints.status(),
            restPoints.fetchedAt(), deliveries);
    }

    private RiderMapMarker markerFor(SimulatedRider rider, DispatchAssignment assignment, Map<UUID, SimulatedOrder> orders) {
        if (assignment == null) {
            return new RiderMapMarker(rider.id(), rider.startingLocation(), 0, false);
        }
        SimulatedOrder order = orders.get(assignment.orderId());
        return new RiderMapMarker(rider.id(), order.dropoff(), assignment.doseAfter(), assignment.doseAfter() >= 80);
    }
}
