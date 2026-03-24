package com.primemedical.service;

import java.io.IOException;
import java.math.BigDecimal;
import java.net.URI;
import java.net.URLEncoder;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.nio.charset.StandardCharsets;
import java.time.Duration;
import java.time.LocalDate;
import java.time.YearMonth;
import java.util.ArrayList;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Set;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.primemedical.dto.request.AssistantChatRequest;
import com.primemedical.entity.Appointment;
import com.primemedical.entity.Bill;
import com.primemedical.entity.InventoryItem;
import com.primemedical.entity.Payment;
import com.primemedical.enums.AppointmentStatus;
import com.primemedical.enums.BillStatus;
import com.primemedical.enums.QueueStatus;
import com.primemedical.exception.BadRequestException;
import com.primemedical.repository.AppointmentRepository;
import com.primemedical.repository.BillRepository;
import com.primemedical.repository.InventoryItemRepository;
import com.primemedical.repository.PatientRepository;
import com.primemedical.repository.PaymentRepository;
import com.primemedical.repository.QueueEntryRepository;
import com.primemedical.repository.StaffProfileRepository;
import com.primemedical.repository.SupplierRepository;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

@Service
@RequiredArgsConstructor
@Slf4j
public class AssistantService {

    private final ObjectMapper objectMapper;
    private final AppointmentRepository appointmentRepository;
    private final PatientRepository patientRepository;
    private final QueueEntryRepository queueEntryRepository;
    private final BillRepository billRepository;
    private final PaymentRepository paymentRepository;
    private final InventoryItemRepository inventoryItemRepository;
    private final SupplierRepository supplierRepository;
    private final StaffProfileRepository staffProfileRepository;

    @Value("${app.ai.provider:auto}")
    private String provider;

    @Value("${app.ai.api-url:https://api.openai.com/v1/chat/completions}")
    private String apiUrl;

    @Value("${app.ai.model:gpt-4o-mini}")
    private String model;

    @Value("${app.ai.api-key:}")
    private String apiKey;

    private static final String SYSTEM_PROMPT =
            "You are Prime Medical AI Assistant. "
                    + "You help with Prime Medical services, appointments, patient registration, billing, inventory, and general clinic workflows. "
                    + "Reply clearly and concisely. "
                    + "If a medical emergency is mentioned, advise contacting emergency services immediately. "
                    + "Do not invent unavailable policies; if unsure, say what you know and suggest contacting reception.";

    private static final Set<AppointmentStatus> ACTIVE_APPOINTMENT_STATUSES =
            Set.of(
                    AppointmentStatus.PENDING,
                    AppointmentStatus.CONFIRMED,
                    AppointmentStatus.CHECKED_IN,
                    AppointmentStatus.IN_CONSULTATION);

    public String generateReply(AssistantChatRequest request) {
        String userMessage = request.getMessage() != null ? request.getMessage().trim() : "";
        if (userMessage.isEmpty()) {
            throw new BadRequestException("Message is required");
        }

        String mode = resolveProviderMode();

        return switch (mode) {
            case "gemini" -> generateGeminiReply(request, userMessage);
            case "openai" -> generateOpenAiReply(request, userMessage);
            case "local" -> generateDataDrivenReply(userMessage);
            default -> generateDataDrivenReply(userMessage);
        };
    }

    private String resolveProviderMode() {
        String configured = provider == null ? "" : provider.trim().toLowerCase(Locale.ROOT);
        boolean hasKey = apiKey != null && !apiKey.isBlank();

        if (configured.isBlank() || "auto".equals(configured)) {
            if (hasKey && looksLikeGeminiKey(apiKey)) {
                return "gemini";
            }
            if (hasKey) {
                return "openai";
            }
            return "local";
        }

        if ("local".equals(configured) && hasKey) {
            // User asked for real conversation; prefer external provider when key exists.
            if (looksLikeGeminiKey(apiKey)) {
                return "gemini";
            }
            return "openai";
        }

        return configured;
    }

