package com.heatbudget.config;

import org.springframework.boot.context.properties.EnableConfigurationProperties;
import org.springframework.context.annotation.Configuration;

@Configuration
@EnableConfigurationProperties({ProjectProperties.class, TrackingProperties.class, WeatherProperties.class})
public class ProjectConfiguration {
}

