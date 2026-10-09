package com.heatbudget.rider;

import com.heatbudget.config.ProjectProperties;
import com.heatbudget.config.TrackingProperties;
import com.heatbudget.weather.WbgtCalculator;
import com.heatbudget.weather.WbgtEstimate;
import com.heatbudget.weather.WeatherClient;
import com.heatbudget.weather.WeatherSnapshot;
import java.time.Clock;
import java.time.Duration;
import java.time.Instant;
import java.util.UUID;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

@Service
public class RiderTrackingService {
    private final RiderRepository riderRepository;
    private final RiderShiftRepository shiftRepository;
    private final LocationPingRepository pingRepository;
    private final WeatherClient weatherClient;
    private final WbgtCalculator wbgtCalculator;
    private final DoseTracker doseTracker;
    private final ProjectProperties projectProperties;
    private final TrackingProperties trackingProperties;
    private final Clock clock;

    @Autowired
    public RiderTrackingService(RiderRepository riderRepository, RiderShiftRepository shiftRepository,
                                LocationPingRepository pingRepository, WeatherClient weatherClient,
                                WbgtCalculator wbgtCalculator, DoseTracker doseTracker,
                                ProjectProperties projectProperties, TrackingProperties trackingProperties) {
        this(riderRepository, shiftRepository, pingRepository, weatherClient, wbgtCalculator, doseTracker,
                projectProperties, trackingProperties, Clock.systemUTC());
    }

    RiderTrackingService(RiderRepository riderRepository, RiderShiftRepository shiftRepository,
                         LocationPingRepository pingRepository, WeatherClient weatherClient, WbgtCalculator wbgtCalculator,
                         DoseTracker doseTracker, ProjectProperties projectProperties, TrackingProperties trackingProperties,
                         Clock clock) {
        this.riderRepository = riderRepository;
        this.shiftRepository = shiftRepository;
        this.pingRepository = pingRepository;
        this.weatherClient = weatherClient;
        this.wbgtCalculator = wbgtCalculator;
        this.doseTracker = doseTracker;
        this.projectProperties = projectProperties;
        this.trackingProperties = trackingProperties;
        this.clock = clock;
    }

