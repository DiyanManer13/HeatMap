# Pause Pay

**Rest without losing a rupee.**

**A heat-fair dispatch engine for delivery riders**
Track: Heat and Water | Software only, no hardware | Backend: Spring Boot (Java)

---

## 1. What we are making (simple words)

### The problem
Delivery riders work outdoors 10-12 hours a day, even at 45°C. They are paid **per delivery**, so every minute of rest is unpaid. Apps reward them for staying online in the afternoon and penalize cancelled orders, so breaks cost money. Heat warnings only say "it is hot today." They don't track how much heat a rider has already absorbed, and heat stress builds up through a shift.

### Our solution
Every rider gets a **daily heat budget**, like a calorie budget but for heat. The app adds up each rider's heat exposure during the shift. A dispatch engine then uses it to:

1. **Cut unpaid sun time first.** Time riders to arrive when the food is ready, and send them to shaded waiting spots. This reduces heat without reducing paid deliveries.
2. **Assign smarter.** Maximize rider earnings *subject to a heat cap*. In hot hours, prefer short, high-value orders and avoid long trips into the hottest wards.
3. **Route smarter.** Prefer shaded and cooler routes.
4. **Rest safely.** At 80% of the budget, nudge the rider to a nearby rest point. A small **heat pause credit** replaces roughly what they would have earned, so resting isn't a financial loss.
5. **Prove it.** Produce an aggregate compliance report for platforms, unions and regulators.

### One-line pitch
> Pause Pay helps delivery riders rest without losing a rupee by making dispatch heat-aware.

---

## 2. Why this problem (research)

- India had 7.7 million gig workers in 2020-21, projected to reach 23 million by 2029-30.
- Platforms offer incentives for staying available during peak afternoon hours and penalize cancelled orders, which makes breaks difficult.
- In April 2026, the Indian Federation of App-Based Transport Workers (IFAT) wrote to the Labour Ministry asking for binding heat protections. Their asks included safeguards against penalties, ID blocks or reduced incentives when workers pause due to heat, plus in-app distress systems and flexible work timings.
- Maharashtra introduced SOPs for outdoor informal workers with staggered hours, compulsory rest breaks, shaded rest areas and hydration support. Karnataka's Platform Based Gig Workers Act, 2025 (Section 16) requires aggregators to provide safe working conditions.
- Zomato says it has 450 rest points. These are static and don't adapt to a rider's exposure.
- Riders report fatigue, dizziness and dehydration, and describe cumulative stress.

**Novelty note:** we found no existing tool that uses cumulative heat exposure to drive dispatch, and no tool that measures compliance with these rules. We can't prove none exists. **To do before the pitch:** search Indian app stores and recent news for similar products.

---

## 3. How it works

1. **Heat map.** Pull hourly temperature, humidity, wind and solar radiation. Estimate a heat stress score (WBGT) per area per hour.
2. **Shade adjustment.** Adjust scores using OpenStreetMap data (tree cover, road width, building shade).
3. **Dose tracker.** Follow each rider's location during their shift. Dose = heat score x time x effort level, with recovery when resting or in cooler conditions.
4. **Dispatch engine.** Maximize earnings and on-time delivery with a heat cap per rider.
5. **Rest nudges.** Alerts in Hindi, Marathi or English (app, SMS or voice) guiding the rider to the nearest rest point.
6. **Compliance report.** Daily aggregate: exposure distribution, breaches, pause credits paid, earnings impact.

### Key metric
**Earnings per unit of heat**, compared between baseline dispatch (nearest rider) and Pause Pay dispatch.

---

## 4. Tech and tools (Spring Boot stack)

Spring Boot runs the whole backend: heat model, dose tracker, dispatch engine, simulator and APIs. Only the dashboard is a separate frontend.

