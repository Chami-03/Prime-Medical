package com.medcenter.dto.response;

import com.medcenter.enums.AppointmentStatus;
import com.medcenter.enums.VisitType;
import java.time.LocalDateTime;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class AppointmentResponse {

    private Long id;

    private String confirmationCode;

    // Patient info
    private Long patientId;
    private String patientName;
    private String patientNumber;

    // Doctor info
    private Long doctorId;
    private String doctorName;
    private String doctorSpecialization;

    private LocalDateTime appointmentTime;

    private String slotTime; // HH:mm extracted from appointmentTime

    private AppointmentStatus status;

    private String reason;

    private VisitType visitType;

    private String cancellationReason;

    private Long rescheduledFromId;

    private LocalDateTime createdAt;

    private LocalDateTime updatedAt;
}
