package com.primemedical.dto.request;

import java.time.LocalDateTime;

import com.primemedical.enums.VisitType;

import jakarta.validation.constraints.Future;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class AppointmentRequest {

    private Long patientId;

    @NotNull(message = "Doctor ID is required")
    private Long doctorId;

    @NotNull(message = "Appointment time is required")
    @Future(message = "Appointment time must be in the future")
    private LocalDateTime appointmentTime;

    private String reason;

    private VisitType visitType = VisitType.CONSULTATION;
}
