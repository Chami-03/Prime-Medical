package com.primemedical.controller;

import java.util.List;
import java.util.Locale;

import org.springframework.core.io.Resource;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

import com.primemedical.dto.request.UserProfileUpdateRequest;
import com.primemedical.dto.response.ApiResponse;
import com.primemedical.dto.response.UserProfileResponse;
import com.primemedical.entity.StaffProfile;
import com.primemedical.entity.User;
import com.primemedical.enums.RoleName;
import com.primemedical.repository.StaffProfileRepository;
import com.primemedical.repository.UserRepository;
import com.primemedical.service.UserService;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;

@RestController
@RequestMapping("/api/v1/users")
@RequiredArgsConstructor
public class UserController {

        private static final String CANONICAL_DOCTOR_EMAIL = "doctor@primemedical.lk";
        private static final String CANONICAL_DOCTOR_FIRST_NAME = "pulasthi";
        private static final String CANONICAL_DOCTOR_LAST_NAME = "senevirathne";

    private final UserRepository userRepository;
    private final StaffProfileRepository staffProfileRepository;
        private final UserService userService;

        @GetMapping("/me/profile")
        @PreAuthorize("hasAnyRole('ADMIN','OWNER','RECEPTIONIST','DOCTOR','NURSE','PHARMACIST','PATIENT')")
        public ResponseEntity<ApiResponse<UserProfileResponse>> getMyProfile(Authentication authentication) {
                UserProfileResponse profile = userService.getMyProfile(authentication.getName());
                return ResponseEntity.ok(ApiResponse.success(profile));
        }

        @PutMapping("/me/profile")
        @PreAuthorize("hasAnyRole('ADMIN','OWNER','RECEPTIONIST','DOCTOR','NURSE','PHARMACIST','PATIENT')")
        public ResponseEntity<ApiResponse<UserProfileResponse>> updateMyProfile(
                        Authentication authentication, @Valid @RequestBody UserProfileUpdateRequest request) {
                UserProfileResponse profile = userService.updateMyProfile(authentication.getName(), request);
                return ResponseEntity.ok(ApiResponse.success("Profile updated", profile));
        }

        @PostMapping(value = "/me/profile-photo", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
        @PreAuthorize("hasAnyRole('ADMIN','OWNER','RECEPTIONIST','DOCTOR','NURSE','PHARMACIST','PATIENT')")
        public ResponseEntity<ApiResponse<UserProfileResponse>> uploadMyProfilePhoto(
                        Authentication authentication, @RequestParam("file") MultipartFile file) {
                UserProfileResponse profile = userService.uploadMyProfilePhoto(authentication.getName(), file);
                return ResponseEntity.ok(ApiResponse.success("Profile photo updated", profile));
        }

        @GetMapping(value = "/profile-photos/{filename:.+}")
        public ResponseEntity<Resource> getProfilePhoto(@PathVariable String filename) {
                return userService.buildProfilePhotoResponse(filename);
        }

    /**
     * Returns a list of all users with the DOCTOR role. Used by the BookAppointmentPage to populate
     * the doctor dropdown.
     */
    @GetMapping("/doctors")
        @PreAuthorize("hasAnyRole('ADMIN','RECEPTIONIST','DOCTOR','NURSE','PHARMACIST','PATIENT')")
    public ResponseEntity<ApiResponse<List<DoctorSummary>>> getDoctors() {
        List<User> doctors = userRepository.findByRolesName(RoleName.DOCTOR);

        User selectedDoctor =
                doctors.stream()
                        .filter(u -> Boolean.TRUE.equals(u.getIsActive()))
                        .filter(
                                u ->
                                        CANONICAL_DOCTOR_EMAIL.equals(normalize(u.getEmail()))
                                                || (CANONICAL_DOCTOR_FIRST_NAME.equals(
                                                                normalize(u.getFirstName()))
                                                        && CANONICAL_DOCTOR_LAST_NAME.equals(
                                                                normalize(u.getLastName()))))
                        .findFirst()
                        .orElseGet(
                                () ->
                                        doctors.stream()
                                                .filter(u -> Boolean.TRUE.equals(u.getIsActive()))
                                                .findFirst()
                                                .orElse(null));

        List<DoctorSummary> summaries =
                selectedDoctor == null
                        ? List.of()
                        : List.of(
                                new DoctorSummary(
                                        selectedDoctor.getId(),
                                        selectedDoctor.getFirstName(),
                                        selectedDoctor.getLastName(),
                                        staffProfileRepository
                                                .findByUserId(selectedDoctor.getId())
                                                .map(StaffProfile::getSpecialization)
                                                .orElse(null)));
        return ResponseEntity.ok(ApiResponse.success(summaries));
    }

    private String normalize(String value) {
        return value == null ? "" : value.trim().toLowerCase(Locale.ROOT);
    }

    public record DoctorSummary(
            Long id, String firstName, String lastName, String specialization) {}
}
