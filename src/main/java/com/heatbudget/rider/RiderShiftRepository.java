package com.heatbudget.rider;

import java.util.Optional;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;

public interface RiderShiftRepository extends JpaRepository<RiderShiftEntity, UUID> {
    Optional<RiderShiftEntity> findByRiderIdAndEndedAtIsNull(UUID riderId);
}
