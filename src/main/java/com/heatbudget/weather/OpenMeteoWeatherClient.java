package com.heatbudget.weather;

import com.fasterxml.jackson.annotation.JsonProperty;
import com.github.benmanes.caffeine.cache.Cache;
import com.github.benmanes.caffeine.cache.Caffeine;
import com.heatbudget.config.WeatherProperties;
import java.time.Clock;
import java.time.Duration;
import java.time.Instant;
import java.time.LocalDateTime;
import java.time.ZoneOffset;
import java.util.Objects;
import org.springframework.http.MediaType;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestClient;

@Component
public class OpenMeteoWeatherClient implements WeatherClient {
    private static final String CACHE_KEY = "pune-current";
    private static final String CURRENT_FIELDS = "temperature_2m,relative_humidity_2m,wind_speed_10m,shortwave_radiation,is_day";

    private final WeatherProperties properties;
    private final RestClient restClient;
    private final Clock clock;
    private final Cache<String, WeatherSnapshot> weatherCache;
    private volatile WeatherSnapshot lastSuccessfulSnapshot;

    @Autowired
    public OpenMeteoWeatherClient(WeatherProperties properties) {
        this(properties, RestClient.builder().baseUrl(properties.baseUrl()).build(), Clock.systemUTC());
    }

    OpenMeteoWeatherClient(WeatherProperties properties, RestClient restClient, Clock clock) {
        this.properties = properties;
        this.restClient = restClient;
        this.clock = clock;
        this.weatherCache = Caffeine.newBuilder()
                .expireAfterWrite(Duration.ofMinutes(properties.cacheMinutes()))
                .maximumSize(1)
                .build();
    }

    @Override
    public WeatherSnapshot currentPuneWeather() {
        WeatherSnapshot cachedWeather = weatherCache.getIfPresent(CACHE_KEY);
        if (cachedWeather != null) {
            return cachedWeather;
        }

        try {
            OpenMeteoResponse response = restClient.get()
                    .uri(uriBuilder -> uriBuilder
                            .path("/v1/forecast")
                            .queryParam("latitude", properties.latitude())
                            .queryParam("longitude", properties.longitude())
                            .queryParam("current", CURRENT_FIELDS)
                            .queryParam("timezone", "GMT")
                            .build())
                    .accept(MediaType.APPLICATION_JSON)
                    .retrieve()
                    .body(OpenMeteoResponse.class);
            WeatherSnapshot liveSnapshot = toSnapshot(response);
            weatherCache.put(CACHE_KEY, liveSnapshot);
            lastSuccessfulSnapshot = liveSnapshot;
            return liveSnapshot;
        } catch (RuntimeException exception) {
            return staleSnapshotOrThrow(exception);
        }
    }

    private WeatherSnapshot toSnapshot(OpenMeteoResponse response) {
        if (response == null || response.current() == null) {
            throw new IllegalStateException("Open-Meteo returned no current weather");
        }

        CurrentWeather current = response.current();
        return new WeatherSnapshot(
                LocalDateTime.parse(current.time()).toInstant(ZoneOffset.UTC),
                current.temperature2m(),
                current.relativeHumidity2m(),
                current.windSpeed10m(),
                current.shortwaveRadiation(),
                current.isDay() == 1,
                WeatherSource.LIVE
        );
    }

    private WeatherSnapshot staleSnapshotOrThrow(RuntimeException exception) {
        WeatherSnapshot snapshot = lastSuccessfulSnapshot;
        if (snapshot != null && snapshot.observedAt().plus(Duration.ofMinutes(properties.maximumStaleMinutes()))
                .isAfter(Instant.now(clock))) {
            return snapshot.asStaleCache();
        }
        throw new WeatherUnavailableException("Weather data is unavailable and no safe fallback exists", exception);
    }

    private record OpenMeteoResponse(CurrentWeather current) {
    }

    private record CurrentWeather(
            String time,
            @JsonProperty("temperature_2m") double temperature2m,
            @JsonProperty("relative_humidity_2m") double relativeHumidity2m,
            @JsonProperty("wind_speed_10m") double windSpeed10m,
            @JsonProperty("shortwave_radiation") double shortwaveRadiation,
            @JsonProperty("is_day") int isDay
    ) {
        private CurrentWeather {
            Objects.requireNonNull(time, "time is required");
        }
    }
}
