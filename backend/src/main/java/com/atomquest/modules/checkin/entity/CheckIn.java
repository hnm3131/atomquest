package com.atomquest.modules.checkin.entity;

import com.atomquest.shared.enums.Quarter;
import jakarta.persistence.*;
import lombok.*;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.jpa.domain.support.AuditingEntityListener;

import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Table(name = "check_ins")
@EntityListeners(AuditingEntityListener.class)
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class CheckIn {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(name = "goal_sheet_id", nullable = false)
    private UUID goalSheetId;

    @Column(name = "manager_id", nullable = false)
    private UUID managerId;

    @Column(name = "employee_id", nullable = false)
    private UUID employeeId;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private Quarter quarter;

    @Column(columnDefinition = "TEXT")
    private String feedback;

    @Column(name = "overall_rating")
    private String overallRating;

    @CreatedDate
    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;
}
