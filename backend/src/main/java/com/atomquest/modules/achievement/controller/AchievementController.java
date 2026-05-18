package com.atomquest.modules.achievement.controller;

import com.atomquest.modules.achievement.entity.Achievement;
import com.atomquest.modules.achievement.service.AchievementService;
import com.atomquest.shared.dto.ApiResponse;
import com.atomquest.shared.enums.Quarter;
import lombok.Data;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/achievements")
@RequiredArgsConstructor
public class AchievementController {

    private final AchievementService achievementService;

    @PostMapping
    public ResponseEntity<ApiResponse<Achievement>> log(@RequestBody AchievementRequest req) {
        return ResponseEntity.ok(ApiResponse.success(achievementService.logAchievement(
                req.getGoalId(), req.getQuarter(), req.getActualValue(),
                req.getActualDate(), req.getStatus(), req.getComment())));
    }

    @GetMapping("/goal/{goalId}")
    public ResponseEntity<ApiResponse<List<Achievement>>> getForGoal(@PathVariable UUID goalId) {
        return ResponseEntity.ok(ApiResponse.success(achievementService.getForGoal(goalId)));
    }

    @Data
    public static class AchievementRequest {
        private UUID goalId;
        private Quarter quarter;
        private BigDecimal actualValue;
        private LocalDate actualDate;
        private String status;
        private String comment;
    }
}
