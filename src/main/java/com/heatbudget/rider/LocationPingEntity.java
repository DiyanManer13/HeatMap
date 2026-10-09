package com.heatbudget.rider;

import com.heatbudget.weather.WeatherSource;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.FetchType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "location_pings")
public class LocationPingEntity {
    @Id
    private UUID id;

    @Column(name = "client_event_id", nullable = false, unique = true)
    private UUID clientEventId;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "shift_id", nullable = false)
    private RiderShiftEntity shift;

    @Column(name = "recorded_at", nullable = false)
    private Instant recordedAt;

    @Column(nullable = false)
    private double latitude;

    @Column(nullable = false)
    private double longitude;

    @Enumerated(EnumType.STRING)
    @Column(name = "activity_level", nullable = false)
    private ActivityLevel activityLevel;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private LocationDisposition disposition;

    @Column(name = "dose_after", nullable = false)
    private double doseAfter;

    @Column(name = "heat_score_celsius")
    private Double heatScoreCelsius;

    @Enumerated(EnumType.STRING)
    @Column(name = "weather_source")
    private WeatherSource weatherSource;

    protected LocationPingEntity() {
    }

    private LocationPingEntity(UUID clientEventId, RiderShiftEntity shift, Instant recordedAt, double latitude, double longitude,
                               ActivityLevel activityLevel, LocationDisposition disposition, double doseAfter,
                               Double heatScoreCelsius, WeatherSource weatherSource) {
        this.id = UUID.randomUUID();
        this.clientEventId = clientEventId;
        this.shift = shift;
        this.recordedAt = recordedAt;
        this.latitude = latitude;
        this.longitude = longitude;
        this.activityLevel = activityLevel;
        this.disposition = disposition;
        this.doseAfter = doseAfter;
        this.heatScoreCelsius = heatScoreCelsius;
        this.weatherSource = weatherSource;
    }

    public static LocationPingEntity record(UUID clientEventId, RiderShiftEntity shift, Instant recordedAt, double latitude,
                                             double longitude, ActivityLevel activityLevel, LocationDisposition disposition,
                                             double doseAfter, Double heatScoreCelsius, WeatherSource weatherSource) {
        return new LocationPingEntity(clientEventId, shift, recordedAt, latitude, longitude, activityLevel, disposition,
                doseAfter, heatScoreCelsius, weatherSource);
    }

    public UUID getClientEventId() { return clientEventId; }
    public Instant getRecordedAt() { return recordedAt; }
    public double getLatitude() { return latitude; }
    public double getLongitude() { return longitude; }
    public LocationDisposition getDisposition() { return disposition; }
    public double getDoseAfter() { return doseAfter; }
    public Double getHeatScoreCelsius() { return heatScoreCelsius; }
    public WeatherSource getWeatherSource() { return weatherSource; }
}
