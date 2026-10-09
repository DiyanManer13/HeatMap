package com.heatbudget.dispatch;

import java.time.Instant;

public record DispatchComparisonSummary(long seed, Instant generatedAt, DispatchMetrics baseline, DispatchMetrics heatAware) {
    public static DispatchComparisonSummary from(DispatchComparison comparison, Instant generatedAt) {
        return new DispatchComparisonSummary(comparison.baseline().seed(), generatedAt,
                comparison.baseline().metrics(), comparison.heatAware().metrics());
    }
}
