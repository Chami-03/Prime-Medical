package com.medcenter.dto.response;

import com.medcenter.enums.PrescriptionStatus;
import java.time.LocalDateTime;
import java.util.List;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class PrescriptionResponse {

    private Long id;

    private Long consultationId;

    private Long patientId;
    private String patientName;

    private Long doctorId;
    private String doctorName;

    private PrescriptionStatus status;

    private LocalDateTime prescribedAt;

    private LocalDateTime dispensedAt;

    private String dispensedByName;

    private String notes;

    private List<PrescriptionItemInfo> items;

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class PrescriptionItemInfo {
        private Long id;
        private Long inventoryItemId;
        private String drugName;
        private String dosage;
        private String frequency;
        private Integer durationDays;
        private Integer quantity;
        private String instructions;
    }
}
