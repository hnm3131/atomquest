package com.atomquest.modules.cycle.entity;

import jakarta.persistence.*;
import lombok.*;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.jpa.domain.support.AuditingEntityListener;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Table(name = "cycles")
@EntityListeners(AuditingEntityListener.class)
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class Cycle {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(nullable = false)
    private String name;

    @Column(name = "goal_setting_start", nullable = false)
    private LocalDate goalSettingStart;

    @Column(name = "goal_setting_end", nullable = false)
    private LocalDate goalSettingEnd;

    @Column(name = "q1_start")
    private LocalDate q1Start;
    @Column(name = "q1_end")
    private LocalDate q1End;

    @Column(name = "q2_start")
    private LocalDate q2Start;
    @Column(name = "q2_end")
    private LocalDate q2End;

    @Column(name = "q3_start")
    private LocalDate q3Start;
    @Column(name = "q3_end")
    private LocalDate q3End;

    @Column(name = "q4_start")
    private LocalDate q4Start;
    @Column(name = "q4_end")
    private LocalDate q4End;

    @Column(name = "is_active")
    @Builder.Default
    private boolean isActive = true;

    @CreatedDate
    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;
}