| Part | Tool | Purpose |
|---|---|---|
| Backend framework | Spring Boot 3 (Java 17+), Spring Web, Spring Scheduling | APIs, scheduled engine runs, simulator clock |
| Weather data | Open-Meteo or ERA5 (free) via Spring `WebClient`, cached with Caffeine or Redis | Hourly temperature, humidity, wind, solar radiation |
| Map and shade data | OpenStreetMap extract of the demo city | Roads, tree cover, buildings, rest points |
| Shade-aware routing | GraphHopper (Java) with a custom model that penalizes hot or unshaded roads | Cooler routes |
| Heat model | Plain Java service classes (`WbgtCalculator`, `DoseTracker`) | WBGT estimate and dose with recovery |
| Dispatch optimizer | Greedy scoring first; Timefold Solver or Google OR-Tools (Java) if time allows | Earnings-maximizing dispatch under heat caps |
| Order simulator | Spring `@Scheduled` job on a virtual clock, seeded random generator | Replays a full day in minutes with fake riders and orders |
| Database | PostgreSQL + PostGIS (Hibernate Spatial, JTS) | Riders, orders, doses history, reports |
| Live state | Redis | Current rider doses, fast reads for dispatch |
| Live dashboard updates | Spring WebSocket or SSE | Pushes the side-by-side comparison to the map |
| Notifications | AWS SNS or Twilio (Java SDK), voice fallback | Rest alerts by SMS or call |
| Advisories and reports text | Amazon Bedrock via AWS SDK for Java v2 (or Spring AI) | Plain-language alerts in Hindi, Marathi, English and the compliance report |
| Dashboard | React + Leaflet or Mapbox | Side-by-side live map |
| Deployment | Docker, then AWS ECS, Elastic Beanstalk or EC2 | Hosting |

### Project structure

```
heatbudget/
├── weather/    WeatherClient, WbgtCalculator
├── geo/        ShadeService, RoutingService (GraphHopper)
├── rider/      Rider, DoseTracker, BudgetPolicy (soft limits, overrides)
├── order/      Order, OrderSimulator, PickupWaitPredictor
├── dispatch/   BaselineDispatcher, HeatAwareDispatcher, PauseCreditService
├── alert/      NudgeService (app, SMS, voice fallback)
├── report/     ComplianceReportService, AggregateStats
├── api/        REST controllers + WebSocket
└── sim/        VirtualClock, ScenarioRunner (baseline vs HeatBudget)
```

### Core endpoints
- `POST /riders/{id}/location` sends a location ping and updates the dose
- `GET /riders/{id}/dose` returns the rider's own dose and guidance
- `POST /dispatch/run` runs one dispatch cycle
- `GET /reports/daily` returns the aggregate compliance report
- `GET /sim/compare` runs baseline vs Pause Pay on the same seeded day

### Build cautions
- **GraphHopper setup takes time** (OSM import, custom model). Fallback: straight-line distance with a shade penalty per grid cell, and present GraphHopper as the next step.
- **Timefold has a learning curve.** Build the greedy dispatcher first so a demo always works.
- **Use the same seed for both engines** so baseline and Pause Pay see identical orders, otherwise the comparison isn't fair.
- **Keep the heat model simple and cited.** Don't let it become a time sink.

---

## 5. Edge cases and how we handle them

Items marked ⭐ are the ones judges are most likely to ask about.

### A. Rider reality (earnings and behavior)

| Edge case | How we handle it |
|---|---|
| ⭐ Per-delivery pay: resting means zero income | Earnings-aware optimizer, heat pause credit, remove unpaid sun-waiting first |
| ⭐ Rider hits the budget early but needs money | Soft limit, not a lock: warn at 80%, strongly recommend rest at 100%, allow an override with a clear risk warning. Never block income |
| Rider ignores nudges | Escalate gently (app, SMS, voice call). Log it in aggregate. The report shows platform exposure, not rider blame |
| Rider games the system (fake rest) | Detect rest from movement and location patterns, and pay no credit while moving |
| Fear of surveillance or punishment | Rider owns their own data, no use for performance rating, union review of the policy |
| ⭐ Multi-apping (several platforms at once) | One platform sees only part of the exposure. Provide a rider-side companion app that tracks total exposure, and allow self-report |
| Night work in hot cities | Include night heat in the score, not only 11am-4pm |
| Low-end phone, patchy data, low English literacy | Offline-first, tiny app, SMS/voice fallback, Hindi/Marathi |
| Shared phone or account | Bind the dose to the rider, flag sudden pattern changes, allow manual switching |
| Phone overheats and the app dies | Lightweight app, last-known dose saved, resume on restart |
| New rider with no history | Conservative default budget, adjusted gradually |
| Rider is older, pregnant, or has a health condition | Optional self-declared budget reduction. Never mandatory, never stored as a medical record |

### B. Platform and business

