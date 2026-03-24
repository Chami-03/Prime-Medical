package com.primemedical.entity;

import com.primemedical.enums.AppointmentStatus;
import jakarta.persistence.*;
import java.time.LocalDateTime;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;

@Entity
@Table(
        name = "appointment_audit_logs",
        indexes = {
            @Index(name = "idx_appt_audit_appt", columnList = "appointment_id"),
            @Index(name = "idx_appt_audit_changed", columnList = "changed_at")
        })
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class AppointmentAuditLog {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "appointment_id", nullable = false)
    private Appointment appointment;

    @Column(name = "action", nullable = false, length = 50)
    private String action;

    @Enumerated(EnumType.STRING)
    @Column(name = "from_status")
    private AppointmentStatus fromStatus;

    @Enumerated(EnumType.STRING)
    @Column(name = "to_status")
    private AppointmentStatus toStatus;

    @Column(name = "reason", columnDefinition = "TEXT")
    private String reason;

    @Column(name = "changed_by_name", length = 120)
    private String changedByName;

    @Column(name = "changed_by_email", length = 150)
    private String changedByEmail;

    @Column(name = "changed_by_roles", length = 250)
    private String changedByRoles;

    @Column(name = "details", columnDefinition = "TEXT")
    private String details;

    @CreationTimestamp
    @Column(name = "changed_at", nullable = false, updatable = false)
    private LocalDateTime changedAt;
}
