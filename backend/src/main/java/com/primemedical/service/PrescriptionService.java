package com.primemedical.service;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.List;
import java.util.Locale;
import java.util.stream.Collectors;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.primemedical.dto.request.PrescriptionRequest;
import com.primemedical.dto.response.PrescriptionResponse;
import com.primemedical.entity.Consultation;
import com.primemedical.entity.InventoryItem;
import com.primemedical.entity.PatientAllergy;
import com.primemedical.entity.Prescription;
import com.primemedical.entity.PrescriptionItem;
import com.primemedical.entity.User;
import com.primemedical.enums.PrescriptionStatus;
import com.primemedical.exception.BadRequestException;
import com.primemedical.exception.ResourceNotFoundException;
import com.primemedical.repository.ConsultationRepository;
import com.primemedical.repository.InventoryItemRepository;
import com.primemedical.repository.PatientAllergyRepository;
import com.primemedical.repository.PrescriptionRepository;
import com.primemedical.repository.UserRepository;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

@Service
@RequiredArgsConstructor
@Slf4j
public class PrescriptionService {

    private final PrescriptionRepository prescriptionRepository;
    private final ConsultationRepository consultationRepository;
    private final InventoryItemRepository inventoryItemRepository;
    private final PatientAllergyRepository patientAllergyRepository;
    private final InventoryService inventoryService;
    private final UserRepository userRepository;
        private final EmailService emailService;
        private final BillingService billingService;

    public record AllergyWarning(String drugName, String allergen, String reaction) {}

    /** Create a new prescription with line items. */
    @Transactional
    public PrescriptionResponse createPrescription(PrescriptionRequest request, Long doctorId) {
                validatePrescriptionRequest(request);

        Consultation consultation =
                consultationRepository
                        .findById(request.getConsultationId())
                        .orElseThrow(
                                () ->
                                        new ResourceNotFoundException(
                                                "Consultation", "id", request.getConsultationId()));

        if (prescriptionRepository.findTopByConsultationIdOrderByIdDesc(consultation.getId()).isPresent()) {
            throw new BadRequestException(
                    "A prescription already exists for this consultation. Please edit the existing prescription.");
        }

        User doctor =
                userRepository
                        .findById(doctorId)
                        .orElseThrow(() -> new ResourceNotFoundException("Doctor", "id", doctorId));

        Prescription prescription =
                Prescription.builder()
                        .consultation(consultation)
                        .patient(consultation.getPatient())
                        .doctor(doctor)
                        .status(PrescriptionStatus.PENDING)
                        .prescribedAt(LocalDateTime.now())
                        .notes(request.getNotes())
                        .items(new ArrayList<>())
                        .build();

        // Add prescription items
        for (PrescriptionRequest.PrescriptionItemRequest itemReq : request.getItems()) {
            InventoryItem inventoryItem = null;
            if (itemReq.getInventoryItemId() != null) {
                inventoryItem =
                        inventoryItemRepository.findById(itemReq.getInventoryItemId()).orElse(null);
            }

            PrescriptionItem item =
                    PrescriptionItem.builder()
                            .prescription(prescription)
                            .inventoryItem(inventoryItem)
                            .drugName(itemReq.getDrugName())
                            .dosage(itemReq.getDosage())
                            .frequency(itemReq.getFrequency())
                            .durationDays(itemReq.getDurationDays())
                            .quantity(itemReq.getQuantity())
                            .instructions(itemReq.getInstructions())
                            .build();

            prescription.getItems().add(item);
        }

        prescription = prescriptionRepository.save(prescription);
        log.info(
                "Prescription created: #{} for consultation #{}",
                prescription.getId(),
                consultation.getId());

        List<EmailService.PrescriptionMedicineRow> createdEmailRows =
                request.getItems().stream()
                        .map(
                                item ->
                                        new EmailService.PrescriptionMedicineRow(
                                                item.getDrugName(),
                                                item.getDosage(),
                                                item.getFrequency(),
                                                item.getDurationDays(),
                                                item.getQuantity(),
                                                item.getInstructions()))
                        .collect(Collectors.toList());

        try {
            if (prescription.getPatient() != null
                    && prescription.getPatient().getUser() != null
                    && prescription.getPatient().getUser().getEmail() != null) {
                String patientName =
                        prescription.getPatient().getUser().getFirstName()
                                + " "
                                + prescription.getPatient().getUser().getLastName();
                emailService.sendPrescriptionCreatedEmail(
                        prescription.getPatient().getUser().getEmail(),
                        patientName,
                        prescription.getId(),
                        createdEmailRows);
            }
        } catch (Exception e) {
            log.warn("Failed to send prescription create email: {}", e.getMessage());
        }

        return mapToResponse(prescription);
    }

