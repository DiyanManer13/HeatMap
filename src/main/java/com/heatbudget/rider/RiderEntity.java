package com.heatbudget.rider;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "riders")
public class RiderEntity {
    @Id
    private UUID id;

    @Column(name = "anonymous_reference", nullable = false, unique = true, length = 100)
    private String anonymousReference;

    @Column(name = "created_at", nullable = false)
    private Instant createdAt;

    protected RiderEntity() {
    }

    private RiderEntity(UUID id, String anonymousReference, Instant createdAt) {
        this.id = id;
        this.anonymousReference = anonymousReference;
        this.createdAt = createdAt;
    }

    public static RiderEntity create(String anonymousReference, Instant now) {
        return new RiderEntity(UUID.randomUUID(), anonymousReference, now);
    }

    public UUID getId() {
        return id;
    }
}