| Edge case | How we handle it |
|---|---|
| ⭐ Platform has no incentive to adopt | Position as lower churn, fewer incidents and legal-risk reduction under Karnataka and Maharashtra rules. Show the pause credit cost vs. incident and churn cost |
| ⭐ Longer delivery times annoy customers | Show late-delivery rate in the demo. Apply strict rules only above a heat threshold |
| Restaurants delay food, riders wait in the sun | Pickup-time prediction and shaded waiting spots (reduces heat at no cost) |
| Lunch rush conflicts with heat caps | Cap per rider, spread load across fresher riders |
| Platform fears the report exposes it | Give the platform the aggregate first, regulator version as an opt-in layer |
| Platform refuses to integrate | Rider-side companion app that works without platform data |
| Floods, rain, strikes disrupt orders | Re-run live, fall back to nearest-rider dispatch when data is missing |
| Platform games the report | Public methodology, independent audit option, union access to anonymized raw data |

### C. Software and data

| Edge case | How we handle it |
|---|---|
| GPS error in tunnels, flyovers, dense areas | Map-matching, ignore teleport jumps, estimate from last good fix |
| ⭐ Weather data is coarse (one value for a whole city) | Use hourly grid data, blend with station data where available, state the resolution limit |
| Weather API down or rate-limited | Cache recent hours, use forecasts as fallback |
| Sudden weather change (rain, dust storm) | Recompute every 15 minutes, cap how fast status can swing |
| Rider stationary but still exposed | Track exposure by time and location, not distance |
| Rider goes offline mid-shift | Keep the total, mark the gap, resume without double counting |
| Time zone and shift-boundary errors | Store UTC, display local time, reset the budget at a clear daily boundary |
| Optimizer too slow in rush hour | Greedy heuristic first (instant), full Timefold/OR-Tools optimization in batches of a few seconds on a background thread |
| Same riders always get the "safe" orders | Rotate assignments, track earnings equality, test for bias by area or rider type |
| Duplicate or cancelled orders | Idempotent processing, recompute on cancellation |
| Scale: 300 riders in demo vs. 100,000 in reality | Partition by city and zone, optimize per zone, stateless Spring services scaled horizontally with Redis for shared state |
| GPS spoofing to dodge rest or boost earnings | Basic anomaly checks and signed device data (future work) |

### D. Heat model

| Edge case | How we handle it |
|---|---|
| ⭐ True WBGT needs sun and globe data we don't have | Use a published estimation method from standard weather variables, cite it, and state the error honestly |
| Microclimate (hot road next to a shaded park) | OSM-based shade and surface adjustments, treated as estimates |
| Effort differs (bike, scooter, on foot, heavy bag) | Effort multiplier by vehicle and load |
| Acclimatization (first days of a heatwave are riskiest) | Lower budget early in a heatwave, optional setting |
| Humid vs. dry heat (Mumbai vs. Nagpur) | WBGT captures humidity. Test both climates |
| Heat doesn't add up linearly | Decaying dose with recovery in cool or rest periods, described as a simplified decision aid |

### E. Legal, ethics, privacy

| Edge case | How we handle it |
|---|---|
| ⭐ Location tracking is sensitive | Collect only during shifts, anonymous IDs, aggregate or delete after the shift, explicit consent, follow India's DPDP Act principles |
| Medical liability if someone falls ill | Decision-support wording, no diagnosis claims, a clear emergency button |
| Platform uses dose data to deactivate "weak" riders | Platform sees only aggregates. Individual dose is visible only to the rider. Written commitment plus technical design |
| Misuse of data by regulators or unions | Aggregate reports only, hide small groups |
| "Free to choose hours" legal position | Position as improving conditions, not changing employment status |

### F. Demo and judging

| Edge case | How we handle it |
|---|---|
| ⭐ "Your orders are fake" | Say it upfront. Real weather and map data, simulated orders, a real-data pilot as the next step |
| ⭐ "Why would a platform pay?" | One slide with a cost vs. benefit estimate |
| Live demo fails | Recorded backup video, cached data |
| "Isn't this just a heat alert?" | Lead with the side-by-side where dispatch changes and heat drops while earnings stay flat |

---

## 6. How we handle information (data handling)