    /**
     * Check for allergy conflicts with prescribed items. Returns list of allergy warnings for items
     * that match patient allergies.
     */
    @Transactional(readOnly = true)
    public List<AllergyWarning> checkAllergyConflicts(Long prescriptionId) {
        Prescription prescription =
                prescriptionRepository
                        .findById(prescriptionId)
                        .orElseThrow(
                                () ->
                                        new ResourceNotFoundException(
                                                "Prescription", "id", prescriptionId));

        List<PatientAllergy> allergies =
                patientAllergyRepository.findByPatientId(prescription.getPatient().getId());
        if (allergies.isEmpty()) return List.of();

        List<AllergyWarning> warnings = new ArrayList<>();
        for (PrescriptionItem item : prescription.getItems()) {
            String drugName = item.getDrugName();
            for (PatientAllergy allergy : allergies) {
                if (allergy.getAllergen() != null
                        && drugName != null
                        && drugName.toLowerCase().contains(allergy.getAllergen().toLowerCase())) {
                    warnings.add(
                            new AllergyWarning(
                                    item.getDrugName(),
                                    allergy.getAllergen(),
                                    allergy.getReaction()));
                    break;
                }
            }
        }
        return warnings;
    }

    /**
     * Dispense a prescription — subtract from inventory atomically, check low-stock thresholds, and
     * set status to DISPENSED. If overrideAllergyConfirmation is true, skips allergy check.
     */
    @Transactional
    public PrescriptionResponse dispensePrescription(
            Long prescriptionId, Long pharmacistId, boolean overrideAllergyConfirmation) {
        Prescription prescription =
                prescriptionRepository
                        .findById(prescriptionId)
                        .orElseThrow(
                                () ->
                                        new ResourceNotFoundException(
                                                "Prescription", "id", prescriptionId));

        if (prescription.getStatus() == PrescriptionStatus.DISPENSED) {
            throw new BadRequestException("Prescription is already dispensed");
        }
        if (prescription.getStatus() == PrescriptionStatus.CANCELLED) {
            throw new BadRequestException("Cannot dispense a cancelled prescription");
        }

        if (!overrideAllergyConfirmation) {
            List<AllergyWarning> conflicts = checkAllergyConflicts(prescriptionId);
            if (!conflicts.isEmpty()) {
                throw new BadRequestException(
                        "ALLERGY_CONFLICT:"
                                + conflicts.stream()
                                        .map(
                                                a ->
                                                        a.drugName
                                                                + " (patient allergic to "
                                                                + a.allergen
                                                                + ")")
                                        .collect(Collectors.joining("; ")));
            }
        }

        User pharmacist =
                pharmacistId != null ? userRepository.findById(pharmacistId).orElse(null) : null;

                // Subtract inventory for dispensable items.
                // True custom medicines (not found in inventory at all) are excluded from stock deduction.
        for (PrescriptionItem item : new ArrayList<>(prescription.getItems())) {
            int requestedQuantity = requireRequestedQuantity(item);

                    InventoryItem inv = resolveInventoryForDispense(item);

            if (inv == null) {
                        log.info(
                                "Skipping custom medicine during dispense (not in inventory): prescription #{}, item '{}'",
                                prescriptionId,
                                item.getDrugName());
                        continue;
            }

            Integer currentQuantity = inv.getQuantity();
            int availableQuantity = currentQuantity != null ? currentQuantity : 0;
            int newQuantity = availableQuantity - requestedQuantity;

            if (newQuantity < 0) {
                throw new BadRequestException(
                        "Insufficient stock for "
                                + inv.getDrugName()
                                + ". Available: "
                                + availableQuantity
                                + ", Required: "
                                + requestedQuantity);
            }

            inv.setQuantity(newQuantity);
            inventoryItemRepository.save(inv);

            // Link prescription item to inventory for future reference
            item.setInventoryItem(inv);

            // Log stock history
            inventoryService.createStockHistory(
                    inv,
                    -requestedQuantity,
                    newQuantity,
                    "Dispensed",
                    "Dispensed for prescription #" + prescriptionId,
                    prescriptionId,
                    pharmacist);

            int threshold = 10;
            Integer configuredThreshold = inv.getLowStockThreshold();
            if (configuredThreshold != null) {
                threshold = configuredThreshold;
            }
            if (newQuantity <= threshold) {
                log.warn(
                        "LOW STOCK ALERT: {} - remaining: {} (threshold: {})",
                        inv.getDrugName(),
                        newQuantity,
                        threshold);
            }
        }

        prescription.setStatus(PrescriptionStatus.DISPENSED);
        prescription.setDispensedAt(LocalDateTime.now());
        prescription.setDispensedBy(pharmacist);
        prescription = prescriptionRepository.save(prescription);

        log.info(
                "Prescription dispensed: #{} by {}",
                prescriptionId,
                pharmacist != null ? pharmacist.getEmail() : "unknown");

        String actorEmail = pharmacist != null ? pharmacist.getEmail() : null;
                try {
                        billingService.syncBillWithDispensedPrescription(prescriptionId, actorEmail);
                } catch (Exception ex) {
                        // Dispense should not fail if billing sync has a downstream issue.
                        log.warn(
                                        "Billing sync failed after dispensing prescription #{}: {}",
                                        prescriptionId,
                                        ex.getMessage());
                }

        return mapToResponse(prescription);
    }

