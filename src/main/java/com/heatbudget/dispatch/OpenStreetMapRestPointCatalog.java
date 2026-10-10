package com.heatbudget.dispatch;

import java.net.http.HttpClient;
import java.time.Duration;
import java.time.Instant;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.concurrent.atomic.AtomicReference;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.client.JdkClientHttpRequestFactory;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestClient;

import com.fasterxml.jackson.databind.JsonNode;
import com.heatbudget.sim.PuneLocation;

@Component
public class OpenStreetMapRestPointCatalog implements RestPointCatalog {
    private static final Logger LOGGER = LoggerFactory.getLogger(OpenStreetMapRestPointCatalog.class);
    private static final Duration CACHE_TTL = Duration.ofMinutes(15);
    private static final Duration RETRY_DELAY = Duration.ofMinutes(1);
    private static final String QUERY = "[out:json][timeout:12];("
            + "node[\"amenity\"=\"drinking_water\"](18.35,73.65,18.75,74.10);"
            + "node[\"amenity\"=\"bench\"](18.35,73.65,18.75,74.10);"
            + "way[\"amenity\"=\"bench\"](18.35,73.65,18.75,74.10);"
            + "way[\"leisure\"=\"park\"](18.35,73.65,18.75,74.10);"
            + "relation[\"leisure\"=\"park\"](18.35,73.65,18.75,74.10);"
            + ");out center tags 250;";
    private static final List<String> ENDPOINTS = List.of(
            "https://overpass-api.de",
            "https://overpass.kumi.systems"
    );

    private final List<RestClient> clients;
    private final AtomicReference<RestPointCatalog.Snapshot> snapshot = new AtomicReference<>(
            new RestPointCatalog.Snapshot(List.of(), "UNAVAILABLE", null));
    private Instant lastAttemptAt;

    public OpenStreetMapRestPointCatalog(RestClient.Builder builder) {
        this.clients = ENDPOINTS.stream().map(endpoint -> {
            HttpClient httpClient = HttpClient.newBuilder().connectTimeout(Duration.ofSeconds(4)).build();
            JdkClientHttpRequestFactory requestFactory = new JdkClientHttpRequestFactory(httpClient);
            requestFactory.setReadTimeout(Duration.ofSeconds(8));
            return builder.clone()
                    .baseUrl(endpoint)
                    .requestFactory(requestFactory)
                    .defaultHeader("User-Agent", "HeatBudgetHackathon/1.0 (OpenStreetMap candidate data)")
                    .build();
        }).toList();
    }

    @Override
    public synchronized RestPointCatalog.Snapshot current() {
        Instant now = Instant.now();
        RestPointCatalog.Snapshot cached = snapshot.get();
        if ("LIVE_OSM".equals(cached.status()) && cached.fetchedAt() != null
                && Duration.between(cached.fetchedAt(), now).compareTo(CACHE_TTL) < 0) {
            return cached;
        }
        if (lastAttemptAt != null && Duration.between(lastAttemptAt, now).compareTo(RETRY_DELAY) < 0) {
            return cached;
        }
        lastAttemptAt = now;

        for (RestClient client : clients) {
            try {
                JsonNode response = client.get()
                        .uri(uriBuilder -> uriBuilder.path("/api/interpreter").queryParam("data", QUERY).build())
                        .retrieve()
                        .body(JsonNode.class);
                List<RestPoint> points = parseElements(response);
                RestPointCatalog.Snapshot fresh = new RestPointCatalog.Snapshot(points, "LIVE_OSM", now);
                snapshot.set(fresh);
                return fresh;
            } catch (RuntimeException exception) {
                LOGGER.warn("OpenStreetMap rest-point lookup failed: {}", exception.getMessage());
            }
        }

        RestPointCatalog.Snapshot previous = snapshot.get();
        RestPointCatalog.Snapshot fallback = previous.points().isEmpty()
                ? new RestPointCatalog.Snapshot(List.of(), "UNAVAILABLE", null)
                : new RestPointCatalog.Snapshot(previous.points(), "STALE_OSM", previous.fetchedAt());
        snapshot.set(fallback);
        return fallback;
    }

    List<RestPoint> parseElements(JsonNode response) {
        JsonNode elements = response == null ? null : response.path("elements");
        if (elements == null || !elements.isArray()) {
            throw new IllegalArgumentException("OpenStreetMap response did not include elements");
        }

        Map<String, RestPoint> points = new LinkedHashMap<>();
        for (JsonNode element : elements) {
            String type = element.path("type").asText();
            String osmId = element.path("id").asText();
            JsonNode tags = element.path("tags");
            String category = categoryFor(tags);
            if (category == null || osmId.isBlank()) continue;

            JsonNode coordinates = element.has("lat") ? element : element.path("center");
            if (!coordinates.hasNonNull("lat") || !coordinates.hasNonNull("lon")) continue;
            double latitude = coordinates.path("lat").asDouble(Double.NaN);
            double longitude = coordinates.path("lon").asDouble(Double.NaN);
            if (!Double.isFinite(latitude) || !Double.isFinite(longitude)) continue;

            String name = tags.path("name").asText("").trim();
            if (name.isBlank()) name = "Mapped " + category + " (OSM)";
            String id = "osm-" + type + "-" + osmId;
            String url = "https://www.openstreetmap.org/" + type + "/" + osmId;
            points.put(id, new RestPoint(id, name, new PuneLocation(latitude, longitude), category, url, false));
        }
        return new ArrayList<>(points.values());
    }

    private String categoryFor(JsonNode tags) {
        if (tags == null || tags.isMissingNode()) return null;
        if ("drinking_water".equals(tags.path("amenity").asText())) return "Drinking water";
        if ("bench".equals(tags.path("amenity").asText())) return "Bench";
        if ("park".equals(tags.path("leisure").asText())) return "Park";
        return null;
    }
}
