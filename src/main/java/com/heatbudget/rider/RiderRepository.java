package com.heatbudget.rider;

import java.util.Optional;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;

public interface RiderRepository extends JpaRepository<RiderEntity, UUID> {
    Optional<RiderEntity> findByAnonymousReference(String anonymousReference);
}
