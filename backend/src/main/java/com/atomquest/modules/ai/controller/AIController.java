package com.atomquest.modules.ai.controller;

import com.atomquest.modules.ai.service.AIService;
import com.atomquest.shared.dto.ApiResponse;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import lombok.Data;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/ai")
@RequiredArgsConstructor
public class AIController {

    private final AIService aiService;

    /**
     * Suggest a SMART-formatted version of a drafted goal.
     */
    @PostMapping("/smart-suggest")
    public ResponseEntity<ApiResponse<String>> suggestSmartGoal(@Valid @RequestBody SmartGoalRequest request) {
        return ResponseEntity.ok(ApiResponse.success(
                aiService.suggestSmartGoal(request.getTitle(), request.getDescription()),
                "SMART goal suggestion generated"
        ));
    }

    /**
     * Ask the RAG-backed HR assistant a question about goal policies or workflows.
     */
    @PostMapping("/hr-assistant")
    public ResponseEntity<ApiResponse<String>> askHrAssistant(@RequestBody Map<String, String> body) {
        String question = body.get("question");
        if (question == null || question.isBlank()) {
            return ResponseEntity.badRequest().body(ApiResponse.error("Question is required"));
        }
        return ResponseEntity.ok(ApiResponse.success(
                aiService.askHrAssistant(question),
                "HR Assistant responded"
        ));
    }

    /**
     * Semantic search: find goals across the org that are similar to the query.
     */
    @PostMapping("/semantic-search")
    public ResponseEntity<ApiResponse<List<String>>> semanticSearch(@RequestBody Map<String, String> body) {
        String query = body.get("query");
        if (query == null || query.isBlank()) {
            return ResponseEntity.badRequest().body(ApiResponse.error("Query is required"));
        }
        return ResponseEntity.ok(ApiResponse.success(
                aiService.semanticSearchGoals(query),
                "Semantic search completed"
        ));
    }

    /**
     * Generate a performance summary for a set of achievement records.
     */
    @PostMapping("/performance-summary")
    public ResponseEntity<ApiResponse<String>> generateSummary(@RequestBody List<Map<String, Object>> achievementData) {
        return ResponseEntity.ok(ApiResponse.success(
                aiService.generatePerformanceSummary(achievementData),
                "Performance summary generated"
        ));
    }

    // ---- DTOs ----

    @Data
    public static class SmartGoalRequest {
        @NotBlank(message = "Goal title is required")
        private String title;
        private String description;
    }
}
