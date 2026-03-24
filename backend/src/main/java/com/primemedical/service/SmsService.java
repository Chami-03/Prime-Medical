package com.primemedical.service;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;
import org.springframework.util.LinkedMultiValueMap;
import org.springframework.util.MultiValueMap;
import org.springframework.web.client.RestClientException;
import org.springframework.web.client.RestTemplate;

import jakarta.annotation.PostConstruct;
import lombok.extern.slf4j.Slf4j;

@Service
@Slf4j
public class SmsService {

    private final boolean notifyEnabled;
    private final String notifyApiUrl;
    private final String notifyApiKey;
    private final String notifySenderId;
    private final String notifyUserId;
    private final String forceDestinationNumber;
    private final RestTemplate restTemplate;

    private static final DateTimeFormatter DATE_FMT =
            DateTimeFormatter.ofPattern("dd MMM yyyy hh:mm a");

    public SmsService(
            @Value("${app.notification.sms.notifylk.enabled:true}")
                boolean notifyEnabled,
            @Value("${app.notification.sms.notifylk.api-url:https://app.notify.lk/api/v1/send}")
                String notifyApiUrl,
            @Value("${app.notification.sms.notifylk.api-key:}")
                String notifyApiKey,
            @Value("${app.notification.sms.notifylk.sender-id:}")
                String notifySenderId,
            @Value("${app.notification.sms.notifylk.user-id:}")
                String notifyUserId,
            @Value("${app.notification.sms.force-destination-number:}")
                    String forceDestinationNumber) {
        this.notifyEnabled = notifyEnabled;
        this.notifyApiUrl = notifyApiUrl;
        this.notifyApiKey = notifyApiKey;
        this.notifySenderId = notifySenderId;
        this.notifyUserId = notifyUserId;
        this.forceDestinationNumber = forceDestinationNumber;
        this.restTemplate = new RestTemplate();
    }

    @PostConstruct
    @SuppressWarnings("unused")
    void logSmsConfigurationStatus() {
        if (!notifyEnabled) {
            log.warn("SMS notifications are disabled by config (app.notification.sms.notifylk.enabled=false).");
            return;
        }

        if (notifyApiKey == null || notifyApiKey.isBlank()) {
            log.warn("Notify.lk API key is missing. SMS notifications are disabled.");
            return;
        }

        if (forceDestinationNumber != null && !forceDestinationNumber.isBlank()) {
            String normalizedForced = normalizePhoneNumber(forceDestinationNumber);
            if (normalizedForced == null) {
                log.warn(
                        "Invalid app.notification.sms.force-destination-number value: {}",
                        forceDestinationNumber);
            } else {
                log.info("SMS trial mode enabled. All messages will be routed to {}", normalizedForced);
            }
        }

        log.info("SMS notifications enabled via Notify.lk");
    }

    @Async("taskExecutor")
    public void sendRegistrationConfirmation(String phoneNumber) {
        sendSms(
                phoneNumber,
                "Prime Medical: Your patient account has been successfully created.",
                "registration");
    }

    @Async("taskExecutor")
    public void sendAppointmentConfirmation(
            String phoneNumber,
            String doctorName,
            LocalDateTime appointmentTime,
            String confirmationCode) {
        String msg =
                String.format(
                        "Prime Medical: Appointment confirmed. Code: %s, Doctor: %s, Time: %s.",
                        safe(confirmationCode), safe(doctorName), formatDate(appointmentTime));
        sendSms(phoneNumber, msg, "appointment-confirmation");
    }

    @Async("taskExecutor")
    public void sendAppointmentReschedule(
            String phoneNumber,
            String doctorName,
            LocalDateTime newTime,
            String confirmationCode) {
        String msg =
                String.format(
                        "Prime Medical: Appointment rescheduled. Code: %s, Doctor: %s, New time: %s.",
                        safe(confirmationCode), safe(doctorName), formatDate(newTime));
        sendSms(phoneNumber, msg, "appointment-reschedule");
    }

    @Async("taskExecutor")
    public void sendAppointmentCancellation(
            String phoneNumber, String confirmationCode, String cancellationReason) {
        String msg =
                String.format(
                        "Prime Medical: Appointment cancelled. Code: %s, Reason: %s.",
                        safe(confirmationCode),
                        (cancellationReason == null || cancellationReason.trim().isEmpty())
                                ? "Not specified"
                                : cancellationReason.trim());
        sendSms(phoneNumber, msg, "appointment-cancellation");
    }

