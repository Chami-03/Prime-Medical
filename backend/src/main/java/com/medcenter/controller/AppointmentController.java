package com.medcenter.controller;

import com.medcenter.dto.request.AppointmentRequest;
import com.medcenter.dto.response.ApiResponse;
import com.medcenter.dto.response.AppointmentResponse;
import com.medcenter.service.AppointmentService;
import jakarta.validation.Valid;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;
import lombok.RequiredArgsConstructor;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

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

    @GetMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN','RECEPTIONIST','DOCTOR','NURSE','PATIENT')")
    public ResponseEntity<ApiResponse<AppointmentResponse>> getAppointmentById(
            @PathVariable Long id, Authentication authentication) {
        AppointmentResponse response = appointmentService.getAppointmentById(id, authentication.getName());
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
    @PreAuthorize("hasAnyRole('ADMIN','RECEPTIONIST')")
    public ResponseEntity<ApiResponse<List<AppointmentResponse>>> getAllAppointments(
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE)
                    LocalDate startDate,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE)
                    LocalDate endDate,
            @RequestParam(required = false) Long doctorId,
            @RequestParam(required = false) com.medcenter.enums.AppointmentStatus status) {
        List<AppointmentResponse> appointments =
                appointmentService.getAllAppointments(startDate, endDate, doctorId, status);
        return ResponseEntity.ok(ApiResponse.success(appointments));
    }

    @PutMapping("/{id}/status")
    @PreAuthorize("hasAnyRole('ADMIN','RECEPTIONIST','DOCTOR','NURSE')")
    public ResponseEntity<ApiResponse<AppointmentResponse>> updateStatus(
            @PathVariable Long id, @RequestBody Map<String, String> body) {
        String statusStr = body.get("status");
        if (statusStr == null) {
            return ResponseEntity.badRequest().body(ApiResponse.error("Status is required"));
        }
        com.medcenter.enums.AppointmentStatus newStatus =
                com.medcenter.enums.AppointmentStatus.valueOf(statusStr.toUpperCase());
        AppointmentResponse response = appointmentService.updateStatus(id, newStatus);
        return ResponseEntity.ok(ApiResponse.success("Status updated", response));
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
