package com.primemedical.controller;

import java.util.List;
import java.util.Map;

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

import com.primemedical.dto.request.PatientRequest;
import com.primemedical.dto.response.ApiResponse;
import com.primemedical.dto.response.PatientResponse;
import com.primemedical.enums.AllergySeverity;
import com.primemedical.exception.BadRequestException;
import com.primemedical.service.PatientService;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

@RestController
@RequestMapping("/api/v1/patients")
@RequiredArgsConstructor
@Slf4j
public class PatientController {

    private final PatientService patientService;

    @PostMapping
    @PreAuthorize("hasAnyRole('ADMIN','RECEPTIONIST','DOCTOR','NURSE','PHARMACIST')")
    public ResponseEntity<ApiResponse<PatientResponse>> registerPatient(
            @Valid @RequestBody PatientRequest request) {
        PatientResponse response = patientService.registerPatient(request);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success("Patient registered successfully", response));
    }

    @GetMapping
    @PreAuthorize("hasAnyRole('ADMIN','RECEPTIONIST','DOCTOR','NURSE','PHARMACIST')")
    public ResponseEntity<ApiResponse<List<PatientResponse>>> getAllPatients() {
        List<PatientResponse> results = patientService.getAllPatients();
        return ResponseEntity.ok(ApiResponse.success(results));
    }

    @GetMapping("/search")
    @PreAuthorize("hasAnyRole('ADMIN','RECEPTIONIST','DOCTOR','NURSE','PHARMACIST')")
    public ResponseEntity<ApiResponse<List<PatientResponse>>> searchPatients(
            @RequestParam(required = false) String query) {
        List<PatientResponse> results = patientService.searchPatients(query);
        return ResponseEntity.ok(ApiResponse.success(results));
    }

    @GetMapping("/{id:\\d+}")
    @PreAuthorize("hasAnyRole('ADMIN', 'RECEPTIONIST', 'DOCTOR', 'NURSE', 'PHARMACIST', 'PATIENT')")
    public ResponseEntity<ApiResponse<PatientResponse>> getPatient(@PathVariable Long id) {
        PatientResponse response = patientService.getPatientById(id);
        return ResponseEntity.ok(ApiResponse.success(response));
    }

    @GetMapping("/me")
    @PreAuthorize("hasRole('PATIENT')")
    public ResponseEntity<ApiResponse<PatientResponse>> getMyPatientProfile(Authentication authentication) {
        String userEmail = authentication.getName();
        PatientResponse response = patientService.getPatientByEmail(userEmail);
        return ResponseEntity.ok(ApiResponse.success(response));
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN','RECEPTIONIST','DOCTOR','NURSE','PHARMACIST')")
    public ResponseEntity<ApiResponse<PatientResponse>> updatePatient(
            @PathVariable Long id, @Valid @RequestBody PatientRequest request) {
        PatientResponse response = patientService.updatePatient(id, request);
        return ResponseEntity.ok(ApiResponse.success("Patient updated", response));
    }
    
    @DeleteMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN','RECEPTIONIST')")
    public ResponseEntity<ApiResponse<Void>> deactivate(@PathVariable Long id) {
        patientService.deactivatePatient(id);
        return ResponseEntity.ok(ApiResponse.success("Patient deleted permanently", null));
    }

    @DeleteMapping("/me")
    @PreAuthorize("hasRole('PATIENT')")
    public ResponseEntity<ApiResponse<Void>> deactivateMyAccount(Authentication authentication) {
        patientService.deactivatePatientByEmail(authentication.getName());
        return ResponseEntity.ok(ApiResponse.success("Your account has been deleted permanently", null));
    }

    @PostMapping("/{id}/allergies")
    @PreAuthorize("hasAnyRole('ADMIN','DOCTOR','NURSE','RECEPTIONIST','PHARMACIST')")
    public ResponseEntity<ApiResponse<PatientResponse>> addAllergy(
            @PathVariable Long id,
            @RequestBody Map<String, String> body,
            Authentication authentication) {
        String allergen = body.get("allergen");
        if (allergen == null || allergen.trim().isEmpty()) {
            throw new BadRequestException("Allergen is required");
        }

        String reaction = body.get("reaction");
        String severityStr = body.getOrDefault("severity", "MILD").toUpperCase();

        AllergySeverity severity;
        try {
            severity = AllergySeverity.valueOf(severityStr);
        } catch (IllegalArgumentException e) {
            throw new BadRequestException(
                    "Invalid allergy severity. Allowed values: MILD, MODERATE, SEVERE, LIFE_THREATENING");
        }

        // Use authenticated user email for mapping
        String userEmail = authentication.getName();
        PatientResponse response =
            patientService.addAllergy(id, allergen.trim(), reaction, severity, userEmail);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success("Allergy added", response));
    }

    @PutMapping("/{id}/allergies/{allergyId}")
    @PreAuthorize("hasAnyRole('ADMIN','DOCTOR','NURSE','RECEPTIONIST','PHARMACIST')")
    public ResponseEntity<ApiResponse<PatientResponse>> updateAllergy(
            @PathVariable Long id,
            @PathVariable Long allergyId,
            @RequestBody Map<String, String> body,
            Authentication authentication) {
        String allergen = body.get("allergen");
        if (allergen == null || allergen.trim().isEmpty()) {
            throw new BadRequestException("Allergen is required");
        }

        String reaction = body.get("reaction");
        String severityStr = body.getOrDefault("severity", "MILD").toUpperCase();

        AllergySeverity severity;
        try {
            severity = AllergySeverity.valueOf(severityStr);
        } catch (IllegalArgumentException e) {
            throw new BadRequestException(
                    "Invalid allergy severity. Allowed values: MILD, MODERATE, SEVERE, LIFE_THREATENING");
        }

        String userEmail = authentication.getName();
        PatientResponse response =
                patientService.updateAllergy(id, allergyId, allergen.trim(), reaction, severity, userEmail);
        return ResponseEntity.ok(ApiResponse.success("Allergy updated", response));
    }
}