    private String generateOpenAiReply(AssistantChatRequest request, String userMessage) {
        if (apiKey == null || apiKey.isBlank()) {
            return generateDataDrivenReply(userMessage);
        }

        try {
            DashboardSnapshot snapshot = buildSnapshot();
            String liveContext = buildContextForModel(snapshot);
            List<Map<String, String>> messages = new ArrayList<>();
            messages.add(Map.of("role", "system", "content", SYSTEM_PROMPT));
            messages.add(
                    Map.of(
                            "role",
                            "system",
                            "content",
                            "Use the live system context below for all numeric claims. "
                                    + "If data is missing, clearly say you are not sure and ask a clarifying question.\n"
                                    + liveContext));

            if (request.getHistory() != null) {
                request.getHistory().stream().limit(10).forEach(item -> {
                    String role = normalizeRole(item.getRole());
                    String content = item.getContent() != null ? item.getContent().trim() : "";
                    if (!content.isEmpty()) {
                        messages.add(Map.of("role", role, "content", content));
                    }
                });
            }

            messages.add(Map.of("role", "user", "content", userMessage));

            String body = objectMapper.writeValueAsString(Map.of(
                    "model", model,
                    "temperature", 0.4,
                    "messages", messages));

            HttpRequest httpRequest = HttpRequest.newBuilder(URI.create(apiUrl))
                    .timeout(Duration.ofSeconds(30))
                    .header("Content-Type", "application/json")
                    .header("Authorization", "Bearer " + apiKey.trim())
                    .POST(HttpRequest.BodyPublishers.ofString(body))
                    .build();

            HttpResponse<String> response = HttpClient.newHttpClient().send(httpRequest, HttpResponse.BodyHandlers.ofString());

            if (response.statusCode() < 200 || response.statusCode() >= 300) {
                log.error("OpenAI provider error {}: {}", response.statusCode(), response.body());
                return generateDataDrivenReply(userMessage);
            }

            JsonNode root = objectMapper.readTree(response.body());
            String reply = root.path("choices").path(0).path("message").path("content").asText("").trim();
            return reply.isEmpty() ? generateDataDrivenReply(userMessage) : reply;
        } catch (IOException | InterruptedException e) {
            if (e instanceof InterruptedException) {
                Thread.currentThread().interrupt();
            }
            log.error("Failed to call OpenAI provider", e);
            return generateDataDrivenReply(userMessage);
        }
    }

    private String generateGeminiReply(AssistantChatRequest request, String userMessage) {
        if (apiKey == null || apiKey.isBlank()) {
            return generateDataDrivenReply(userMessage);
        }

        try {
            DashboardSnapshot snapshot = buildSnapshot();
            String liveContext = buildContextForModel(snapshot);
            List<Map<String, Object>> contents = new ArrayList<>();
            if (request.getHistory() != null) {
                request.getHistory().stream().limit(10).forEach(item -> {
                    String role = normalizeRole(item.getRole());
                    String content = item.getContent() != null ? item.getContent().trim() : "";
                    if (content.isEmpty()) {
                        return;
                    }
                    String geminiRole = "assistant".equals(role) ? "model" : "user";
                    contents.add(Map.of("role", geminiRole, "parts", List.of(Map.of("text", content))));
                });
            }

            contents.add(Map.of("role", "user", "parts", List.of(Map.of("text", userMessage))));

            String body = objectMapper.writeValueAsString(Map.of(
                    "systemInstruction", Map.of("parts", List.of(Map.of("text", SYSTEM_PROMPT
                        + " Use the live system context below for all numeric claims. "
                        + "If data is missing, clearly say you are not sure and ask a clarifying question.\n"
                        + liveContext))),
                    "contents", contents,
                    "generationConfig", Map.of("temperature", 0.4)));

            String keyParam = URLEncoder.encode(apiKey.trim(), StandardCharsets.UTF_8);
            String finalUrl = apiUrl.contains("?") ? apiUrl + "&key=" + keyParam : apiUrl + "?key=" + keyParam;

            HttpRequest httpRequest = HttpRequest.newBuilder(URI.create(finalUrl))
                    .timeout(Duration.ofSeconds(30))
                    .header("Content-Type", "application/json")
                    .POST(HttpRequest.BodyPublishers.ofString(body))
                    .build();

            HttpResponse<String> response = HttpClient.newHttpClient().send(httpRequest, HttpResponse.BodyHandlers.ofString());

            if (response.statusCode() < 200 || response.statusCode() >= 300) {
                log.error("Gemini provider error {}: {}", response.statusCode(), response.body());
                return generateDataDrivenReply(userMessage);
            }

            JsonNode root = objectMapper.readTree(response.body());
            String reply = root.path("candidates").path(0).path("content").path("parts").path(0).path("text").asText("").trim();
            return reply.isEmpty() ? generateDataDrivenReply(userMessage) : reply;
        } catch (Exception e) {
            log.error("Failed to call Gemini provider", e);
            return generateDataDrivenReply(userMessage);
        }
    }

