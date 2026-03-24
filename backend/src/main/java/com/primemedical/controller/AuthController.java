package com.primemedical.controller;

import java.util.Map;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.primemedical.dto.request.ForgotPasswordRequest;
import com.primemedical.dto.request.LoginRequest;
import com.primemedical.dto.request.PatientRequest;
import com.primemedical.dto.request.ResetPasswordRequest;
import com.primemedical.dto.response.ApiResponse;
import com.primemedical.dto.response.LoginResponse;
import com.primemedical.dto.response.PatientResponse;
import com.primemedical.service.AuthService;
import com.primemedical.service.PatientService;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;

@RestController
@RequestMapping("/api/v1/auth")
@RequiredArgsConstructor
public class AuthController {

    private final AuthService authService;
    private final PatientService patientService;

    @PostMapping("/register")
    public ResponseEntity<ApiResponse<PatientResponse>> register(
            @Valid @RequestBody PatientRequest request) {
        PatientResponse response = patientService.registerPatient(request, true);
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
