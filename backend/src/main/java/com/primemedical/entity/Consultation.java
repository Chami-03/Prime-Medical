package com.primemedical.entity;

import com.primemedical.enums.ConsultationStatus;
import jakarta.persistence.*;
import java.time.LocalDateTime;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

@Entity
@Table(
        name = "consultations",
        indexes = {
            @Index(name = "idx_consult_patient", columnList = "patient_id"),
            @Index(name = "idx_consult_doctor", columnList = "doctor_id")
        })
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Consultation {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "appointment_id", unique = true)
    private Appointment appointment;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "queue_entry_id")
    private QueueEntry queueEntry;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "patient_id", nullable = false)
    private Patient patient;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "doctor_id", nullable = false)
    private User doctor;

    @Column(columnDefinition = "TEXT")
    private String notes;

    @Column(columnDefinition = "TEXT")
    private String symptoms;

    @Column(columnDefinition = "TEXT")
    private String examination;

    @Column(columnDefinition = "TEXT")
    private String treatment;

    @Column(columnDefinition = "TEXT")
    private String diagnosis;

    @Column(name = "is_confidential")
    @Builder.Default
    private Boolean isConfidential = false;

    @Column(name = "blood_check_required")
    @Builder.Default
    private Boolean bloodCheckRequired = false;

    @Column(name = "blood_check_completed")
    @Builder.Default
    private Boolean bloodCheckCompleted = false;

    @Column(name = "blood_checkup_notes", columnDefinition = "TEXT")
    private String bloodCheckupNotes;

    @Column(name = "blood_test_type", length = 120)
    private String bloodTestType;

    @Column(name = "blood_test_report", columnDefinition = "TEXT")
    private String bloodTestReport;

    @Column(name = "blood_check_requested_at")
    private LocalDateTime bloodCheckRequestedAt;

    @Column(name = "blood_check_completed_at")
    private LocalDateTime bloodCheckCompletedAt;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "blood_check_updated_by")
    private User bloodCheckUpdatedBy;

    @Enumerated(EnumType.STRING)
    @Builder.Default
    private ConsultationStatus status = ConsultationStatus.IN_PROGRESS;

    @Column(name = "started_at")
    @Builder.Default
    private LocalDateTime startedAt = LocalDateTime.now();

    @Column(name = "ended_at")
    private LocalDateTime endedAt;

    @Column(name = "duration_minutes")
    private Integer durationMinutes;

    @CreationTimestamp
    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at")
    private LocalDateTime updatedAt;
}
