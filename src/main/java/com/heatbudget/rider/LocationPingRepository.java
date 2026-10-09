package com.heatbudget.rider;

import java.util.Optional;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;

public interface LocationPingRepository extends JpaRepository<LocationPingEntity, UUID> {
    Optional<LocationPingEntity> findByClientEventId(UUID clientEventId);
    Optional<LocationPingEntity> findFirstByShiftIdAndDispositionOrderByRecordedAtDesc(UUID shiftId, LocationDisposition disposition);
    Optional<LocationPingEntity> findFirstByShiftIdOrderByRecordedAtDesc(UUID shiftId);
}
