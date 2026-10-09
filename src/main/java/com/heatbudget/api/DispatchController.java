package com.heatbudget.api;

import com.heatbudget.dispatch.DispatchComparison;
import com.heatbudget.dispatch.DispatchEngine;
import com.heatbudget.sim.SeededScenarioGenerator;
import com.heatbudget.sim.SimulationScenario;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/dispatch")
public class DispatchController {
    private final SeededScenarioGenerator scenarioGenerator;
    private final DispatchEngine dispatchEngine;

    public DispatchController(SeededScenarioGenerator scenarioGenerator, DispatchEngine dispatchEngine) {
        this.scenarioGenerator = scenarioGenerator;
        this.dispatchEngine = dispatchEngine;
    }

    @PostMapping("/compare")
    public DispatchComparison compare(@RequestParam(required = false) Long seed) {
        SimulationScenario scenario = seed == null ? scenarioGenerator.generateDefault() : scenarioGenerator.generate(seed);
        return dispatchEngine.compare(scenario);
    }
}