    /** Get a prescription by ID. */
    private int requireRequestedQuantity(PrescriptionItem item) {
        Integer requested = item.getQuantity();
        if (requested == null || requested <= 0) {
            throw new BadRequestException(
                    "Invalid quantity in prescription item: "
                            + (item.getDrugName() != null ? item.getDrugName() : "unknown medicine"));
        }
        return requested;
    }

        private boolean isActiveInventory(InventoryItem inventoryItem) {
        return inventoryItem != null
                                && (inventoryItem.getIsArchived() == null || !inventoryItem.getIsArchived());
    }

        private InventoryItem resolveInventoryForDispense(PrescriptionItem item) {
        InventoryItem linkedInventory = item.getInventoryItem();
                if (isActiveInventory(linkedInventory)) {
            return linkedInventory;
        }

        String drugName = item.getDrugName();
        if (drugName == null || drugName.isBlank()) {
            return null;
        }

        String normalizedPrescriptionDrug = normalizeDrugName(drugName);

        // Support non-exact naming between prescription and inventory
        // (e.g. "Paracetamol 500mg" vs "Paracetamol").
        return inventoryItemRepository.findByIsArchivedFalse().stream()
                .filter(
                        candidate ->
                                isDrugNameMatch(
                                        normalizedPrescriptionDrug,
                                        normalizeDrugName(candidate.getDrugName())))
                .sorted(
                        Comparator.comparingInt(
                                        (InventoryItem candidate) ->
                                                Math.abs(
                                                        normalizeDrugName(candidate.getDrugName()).length()
                                                                - normalizedPrescriptionDrug.length()))
                                .thenComparing(
                                        InventoryItem::getQuantity,
                                        Comparator.nullsLast(Comparator.reverseOrder())))
                .findFirst()
                .orElse(null);
    }

    private boolean isDrugNameMatch(String prescriptionDrug, String inventoryDrug) {
        if (prescriptionDrug == null || prescriptionDrug.isBlank()) {
            return false;
        }
        if (inventoryDrug == null || inventoryDrug.isBlank()) {
            return false;
        }
        return prescriptionDrug.equals(inventoryDrug)
                || prescriptionDrug.contains(inventoryDrug)
                || inventoryDrug.contains(prescriptionDrug);
    }

    private String normalizeDrugName(String drugName) {
        if (drugName == null) {
            return "";
        }
        return drugName.toLowerCase(Locale.ROOT).replaceAll("[^a-z0-9]", "");
    }

    @Transactional(readOnly = true)
    public PrescriptionResponse getPrescriptionById(Long id) {
        Prescription prescription =
                prescriptionRepository
                        .findById(id)
                        .orElseThrow(() -> new ResourceNotFoundException("Prescription", "id", id));
        return mapToResponse(prescription);
    }

