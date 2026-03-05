package com.medcenter.service;

import java.time.LocalDate;
import java.time.Period;
import java.time.Year;
import java.util.Collections;
import java.util.List;
import java.util.Set;
import java.util.stream.Collectors;

import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.medcenter.dto.request.PatientRequest;
import com.medcenter.dto.response.PatientResponse;
import com.medcenter.entity.Patient;
import com.medcenter.entity.PatientAllergy;
import com.medcenter.entity.Role;
import com.medcenter.entity.User;
import com.medcenter.enums.AllergySeverity;
import com.medcenter.enums.RoleName;
import com.medcenter.exception.BadRequestException;
import com.medcenter.exception.ResourceNotFoundException;
import com.medcenter.repository.PatientAllergyRepository;
import com.medcenter.repository.PatientRepository;
import com.medcenter.repository.RoleRepository;
import com.medcenter.repository.UserRepository;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

@Service
@RequiredArgsConstructor
@Slf4j
public class PatientService {

    private final PatientRepository patientRepository;
    private final UserRepository userRepository;
    private final RoleRepository roleRepository;
    private final PatientAllergyRepository allergyRepository;
    private final PasswordEncoder passwordEncoder;

    /**
     * Register a new patient — creates both User and Patient records. Auto-generates patient
     * number: PAT-YYYY-NNNNN
     */
    @Transactional
    public PatientResponse registerPatient(PatientRequest request) {
        try {
            if (userRepository.existsByEmail(request.getEmail())) {
                throw new BadRequestException("Email already registered: " + request.getEmail());
            }

            // 1. Create the User account
            Role patientRole =
                    roleRepository
                            .findByName(RoleName.PATIENT)
                            .orElseThrow(
                                    () -> new ResourceNotFoundException("Role", "name", "PATIENT"));

                        if (request.getPassword() == null || request.getPassword().trim().isEmpty()) {
                                throw new BadRequestException("Password is required for patient registration");
                        }
                        String password = request.getPassword().trim();

            User user =
                    User.builder()
                            .email(request.getEmail())
                            .passwordHash(passwordEncoder.encode(password))
                            .firstName(request.getFirstName())
                            .lastName(request.getLastName())
                            .phone(request.getPhone())
                            .isActive(true)
                            .roles(Set.of(patientRole))
                            .build();
            user = userRepository.saveAndFlush(user);

            // 2. Generate patient number
            String patientNumber = generatePatientNumber();

            // 3. Create the Patient profile
            Patient patient =
                    Patient.builder()
                            .user(user)
                            .patientNumber(patientNumber)
                            .dateOfBirth(request.getDateOfBirth())
                            .gender(request.getGender())
                            .address(request.getAddress())
                            .nicNumber(request.getNicNumber())
                            .emergencyContactName(request.getEmergencyContactName())
                            .emergencyContactPhone(request.getEmergencyContactPhone())
                            .emailNotifications(!Boolean.FALSE.equals(request.getEmailNotifications()))
                            .smsNotifications(Boolean.TRUE.equals(request.getSmsNotifications()))
                            .build();
            patient = patientRepository.saveAndFlush(patient);

            log.info("Patient registered: {} ({})", patientNumber, user.getEmail());
            return mapToResponse(patient);
                } catch (RuntimeException e) {
            log.error("FAILED to register patient: {}", e.getMessage(), e);
            throw e;
        }
    }

