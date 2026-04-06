package com.primemedical.service;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.time.Year;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.Collections;
import java.util.List;
import java.util.stream.Collectors;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;

import com.primemedical.dto.request.BillRequest;
import com.primemedical.dto.request.PaymentRequest;
import com.primemedical.dto.response.BillResponse;
import com.primemedical.entity.Bill;
import com.primemedical.entity.BillLineItem;
import com.primemedical.entity.Consultation;
import com.primemedical.entity.Patient;
import com.primemedical.entity.Payment;
import com.primemedical.entity.Prescription;
import com.primemedical.entity.PrescriptionItem;
import com.primemedical.entity.User;
import com.primemedical.enums.BillStatus;
import com.primemedical.enums.ItemType;
import com.primemedical.enums.PrescriptionStatus;
import com.primemedical.exception.BadRequestException;
import com.primemedical.exception.ResourceNotFoundException;
import com.primemedical.repository.BillRepository;
import com.primemedical.repository.ConsultationRepository;
import com.primemedical.repository.PatientRepository;
import com.primemedical.repository.PaymentRepository;
import com.primemedical.repository.PrescriptionRepository;
import com.primemedical.repository.UserRepository;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

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
        private final EmailService emailService;
        private final SmsService smsService;

                private static final BigDecimal DOCTOR_FEE = new BigDecimal("2000.00");
        private static final BigDecimal CHANNELING_FEE = new BigDecimal("1000.00");
        private static final BigDecimal DEFAULT_BLOOD_TEST_FEE = new BigDecimal("1000.00");
    private static final BigDecimal TAX_RATE = BigDecimal.ZERO; // 0% tax
        private static final DateTimeFormatter INVOICE_TS_FMT = DateTimeFormatter.ofPattern("yyMMddHHmmss");

        /**
         * Ensure a consultation bill reflects the latest dispensed prescription medicine charges.
         * If no bill exists yet, a new one is generated with consultation and medicine line items.
         */
        @Transactional(propagation = Propagation.REQUIRES_NEW)
        public BillResponse syncBillWithDispensedPrescription(Long prescriptionId, String actorEmail) {
                Prescription prescription =
                                prescriptionRepository
                                                .findById(prescriptionId)
                                                .orElseThrow(
                                                                () ->
                                                                                new ResourceNotFoundException(
                                                                                                "Prescription", "id", prescriptionId));

                if (prescription.getStatus() != PrescriptionStatus.DISPENSED) {
                        throw new BadRequestException("Prescription is not yet dispensed");
                }

                Consultation consultation = prescription.getConsultation();
                if (consultation == null || consultation.getPatient() == null) {
                        throw new BadRequestException("Dispensed prescription has no linked consultation/patient");
                }

                Bill bill = billRepository.findByConsultationId(consultation.getId()).orElse(null);
                if (bill == null) {
                        bill = bindConsultationToMatchingBookingBill(consultation);
                }

                if (bill == null) {
                        String billingUserEmail = actorEmail;
                        if (billingUserEmail == null || billingUserEmail.isBlank()) {
                                billingUserEmail =
                                                consultation.getDoctor() != null ? consultation.getDoctor().getEmail() : null;
                        }
                        if (billingUserEmail == null || billingUserEmail.isBlank()) {
                                throw new BadRequestException("Unable to resolve billing user for consultation bill");
                        }

                        return generateBill(
                                        new BillRequest(consultation.getPatient().getId(), consultation.getId()),
                                        billingUserEmail);
                }

                if (bill.getConsultation() == null) {
                        bill.setConsultation(consultation);
                }

                ensureBaseFeeLineItems(bill, consultation);

                bill.getLineItems().removeIf(li -> li.getItemType() == ItemType.MEDICINE);

                addMedicineLineItems(bill, prescription);

                BigDecimal subtotal =
                                bill.getLineItems().stream()
                                                .map(BillLineItem::getTotalPrice)
                                                .reduce(BigDecimal.ZERO, BigDecimal::add);
                BigDecimal taxAmount = subtotal.multiply(TAX_RATE);
                BigDecimal netAmount = subtotal.add(taxAmount);

                bill.setSubtotal(subtotal);
                bill.setTaxAmount(taxAmount);
                bill.setNetAmount(netAmount);

                BigDecimal totalPaid =
                                paymentRepository.findByBillId(bill.getId()).stream()
                                                .map(Payment::getAmount)
                                                .reduce(BigDecimal.ZERO, BigDecimal::add);

                if (bill.getStatus() != BillStatus.REFUNDED) {
                        if (totalPaid.compareTo(netAmount) >= 0) {
                                bill.setStatus(BillStatus.PAID);
                        } else if (totalPaid.compareTo(BigDecimal.ZERO) > 0) {
                                bill.setStatus(BillStatus.PARTIAL);
                        } else {
                                bill.setStatus(BillStatus.ISSUED);
                        }
                }

                bill = billRepository.save(bill);
                log.info(
                                "Billing synced for dispensed prescription #{} -> invoice {} net {}",
                                prescriptionId,
                                bill.getInvoiceNumber(),
                                bill.getNetAmount());

                return mapToResponse(bill);
        }

        /**
         * Ensure a consultation bill includes the completed blood test charge.
         */
        @Transactional(propagation = Propagation.REQUIRES_NEW)
        public BillResponse syncBillWithBloodCheckup(Long consultationId, String actorEmail) {
                Consultation consultation =
                                consultationRepository
                                                .findById(consultationId)
                                                .orElseThrow(
                                                                () ->
                                                                                new ResourceNotFoundException(
                                                                                                "Consultation", "id", consultationId));

                if (consultation.getPatient() == null) {
                        throw new BadRequestException("Consultation has no linked patient");
                }

                if (!Boolean.TRUE.equals(consultation.getBloodCheckRequired())
                                || !Boolean.TRUE.equals(consultation.getBloodCheckCompleted())) {
                        throw new BadRequestException("Blood checkup is not completed for this consultation");
                }

                if (consultation.getBloodTestType() == null || consultation.getBloodTestType().isBlank()) {
                        throw new BadRequestException("Blood test type is missing for completed blood checkup");
                }

                Bill bill = billRepository.findByConsultationId(consultationId).orElse(null);
                if (bill == null) {
                        bill = bindConsultationToMatchingBookingBill(consultation);
                }

                if (bill == null) {
                        String billingUserEmail = actorEmail;
                        if (billingUserEmail == null || billingUserEmail.isBlank()) {
                                billingUserEmail =
                                                consultation.getDoctor() != null ? consultation.getDoctor().getEmail() : null;
                        }
                        if (billingUserEmail == null || billingUserEmail.isBlank()) {
                                throw new BadRequestException("Unable to resolve billing user for consultation bill");
                        }

                        BillResponse generated =
                                        generateBill(
                                                        new BillRequest(consultation.getPatient().getId(), consultationId),
                                                        billingUserEmail);
                        bill =
                                        billRepository
                                                        .findById(generated.getId())
                                                        .orElseThrow(
                                                                        () ->
                                                                                        new ResourceNotFoundException(
                                                                                                        "Bill", "id", generated.getId()));
                }

                if (bill.getConsultation() == null) {
                        bill.setConsultation(consultation);
                }

                ensureBaseFeeLineItems(bill, consultation);

                // Keep only the latest blood test charge line for this consultation.
                bill.getLineItems().removeIf(this::isBloodTestLineItem);
                addBloodTestLineItem(bill, consultation);

                recalculateBillTotalsAndStatus(bill);
                bill = billRepository.save(bill);

                log.info(
                                "Billing synced for blood checkup consultation #{} -> invoice {} net {}",
                                consultationId,
                                bill.getInvoiceNumber(),
                                bill.getNetAmount());

                return mapToResponse(bill);
        }

    /**
     * Generate a bill for a patient. Auto-adds doctor fee + channeling fee and appends dispensed
     * medicine line items when a dispensed prescription is available.
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
        Prescription dispensedPrescription = null;
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
        } else {
            dispensedPrescription =
                    prescriptionRepository
                            .findTopByPatientIdAndStatusOrderByDispensedAtDesc(
                                    patient.getId(), PrescriptionStatus.DISPENSED)
                            .orElse(null);
            if (dispensedPrescription != null) {
                consultation = dispensedPrescription.getConsultation();
            }
        }

        if (consultation != null) {
            Bill existingBill = billRepository.findByConsultationId(consultation.getId()).orElse(null);
            if (existingBill != null) {
                return mapToResponse(existingBill);
            }
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

        addBaseFeeLineItems(bill, consultation);

        if (consultation != null) {
            Prescription prescriptionForBilling = dispensedPrescription;
            if (prescriptionForBilling == null
                    || prescriptionForBilling.getConsultation() == null
                    || !consultation.getId().equals(prescriptionForBilling.getConsultation().getId())) {
                prescriptionForBilling =
                        prescriptionRepository
                                .findByConsultationId(consultation.getId())
                                .filter(p -> p.getStatus() == PrescriptionStatus.DISPENSED)
                                .orElse(null);
            }
            if (prescriptionForBilling != null) {
                addMedicineLineItems(bill, prescriptionForBilling);
            }

                        if (Boolean.TRUE.equals(consultation.getBloodCheckRequired())
                                        && Boolean.TRUE.equals(consultation.getBloodCheckCompleted())
                                        && consultation.getBloodTestType() != null
                                        && !consultation.getBloodTestType().isBlank()) {
                                addBloodTestLineItem(bill, consultation);
                        }
        }

        // Recalculate subtotal from all line items
        BigDecimal subtotal =
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

        @Transactional(propagation = Propagation.REQUIRES_NEW)
        public BillResponse generateBookingBill(Long patientId, String userEmail) {
                    return generateBookingBill(patientId, userEmail, null);
            }

            @Transactional(propagation = Propagation.REQUIRES_NEW)
            public BillResponse generateBookingBill(
                    Long patientId, String userEmail, String appointmentConfirmationCode) {
                    Patient patient =
                                    patientRepository
                                                    .findById(patientId)
                                                    .orElseThrow(
                                                                    () ->
                                                                                    new ResourceNotFoundException(
                                                                                                    "Patient", "id", patientId));

                    User createdBy =
                                    userRepository
                                                    .findByEmail(userEmail)
                                                    .orElseThrow(
                                                                    () ->
                                                                                    new ResourceNotFoundException(
                                                                                                    "User", "email", userEmail));

                    String invoiceNumber = generateInvoiceNumber();

                    Bill bill =
                                    Bill.builder()
                                                    .invoiceNumber(invoiceNumber)
                                                    .patient(patient)
                                                    .consultation(null)
                                                    .createdBy(createdBy)
                                                    .status(BillStatus.ISSUED)
                                                    .lineItems(new ArrayList<>())
                                                    .payments(new ArrayList<>())
                                                    .build();

                    addBaseFeeLineItems(bill, null);

                    if (appointmentConfirmationCode != null && !appointmentConfirmationCode.isBlank()) {
                            String code = appointmentConfirmationCode.trim();
                            for (BillLineItem lineItem : bill.getLineItems()) {
                                    if (lineItem.getItemType() == ItemType.OTHER
                                                    && lineItem.getDescription() != null
                                                    && lineItem.getDescription().equalsIgnoreCase("Channeling Fee")) {
                                            lineItem.setDescription("Channeling Fee (Appt: " + code + ")");
                                    }
                            }
                    }

                    BigDecimal subtotal =
                                    bill.getLineItems().stream()
                                                    .map(BillLineItem::getTotalPrice)
                                                    .reduce(BigDecimal.ZERO, BigDecimal::add);
                    BigDecimal taxAmount = subtotal.multiply(TAX_RATE);
                    BigDecimal netAmount = subtotal.add(taxAmount);

                    bill.setSubtotal(subtotal);
                    bill.setTaxAmount(taxAmount);
                    bill.setDiscount(BigDecimal.ZERO);
                    bill.setNetAmount(netAmount);

                    Bill saved = billRepository.save(bill);
                    log.info("Booking bill generated: {} — Net: {}", invoiceNumber, netAmount);

                    return mapToResponse(saved);
            }

            @Transactional(propagation = Propagation.REQUIRES_NEW)
            public void rollbackBookingBillForCancelledAppointment(
                    Long patientId, String appointmentConfirmationCode) {
                    List<Bill> bills = billRepository.findByPatientId(patientId);
                    if (bills == null || bills.isEmpty()) {
                            return;
                    }

                    String normalizedCode =
                                    appointmentConfirmationCode == null
                                                    ? ""
                                                    : appointmentConfirmationCode.trim().toLowerCase();

                    List<Bill> bookingBills =
                                    bills.stream()
                                                    .filter(this::isStandaloneBookingBill)
                                                    .collect(Collectors.toList());

                    if (bookingBills.isEmpty()) {
                            return;
                    }

                    Bill target =
                                    bookingBills.stream()
                                                    .filter(
                                                                    bill ->
                                                                                    !normalizedCode.isBlank()
                                                                                                    && bill.getLineItems().stream()
                                                                                                                    .map(BillLineItem::getDescription)
                                                                                                                    .filter(desc -> desc != null)
                                                                                                                    .map(String::toLowerCase)
                                                                                                                    .anyMatch(desc -> desc.contains(normalizedCode)))
                                                    .max((a, b) -> a.getCreatedAt().compareTo(b.getCreatedAt()))
                                                    .orElse(null);

                    if (target == null) {
                            target =
                                            bookingBills.stream()
                                                            .max((a, b) -> a.getCreatedAt().compareTo(b.getCreatedAt()))
                                                            .orElse(null);
                    }

                    if (target == null) {
                            return;
                    }

                    boolean changed = ensureBookingRefundLineItems(target, appointmentConfirmationCode);
                    target.setStatus(BillStatus.REFUNDED);
                    recalculateBillTotalsAndStatus(target);
                    billRepository.save(target);

                    if (changed) {
                            log.info(
                                            "Applied booking refund line items and marked bill {} as REFUNDED for appointment {}",
                                            target.getInvoiceNumber(),
                                            appointmentConfirmationCode);
                    } else {
                            log.info(
                                            "Booking bill {} already refunded; status ensured for appointment {}",
                                            target.getInvoiceNumber(),
                                            appointmentConfirmationCode);
                    }
            }

        @Transactional(propagation = Propagation.REQUIRES_NEW)
        public BillResponse generateConsultationFeeBillIfAbsent(Long consultationId) {
                Bill existingBill = billRepository.findByConsultationId(consultationId).orElse(null);
                if (existingBill != null) {
                        return mapToResponse(existingBill);
                }

                Consultation consultation =
                                consultationRepository
                                                .findById(consultationId)
                                                .orElseThrow(
                                                                () ->
                                                                                new ResourceNotFoundException(
                                                                                                "Consultation", "id", consultationId));

                if (consultation.getPatient() == null) {
                        throw new BadRequestException("Consultation has no linked patient");
                }

                Bill bookingBill = bindConsultationToMatchingBookingBill(consultation);
                if (bookingBill != null) {
                        return mapToResponse(bookingBill);
                }

                String billingUserEmail =
                                consultation.getDoctor() != null ? consultation.getDoctor().getEmail() : null;
                if (billingUserEmail == null || billingUserEmail.isBlank()) {
                        throw new BadRequestException("Consultation has no billing user context");
                }

                BillRequest request = new BillRequest(consultation.getPatient().getId(), consultationId);
                return generateBill(request, billingUserEmail);
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

        // Recalculate totals from all line items so every charge is reflected before status update.
        recalculateBillTotalsAndStatus(bill);
        bill = billRepository.save(bill);

        BigDecimal totalPaid =
                paymentRepository.findByBillId(billId).stream()
                        .map(Payment::getAmount)
                        .reduce(BigDecimal.ZERO, BigDecimal::add);

        log.info(
                "Payment processed: {} on bill {} — Total paid: {}/{}",
                request.getAmount(),
                bill.getInvoiceNumber(),
                totalPaid,
                bill.getNetAmount());

        try {
            if (bill.getPatient() != null
                    && bill.getPatient().getUser() != null
                    && bill.getPatient().getUser().getEmail() != null) {
                String patientName =
                        bill.getPatient().getUser().getFirstName()
                                + " "
                                + bill.getPatient().getUser().getLastName();
                BigDecimal balanceDue = bill.getNetAmount().subtract(totalPaid).max(BigDecimal.ZERO);

                emailService.sendPaymentConfirmationEmail(
                        bill.getPatient().getUser().getEmail(),
                        patientName,
                        bill.getInvoiceNumber(),
                        request.getAmount(),
                        totalPaid,
                        balanceDue,
                        bill.getStatus().name());
            }
        } catch (Exception e) {
            log.warn("Failed to send payment confirmation email: {}", e.getMessage());
        }

        try {
            if (bill.getStatus() == BillStatus.PAID
                    && bill.getPatient() != null
                    && bill.getPatient().getUser() != null
                    && bill.getPatient().getUser().getEmail() != null) {
                String patientName =
                        bill.getPatient().getUser().getFirstName()
                                + " "
                                + bill.getPatient().getUser().getLastName();

                List<EmailService.BillLineItemEmailRow> emailLineItems =
                        bill.getLineItems() == null
                                ? List.of()
                                : bill.getLineItems().stream()
                                        .map(
                                                li ->
                                                        new EmailService.BillLineItemEmailRow(
                                                                li.getDescription(),
                                                                li.getQuantity(),
                                                                li.getUnitPrice(),
                                                                li.getTotalPrice()))
                                        .collect(Collectors.toList());

                emailService.sendBillPaidReceiptEmail(
                        bill.getPatient().getUser().getEmail(),
                        patientName,
                        bill.getInvoiceNumber(),
                        bill.getSubtotal(),
                        bill.getTaxAmount(),
                        bill.getNetAmount(),
                        totalPaid,
                        emailLineItems);
            }
        } catch (Exception e) {
            log.warn("Failed to send bill receipt email after payment completion: {}", e.getMessage());
        }

        try {
            if (bill.getPatient() != null
                    && bill.getPatient().getUser() != null
                    && bill.getPatient().getUser().getPhone() != null) {
                BigDecimal balanceDue = bill.getNetAmount().subtract(totalPaid).max(BigDecimal.ZERO);
                smsService.sendPaymentConfirmation(
                        bill.getPatient().getUser().getPhone(),
                        bill.getInvoiceNumber(),
                        request.getAmount(),
                        balanceDue,
                        bill.getStatus().name());
            }
        } catch (Exception e) {
            log.warn("Failed to send payment confirmation SMS: {}", e.getMessage());
        }

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
                String year = String.valueOf(Year.now().getValue());
                for (int attempt = 0; attempt < 8; attempt++) {
                        String candidate =
                                        "INV-"
                                                        + year
                                                        + "-"
                                                        + LocalDateTime.now().format(INVOICE_TS_FMT)
                                                        + "-"
                                                        + (int) (Math.random() * 1000);
                        if (!billRepository.existsByInvoiceNumber(candidate)) {
                                return candidate;
                        }
                }
                throw new BadRequestException("Unable to generate unique invoice number");
    }

    private boolean isStandaloneBookingBill(Bill bill) {
            if (bill == null || bill.getConsultation() != null || bill.getLineItems() == null) {
                    return false;
            }

            boolean hasDoctorFee =
                            bill.getLineItems().stream()
                                            .anyMatch(
                                                            li ->
                                                                            li.getItemType() == ItemType.CONSULTATION
                                                                                            && li.getUnitPrice() != null
                                                                                            && li.getUnitPrice().compareTo(DOCTOR_FEE) == 0
                                                                                            && Integer.valueOf(1).equals(li.getQuantity()));

            boolean hasChannelingFee =
                            bill.getLineItems().stream()
                                            .anyMatch(
                                                            li ->
                                                                            li.getItemType() == ItemType.OTHER
                                                                                            && li.getUnitPrice() != null
                                                                                            && li.getUnitPrice().compareTo(CHANNELING_FEE) == 0
                                                                                            && Integer.valueOf(1).equals(li.getQuantity())
                                                                                            && li.getDescription() != null
                                                                                            && li.getDescription().toLowerCase().contains("channel"));

            boolean hasNonBookingCharges =
                            bill.getLineItems().stream()
                                            .anyMatch(
                                                            li ->
                                                                            li.getItemType() == ItemType.MEDICINE
                                                                                            || li.getItemType() == ItemType.PROCEDURE);

            return hasDoctorFee && hasChannelingFee && !hasNonBookingCharges;
    }

    private Bill bindConsultationToMatchingBookingBill(Consultation consultation) {
            if (consultation == null || consultation.getPatient() == null) {
                    return null;
            }

            String confirmationCode =
                            consultation.getAppointment() != null
                                            ? consultation.getAppointment().getConfirmationCode()
                                            : null;
            if (confirmationCode == null || confirmationCode.isBlank()) {
                    return null;
            }

            String normalizedCode = confirmationCode.trim().toLowerCase();

            Bill bookingBill =
                            billRepository.findByPatientId(consultation.getPatient().getId()).stream()
                                            .filter(this::isStandaloneBookingBill)
                                            .filter(
                                                            bill ->
                                                                            bill.getLineItems() != null
                                                                                            && bill.getLineItems().stream()
                                                                                                            .map(BillLineItem::getDescription)
                                                                                                            .filter(desc -> desc != null)
                                                                                                            .map(String::toLowerCase)
                                                                                                            .anyMatch(desc -> desc.contains(normalizedCode)))
                                            .max((a, b) -> a.getCreatedAt().compareTo(b.getCreatedAt()))
                                            .orElse(null);

            if (bookingBill == null) {
                    return null;
            }

            bookingBill.setConsultation(consultation);
            ensureBaseFeeLineItems(bookingBill, consultation);
            recalculateBillTotalsAndStatus(bookingBill);
            return billRepository.save(bookingBill);
    }

        private void addBaseFeeLineItems(Bill bill, Consultation consultation) {
                String doctorName = "Doctor";
                if (consultation != null && consultation.getDoctor() != null) {
                        doctorName =
                                        (consultation.getDoctor().getFirstName() + " " + consultation.getDoctor().getLastName())
                                                        .trim();
                }

                BillLineItem doctorFeeLine =
                                BillLineItem.builder()
                                                .bill(bill)
                                                .description("Doctor Fee - Dr. " + doctorName)
                                                .itemType(ItemType.CONSULTATION)
                                                .quantity(1)
                                                .unitPrice(DOCTOR_FEE)
                                                .totalPrice(DOCTOR_FEE)
                                                .build();
                bill.getLineItems().add(doctorFeeLine);

                BillLineItem channelingFeeLine =
                                BillLineItem.builder()
                                                .bill(bill)
                                                .description("Channeling Fee")
                                                .itemType(ItemType.OTHER)
                                                .quantity(1)
                                                .unitPrice(CHANNELING_FEE)
                                                .totalPrice(CHANNELING_FEE)
                                                .build();
                bill.getLineItems().add(channelingFeeLine);
        }

        private void ensureBaseFeeLineItems(Bill bill, Consultation consultation) {
                boolean hasDoctorFee =
                                bill.getLineItems().stream()
                                                .anyMatch(
                                                                li ->
                                                                                li.getItemType() == ItemType.CONSULTATION
                                                                                                && li.getUnitPrice() != null
                                                                                                && li.getUnitPrice().compareTo(DOCTOR_FEE) == 0
                                                                                                && Integer.valueOf(1).equals(li.getQuantity()));

                boolean hasChannelingFee =
                                bill.getLineItems().stream()
                                                .anyMatch(
                                                                li ->
                                                                                li.getUnitPrice() != null
                                                                                                && li.getUnitPrice().compareTo(CHANNELING_FEE) == 0
                                                                                                && Integer.valueOf(1).equals(li.getQuantity())
                                                                                                && (li.getItemType() == ItemType.OTHER
                                                                                                                || (li.getDescription() != null
                                                                                                                                && li.getDescription().toLowerCase().contains("channel"))));

                if (!hasDoctorFee || !hasChannelingFee) {
                        Bill temp = Bill.builder().lineItems(new ArrayList<>()).build();
                        addBaseFeeLineItems(temp, consultation);
                        for (BillLineItem li : temp.getLineItems()) {
                                if (li.getUnitPrice().compareTo(DOCTOR_FEE) == 0 && !hasDoctorFee) {
                                        li.setBill(bill);
                                        bill.getLineItems().add(li);
                                        hasDoctorFee = true;
                                } else if (li.getUnitPrice().compareTo(CHANNELING_FEE) == 0 && !hasChannelingFee) {
                                        li.setBill(bill);
                                        bill.getLineItems().add(li);
                                        hasChannelingFee = true;
                                }
                        }
                }
        }

        private void addMedicineLineItems(Bill bill, Prescription prescription) {
                for (PrescriptionItem item : prescription.getItems()) {
                        BigDecimal unitPrice = BigDecimal.ZERO;
                        if (item.getInventoryItem() != null && item.getInventoryItem().getSellingPrice() != null) {
                                unitPrice = item.getInventoryItem().getSellingPrice();
                        }
                        BigDecimal totalPrice = unitPrice.multiply(BigDecimal.valueOf(item.getQuantity()));

                        BillLineItem medicineLine =
                                        BillLineItem.builder()
                                                        .bill(bill)
                                                        .description(
                                                                        item.getDrugName()
                                                                                        + " - "
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
        }

        private void addBloodTestLineItem(Bill bill, Consultation consultation) {
                String bloodTestType = consultation.getBloodTestType() != null
                                ? consultation.getBloodTestType().trim()
                                : "BLOOD_TEST";
                BigDecimal bloodTestFee = resolveBloodTestFee(bloodTestType);

                BillLineItem bloodTestLine =
                                BillLineItem.builder()
                                                .bill(bill)
                                                .description("Blood Test - " + bloodTestType)
                                                .itemType(ItemType.PROCEDURE)
                                                .quantity(1)
                                                .unitPrice(bloodTestFee)
                                                .totalPrice(bloodTestFee)
                                                .build();
                bill.getLineItems().add(bloodTestLine);
        }

        private boolean isBloodTestLineItem(BillLineItem lineItem) {
                String description = lineItem.getDescription() != null
                                ? lineItem.getDescription().toLowerCase()
                                : "";
                return lineItem.getItemType() == ItemType.PROCEDURE && description.contains("blood test");
        }

        private BigDecimal resolveBloodTestFee(String bloodTestType) {
                String normalized = bloodTestType == null ? "" : bloodTestType.trim().toUpperCase();
                return switch (normalized) {
                        case "CBC" -> new BigDecimal("800.00");
                        case "FBS" -> new BigDecimal("1300.00");
                        case "CRP" -> new BigDecimal("1200.00");
                        case "LFT" -> new BigDecimal("1500.00");
                        case "RFT" -> new BigDecimal("1500.00");
                        case "LIPID_PROFILE" -> new BigDecimal("1800.00");
                        default -> DEFAULT_BLOOD_TEST_FEE;
                };
        }

        private void recalculateBillTotalsAndStatus(Bill bill) {
                BigDecimal subtotal =
                                bill.getLineItems().stream()
                                                .map(BillLineItem::getTotalPrice)
                                                .reduce(BigDecimal.ZERO, BigDecimal::add);
                BigDecimal taxAmount = subtotal.multiply(TAX_RATE);
                BigDecimal netAmount = subtotal.add(taxAmount);

                bill.setSubtotal(subtotal);
                bill.setTaxAmount(taxAmount);
                bill.setNetAmount(netAmount);

                BigDecimal totalPaid =
                                paymentRepository.findByBillId(bill.getId()).stream()
                                                .map(Payment::getAmount)
                                                .reduce(BigDecimal.ZERO, BigDecimal::add);

                if (bill.getStatus() == BillStatus.REFUNDED) {
                        return;
                }

                if (totalPaid.compareTo(netAmount) >= 0) {
                        bill.setStatus(BillStatus.PAID);
                } else if (totalPaid.compareTo(BigDecimal.ZERO) > 0) {
                        bill.setStatus(BillStatus.PARTIAL);
                } else {
                        bill.setStatus(BillStatus.ISSUED);
                }
        }

    private boolean ensureBookingRefundLineItems(Bill bill, String appointmentConfirmationCode) {
            String code = appointmentConfirmationCode == null ? "" : appointmentConfirmationCode.trim();
            String codeSuffix = code.isBlank() ? "" : " (Appt: " + code + ")";

            boolean hasDoctorRefund =
                            bill.getLineItems().stream()
                                            .anyMatch(
                                                            li ->
                                                                            li.getItemType() == ItemType.CONSULTATION
                                                                                            && li.getUnitPrice() != null
                                                                                            && li.getUnitPrice().compareTo(DOCTOR_FEE.negate()) == 0
                                                                                            && li.getDescription() != null
                                                                                            && li.getDescription().toLowerCase().contains("doctor fee refund"));

            boolean hasChannelRefund =
                            bill.getLineItems().stream()
                                            .anyMatch(
                                                            li ->
                                                                            li.getItemType() == ItemType.OTHER
                                                                                            && li.getUnitPrice() != null
                                                                                            && li.getUnitPrice().compareTo(CHANNELING_FEE.negate()) == 0
                                                                                            && li.getDescription() != null
                                                                                            && li.getDescription().toLowerCase().contains("channeling fee refund"));

            if (!hasDoctorRefund) {
                    bill.getLineItems().add(
                                    BillLineItem.builder()
                                                    .bill(bill)
                                                    .description("Doctor Fee Refund" + codeSuffix)
                                                    .itemType(ItemType.CONSULTATION)
                                                    .quantity(1)
                                                    .unitPrice(DOCTOR_FEE.negate())
                                                    .totalPrice(DOCTOR_FEE.negate())
                                                    .build());
            }

            if (!hasChannelRefund) {
                    bill.getLineItems().add(
                                    BillLineItem.builder()
                                                    .bill(bill)
                                                    .description("Channeling Fee Refund" + codeSuffix)
                                                    .itemType(ItemType.OTHER)
                                                    .quantity(1)
                                                    .unitPrice(CHANNELING_FEE.negate())
                                                    .totalPrice(CHANNELING_FEE.negate())
                                                    .build());
            }

            return !hasDoctorRefund || !hasChannelRefund;
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
