package com.primemedical.entity;

import com.primemedical.enums.AllergySeverity;
import jakarta.persistence.*;
import java.time.LocalDateTime;
import lombok.*;

@Entity
@Table(
        name = "patient_allergies",
        indexes = {@Index(name = "idx_allergies_patient", columnList = "patient_id")})
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class PatientAllergy {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "patient_id", nullable = false)
    private Patient patient;

    @Column(nullable = false, length = 200)
    private String allergen;

    @Column(length = 200)
    private String reaction;

    @Enumerated(EnumType.STRING)
    @Builder.Default
    private AllergySeverity severity = AllergySeverity.MILD;

    @Column(name = "noted_at")
    @Builder.Default
    private LocalDateTime notedAt = LocalDateTime.now();

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "noted_by")
    private User notedBy;
}