    @Async("taskExecutor")
    public void sendPaymentConfirmation(
            String phoneNumber,
            String invoiceNumber,
            BigDecimal paidAmount,
            BigDecimal balanceDue,
            String billStatus) {
        String msg =
                String.format(
                        "Prime Medical: Payment received. Invoice: %s, Paid: LKR %s, Balance: LKR %s, Status: %s.",
                        safe(invoiceNumber),
                        paidAmount != null ? paidAmount.toPlainString() : "0.00",
                        balanceDue != null ? balanceDue.toPlainString() : "0.00",
                        safe(billStatus));
        sendSms(phoneNumber, msg, "payment-confirmation");
    }

    @Async("taskExecutor")
    public void sendAccountDeletionConfirmation(String phoneNumber, String patientName) {
        String msg =
                String.format(
                        "Prime Medical: %s, your account has been deleted from our system.",
                        safe(patientName));
        sendSms(phoneNumber, msg, "account-deletion");
    }

    private void sendSms(String phoneNumber, String body, String eventName) {
        if (!notifyEnabled) {
            return;
        }

        if (phoneNumber == null || phoneNumber.trim().isEmpty()) {
            return;
        }

        if (body == null || body.trim().isEmpty()) {
            log.warn("Skipping {} SMS because body is empty", eventName);
            return;
        }

        String toNumber = normalizePhoneNumber(phoneNumber);
        if (toNumber == null) {
            log.warn("Skipping {} SMS because phone number is invalid: {}", eventName, phoneNumber);
            return;
        }

        String routedTo = toNumber;
        if (forceDestinationNumber != null && !forceDestinationNumber.isBlank()) {
            String forced = normalizePhoneNumber(forceDestinationNumber);
            if (forced == null) {
                log.warn(
                        "Skipping {} SMS because force-destination-number is invalid: {}",
                        eventName,
                        forceDestinationNumber);
                return;
            }
            routedTo = forced;
            if (!forced.equals(toNumber)) {
                log.info(
                        "Routing {} SMS to verified trial number {} instead of requested {}",
                        eventName,
                        routedTo,
                        toNumber);
            }
        }

        if (notifyApiKey == null || notifyApiKey.isBlank()) {
            log.warn("Notify.lk API key is missing. Skipping {} SMS to {}", eventName, routedTo);
            return;
        }

        try {
            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_FORM_URLENCODED);
            headers.setBearerAuth(notifyApiKey.trim());

            MultiValueMap<String, String> form = new LinkedMultiValueMap<>();
            form.add("to", routedTo);
            form.add("message", body);
            form.add("api_key", notifyApiKey.trim());

            if (notifyUserId != null && !notifyUserId.isBlank()) {
                form.add("user_id", notifyUserId.trim());
            }

            if (notifySenderId != null && !notifySenderId.isBlank()) {
                form.add("sender_id", notifySenderId.trim());
            }

            HttpEntity<MultiValueMap<String, String>> request = new HttpEntity<>(form, headers);
            ResponseEntity<String> response = restTemplate.postForEntity(notifyApiUrl, request, String.class);

            if (response.getStatusCode().is2xxSuccessful()) {
                log.info("{} SMS sent to {} via Notify.lk", eventName, routedTo);
            } else {
                log.error(
                        "Failed to send {} SMS via Notify.lk. status={}, body={}",
                        eventName,
                        response.getStatusCode(),
                        response.getBody());
            }
        } catch (RestClientException e) {
            log.error("Failed to send {} SMS to {} via Notify.lk: {}", eventName, routedTo, e.getMessage(), e);
        }
    }

    private String normalizePhoneNumber(String rawPhone) {
        if (rawPhone == null) {
            return null;
        }

        String cleaned = rawPhone.replaceAll("[^0-9+]", "").trim();
        if (cleaned.isEmpty()) {
            return null;
        }

        if (cleaned.startsWith("00")) {
            cleaned = "+" + cleaned.substring(2);
        }

        if (cleaned.startsWith("0") && cleaned.length() == 10) {
            cleaned = "+94" + cleaned.substring(1);
        }

        if (!cleaned.startsWith("+")) {
            if (cleaned.length() == 9) {
                cleaned = "+94" + cleaned;
            } else {
                cleaned = "+" + cleaned;
            }
        }

        return cleaned.matches("^\\+[1-9]\\d{7,14}$") ? cleaned : null;
    }

    private String formatDate(LocalDateTime dateTime) {
        return dateTime == null ? "N/A" : dateTime.format(DATE_FMT);
    }

    private String safe(String value) {
        return (value == null || value.trim().isEmpty()) ? "N/A" : value.trim();
    }
}
