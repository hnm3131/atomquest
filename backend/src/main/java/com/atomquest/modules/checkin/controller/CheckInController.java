package com.atomquest.modules.checkin.controller;

import com.atomquest.modules.checkin.entity.CheckIn;
import com.atomquest.modules.checkin.service.CheckInService;
import com.atomquest.modules.user.repository.UserRepository;
import com.atomquest.shared.dto.ApiResponse;
import com.atomquest.shared.enums.Quarter;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Data;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/checkins")
@RequiredArgsConstructor
public class CheckInController {

    private final CheckInService checkInService;
    private final UserRepository userRepository;

    private UUID resolveUserId(Authentication auth) {
        return userRepository.findByEmail(auth.getName())
                .orElseThrow(() -> new RuntimeException("Authenticated user not found")).getId();
    }

    /**
     * Manager submits or updates a quarterly check-in for a team member.
     */
    @PostMapping
    @PreAuthorize("hasAnyRole('MANAGER', 'ADMIN')")
    public ResponseEntity<ApiResponse<CheckIn>> submitCheckIn(
            @Valid @RequestBody CheckInRequest request,
            Authentication auth) {
        UUID managerId = resolveUserId(auth);
        CheckIn saved = checkInService.submitCheckIn(
                request.getGoalSheetId(),
                managerId,
                request.getFeedback(),
                request.getOverallRating()
        );
        return ResponseEntity.ok(ApiResponse.success(saved, "Check-in submitted successfully"));
    }

    /**
     * Returns all check-ins logged by the authenticated manager.
     */
    @GetMapping("/my-submitted")
    @PreAuthorize("hasAnyRole('MANAGER', 'ADMIN')")
    public ResponseEntity<ApiResponse<List<CheckIn>>> getMySubmittedCheckIns(Authentication auth) {
        UUID managerId = resolveUserId(auth);
        return ResponseEntity.ok(ApiResponse.success(checkInService.getCheckInsForManager(managerId)));
    }

    /**
     * Employee views their own received check-ins.
     */
    @GetMapping("/received")
    @PreAuthorize("hasRole('EMPLOYEE')")
    public ResponseEntity<ApiResponse<List<CheckIn>>> getReceivedCheckIns(Authentication auth) {
        UUID employeeId = resolveUserId(auth);
        return ResponseEntity.ok(ApiResponse.success(checkInService.getCheckInsForEmployee(employeeId)));
    }

    /**
     * Admin: Get all check-ins for any employee.
     */
    @GetMapping("/employee/{employeeId}")
    @PreAuthorize("hasAnyRole('MANAGER', 'ADMIN')")
    public ResponseEntity<ApiResponse<List<CheckIn>>> getForEmployee(@PathVariable UUID employeeId) {
        return ResponseEntity.ok(ApiResponse.success(checkInService.getCheckInsForEmployee(employeeId)));
    }

    /**
     * Get the active quarter for a given goal sheet (validates window).
     */
    @GetMapping("/active-quarter/{goalSheetId}")
    @PreAuthorize("hasAnyRole('MANAGER', 'ADMIN')")
    public ResponseEntity<ApiResponse<Quarter>> getActiveQuarter(@PathVariable UUID goalSheetId) {
        Quarter q = checkInService.resolveAndValidateCurrentQuarter(goalSheetId);
        return ResponseEntity.ok(ApiResponse.success(q, "Active quarter resolved"));
    }

    // ---- DTO ----

    @Data
    public static class CheckInRequest {
        @NotNull(message = "Goal sheet ID is required")
        private UUID goalSheetId;

        @NotBlank(message = "Feedback is required")
        private String feedback;

        private String overallRating;
    }
}
