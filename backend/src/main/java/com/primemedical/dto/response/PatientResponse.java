package com.primemedical.dto.response;

import com.primemedical.enums.Gender;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class PatientResponse {

    private Long id;

    private Long userId;

    private String patientNumber;

    private String firstName;

    private String lastName;

    private String email;

    private String phone;

    private LocalDate dateOfBirth;

    /** Calculated age in years */
    private Integer age;

    private Gender gender;

    private String address;

    private String nicNumber;

    private String emergencyContactName;

    private String emergencyContactPhone;

    private String medicalNotes;

    private Boolean emailNotifications;

    private Boolean smsNotifications;

    private String profilePhotoUrl;

    private List<AllergyInfo> allergies;

    private LocalDateTime createdAt;

    private LocalDateTime updatedAt;

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class AllergyInfo {
        private Long id;
        private String allergen;
        private String reaction;
        private String severity;
        private String notedByName;
        private LocalDateTime notedAt;
    }
}
