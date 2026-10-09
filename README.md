<<<<<<< HEAD
# HeatBudget

Heat-fair dispatch engine for delivery riders in Pune.

## Phase 1: local foundation

1. Copy `.env.example` to `.env` and replace local passwords.
2. Start data services: `docker compose --env-file .env up -d`.
3. Start the API: `mvn spring-boot:run`.
4. Check `http://localhost:8080/actuator/health` and `http://localhost:8080/api/v1/status`.

## Phase 2: heat core

- `GET /api/v1/weather/current` fetches Pune weather and returns a clearly labelled WBGT screening estimate.
- The Open-Meteo client caches weather for 15 minutes and only falls back to an explicitly marked stale reading for up to 60 minutes.
- `WbgtCalculator` and `DoseTracker` are backend services ready for the rider-location API in the next phase.

Edge-case requirements are tracked in `EDGE_CASES.md`.

## Phase 3: rider tracking API

- `POST /api/v1/riders/shifts` starts a consented anonymous rider shift.
- `POST /api/v1/riders/{riderId}/location` records an idempotent location ping and updates dose only when data is valid.
- `GET /api/v1/riders/{riderId}/dose` returns the current dose and non-punitive guidance.

## Phase 4: seeded simulator

- `GET /api/v1/sim/scenario` returns the default Pune scenario summary.
- `GET /api/v1/sim/scenario?seed=440026` reproduces exactly the same riders and orders for both dispatch strategies.

## Phase 5: dispatch comparison

- `POST /api/v1/dispatch/compare` runs baseline and HeatBudget strategies over the same seeded scenario.
- The response includes completed orders, late deliveries, riders over the heat limit, soft-limit overrides, earnings, pause credits, and earnings per heat point.
=======
# HeatMap
>>>>>>> 36c135ffa0cb3aabde29aecc749bee74c56738d5
