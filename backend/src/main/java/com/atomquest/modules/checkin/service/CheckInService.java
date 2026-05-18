package com.atomquest.modules.checkin.service;

import com.atomquest.modules.checkin.entity.CheckIn;
import com.atomquest.modules.checkin.repository.CheckInRepository;
import com.atomquest.modules.cycle.entity.Cycle;
import com.atomquest.modules.cycle.repository.CycleRepository;
import com.atomquest.modules.goal.entity.GoalSheet;
import com.atomquest.modules.goal.repository.GoalSheetRepository;
import com.atomquest.modules.notification.service.NotificationService;
import com.atomquest.modules.user.entity.User;
import com.atomquest.modules.user.repository.UserRepository;
import com.atomquest.shared.enums.GoalSheetStatus;
import com.atomquest.shared.enums.Quarter;
import com.atomquest.shared.exception.BadRequestException;
import com.atomquest.shared.exception.ResourceNotFoundException;
import com.atomquest.shared.exception.UnauthorizedException;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class CheckInService {

    private final CheckInRepository checkInRepository;
    private final GoalSheetRepository goalSheetRepository;
    private final CycleRepository cycleRepository;
    private final UserRepository userRepository;
    private final NotificationService notificationService;

    /**
     * Validates that the current date falls within the active quarter window
     * for the cycle associated with the given goal sheet.
     */
    public Quarter resolveAndValidateCurrentQuarter(UUID goalSheetId) {
        GoalSheet sheet = goalSheetRepository.findById(goalSheetId)
                .orElseThrow(() -> new ResourceNotFoundException("Goal sheet not found"));

        Cycle cycle = cycleRepository.findById(sheet.getCycleId())
                .orElseThrow(() -> new ResourceNotFoundException("Cycle not found"));

        LocalDate today = LocalDate.now();

        if (today.compareTo(cycle.getQ1Start()) >= 0 && today.compareTo(cycle.getQ1End()) <= 0) return Quarter.Q1;
        if (today.compareTo(cycle.getQ2Start()) >= 0 && today.compareTo(cycle.getQ2End()) <= 0) return Quarter.Q2;
        if (today.compareTo(cycle.getQ3Start()) >= 0 && today.compareTo(cycle.getQ3End()) <= 0) return Quarter.Q3;
        if (today.compareTo(cycle.getQ4Start()) >= 0 && today.compareTo(cycle.getQ4End()) <= 0) return Quarter.Q4;

        throw new BadRequestException(
                "No active check-in window. Current date (" + today + ") is outside all configured quarterly windows for cycle: " + cycle.getName()
        );
    }

    @Transactional
    public CheckIn submitCheckIn(UUID goalSheetId, UUID managerId, String feedback, String overallRating) {
        GoalSheet sheet = goalSheetRepository.findById(goalSheetId)
                .orElseThrow(() -> new ResourceNotFoundException("Goal sheet not found"));

        if (sheet.getStatus() != GoalSheetStatus.LOCKED) {
            throw new BadRequestException("Check-ins can only be submitted for locked/approved goal sheets.");
        }

        validateManagerAccess(managerId, sheet.getEmployeeId());

        Quarter activeQuarter = resolveAndValidateCurrentQuarter(goalSheetId);

        Optional<CheckIn> existing = checkInRepository.findByGoalSheetIdAndQuarter(goalSheetId, activeQuarter);
        if (existing.isPresent()) {
            // Update existing check-in
            CheckIn checkIn = existing.get();
            checkIn.setFeedback(feedback);
            checkIn.setOverallRating(overallRating);
            CheckIn saved = checkInRepository.save(checkIn);
            notifyEmployee(sheet.getEmployeeId(), sheet.getEmployeeId(), activeQuarter, "updated");
            return saved;
        }

        CheckIn checkIn = CheckIn.builder()
                .goalSheetId(goalSheetId)
                .managerId(managerId)
                .employeeId(sheet.getEmployeeId())
                .quarter(activeQuarter)
                .feedback(feedback)
                .overallRating(overallRating)
                .build();

        CheckIn saved = checkInRepository.save(checkIn);
        notifyEmployee(sheet.getEmployeeId(), managerId, activeQuarter, "submitted");
        return saved;
    }

    public List<CheckIn> getCheckInsForEmployee(UUID employeeId) {
        return checkInRepository.findByEmployeeId(employeeId);
    }

    public List<CheckIn> getCheckInsForManager(UUID managerId) {
        return checkInRepository.findByManagerId(managerId);
    }

    public Optional<CheckIn> getCheckInForSheetAndQuarter(UUID goalSheetId, Quarter quarter) {
        return checkInRepository.findByGoalSheetIdAndQuarter(goalSheetId, quarter);
    }

    private void validateManagerAccess(UUID managerId, UUID employeeId) {
        User employee = userRepository.findById(employeeId)
                .orElseThrow(() -> new ResourceNotFoundException("Employee not found"));
        User manager = userRepository.findById(managerId)
                .orElseThrow(() -> new ResourceNotFoundException("Manager not found"));

        boolean isDirectManager = managerId.equals(employee.getManagerId());
        boolean isAdmin = manager.getRole() == com.atomquest.shared.enums.Role.ADMIN;

        if (!isDirectManager && !isAdmin) {
            throw new UnauthorizedException("You are not authorized to submit a check-in for this employee.");
        }
    }

    private void notifyEmployee(UUID employeeId, UUID managerId, Quarter quarter, String action) {
        User manager = userRepository.findById(managerId).orElse(null);
        String managerName = manager != null ? manager.getName() : "Your manager";
        notificationService.sendNotification(
                employeeId,
                "CHECK_IN_" + action.toUpperCase(),
                quarter + " Check-in " + action.substring(0, 1).toUpperCase() + action.substring(1),
                managerName + " has " + action + " your " + quarter + " check-in feedback.",
                "/achievements"
        );
    }
}
