package com.heatbudget.dispatch;

import java.time.Instant;
import java.util.List;

public record DispatchMapResponse(long seed, DispatchMode mode, List<RiderMapMarker> riders,
                                  List<RestPoint> restPoints, String restPointStatus,
                                  Instant restPointsUpdatedAt, List<DeliveryRoute> deliveries) {
    public DispatchMapResponse {
        riders = List.copyOf(riders);
        restPoints = List.copyOf(restPoints);
        deliveries = List.copyOf(deliveries);
    }
}
