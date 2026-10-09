package com.heatbudget.dispatch;

import java.util.List;

public record DispatchResult(DispatchMode mode, long seed, List<DispatchAssignment> assignments, DispatchMetrics metrics) {
    public DispatchResult {
        assignments = List.copyOf(assignments);
    }
}
