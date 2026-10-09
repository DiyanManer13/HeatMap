package com.heatbudget.weather;

import org.springframework.stereotype.Service;

@Service
public class WbgtCalculator {
    private static final String METHOD = "Weather-variable screening estimate; not clinical WBGT";

    public WbgtEstimate estimate(WeatherSnapshot weather) {
        double waterVapourPressureHpa = weather.relativeHumidityPercent() / 100.0
                * 6.105 * Math.exp((17.27 * weather.airTemperatureCelsius()) / (237.7 + weather.airTemperatureCelsius()));
        double shadedWbgt = 0.567 * weather.airTemperatureCelsius() + 0.393 * waterVapourPressureHpa + 3.94;
        double solarAdjustment = weather.daylight()
                ? Math.min(3.0, weather.solarRadiationWattsPerSquareMeter() / 250.0)
                : 0.0;
        double windRelief = Math.min(1.0, weather.windSpeedKph() / 30.0);
        return new WbgtEstimate(round(shadedWbgt + solarAdjustment - windRelief), METHOD, true);
    }

    private double round(double value) {
        return Math.round(value * 10.0) / 10.0;
    }
}
