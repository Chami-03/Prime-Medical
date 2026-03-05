package com.medcenter.entity;

import jakarta.persistence.*;
import java.math.BigDecimal;
import java.time.LocalDateTime;
import lombok.*;

@Entity
@Table(name = "vital_signs")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class VitalSigns {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "consultation_id")
    private Consultation consultation;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "queue_entry_id")
    private QueueEntry queueEntry;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "patient_id", nullable = false)
    private Patient patient;

    @Column(name = "blood_pressure_systolic")
    private Integer bloodPressureSystolic;

    @Column(name = "blood_pressure_diastolic")
    private Integer bloodPressureDiastolic;

    @Column(name = "heart_rate")
    private Integer heartRate;

    @Column(precision = 4, scale = 1)
    private BigDecimal temperature;

    @Column(precision = 5, scale = 1)
    private BigDecimal weight;

    @Column(precision = 5, scale = 1)
    private BigDecimal height;

    @Column(name = "oxygen_saturation")
    private Integer oxygenSaturation;

    @Column(name = "respiratory_rate")
    private Integer respiratoryRate;

    @Column(name = "pain_scale")
    private Integer painScale;

    @Column(name = "notes", columnDefinition = "TEXT")
    private String notes;

    @Column(columnDefinition = "TEXT")
    private String symptoms;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "recorded_by", nullable = false)
    private User recordedBy;

    @Column(name = "recorded_at")
    @Builder.Default
    private LocalDateTime recordedAt = LocalDateTime.now();
}
