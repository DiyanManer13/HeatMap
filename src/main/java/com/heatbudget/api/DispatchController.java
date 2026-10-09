package com.heatbudget.api;

import com.heatbudget.dispatch.DispatchComparison;
import com.heatbudget.dispatch.DispatchEngine;
import com.heatbudget.dispatch.DispatchUpdatePublisher;
import com.heatbudget.sim.SeededScenarioGenerator;
import com.heatbudget.sim.SimulationScenario;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.servlet.mvc.method.annotation.SseEmitter;

@RestController
@RequestMapping("/api/v1/dispatch")
public class DispatchController {
    private final SeededScenarioGenerator scenarioGenerator;
    private final DispatchEngine dispatchEngine;
    private final DispatchUpdatePublisher dispatchUpdatePublisher;

    public DispatchController(SeededScenarioGenerator scenarioGenerator, DispatchEngine dispatchEngine,
                              DispatchUpdatePublisher dispatchUpdatePublisher) {
        this.scenarioGenerator = scenarioGenerator;
        this.dispatchEngine = dispatchEngine;
        this.dispatchUpdatePublisher = dispatchUpdatePublisher;
    }

    @PostMapping("/compare")
    public DispatchComparison compare(@RequestParam(required = false) Long seed) {
        SimulationScenario scenario = seed == null ? scenarioGenerator.generateDefault() : scenarioGenerator.generate(seed);
        DispatchComparison comparison = dispatchEngine.compare(scenario);
        dispatchUpdatePublisher.publish(comparison);
        return comparison;
    }

    @GetMapping(value = "/events", produces = "text/event-stream")
    public SseEmitter events() {
        return dispatchUpdatePublisher.subscribe();
    }
}
