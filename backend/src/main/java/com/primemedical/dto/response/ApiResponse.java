package com.primemedical.dto.response;

import com.fasterxml.jackson.annotation.JsonInclude;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * Generic API response wrapper. Provides a consistent structure for all REST endpoints.
 *
 * @param <T> the type of the response data payload
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
@JsonInclude(JsonInclude.Include.NON_NULL)
public class ApiResponse<T> {

    private boolean success;

    private String message;

    private T data;

    // ── Static factory helpers ───────────────────────────────────

    public static <T> ApiResponse<T> success(T data) {
        return ApiResponse.<T>builder().success(true).message("Success").data(data).build();
    }

    public static <T> ApiResponse<T> success(String message, T data) {
        return ApiResponse.<T>builder().success(true).message(message).data(data).build();
    }

    public static <T> ApiResponse<T> error(String message) {
        return ApiResponse.<T>builder().success(false).message(message).data(null).build();
    }
}
