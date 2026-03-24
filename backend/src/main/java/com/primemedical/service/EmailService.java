package com.primemedical.service;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.List;
import java.util.stream.Collectors;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.MailException;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;

import jakarta.annotation.PostConstruct;
import jakarta.mail.MessagingException;
import jakarta.mail.internet.MimeMessage;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

/** Async email service for notifications. All methods run on the taskExecutor thread pool. */
@Service
@RequiredArgsConstructor
@Slf4j
public class EmailService {

    public record PrescriptionMedicineRow(
            String drugName,
            String dosage,
            String frequency,
            Integer durationDays,
            Integer quantity,
            String instructions) {}

    private final JavaMailSender mailSender;

    @Value("${app.notification.email.from:${spring.mail.username}}")
    private String fromEmail;

    private static final DateTimeFormatter DATE_FMT =
            DateTimeFormatter.ofPattern("EEEE, dd MMMM yyyy 'at' hh:mm a");

    @PostConstruct
    @SuppressWarnings("unused")
    void logEmailConfigurationStatus() {
        if (fromEmail == null || fromEmail.trim().isEmpty()) {
            log.warn("Email sender is not configured (app.notification.email.from / spring.mail.username)");
            return;
        }
        log.info("Email notifications enabled with sender: {}", fromEmail.trim());
    }

    /** Send patient registration confirmation email. */
    @Async("taskExecutor")
    public void sendRegistrationConfirmation(String toEmail, String patientName) {
        if (toEmail == null || toEmail.trim().isEmpty()) {
            return;
        }

        String safeName =
                (patientName == null || patientName.trim().isEmpty()) ? "Patient" : patientName.trim();

        String subject = "Prime Medical – Registration Successful";
        String body =
                String.format(
                        """
                        <html>
                        <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #111827;">
                            <p>Dear %s,</p>
                            <p>Your patient account has been successfully registered in Prime Medical.</p>
                            <p>You can now book appointments and manage your medical records.</p>
                            <p>Thank you.</p>
                        </body>
                        </html>
                        """,
                        safeName);

        sendHtmlEmail(toEmail.trim(), subject, body);
    }

    /** Send appointment confirmation email. */
    @Async("taskExecutor")
    public void sendAppointmentConfirmation(
            String toEmail,
            String patientName,
            String doctorName,
            LocalDateTime dateTime,
            String confirmationCode) {
        String subject = "Appointment Confirmed — " + confirmationCode;
        String body =
                String.format(
                        """
                        <html>
                        <body style="font-family: Arial, sans-serif;">
                            <h2 style="color: #2563eb;">Appointment Confirmed ✓</h2>
                            <p>Dear <strong>%s</strong>,</p>
                            <p>Your appointment has been confirmed with the following details:</p>
                            <table style="border-collapse: collapse; margin: 16px 0;">
                                <tr><td style="padding: 8px; font-weight: bold;">Confirmation Code:</td><td style="padding: 8px;">%s</td></tr>
                                <tr><td style="padding: 8px; font-weight: bold;">Doctor:</td><td style="padding: 8px;">%s</td></tr>
                                <tr><td style="padding: 8px; font-weight: bold;">Date & Time:</td><td style="padding: 8px;">%s</td></tr>
                            </table>
                            <p>Please arrive 15 minutes before your appointment time.</p>
                            <p>Best regards,<br/><strong>Prime Medical Team</strong></p>
                        </body>
                        </html>
                        """,
                        patientName, confirmationCode, doctorName, dateTime.format(DATE_FMT));

        sendHtmlEmail(toEmail, subject, body);
    }

    /** Send appointment cancellation email. */
    @Async("taskExecutor")
    public void sendAppointmentCancellation(
            String toEmail, String patientName, String confirmationCode, String reason) {
        String subject = "Appointment Cancelled — " + confirmationCode;
        String body =
                String.format(
                        """
                <html>
                <body style="font-family: Arial, sans-serif;">
                    <h2 style="color: #dc2626;">Appointment Cancelled</h2>
                    <p>Dear <strong>%s</strong>,</p>
                    <p>Your appointment <strong>%s</strong> has been cancelled.</p>
                    <p><strong>Reason:</strong> %s</p>
                    <p>If you need to reschedule, please contact our reception desk or book online.</p>
                    <p>Best regards,<br/><strong>Prime Medical Team</strong></p>
                </body>
                </html>
                """,
                        patientName, confirmationCode, reason != null ? reason : "Not specified");

        sendHtmlEmail(toEmail, subject, body);
    }

