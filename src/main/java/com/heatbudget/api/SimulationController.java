package com.heatbudget.api;

import com.heatbudget.sim.ScenarioSummary;
import com.heatbudget.sim.SeededScenarioGenerator;
import com.heatbudget.sim.SimulationScenario;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/sim")
public class SimulationController {
    private final SeededScenarioGenerator scenarioGenerator;

    public SimulationController(SeededScenarioGenerator scenarioGenerator) {
        this.scenarioGenerator = scenarioGenerator;
    }

    @GetMapping("/scenario")
    public ScenarioSummary scenario(@RequestParam(required = false) Long seed) {
        SimulationScenario scenario = seed == null ? scenarioGenerator.generateDefault() : scenarioGenerator.generate(seed);
        return scenarioGenerator.summarize(scenario);
    }
}
