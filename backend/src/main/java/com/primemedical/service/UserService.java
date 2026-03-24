package com.primemedical.service;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.StandardCopyOption;
import java.util.List;
import java.util.Locale;
import java.util.UUID;
import java.util.stream.Collectors;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.io.Resource;
import org.springframework.core.io.UrlResource;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import com.primemedical.dto.request.UserProfileUpdateRequest;
import com.primemedical.dto.response.UserProfileResponse;
import com.primemedical.entity.User;
import com.primemedical.exception.BadRequestException;
import com.primemedical.exception.ResourceNotFoundException;
import com.primemedical.repository.UserRepository;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class UserService {

    private final UserRepository userRepository;
    private static final long MAX_PROFILE_PHOTO_BYTES = 5L * 1024 * 1024;

    @Value("${app.profile-photo.upload-dir:uploads/profile-photos}")
    private String profilePhotoUploadDir;

    @Transactional(readOnly = true)
    public UserProfileResponse getMyProfile(String email) {
        User user =
                userRepository
                        .findByEmail(normalizeEmail(email))
                        .orElseThrow(() -> new ResourceNotFoundException("User", "email", email));
        return mapToProfileResponse(user);
    }

    @Transactional
    public UserProfileResponse updateMyProfile(String currentEmail, UserProfileUpdateRequest request) {
        User user =
                userRepository
                        .findByEmail(normalizeEmail(currentEmail))
                        .orElseThrow(
                                () -> new ResourceNotFoundException("User", "email", currentEmail));

        if (request.getFirstName() != null) {
            String firstName = request.getFirstName().trim();
            if (firstName.isEmpty()) {
                throw new BadRequestException("First name cannot be empty");
            }
            user.setFirstName(firstName);
        }

        if (request.getLastName() != null) {
            String lastName = request.getLastName().trim();
            if (lastName.isEmpty()) {
                throw new BadRequestException("Last name cannot be empty");
            }
            user.setLastName(lastName);
        }

        if (request.getEmail() != null) {
            String newEmail = normalizeEmail(request.getEmail());
            if (newEmail.isEmpty()) {
                throw new BadRequestException("Email cannot be empty");
            }
            if (userRepository.existsByEmailAndIdNot(newEmail, user.getId())) {
                throw new BadRequestException("Email already registered: " + newEmail);
            }
            user.setEmail(newEmail);
        }

        if (request.getPhone() != null) {
            String phone = request.getPhone().trim();
            user.setPhone(phone.isEmpty() ? null : phone);
        }

        if (Boolean.TRUE.equals(request.getRemoveProfilePhoto())) {
            user.setProfilePhotoUrl(null);
        } else if (request.getProfilePhotoUrl() != null) {
            String photoUrl = request.getProfilePhotoUrl().trim();
            user.setProfilePhotoUrl(photoUrl.isEmpty() ? null : photoUrl);
        }

        user = userRepository.save(user);
        return mapToProfileResponse(user);
    }

    @Transactional
    public UserProfileResponse uploadMyProfilePhoto(String currentEmail, MultipartFile file) {
        User user =
                userRepository
                        .findByEmail(normalizeEmail(currentEmail))
                        .orElseThrow(
                                () -> new ResourceNotFoundException("User", "email", currentEmail));

        if (file == null || file.isEmpty()) {
            throw new BadRequestException("Please select an image file");
        }

        if (file.getSize() > MAX_PROFILE_PHOTO_BYTES) {
            throw new BadRequestException("Profile photo size must be 5MB or less");
        }

        String contentType = file.getContentType();
        if (contentType == null || !contentType.toLowerCase(Locale.ROOT).startsWith("image/")) {
            throw new BadRequestException("Only image files are allowed");
        }

        Path uploadRoot = getUploadRoot();
        String extension = extractExtension(file.getOriginalFilename());
        String safeFilename =
                "user-"
                        + user.getId()
                        + "-"
                        + System.currentTimeMillis()
                        + "-"
                        + UUID.randomUUID().toString().replace("-", "")
                        + extension;
        Path targetPath = uploadRoot.resolve(safeFilename).normalize();

        if (!targetPath.startsWith(uploadRoot)) {
            throw new BadRequestException("Invalid upload path");
        }

        try {
            Files.createDirectories(uploadRoot);
            Files.copy(file.getInputStream(), targetPath, StandardCopyOption.REPLACE_EXISTING);
        } catch (IOException ex) {
            throw new BadRequestException("Failed to upload profile photo");
        }

        deleteManagedPhotoIfAny(user.getProfilePhotoUrl(), uploadRoot);
        user.setProfilePhotoUrl("/api/v1/users/profile-photos/" + safeFilename);
        user = userRepository.save(user);
        return mapToProfileResponse(user);
    }

    @Transactional(readOnly = true)
    public ResponseEntity<Resource> buildProfilePhotoResponse(String filename) {
        if (filename == null || filename.isBlank() || filename.contains("..")) {
            throw new BadRequestException("Invalid photo filename");
        }

        Path uploadRoot = getUploadRoot();
        Path filePath = uploadRoot.resolve(filename).normalize();
        if (!filePath.startsWith(uploadRoot)) {
            throw new BadRequestException("Invalid photo path");
        }

        if (!Files.exists(filePath) || !Files.isRegularFile(filePath)) {
            throw new ResourceNotFoundException("ProfilePhoto", "filename", filename);
        }

        try {
            Resource resource = new UrlResource(filePath.toUri());
            String detectedType = Files.probeContentType(filePath);
            MediaType mediaType =
                    detectedType != null
                            ? MediaType.parseMediaType(detectedType)
                            : MediaType.APPLICATION_OCTET_STREAM;

            return ResponseEntity.ok()
                    .contentType(mediaType)
                    .header(HttpHeaders.CACHE_CONTROL, "public, max-age=3600")
                    .body(resource);
        } catch (IOException ex) {
            throw new BadRequestException("Failed to load profile photo");
        }
    }

    private UserProfileResponse mapToProfileResponse(User user) {
        String firstName = user.getFirstName() != null ? user.getFirstName().trim() : "";
        String lastName = user.getLastName() != null ? user.getLastName().trim() : "";
        String fullName = (firstName + " " + lastName).trim();
        List<String> roles =
                user.getRoles().stream().map(role -> role.getName().name()).collect(Collectors.toList());

        return UserProfileResponse.builder()
                .id(user.getId())
                .firstName(user.getFirstName())
                .lastName(user.getLastName())
                .fullName(fullName)
                .email(user.getEmail())
                .phone(user.getPhone())
                .profilePhotoUrl(user.getProfilePhotoUrl())
                .roles(roles)
                .build();
    }

    private String normalizeEmail(String email) {
        return email == null ? "" : email.trim().toLowerCase(Locale.ROOT);
    }

    private Path getUploadRoot() {
        return Paths.get(profilePhotoUploadDir).toAbsolutePath().normalize();
    }

    private String extractExtension(String originalFilename) {
        if (originalFilename == null) {
            return ".jpg";
        }
        int dot = originalFilename.lastIndexOf('.');
        if (dot < 0 || dot == originalFilename.length() - 1) {
            return ".jpg";
        }
        String ext = originalFilename.substring(dot).toLowerCase(Locale.ROOT);
        if (ext.length() > 10 || !ext.matches("\\.[a-z0-9]+")) {
            return ".jpg";
        }
        return ext;
    }

    private void deleteManagedPhotoIfAny(String existingPhotoUrl, Path uploadRoot) {
        if (existingPhotoUrl == null || existingPhotoUrl.isBlank()) {
            return;
        }

        String prefix = "/api/v1/users/profile-photos/";
        if (!existingPhotoUrl.startsWith(prefix)) {
            return;
        }

        String existingFilename = existingPhotoUrl.substring(prefix.length());
        if (existingFilename.isBlank() || existingFilename.contains("..")) {
            return;
        }

        Path existingPath = uploadRoot.resolve(existingFilename).normalize();
        if (!existingPath.startsWith(uploadRoot)) {
            return;
        }

        try {
            Files.deleteIfExists(existingPath);
        } catch (IOException ignored) {
            // Ignore cleanup failure; user update should still succeed.
        }
    }
}
