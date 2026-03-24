package com.primemedical.dto.request;

import java.math.BigDecimal;

import jakarta.validation.constraints.DecimalMax;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class VitalSignsRequest {

    @NotNull(message = "Systolic blood pressure is required")
    @Min(value = 70, message = "Systolic blood pressure must be at least 70")
    @Max(value = 250, message = "Systolic blood pressure must be at most 250")
    private Integer bloodPressureSystolic;

    @NotNull(message = "Diastolic blood pressure is required")
    @Min(value = 40, message = "Diastolic blood pressure must be at least 40")
    @Max(value = 150, message = "Diastolic blood pressure must be at most 150")
    private Integer bloodPressureDiastolic;

    @NotNull(message = "Heart rate is required")
    @Min(value = 30, message = "Heart rate must be at least 30")
    @Max(value = 220, message = "Heart rate must be at most 220")
    private Integer heartRate;

    @NotNull(message = "Body temperature is required")
    @DecimalMin(value = "30.0", message = "Body temperature must be at least 30.0")
    @DecimalMax(value = "45.0", message = "Body temperature must be at most 45.0")
    private BigDecimal temperature;

    @DecimalMin(value = "1.0", message = "Weight must be at least 1.0")
    @DecimalMax(value = "500.0", message = "Weight must be at most 500.0")
    private BigDecimal weight;

    @DecimalMin(value = "30.0", message = "Height must be at least 30.0")
    @DecimalMax(value = "300.0", message = "Height must be at most 300.0")
    private BigDecimal height;

    @Min(value = 50, message = "Oxygen saturation must be at least 50")
    @Max(value = 100, message = "Oxygen saturation must be at most 100")
    private Integer oxygenSaturation;

    @Min(value = 5, message = "Respiratory rate must be at least 5")
    @Max(value = 80, message = "Respiratory rate must be at most 80")
    private Integer respiratoryRate;

    @Min(value = 0, message = "Pain scale must be between 0 and 10")
    @Max(value = 10, message = "Pain scale must be between 0 and 10")
    private Integer painScale;

    private String notes;

    private String symptoms;
}
