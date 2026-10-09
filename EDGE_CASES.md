# Edge-case implementation register

This register turns the project brief's edge cases into delivery criteria. It must be updated whenever a related feature is implemented.

## Foundation decisions

- Pune is the demo city and `Asia/Kolkata` is the display timezone; timestamps are stored as UTC by PostgreSQL.
- PostgreSQL with PostGIS is the source of truth; Redis is reserved for recoverable, fast-changing state.
- Raw rider locations are configured for short retention and will be deleted or aggregated after a shift.
- Rider-level dose data will remain rider-visible only. Platform and regulator reports will use aggregate data with small-group suppression.
- A heat budget is a soft limit: future dispatch work will warn at 80%, recommend rest at 100%, and allow an explicit rider override.
- Every simulator run must use a fixed seed shared by baseline and HeatBudget dispatchers.

## Planned safeguards by phase

| Phase | Edge cases addressed |
|---|---|
| Heat core | weather outage cache/fallback, coarse grid data, estimated WBGT labelling, humidity, night heat, recovery, vehicle/effort multiplier |
| Location and dose API | consent, shift-only tracking, GPS jumps, offline gaps, duplicate pings, shared devices, stationary exposure, timezone boundaries |
| Simulator and dispatch | cancelled orders, restaurant waiting, fairness rotation, early-budget overrides, multi-apping self-report, slow optimization fallback |
| Alerts and reports | Hindi/Marathi/English delivery, ignored nudges, no punitive language, small-group suppression, data-resolution disclosures |
| AWS deployment | encrypted storage, IAM least privilege, Secrets Manager, monitoring, audit logs, outage fallback |

## Implemented in Phase 2

- Weather uses a 15-minute local cache. If the provider fails, a last successful reading can be used for at most 60 minutes and is labelled `STALE_CACHE`.
- The WBGT value is an explicitly labelled screening estimate from weather variables, never a medical diagnosis or a direct globe-temperature measurement.
- Dose rises with time, heat above a neutral threshold and activity level. It recovers only during rest in cooler conditions.
- Weather reads are fixed to Pune coordinates. Grid-data and microclimate limitations remain visible in the API model and will be refined with shade data later.

## Implemented in Phase 3

- A rider must explicitly accept location consent before an active shift is created; only anonymous references are stored.
- Location pings are accepted only for an active shift inside the Pune demo bounds. Client event IDs make retries idempotent.
- Teleport-like movement above 100 km/h is recorded as `GPS_JUMP_REJECTED` without changing the dose.
- Long or delayed offline intervals are recorded as `GAP_RECORDED`; no exposure is silently invented for missing time.
- Dose grows even for stationary riders because it is time- and heat-based, not distance-based.
- The current API is an unauthenticated hackathon interface. Rider-scoped authentication must be added before exposure data leaves a controlled demo environment.
