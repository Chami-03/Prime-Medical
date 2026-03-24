package com.primemedical.service;

import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Locale;
import java.util.stream.Collectors;

import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.primemedical.dto.request.StaffCreateRequest;
import com.primemedical.dto.request.StaffProfileRequest;
import com.primemedical.dto.response.StaffProfileResponse;
import com.primemedical.entity.Role;
import com.primemedical.entity.StaffProfile;
import com.primemedical.entity.User;
import com.primemedical.enums.RoleName;
import com.primemedical.exception.BadRequestException;
import com.primemedical.exception.ResourceNotFoundException;
import com.primemedical.repository.RoleRepository;
import com.primemedical.repository.StaffProfileRepository;
import com.primemedical.repository.UserRepository;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

@Service
@RequiredArgsConstructor
@Slf4j
public class StaffService {

        private static final String CANONICAL_DOCTOR_EMAIL = "doctor@primemedical.lk";
        private static final String CANONICAL_DOCTOR_FIRST_NAME = "pulasthi";
        private static final String CANONICAL_DOCTOR_LAST_NAME = "senevirathne";

    private final UserRepository userRepository;
    private final StaffProfileRepository staffProfileRepository;
    private final RoleRepository roleRepository;
    private final PasswordEncoder passwordEncoder;

    @Transactional
    public StaffProfileResponse createStaff(StaffCreateRequest request) {
        if (userRepository.existsByEmail(request.getEmail())) {
            throw new BadRequestException("Email already registered: " + request.getEmail());
        }

        RoleName roleName;
        try {
            roleName = RoleName.valueOf(request.getRole().toUpperCase());
        } catch (IllegalArgumentException e) {
            throw new BadRequestException("Invalid role provided: " + request.getRole());
        }

        Role role =
                roleRepository
                        .findByName(roleName)
                        .orElseThrow(
                                () ->
                                        new ResourceNotFoundException(
                                                "Role", "name", request.getRole()));

        enforceSingleDoctorConstraint(
                roleName,
                request.getEmail(),
                request.getFirstName(),
                request.getLastName(),
                null);

        String rawPassword =
                request.getPassword() != null && !request.getPassword().isBlank()
                        ? request.getPassword()
                        : "Password123!";

        User user =
                User.builder()
                        .email(request.getEmail())
                        .passwordHash(passwordEncoder.encode(rawPassword))
                        .firstName(request.getFirstName())
                        .lastName(request.getLastName())
                        .phone(request.getPhone())
                        .isActive(true)
                        .roles(java.util.Set.of(role))
                        .build();
        user = userRepository.save(user);

        StaffProfile profile =
                StaffProfile.builder()
                        .user(user)
                        .permissions(request.getPermissions())
                        .specialization(request.getSpecialization())
                        .licenseNumber(request.getLicenseNumber())
                        .build();
        staffProfileRepository.save(profile);

        log.info("Staff created: {} ({})", user.getEmail(), roleName);
        return mapToResponse(user);
    }

    @Transactional(readOnly = true)
    public List<StaffProfileResponse> getAllProfiles() {
        List<StaffProfileResponse> dedupedByEmail =
                userRepository.findAll().stream()
                .filter(u -> !u.getRoles().stream().allMatch(r -> r.getName() == RoleName.PATIENT))
                .map(this::mapToResponse)
                .filter(p -> p.getUserId() != null && p.getEmail() != null)
                .collect(
                        Collectors.collectingAndThen(
                                Collectors.toMap(
                                        p -> normalize(p.getEmail()),
                                        p -> p,
                                        (existing, ignored) -> existing,
                                        LinkedHashMap::new),
                                m -> List.copyOf(m.values())));

        List<StaffProfileResponse> dedupedByName =
                dedupedByEmail.stream()
                        .collect(
                                Collectors.collectingAndThen(
                                        Collectors.toMap(
                                                p ->
                                                        (normalize(p.getFirstName())
                                                                        + "|"
                                                                        + normalize(p.getLastName())),
                                                p -> p,
                                                this::pickPreferredProfile,
                                                LinkedHashMap::new),
                                        m -> List.copyOf(m.values())));

        List<StaffProfileResponse> nonDoctors =
                dedupedByName.stream()
                        .filter(p -> !"DOCTOR".equalsIgnoreCase(p.getRole()))
                        .collect(Collectors.toCollection(ArrayList::new));

        StaffProfileResponse canonicalDoctor =
                dedupedByName.stream()
                        .filter(p -> "DOCTOR".equalsIgnoreCase(p.getRole()))
                        .filter(
                                p ->
                                        normalize(p.getEmail()).equals(CANONICAL_DOCTOR_EMAIL)
                                                || (normalize(p.getFirstName())
                                                                .equals(CANONICAL_DOCTOR_FIRST_NAME)
                                                        && normalize(p.getLastName())
                                                                .equals(CANONICAL_DOCTOR_LAST_NAME)))
                        .findFirst()
                        .orElseGet(
                                () ->
                                        dedupedByName.stream()
                                                .filter(p -> "DOCTOR".equalsIgnoreCase(p.getRole()))
                                                .findFirst()
                                                .orElse(null));

        if (canonicalDoctor != null) {
            nonDoctors.add(canonicalDoctor);
        }

        return nonDoctors;
    }

