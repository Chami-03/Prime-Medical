package com.primemedical.controller;

import com.primemedical.dto.request.BillRequest;
import com.primemedical.dto.request.PaymentRequest;
import com.primemedical.dto.response.ApiResponse;
import com.primemedical.dto.response.BillResponse;
import com.primemedical.service.BillingService;
import jakarta.validation.Valid;
import java.util.List;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/bills")
@RequiredArgsConstructor
public class BillingController {

    private final BillingService billingService;

    @PostMapping
    @PreAuthorize("hasAnyRole('ADMIN','RECEPTIONIST','DOCTOR','PHARMACIST')")
    public ResponseEntity<ApiResponse<BillResponse>> generateBill(
            @Valid @RequestBody BillRequest request, Authentication authentication) {
        String userEmail = authentication.getName();
        BillResponse response = billingService.generateBill(request, userEmail);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success("Bill generated", response));
    }

    @GetMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN','RECEPTIONIST','DOCTOR','PHARMACIST','PATIENT')")
    public ResponseEntity<ApiResponse<BillResponse>> getBillById(@PathVariable Long id) {
        BillResponse response = billingService.getBillById(id);
        return ResponseEntity.ok(ApiResponse.success(response));
    }

    @PostMapping("/{id}/payments")
    @PreAuthorize("hasAnyRole('ADMIN','RECEPTIONIST','DOCTOR','PHARMACIST')")
    public ResponseEntity<ApiResponse<BillResponse>> processPayment(
            @PathVariable Long id,
            @Valid @RequestBody PaymentRequest request,
            Authentication authentication) {
        String userEmail = authentication.getName();
        BillResponse response = billingService.processPayment(id, request, userEmail);
        return ResponseEntity.ok(ApiResponse.success("Payment processed", response));
    }

    @GetMapping("/patient/{patientId}")
    @PreAuthorize("hasAnyRole('ADMIN','RECEPTIONIST','DOCTOR','PATIENT')")
    public ResponseEntity<ApiResponse<List<BillResponse>>> getBillsByPatient(
            @PathVariable Long patientId) {
        List<BillResponse> bills = billingService.getBillsByPatientId(patientId);
        return ResponseEntity.ok(ApiResponse.success(bills));
    }
}
