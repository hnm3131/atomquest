package com.atomquest.modules.analytics.controller;

import com.atomquest.shared.dto.ApiResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/analytics")
@RequiredArgsConstructor
@PreAuthorize("hasAnyRole('MANAGER', 'ADMIN')")
public class AnalyticsController {

    // Mocking the responses here to serve frontend Recharts integration directly.
    // In a real application, this would aggregate data via JPQL or Native queries.

    @GetMapping("/trends")
    public ResponseEntity<ApiResponse<List<Map<String, Object>>>> getTrends() {
        return ResponseEntity.ok(ApiResponse.success(List.of(
                Map.of("quarter", "Q1", "Engineering", 85, "Sales", 92, "HR", 78),
                Map.of("quarter", "Q2", "Engineering", 88, "Sales", 85, "HR", 82),
                Map.of("quarter", "Q3", "Engineering", 92, "Sales", 89, "HR", 85),
                Map.of("quarter", "Q4", "Engineering", 95, "Sales", 94, "HR", 90)
        )));
    }

    @GetMapping("/heatmap")
    public ResponseEntity<ApiResponse<List<Map<String, Object>>>> getHeatmap() {
        return ResponseEntity.ok(ApiResponse.success(List.of(
                Map.of("department", "Engineering", "completionRate", 95, "status", "High"),
                Map.of("department", "Sales", "completionRate", 82, "status", "Medium"),
                Map.of("department", "HR", "completionRate", 98, "status", "High"),
                Map.of("department", "Marketing", "completionRate", 45, "status", "Low"),
                Map.of("department", "Finance", "completionRate", 70, "status", "Medium")
        )));
    }

    @GetMapping("/distribution")
    public ResponseEntity<ApiResponse<List<Map<String, Object>>>> getDistribution() {
        return ResponseEntity.ok(ApiResponse.success(List.of(
                Map.of("name", "NUMERIC", "value", 45),
                Map.of("name", "PERCENTAGE", "value", 25),
                Map.of("name", "TIMELINE", "value", 20),
                Map.of("name", "ZERO_BASED", "value", 10)
        )));
    }
}
