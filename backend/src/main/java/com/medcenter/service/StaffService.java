package com.medcenter.service;

import com.medcenter.dto.request.StaffCreateRequest;
import com.medcenter.dto.request.StaffProfileRequest;
import com.medcenter.dto.response.StaffProfileResponse;
import com.medcenter.entity.Role;
import com.medcenter.entity.StaffProfile;
import com.medcenter.entity.User;
import com.medcenter.enums.RoleName;
import com.medcenter.exception.BadRequestException;
import com.medcenter.exception.ResourceNotFoundException;
import com.medcenter.repository.RoleRepository;
import com.medcenter.repository.StaffProfileRepository;
import com.medcenter.repository.UserRepository;
import java.util.List;
import java.util.stream.Collectors;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
@Slf4j
public class StaffService {

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
        return userRepository.findAll().stream()
                .filter(u -> !u.getRoles().stream().allMatch(r -> r.getName() == RoleName.PATIENT))
                .map(this::mapToResponse)
                .collect(Collectors.toList());
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
