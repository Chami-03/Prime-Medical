package com.primemedical.controller;

import java.util.List;
import java.util.Map;

import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.servlet.mvc.method.annotation.SseEmitter;

import com.primemedical.dto.request.BloodCheckupUpdateRequest;
import com.primemedical.dto.request.ConsultationNotesRequest;
import com.primemedical.dto.request.VitalSignsRequest;
import com.primemedical.dto.response.ApiResponse;
import com.primemedical.dto.response.ConsultationResponse;
import com.primemedical.repository.UserRepository;
import com.primemedical.service.ConsultationEventStreamService;
import com.primemedical.service.ConsultationService;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;

@RestController
@RequestMapping("/api/v1/consultations")
@RequiredArgsConstructor
public class ConsultationController {

    private final ConsultationService consultationService;
    private final ConsultationEventStreamService consultationEventStreamService;
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
                    .map(com.primemedical.entity.User::getId)
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

        @PutMapping("/{id}/blood-checkup")
        @PreAuthorize("hasAnyRole('ADMIN','DOCTOR','NURSE')")
        public ResponseEntity<ApiResponse<ConsultationResponse>> updateBloodCheckup(
            @PathVariable Long id,
            @RequestBody BloodCheckupUpdateRequest request,
            @AuthenticationPrincipal UserDetails principal) {
        Long staffId =
            principal != null
                ? userRepository
                    .findByEmail(principal.getUsername())
                    .map(com.primemedical.entity.User::getId)
                    .orElse(null)
                : null;

        ConsultationResponse response = consultationService.updateBloodCheckup(id, request, staffId);
        return ResponseEntity.ok(ApiResponse.success("Blood checkup updated", response));
        }

    @PostMapping("/{id}/end")
    @PreAuthorize("hasAnyRole('ADMIN','DOCTOR')")
    public ResponseEntity<ApiResponse<ConsultationResponse>> endConsultation(
            @PathVariable Long id, Authentication authentication) {
        ConsultationResponse response = consultationService.endConsultation(id, authentication.getName());
        return ResponseEntity.ok(ApiResponse.success("Consultation ended", response));
    }

    @GetMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN','DOCTOR','NURSE','PATIENT')")
    public ResponseEntity<ApiResponse<ConsultationResponse>> getConsultation(
            @PathVariable Long id) {
        ConsultationResponse response = consultationService.getConsultationById(id);
        return ResponseEntity.ok(ApiResponse.success(response));
    }

    @GetMapping(value = "/{id}/events", produces = MediaType.TEXT_EVENT_STREAM_VALUE)
    @PreAuthorize("hasAnyRole('ADMIN','DOCTOR','NURSE')")
    public SseEmitter streamConsultationEvents(@PathVariable Long id) {
        // Ensure consultation exists before opening stream.
        consultationService.getConsultationById(id);
        return consultationEventStreamService.subscribe(id);
    }

    @GetMapping("/patient/{patientId}")
    @PreAuthorize("hasAnyRole('ADMIN','DOCTOR','NURSE','RECEPTIONIST','PHARMACIST','PATIENT')")
    public ResponseEntity<ApiResponse<List<ConsultationResponse>>> getPatientHistory(
            @PathVariable Long patientId) {
        List<ConsultationResponse> history = consultationService.getPatientHistory(patientId);
        return ResponseEntity.ok(ApiResponse.success(history));
    }

    @GetMapping("/blood-checkup/pending")
    @PreAuthorize("hasAnyRole('ADMIN','NURSE','DOCTOR')")
    public ResponseEntity<ApiResponse<List<ConsultationResponse>>> getPendingBloodCheckups() {
        return ResponseEntity.ok(ApiResponse.success(consultationService.getPendingBloodCheckups()));
    }

        @GetMapping("/blood-checkup/completed")
        @PreAuthorize("hasAnyRole('ADMIN','DOCTOR')")
        public ResponseEntity<ApiResponse<List<ConsultationResponse>>> getCompletedBloodCheckups(
            Authentication authentication) {
        Long doctorId =
            authentication != null
                ? userRepository
                    .findByEmail(authentication.getName())
                    .map(com.primemedical.entity.User::getId)
                    .orElse(null)
                : null;
        return ResponseEntity.ok(
            ApiResponse.success(consultationService.getCompletedBloodCheckupsForDoctor(doctorId)));
        }
}
