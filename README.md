# Pause Pay

**Rest without losing a rupee.**

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

- `POST /api/v1/dispatch/compare` runs baseline and Pause Pay strategies over the same seeded scenario.
- The response includes completed orders, late deliveries, riders over the heat limit, soft-limit overrides, earnings, pause credits, and earnings per heat point.

## Phase 6: live dashboard contract

- `GET /api/v1/dispatch/events` opens an SSE stream for dashboard updates.
- Each `POST /api/v1/dispatch/compare` sends a `dispatch-comparison` event with aggregate baseline and Pause Pay metrics.
- The default permitted dashboard origin is `http://localhost:5173`; set `DASHBOARD_ALLOWED_ORIGIN` for another local frontend.

## Phase 7: AWS integration

- Optional SNS rest nudges, Bedrock compliance reports, and Secrets Manager access use the AWS SDK for Java v2.
- AWS is disabled by default. See `AWS_SETUP.md` before enabling it in an IAM-enabled deployment.
- Build the deployable container with `docker build -t heatbudget .`.

## Phase 8: React dashboard

1. In `frontend`, run `npm install`.
2. Start the Spring API on port `8080` and run `npm run dev` in `frontend`.
3. Open the local Vite address (normally `http://localhost:5173`).

The dashboard is a clean light UI with English/Hindi switching, a seeded comparison control, live SSE updates, Rider Safety, and Compliance Report screens.

`GET /api/v1/dispatch/map?seed=440026&mode=HEAT_AWARE` supplies simulated riders and routes plus cached OpenStreetMap candidates for benches, drinking-water points, and parks in Pune. These mapped features are not verified as rider facilities and have no asserted capacity or opening status. The response reports whether candidate data is live, stale, or unavailable; no fabricated locations are substituted. OSM data is available under the ODbL.

### Run without Docker

For a frontend demo when Docker/PostgreSQL/Redis are unavailable, start the API with `mvn spring-boot:run -Dspring-boot.run.profiles=demo`. This uses a temporary in-memory H2 database and listens on port `9090`; it does not preserve rider data after the process stops. Set `SERVER_PORT` and `VITE_API_TARGET` together if this port is unavailable.
