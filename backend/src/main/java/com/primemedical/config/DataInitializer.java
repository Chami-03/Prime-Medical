package com.primemedical.config;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalTime;
import java.util.Set;

import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import com.primemedical.entity.DoctorSchedule;
import com.primemedical.entity.InventoryItem;
import com.primemedical.entity.Patient;
import com.primemedical.entity.Role;
import com.primemedical.entity.StaffProfile;
import com.primemedical.entity.User;
import com.primemedical.enums.Gender;
import com.primemedical.enums.RoleName;
import com.primemedical.repository.DoctorScheduleRepository;
import com.primemedical.repository.InventoryItemRepository;
import com.primemedical.repository.PatientRepository;
import com.primemedical.repository.RoleRepository;
import com.primemedical.repository.StaffProfileRepository;
import com.primemedical.repository.UserRepository;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

@Component
@RequiredArgsConstructor
@Slf4j
public class DataInitializer implements ApplicationRunner {

        private final UserRepository userRepository;
        private final RoleRepository roleRepository;
        private final PatientRepository patientRepository;
        private final StaffProfileRepository staffProfileRepository;
        private final DoctorScheduleRepository doctorScheduleRepository;
        private final InventoryItemRepository inventoryItemRepository;
        private final PasswordEncoder passwordEncoder;

        private static final String DEFAULT_PASSWORD = "Password123!";

        @Override
        @Transactional
        public void run(ApplicationArguments args) {
                log.info("⏳ Seeding test data (idempotent)...");

                // ── 1. Roles ─────────────────────────────────────────────
                Role roleDoctor = saveRole(RoleName.DOCTOR);
                Role roleNurse = saveRole(RoleName.NURSE);
                Role roleReceptionist = saveRole(RoleName.RECEPTIONIST);
                Role rolePharmacist = saveRole(RoleName.PHARMACIST);
                Role rolePatient = saveRole(RoleName.PATIENT);
                Role roleAdmin = saveRole(RoleName.ADMIN);

                // ── 2. Users ─────────────────────────────────────────────
                String hash = passwordEncoder.encode(DEFAULT_PASSWORD);

                User doctor = createOrUpdateUser(
                                "doctor@primemedical.lk",
                                hash,
                                "Pulasthi",
                                "Senevirathne",
                                "0771234567",
                                Set.of(roleDoctor));

                createOrUpdateUser(
                                "nurse@primemedical.lk",
                                hash,
                                "Nimali",
                                "Silva",
                                "0772345678",
                                Set.of(roleNurse));

                createOrUpdateUser(
                                "reception@primemedical.lk",
                                hash,
                                "Kasun",
                                "Fernando",
                                "0773456789",
                                Set.of(roleReceptionist));

                createOrUpdateUser(
                                "pharmacist@primemedical.lk",
                                hash,
                                "Ruwan",
                                "Jayasinghe",
                                "0774567890",
                                Set.of(rolePharmacist));

                User patientUser = createOrUpdateUser(
                                "patient@primemedical.lk",
                                hash,
                                "Amara",
                                "Wickrama",
                                "0775678901",
                                Set.of(rolePatient));

                createOrUpdateUser(
                                "admin@primemedical.lk",
                                hash,
                                "Admin",
                                "User",
                                "0770000000",
                                Set.of(roleAdmin));

                // ── 3. StaffProfile for the doctor ───────────────────────
                if (staffProfileRepository.findByUserId(doctor.getId()).isEmpty()) {
                        StaffProfile doctorProfile = StaffProfile.builder()
                                        .user(doctor)
                                        .specialization("General Medicine")
                                        .qualifications("MBBS, MD (General Medicine)")
                                        .licenseNumber("SLMC-2026-001")
                                        .shiftStart(LocalTime.of(9, 0))
                                        .shiftEnd(LocalTime.of(17, 0))
                                        .bio("Experienced General Physician with over 10 years of practice.")
                                        .build();
                        staffProfileRepository.save(doctorProfile);
                        log.info("  ✔ StaffProfile created for Dr. {}", doctor.getLastName());
                } else {
                        log.info("  ℹ StaffProfile already exists for Dr. {} — skipping creation.",
                                        doctor.getLastName());
                }

                // ── 4. Patient profile ───────────────────────────────────
                boolean patientExists = patientRepository.findByUserId(patientUser.getId()).isPresent()
                                || patientRepository.findByPatientNumber("PAT-2026-00001").isPresent();
                if (!patientExists) {
                        Patient patient = Patient.builder()
                                        .user(patientUser)
                                        .patientNumber("PAT-2026-00001")
                                        .dateOfBirth(LocalDate.of(1990, 5, 15))
                                        .gender(Gender.FEMALE)
                                        .address("123 Galle Road, Colombo 03")
                                        .nicNumber("900456789V")
                                        .emergencyContactName("Ruwan Wickrama")
                                        .emergencyContactPhone("0779876543")
                                        .emailNotifications(true)
                                        .smsNotifications(false)
                                        .build();
                        patientRepository.save(patient);
                        log.info("  ✔ Patient profile created: PAT-2026-00001");
                } else {
                        log.info("  ℹ Patient profile already exists for seeded user — skipping creation.");
                }

                // ── 5. Doctor schedule — next 14 days, 9AM-5PM (no 1PM) ─
                LocalDate today = LocalDate.now();
                int slotsCreated = 0;

                for (int day = 0; day < 14; day++) {
                        LocalDate scheduleDate = today.plusDays(day);

                        for (int hour = 9; hour < 17; hour++) {
                                if (hour == 13)
                                        continue; // lunch break

                                LocalTime slotTime = LocalTime.of(hour, 0);

                                // Skip duplicates if somehow re-run with data present
                                boolean exists = doctorScheduleRepository.existsByDoctorIdAndScheduleDateAndSlotTime(
                                                doctor.getId(), scheduleDate, slotTime);
                                if (exists)
                                        continue;

                                DoctorSchedule slot = DoctorSchedule.builder()
                                                .doctor(doctor)
                                                .scheduleDate(scheduleDate)
                                                .slotTime(slotTime)
                                                .isBlocked(false)
                                                .maxPatients(1)
                                                .build();
                                doctorScheduleRepository.save(slot);
                                slotsCreated++;
                        }
                }
                log.info("  ✔ Doctor schedule created: {} slots over 14 days", slotsCreated);

                // ── 6. Inventory items ───────────────────────────────────
                if (!inventoryItemRepository.existsByDrugName("Paracetamol 500mg")) {
                        inventoryItemRepository.save(
                                        InventoryItem.builder()
                                                        .drugName("Paracetamol 500mg")
                                                        .genericName("Acetaminophen")
                                                        .quantity(100)
                                                        .unit("tablets")
                                                        .unitCost(new BigDecimal("3.00"))
                                                        .sellingPrice(new BigDecimal("5.00"))
                                                        .expiryDate(LocalDate.of(2027, 12, 31))
                                                        .lowStockThreshold(20)
                                                        .category("Analgesic")
                                                        .supplier("Astron Pharma")
                                                        .build());
                }

                if (!inventoryItemRepository.existsByDrugName("Amoxicillin 250mg")) {
                        inventoryItemRepository.save(
                                        InventoryItem.builder()
                                                        .drugName("Amoxicillin 250mg")
                                                        .genericName("Amoxicillin")
                                                        .quantity(50)
                                                        .unit("capsules")
                                                        .unitCost(new BigDecimal("18.00"))
                                                        .sellingPrice(new BigDecimal("25.00"))
                                                        .expiryDate(LocalDate.of(2027, 6, 30))
                                                        .lowStockThreshold(10)
                                                        .category("Antibiotic")
                                                        .supplier("Hemas Pharmaceuticals")
                                                        .build());
                }

                if (!inventoryItemRepository.existsByDrugName("Cetirizine 10mg")) {
                        inventoryItemRepository.save(
                                        InventoryItem.builder()
                                                        .drugName("Cetirizine 10mg")
                                                        .genericName("Cetirizine Hydrochloride")
                                                        .quantity(75)
                                                        .unit("tablets")
                                                        .unitCost(new BigDecimal("5.00"))
                                                        .sellingPrice(new BigDecimal("8.00"))
                                                        .expiryDate(LocalDate.of(2027, 9, 30))
                                                        .lowStockThreshold(15)
                                                        .category("Antihistamine")
                                                        .supplier("CIC Pharmaceuticals")
                                                        .build());
                }

                log.info("✅ Test data initialized/verified successfully");
                log.info("──────────────────────────────────────────────────────");
                log.info("  Accounts (password: {})", DEFAULT_PASSWORD);
                log.info("  doctor@primemedical.lk        → DOCTOR");
                log.info("  nurse@primemedical.lk         → NURSE");
                log.info("  reception@primemedical.lk     → RECEPTIONIST");
                log.info("  pharmacist@primemedical.lk    → PHARMACIST");
                log.info("  patient@primemedical.lk       → PATIENT");
                log.info("  admin@primemedical.lk         → ADMIN");
                log.info("──────────────────────────────────────────────────────");
        }

