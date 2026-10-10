package com.heatbudget.dispatch;

import java.time.Duration;
import java.time.Instant;
import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;
import org.junit.jupiter.api.Test;

import com.heatbudget.config.DispatchProperties;
import com.heatbudget.config.SimulationProperties;
import com.heatbudget.sim.PuneLocation;
import com.heatbudget.sim.SeededScenarioGenerator;

class DispatchMapServiceTests {
    @Test
    void mapDataHasRidersRoutesAndOsmCandidateMetadata() {
        DispatchProperties properties = new DispatchProperties(100, 0.80, 45, Duration.ofMinutes(15), 0.75);
        DispatchEngine engine = new DispatchEngine(properties, new PauseCreditService(properties), new SimulatedHeatProfile());
        SeededScenarioGenerator generator = new SeededScenarioGenerator(
                new SimulationProperties(440026, 300, 2000, Instant.parse("2026-05-01T05:30:00Z")));

        RestPoint candidate = new RestPoint("osm-node-42", "Mapped drinking water", new PuneLocation(18.52, 73.85),
            "Drinking water", "https://www.openstreetmap.org/node/42", false);
        RestPointCatalog catalog = () -> new RestPointCatalog.Snapshot(List.of(candidate), "LIVE_OSM", Instant.now());
        DispatchMapResponse response = new DispatchMapService(engine, catalog)
            .mapFor(generator.generate(440026L), DispatchMode.HEAT_AWARE, 20);

        assertThat(response.riders()).hasSize(300);
        assertThat(response.deliveries()).hasSize(20);
        assertThat(response.restPoints()).containsExactly(candidate);
        assertThat(response.restPointStatus()).isEqualTo("LIVE_OSM");
        assertThat(response.restPointsUpdatedAt()).isNotNull();
    }
}
