package com.heatbudget.weather;

import static org.assertj.core.api.Assertions.assertThat;

import java.time.Instant;
import org.junit.jupiter.api.Test;

class WbgtCalculatorTests {
    private final WbgtCalculator calculator = new WbgtCalculator();

    @Test
    void humidityAndSolarRadiationIncreaseTheScreeningEstimate() {
        WeatherSnapshot mild = new WeatherSnapshot(Instant.parse("2026-05-01T06:00:00Z"), 32, 30, 15, 100, true, WeatherSource.LIVE);
        WeatherSnapshot hotHumid = new WeatherSnapshot(Instant.parse("2026-05-01T06:00:00Z"), 32, 70, 5, 800, true, WeatherSource.LIVE);

        assertThat(calculator.estimate(hotHumid).celsius()).isGreaterThan(calculator.estimate(mild).celsius());
        assertThat(calculator.estimate(hotHumid).estimated()).isTrue();
    }
}
