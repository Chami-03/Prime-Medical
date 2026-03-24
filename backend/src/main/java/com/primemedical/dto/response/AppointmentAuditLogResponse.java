package com.primemedical.dto.response;

import com.primemedical.enums.AppointmentStatus;
import java.time.LocalDateTime;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class AppointmentAuditLogResponse {

    private Long id;
    private Long appointmentId;
    private String action;
    private AppointmentStatus fromStatus;
    private AppointmentStatus toStatus;
    private String reason;
    private String changedByName;
    private String changedByEmail;
    private String changedByRoles;
    private String details;
    private LocalDateTime changedAt;
}