    /** Send appointment reschedule email. */
    @Async("taskExecutor")
    public void sendAppointmentReschedule(
            String toEmail,
            String patientName,
            String doctorName,
            LocalDateTime newDateTime,
            String confirmationCode) {
        String subject = "Appointment Rescheduled — " + confirmationCode;
        String body =
                String.format(
                        """
                        <html>
                        <body style="font-family: Arial, sans-serif;">
                            <h2 style="color: #2563eb;">Appointment Rescheduled</h2>
                            <p>Dear <strong>%s</strong>,</p>
                            <p>Your appointment has been successfully rescheduled to a new time:</p>
                            <table style="border-collapse: collapse; margin: 16px 0;">
                                <tr><td style="padding: 8px; font-weight: bold;">Confirmation Code:</td><td style="padding: 8px;">%s</td></tr>
                                <tr><td style="padding: 8px; font-weight: bold;">Doctor:</td><td style="padding: 8px;">%s</td></tr>
                                <tr><td style="padding: 8px; font-weight: bold;">New Date & Time:</td><td style="padding: 8px;">%s</td></tr>
                            </table>
                            <p>Please arrive 15 minutes before your new appointment time.</p>
                            <p>Best regards,<br/><strong>Prime Medical Team</strong></p>
                        </body>
                        </html>
                        """,
                        patientName, confirmationCode, doctorName, newDateTime.format(DATE_FMT));

        sendHtmlEmail(toEmail, subject, body);
    }

    /** Send password reset email with a link. */
    @Async("taskExecutor")
    public void sendPasswordResetEmail(String toEmail, String resetLink) {
        String subject = "Password Reset Request — Prime Medical";
        String body =
                String.format(
                        """
                <html>
                <body style="font-family: Arial, sans-serif;">
                    <h2 style="color: #2563eb;">Password Reset</h2>
                    <p>You have requested to reset your password.</p>
                    <p>Click the button below to set a new password:</p>
                    <p style="margin: 24px 0;">
                        <a href="%s" style="background-color: #2563eb; color: white; padding: 12px 24px;
                           text-decoration: none; border-radius: 6px; font-weight: bold;">
                           Reset Password
                        </a>
                    </p>
                    <p style="color: #666;">This link will expire in 30 minutes.</p>
                    <p>If you did not request this, please ignore this email.</p>
                    <p>Best regards,<br/><strong>Prime Medical Team</strong></p>
                </body>
                </html>
                """,
                        resetLink);

        sendHtmlEmail(toEmail, subject, body);
    }

    /** Send prescription update notification email. */
    @Async("taskExecutor")
    public void sendPrescriptionCreatedEmail(
            String toEmail,
            String patientName,
            Long prescriptionId,
            List<PrescriptionMedicineRow> createdItems) {
        if (toEmail == null || toEmail.trim().isEmpty()) {
            return;
        }

        String safeName =
                (patientName == null || patientName.trim().isEmpty()) ? "Patient" : patientName.trim();
        String subject = "New Prescription Created - PrimeMedical";

        int itemCount = createdItems != null ? createdItems.size() : 0;
        log.info("Preparing created-prescription email for {} with {} medicine rows", toEmail, itemCount);

        String medicineRows = buildMedicineRows(createdItems);
        String body =
                String.format(
                        """
                        <html>
                        <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #111827;">
                            <p>Dear <strong>%s</strong>,</p>
                            <p>Your doctor has created a new prescription for you.</p>
                            <p><strong>Prescription ID:</strong> %d</p>
                            <p>Prescribed medicine details:</p>
                            <table style="border-collapse:collapse;width:100%%;margin:10px 0;font-size:13px;">
                                <thead>
                                    <tr style="background:#f3f4f6;">
                                        <th style="padding:8px;border:1px solid #d1d5db;text-align:left;">Medicine</th>
                                        <th style="padding:8px;border:1px solid #d1d5db;text-align:left;">Dosage</th>
                                        <th style="padding:8px;border:1px solid #d1d5db;text-align:left;">Frequency</th>
                                        <th style="padding:8px;border:1px solid #d1d5db;text-align:center;">Days</th>
                                        <th style="padding:8px;border:1px solid #d1d5db;text-align:center;">Qty</th>
                                        <th style="padding:8px;border:1px solid #d1d5db;text-align:left;">Instructions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    %s
                                </tbody>
                            </table>
                            <p>Please review your medication instructions in Prime Medical.</p>
                            <p>Thank you.</p>
                        </body>
                        </html>
                        """,
                        safeName,
                        prescriptionId,
                        medicineRows);

        sendHtmlEmail(toEmail.trim(), subject, body);
    }

