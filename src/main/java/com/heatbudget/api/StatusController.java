package com.heatbudget.api;

import com.heatbudget.config.ProjectProperties;
import java.util.Map;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1")
public class StatusController {
    private final ProjectProperties projectProperties;

    public StatusController(ProjectProperties projectProperties) {
        this.projectProperties = projectProperties;
    }

    @GetMapping("/status")
    public Map<String, String> status() {
        return Map.of(
                "service", "heatbudget",
                "city", projectProperties.city(),
                "timezone", projectProperties.timezone().getId()
        );
    }
}

