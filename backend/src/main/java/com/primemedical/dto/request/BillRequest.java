package com.primemedical.dto.request;

import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class BillRequest {

    @NotNull(message = "Patient ID is required")
    private Long patientId;

    private Long consultationId;
}
