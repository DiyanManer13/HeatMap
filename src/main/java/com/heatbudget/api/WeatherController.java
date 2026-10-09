package com.heatbudget.api;

import com.heatbudget.weather.WbgtCalculator;
import com.heatbudget.weather.WeatherClient;
import com.heatbudget.weather.WeatherSnapshot;
import java.util.Map;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/weather")
public class WeatherController {
    private final WeatherClient weatherClient;
    private final WbgtCalculator wbgtCalculator;

    public WeatherController(WeatherClient weatherClient, WbgtCalculator wbgtCalculator) {
        this.weatherClient = weatherClient;
        this.wbgtCalculator = wbgtCalculator;
    }

    @GetMapping("/current")
    public Map<String, Object> currentWeather() {
        WeatherSnapshot weather = weatherClient.currentPuneWeather();
        return Map.of("weather", weather, "wbgt", wbgtCalculator.estimate(weather));
    }
}
