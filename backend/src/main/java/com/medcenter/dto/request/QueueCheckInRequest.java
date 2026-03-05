package com.medcenter.dto.request;

import com.medcenter.enums.QueuePriority;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class QueueCheckInRequest {

    @NotNull(message = "Patient ID is required")
    private Long patientId;

    /** Nullable — walk-ins may not have an appointment */
    private Long appointmentId;

    private QueuePriority priority = QueuePriority.NORMAL;
}