    /** Send prescription update notification email. */
    @Async("taskExecutor")
    public void sendPrescriptionUpdatedEmail(
            String toEmail,
            String patientName,
            Long prescriptionId,
            List<PrescriptionMedicineRow> updatedItems) {
        if (toEmail == null || toEmail.trim().isEmpty()) {
            return;
        }

        String safeName =
                (patientName == null || patientName.trim().isEmpty()) ? "Patient" : patientName.trim();
        String subject = "Prescription Updated — PrimeMedical";

        String medicineRows = buildMedicineRows(updatedItems);

        String body =
                String.format(
                        """
                        <html>
                        <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #111827;">
                            <p>Dear <strong>%s</strong>,</p>
                            <p>Your prescription has been updated by your doctor.</p>
                            <p><strong>Prescription ID:</strong> %d</p>
                            <p>Updated medicine details:</p>
                            <table style="border-collapse:collapse;width:100%%;margin:10px 0;font-size:13px;">
                                <thead>
                                    <tr style="background:#f3f4f6;">
                                        <th style="padding:8px;border:1px solid #d1d5db;text-align:left;">Medicine</th>
                                        <th style="padding:8px;border:1px solid #d1d5db;text-align:left;">Dosage</th>
                                        <th style="padding:8px;border:1px solid #d1d5db;text-align:left;">Frequency</th>
                                        <th style="padding:8px;border:1px solid #d1d5db;text-align:center;">Days</th>
                                        <th style="padding:8px;border:1px solid #d1d5db;text-align:center;">Qty</th>
                                        <th style="padding:8px;border:1px solid #d1d5db;text-align:left;">Instructions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    %s
                                </tbody>
                            </table>
                            <p>Please review these updated medication instructions in Prime Medical.</p>
                            <p>Thank you.</p>
                        </body>
                        </html>
                        """,
                        safeName,
                        prescriptionId,
                        medicineRows);

        sendHtmlEmail(toEmail.trim(), subject, body);
    }

    private String buildMedicineRows(List<PrescriptionMedicineRow> items) {
        String medicineRows =
                (items == null ? List.<PrescriptionMedicineRow>of() : items).stream()
                        .map(
                                item -> {
                                    String drug = escapeHtml(item.drugName());
                                    String dosage = escapeHtml(item.dosage());
                                    String frequency = escapeHtml(item.frequency());
                                    String duration =
                                            item.durationDays() != null
                                                    ? item.durationDays().toString()
                                                    : "-";
                                    String quantity =
                                            item.quantity() != null
                                                    ? item.quantity().toString()
                                                    : "-";
                                    String instructions = escapeHtml(item.instructions());

                                    return String.format(
                                            """
                                            <tr>
                                                <td style=\"padding:8px;border:1px solid #d1d5db;\">%s</td>
                                                <td style=\"padding:8px;border:1px solid #d1d5db;\">%s</td>
                                                <td style=\"padding:8px;border:1px solid #d1d5db;\">%s</td>
                                                <td style=\"padding:8px;border:1px solid #d1d5db;text-align:center;\">%s</td>
                                                <td style=\"padding:8px;border:1px solid #d1d5db;text-align:center;\">%s</td>
                                                <td style=\"padding:8px;border:1px solid #d1d5db;\">%s</td>
                                            </tr>
                                            """,
                                            drug,
                                            dosage,
                                            frequency,
                                            duration,
                                            quantity,
                                            instructions);
                                })
                        .collect(Collectors.joining());

        if (medicineRows.isBlank()) {
            medicineRows =
                    """
                    <tr>
                        <td colspan=\"6\" style=\"padding:8px;border:1px solid #d1d5db;text-align:center;color:#6b7280;\">No medicine items provided.</td>
                    </tr>
                    """;
        }

        return medicineRows;
    }

