package com.primemedical.dto.request;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class UserProfileUpdateRequest {

    @Size(min = 1, max = 100, message = "First name must be between 1 and 100 characters")
    private String firstName;

    @Size(min = 1, max = 100, message = "Last name must be between 1 and 100 characters")
    private String lastName;

    @Email(message = "Invalid email format")
    @Size(max = 150, message = "Email must be 150 characters or less")
    private String email;

    @Size(max = 20, message = "Phone must be 20 characters or less")
    private String phone;

    @Size(max = 500, message = "Profile photo URL must be 500 characters or less")
    private String profilePhotoUrl;

    private Boolean removeProfilePhoto;
}
