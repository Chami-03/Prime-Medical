package com.medcenter.controller;

import com.medcenter.dto.response.ApiResponse;
import com.medcenter.entity.StaffProfile;
import com.medcenter.entity.User;
import com.medcenter.enums.RoleName;
import com.medcenter.repository.StaffProfileRepository;
import com.medcenter.repository.UserRepository;
import java.util.List;
import java.util.stream.Collectors;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/users")
@RequiredArgsConstructor
public class UserController {

    private final UserRepository userRepository;
    private final StaffProfileRepository staffProfileRepository;

    /**
     * Returns a list of all users with the DOCTOR role. Used by the BookAppointmentPage to populate
     * the doctor dropdown.
     */
    @GetMapping("/doctors")
        @PreAuthorize("hasAnyRole('ADMIN','RECEPTIONIST','DOCTOR','NURSE','PHARMACIST','PATIENT')")
    public ResponseEntity<ApiResponse<List<DoctorSummary>>> getDoctors() {
        List<User> doctors = userRepository.findByRolesName(RoleName.DOCTOR);
        List<DoctorSummary> summaries =
                doctors.stream()
                        .map(
                                u -> {
                                    String specialization =
                                            staffProfileRepository
                                                    .findByUserId(u.getId())
                                                    .map(StaffProfile::getSpecialization)
                                                    .orElse(null);
                                    return new DoctorSummary(
                                            u.getId(),
                                            u.getFirstName(),
                                            u.getLastName(),
                                            specialization);
                                })
                        .collect(Collectors.toList());
        return ResponseEntity.ok(ApiResponse.success(summaries));
    }

    public record DoctorSummary(
            Long id, String firstName, String lastName, String specialization) {}
}