    private String generateDataDrivenReply(String userMessage) {
        DashboardSnapshot s = buildSnapshot();
        String query = userMessage.toLowerCase(Locale.ROOT);

        if (containsAny(query, "hi", "hello", "hey", "good morning", "good evening")) {
            return "Hello. I can help with appointments, queue, billing, inventory, and patient workflow questions.";
        }

        if (containsAny(query, "thanks", "thank you")) {
            return "You are welcome. Ask me anything about Prime Medical operations.";
        }

        if (containsAny(query, "q&a", "qa", "questions and answers", "generate questions", "sample questions")) {
            return buildGeneratedQnA(s);
        }

        if (containsAny(query, "summary", "overview", "dashboard status", "system status")) {
            return "Prime Medical summary: patients " + s.totalPatients
                    + ", appointments today " + s.todayAppointments
                    + ", queue today " + s.queueToday
                    + ", billed this month LKR " + formatMoney(s.billedThisMonth)
                    + ", paid LKR " + formatMoney(s.paidThisMonth)
                    + ", inventory active " + s.inventoryActive + ".";
        }

        if (containsAny(query, "appointment", "appointments", "booking", "calendar")) {
            return "Appointments today: " + s.todayAppointments
                    + ". Confirmed: " + s.todayConfirmed
                    + ", Active: " + s.todayActive
                    + ", Completed: " + s.todayCompleted
                    + ", Cancelled: " + s.todayCancelled + ".";
        }

        if (containsAny(query, "patient", "patients", "registration")) {
            return "Patients registered: " + s.totalPatients
                    + ". Today's appointments: " + s.todayAppointments
                    + ", Queue today: " + s.queueToday + ".";
        }

        if (containsAny(query, "queue", "waiting", "check in", "check-in")) {
            return "Queue today: total " + s.queueToday
                    + ", waiting " + s.queueWaiting
                    + ", in consultation " + s.queueInConsultation
                    + ", completed " + s.queueCompleted + ".";
        }

        if (containsAny(query, "billing", "bill", "payment", "revenue", "income")) {
            return "Billing this month: billed LKR " + formatMoney(s.billedThisMonth)
                    + ", paid LKR " + formatMoney(s.paidThisMonth)
                    + ", total bills " + s.totalBills + ".";
        }

        if (containsAny(query, "inventory", "stock", "medicine", "supplier", "pharmacy")) {
            return "Inventory: active items " + s.inventoryActive
                    + ", low stock " + s.inventoryLowStock
                    + ", expiring in 30 days " + s.expiringIn30Days
                    + ", suppliers " + s.totalSuppliers + ".";
        }

        return "I can answer Prime Medical questions. Please ask a specific question, for example: 'How many appointments today?' or 'Show billing summary this month'.";
    }

    private DashboardSnapshot buildSnapshot() {
        LocalDate today = LocalDate.now();
        LocalDate monthStart = YearMonth.now().atDay(1);

        List<Appointment> appointments = appointmentRepository.findAll();
        long todayAppointments = appointments.stream().filter(a -> isSameDate(a.getAppointmentTime(), today)).count();
        long todayConfirmed = appointments.stream().filter(a -> isSameDate(a.getAppointmentTime(), today)).filter(a -> a.getStatus() == AppointmentStatus.CONFIRMED).count();
        long todayCompleted = appointments.stream().filter(a -> isSameDate(a.getAppointmentTime(), today)).filter(a -> a.getStatus() == AppointmentStatus.COMPLETED).count();
        long todayCancelled = appointments.stream().filter(a -> isSameDate(a.getAppointmentTime(), today)).filter(a -> a.getStatus() == AppointmentStatus.CANCELLED).count();
        long todayActive = appointments.stream().filter(a -> isSameDate(a.getAppointmentTime(), today)).filter(a -> ACTIVE_APPOINTMENT_STATUSES.contains(a.getStatus())).count();

        long queueToday = queueEntryRepository.countByQueueDate(today);
        long queueWaiting = queueEntryRepository.findByQueueDateAndStatus(today, QueueStatus.WAITING).size()
                + queueEntryRepository.findByQueueDateAndStatus(today, QueueStatus.VITALS_PENDING).size()
                + queueEntryRepository.findByQueueDateAndStatus(today, QueueStatus.READY).size();
        long queueInConsultation = queueEntryRepository.findByQueueDateAndStatus(today, QueueStatus.IN_CONSULTATION).size();
        long queueCompleted = queueEntryRepository.findByQueueDateAndStatus(today, QueueStatus.COMPLETED).size();

        List<Bill> bills = billRepository.findAll();
        BigDecimal billedThisMonth = bills.stream()
                .filter(b -> b.getCreatedAt() != null && !b.getCreatedAt().toLocalDate().isBefore(monthStart))
                .filter(b -> b.getStatus() != BillStatus.DRAFT)
                .map(Bill::getNetAmount)
                .filter(v -> v != null)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        List<Payment> payments = paymentRepository.findAll();
        BigDecimal paidThisMonth = payments.stream()
                .filter(p -> p.getPaidAt() != null && !p.getPaidAt().toLocalDate().isBefore(monthStart))
                .map(Payment::getAmount)
                .filter(v -> v != null)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        List<InventoryItem> activeItems = inventoryItemRepository.findByIsArchivedFalse();
        long lowStock = activeItems.stream()
                .filter(i -> i.getQuantity() != null)
                .filter(i -> {
                    Integer thresholdValue = i.getLowStockThreshold();
                    int threshold = thresholdValue != null ? thresholdValue : 10;
                    return i.getQuantity() <= threshold;
                })
                .count();
        long expiringIn30Days = inventoryItemRepository.findByExpiryDateBetween(today, today.plusDays(30)).size();

        return new DashboardSnapshot(
                patientRepository.count(),
                todayAppointments,
                todayConfirmed,
                todayCompleted,
                todayCancelled,
                todayActive,
                queueToday,
                queueWaiting,
                queueInConsultation,
                queueCompleted,
                bills.size(),
                billedThisMonth,
                paidThisMonth,
                activeItems.size(),
                lowStock,
                expiringIn30Days,
                supplierRepository.count(),
                staffProfileRepository.count());
    }

