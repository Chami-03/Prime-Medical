package com.medcenter.dto.response;

import com.medcenter.enums.QueuePriority;
import com.medcenter.enums.QueueStatus;
import java.time.LocalDate;
import java.time.LocalDateTime;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class QueueEntryResponse {

    private Long id;

    private Long patientId;

    private String patientName;

    private String patientNumber;

    private Long appointmentId;

    private LocalDate queueDate;

    private Integer queueNumber;

    private QueueStatus status;

    private QueuePriority priority;

    private LocalDateTime checkedInAt;

    private LocalDateTime calledAt;
    private LocalDateTime completedAt;

    private Long consultationId;
}
