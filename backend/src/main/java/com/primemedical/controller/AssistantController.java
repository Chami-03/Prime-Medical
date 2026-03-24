package com.primemedical.controller;

import com.primemedical.dto.request.AssistantChatRequest;
import com.primemedical.dto.response.ApiResponse;
import com.primemedical.dto.response.AssistantChatResponse;
import com.primemedical.service.AssistantService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/assistant")
@RequiredArgsConstructor
public class AssistantController {

    private final AssistantService assistantService;

    @PostMapping("/chat")
    @PreAuthorize("hasAnyRole('ADMIN','RECEPTIONIST','DOCTOR','NURSE','PHARMACIST','PATIENT')")
    public ResponseEntity<ApiResponse<AssistantChatResponse>> chat(
            @Valid @RequestBody AssistantChatRequest request) {
        String reply = assistantService.generateReply(request);
        AssistantChatResponse payload = AssistantChatResponse.builder().reply(reply).build();
        return ResponseEntity.ok(ApiResponse.success(payload));
    }
}
