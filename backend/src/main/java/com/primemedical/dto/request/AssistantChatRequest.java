package com.primemedical.dto.request;

import java.util.ArrayList;
import java.util.List;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class AssistantChatRequest {

    @NotBlank(message = "Message is required")
    @Size(max = 2000, message = "Message must be 2000 characters or less")
    private String message;

    @Valid
    private List<HistoryMessage> history = new ArrayList<>();

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class HistoryMessage {
        @NotBlank(message = "History role is required")
        @Size(max = 20, message = "History role is too long")
        private String role;

        @NotBlank(message = "History content is required")
        @Size(max = 2000, message = "History content must be 2000 characters or less")
        private String content;
    }
}