    /** Search patients by name, phone, or NIC. */
    @Transactional(readOnly = true)
    public List<PatientResponse> searchPatients(String query) {
        if (query == null || query.trim().isEmpty()) {
            // Don't return all patients for an empty search — return an empty list instead.
            return Collections.emptyList();
        }
        List<Patient> results = patientRepository.searchByNameOrPhoneOrNic(query.trim());
        if (results == null) return Collections.emptyList();

        return results.stream()
                .filter(p -> p != null)
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    /** Get patient by ID. */
    @Transactional(readOnly = true)
    public PatientResponse getPatientById(Long id) {
        Patient patient =
                patientRepository
                        .findById(id)
                        .orElseThrow(() -> new ResourceNotFoundException("Patient", "id", id));
        return mapToResponse(patient);
    }

    /** Get patient profile by linked user email (for PATIENT self-access). */
    @Transactional(readOnly = true)
    public PatientResponse getPatientByEmail(String email) {
        User user =
                userRepository
                        .findByEmail(email)
                        .orElseThrow(() -> new ResourceNotFoundException("User", "email", email));

        Patient patient =
                patientRepository
                        .findByUserId(user.getId())
                        .orElseThrow(() -> new ResourceNotFoundException("Patient", "userId", user.getId()));

        return mapToResponse(patient);
    }

    /** Update an existing patient's details. */
    @Transactional
    public PatientResponse updatePatient(Long id, PatientRequest request) {
        Patient patient =
                patientRepository
                        .findById(id)
                        .orElseThrow(() -> new ResourceNotFoundException("Patient", "id", id));

        User user = patient.getUser();
        user.setFirstName(request.getFirstName());
        user.setLastName(request.getLastName());
        user.setPhone(request.getPhone());
        userRepository.save(user);

        patient.setDateOfBirth(request.getDateOfBirth());
        patient.setGender(request.getGender());
        patient.setAddress(request.getAddress());
        patient.setNicNumber(request.getNicNumber());
        patient.setEmergencyContactName(request.getEmergencyContactName());
        patient.setEmergencyContactPhone(request.getEmergencyContactPhone());
        patient = patientRepository.save(patient);

        log.info("Patient updated: {}", patient.getPatientNumber());
        return mapToResponse(patient);
    }

        /** Soft delete patient by deactivating the linked user account. */
        @Transactional
        public void deactivatePatient(Long id) {
                Patient patient =
                                patientRepository
                                                .findById(id)
                                                .orElseThrow(() -> new ResourceNotFoundException("Patient", "id", id));

                User user = patient.getUser();
                if (user == null) {
                        throw new BadRequestException("Patient has no linked user account");
                }

                user.setIsActive(false);
                userRepository.save(user);
                log.info("Patient deactivated: {} ({})", patient.getPatientNumber(), user.getEmail());
        }

    /** Add an allergy to a patient. */
    @Transactional
    public PatientResponse addAllergy(
            Long patientId,
            String allergen,
            String reaction,
            AllergySeverity severity,
            String userEmail) {
                if (allergen == null || allergen.trim().isEmpty()) {
                        throw new BadRequestException("Allergen is required");
                }
                if (severity == null) {
                        throw new BadRequestException("Allergy severity is required");
                }

        Patient patient =
                patientRepository
                        .findById(patientId)
                        .orElseThrow(
                                () -> new ResourceNotFoundException("Patient", "id", patientId));
        User notedBy =
                userRepository
                        .findByEmail(userEmail)
                        .orElseThrow(
                                () -> new ResourceNotFoundException("User", "email", userEmail));

        PatientAllergy allergy =
                PatientAllergy.builder()
                        .patient(patient)
                        .allergen(allergen.trim())
                        .reaction(reaction)
                        .severity(severity)
                        .notedBy(notedBy)
                        .build();
        allergyRepository.save(allergy);

        log.info("Allergy added for patient {}: {}", patient.getPatientNumber(), allergen);
        // Return the patient we already loaded above to avoid an extra DB hit and
        // Optional.get()
        return mapToResponse(patient);
    }

    /** Get all patients (used by the frontend patient directory initial load). */
    @Transactional(readOnly = true)
    public List<PatientResponse> getAllPatients() {
        return patientRepository.findAll().stream()
                .filter(p -> p != null)
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    // ── Private helpers ──────────────────────────────────────────

    private String generatePatientNumber() {
        long count = patientRepository.count() + 1;
        return String.format("PAT-%d-%05d", Year.now().getValue(), count);
    }

    private PatientResponse mapToResponse(Patient patient) {
        if (patient == null) return null;

        User user = patient.getUser();

        List<PatientResponse.AllergyInfo> allergies =
                patient.getAllergies() != null
                        ? patient.getAllergies().stream()
                                .map(
                                        a ->
                                                PatientResponse.AllergyInfo.builder()
                                                        .id(a.getId())
                                                        .allergen(a.getAllergen())
                                                        .reaction(a.getReaction())
                                                        .severity(
                                                                a.getSeverity() != null
                                                                        ? a.getSeverity().name()
                                                                        : null)
                                                        .notedByName(
                                                                a.getNotedBy() != null
                                                                        ? a.getNotedBy()
                                                                                        .getFirstName()
                                                                                + " "
                                                                                + a.getNotedBy()
                                                                                        .getLastName()
                                                                        : "Unknown Staff")
                                                        .notedAt(a.getNotedAt())
                                                        .build())
                                .collect(Collectors.toList())
                        : Collections.emptyList();

        Long userId = null;
        String firstName = null;
        String lastName = null;
        String email = null;
        String phone = null;
        String profilePhotoUrl = null;

        if (user != null) {
            userId = user.getId();
            firstName = user.getFirstName();
            lastName = user.getLastName();
            email = user.getEmail();
            phone = user.getPhone();
            profilePhotoUrl = user.getProfilePhotoUrl();
        }

        Integer age = null;
        if (patient.getDateOfBirth() != null) {
            try {
                age = Period.between(patient.getDateOfBirth(), LocalDate.now()).getYears();
            } catch (Exception e) {
                log.warn(
                        "Failed to compute age for patient {}: {}",
                        patient.getId(),
                        e.getMessage());
            }
        }

        return PatientResponse.builder()
                .id(patient.getId())
                .userId(userId)
                .patientNumber(patient.getPatientNumber())
                .firstName(firstName)
                .lastName(lastName)
                .email(email)
                .phone(phone)
                .dateOfBirth(patient.getDateOfBirth())
                .age(age)
                .gender(patient.getGender())
                .address(patient.getAddress())
                .nicNumber(patient.getNicNumber())
                .emergencyContactName(patient.getEmergencyContactName())
                .emergencyContactPhone(patient.getEmergencyContactPhone())
                .medicalNotes(patient.getMedicalNotes())
                .emailNotifications(patient.getEmailNotifications())
                .smsNotifications(patient.getSmsNotifications())
                .profilePhotoUrl(profilePhotoUrl)
                .allergies(allergies)
                .createdAt(patient.getCreatedAt())
                .updatedAt(patient.getUpdatedAt())
                .build();
    }
}
