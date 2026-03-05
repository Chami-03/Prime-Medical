package com.medcenter.service;

import com.medcenter.dto.request.BillRequest;
import com.medcenter.dto.request.PaymentRequest;
import com.medcenter.dto.response.BillResponse;
import com.medcenter.entity.*;
import com.medcenter.enums.BillStatus;
import com.medcenter.enums.ItemType;
import com.medcenter.enums.PrescriptionStatus;
import com.medcenter.exception.BadRequestException;
import com.medcenter.exception.ResourceNotFoundException;
import com.medcenter.repository.*;
import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.time.Year;
import java.util.ArrayList;
import java.util.Collections;
import java.util.List;
import java.util.stream.Collectors;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
@Slf4j
public class BillingService {

    private final BillRepository billRepository;
    private final PaymentRepository paymentRepository;
    private final PatientRepository patientRepository;
    private final ConsultationRepository consultationRepository;
    private final PrescriptionRepository prescriptionRepository;
    private final UserRepository userRepository;

    private static final BigDecimal CONSULTATION_FEE = new BigDecimal("1500.00");
    private static final BigDecimal TAX_RATE = BigDecimal.ZERO; // 0% tax

    /**
     * Generate a bill for a patient consultation. Auto-pulls consultation fee and dispensed
     * prescription items as line items.
     */
    @Transactional
    public BillResponse generateBill(BillRequest request, String userEmail) {
        Patient patient =
                patientRepository
                        .findById(request.getPatientId())
                        .orElseThrow(
                                () ->
                                        new ResourceNotFoundException(
                                                "Patient", "id", request.getPatientId()));

        User createdBy =
                userRepository
                        .findByEmail(userEmail)
                        .orElseThrow(
                                () -> new ResourceNotFoundException("User", "email", userEmail));

        Consultation consultation = null;
        if (request.getConsultationId() != null) {
            consultation =
                    consultationRepository
                            .findById(request.getConsultationId())
                            .orElseThrow(
                                    () ->
                                            new ResourceNotFoundException(
                                                    "Consultation",
                                                    "id",
                                                    request.getConsultationId()));
        }

        String invoiceNumber = generateInvoiceNumber();

        Bill bill =
                Bill.builder()
                        .invoiceNumber(invoiceNumber)
                        .patient(patient)
                        .consultation(consultation)
                        .createdBy(createdBy)
                        .status(BillStatus.ISSUED)
                        .lineItems(new ArrayList<>())
                        .payments(new ArrayList<>())
                        .build();

        BigDecimal subtotal = BigDecimal.ZERO;

        // 1. Add consultation fee as a line item
        if (consultation != null) {
            BillLineItem consultationLine =
                    BillLineItem.builder()
                            .bill(bill)
                            .description(
                                    "Consultation Fee — Dr. "
                                            + consultation.getDoctor().getFirstName()
                                            + " "
                                            + consultation.getDoctor().getLastName())
                            .itemType(ItemType.CONSULTATION)
                            .quantity(1)
                            .unitPrice(CONSULTATION_FEE)
                            .totalPrice(CONSULTATION_FEE)
                            .build();
            bill.getLineItems().add(consultationLine);
            subtotal = subtotal.add(CONSULTATION_FEE);

            // 2. Add dispensed prescription items
            prescriptionRepository
                    .findByConsultationId(consultation.getId())
                    .filter(p -> p.getStatus() == PrescriptionStatus.DISPENSED)
                    .ifPresent(
                            prescription -> {
                                for (PrescriptionItem item : prescription.getItems()) {
                                    BigDecimal unitPrice = BigDecimal.ZERO;
                                    if (item.getInventoryItem() != null
                                            && item.getInventoryItem().getSellingPrice() != null) {
                                        unitPrice = item.getInventoryItem().getSellingPrice();
                                    }
                                    BigDecimal totalPrice =
                                            unitPrice.multiply(
                                                    BigDecimal.valueOf(item.getQuantity()));

                                    BillLineItem medicineLine =
                                            BillLineItem.builder()
                                                    .bill(bill)
                                                    .description(
                                                            item.getDrugName()
                                                                    + " — "
                                                                    + item.getDosage()
                                                                    + " x "
                                                                    + item.getQuantity())
                                                    .itemType(ItemType.MEDICINE)
                                                    .quantity(item.getQuantity())
                                                    .unitPrice(unitPrice)
                                                    .totalPrice(totalPrice)
                                                    .build();
                                    bill.getLineItems().add(medicineLine);
                                }
                            });
        }

        // Recalculate subtotal from all line items
        subtotal =
                bill.getLineItems().stream()
                        .map(BillLineItem::getTotalPrice)
                        .reduce(BigDecimal.ZERO, BigDecimal::add);

        BigDecimal taxAmount = subtotal.multiply(TAX_RATE);
        BigDecimal netAmount = subtotal.add(taxAmount);

        bill.setSubtotal(subtotal);
        bill.setTaxAmount(taxAmount);
        bill.setDiscount(BigDecimal.ZERO);
        bill.setNetAmount(netAmount);

        Bill savedBill = billRepository.save(bill);
        log.info("Bill generated: {} — Net: {}", invoiceNumber, netAmount);

        return mapToResponse(savedBill);
    }

