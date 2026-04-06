package com.primemedical.controller;

import java.util.List;

import org.springframework.http.HttpStatus;
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

import com.primemedical.dto.request.QueueCheckInRequest;
import com.primemedical.dto.request.VitalSignsRequest;
import com.primemedical.dto.response.ApiResponse;
import com.primemedical.dto.response.QueueEntryResponse;
import com.primemedical.repository.UserRepository;
import com.primemedical.service.QueueService;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;

@RestController
@RequestMapping("/api/v1/queue")
@RequiredArgsConstructor
public class QueueController {

    private final QueueService queueService;
    private final UserRepository userRepository;

    @PostMapping("/check-in")
    @PreAuthorize("hasAnyRole('ADMIN','RECEPTIONIST','DOCTOR')")
    public ResponseEntity<ApiResponse<QueueEntryResponse>> checkIn(
            @Valid @RequestBody QueueCheckInRequest request,
            Authentication authentication) {
        QueueEntryResponse response = queueService.checkIn(request, authentication.getName());
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(
                        ApiResponse.success(
                                "Patient checked in — Queue #" + response.getQueueNumber(),
                                response));
    }

    @GetMapping("/today")
    @PreAuthorize("hasAnyRole('ADMIN','RECEPTIONIST','DOCTOR','NURSE','PHARMACIST')")
    public ResponseEntity<ApiResponse<List<QueueEntryResponse>>> getTodayQueue() {
        List<QueueEntryResponse> queue = queueService.getTodayQueue();
        return ResponseEntity.ok(ApiResponse.success(queue));
    }

    @PutMapping("/{id}/call-next")
    @PreAuthorize("hasAnyRole('ADMIN','RECEPTIONIST','DOCTOR','NURSE')")
    public ResponseEntity<ApiResponse<QueueEntryResponse>> callNext(@PathVariable Long id) {
        QueueEntryResponse response = queueService.callNext(id);
        return ResponseEntity.ok(ApiResponse.success("Patient called", response));
    }

    @PutMapping("/{id}/complete")
    @PreAuthorize("hasAnyRole('ADMIN','DOCTOR')")
    public ResponseEntity<ApiResponse<QueueEntryResponse>> complete(
            @PathVariable Long id, Authentication authentication) {
        QueueEntryResponse response = queueService.complete(id, authentication.getName());
        return ResponseEntity.ok(ApiResponse.success("Queue entry completed", response));
    }

    @PutMapping("/{id}/no-show")
    @PreAuthorize("hasAnyRole('ADMIN','RECEPTIONIST','DOCTOR')")
    public ResponseEntity<ApiResponse<QueueEntryResponse>> markNoShow(
            @PathVariable Long id, Authentication authentication) {
        QueueEntryResponse response = queueService.markNoShow(id, authentication.getName());
        return ResponseEntity.ok(ApiResponse.success("Marked as no-show", response));
    }

    @PostMapping("/{id}/vitals")
    @PreAuthorize("hasAnyRole('ADMIN','DOCTOR','NURSE')")
    public ResponseEntity<ApiResponse<QueueEntryResponse>> recordVitals(
            @PathVariable Long id,
            @Valid @RequestBody VitalSignsRequest request,
            @AuthenticationPrincipal UserDetails principal) {
        Long nurseId =
            principal != null
                ? userRepository.findByEmail(principal.getUsername())
                    .map(com.primemedical.entity.User::getId)
                    .orElse(null)
                : null;
        QueueEntryResponse response = queueService.recordVitals(id, request, nurseId);
        return ResponseEntity.ok(ApiResponse.success("Vital signs recorded", response));
    }
}