    @Transactional
    public StartShiftResponse startShift(StartShiftRequest request) {
        if (!request.consentAccepted()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Location consent is required before a shift can start");
        }
        Instant now = Instant.now(clock);
        RiderEntity rider = riderRepository.findByAnonymousReference(request.anonymousReference())
                .orElseGet(() -> riderRepository.save(RiderEntity.create(request.anonymousReference(), now)));
        shiftRepository.findByRiderIdAndEndedAtIsNull(rider.getId()).ifPresent(activeShift -> {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "The rider already has an active shift");
        });
        RiderShiftEntity shift = shiftRepository.save(RiderShiftEntity.start(rider, now));
        return new StartShiftResponse(rider.getId(), shift.getId(), now);
    }

    @Transactional
    public LocationPingResponse recordLocation(UUID riderId, LocationPingRequest request) {
        LocationPingEntity duplicate = pingRepository.findByClientEventId(request.clientEventId()).orElse(null);
        if (duplicate != null) {
            return toResponse(duplicate);
        }
        RiderShiftEntity shift = activeShift(riderId);
        if (request.recordedAt().isBefore(shift.getStartedAt())) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Location ping predates the active shift");
        }
        if (!isWithinPuneBounds(request)) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Location ping is outside the Pune demo area");
        }

        LocationPingEntity previous = pingRepository.findFirstByShiftIdAndDispositionOrderByRecordedAtDesc(
                shift.getId(), LocationDisposition.ACCEPTED).orElse(null);
        double priorDose = previous == null ? 0 : previous.getDoseAfter();
        LocationDisposition disposition = dispositionFor(previous, request);
        LocationPingEntity storedPing;

        if (disposition == LocationDisposition.ACCEPTED) {
            WeatherSnapshot weather = weatherClient.currentPuneWeather();
            WbgtEstimate wbgt = wbgtCalculator.estimate(weather);
            Instant doseStart = previous == null ? request.recordedAt() : previous.getRecordedAt();
            DoseState nextDose = doseTracker.advance(new DoseState(priorDose, doseStart), request.recordedAt(),
                    wbgt.celsius(), request.activityLevel());
            storedPing = LocationPingEntity.record(request.clientEventId(), shift, request.recordedAt(), request.latitude(),
                    request.longitude(), request.activityLevel(), disposition, nextDose.dose(), wbgt.celsius(), weather.source());
        } else {
            storedPing = LocationPingEntity.record(request.clientEventId(), shift, request.recordedAt(), request.latitude(),
                    request.longitude(), request.activityLevel(), disposition, priorDose, null, null);
        }
        return toResponse(pingRepository.save(storedPing));
    }

    @Transactional(readOnly = true)
    public RiderDoseResponse currentDose(UUID riderId) {
        RiderShiftEntity shift = activeShift(riderId);
        LocationPingEntity latestPing = pingRepository.findFirstByShiftIdOrderByRecordedAtDesc(shift.getId()).orElse(null);
        double dose = latestPing == null ? 0 : latestPing.getDoseAfter();
        Instant measuredAt = latestPing == null ? shift.getStartedAt() : latestPing.getRecordedAt();
        return new RiderDoseResponse(riderId, shift.getId(), dose, projectProperties.standardBudgetPoints(),
                guidanceFor(dose), measuredAt);
    }

    private RiderShiftEntity activeShift(UUID riderId) {
        if (!riderRepository.existsById(riderId)) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Rider was not found");
        }
        return shiftRepository.findByRiderIdAndEndedAtIsNull(riderId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.CONFLICT, "Rider has no active shift"));
    }

    private LocationDisposition dispositionFor(LocationPingEntity previous, LocationPingRequest request) {
        if (previous == null) {
            return LocationDisposition.ACCEPTED;
        }
        Duration elapsed = Duration.between(previous.getRecordedAt(), request.recordedAt());
        if (elapsed.isNegative()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Location pings must be chronological");
        }
        if (elapsed.compareTo(Duration.ofMinutes(trackingProperties.maximumContinuousGapMinutes())) > 0
                || Duration.between(request.recordedAt(), Instant.now(clock)).compareTo(trackingProperties.maximumLivePingDelay()) > 0) {
            return LocationDisposition.GAP_RECORDED;
        }
        double distanceKm = haversineKilometres(previous.getLatitude(), previous.getLongitude(), request.latitude(), request.longitude());
        double hours = elapsed.toSeconds() / 3600.0;
        if (hours > 0 && distanceKm / hours > trackingProperties.maximumSpeedKph()) {
            return LocationDisposition.GPS_JUMP_REJECTED;
        }
        return LocationDisposition.ACCEPTED;
    }

    private boolean isWithinPuneBounds(LocationPingRequest request) {
        return request.latitude() >= trackingProperties.minimumLatitude()
                && request.latitude() <= trackingProperties.maximumLatitude()
                && request.longitude() >= trackingProperties.minimumLongitude()
                && request.longitude() <= trackingProperties.maximumLongitude();
    }

    private String guidanceFor(double dose) {
        double ratio = dose / projectProperties.standardBudgetPoints();
        if (ratio >= projectProperties.doseSoftLimitRatio()) {
            return "REST_RECOMMENDED_OVERRIDE_ALLOWED";
        }
        if (ratio >= projectProperties.doseWarningRatio()) {
            return "REST_SOON";
        }
        return "ON_TRACK";
    }

    private LocationPingResponse toResponse(LocationPingEntity ping) {
        return new LocationPingResponse(ping.getClientEventId(), ping.getRecordedAt(), ping.getDisposition(), ping.getDoseAfter(),
                ping.getHeatScoreCelsius(), ping.getWeatherSource());
    }

    private double haversineKilometres(double latitudeA, double longitudeA, double latitudeB, double longitudeB) {
        double latitudeDifference = Math.toRadians(latitudeB - latitudeA);
        double longitudeDifference = Math.toRadians(longitudeB - longitudeA);
        double haversine = Math.pow(Math.sin(latitudeDifference / 2), 2)
                + Math.cos(Math.toRadians(latitudeA)) * Math.cos(Math.toRadians(latitudeB))
                * Math.pow(Math.sin(longitudeDifference / 2), 2);
        return 6371.0 * 2 * Math.atan2(Math.sqrt(haversine), Math.sqrt(1 - haversine));
    }
}
