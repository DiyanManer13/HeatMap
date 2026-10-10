# HeatBudget

### Algorithm-driven heat protection and "Pause Pay" for delivery fleets

> Same orders. Same weather. Fewer riders pushed past a safe heat limit.

![Side-by-side dispatch comparison](assets/comparison.jpg)

---

## Table of Contents

- [Problem Statement](#problem-statement)
- [Objective](#objective)
- [Solution Overview](#solution-overview)
- [Key Features](#key-features)
- [Screenshots](#screenshots)
- [Technical Architecture and Stack](#technical-architecture-and-stack)
- [API Specification and Engineering Phases](#api-specification-and-engineering-phases)
- [Setup and Run](#setup-and-run)
- [Limitations and Next Steps](#limitations-and-next-steps)

---

## Problem Statement

Think about a delivery rider on a 44°C afternoon in Pune.

They have been on the road since morning. They are paid per delivery, so there is no salary and no paid break. When the phone buzzes with an order, they take it, because declining or going offline can mean losing incentives and income they were counting on. Much of their day is not even spent riding. They stand outside restaurants in direct sun, waiting for food to be packed, and that waiting time is unpaid.

Heat does not hit all at once. It builds through the shift as fatigue, dizziness and dehydration. Riders carry on, often until something goes wrong.

Today's tools do not help. Weather apps say "it's hot." Dispatch systems assign the nearest rider and never ask how much heat that rider has already absorbed. Rest points are fixed locations that do not adapt to who needs them right now. Rules on outdoor work (Maharashtra's SOPs, Karnataka's 2025 gig workers Act) exist, but there is no practical way to apply them during dispatch, or to check afterwards whether they were followed.

The result is a choice no worker should have to make: protect your health or protect your income.

## Objective

Make safety and earnings work together instead of against each other. HeatBudget treats heat as a budget:

1. **Track what actually builds up.** Estimate each rider's cumulative heat dose over the shift, not just the temperature at one moment.
2. **Cut the heat that earns nothing.** Reduce unpaid time in the sun by guiding riders to shaded waiting spots.
3. **Share heat fairly.** Assign orders and routes to reduce total exposure while keeping earnings and delivery times close to normal.
4. **Make rest affordable.** Guide riders to the nearest rest point and calculate a Pause Pay credit so resting does not mean losing income. Limits are soft: the rider stays in control and can choose to keep working.
5. **Help when it matters.** Alert fleet managers when a rider reaches their limit or presses SOS.
6. **Make safety checkable.** Generate aggregate compliance reports for platforms and regulators, with rider-level data kept private.

**Success metric:** fewer riders over the heat limit at similar earnings and delivery time, compared with baseline nearest-rider dispatch on the same seeded day.

**What this is not:** a medical device or a replacement for rest and hydration. It is a decision-support tool that helps platforms make safer choices.

## Solution Overview

HeatBudget is a dispatch interceptor that monitors rider heat exposure. When a rider approaches a critical limit, the engine reroutes them to shaded zones and calculates a financial **Pause Pay** micro-incentive to offset the income lost while resting.

A seeded simulator replays the same day twice, once with baseline nearest-rider dispatch and once with HeatBudget dispatch, so the difference comes from the algorithm alone.

## Key Features

| Feature | What it does |
|---|---|
| **Rider View** | Mobile UI showing live heat dose, route shading, and nearby rest stops |
| **Dispatch Comparison** | Dual simulation of baseline dispatch vs. HeatBudget algorithm-assisted dispatch |
| **Pause Pay** | Calculates financial incentives based on time spent in a designated rest geofence |
| **SOS Alerts** | Manual and automated emergency triggers that push alerts to Fleet Managers |
| **Reports** | Dashboard generating aggregate KPI compliance reports |
| **Multilingual UI** | English and Hindi switching |

## Screenshots

### Dispatch comparison (judges' view)
![Baseline vs HeatBudget dispatch comparison](assets/comparison.jpg)

### Rider view

| Waiting for pickup | Time to rest |
|:---:|:---:|
| ![Rider pickup screen](assets/rider-pickup.jpg) | ![Rider rest screen](assets/rider-rest.jpg) |
| Heat-aware guidance to a shaded waiting spot | Nearest rest point with Pause Pay amount |

---

## Technical Architecture and Stack

![HeatBudget architecture diagram](assets/architecture.jpg)

### 1. Frontend and Simulation (React / TypeScript)

- **Framework:** React 18 with TypeScript, bundled via Vite.
- **Mapping:** `react-leaflet` rendering OpenStreetMap raster tiles, with OSRM fetching real-world road geometries.
- **Simulation:** a 60 ms React `useEffect` animation loop that calculates `[lat, lng]` coordinates along the OSRM polyline.
- **Fallback strategy:** an interception layer serves client-side mock JSON data when the backend is offline.

### 2. Cloud Integrations (Amazon Web Services)

- **AWS Amplify:** frontend static hosting and CDN.
- **Amazon Location Service:** active HTTP verification pings to authenticate API keys.
- **Amazon SNS:** executes a `PublishCommand` to trigger real-time email alerts to Fleet Managers (see [Limitations](#limitations-and-next-steps) regarding frontend execution).

### 3. Backend (Java / Spring Boot)

- **Framework:** Java 17 and Spring Boot 3.4.
- **Database:** PostgreSQL with Flyway for automated schema migrations.
- **Caching:** Redis and Caffeine for weather and spatial lookups.
- **Testing and demo mode:** H2 in-memory database.
- **Status:** core REST endpoints and schema migrations are initialized in the repository.

---

## API Specification and Engineering Phases

The core dispatch engine was developed across 8 backend phases.

| Phase | Name | Details |
|---|---|---|
| 1 | Local Foundation | Docker environment and Spring Boot API. Health endpoint: `GET /api/v1/status` |
| 2 | Heat Core | `GET /api/v1/weather/current` fetches Pune weather via a 15-minute cached Open-Meteo client and returns a clearly labelled WBGT screening estimate. Backed by `WbgtCalculator` and `DoseTracker` |
| 3 | Rider Tracking API | `POST /api/v1/riders/shifts` starts consented anonymous tracking. `POST /api/v1/riders/{riderId}/location` records idempotent pings. `GET /api/v1/riders/{riderId}/dose` returns current heat dose and non-punitive guidance |
| 4 | Seeded Simulator | `GET /api/v1/sim/scenario?seed=440026` deterministically reproduces the same riders and orders for testing both dispatch strategies |
| 5 | Dispatch Comparison | `POST /api/v1/dispatch/compare` runs Baseline vs. Pause Pay logic over the scenario and returns completed orders, late deliveries, soft-limit overrides, and earnings per heat point |
| 6 | Live Dashboard Contract | `GET /api/v1/dispatch/events` opens an SSE stream for real-time dashboard updates on every dispatch comparison |
| 7 | AWS Integration | Optional SNS rest nudges, Bedrock compliance reports, and Secrets Manager via AWS SDK for Java v2 |
| 8 | React Dashboard | Light UI with English/Hindi switching, seeded comparison control, live SSE updates, Rider Safety and Compliance Report screens. `GET /api/v1/dispatch/map?seed=440026&mode=HEAT_AWARE` supplies simulated riders plus cached OpenStreetMap candidates for benches and drinking-water points in Pune |

---

## Setup and Run

### Prerequisites

- Java 17
- Maven 3.9+
- Node.js 18+
- Docker (optional, for PostgreSQL and Redis)

### 1. Backend with Docker (PostgreSQL + Redis)

1. Copy `.env.example` to `.env` and replace the local passwords.
2. Start the data services:
   ```bash
   docker compose --env-file .env up -d
   ```
3. Start the API:
   ```bash
   mvn spring-boot:run
   ```

### 1b. Backend without Docker (demo mode)

If Docker, PostgreSQL or Redis are unavailable, run the API with an in-memory H2 database:

```bash
mvn spring-boot:run -Dspring-boot.run.profiles=demo
```

> This listens on port `9090` and does not keep rider data after the process stops.

### 2. Frontend

```bash
cd frontend
npm install
```

Create `frontend/.env`:

```env
VITE_AWS_ACCESS_KEY_ID=your_access_key
VITE_AWS_SECRET_ACCESS_KEY=your_secret_key
VITE_AWS_REGION=ap-south-1
VITE_AWS_LOCATION_KEY=your_location_service_api_key
```

Start the UI:

```bash
npm run dev
```

> **Never commit `.env` files.** Make sure `.env` is listed in `.gitignore`, and use a publish-only IAM user on a throwaway SNS topic for the demo.

### 3. Quick check

- API health: `http://localhost:9090/api/v1/status` (demo mode)
- Seeded comparison: open the dashboard and press **Play** on seed `440026`

---

## Limitations and Next Steps

**Current limitations (honest list)**

- **Frontend SNS credentials:** for this demo, we used a tightly scoped, publish-only IAM user on a throwaway topic in the Vite frontend. Anything in a Vite `.env` is bundled into the browser, so this is demo-only. In production, SNS moves behind the backend or an API Gateway + Lambda layer.
- **Mock data fallbacks:** if the Spring Boot backend is offline, the frontend intentionally intercepts API calls and falls back to client-side mock data so the simulation UI can still be demonstrated.
- **Simulated orders:** riders and orders are generated by a seeded simulator. Weather data is real, the order stream is not.
- **Heat dose math:** the current simulation uses a simplified linear accumulation model. WBGT values are screening estimates, not measurements.
- **Map tiles:** we used OpenStreetMap raster tiles because `react-leaflet` does not natively support AWS Location Service vector tiles.
- **Decision support only:** HeatBudget is not a medical device and makes no diagnosis.

**Next steps**

- Move SNS and all AWS calls behind the backend.
- Implement a cumulative dose model with decay and recovery.
- Validate WBGT thresholds with occupational health experts.
- Pilot with anonymized real order patterns from a rider union or platform partner.
- Add a rider-side companion mode to cover riders working across multiple platforms.
- Keep platform reports aggregate-only, with rider-level dose visible only to the rider.

---

## Sources

- Newslaundry, "Piping hot: India's delivery economy runs on worker heat stress" (May 2026)
- South First, "Heatwave warnings, but no relief" (2026)
- WRI India, "Rising heat's invisible burden on delivery workers"
- Rest of World, "India heat wave delivery workers" (2024)
