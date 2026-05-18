package com.atomquest.modules.goal.dto;

import com.atomquest.shared.enums.UomType;
import jakarta.validation.constraints.*;
import lombok.Data;

import java.math.BigDecimal;
import java.time.LocalDate;

@Data
public class GoalRequest {
    @NotBlank(message = "Thrust area is required")
    private String thrustArea;

    @NotBlank(message = "Goal title is required")
    @Size(max = 500)
    private String title;

    private String description;

    @NotNull(message = "UoM type is required")
    private UomType uomType;

    private BigDecimal targetValue;
    private LocalDate targetDate;

    @NotNull(message = "Weightage is required")
    @Min(value = 10, message = "Minimum weightage per goal is 10%")
    @Max(value = 100, message = "Maximum weightage is 100%")
    private Integer weightage;
}
