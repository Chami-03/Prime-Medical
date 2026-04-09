package com.primemedical.service;

import java.io.IOException;
import java.time.Instant;
import java.util.List;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.CopyOnWriteArrayList;

import org.springframework.http.MediaType;
import org.springframework.stereotype.Service;
import org.springframework.web.servlet.mvc.method.annotation.SseEmitter;

import lombok.extern.slf4j.Slf4j;

@Service
@Slf4j
public class ConsultationEventStreamService {

    private static final Long EMITTER_TIMEOUT_MS = 30 * 60 * 1000L;

    private final Map<Long, List<SseEmitter>> emittersByConsultation = new ConcurrentHashMap<>();

    public SseEmitter subscribe(Long consultationId) {
        SseEmitter emitter = new SseEmitter(EMITTER_TIMEOUT_MS);

        emittersByConsultation
                .computeIfAbsent(consultationId, key -> new CopyOnWriteArrayList<>())
                .add(emitter);

        emitter.onCompletion(() -> removeEmitter(consultationId, emitter));
        emitter.onTimeout(() -> removeEmitter(consultationId, emitter));
        emitter.onError((ex) -> removeEmitter(consultationId, emitter));

        sendEventSafely(
                consultationId,
                emitter,
                SseEmitter.event()
                        .name("connected")
                        .data(
                                Map.of(
                                        "consultationId", consultationId,
                                        "timestamp", Instant.now().toString()),
                                MediaType.APPLICATION_JSON));

        return emitter;
    }

    public void publishVitalsUpdated(Long consultationId) {
        List<SseEmitter> emitters = emittersByConsultation.get(consultationId);
        if (emitters == null || emitters.isEmpty()) {
            return;
        }

        SseEmitter.SseEventBuilder event =
                SseEmitter.event()
                        .name("vitals-updated")
                        .data(
                                Map.of(
                                        "consultationId", consultationId,
                                        "timestamp", Instant.now().toString()),
                                MediaType.APPLICATION_JSON);

        for (SseEmitter emitter : emitters) {
            sendEventSafely(consultationId, emitter, event);
        }
    }

    private void sendEventSafely(
            Long consultationId, SseEmitter emitter, SseEmitter.SseEventBuilder event) {
        try {
            emitter.send(event);
        } catch (IOException | RuntimeException ex) {
            log.debug(
                    "SSE emitter send failed for consultation #{}: {}",
                    consultationId,
                    ex.getMessage());
            removeEmitter(consultationId, emitter);
        }
    }

    private void removeEmitter(Long consultationId, SseEmitter emitter) {
        List<SseEmitter> emitters = emittersByConsultation.get(consultationId);
        if (emitters == null) {
            return;
        }
        emitters.remove(emitter);
        if (emitters.isEmpty()) {
            emittersByConsultation.remove(consultationId);
        }
    }
}
