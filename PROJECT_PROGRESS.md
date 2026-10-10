# Pause Pay project progress

## Phase 1 — foundation

Completed Spring Boot, Docker Compose, PostgreSQL/PostGIS, Redis, Flyway, health checks, and Pune configuration.

## Phase 2 — heat core

Completed cached Open-Meteo retrieval, explicit stale-data fallback, WBGT screening estimate, and heat-dose recovery logic.

## Phase 3 — rider tracking

Completed anonymous consented shifts, persisted location/dose history, idempotent pings, GPS-jump rejection, and offline-gap logging.

## Phase 4 — simulator

Completed deterministic Pune riders/orders, restaurant wait times, cancellations, and a virtual clock. A shared seed guarantees fair future comparisons.

## Phase 5 — dispatch comparison

Completed baseline nearest-rider dispatch, heat-aware earnings-per-heat scoring, soft heat caps, pause credits, and comparison metrics.

## Phase 6 — live dashboard contract

Completed SSE comparison updates, aggregate dashboard payloads, and restricted local dashboard CORS support.

## Phase 7 — AWS integration

Completed optional AWS SDK clients, SNS nudge adapter, Bedrock report adapter, Secrets Manager reader, IAM setup documentation, and a deployable Docker image.

## Phase 8 — React dashboard

Completed a responsive light-theme React app with modern typography, English/Hindi language switching, Overview, Rider Safety, and Compliance Report screens, seeded dispatch comparisons, and live SSE aggregate metrics.

## Dynamic dispatch map

Completed an interactive Pune map connected to generated rider markers and pickup/dropoff routes, with baseline-versus-Pause Pay comparison. Candidate places are fetched and cached from OpenStreetMap (benches, drinking-water points, and parks), linked to their OSM records, and explicitly marked unverified; availability and capacity are not inferred. The API reports live, stale, or unavailable source state and does not substitute fabricated locations.

## Local demo profile

Added an H2-based `demo` profile for running the API without Docker. It is for local demonstrations only; production uses PostgreSQL/PostGIS and Redis.

The demo backend uses port `9090` by default to avoid local conflicts with port `8080`; Vite proxies `/api` requests to that port. Both ports can be configured with `SERVER_PORT` and `VITE_API_TARGET`.

## Phase 9 — interactive demo screen

Completed the default live-comparison screen: synchronized Pune baseline and Pause Pay maps, simulated play/pause clock, heat-wave controls, rider-dose markers, order routes, rest-point routing, live counters, event feed, and comparison charts. Selecting a rider opens a phone-style safety panel with English, Hindi, and Marathi choices, route preference controls, rest guidance, soft override, and emergency action.

## Next phases

1. Connect report filters and CSV/PDF export to persisted daily data.
2. Add deployment infrastructure for ECS and managed database services.
