package com.heatbudget.config;

import org.springframework.context.annotation.Configuration;
import org.springframework.web.servlet.config.annotation.CorsRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

@Configuration
public class WebConfiguration implements WebMvcConfigurer {
    private final DashboardProperties dashboardProperties;

    public WebConfiguration(DashboardProperties dashboardProperties) {
        this.dashboardProperties = dashboardProperties;
    }

    @Override
    public void addCorsMappings(CorsRegistry registry) {
        registry.addMapping("/api/**")
                .allowedOrigins(dashboardProperties.allowedOrigin())
                .allowedMethods("GET", "POST");
    }
}