        // ── Private helpers ──────────────────────────────────────────

        private Role saveRole(RoleName name) {
                return roleRepository
                                .findByName(name)
                                .orElseGet(
                                                () -> {
                                                        Role role = Role.builder().name(name).build();
                                                        return roleRepository.save(role);
                                                });
        }

        private User createUser(
                        String email,
                        String passwordHash,
                        String firstName,
                        String lastName,
                        String phone,
                        Set<Role> roles) {
                User user = User.builder()
                                .email(email)
                                .passwordHash(passwordHash)
                                .firstName(firstName)
                                .lastName(lastName)
                                .phone(phone)
                                .isActive(true)
                                .roles(roles)
                                .build();
                User saved = userRepository.save(user);
                log.info("  ✔ User created: {} ({})", email, roles.iterator().next().getName());
                return saved;
        }

        private User createOrUpdateUser(
                        String email,
                        String passwordHash,
                        String firstName,
                        String lastName,
                        String phone,
                        Set<Role> roles) {
                return userRepository
                                .findByEmail(email)
                                .map(
                                                existing -> {
                                                        existing.setPasswordHash(passwordHash);
                                                        existing.setFirstName(firstName);
                                                        existing.setLastName(lastName);
                                                        existing.setPhone(phone);
                                                        existing.setIsActive(true);
                                                        existing.getRoles().addAll(roles);
                                                        User saved = userRepository.save(existing);
                                                        log.info(
                                                                        "  ✔ User updated: {} ({})",
                                                                        email,
                                                                        roles.iterator().next().getName());
                                                        return saved;
                                                })
                                .orElseGet(
                                                () -> createUser(
                                                                email,
                                                                passwordHash,
                                                                firstName,
                                                                lastName,
                                                                phone,
                                                                roles));
        }
}
