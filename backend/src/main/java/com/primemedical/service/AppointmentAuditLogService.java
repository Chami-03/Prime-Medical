package com.primemedical.service;

import com.primemedical.dto.response.AppointmentAuditLogResponse;
import com.primemedical.entity.Appointment;
import com.primemedical.entity.AppointmentAuditLog;
import com.primemedical.entity.Role;
import com.primemedical.entity.User;
import com.primemedical.enums.AppointmentStatus;
import com.primemedical.repository.AppointmentAuditLogRepository;
import java.util.List;
import java.util.stream.Collectors;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class AppointmentAuditLogService {

    private final AppointmentAuditLogRepository appointmentAuditLogRepository;

    public void log(
            Appointment appointment,
            String action,
            AppointmentStatus fromStatus,
            AppointmentStatus toStatus,
            String reason,
            User actor,
            String details) {
        if (appointment == null || appointment.getId() == null) {
            return;
        }

        String actorName = "System";
        String actorEmail = "system@primemedical.local";
        String actorRoles = "SYSTEM";

        if (actor != null) {
            String firstName = actor.getFirstName() != null ? actor.getFirstName().trim() : "";
            String lastName = actor.getLastName() != null ? actor.getLastName().trim() : "";
            String fullName = (firstName + " " + lastName).trim();

            actorName = !fullName.isBlank() ? fullName : (actor.getEmail() != null ? actor.getEmail() : "System");
            actorEmail = actor.getEmail() != null ? actor.getEmail() : actorEmail;
            actorRoles = actor.getRoles() != null
                    ? actor.getRoles().stream()
                            .map(Role::getName)
                            .map(Enum::name)
                            .sorted()
                            .collect(Collectors.joining(","))
                    : actorRoles;
            if (actorRoles.isBlank()) {
                actorRoles = "UNKNOWN";
            }
        }

        AppointmentAuditLog log =
                AppointmentAuditLog.builder()
                        .appointment(appointment)
                        .action(action)
                        .fromStatus(fromStatus)
                        .toStatus(toStatus)
                        .reason(reason)
                        .changedByName(actorName)
                        .changedByEmail(actorEmail)
                        .changedByRoles(actorRoles)
                        .details(details)
                        .build();

        appointmentAuditLogRepository.save(log);
    }

    public List<AppointmentAuditLogResponse> getTimeline(Long appointmentId) {
        return appointmentAuditLogRepository.findByAppointmentIdOrderByChangedAtAscIdAsc(appointmentId).stream()
                .map(this::toResponse)
                .collect(Collectors.toList());
    }

    private AppointmentAuditLogResponse toResponse(AppointmentAuditLog log) {
        return AppointmentAuditLogResponse.builder()
                .id(log.getId())
                .appointmentId(log.getAppointment() != null ? log.getAppointment().getId() : null)
                .action(log.getAction())
                .fromStatus(log.getFromStatus())
                .toStatus(log.getToStatus())
                .reason(log.getReason())
                .changedByName(log.getChangedByName())
                .changedByEmail(log.getChangedByEmail())
                .changedByRoles(log.getChangedByRoles())
                .details(log.getDetails())
                .changedAt(log.getChangedAt())
                .build();
    }
}