    /** Send payment confirmation email. */
    @Async("taskExecutor")
    public void sendPaymentConfirmationEmail(
            String toEmail,
            String patientName,
            String invoiceNumber,
            BigDecimal paidAmount,
            BigDecimal totalPaid,
            BigDecimal balanceDue,
            String billStatus) {
        if (toEmail == null || toEmail.trim().isEmpty()) {
            return;
        }

        String safeName =
                (patientName == null || patientName.trim().isEmpty()) ? "Patient" : patientName.trim();
        String subject = "Payment Received — " + invoiceNumber;
        String body =
                String.format(
                        """
                        <html>
                        <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #111827;">
                            <p>Dear <strong>%s</strong>,</p>
                            <p>We have received your payment successfully.</p>
                            <table style="border-collapse: collapse; margin: 12px 0;">
                                <tr><td style="padding: 6px 10px; font-weight: bold;">Invoice:</td><td style="padding: 6px 10px;">%s</td></tr>
                                <tr><td style="padding: 6px 10px; font-weight: bold;">Paid Amount:</td><td style="padding: 6px 10px;">LKR %s</td></tr>
                                <tr><td style="padding: 6px 10px; font-weight: bold;">Total Paid:</td><td style="padding: 6px 10px;">LKR %s</td></tr>
                                <tr><td style="padding: 6px 10px; font-weight: bold;">Balance Due:</td><td style="padding: 6px 10px;">LKR %s</td></tr>
                                <tr><td style="padding: 6px 10px; font-weight: bold;">Bill Status:</td><td style="padding: 6px 10px;">%s</td></tr>
                            </table>
                            <p>Thank you for choosing Prime Medical.</p>
                        </body>
                        </html>
                        """,
                        safeName,
                        invoiceNumber,
                        paidAmount,
                        totalPaid,
                        balanceDue,
                        billStatus);

        sendHtmlEmail(toEmail.trim(), subject, body);
    }

    /** Send account deletion confirmation email. */
    @Async("taskExecutor")
    public void sendAccountDeletionConfirmationEmail(String toEmail, String patientName) {
        if (toEmail == null || toEmail.trim().isEmpty()) {
            return;
        }

        String safeName =
                (patientName == null || patientName.trim().isEmpty()) ? "Patient" : patientName.trim();
        String subject = "Account Deleted — Prime Medical";
        String body =
                String.format(
                        """
                        <html>
                        <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #111827;">
                            <p>Dear <strong>%s</strong>,</p>
                            <p>Your Prime Medical account has been permanently deleted as requested.</p>
                            <p>If this was unexpected, please contact support immediately.</p>
                            <p>Thank you.</p>
                        </body>
                        </html>
                        """,
                        safeName);

        sendHtmlEmail(toEmail.trim(), subject, body);
    }

    // ── Private helper ───────────────────────────────────────────

    private void sendHtmlEmail(String to, String subject, String htmlBody) {
        if (to == null || to.trim().isEmpty()) {
            log.warn("Skipping email send because recipient is empty. Subject: {}", subject);
            return;
        }

        String resolvedFrom =
                (fromEmail == null || fromEmail.trim().isEmpty()) ? null : fromEmail.trim();
        if (resolvedFrom == null) {
            log.warn("Skipping email send because sender address is not configured. To: {}", to);
            return;
        }

        try {
            MimeMessage message = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(message, true, "UTF-8");
            helper.setFrom(resolvedFrom);
            helper.setTo(to.trim());
            helper.setSubject(subject);
            helper.setText(htmlBody, true);
            mailSender.send(message);
            log.info("Email sent to: {} - Subject: {}", to, subject);
        } catch (MessagingException | MailException e) {
            log.error("Unexpected failure while sending email to {}: {}", to, e.getMessage(), e);
        }
    }

    private String escapeHtml(String value) {
        if (value == null || value.isBlank()) {
            return "-";
        }
        return value
                .replace("&", "&amp;")
                .replace("<", "&lt;")
                .replace(">", "&gt;")
                .replace("\"", "&quot;")
                .replace("'", "&#39;");
    }
}
