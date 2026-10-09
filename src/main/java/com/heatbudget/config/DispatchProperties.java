package com.heatbudget.config;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.Min;
import java.time.Duration;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.validation.annotation.Validated;

@Validated
@ConfigurationProperties(prefix = "heatbudget.dispatch")
public record DispatchProperties(
        @DecimalMin("1.0") double heatBudgetPoints,
        @DecimalMin("0.01") double warningRatio,
        @Min(1) int expectedDeliveryMinutes,
        Duration heatPauseDuration,
        @DecimalMin("0.0") double pauseCreditShare
) {
}
