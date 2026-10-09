# HeatBudget project progress

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

## Next phases

1. Add live updates and dashboard API contracts.
2. Add AWS integrations: Secrets Manager, SNS, Bedrock, and deployment configuration.
