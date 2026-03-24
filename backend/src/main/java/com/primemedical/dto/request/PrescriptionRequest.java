package com.primemedical.dto.request;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;
import java.util.List;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class PrescriptionRequest {

    @NotNull(message = "Consultation ID is required")
    private Long consultationId;

    @NotEmpty(message = "At least one prescription item is required")
    @Valid
    private List<PrescriptionItemRequest> items;

    private String notes;

    // ── Inner DTO for each prescription line item ────────────────
    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class PrescriptionItemRequest {

        private Long inventoryItemId;

        @NotNull(message = "Drug name is required")
        private String drugName;

        @NotNull(message = "Dosage is required")
        private String dosage;

        @NotNull(message = "Frequency is required")
        private String frequency;

        @NotNull(message = "Duration (days) is required")
        private Integer durationDays;

        @NotNull(message = "Quantity is required")
        private Integer quantity;

        private String instructions;
    }
}
