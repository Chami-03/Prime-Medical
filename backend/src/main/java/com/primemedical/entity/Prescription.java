package com.primemedical.entity;

import com.primemedical.enums.PrescriptionStatus;
import jakarta.persistence.*;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import lombok.*;

@Entity
@Table(name = "prescriptions")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Prescription {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "consultation_id", nullable = false)
    private Consultation consultation;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "patient_id", nullable = false)
    private Patient patient;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "doctor_id", nullable = false)
    private User doctor;

    @Enumerated(EnumType.STRING)
    @Builder.Default
    private PrescriptionStatus status = PrescriptionStatus.PENDING;

    @Column(name = "prescribed_at")
    @Builder.Default
    private LocalDateTime prescribedAt = LocalDateTime.now();

    @Column(name = "dispensed_at")
    private LocalDateTime dispensedAt;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "dispensed_by")
    private User dispensedBy;

    @Column(columnDefinition = "TEXT")
    private String notes;

    // ── Relationships ────────────────────────────────────────────
    @OneToMany(mappedBy = "prescription", cascade = CascadeType.ALL, orphanRemoval = true)
    @Builder.Default
    private List<PrescriptionItem> items = new ArrayList<>();
}
