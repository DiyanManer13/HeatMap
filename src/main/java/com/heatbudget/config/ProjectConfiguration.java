package com.heatbudget.config;

import org.springframework.boot.context.properties.EnableConfigurationProperties;
import org.springframework.context.annotation.Configuration;

@Configuration
@EnableConfigurationProperties({DashboardProperties.class, DispatchProperties.class, ProjectProperties.class, SimulationProperties.class, TrackingProperties.class, WeatherProperties.class})
public class ProjectConfiguration {
}