    /**
     * Process a payment against a bill. Updates bill status to PARTIAL or PAID depending on total
     * payments.
     */
    @Transactional
    public BillResponse processPayment(Long billId, PaymentRequest request, String userEmail) {
        Bill bill =
                billRepository
                        .findById(billId)
                        .orElseThrow(() -> new ResourceNotFoundException("Bill", "id", billId));

        if (bill.getStatus() == BillStatus.PAID) {
            throw new BadRequestException("Bill is already fully paid");
        }
        if (bill.getStatus() == BillStatus.REFUNDED) {
            throw new BadRequestException("Cannot pay a refunded bill");
        }

        User processedBy =
                userRepository
                        .findByEmail(userEmail)
                        .orElseThrow(
                                () -> new ResourceNotFoundException("User", "email", userEmail));

        Payment payment =
                Payment.builder()
                        .bill(bill)
                        .amount(request.getAmount())
                        .paymentMethod(request.getPaymentMethod())
                        .paymentReference(request.getPaymentReference())
                        .processedBy(processedBy)
                        .paidAt(LocalDateTime.now())
                        .notes(request.getNotes())
                        .build();

        paymentRepository.save(payment);

        // Calculate total paid
        BigDecimal totalPaid =
                paymentRepository.findByBillId(billId).stream()
                        .map(Payment::getAmount)
                        .reduce(BigDecimal.ZERO, BigDecimal::add);

        if (totalPaid.compareTo(bill.getNetAmount()) >= 0) {
            bill.setStatus(BillStatus.PAID);
        } else {
            bill.setStatus(BillStatus.PARTIAL);
        }
        bill = billRepository.save(bill);

        log.info(
                "Payment processed: {} on bill {} — Total paid: {}/{}",
                request.getAmount(),
                bill.getInvoiceNumber(),
                totalPaid,
                bill.getNetAmount());

        return mapToResponse(bill);
    }

    /** Get bill by ID. */
    @Transactional(readOnly = true)
    public BillResponse getBillById(Long id) {
        Bill bill =
                billRepository
                        .findById(id)
                        .orElseThrow(() -> new ResourceNotFoundException("Bill", "id", id));
        return mapToResponse(bill);
    }

    /** Get all bills for a patient. */
    @Transactional(readOnly = true)
    public List<BillResponse> getBillsByPatientId(Long patientId) {
        return billRepository.findByPatientId(patientId).stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    // ── Private helpers ──────────────────────────────────────────

    private String generateInvoiceNumber() {
        long count = billRepository.count() + 1;
        return String.format("INV-%d-%05d", Year.now().getValue(), count);
    }

    private BillResponse mapToResponse(Bill bill) {
        List<BillResponse.LineItemInfo> lineItems =
                bill.getLineItems() != null
                        ? bill.getLineItems().stream()
                                .map(
                                        li ->
                                                BillResponse.LineItemInfo.builder()
                                                        .id(li.getId())
                                                        .description(li.getDescription())
                                                        .itemType(li.getItemType())
                                                        .quantity(li.getQuantity())
                                                        .unitPrice(li.getUnitPrice())
                                                        .totalPrice(li.getTotalPrice())
                                                        .build())
                                .collect(Collectors.toList())
                        : Collections.emptyList();

        List<BillResponse.PaymentInfo> payments =
                bill.getPayments() != null
                        ? bill.getPayments().stream()
                                .map(
                                        p ->
                                                BillResponse.PaymentInfo.builder()
                                                        .id(p.getId())
                                                        .amount(p.getAmount())
                                                        .paymentMethod(p.getPaymentMethod())
                                                        .paymentReference(p.getPaymentReference())
                                                        .processedByName(
                                                                p.getProcessedBy() != null
                                                                        ? p.getProcessedBy()
                                                                                        .getFirstName()
                                                                                + " "
                                                                                + p.getProcessedBy()
                                                                                        .getLastName()
                                                                        : null)
                                                        .paidAt(p.getPaidAt())
                                                        .notes(p.getNotes())
                                                        .build())
                                .collect(Collectors.toList())
                        : Collections.emptyList();

        return BillResponse.builder()
                .id(bill.getId())
                .invoiceNumber(bill.getInvoiceNumber())
                .patientId(bill.getPatient().getId())
                .patientName(
                        bill.getPatient().getUser().getFirstName()
                                + " "
                                + bill.getPatient().getUser().getLastName())
                .consultationId(
                        bill.getConsultation() != null ? bill.getConsultation().getId() : null)
                .subtotal(bill.getSubtotal())
                .discount(bill.getDiscount())
                .taxAmount(bill.getTaxAmount())
                .netAmount(bill.getNetAmount())
                .status(bill.getStatus())
                .createdByName(
                        bill.getCreatedBy() != null
                                ? bill.getCreatedBy().getFirstName()
                                        + " "
                                        + bill.getCreatedBy().getLastName()
                                : null)
                .createdAt(bill.getCreatedAt())
                .updatedAt(bill.getUpdatedAt())
                .lineItems(lineItems)
                .payments(payments)
                .build();
    }
}
