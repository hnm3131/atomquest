package com.atomquest.modules.goal.repository;

import com.atomquest.modules.goal.entity.Goal;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface GoalRepository extends JpaRepository<Goal, UUID> {
    List<Goal> findByGoalSheetId(UUID goalSheetId);
    List<Goal> findBySharedSourceId(UUID sharedSourceId);
    int countByGoalSheetId(UUID goalSheetId);
}
