package com.primemedical.entity;

import jakarta.persistence.*;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;

@Entity
@Table(
        name = "doctor_schedules",
        uniqueConstraints =
                @UniqueConstraint(
                        name = "uq_doctor_slot",
                        columnNames = {"doctor_id", "schedule_date", "slot_time"}),
        indexes = {@Index(name = "idx_schedule_date", columnList = "doctor_id, schedule_date")})
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class DoctorSchedule {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "doctor_id", nullable = false)
    private User doctor;

    @Column(name = "schedule_date", nullable = false)
    private LocalDate scheduleDate;

    @Column(name = "slot_time", nullable = false)
    private LocalTime slotTime;

    @Column(name = "is_blocked")
    @Builder.Default
    private Boolean isBlocked = false;

    @Column(name = "block_reason", length = 255)
    private String blockReason;

    @Column(name = "max_patients")
    @Builder.Default
    private Integer maxPatients = 1;

    @CreationTimestamp
    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;
}
