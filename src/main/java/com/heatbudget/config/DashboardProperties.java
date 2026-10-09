package com.heatbudget.config;

import jakarta.validation.constraints.NotBlank;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.validation.annotation.Validated;

@Validated
@ConfigurationProperties(prefix = "heatbudget.dashboard")
public record DashboardProperties(@NotBlank String allowedOrigin) {
}
