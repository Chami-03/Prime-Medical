package com.primemedical.service;

import java.time.LocalDate;
import java.time.Period;
import java.time.Year;
import java.util.Collections;
import java.util.List;
import java.util.Set;
import java.util.UUID;
import java.util.stream.Collectors;

import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.primemedical.dto.request.PatientRequest;
import com.primemedical.dto.response.PatientResponse;
import com.primemedical.entity.Appointment;
import com.primemedical.entity.Bill;
import com.primemedical.entity.Consultation;
import com.primemedical.entity.Patient;
import com.primemedical.entity.PatientAllergy;
import com.primemedical.entity.Prescription;
import com.primemedical.entity.QueueEntry;
import com.primemedical.entity.Role;
import com.primemedical.entity.User;
import com.primemedical.entity.VitalSigns;
import com.primemedical.enums.AllergySeverity;
import com.primemedical.enums.RoleName;
import com.primemedical.exception.BadRequestException;
import com.primemedical.exception.ResourceNotFoundException;
import com.primemedical.repository.AppointmentRepository;
import com.primemedical.repository.BillRepository;
import com.primemedical.repository.ConsultationRepository;
import com.primemedical.repository.PatientAllergyRepository;
import com.primemedical.repository.PatientRepository;
import com.primemedical.repository.PrescriptionRepository;
import com.primemedical.repository.QueueEntryRepository;
import com.primemedical.repository.RoleRepository;
import com.primemedical.repository.UserRepository;
import com.primemedical.repository.VitalSignsRepository;

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
        private final AppointmentRepository appointmentRepository;
        private final QueueEntryRepository queueEntryRepository;
        private final ConsultationRepository consultationRepository;
        private final VitalSignsRepository vitalSignsRepository;
        private final PrescriptionRepository prescriptionRepository;
        private final BillRepository billRepository;
    private final PasswordEncoder passwordEncoder;
        private final EmailService emailService;
        private final SmsService smsService;

    /**
     * Register a new patient — creates both User and Patient records. Auto-generates patient
     * number: PAT-YYYY-NNNNN
     */
    @Transactional
    public PatientResponse registerPatient(PatientRequest request) {
                return registerPatient(request, false);
        }

        @Transactional
        public PatientResponse registerPatient(PatientRequest request, boolean requirePassword) {
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

                        String password;
                        if (request.getPassword() == null || request.getPassword().trim().isEmpty()) {
                                if (requirePassword) {
                                        throw new BadRequestException("Password is required for patient registration");
                                }
                                // Staff-created patient profiles may not include credentials at creation time.
                                password = UUID.randomUUID().toString();
                        } else {
                                password = request.getPassword().trim();
                        }

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

            String fullName =
                    String.format(
                                    "%s %s",
                                    request.getFirstName() != null ? request.getFirstName().trim() : "",
                                    request.getLastName() != null ? request.getLastName().trim() : "")
                            .trim();
            emailService.sendRegistrationConfirmation(user.getEmail(), fullName);
                        if (user.getPhone() != null && !user.getPhone().trim().isEmpty()) {
                                smsService.sendRegistrationConfirmation(user.getPhone());
                        }

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

        /** Hard delete patient account and related records from DB. */
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

                hardDeletePatientAccount(patient, user);
        }

        /** Self-service hard delete for authenticated patient users. */
    @Transactional
    public void deactivatePatientByEmail(String email) {
        User user =
                userRepository
                        .findByEmail(email)
                        .orElseThrow(() -> new ResourceNotFoundException("User", "email", email));

        Patient patient =
                patientRepository
                        .findByUserId(user.getId())
                        .orElseThrow(() -> new ResourceNotFoundException("Patient", "userId", user.getId()));

                hardDeletePatientAccount(patient, user);
    }

        private void hardDeletePatientAccount(Patient patient, User user) {
                Long patientId = patient.getId();
                String patientName =
                        (user.getFirstName() != null ? user.getFirstName().trim() : "")
                                + " "
                                + (user.getLastName() != null ? user.getLastName().trim() : "");

                try {
                        if (user.getEmail() != null && !user.getEmail().trim().isEmpty()) {
                                emailService.sendAccountDeletionConfirmationEmail(user.getEmail(), patientName.trim());
                        }
                } catch (Exception e) {
                        log.warn("Failed to send account deletion email: {}", e.getMessage());
                }

                try {
                        if (user.getPhone() != null && !user.getPhone().trim().isEmpty()) {
                                smsService.sendAccountDeletionConfirmation(user.getPhone(), patientName.trim());
                        }
                } catch (Exception e) {
                        log.warn("Failed to send account deletion SMS: {}", e.getMessage());
                }

                List<Appointment> appointments = appointmentRepository.findByPatientId(patientId);
                for (Appointment appt : appointments) {
                        List<Consultation> linkedConsultations =
                                        consultationRepository.findAllByAppointmentId(appt.getId());
                        deleteConsultationDependents(linkedConsultations);
                        if (!linkedConsultations.isEmpty()) {
                                consultationRepository.deleteAll(linkedConsultations);
                        }

                        List<QueueEntry> linkedQueueEntries = queueEntryRepository.findAllByAppointmentId(appt.getId());
                        for (QueueEntry queueEntry : linkedQueueEntries) {
                                vitalSignsRepository.deleteByQueueEntryId(queueEntry.getId());
                        }
                        if (!linkedQueueEntries.isEmpty()) {
                                queueEntryRepository.deleteAll(linkedQueueEntries);
                        }
                }
                if (!appointments.isEmpty()) {
                        appointmentRepository.deleteAll(appointments);
                }

                List<Consultation> remainingConsultations = consultationRepository.findByPatientId(patientId);
                deleteConsultationDependents(remainingConsultations);
                if (!remainingConsultations.isEmpty()) {
                        consultationRepository.deleteAll(remainingConsultations);
                }

                List<QueueEntry> remainingQueueEntries = queueEntryRepository.findByPatientId(patientId);
                for (QueueEntry queueEntry : remainingQueueEntries) {
                        vitalSignsRepository.deleteByQueueEntryId(queueEntry.getId());
                }
                if (!remainingQueueEntries.isEmpty()) {
                        queueEntryRepository.deleteAll(remainingQueueEntries);
                }

                List<Prescription> prescriptions = prescriptionRepository.findByPatientId(patientId);
                if (!prescriptions.isEmpty()) {
                        prescriptionRepository.deleteAll(prescriptions);
                }

                List<Bill> bills = billRepository.findByPatientId(patientId);
                if (!bills.isEmpty()) {
                        billRepository.deleteAll(bills);
                }

                List<VitalSigns> vitalSigns = vitalSignsRepository.findByPatientId(patientId);
                if (!vitalSigns.isEmpty()) {
                        vitalSignsRepository.deleteAll(vitalSigns);
                }

                List<PatientAllergy> allergies = allergyRepository.findByPatientId(patientId);
                if (!allergies.isEmpty()) {
                        allergyRepository.deleteAll(allergies);
                }

                patientRepository.delete(patient);
                userRepository.delete(user);
                log.info("Patient deleted permanently: {} ({})", patient.getPatientNumber(), user.getEmail());
        }

        private void deleteConsultationDependents(List<Consultation> consultations) {
                for (Consultation consultation : consultations) {
                        Long consultationId = consultation.getId();
                        vitalSignsRepository.deleteByConsultationId(consultationId);

                        List<Prescription> linkedPrescriptions =
                                        prescriptionRepository.findAllByConsultationId(consultationId);
                        if (!linkedPrescriptions.isEmpty()) {
                                prescriptionRepository.deleteAll(linkedPrescriptions);
                        }

                        List<Bill> linkedBills = billRepository.findAllByConsultationId(consultationId);
                        if (!linkedBills.isEmpty()) {
                                billRepository.deleteAll(linkedBills);
                        }
                }
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

    /** Update an existing allergy record for a patient. */
    @Transactional
    public PatientResponse updateAllergy(
            Long patientId,
            Long allergyId,
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

        User updatedBy =
                userRepository
                        .findByEmail(userEmail)
                        .orElseThrow(
                                () -> new ResourceNotFoundException("User", "email", userEmail));

        PatientAllergy allergy =
                allergyRepository
                        .findByIdAndPatientId(allergyId, patientId)
                        .orElseThrow(
                                () ->
                                        new ResourceNotFoundException(
                                                "PatientAllergy", "id", allergyId));

        allergy.setAllergen(allergen.trim());
        allergy.setReaction(reaction);
        allergy.setSeverity(severity);
        allergy.setNotedBy(updatedBy);
        allergy.setNotedAt(java.time.LocalDateTime.now());
        allergyRepository.save(allergy);

        log.info("Allergy updated for patient {}: allergy #{}", patient.getPatientNumber(), allergyId);
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
                int year = Year.now().getValue();
                long sequence = patientRepository.count() + 1;

                String patientNumber;
                do {
                        patientNumber = String.format("PAT-%d-%05d", year, sequence);
                        sequence++;
                } while (patientRepository.findByPatientNumber(patientNumber).isPresent());

                return patientNumber;
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
