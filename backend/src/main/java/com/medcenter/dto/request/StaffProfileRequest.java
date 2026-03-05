package com.medcenter.dto.request;

import java.util.List;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class StaffProfileRequest {
    private String firstName;
    private String lastName;
    private String phone;
    private String profilePhotoUrl;
    private String role; // Enum: DOCTOR, NURSE, PHARMACIST, RECEPTIONIST, ADMIN
    private List<String> permissions; // e.g., ["MANAGE_INVENTORY", "MANAGE_APPOINTMENTS"]
    private String specialization;
    private String licenseNumber;
}
