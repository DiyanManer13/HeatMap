CREATE TABLE riders (
    id UUID PRIMARY KEY,
    anonymous_reference VARCHAR(100) NOT NULL UNIQUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE rider_shifts (
    id UUID PRIMARY KEY,
    rider_id UUID NOT NULL REFERENCES riders(id),
    consent_provided BOOLEAN NOT NULL,
    started_at TIMESTAMPTZ NOT NULL,
    ended_at TIMESTAMPTZ
);

CREATE INDEX rider_shifts_active_rider_index ON rider_shifts (rider_id) WHERE ended_at IS NULL;

CREATE TABLE location_pings (
    id UUID PRIMARY KEY,
    client_event_id UUID NOT NULL UNIQUE,
    shift_id UUID NOT NULL REFERENCES rider_shifts(id),
    recorded_at TIMESTAMPTZ NOT NULL,
    latitude DOUBLE PRECISION NOT NULL,
    longitude DOUBLE PRECISION NOT NULL,
    activity_level VARCHAR(20) NOT NULL,
    disposition VARCHAR(20) NOT NULL,
    dose_after DOUBLE PRECISION NOT NULL,
    heat_score_celsius DOUBLE PRECISION,
    weather_source VARCHAR(20),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX location_pings_shift_time_index ON location_pings (shift_id, recorded_at DESC);
