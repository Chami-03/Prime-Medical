package com.medcenter.controller;

import com.medcenter.dto.request.PrescriptionRequest;
import com.medcenter.dto.response.ApiResponse;
import com.medcenter.dto.response.PrescriptionResponse;
import com.medcenter.entity.User;
import com.medcenter.repository.UserRepository;
import com.medcenter.service.PrescriptionService;
import jakarta.validation.Valid;
import java.util.List;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

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