    /** Get prescriptions by patient id. */
    @Transactional(readOnly = true)
    public List<PrescriptionResponse> getByPatientId(Long patientId) {
        return prescriptionRepository.findByPatientId(patientId).stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

        /** Get pending prescriptions ordered by most recently prescribed first. */
        @Transactional(readOnly = true)
        public List<PrescriptionResponse> getPendingPrescriptions() {
                return prescriptionRepository.findByStatusOrderByPrescribedAtDesc(PrescriptionStatus.PENDING)
                                .stream()
                                .map(this::mapToResponse)
                                .collect(Collectors.toList());
        }

            /** Recently created pending prescriptions (doctor-added) for pharmacist alerts. */
            @Transactional(readOnly = true)
            public List<PrescriptionResponse> getRecentlyPendingPrescriptions(int minutesBack) {
                int safeMinutes = Math.max(1, minutesBack);
                LocalDateTime since = LocalDateTime.now().minusMinutes(safeMinutes);
                return prescriptionRepository
                        .findByStatusAndPrescribedAtAfterOrderByPrescribedAtDesc(
                                PrescriptionStatus.PENDING, since)
                        .stream()
                        .map(this::mapToResponse)
                        .collect(Collectors.toList());
            }

            /** Recently dispensed prescriptions for front-desk billing awareness. */
            @Transactional(readOnly = true)
            public List<PrescriptionResponse> getRecentlyDispensedPrescriptions(int minutesBack) {
                int safeMinutes = Math.max(1, minutesBack);
                LocalDateTime since = LocalDateTime.now().minusMinutes(safeMinutes);
                return prescriptionRepository
                        .findByStatusAndDispensedAtAfterOrderByDispensedAtDesc(
                                PrescriptionStatus.DISPENSED, since)
                        .stream()
                        .map(this::mapToResponse)
                        .collect(Collectors.toList());
            }

    /** Get prescription by consultation id. */
    @Transactional(readOnly = true)
    public PrescriptionResponse getByConsultationId(Long consultationId) {
        Prescription prescription =
                prescriptionRepository
                        .findTopByConsultationIdOrderByIdDesc(consultationId)
                        .orElseThrow(
                                () ->
                                        new ResourceNotFoundException(
                                                "Prescription", "consultationId", consultationId));
        return mapToResponse(prescription);
    }

    /** Update a pending prescription. */
    @Transactional
    public PrescriptionResponse updatePrescription(
            Long prescriptionId, PrescriptionRequest request, Long doctorId) {
        validatePrescriptionRequest(request);

        Prescription prescription =
                prescriptionRepository
                        .findById(prescriptionId)
                        .orElseThrow(
                                () ->
                                        new ResourceNotFoundException(
                                                "Prescription", "id", prescriptionId));

        if (prescription.getStatus() == PrescriptionStatus.DISPENSED
                || prescription.getStatus() == PrescriptionStatus.CANCELLED) {
            throw new BadRequestException("Cannot update a dispensed or cancelled prescription");
        }

        if (doctorId != null
                && prescription.getDoctor() != null
                && !doctorId.equals(prescription.getDoctor().getId())) {
            throw new BadRequestException("Only the prescribing doctor can update this prescription");
        }

        prescription.setNotes(request.getNotes());
        prescription.getItems().clear();

        for (PrescriptionRequest.PrescriptionItemRequest itemReq : request.getItems()) {
            InventoryItem inventoryItem = null;
            if (itemReq.getInventoryItemId() != null) {
                inventoryItem =
                        inventoryItemRepository.findById(itemReq.getInventoryItemId()).orElse(null);
            }

            PrescriptionItem item =
                    PrescriptionItem.builder()
                            .prescription(prescription)
                            .inventoryItem(inventoryItem)
                            .drugName(itemReq.getDrugName())
                            .dosage(itemReq.getDosage())
                            .frequency(itemReq.getFrequency())
                            .durationDays(itemReq.getDurationDays())
                            .quantity(itemReq.getQuantity())
                            .instructions(itemReq.getInstructions())
                            .build();
            prescription.getItems().add(item);
        }

        prescription = prescriptionRepository.save(prescription);

                try {
                        if (prescription.getPatient() != null
                                        && prescription.getPatient().getUser() != null
                                        && prescription.getPatient().getUser().getEmail() != null) {
                                String patientName =
                                                prescription.getPatient().getUser().getFirstName()
                                                                + " "
                                                                + prescription.getPatient().getUser().getLastName();

                                List<EmailService.PrescriptionMedicineRow> medicineRows =
                                                prescription.getItems().stream()
                                                                .map(
                                                                                item ->
                                                                                                new EmailService.PrescriptionMedicineRow(
                                                                                                                item.getDrugName(),
                                                                                                                item.getDosage(),
                                                                                                                item.getFrequency(),
                                                                                                                item.getDurationDays(),
                                                                                                                item.getQuantity(),
                                                                                                                item.getInstructions()))
                                                                .collect(Collectors.toList());

                                emailService.sendPrescriptionUpdatedEmail(
                                                prescription.getPatient().getUser().getEmail(),
                                                patientName,
                                                prescription.getId(),
                                                medicineRows);
                        }
                } catch (Exception e) {
                        log.warn("Failed to send prescription update email: {}", e.getMessage());
                }

        return mapToResponse(prescription);
    }

    /** Delete a pending prescription. */
    @Transactional
    public void deletePrescription(Long prescriptionId) {
        Prescription prescription =
                prescriptionRepository
                        .findById(prescriptionId)
                        .orElseThrow(
                                () ->
                                        new ResourceNotFoundException(
                                                "Prescription", "id", prescriptionId));

        if (prescription.getStatus() == PrescriptionStatus.DISPENSED) {
            throw new BadRequestException("Cannot delete a dispensed prescription");
        }

        prescriptionRepository.delete(prescription);
    }

    // ── Private helpers ──────────────────────────────────────────

        private void validatePrescriptionRequest(PrescriptionRequest request) {
                if (request.getItems() == null || request.getItems().isEmpty()) {
                        throw new BadRequestException("At least one prescription item is required");
                }

                for (int index = 0; index < request.getItems().size(); index++) {
                        PrescriptionRequest.PrescriptionItemRequest item = request.getItems().get(index);
                        int line = index + 1;

                        boolean hasInventory = item.getInventoryItemId() != null;
                        boolean hasDrugName = item.getDrugName() != null && !item.getDrugName().trim().isEmpty();
                        if (!hasInventory && !hasDrugName) {
                                throw new BadRequestException(
                                                "Medicine name is required at line " + line + " when inventory item is not selected");
                        }

                        if (item.getDosage() == null || item.getDosage().trim().isEmpty()) {
                                throw new BadRequestException("Dosage is required at line " + line);
                        }

                        if (item.getFrequency() == null || item.getFrequency().trim().isEmpty()) {
                                throw new BadRequestException("Frequency is required at line " + line);
                        }

                        if (item.getDurationDays() == null || item.getDurationDays() <= 0) {
                                throw new BadRequestException("Duration days must be greater than zero at line " + line);
                        }

                        if (item.getQuantity() == null || item.getQuantity() <= 0) {
                                throw new BadRequestException("Quantity must be greater than zero at line " + line);
                        }
                }
        }

    private PrescriptionResponse mapToResponse(Prescription p) {
        List<PrescriptionResponse.PrescriptionItemInfo> items =
                p.getItems().stream()
                        .map(
                                item ->
                                        PrescriptionResponse.PrescriptionItemInfo.builder()
                                                .id(item.getId())
                                                .inventoryItemId(
                                                        item.getInventoryItem() != null
                                                                ? item.getInventoryItem().getId()
                                                                : null)
                                                .drugName(item.getDrugName())
                                                .dosage(item.getDosage())
                                                .frequency(item.getFrequency())
                                                .durationDays(item.getDurationDays())
                                                .quantity(item.getQuantity())
                                                .instructions(item.getInstructions())
                                                .build())
                        .collect(Collectors.toList());

        return PrescriptionResponse.builder()
                .id(p.getId())
                .consultationId(p.getConsultation().getId())
                .patientId(p.getPatient().getId())
                .patientName(
                        p.getPatient().getUser().getFirstName()
                                + " "
                                + p.getPatient().getUser().getLastName())
                .doctorId(p.getDoctor().getId())
                .doctorName(p.getDoctor().getFirstName() + " " + p.getDoctor().getLastName())
                .status(p.getStatus())
                .prescribedAt(p.getPrescribedAt())
                .dispensedAt(p.getDispensedAt())
                .dispensedByName(
                        p.getDispensedBy() != null
                                ? p.getDispensedBy().getFirstName()
                                        + " "
                                        + p.getDispensedBy().getLastName()
                                : null)
                .notes(p.getNotes())
                .items(items)
                .build();
    }
}
