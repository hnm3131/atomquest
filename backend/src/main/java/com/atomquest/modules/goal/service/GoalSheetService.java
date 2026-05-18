package com.atomquest.modules.goal.service;

import com.atomquest.modules.audit.service.AuditService;
import com.atomquest.modules.cycle.entity.Cycle;
import com.atomquest.modules.cycle.repository.CycleRepository;
import com.atomquest.modules.goal.dto.GoalRequest;
import com.atomquest.modules.goal.dto.GoalSheetResponse;
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
import com.atomquest.shared.exception.UnauthorizedException;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class GoalSheetService {

    private final GoalSheetRepository goalSheetRepository;
    private final GoalRepository goalRepository;
    private final UserRepository userRepository;
    private final CycleRepository cycleRepository;
    private final AuditService auditService;
    private final NotificationService notificationService;

    @Transactional
    public GoalSheetResponse createGoalSheet(UUID employeeId) {
        Cycle activeCycle = cycleRepository.findByIsActiveTrue()
                .orElseThrow(() -> new BadRequestException("No active cycle found"));

        goalSheetRepository.findByEmployeeIdAndCycleId(employeeId, activeCycle.getId())
                .ifPresent(gs -> {
                    throw new BadRequestException("Goal sheet already exists for this cycle");
                });

        GoalSheet goalSheet = GoalSheet.builder()
                .employeeId(employeeId)
                .cycleId(activeCycle.getId())
                .status(GoalSheetStatus.DRAFT)
                .build();

        goalSheet = goalSheetRepository.save(goalSheet);
        return mapToResponse(goalSheet);
    }

    @Transactional
    public GoalSheetResponse addGoal(UUID goalSheetId, GoalRequest request, UUID userId) {
        GoalSheet goalSheet = getGoalSheet(goalSheetId);
        validateEditableState(goalSheet, userId);
        validateGoalCount(goalSheet);

        Goal goal = Goal.builder()
                .goalSheet(goalSheet)
                .thrustArea(request.getThrustArea())
                .title(request.getTitle())
                .description(request.getDescription())
                .uomType(request.getUomType())
                .targetValue(request.getTargetValue())
                .targetDate(request.getTargetDate())
                .weightage(request.getWeightage())
                .build();

        goalRepository.save(goal);
        return mapToResponse(goalSheetRepository.findById(goalSheetId).orElseThrow());
    }

    @Transactional
    public GoalSheetResponse updateGoal(UUID goalId, GoalRequest request, UUID userId) {
        Goal goal = goalRepository.findById(goalId)
                .orElseThrow(() -> new ResourceNotFoundException("Goal not found: " + goalId));
        GoalSheet goalSheet = goal.getGoalSheet();
        validateEditableState(goalSheet, userId);

        // If shared goal, only allow weightage changes
        if (goal.isShared()) {
            goal.setWeightage(request.getWeightage());
        } else {
            goal.setThrustArea(request.getThrustArea());
            goal.setTitle(request.getTitle());
            goal.setDescription(request.getDescription());
            goal.setUomType(request.getUomType());
            goal.setTargetValue(request.getTargetValue());
            goal.setTargetDate(request.getTargetDate());
            goal.setWeightage(request.getWeightage());
        }

        goalRepository.save(goal);
        return mapToResponse(goalSheet);
    }

    @Transactional
    public void deleteGoal(UUID goalId, UUID userId) {
        Goal goal = goalRepository.findById(goalId)
                .orElseThrow(() -> new ResourceNotFoundException("Goal not found: " + goalId));
        validateEditableState(goal.getGoalSheet(), userId);
        goalRepository.delete(goal);
    }

    @Transactional
    public GoalSheetResponse submitGoalSheet(UUID goalSheetId, UUID employeeId) {
        GoalSheet goalSheet = getGoalSheet(goalSheetId);

        if (!goalSheet.getEmployeeId().equals(employeeId)) {
            throw new UnauthorizedException("Not your goal sheet");
        }
        if (goalSheet.getStatus() != GoalSheetStatus.DRAFT &&
            goalSheet.getStatus() != GoalSheetStatus.REJECTED) {
            throw new BadRequestException("Goal sheet cannot be submitted in current state");
        }

        // Validate total weightage = 100%
        List<Goal> goals = goalRepository.findByGoalSheetId(goalSheetId);
        int totalWeightage = goals.stream().mapToInt(Goal::getWeightage).sum();
        if (totalWeightage != 100) {
            throw new BadRequestException("Total weightage must equal 100%. Current: " + totalWeightage + "%");
        }
        if (goals.isEmpty()) {
            throw new BadRequestException("At least one goal is required");
        }

        goalSheet.setStatus(GoalSheetStatus.SUBMITTED);
        goalSheet.setSubmittedAt(LocalDateTime.now());
        goalSheet.setRejectionComment(null);
        goalSheetRepository.save(goalSheet);

        // Notify manager
        User employee = userRepository.findById(employeeId).orElseThrow();
        if (employee.getManagerId() != null) {
            notificationService.sendNotification(
                employee.getManagerId(),
                "GOAL_SUBMITTED",
                "Goal Sheet Submitted",
                employee.getName() + " has submitted their goal sheet for review.",
                "/manager/approvals"
            );
        }

        return mapToResponse(goalSheet);
    }

    // ---- Manager Actions ----

    @Transactional
    public GoalSheetResponse approveGoalSheet(UUID goalSheetId, UUID managerId) {
        GoalSheet goalSheet = getGoalSheet(goalSheetId);
        validateManagerAccess(goalSheet, managerId);

        if (goalSheet.getStatus() != GoalSheetStatus.SUBMITTED) {
            throw new BadRequestException("Can only approve submitted goal sheets");
        }

        goalSheet.setStatus(GoalSheetStatus.LOCKED);
        goalSheet.setApprovedAt(LocalDateTime.now());
        goalSheet.setApprovedBy(managerId);
        goalSheetRepository.save(goalSheet);

        auditService.log(goalSheet.getId(), "GOAL_SHEET", "APPROVED", null, null, "LOCKED", managerId);

        notificationService.sendNotification(
            goalSheet.getEmployeeId(),
            "GOAL_APPROVED",
            "Goal Sheet Approved",
            "Your goal sheet has been approved and locked.",
            "/employee/goals"
        );

        return mapToResponse(goalSheet);
    }

    @Transactional
    public GoalSheetResponse rejectGoalSheet(UUID goalSheetId, UUID managerId, String comment) {
        GoalSheet goalSheet = getGoalSheet(goalSheetId);
        validateManagerAccess(goalSheet, managerId);

        if (goalSheet.getStatus() != GoalSheetStatus.SUBMITTED) {
            throw new BadRequestException("Can only reject submitted goal sheets");
        }

        goalSheet.setStatus(GoalSheetStatus.REJECTED);
        goalSheet.setRejectionComment(comment);
        goalSheetRepository.save(goalSheet);

        auditService.log(goalSheet.getId(), "GOAL_SHEET", "REJECTED", null, null, comment, managerId);

        notificationService.sendNotification(
            goalSheet.getEmployeeId(),
            "GOAL_REJECTED",
            "Goal Sheet Returned for Rework",
            "Your goal sheet was returned: " + comment,
            "/employee/goals"
        );

        return mapToResponse(goalSheet);
    }

    @Transactional
    public GoalSheetResponse managerEditGoal(UUID goalId, GoalRequest request, UUID managerId) {
        Goal goal = goalRepository.findById(goalId)
                .orElseThrow(() -> new ResourceNotFoundException("Goal not found"));
        GoalSheet goalSheet = goal.getGoalSheet();
        validateManagerAccess(goalSheet, managerId);

        if (goalSheet.getStatus() != GoalSheetStatus.SUBMITTED) {
            throw new BadRequestException("Can only edit goals in submitted state");
        }

        // Audit trail for manager edits
        auditService.log(goal.getId(), "GOAL", "MANAGER_EDIT", "targetValue",
                String.valueOf(goal.getTargetValue()), String.valueOf(request.getTargetValue()), managerId);
        auditService.log(goal.getId(), "GOAL", "MANAGER_EDIT", "weightage",
                String.valueOf(goal.getWeightage()), String.valueOf(request.getWeightage()), managerId);

        goal.setTargetValue(request.getTargetValue());
        goal.setWeightage(request.getWeightage());
        goalRepository.save(goal);

        return mapToResponse(goalSheet);
    }

    // ---- Admin Actions ----

    @Transactional
    public GoalSheetResponse unlockGoalSheet(UUID goalSheetId, UUID adminId) {
        GoalSheet goalSheet = getGoalSheet(goalSheetId);

        if (goalSheet.getStatus() != GoalSheetStatus.LOCKED) {
            throw new BadRequestException("Can only unlock locked goal sheets");
        }

        auditService.log(goalSheet.getId(), "GOAL_SHEET", "UNLOCKED", "status", "LOCKED", "DRAFT", adminId);

        goalSheet.setStatus(GoalSheetStatus.DRAFT);
        goalSheet.setApprovedAt(null);
        goalSheet.setApprovedBy(null);
        goalSheetRepository.save(goalSheet);

        return mapToResponse(goalSheet);
    }

    // ---- Queries ----

    public GoalSheetResponse getGoalSheetById(UUID id) {
        return mapToResponse(getGoalSheet(id));
    }

    public List<GoalSheetResponse> getMyGoalSheets(UUID employeeId) {
        return goalSheetRepository.findByEmployeeId(employeeId).stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    public List<GoalSheetResponse> getTeamGoalSheets(UUID managerId) {
        List<User> team = userRepository.findByManagerId(managerId);
        List<UUID> employeeIds = team.stream().map(User::getId).collect(Collectors.toList());
        return goalSheetRepository.findByEmployeeIdIn(employeeIds).stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    public List<GoalSheetResponse> getTeamGoalSheetsForCycle(UUID managerId, UUID cycleId) {
        List<User> team = userRepository.findByManagerId(managerId);
        List<UUID> employeeIds = team.stream().map(User::getId).collect(Collectors.toList());
        return goalSheetRepository.findByEmployeeIdInAndCycleId(employeeIds, cycleId).stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    public List<GoalSheetResponse> getAllGoalSheets() {
        return goalSheetRepository.findAll().stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    // ---- Helpers ----

    private GoalSheet getGoalSheet(UUID id) {
        return goalSheetRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Goal sheet not found: " + id));
    }

    private void validateEditableState(GoalSheet goalSheet, UUID userId) {
        if (goalSheet.getStatus() == GoalSheetStatus.LOCKED ||
            goalSheet.getStatus() == GoalSheetStatus.SUBMITTED) {
            throw new BadRequestException("Goal sheet is not editable in current state: " + goalSheet.getStatus());
        }
        if (!goalSheet.getEmployeeId().equals(userId)) {
            throw new UnauthorizedException("Not authorized to edit this goal sheet");
        }
    }

    private void validateGoalCount(GoalSheet goalSheet) {
        int count = goalRepository.countByGoalSheetId(goalSheet.getId());
        if (count >= 8) {
            throw new BadRequestException("Maximum 8 goals allowed per goal sheet");
        }
    }

    private void validateManagerAccess(GoalSheet goalSheet, UUID managerId) {
        User employee = userRepository.findById(goalSheet.getEmployeeId())
                .orElseThrow(() -> new ResourceNotFoundException("Employee not found"));
        if (!managerId.equals(employee.getManagerId())) {
            // Also allow ADMIN role
            User manager = userRepository.findById(managerId).orElseThrow();
            if (manager.getRole() != com.atomquest.shared.enums.Role.ADMIN) {
                throw new UnauthorizedException("Not authorized to manage this goal sheet");
            }
        }
    }

    private GoalSheetResponse mapToResponse(GoalSheet gs) {
        User employee = userRepository.findById(gs.getEmployeeId()).orElse(null);
        Cycle cycle = cycleRepository.findById(gs.getCycleId()).orElse(null);
        List<Goal> goals = goalRepository.findByGoalSheetId(gs.getId());

        return GoalSheetResponse.builder()
                .id(gs.getId())
                .employeeId(gs.getEmployeeId())
                .employeeName(employee != null ? employee.getName() : null)
                .department(employee != null ? employee.getDepartment() : null)
                .cycleId(gs.getCycleId())
                .cycleName(cycle != null ? cycle.getName() : null)
                .status(gs.getStatus())
                .submittedAt(gs.getSubmittedAt())
                .approvedAt(gs.getApprovedAt())
                .rejectionComment(gs.getRejectionComment())
                .totalWeightage(goals.stream().mapToInt(Goal::getWeightage).sum())
                .goals(goals.stream().map(g -> GoalSheetResponse.GoalResponse.builder()
                        .id(g.getId())
                        .thrustArea(g.getThrustArea())
                        .title(g.getTitle())
                        .description(g.getDescription())
                        .uomType(g.getUomType())
                        .targetValue(g.getTargetValue())
                        .targetDate(g.getTargetDate())
                        .weightage(g.getWeightage())
                        .isShared(g.isShared())
                        .sharedSourceId(g.getSharedSourceId())
                        .build()).collect(Collectors.toList()))
                .createdAt(gs.getCreatedAt())
                .build();
    }
}
