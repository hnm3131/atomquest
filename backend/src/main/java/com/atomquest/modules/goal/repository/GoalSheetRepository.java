package com.atomquest.modules.goal.repository;

import com.atomquest.modules.goal.entity.GoalSheet;
import com.atomquest.shared.enums.GoalSheetStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface GoalSheetRepository extends JpaRepository<GoalSheet, UUID> {
    List<GoalSheet> findByEmployeeId(UUID employeeId);
    Optional<GoalSheet> findByEmployeeIdAndCycleId(UUID employeeId, UUID cycleId);
    List<GoalSheet> findByCycleId(UUID cycleId);
    List<GoalSheet> findByStatus(GoalSheetStatus status);

    @Query("SELECT gs FROM GoalSheet gs WHERE gs.employeeId IN :employeeIds")
    List<GoalSheet> findByEmployeeIdIn(@Param("employeeIds") List<UUID> employeeIds);

    @Query("SELECT gs FROM GoalSheet gs WHERE gs.employeeId IN :employeeIds AND gs.cycleId = :cycleId")
    List<GoalSheet> findByEmployeeIdInAndCycleId(@Param("employeeIds") List<UUID> employeeIds, @Param("cycleId") UUID cycleId);

    @Query("SELECT COUNT(gs) FROM GoalSheet gs WHERE gs.cycleId = :cycleId AND gs.status = :status")
    long countByCycleIdAndStatus(@Param("cycleId") UUID cycleId, @Param("status") GoalSheetStatus status);
}