### What we collect
| Data | Source | Purpose |
|---|---|---|
| Weather (temperature, humidity, wind, solar radiation) | Open-Meteo / ERA5 | Heat score |
| Map features (roads, trees, buildings, rest points) | OpenStreetMap, Amazon Location Service | Shade adjustment, routing |
| Rider location during a shift | Rider's phone (with consent) | Dose calculation |
| Order data (pickup, drop, value) | Platform or simulator | Dispatch |
| Optional rider self-report (vehicle, effort, budget reduction) | Rider | Personalized budget |

### How data flows
1. Weather and map data are fetched on a schedule and cached.
2. Rider location is processed during the shift into a running dose number.
3. The dispatch engine reads doses and orders and outputs assignments.
4. Rider sees their own dose and rest guidance.
5. Platform and regulator see aggregates only.

### Privacy and security rules
- **Consent first.** Tracking is opt-in, explained in the rider's language.
- **Shift-only.** Location is collected only while the rider is on shift.
- **Anonymous IDs.** No names or phone numbers in the dose data.
- **Minimal retention.** Raw location is deleted or aggregated after the shift. Only the dose total and aggregate stats are kept.
- **Rider-owned.** Individual dose is visible only to the rider.
- **No punitive use.** Dose data isn't used for ratings, deactivation or incentives.
- **Small-group suppression.** Reports hide groups below a minimum size.
- **Encryption** in transit and at rest, and least-privilege access on AWS.
- **No medical data.** Self-declared adjustments aren't stored as medical records.
- **Honest labelling.** The tool is decision support, not medical advice.

### Data quality rules
- Cache and fall back when APIs fail.
- Smooth and validate GPS before use.
- Log gaps, never silently fill them.
- Always show data resolution limits in the report.

---

## 7. Roadmap

### Hackathon (24 hours)
| Phase | Hours | Work |
|---|---|---|
| Setup | 0-3 | Pick a city, load weather and map data, assign roles, create the Spring Boot project, Postgres and Redis in Docker |
| Heat model | 3-8 | `WeatherClient`, `WbgtCalculator`, shade adjustment, `DoseTracker` with recovery |
| Simulator | 8-11 | `OrderSimulator` on a virtual clock: 300 riders, 2,000 orders, per-delivery pay, restaurant wait times, one 44°C day, seeded |
| Dispatch engine | 11-16 | `BaselineDispatcher` vs `HeatAwareDispatcher` (greedy, earnings-maximizing under heat cap), `PauseCreditService`. Timefold only if time remains |
| Dashboard | 16-20 | React + Leaflet fed by WebSocket: side-by-side map, dose meters, breach counter, earnings-per-heat metric |
| Alerts and report | 20-22 | `NudgeService` (SNS/Twilio), Bedrock-generated messages and `ComplianceReportService` |
| Pitch | 22-24 | Rehearse, backup video, slides |

### After the hackathon
| When | Goal |
|---|---|
| Month 1 | Replace the simulator with anonymized real order patterns from a pilot partner or union |
| Months 2-3 | Validate the dose model with occupational health experts, collect rider feedback |
| Months 4-6 | Pilot in one city with one platform or union, measure breaches and earnings |
| Later | Offer the compliance report to state labour departments and heat action plan teams |

---

## 8. Demo plan

1. Live map of one city on a 44°C day with 300 riders.
2. Left: normal dispatch (nearest rider). Right: Pause Pay.
3. Counters for riders over the heat limit, average earnings, and late-delivery rate on both sides.
4. Expected result: far fewer riders over the limit, earnings steady, delivery time almost unchanged, and a small pause-credit cost.
5. Generate the compliance report in one click.

---

## 9. Top priorities to get right

1. Earnings under per-delivery pay (soft limits, pause credit, cut unpaid sun time first).
2. Multi-apping (rider-side companion tracking total exposure).
3. Honest WBGT estimation with cited methods.
4. Privacy design (rider-owned data, aggregates for platforms).
5. A clear answer to "why would a platform adopt this?"

---

## 10. Sources and checks to complete

- Gig worker numbers, platform incentive structure: Newslaundry, "Piping hot: India's delivery economy runs on worker heat stress" (May 2026).
- IFAT letter and Karnataka Act Section 16: South First, "Heatwave warnings, but no relief" (April 2026).
- Maharashtra SOPs and rider experience: WRI India, "Rising heat's invisible burden on delivery workers."
- Zomato rest points: Rest of World, "India heat wave delivery workers" (2024).
- **To verify before pitching:** exact WBGT thresholds and the estimation method to cite, the current text of the Maharashtra SOPs, and any existing competing product.
