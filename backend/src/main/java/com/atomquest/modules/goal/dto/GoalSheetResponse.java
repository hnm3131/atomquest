package com.atomquest.modules.goal.dto;

import com.atomquest.shared.enums.GoalSheetStatus;
import com.atomquest.shared.enums.UomType;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

@Data @Builder @NoArgsConstructor @AllArgsConstructor
public class GoalSheetResponse {
    private UUID id;
    private UUID employeeId;
    private String employeeName;
    private String department;
    private UUID cycleId;
    private String cycleName;
    private GoalSheetStatus status;
    private LocalDateTime submittedAt;
    private LocalDateTime approvedAt;
    private String rejectionComment;
    private List<GoalResponse> goals;
    private int totalWeightage;
    private LocalDateTime createdAt;

    @Data @Builder @NoArgsConstructor @AllArgsConstructor
    public static class GoalResponse {
        private UUID id;
        private String thrustArea;
        private String title;
        private String description;
        private UomType uomType;
        private BigDecimal targetValue;
        private LocalDate targetDate;
        private Integer weightage;
        private boolean isShared;
        private UUID sharedSourceId;
    }
}