    private String buildGeneratedQnA(DashboardSnapshot s) {
        return "Generated Q&A from current system data:\n"
                + "Q1: How many patients are registered?\n"
                + "A1: There are " + s.totalPatients + " registered patients.\n\n"
                + "Q2: How many appointments are scheduled for today?\n"
                + "A2: Today has " + s.todayAppointments + " appointments (" + s.todayConfirmed + " confirmed).\n\n"
                + "Q3: What is the queue status right now?\n"
                + "A3: Queue total " + s.queueToday + ", waiting " + s.queueWaiting + ", in consultation " + s.queueInConsultation + ", completed " + s.queueCompleted + ".\n\n"
                + "Q4: What is this month billing summary?\n"
                + "A4: Billed LKR " + formatMoney(s.billedThisMonth) + ", paid LKR " + formatMoney(s.paidThisMonth) + ".\n\n"
                + "Q5: Are there any inventory risks?\n"
                + "A5: Active items " + s.inventoryActive + ", low-stock items " + s.inventoryLowStock + ", items expiring in 30 days " + s.expiringIn30Days + ".\n\n"
                + "Q6: How many staff and suppliers are in the system?\n"
                + "A6: Staff profiles " + s.totalStaffProfiles + ", suppliers " + s.totalSuppliers + ".";
    }

    private boolean containsAny(String text, String... keys) {
        for (String key : keys) {
            if (text.contains(key)) {
                return true;
            }
        }
        return false;
    }

    private boolean isSameDate(java.time.LocalDateTime dateTime, LocalDate date) {
        return dateTime != null && dateTime.toLocalDate().isEqual(date);
    }

    private String formatMoney(BigDecimal value) {
        return value == null ? "0.00" : value.setScale(2, java.math.RoundingMode.HALF_UP).toPlainString();
    }

    private String buildContextForModel(DashboardSnapshot s) {
        return "Live Prime Medical context (verified):\n"
                + "- Total patients: "
                + s.totalPatients
                + "\n"
                + "- Appointments today: "
                + s.todayAppointments
                + " (confirmed "
                + s.todayConfirmed
                + ", active "
                + s.todayActive
                + ", completed "
                + s.todayCompleted
                + ", cancelled "
                + s.todayCancelled
                + ")\n"
                + "- Queue today: "
                + s.queueToday
                + " (waiting "
                + s.queueWaiting
                + ", in consultation "
                + s.queueInConsultation
                + ", completed "
                + s.queueCompleted
                + ")\n"
                + "- Billing this month: billed LKR "
                + formatMoney(s.billedThisMonth)
                + ", paid LKR "
                + formatMoney(s.paidThisMonth)
                + ", bills "
                + s.totalBills
                + "\n"
                + "- Inventory: active "
                + s.inventoryActive
                + ", low stock "
                + s.inventoryLowStock
                + ", expiring within 30 days "
                + s.expiringIn30Days
                + ", suppliers "
                + s.totalSuppliers
                + "\n"
                + "- Staff profiles: "
                + s.totalStaffProfiles
                + "\n";
    }

    private boolean looksLikeGeminiKey(String key) {
        String trimmed = key == null ? "" : key.trim();
        return trimmed.startsWith("AIza");
    }

    private String normalizeRole(String role) {
        String normalized = role == null ? "" : role.trim().toLowerCase(Locale.ROOT);
        if ("assistant".equals(normalized) || "user".equals(normalized) || "system".equals(normalized)) {
            return normalized;
        }
        return "user";
    }

    private record DashboardSnapshot(
            long totalPatients,
            long todayAppointments,
            long todayConfirmed,
            long todayCompleted,
            long todayCancelled,
            long todayActive,
            long queueToday,
            long queueWaiting,
            long queueInConsultation,
            long queueCompleted,
            long totalBills,
            BigDecimal billedThisMonth,
            BigDecimal paidThisMonth,
            long inventoryActive,
            long inventoryLowStock,
            long expiringIn30Days,
            long totalSuppliers,
            long totalStaffProfiles) {}
}
