package com.medcenter.dto.response;

import com.medcenter.enums.ConsultationStatus;
import java.math.BigDecimal;
import java.time.LocalDateTime;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ConsultationResponse {

    private Long id;

    private Long appointmentId;

    private Long queueEntryId;

    // Patient info
    private Long patientId;
    private String patientName;
    private String patientNumber;

    // Doctor info
    private Long doctorId;
    private String doctorName;

    private String notes;

    private String symptoms;
    private String examination;
    private String treatment;
    private String diagnosis;

    private Boolean isConfidential;

    private ConsultationStatus status;

    private LocalDateTime startedAt;

    private LocalDateTime endedAt;

    private Integer durationMinutes;

    private LocalDateTime createdAt;

    private LocalDateTime updatedAt;

    // ── Vital Signs (embedded) ───────────────────────────────────
    private VitalSignsInfo vitalSigns;

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class VitalSignsInfo {
        private Long id;
        private Integer bloodPressureSystolic;
        private Integer bloodPressureDiastolic;
        private Integer heartRate;
        private BigDecimal temperature;
        private BigDecimal weight;
        private BigDecimal height;
        private Integer oxygenSaturation;
        private Integer respiratoryRate;
        private Integer painScale;
        private String notes;
        private String symptoms;
        private String recordedByName;
        private LocalDateTime recordedAt;
    }
}
