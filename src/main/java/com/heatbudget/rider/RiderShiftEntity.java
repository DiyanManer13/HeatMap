package com.heatbudget.rider;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "rider_shifts")
public class RiderShiftEntity {
    @Id
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "rider_id", nullable = false)
    private RiderEntity rider;

    @Column(name = "consent_provided", nullable = false)
    private boolean consentProvided;

    @Column(name = "started_at", nullable = false)
    private Instant startedAt;

    @Column(name = "ended_at")
    private Instant endedAt;

    protected RiderShiftEntity() {
    }

    private RiderShiftEntity(UUID id, RiderEntity rider, boolean consentProvided, Instant startedAt) {
        this.id = id;
        this.rider = rider;
        this.consentProvided = consentProvided;
        this.startedAt = startedAt;
    }

    public static RiderShiftEntity start(RiderEntity rider, Instant now) {
        return new RiderShiftEntity(UUID.randomUUID(), rider, true, now);
    }

    public UUID getId() {
        return id;
    }

    public RiderEntity getRider() {
        return rider;
    }

    public Instant getStartedAt() {
        return startedAt;
    }

    public boolean isActive() {
        return endedAt == null;
    }
}
