package com.atomquest.modules.checkin.repository;

import com.atomquest.modules.checkin.entity.CheckIn;
import com.atomquest.shared.enums.Quarter;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface CheckInRepository extends JpaRepository<CheckIn, UUID> {
    List<CheckIn> findByEmployeeId(UUID employeeId);
    List<CheckIn> findByManagerId(UUID managerId);
    Optional<CheckIn> findByGoalSheetIdAndQuarter(UUID goalSheetId, Quarter quarter);
    List<CheckIn> findByManagerIdAndQuarter(UUID managerId, Quarter quarter);
}
