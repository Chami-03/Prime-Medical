package com.primemedical.controller;

import java.util.List;

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

import com.primemedical.dto.request.PrescriptionRequest;
import com.primemedical.dto.response.ApiResponse;
import com.primemedical.dto.response.PrescriptionResponse;
import com.primemedical.entity.User;
import com.primemedical.repository.UserRepository;
import com.primemedical.service.PrescriptionService;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;

@RestController
@RequestMapping("/api/v1/prescriptions")
@RequiredArgsConstructor
public class PrescriptionController {

    private final PrescriptionService prescriptionService;
    private final UserRepository userRepository;

    /** Create a prescription. doctorId is extracted from the authenticated principal. */
    @PostMapping
    @PreAuthorize("hasRole('DOCTOR')")
    public ResponseEntity<ApiResponse<PrescriptionResponse>> createPrescription(
            @Valid @RequestBody PrescriptionRequest request, Authentication authentication) {
        Long doctorId = resolveUserId(authentication);
        PrescriptionResponse response = prescriptionService.createPrescription(request, doctorId);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success("Prescription created", response));
    }

    @GetMapping("/consultation/{consultationId}")
    @PreAuthorize("hasAnyRole('ADMIN','DOCTOR','NURSE','PHARMACIST')")
    public ResponseEntity<ApiResponse<PrescriptionResponse>> getByConsultation(
            @PathVariable Long consultationId) {
        PrescriptionResponse response = prescriptionService.getByConsultationId(consultationId);
        return ResponseEntity.ok(ApiResponse.success(response));
    }

    @GetMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN','DOCTOR','NURSE','PHARMACIST','PATIENT')")
    public ResponseEntity<ApiResponse<PrescriptionResponse>> getPrescription(
            @PathVariable Long id) {
        PrescriptionResponse response = prescriptionService.getPrescriptionById(id);
        return ResponseEntity.ok(ApiResponse.success(response));
    }

        @GetMapping("/patient/{patientId}")
        @PreAuthorize("hasAnyRole('ADMIN','DOCTOR','NURSE','PHARMACIST','PATIENT')")
        public ResponseEntity<ApiResponse<List<PrescriptionResponse>>> getByPatient(
                        @PathVariable Long patientId) {
                return ResponseEntity.ok(ApiResponse.success(prescriptionService.getByPatientId(patientId)));
        }

        @GetMapping("/pending")
        @PreAuthorize("hasAnyRole('ADMIN','DOCTOR','PHARMACIST')")
        public ResponseEntity<ApiResponse<List<PrescriptionResponse>>> getPending() {
                return ResponseEntity.ok(ApiResponse.success(prescriptionService.getPendingPrescriptions()));
        }

        @GetMapping("/pending/recent")
        @PreAuthorize("hasAnyRole('ADMIN','DOCTOR','PHARMACIST')")
        public ResponseEntity<ApiResponse<List<PrescriptionResponse>>> getRecentlyPending(
                        @RequestParam(name = "minutes", defaultValue = "120") Integer minutes) {
                return ResponseEntity.ok(
                                ApiResponse.success(prescriptionService.getRecentlyPendingPrescriptions(minutes)));
        }

        @GetMapping("/dispensed/recent")
        @PreAuthorize("hasAnyRole('ADMIN','DOCTOR','PHARMACIST','RECEPTIONIST')")
        public ResponseEntity<ApiResponse<List<PrescriptionResponse>>> getRecentlyDispensed(
                        @RequestParam(name = "minutes", defaultValue = "120") Integer minutes) {
                return ResponseEntity.ok(
                                ApiResponse.success(prescriptionService.getRecentlyDispensedPrescriptions(minutes)));
        }

        @PutMapping("/{id}")
        @PreAuthorize("hasAnyRole('DOCTOR','ADMIN')")
        public ResponseEntity<ApiResponse<PrescriptionResponse>> updatePrescription(
                        @PathVariable Long id,
                        @Valid @RequestBody PrescriptionRequest request,
                        Authentication authentication) {
                Long doctorId = resolveUserId(authentication);
                PrescriptionResponse response = prescriptionService.updatePrescription(id, request, doctorId);
                return ResponseEntity.ok(ApiResponse.success("Prescription updated", response));
        }

        @DeleteMapping("/{id}")
        @PreAuthorize("hasAnyRole('DOCTOR','ADMIN')")
        public ResponseEntity<ApiResponse<Void>> deletePrescription(@PathVariable Long id) {
                prescriptionService.deletePrescription(id);
                return ResponseEntity.ok(ApiResponse.success("Prescription deleted", null));
        }

    @GetMapping("/{id}/allergy-check")
    @PreAuthorize("hasAnyRole('ADMIN','DOCTOR','NURSE','PHARMACIST')")
    public ResponseEntity<ApiResponse<List<PrescriptionService.AllergyWarning>>> checkAllergies(
            @PathVariable Long id) {
        return ResponseEntity.ok(
                ApiResponse.success(prescriptionService.checkAllergyConflicts(id)));
    }

    /**
     * Dispense a prescription. Request body may include { "overrideAllergyConfirmation": true } to
     * bypass allergy check.
     */
    @PostMapping("/{id}/dispense")
    @PreAuthorize("hasAnyRole('PHARMACIST','DOCTOR')")
    public ResponseEntity<ApiResponse<PrescriptionResponse>> dispensePrescription(
            @PathVariable Long id,
            @RequestBody(required = false) java.util.Map<String, Object> body,
                        Authentication authentication) {
                Long pharmacistId = resolveUserId(authentication);
        boolean override =
                body != null && Boolean.TRUE.equals(body.get("overrideAllergyConfirmation"));
        PrescriptionResponse response =
                prescriptionService.dispensePrescription(id, pharmacistId, override);
        return ResponseEntity.ok(ApiResponse.success("Prescription dispensed", response));
    }

        private Long resolveUserId(Authentication authentication) {
                if (authentication == null || authentication.getName() == null) return null;
                return userRepository.findByEmail(authentication.getName()).map(User::getId).orElse(null);
    }
}
