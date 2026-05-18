package com.atomquest.modules.goal.controller;

import com.atomquest.modules.goal.dto.GoalRequest;
import com.atomquest.modules.goal.dto.GoalSheetResponse;
import com.atomquest.modules.goal.service.GoalSheetService;
import com.atomquest.modules.user.entity.User;
import com.atomquest.modules.user.repository.UserRepository;
import com.atomquest.shared.dto.ApiResponse;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/goal-sheets")
@RequiredArgsConstructor
public class GoalSheetController {

    private final GoalSheetService goalSheetService;
    private final UserRepository userRepository;

    private UUID getUserId(Authentication auth) {
        return userRepository.findByEmail(auth.getName()).orElseThrow().getId();
    }

    @PostMapping
    public ResponseEntity<ApiResponse<GoalSheetResponse>> create(Authentication auth) {
        return ResponseEntity.ok(ApiResponse.success(goalSheetService.createGoalSheet(getUserId(auth))));
    }

    @GetMapping("/my")
    public ResponseEntity<ApiResponse<List<GoalSheetResponse>>> getMySheets(Authentication auth) {
        return ResponseEntity.ok(ApiResponse.success(goalSheetService.getMyGoalSheets(getUserId(auth))));
    }

    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<GoalSheetResponse>> getById(@PathVariable UUID id) {
        return ResponseEntity.ok(ApiResponse.success(goalSheetService.getGoalSheetById(id)));
    }

    @PostMapping("/{id}/goals")
    public ResponseEntity<ApiResponse<GoalSheetResponse>> addGoal(@PathVariable UUID id,
            @Valid @RequestBody GoalRequest request, Authentication auth) {
        return ResponseEntity.ok(ApiResponse.success(goalSheetService.addGoal(id, request, getUserId(auth))));
    }

    @PutMapping("/goals/{goalId}")
    public ResponseEntity<ApiResponse<GoalSheetResponse>> updateGoal(@PathVariable UUID goalId,
            @Valid @RequestBody GoalRequest request, Authentication auth) {
        return ResponseEntity.ok(ApiResponse.success(goalSheetService.updateGoal(goalId, request, getUserId(auth))));
    }

    @DeleteMapping("/goals/{goalId}")
    public ResponseEntity<ApiResponse<Void>> deleteGoal(@PathVariable UUID goalId, Authentication auth) {
        goalSheetService.deleteGoal(goalId, getUserId(auth));
        return ResponseEntity.ok(ApiResponse.success(null, "Goal deleted"));
    }

    @PutMapping("/{id}/submit")
    public ResponseEntity<ApiResponse<GoalSheetResponse>> submit(@PathVariable UUID id, Authentication auth) {
        return ResponseEntity.ok(ApiResponse.success(goalSheetService.submitGoalSheet(id, getUserId(auth))));
    }

    // Manager endpoints
    @GetMapping("/team")
    @PreAuthorize("hasAnyRole('MANAGER', 'ADMIN')")
    public ResponseEntity<ApiResponse<List<GoalSheetResponse>>> getTeamSheets(Authentication auth) {
        return ResponseEntity.ok(ApiResponse.success(goalSheetService.getTeamGoalSheets(getUserId(auth))));
    }

    @PutMapping("/{id}/approve")
    @PreAuthorize("hasAnyRole('MANAGER', 'ADMIN')")
    public ResponseEntity<ApiResponse<GoalSheetResponse>> approve(@PathVariable UUID id, Authentication auth) {
        return ResponseEntity.ok(ApiResponse.success(goalSheetService.approveGoalSheet(id, getUserId(auth))));
    }

    @PutMapping("/{id}/reject")
    @PreAuthorize("hasAnyRole('MANAGER', 'ADMIN')")
    public ResponseEntity<ApiResponse<GoalSheetResponse>> reject(@PathVariable UUID id,
            @RequestBody Map<String, String> body, Authentication auth) {
        return ResponseEntity.ok(ApiResponse.success(
                goalSheetService.rejectGoalSheet(id, getUserId(auth), body.get("comment"))));
    }

    @PutMapping("/goals/{goalId}/manager-edit")
    @PreAuthorize("hasAnyRole('MANAGER', 'ADMIN')")
    public ResponseEntity<ApiResponse<GoalSheetResponse>> managerEdit(@PathVariable UUID goalId,
            @Valid @RequestBody GoalRequest request, Authentication auth) {
        return ResponseEntity.ok(ApiResponse.success(goalSheetService.managerEditGoal(goalId, request, getUserId(auth))));
    }

    // Admin endpoints
    @PutMapping("/{id}/unlock")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<GoalSheetResponse>> unlock(@PathVariable UUID id, Authentication auth) {
        return ResponseEntity.ok(ApiResponse.success(goalSheetService.unlockGoalSheet(id, getUserId(auth))));
    }

    @GetMapping
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<List<GoalSheetResponse>>> getAll() {
        return ResponseEntity.ok(ApiResponse.success(goalSheetService.getAllGoalSheets()));
    }
}
