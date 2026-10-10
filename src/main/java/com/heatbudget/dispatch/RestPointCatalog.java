package com.heatbudget.dispatch;

import java.time.Instant;
import java.util.List;

@FunctionalInterface
public interface RestPointCatalog {
    Snapshot current();

    record Snapshot(List<RestPoint> points, String status, Instant fetchedAt) {
        public Snapshot {
            points = List.copyOf(points);
        }
    }
}
