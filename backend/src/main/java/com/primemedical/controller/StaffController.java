package com.primemedical.controller;

import com.primemedical.dto.request.StaffCreateRequest;
import com.primemedical.dto.request.StaffProfileRequest;
import com.primemedical.dto.response.ApiResponse;
import com.primemedical.dto.response.StaffProfileResponse;
import com.primemedical.service.StaffService;
import jakarta.validation.Valid;
import java.util.List;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/staff")
@RequiredArgsConstructor
public class StaffController {

    private final StaffService staffService;

    @GetMapping
    @PreAuthorize("hasAnyRole('ADMIN', 'OWNER', 'DOCTOR')")
    public ResponseEntity<ApiResponse<List<StaffProfileResponse>>> getAllProfiles() {
        return ResponseEntity.ok(ApiResponse.success(staffService.getAllProfiles()));
    }

    @PostMapping
    @PreAuthorize("hasAnyRole('ADMIN', 'OWNER')")
    public ResponseEntity<ApiResponse<StaffProfileResponse>> createStaff(
            @Valid @RequestBody StaffCreateRequest request) {
        StaffProfileResponse created = staffService.createStaff(request);
        return ResponseEntity.ok(ApiResponse.success("Staff profile created", created));
    }

    @PutMapping("/{userId}")
    @PreAuthorize("hasAnyRole('ADMIN', 'OWNER', 'DOCTOR')")
    public ResponseEntity<ApiResponse<StaffProfileResponse>> updateStaffProfile(
            @PathVariable Long userId, @RequestBody StaffProfileRequest request) {
        StaffProfileResponse updated = staffService.updateStaffProfile(userId, request);
        return ResponseEntity.ok(ApiResponse.success("Staff profile updated", updated));
    }

    @DeleteMapping("/{userId}")
    @PreAuthorize("hasAnyRole('ADMIN', 'OWNER')")
    public ResponseEntity<ApiResponse<Void>> deactivateStaff(@PathVariable Long userId) {
        staffService.deactivateStaff(userId);
        return ResponseEntity.ok(ApiResponse.success("Staff member deactivated", null));
    }
}
