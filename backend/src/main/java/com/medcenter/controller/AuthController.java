package com.medcenter.controller;

import com.medcenter.dto.request.ForgotPasswordRequest;
import com.medcenter.dto.request.LoginRequest;
import com.medcenter.dto.request.PatientRequest;
import com.medcenter.dto.request.ResetPasswordRequest;
import com.medcenter.dto.response.ApiResponse;
import com.medcenter.dto.response.LoginResponse;
import com.medcenter.dto.response.PatientResponse;
import com.medcenter.service.AuthService;
import com.medcenter.service.PatientService;
import jakarta.validation.Valid;
import java.util.Map;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/auth")
@RequiredArgsConstructor
public class AuthController {

    private final AuthService authService;
    private final PatientService patientService;

    @PostMapping("/register")
    public ResponseEntity<ApiResponse<PatientResponse>> register(
            @Valid @RequestBody PatientRequest request) {
        PatientResponse response = patientService.registerPatient(request);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success("Registration successful", response));
    }

    @PostMapping("/login")
    public ResponseEntity<ApiResponse<LoginResponse>> login(
            @Valid @RequestBody LoginRequest request) {
        LoginResponse response = authService.login(request);
        return ResponseEntity.ok(ApiResponse.success("Login successful", response));
    }

    @PostMapping("/refresh")
    public ResponseEntity<ApiResponse<LoginResponse>> refresh(
            @RequestBody Map<String, String> body) {
        String refreshToken = body.get("refreshToken");
        LoginResponse response = authService.refreshToken(refreshToken);
        return ResponseEntity.ok(ApiResponse.success("Token refreshed", response));
    }

    @PostMapping("/forgot-password")
    public ResponseEntity<ApiResponse<Void>> forgotPassword(
            @Valid @RequestBody ForgotPasswordRequest request) {
        authService.forgotPassword(request.getEmail());
        return ResponseEntity.ok(ApiResponse.success("Password reset email sent", null));
    }

    @PostMapping("/reset-password")
    public ResponseEntity<ApiResponse<Void>> resetPassword(
            @Valid @RequestBody ResetPasswordRequest request) {
        authService.resetPassword(
                request.getToken(), request.getNewPassword(), request.getConfirmPassword());
        return ResponseEntity.ok(ApiResponse.success("Password reset successful", null));
    }
}
