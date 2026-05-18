package com.atomquest.modules.goal.dto;

import jakarta.validation.constraints.NotNull;
import lombok.Data;

import java.util.List;
import java.util.UUID;

@Data
public class SharedGoalPushRequest {

    @NotNull(message = "Source goal ID is required")
    private UUID sourceGoalId;

    @NotNull(message = "At least one recipient employee is required")
    private List<UUID> recipientEmployeeIds;
}
