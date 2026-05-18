package com.atomquest.modules.goal.service;

import com.atomquest.modules.goal.dto.SharedGoalPushRequest;
import com.atomquest.modules.goal.entity.Goal;
import com.atomquest.modules.goal.entity.GoalSheet;
import com.atomquest.modules.goal.repository.GoalRepository;
import com.atomquest.modules.goal.repository.GoalSheetRepository;
import com.atomquest.modules.notification.service.NotificationService;
import com.atomquest.modules.user.entity.User;
import com.atomquest.modules.user.repository.UserRepository;
import com.atomquest.shared.enums.GoalSheetStatus;
import com.atomquest.shared.exception.BadRequestException;
import com.atomquest.shared.exception.ResourceNotFoundException;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Slf4j
@Service
@RequiredArgsConstructor
public class SharedGoalService {

    private final GoalRepository goalRepository;
    private final GoalSheetRepository goalSheetRepository;
    private final UserRepository userRepository;
    private final NotificationService notificationService;

    /**
     * Admin or Manager pushes a departmental KPI goal to multiple employees.
     * Each recipient gets a copy of the goal on their goal sheet for the same cycle.
     * The copy is read-only except for weightage.
     * Achievement by the primary owner auto-syncs (handled in AchievementService).
     */
    @Transactional
    public List<Goal> pushSharedGoal(SharedGoalPushRequest request, UUID initiatedBy) {
        Goal sourceGoal = goalRepository.findById(request.getSourceGoalId())
                .orElseThrow(() -> new ResourceNotFoundException("Source goal not found"));

        GoalSheet sourceSheet = sourceGoal.getGoalSheet();
        UUID cycleId = sourceSheet.getCycleId();

        List<Goal> createdGoals = new ArrayList<>();

        for (UUID recipientId : request.getRecipientEmployeeIds()) {
            userRepository.findById(recipientId)
                    .orElseThrow(() -> new ResourceNotFoundException("Recipient user not found: " + recipientId));

            // Find or create a goal sheet for this employee in the same cycle
            GoalSheet recipientSheet = goalSheetRepository
                    .findByEmployeeIdAndCycleId(recipientId, cycleId)
                    .orElseGet(() -> {
                        GoalSheet newSheet = GoalSheet.builder()
                                .employeeId(recipientId)
                                .cycleId(cycleId)
                                .status(GoalSheetStatus.DRAFT)
                                .build();
                        return goalSheetRepository.save(newSheet);
                    });

            // Prevent duplicate shared goals on the same sheet
            boolean alreadyPushed = goalRepository.findByGoalSheetId(recipientSheet.getId())
                    .stream()
                    .anyMatch(g -> request.getSourceGoalId().equals(g.getSharedSourceId()));

            if (alreadyPushed) {
                log.warn("Shared goal {} already pushed to employee {}. Skipping.", request.getSourceGoalId(), recipientId);
                continue;
            }

            // Validate max 8 goals constraint
            int existingCount = goalRepository.countByGoalSheetId(recipientSheet.getId());
            if (existingCount >= 8) {
                throw new BadRequestException("Cannot push shared goal: employee " + recipientId + " already has 8 goals.");
            }

            // Create a linked copy with default weightage 10 (employee may change it)
            Goal sharedCopy = Goal.builder()
                    .goalSheet(recipientSheet)
                    .thrustArea(sourceGoal.getThrustArea())
                    .title(sourceGoal.getTitle())
                    .description(sourceGoal.getDescription())
                    .uomType(sourceGoal.getUomType())
                    .targetValue(sourceGoal.getTargetValue())
                    .targetDate(sourceGoal.getTargetDate())
                    .weightage(10) // Default; employee can adjust
                    .isShared(true)
                    .sharedSourceId(sourceGoal.getId())
                    .sharedOwnerId(sourceSheet.getEmployeeId())
                    .build();

            createdGoals.add(goalRepository.save(sharedCopy));

            // Notify recipient
            notificationService.sendNotification(
                    recipientId,
                    "SHARED_GOAL_PUSHED",
                    "New Shared Goal Assigned",
                    "A departmental goal has been added to your sheet: \"" + sourceGoal.getTitle() + "\". Adjust weightage to fit your total.",
                    "/goals"
            );
        }

        log.info("Pushed shared goal {} to {} recipients by user {}", sourceGoal.getId(), createdGoals.size(), initiatedBy);
        return createdGoals;
    }

    public List<Goal> getLinkedSharedGoals(UUID sourceGoalId) {
        return goalRepository.findBySharedSourceId(sourceGoalId);
    }
}
