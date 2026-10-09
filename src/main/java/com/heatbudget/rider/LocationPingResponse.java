package com.heatbudget.rider;

import com.heatbudget.weather.WeatherSource;
import java.time.Instant;
import java.util.UUID;

public record LocationPingResponse(UUID clientEventId, Instant recordedAt, LocationDisposition disposition,
                                   double doseAfter, Double heatScoreCelsius, WeatherSource weatherSource) {
}
