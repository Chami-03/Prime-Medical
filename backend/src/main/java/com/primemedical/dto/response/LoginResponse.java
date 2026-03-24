package com.primemedical.dto.response;

import java.util.List;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class LoginResponse {

    private String accessToken;

    private String refreshToken;

    @Builder.Default private String tokenType = "Bearer";

    private Long userId;

    private String email;

    private String fullName;

    private List<String> roles;
}
