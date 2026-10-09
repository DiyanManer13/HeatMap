package com.heatbudget.config;

import jakarta.validation.constraints.DecimalMax;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import java.time.LocalTime;
import java.time.ZoneId;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.validation.annotation.Validated;

@Validated
@ConfigurationProperties(prefix = "heatbudget")
public record ProjectProperties(
        @NotBlank String city,
        @NotNull ZoneId timezone,
        @DecimalMin("0.01") @DecimalMax("1.00") double doseWarningRatio,
        @DecimalMin("0.01") @DecimalMax("1.00") double doseSoftLimitRatio,
        @DecimalMin("1.0") double standardBudgetPoints,
        @Min(1) int rawLocationRetentionHours,
        @Min(1) int smallGroupSuppressionThreshold,
        @NotNull LocalTime dailyBudgetResetTime
) {
}

