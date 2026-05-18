package com.atomquest.modules.goal.controller;

import com.atomquest.modules.goal.dto.SharedGoalPushRequest;
import com.atomquest.modules.goal.entity.Goal;
import com.atomquest.modules.goal.service.SharedGoalService;
import com.atomquest.modules.user.repository.UserRepository;
import com.atomquest.shared.dto.ApiResponse;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/shared-goals")
@RequiredArgsConstructor
@PreAuthorize("hasAnyRole('MANAGER', 'ADMIN')")
public class SharedGoalController {

    private final SharedGoalService sharedGoalService;
    private final UserRepository userRepository;

    /**
     * Push a source goal as a shared departmental KPI to a list of employees.
     */
    @PostMapping("/push")
    public ResponseEntity<ApiResponse<List<Goal>>> push(
            @Valid @RequestBody SharedGoalPushRequest request,
            Authentication auth) {
        UUID initiatedBy = userRepository.findByEmail(auth.getName()).orElseThrow().getId();
        List<Goal> pushed = sharedGoalService.pushSharedGoal(request, initiatedBy);
        return ResponseEntity.ok(ApiResponse.success(pushed, "Shared goal pushed to " + pushed.size() + " employees."));
    }

    /**
     * Get all goal copies that are linked to a source shared goal.
     */
    @GetMapping("/{sourceGoalId}/linked")
    public ResponseEntity<ApiResponse<List<Goal>>> getLinked(@PathVariable UUID sourceGoalId) {
        return ResponseEntity.ok(ApiResponse.success(sharedGoalService.getLinkedSharedGoals(sourceGoalId)));
    }
}