        private StaffProfileResponse pickPreferredProfile(
                        StaffProfileResponse existing, StaffProfileResponse candidate) {
                boolean existingActive = Boolean.TRUE.equals(existing.getIsActive());
                boolean candidateActive = Boolean.TRUE.equals(candidate.getIsActive());

                if (candidateActive && !existingActive) {
                        return candidate;
                }

                return existing;
        }

    @Transactional
    public StaffProfileResponse updateStaffProfile(Long userId, StaffProfileRequest request) {
        User user =
                userRepository
                        .findById(userId)
                        .orElseThrow(() -> new ResourceNotFoundException("User", "id", userId));

        // Update basic info
        user.setFirstName(
                request.getFirstName() != null ? request.getFirstName() : user.getFirstName());
        user.setLastName(
                request.getLastName() != null ? request.getLastName() : user.getLastName());
        user.setPhone(request.getPhone() != null ? request.getPhone() : user.getPhone());
        user.setProfilePhotoUrl(
                request.getProfilePhotoUrl() != null
                        ? request.getProfilePhotoUrl()
                        : user.getProfilePhotoUrl());

        // Update Role
        if (request.getRole() != null) {
            try {
                RoleName requestRole = RoleName.valueOf(request.getRole().toUpperCase());

                String nextFirstName =
                        request.getFirstName() != null ? request.getFirstName() : user.getFirstName();
                String nextLastName =
                        request.getLastName() != null ? request.getLastName() : user.getLastName();
                enforceSingleDoctorConstraint(
                        requestRole, user.getEmail(), nextFirstName, nextLastName, userId);

                Role role =
                        roleRepository
                                .findByName(requestRole)
                                .orElseThrow(
                                        () ->
                                                new ResourceNotFoundException(
                                                        "Role", "name", request.getRole()));
                user.getRoles().clear();
                user.getRoles().add(role);
            } catch (IllegalArgumentException e) {
                throw new BadRequestException("Invalid role provided: " + request.getRole());
            }
        }

        user = userRepository.save(user);

        // Update Staff Profile (or create if not exists)
        StaffProfile profile =
                staffProfileRepository
                        .findByUserId(userId)
                        .orElse(StaffProfile.builder().user(user).build());

        if (request.getPermissions() != null) {
            profile.setPermissions(request.getPermissions());
        }
        if (request.getSpecialization() != null) {
            profile.setSpecialization(request.getSpecialization());
        }
        if (request.getLicenseNumber() != null) {
            profile.setLicenseNumber(request.getLicenseNumber());
        }

        staffProfileRepository.save(profile);
        return mapToResponse(user);
    }

    @Transactional
    public void deactivateStaff(Long userId) {
        User user =
                userRepository
                        .findById(userId)
                        .orElseThrow(() -> new ResourceNotFoundException("User", "id", userId));
        user.setIsActive(false);
        userRepository.save(user);
    }

        private void enforceSingleDoctorConstraint(
                        RoleName requestedRole,
                        String email,
                        String firstName,
                        String lastName,
                        Long currentUserId) {
                if (requestedRole != RoleName.DOCTOR) {
                        return;
                }

                if (!CANONICAL_DOCTOR_EMAIL.equals(normalize(email))
                                || !CANONICAL_DOCTOR_FIRST_NAME.equals(normalize(firstName))
                                || !CANONICAL_DOCTOR_LAST_NAME.equals(normalize(lastName))) {
                        throw new BadRequestException(
                                        "Only Dr. Pulasthi Senevirathne (doctor@primemedical.lk) can be configured as DOCTOR");
                }

                boolean anotherActiveDoctorExists =
                                userRepository.findByRolesName(RoleName.DOCTOR).stream()
                                                .filter(u -> Boolean.TRUE.equals(u.getIsActive()))
                                                .anyMatch(u -> currentUserId == null || !u.getId().equals(currentUserId));

                if (anotherActiveDoctorExists) {
                        throw new BadRequestException("Only one active doctor is allowed in the system");
                }
        }

        private String normalize(String value) {
                return value == null ? "" : value.trim().toLowerCase(Locale.ROOT);
        }

    private StaffProfileResponse mapToResponse(User user) {
        StaffProfile profile = staffProfileRepository.findByUserId(user.getId()).orElse(null);
        String mainRole =
                user.getRoles().isEmpty()
                        ? null
                        : user.getRoles().iterator().next().getName().name();

        return StaffProfileResponse.builder()
                .id(profile != null ? profile.getId() : null)
                .userId(user.getId())
                .email(user.getEmail())
                .firstName(user.getFirstName())
                .lastName(user.getLastName())
                .phone(user.getPhone())
                .profilePhotoUrl(user.getProfilePhotoUrl())
                .role(mainRole)
                .permissions(profile != null ? profile.getPermissions() : null)
                .specialization(profile != null ? profile.getSpecialization() : null)
                .licenseNumber(profile != null ? profile.getLicenseNumber() : null)
                .isActive(user.getIsActive())
                .bio(profile != null ? profile.getBio() : null)
                .build();
    }
}
