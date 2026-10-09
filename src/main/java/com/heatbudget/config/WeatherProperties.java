package com.heatbudget.config;

import jakarta.validation.constraints.DecimalMax;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import java.time.Duration;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.validation.annotation.Validated;

@Validated
@ConfigurationProperties(prefix = "heatbudget.weather")
public record WeatherProperties(
        @NotBlank String baseUrl,
        @DecimalMin("-90") @DecimalMax("90") double latitude,
        @DecimalMin("-180") @DecimalMax("180") double longitude,
        @Min(1) int cacheMinutes,
        @Min(1) int maximumStaleMinutes,
        Duration requestTimeout
) {
}
