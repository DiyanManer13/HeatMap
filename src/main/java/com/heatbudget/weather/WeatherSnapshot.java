package com.heatbudget.weather;

import java.time.Instant;
import java.util.Objects;

public record WeatherSnapshot(
        Instant observedAt,
        double airTemperatureCelsius,
        double relativeHumidityPercent,
        double windSpeedKph,
        double solarRadiationWattsPerSquareMeter,
        boolean daylight,
        WeatherSource source
) {
    public WeatherSnapshot {
        Objects.requireNonNull(observedAt, "observedAt is required");
        Objects.requireNonNull(source, "source is required");
        if (relativeHumidityPercent < 0 || relativeHumidityPercent > 100) {
            throw new IllegalArgumentException("relativeHumidityPercent must be between 0 and 100");
        }
        if (windSpeedKph < 0 || solarRadiationWattsPerSquareMeter < 0) {
            throw new IllegalArgumentException("weather measurements cannot be negative");
        }
    }

    public WeatherSnapshot asStaleCache() {
        return new WeatherSnapshot(
                observedAt,
                airTemperatureCelsius,
                relativeHumidityPercent,
                windSpeedKph,
                solarRadiationWattsPerSquareMeter,
                daylight,
                WeatherSource.STALE_CACHE
        );
    }
}
