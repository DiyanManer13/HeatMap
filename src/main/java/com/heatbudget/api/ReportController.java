package com.heatbudget.api;

import com.heatbudget.dispatch.DispatchComparison;
import com.heatbudget.dispatch.DispatchComparisonSummary;
import com.heatbudget.dispatch.DispatchEngine;
import com.heatbudget.report.ComplianceReportService;
import com.heatbudget.sim.SeededScenarioGenerator;
import com.heatbudget.sim.SimulationScenario;
import java.time.Instant;
import java.util.Map;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/reports")
public class ReportController {
    private final SeededScenarioGenerator scenarioGenerator;
    private final DispatchEngine dispatchEngine;
    private final ComplianceReportService complianceReportService;

    public ReportController(SeededScenarioGenerator scenarioGenerator, DispatchEngine dispatchEngine,
                            ComplianceReportService complianceReportService) {
        this.scenarioGenerator = scenarioGenerator;
        this.dispatchEngine = dispatchEngine;
        this.complianceReportService = complianceReportService;
    }

    @GetMapping("/daily")
    public Map<String, Object> daily(@RequestParam(required = false) Long seed) {
        SimulationScenario scenario = seed == null ? scenarioGenerator.generateDefault() : scenarioGenerator.generate(seed);
        DispatchComparison comparison = dispatchEngine.compare(scenario);
        DispatchComparisonSummary summary = DispatchComparisonSummary.from(comparison, Instant.now());
        return Map.of("summary", summary, "report", complianceReportService.generate(summary));
    }
}
