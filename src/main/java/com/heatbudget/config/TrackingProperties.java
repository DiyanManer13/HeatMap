package com.heatbudget.config;

import jakarta.validation.constraints.DecimalMax;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.Min;
import java.time.Duration;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.validation.annotation.Validated;

@Validated
@ConfigurationProperties(prefix = "heatbudget.tracking")
public record TrackingProperties(
        @DecimalMin("0") @DecimalMax("300") double maximumSpeedKph,
        @Min(1) int maximumContinuousGapMinutes,
        Duration maximumLivePingDelay,
        @DecimalMin("-90") @DecimalMax("90") double minimumLatitude,
        @DecimalMin("-90") @DecimalMax("90") double maximumLatitude,
        @DecimalMin("-180") @DecimalMax("180") double minimumLongitude,
        @DecimalMin("-180") @DecimalMax("180") double maximumLongitude
) {
}
