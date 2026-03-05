package com.medcenter.controller;

import com.medcenter.dto.request.ConsultationNotesRequest;
import com.medcenter.dto.request.VitalSignsRequest;
import com.medcenter.dto.response.ApiResponse;
import com.medcenter.dto.response.ConsultationResponse;
import com.medcenter.repository.UserRepository;
import com.medcenter.service.ConsultationService;
import jakarta.validation.Valid;
import java.util.List;
import java.util.Map;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/consultations")
@RequiredArgsConstructor
public class ConsultationController {

    private final ConsultationService consultationService;
    private final UserRepository userRepository;

    @PostMapping
    @PreAuthorize("hasAnyRole('ADMIN','DOCTOR')")
    public ResponseEntity<ApiResponse<ConsultationResponse>> startConsultation(
            @RequestBody Map<String, Long> body) {
        Long appointmentId = body.get("appointmentId");
        Long queueEntryId = body.get("queueEntryId");
        Long doctorId = body.get("doctorId");

        ConsultationResponse response =
                consultationService.startConsultation(appointmentId, queueEntryId, doctorId);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success("Consultation started", response));
    }

    /**
     * Record vital signs. nurseId is extracted from the authenticated principal — the frontend no
     * longer needs to pass it as a query parameter.
     */
    @PostMapping("/{id}/vitals")
    @PreAuthorize("hasAnyRole('ADMIN','DOCTOR','NURSE')")
    public ResponseEntity<ApiResponse<ConsultationResponse>> recordVitals(
            @PathVariable Long id,
            @Valid @RequestBody VitalSignsRequest request,
            @AuthenticationPrincipal UserDetails principal) {
        Long nurseId =
            principal != null
                ? userRepository.findByEmail(principal.getUsername())
                    .map(com.medcenter.entity.User::getId)
                    .orElse(null)
                : null;
        ConsultationResponse response = consultationService.recordVitals(id, request, nurseId);
        return ResponseEntity.ok(ApiResponse.success("Vital signs recorded", response));
    }

    @PutMapping("/{id}/notes")
    @PreAuthorize("hasAnyRole('ADMIN','DOCTOR')")
    public ResponseEntity<ApiResponse<ConsultationResponse>> updateNotes(
            @PathVariable Long id, @RequestBody ConsultationNotesRequest request) {
        ConsultationResponse response = consultationService.updateNotes(id, request);
        return ResponseEntity.ok(ApiResponse.success("Consultation notes updated", response));
    }

    @PostMapping("/{id}/end")
    @PreAuthorize("hasAnyRole('ADMIN','DOCTOR')")
    public ResponseEntity<ApiResponse<ConsultationResponse>> endConsultation(
            @PathVariable Long id) {
        ConsultationResponse response = consultationService.endConsultation(id);
        return ResponseEntity.ok(ApiResponse.success("Consultation ended", response));
    }

    @GetMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN','DOCTOR','NURSE','PATIENT')")
    public ResponseEntity<ApiResponse<ConsultationResponse>> getConsultation(
            @PathVariable Long id) {
        ConsultationResponse response = consultationService.getConsultationById(id);
        return ResponseEntity.ok(ApiResponse.success(response));
    }

    @GetMapping("/patient/{patientId}")
    @PreAuthorize("hasAnyRole('ADMIN','DOCTOR','NURSE','RECEPTIONIST','PHARMACIST','PATIENT')")
    public ResponseEntity<ApiResponse<List<ConsultationResponse>>> getPatientHistory(
            @PathVariable Long patientId) {
        List<ConsultationResponse> history = consultationService.getPatientHistory(patientId);
        return ResponseEntity.ok(ApiResponse.success(history));
    }
}
