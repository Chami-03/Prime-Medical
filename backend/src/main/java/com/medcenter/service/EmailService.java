package com.medcenter.service;

import jakarta.mail.MessagingException;
import jakarta.mail.internet.MimeMessage;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;

/** Async email service for notifications. All methods run on the taskExecutor thread pool. */
@Service
@RequiredArgsConstructor
@Slf4j
public class EmailService {

    private final JavaMailSender mailSender;

    private static final String FROM_EMAIL = "noreply@primemedical.lk";
    private static final DateTimeFormatter DATE_FMT =
            DateTimeFormatter.ofPattern("EEEE, dd MMMM yyyy 'at' hh:mm a");

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
                            <p>Best regards,<br/><strong>PrimeMedical Team</strong></p>
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
                    <p>Best regards,<br/><strong>PrimeMedical Team</strong></p>
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
                            <p>Best regards,<br/><strong>PrimeMedical Team</strong></p>
                        </body>
                        </html>
                        """,
                        patientName, confirmationCode, doctorName, newDateTime.format(DATE_FMT));

        sendHtmlEmail(toEmail, subject, body);
    }

    /** Send password reset email with a link. */
    @Async("taskExecutor")
    public void sendPasswordResetEmail(String toEmail, String resetLink) {
        String subject = "Password Reset Request — PrimeMedical";
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
                    <p>Best regards,<br/><strong>PrimeMedical Team</strong></p>
                </body>
                </html>
                """,
                        resetLink);

        sendHtmlEmail(toEmail, subject, body);
    }

    // ── Private helper ───────────────────────────────────────────

    private void sendHtmlEmail(String to, String subject, String htmlBody) {
        try {
            MimeMessage message = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(message, true, "UTF-8");
            helper.setFrom(FROM_EMAIL);
            helper.setTo(to);
            helper.setSubject(subject);
            helper.setText(htmlBody, true);
            mailSender.send(message);
            log.info("Email sent to: {} — Subject: {}", to, subject);
        } catch (MessagingException e) {
            log.error("Failed to send email to {}: {}", to, e.getMessage());
        }
    }
}
