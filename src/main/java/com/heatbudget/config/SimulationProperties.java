package com.heatbudget.config;

import jakarta.validation.constraints.Min;
import java.time.Instant;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.validation.annotation.Validated;

@Validated
@ConfigurationProperties(prefix = "heatbudget.simulation")
public record SimulationProperties(
        long defaultSeed,
        @Min(1) int riderCount,
        @Min(1) int orderCount,
        Instant scenarioStart
) {
}
