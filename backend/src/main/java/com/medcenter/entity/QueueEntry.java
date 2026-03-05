package com.medcenter.entity;

import com.medcenter.enums.QueuePriority;
import com.medcenter.enums.QueueStatus;
import jakarta.persistence.*;
import java.time.LocalDate;
import java.time.LocalDateTime;
import lombok.*;

@Entity
@Table(
        name = "queue_entries",
        indexes = {@Index(name = "idx_queue_date_status", columnList = "queue_date, status")})
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class QueueEntry {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "patient_id", nullable = false)
    private Patient patient;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "appointment_id")
    private Appointment appointment;

    @Column(name = "queue_date", nullable = false)
    private LocalDate queueDate;

    @Column(name = "queue_number", nullable = false)
    private Integer queueNumber;

    @Enumerated(EnumType.STRING)
    @Builder.Default
    private QueueStatus status = QueueStatus.WAITING;

    @Enumerated(EnumType.STRING)
    @Builder.Default
    private QueuePriority priority = QueuePriority.NORMAL;

    @Column(name = "checked_in_at")
    @Builder.Default
    private LocalDateTime checkedInAt = LocalDateTime.now();

    @Column(name = "called_at")
    private LocalDateTime calledAt;

    @Column(name = "completed_at")
    private LocalDateTime completedAt;
}
