package com.atomquest.modules.cycle.repository;

import com.atomquest.modules.cycle.entity.Cycle;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;
import java.util.UUID;

@Repository
public interface CycleRepository extends JpaRepository<Cycle, UUID> {
    Optional<Cycle> findByIsActiveTrue();
}
