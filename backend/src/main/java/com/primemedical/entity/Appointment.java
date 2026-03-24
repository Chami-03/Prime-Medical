package com.primemedical.entity;

import com.primemedical.enums.AppointmentStatus;
import com.primemedical.enums.VisitType;
import jakarta.persistence.*;
import java.time.LocalDateTime;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

@Entity
@Table(
        name = "appointments",
        indexes = {
            @Index(name = "idx_appt_patient", columnList = "patient_id"),
            @Index(name = "idx_appt_doctor_time", columnList = "doctor_id, appointment_time"),
            @Index(name = "idx_appt_status", columnList = "status")
        })
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Appointment {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "confirmation_code", nullable = false, unique = true, length = 20)
    private String confirmationCode;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "patient_id", nullable = false)
    private Patient patient;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "doctor_id", nullable = false)
    private User doctor;

    @Column(name = "appointment_time", nullable = false)
    private LocalDateTime appointmentTime;

    @Enumerated(EnumType.STRING)
    @Builder.Default
    private AppointmentStatus status = AppointmentStatus.PENDING;

    @Column(length = 500)
    private String reason;

    @Enumerated(EnumType.STRING)
    @Column(name = "visit_type")
    @Builder.Default
    private VisitType visitType = VisitType.CONSULTATION;

    @Column(name = "cancellation_reason", columnDefinition = "TEXT")
    private String cancellationReason;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "rescheduled_from")
    private Appointment rescheduledFrom;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "created_by")
    private User createdBy;

    @CreationTimestamp
    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at")
    private LocalDateTime updatedAt;
}
