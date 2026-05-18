package com.atomquest.modules.achievement.repository;

import com.atomquest.modules.achievement.entity.Achievement;
import com.atomquest.shared.enums.Quarter;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface AchievementRepository extends JpaRepository<Achievement, UUID> {
    List<Achievement> findByGoalId(UUID goalId);
    Optional<Achievement> findByGoalIdAndQuarter(UUID goalId, Quarter quarter);
    
    @Query("SELECT a FROM Achievement a WHERE a.goalId IN :goalIds")
    List<Achievement> findByGoalIdIn(@Param("goalIds") List<UUID> goalIds);

    @Query("SELECT a FROM Achievement a WHERE a.goalId IN :goalIds AND a.quarter = :quarter")
    List<Achievement> findByGoalIdInAndQuarter(@Param("goalIds") List<UUID> goalIds, @Param("quarter") Quarter quarter);
}
