package com.medcenter.dto.response;

import java.util.List;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class StaffProfileResponse {
    private Long id;
    private Long userId;
    private String email;
    private String firstName;
    private String lastName;
    private String phone;
    private String profilePhotoUrl;
    private String role;
    private List<String> permissions;
    private String specialization;
    private String licenseNumber;
    private Boolean isActive;
    private String bio;
}
