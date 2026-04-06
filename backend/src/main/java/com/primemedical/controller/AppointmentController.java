package com.primemedical.controller;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;

import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.primemedical.dto.request.AppointmentRequest;
import com.primemedical.dto.response.ApiResponse;
import com.primemedical.dto.response.AppointmentAuditLogResponse;
import com.primemedical.dto.response.AppointmentResponse;
import com.primemedical.service.AppointmentService;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;

@RestController
@RequestMapping("/api/v1/appointments")
@RequiredArgsConstructor
public class AppointmentController {

    private final AppointmentService appointmentService;

    @PostMapping
    @PreAuthorize("hasAnyRole('ADMIN','RECEPTIONIST','DOCTOR','PATIENT')")
    public ResponseEntity<ApiResponse<AppointmentResponse>> bookAppointment(
            @Valid @RequestBody AppointmentRequest request, Authentication authentication) {
        String userEmail = authentication.getName();
        AppointmentResponse response = appointmentService.bookAppointment(request, userEmail);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success("Appointment booked successfully", response));
    }

    @GetMapping("/available-slots")
    @PreAuthorize("hasAnyRole('ADMIN','RECEPTIONIST','DOCTOR','NURSE','PHARMACIST','PATIENT')")
    public ResponseEntity<ApiResponse<List<LocalDateTime>>> getAvailableSlots(
            @RequestParam Long doctorId,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate date) {
        List<LocalDateTime> slots = appointmentService.getAvailableSlots(doctorId, date);
        return ResponseEntity.ok(ApiResponse.success(slots));
    }

    @GetMapping("/calendar")
    @PreAuthorize("hasAnyRole('ADMIN','RECEPTIONIST','DOCTOR')")
    public ResponseEntity<ApiResponse<List<AppointmentResponse>>> getDoctorCalendar(
            @RequestParam Long doctorId,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate date) {
        List<AppointmentResponse> calendar = appointmentService.getDoctorCalendar(doctorId, date);
        return ResponseEntity.ok(ApiResponse.success(calendar));
    }

    @GetMapping("/my-calendar")
    @PreAuthorize("hasRole('PATIENT')")
    public ResponseEntity<ApiResponse<List<AppointmentResponse>>> getMyCalendar(
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate date,
            Authentication authentication) {
        List<AppointmentResponse> calendar =
                appointmentService.getPatientCalendar(authentication.getName(), date);
        return ResponseEntity.ok(ApiResponse.success(calendar));
    }

        @GetMapping("/my-upcoming")
        @PreAuthorize("hasRole('PATIENT')")
        public ResponseEntity<ApiResponse<List<AppointmentResponse>>> getMyUpcomingAppointments(
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate startDate,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate endDate,
            Authentication authentication) {
        List<AppointmentResponse> appointments =
            appointmentService.getPatientAppointmentsInRange(
                authentication.getName(), startDate, endDate);
        return ResponseEntity.ok(ApiResponse.success(appointments));
        }

    @GetMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN','RECEPTIONIST','DOCTOR','NURSE','PATIENT')")
    public ResponseEntity<ApiResponse<AppointmentResponse>> getAppointmentById(
            @PathVariable Long id, Authentication authentication) {
        AppointmentResponse response = appointmentService.getAppointmentById(id, authentication.getName());
        return ResponseEntity.ok(ApiResponse.success(response));
    }

    @GetMapping("/{id}/audit-timeline")
    @PreAuthorize("hasAnyRole('ADMIN','RECEPTIONIST','DOCTOR','NURSE','PATIENT')")
    public ResponseEntity<ApiResponse<List<AppointmentAuditLogResponse>>> getAppointmentAuditTimeline(
            @PathVariable Long id, Authentication authentication) {
        List<AppointmentAuditLogResponse> response =
                appointmentService.getAppointmentAuditTimeline(id, authentication.getName());
        return ResponseEntity.ok(ApiResponse.success(response));
    }

    @PutMapping("/{id}/cancel")
    @PreAuthorize("hasAnyRole('ADMIN','RECEPTIONIST','DOCTOR','PATIENT')")
    public ResponseEntity<ApiResponse<AppointmentResponse>> cancelAppointment(
            @PathVariable Long id,
            @RequestBody Map<String, String> body,
            Authentication authentication) {
        String reason = body.getOrDefault("reason", "No reason provided");
        AppointmentResponse response =
                appointmentService.cancelAppointment(id, reason, authentication.getName());
        return ResponseEntity.ok(ApiResponse.success("Appointment cancelled", response));
    }

    @GetMapping
        @PreAuthorize("hasAnyRole('ADMIN','RECEPTIONIST','DOCTOR')")
    public ResponseEntity<ApiResponse<List<AppointmentResponse>>> getAllAppointments(
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE)
                    LocalDate startDate,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE)
                    LocalDate endDate,
            @RequestParam(required = false) Long doctorId,
            @RequestParam(required = false) com.primemedical.enums.AppointmentStatus status) {
        List<AppointmentResponse> appointments =
                appointmentService.getAllAppointments(startDate, endDate, doctorId, status);
        return ResponseEntity.ok(ApiResponse.success(appointments));
    }

    @PutMapping("/{id}/status")
    @PreAuthorize("hasAnyRole('ADMIN','RECEPTIONIST','DOCTOR','NURSE')")
    public ResponseEntity<ApiResponse<AppointmentResponse>> updateStatus(
            @PathVariable Long id, @RequestBody Map<String, String> body, Authentication authentication) {
        String statusStr = body.get("status");
        if (statusStr == null) {
            return ResponseEntity.badRequest().body(ApiResponse.error("Status is required"));
        }
        com.primemedical.enums.AppointmentStatus newStatus =
                com.primemedical.enums.AppointmentStatus.valueOf(statusStr.toUpperCase());
        AppointmentResponse response =
                appointmentService.updateStatus(id, newStatus, authentication.getName());
        return ResponseEntity.ok(ApiResponse.success("Status updated", response));
    }

    @PutMapping("/{id}/doctor-delay")
    @PreAuthorize("hasAnyRole('ADMIN','RECEPTIONIST','DOCTOR')")
    public ResponseEntity<ApiResponse<AppointmentResponse>> notifyDoctorDelay(
            @PathVariable Long id, @RequestBody Map<String, String> body, Authentication authentication) {
        String delayMinutesStr = body.get("delayMinutes");
        if (delayMinutesStr == null) {
            return ResponseEntity.badRequest().body(ApiResponse.error("delayMinutes is required"));
        }

        Integer delayMinutes;
        try {
            delayMinutes = Integer.valueOf(delayMinutesStr);
        } catch (NumberFormatException ex) {
            return ResponseEntity.badRequest().body(ApiResponse.error("delayMinutes must be a number"));
        }

        String reason = body.get("reason");
        AppointmentResponse response =
                appointmentService.notifyDoctorDelay(
                        id, delayMinutes, reason, authentication.getName());
        return ResponseEntity.ok(
                ApiResponse.success("Patient notified about doctor delay", response));
    }

    @PutMapping("/{id}/reschedule")
    @PreAuthorize("hasAnyRole('ADMIN','RECEPTIONIST','DOCTOR','PATIENT')")
    public ResponseEntity<ApiResponse<AppointmentResponse>> rescheduleAppointment(
            @PathVariable Long id,
            @RequestBody Map<String, String> body,
            Authentication authentication) {
        String newTimeStr = body.get("newTime");
        if (newTimeStr == null) {
            return ResponseEntity.badRequest().body(ApiResponse.error("New time is required"));
        }
        LocalDateTime newTime = LocalDateTime.parse(newTimeStr);
        AppointmentResponse response =
                appointmentService.rescheduleAppointment(id, newTime, authentication.getName());
        return ResponseEntity.ok(ApiResponse.success("Appointment rescheduled", response));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN','RECEPTIONIST','DOCTOR','PATIENT')")
    public ResponseEntity<ApiResponse<Void>> deleteAppointment(
            @PathVariable Long id, Authentication authentication) {
        appointmentService.deleteAppointmentPermanently(id, authentication.getName());
        return ResponseEntity.ok(ApiResponse.success("Appointment deleted", null));
    }
}
