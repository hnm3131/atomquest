package com.atomquest.modules.achievement.service;

import com.atomquest.modules.achievement.entity.Achievement;
import com.atomquest.modules.achievement.repository.AchievementRepository;
import com.atomquest.modules.goal.entity.Goal;
import com.atomquest.modules.goal.entity.GoalSheet;
import com.atomquest.modules.goal.repository.GoalRepository;
import com.atomquest.shared.enums.GoalSheetStatus;
import com.atomquest.shared.enums.Quarter;
import com.atomquest.shared.enums.UomType;
import com.atomquest.shared.exception.BadRequestException;
import com.atomquest.shared.exception.ResourceNotFoundException;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.time.temporal.ChronoUnit;
import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class AchievementService {

    private final AchievementRepository achievementRepository;
    private final GoalRepository goalRepository;

    @Transactional
    public Achievement logAchievement(UUID goalId, Quarter quarter, BigDecimal actualValue,
                                       LocalDate actualDate, String status, String comment) {
        Goal goal = goalRepository.findById(goalId)
                .orElseThrow(() -> new ResourceNotFoundException("Goal not found: " + goalId));
        GoalSheet goalSheet = goal.getGoalSheet();
        if (goalSheet.getStatus() != GoalSheetStatus.LOCKED) {
            throw new BadRequestException("Can only log achievements for approved/locked goals");
        }

        Achievement achievement = achievementRepository.findByGoalIdAndQuarter(goalId, quarter)
                .orElse(Achievement.builder().goalId(goalId).quarter(quarter).build());
        achievement.setActualValue(actualValue);
        achievement.setActualDate(actualDate);
        achievement.setStatus(com.atomquest.shared.enums.ProgressStatus.valueOf(status));
        achievement.setEmployeeComment(comment);
        achievement.setComputedScore(computeScore(goal.getUomType(), goal.getTargetValue(), actualValue, goal.getTargetDate(), actualDate));
        achievement = achievementRepository.save(achievement);

        // Sync shared goals
        if (goal.getSharedSourceId() == null && goal.isShared()) {
            List<Goal> linked = goalRepository.findBySharedSourceId(goal.getId());
            for (Goal lg : linked) {
                Achievement la = achievementRepository.findByGoalIdAndQuarter(lg.getId(), quarter)
                        .orElse(Achievement.builder().goalId(lg.getId()).quarter(quarter).build());
                la.setActualValue(actualValue);
                la.setActualDate(actualDate);
                la.setComputedScore(achievement.getComputedScore());
                achievementRepository.save(la);
            }
        }
        return achievement;
    }

    public List<Achievement> getForGoal(UUID goalId) { return achievementRepository.findByGoalId(goalId); }
    public List<Achievement> getForGoals(List<UUID> ids) { return achievementRepository.findByGoalIdIn(ids); }

    public BigDecimal computeScore(UomType uom, BigDecimal target, BigDecimal actual, LocalDate targetDate, LocalDate actualDate) {
        if (actual == null) return BigDecimal.ZERO;
        return switch (uom) {
            case NUMERIC_MIN -> target != null && target.compareTo(BigDecimal.ZERO) != 0
                    ? actual.divide(target, 4, RoundingMode.HALF_UP).multiply(BigDecimal.valueOf(100)).min(BigDecimal.valueOf(150)).setScale(2, RoundingMode.HALF_UP)
                    : BigDecimal.ZERO;
            case NUMERIC_MAX -> actual.compareTo(BigDecimal.ZERO) == 0 ? BigDecimal.valueOf(100)
                    : target != null ? target.divide(actual, 4, RoundingMode.HALF_UP).multiply(BigDecimal.valueOf(100)).min(BigDecimal.valueOf(150)).setScale(2, RoundingMode.HALF_UP) : BigDecimal.ZERO;
            case PERCENTAGE -> target != null && target.compareTo(BigDecimal.ZERO) != 0
                    ? actual.divide(target, 4, RoundingMode.HALF_UP).multiply(BigDecimal.valueOf(100)).setScale(2, RoundingMode.HALF_UP) : actual;
            case TIMELINE -> {
                if (targetDate == null || actualDate == null) yield BigDecimal.ZERO;
                if (!actualDate.isAfter(targetDate)) yield BigDecimal.valueOf(100);
                long total = Math.max(ChronoUnit.DAYS.between(targetDate.minusMonths(3), targetDate), 1);
                long late = ChronoUnit.DAYS.between(targetDate, actualDate);
                yield BigDecimal.valueOf(Math.max(0, 100 - (double) late / total * 100)).setScale(2, RoundingMode.HALF_UP);
            }
            case ZERO_BASED -> actual.compareTo(BigDecimal.ZERO) == 0 ? BigDecimal.valueOf(100) : BigDecimal.ZERO;
        };
    }
}
