package com.medcenter.service;

import com.medcenter.dto.request.PrescriptionRequest;
import com.medcenter.dto.response.PrescriptionResponse;
import com.medcenter.entity.*;
import com.medcenter.enums.PrescriptionStatus;
import com.medcenter.exception.BadRequestException;
import com.medcenter.exception.ResourceNotFoundException;
import com.medcenter.repository.*;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.stream.Collectors;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

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

        // Subtract inventory for each item
        for (PrescriptionItem item : prescription.getItems()) {
            InventoryItem inv = item.getInventoryItem();
            if (inv == null) {
                // Find by drug name if not linked
                List<InventoryItem> matches =
                        inventoryItemRepository.findByDrugNameContainingIgnoreCase(
                                item.getDrugName());
                inv =
                        matches.stream()
                                .filter(
                                        i ->
                                                (i.getIsArchived() == null || !i.getIsArchived())
                                                        && i.getQuantity() != null
                                                        && i.getQuantity() >= item.getQuantity())
                                .findFirst()
                                .orElse(null);
            }
            if (inv != null) {
                int newQuantity = inv.getQuantity() - item.getQuantity();

                if (newQuantity < 0) {
                    throw new BadRequestException(
                            "Insufficient stock for "
                                    + inv.getDrugName()
                                    + ". Available: "
                                    + inv.getQuantity()
                                    + ", Required: "
                                    + item.getQuantity());
                }

                inv.setQuantity(newQuantity);
                inventoryItemRepository.save(inv);

                // Link prescription item to inventory for future reference
                item.setInventoryItem(inv);
                prescriptionRepository.save(prescription);

                // Log stock history
                inventoryService.createStockHistory(
                        inv,
                        -item.getQuantity(),
                        newQuantity,
                        "Dispensed",
                        "Dispensed for prescription #" + prescriptionId,
                        prescriptionId,
                        pharmacist);

                if (newQuantity
                        <= (inv.getLowStockThreshold() != null ? inv.getLowStockThreshold() : 10)) {
                    log.warn(
                            "LOW STOCK ALERT: {} — remaining: {} (threshold: {})",
                            inv.getDrugName(),
                            newQuantity,
                            inv.getLowStockThreshold());
                }
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
        return mapToResponse(prescription);
    }

    /** Get a prescription by ID. */
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
