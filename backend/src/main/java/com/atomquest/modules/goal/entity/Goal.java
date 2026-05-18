package com.atomquest.modules.goal.entity;

import com.atomquest.shared.enums.UomType;
import jakarta.persistence.*;
import lombok.*;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.annotation.LastModifiedDate;
import org.springframework.data.jpa.domain.support.AuditingEntityListener;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Table(name = "goals")
@EntityListeners(AuditingEntityListener.class)
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class Goal {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "goal_sheet_id", nullable = false)
    private GoalSheet goalSheet;

    @Column(name = "thrust_area", nullable = false)
    private String thrustArea;

    @Column(nullable = false)
    private String title;

    @Column(columnDefinition = "TEXT")
    private String description;

    @Enumerated(EnumType.STRING)
    @Column(name = "uom_type", nullable = false)
    private UomType uomType;

    @Column(name = "target_value", precision = 15, scale = 2)
    private BigDecimal targetValue;

    @Column(name = "target_date")
    private LocalDate targetDate;

    @Column(nullable = false)
    private Integer weightage;

    @Column(name = "is_shared")
    @Builder.Default
    private boolean isShared = false;

    @Column(name = "shared_source_id")
    private UUID sharedSourceId;

    @Column(name = "shared_owner_id")
    private UUID sharedOwnerId;

    @CreatedDate
    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;

    @LastModifiedDate
    @Column(name = "updated_at")
    private LocalDateTime updatedAt;
}
