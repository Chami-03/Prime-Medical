package com.primemedical.service;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.primemedical.dto.request.QueueCheckInRequest;
import com.primemedical.dto.request.VitalSignsRequest;
import com.primemedical.dto.response.QueueEntryResponse;
import com.primemedical.entity.Appointment;
import com.primemedical.entity.Patient;
import com.primemedical.entity.QueueEntry;
import com.primemedical.entity.User;
import com.primemedical.entity.VitalSigns;
import com.primemedical.enums.AppointmentStatus;
import com.primemedical.enums.QueueStatus;
import com.primemedical.exception.BadRequestException;
import com.primemedical.exception.ResourceNotFoundException;
import com.primemedical.repository.AppointmentRepository;
import com.primemedical.repository.PatientRepository;
import com.primemedical.repository.QueueEntryRepository;
import com.primemedical.repository.UserRepository;
import com.primemedical.repository.VitalSignsRepository;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

@Service
@RequiredArgsConstructor
@Slf4j
public class QueueService {

    private final QueueEntryRepository queueEntryRepository;
    private final PatientRepository patientRepository;
    private final AppointmentRepository appointmentRepository;
    private final com.primemedical.repository.ConsultationRepository consultationRepository;
    private final VitalSignsRepository vitalSignsRepository;
    private final UserRepository userRepository;
        private final AppointmentAuditLogService appointmentAuditLogService;

    /** Check in a patient — auto-assign queue number for today. */
    @Transactional
        public QueueEntryResponse checkIn(QueueCheckInRequest request, String requesterEmail) {
        Patient patient =
                patientRepository
                        .findById(request.getPatientId())
                        .orElseThrow(
                                () ->
                                        new ResourceNotFoundException(
                                                "Patient", "id", request.getPatientId()));

        Appointment appointment = null;
        if (request.getAppointmentId() != null) {
            appointment =
                    appointmentRepository
                            .findById(request.getAppointmentId())
                            .orElseThrow(
                                    () ->
                                            new ResourceNotFoundException(
                                                    "Appointment",
                                                    "id",
                                                    request.getAppointmentId()));
            AppointmentStatus previousStatus = appointment.getStatus();
            appointment.setStatus(AppointmentStatus.CHECKED_IN);
            appointmentRepository.save(appointment);

            appointmentAuditLogService.log(
                    appointment,
                    "CHECKED_IN",
                    previousStatus,
                    AppointmentStatus.CHECKED_IN,
                    null,
                    findActorByEmail(requesterEmail),
                    "Patient checked in at reception queue");
        }

        LocalDate today = LocalDate.now();
        int queueNumber = (int) queueEntryRepository.countByQueueDate(today) + 1;

        QueueEntry entry =
                QueueEntry.builder()
                        .patient(patient)
                        .appointment(appointment)
                        .queueDate(today)
                        .queueNumber(queueNumber)
                        .status(QueueStatus.WAITING)
                        .priority(request.getPriority())
                        .checkedInAt(LocalDateTime.now())
                        .build();

        entry = queueEntryRepository.save(entry);
        log.info("Patient checked in: {} — Queue #{}", patient.getPatientNumber(), queueNumber);

        return mapToResponse(entry);
    }

    /** Get today's queue ordered by priority DESC, queue number ASC. */
    @Transactional(readOnly = true)
    public List<QueueEntryResponse> getTodayQueue() {
        return queueEntryRepository
                .findByQueueDateOrderByPriorityDescQueueNumberAsc(LocalDate.now())
                .stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    /** Call next patient — set status to IN_CONSULTATION. */
    @Transactional
    public QueueEntryResponse callNext(Long queueEntryId) {
        QueueEntry entry =
                queueEntryRepository
                        .findById(queueEntryId)
                        .orElseThrow(
                                () ->
                                        new ResourceNotFoundException(
                                                "QueueEntry", "id", queueEntryId));

                if (entry.getStatus() != QueueStatus.WAITING
                                && entry.getStatus() != QueueStatus.VITALS_PENDING
                                && entry.getStatus() != QueueStatus.READY) {
                        throw new BadRequestException(
                                        "Queue entry must be in WAITING, VITALS_PENDING, or READY status");
        }

        entry.setStatus(QueueStatus.IN_CONSULTATION);
        entry.setCalledAt(LocalDateTime.now());
        entry = queueEntryRepository.save(entry);

        log.info("Patient called: Queue #{}", entry.getQueueNumber());
        return mapToResponse(entry);
    }

    /** Mark queue entry as COMPLETED. */
    @Transactional
        public QueueEntryResponse complete(Long queueEntryId, String requesterEmail) {
        QueueEntry entry =
                queueEntryRepository
                        .findById(queueEntryId)
                        .orElseThrow(
                                () ->
                                        new ResourceNotFoundException(
                                                "QueueEntry", "id", queueEntryId));

        entry.setStatus(QueueStatus.COMPLETED);
        entry.setCompletedAt(LocalDateTime.now());
        entry = queueEntryRepository.save(entry);

                // Keep appointment lifecycle in sync when queue is completed from queue workflow.
                if (entry.getAppointment() != null) {
                        AppointmentStatus previousStatus = entry.getAppointment().getStatus();
                        entry.getAppointment().setStatus(AppointmentStatus.COMPLETED);
                        appointmentRepository.save(entry.getAppointment());

                        appointmentAuditLogService.log(
                                        entry.getAppointment(),
                                        "COMPLETED",
                                        previousStatus,
                                        AppointmentStatus.COMPLETED,
                                        null,
                                        findActorByEmail(requesterEmail),
                                        "Marked as completed from queue workflow");
                }

        log.info("Queue entry completed: #{}", entry.getQueueNumber());
        return mapToResponse(entry);
    }

    /** Mark queue entry as NO_SHOW. */
    @Transactional
        public QueueEntryResponse markNoShow(Long queueEntryId, String requesterEmail) {
        QueueEntry entry =
                queueEntryRepository
                        .findById(queueEntryId)
                        .orElseThrow(
                                () ->
                                        new ResourceNotFoundException(
                                                "QueueEntry", "id", queueEntryId));

        entry.setStatus(QueueStatus.NO_SHOW);
        entry.setCompletedAt(LocalDateTime.now());
        entry = queueEntryRepository.save(entry);

        // Also update appointment if linked
        if (entry.getAppointment() != null) {
                        AppointmentStatus previousStatus = entry.getAppointment().getStatus();
            entry.getAppointment().setStatus(AppointmentStatus.NO_SHOW);
                        appointmentRepository.save(entry.getAppointment());
                        appointmentAuditLogService.log(
                                        entry.getAppointment(),
                                        "NO_SHOW",
                                        previousStatus,
                                        AppointmentStatus.NO_SHOW,
                                        null,
                                        findActorByEmail(requesterEmail),
                                        "Marked as no-show from queue workflow");
        }

        log.info("Queue entry marked NO_SHOW: #{}", entry.getQueueNumber());
        return mapToResponse(entry);
    }

    /** Record vital signs for a queue entry, setting status to READY. */
    @Transactional
    public QueueEntryResponse recordVitals(
            Long queueEntryId, VitalSignsRequest request, Long nurseId) {
        QueueEntry entry =
                queueEntryRepository
                        .findById(queueEntryId)
                        .orElseThrow(
                                () ->
                                        new ResourceNotFoundException(
                                                "QueueEntry", "id", queueEntryId));

        User nurse =
                userRepository
                        .findById(nurseId)
                        .orElseThrow(() -> new ResourceNotFoundException("User", "id", nurseId));

        VitalSigns vitals = vitalSignsRepository.findByQueueEntryId(queueEntryId).orElse(null);
        if (vitals == null) {
            vitals =
                    VitalSigns.builder()
                            .queueEntry(entry)
                            .patient(entry.getPatient())
                            .recordedBy(nurse)
                            .recordedAt(LocalDateTime.now())
                            .build();
        }

        vitals.setBloodPressureSystolic(request.getBloodPressureSystolic());
        vitals.setBloodPressureDiastolic(request.getBloodPressureDiastolic());
        vitals.setHeartRate(request.getHeartRate());
        vitals.setTemperature(request.getTemperature());
        vitals.setWeight(request.getWeight());
        vitals.setHeight(request.getHeight());
        vitals.setOxygenSaturation(request.getOxygenSaturation());
        vitals.setRespiratoryRate(request.getRespiratoryRate());
        vitals.setPainScale(request.getPainScale());
        vitals.setNotes(request.getNotes());
        vitals.setSymptoms(request.getSymptoms());

        com.primemedical.entity.Consultation linkedConsultation =
                consultationRepository.findTopByQueueEntryIdOrderByIdDesc(entry.getId()).orElse(null);
        if (linkedConsultation == null && entry.getAppointment() != null) {
            linkedConsultation =
                    consultationRepository
                            .findTopByAppointmentIdOrderByIdDesc(entry.getAppointment().getId())
                            .orElse(null);
        }
        if (linkedConsultation != null) {
            vitals.setConsultation(linkedConsultation);
        }

        vitalSignsRepository.save(vitals);

        if (entry.getStatus() != QueueStatus.IN_CONSULTATION) {
            entry.setStatus(QueueStatus.READY);
            entry = queueEntryRepository.save(entry);
        }

        log.info("Vitals recorded for QueueEntry #{}", entry.getQueueNumber());
        return mapToResponse(entry);
    }

    // ── Private helpers ──────────────────────────────────────────

    private QueueEntryResponse mapToResponse(QueueEntry entry) {
        Patient patient = entry.getPatient();
        Long consultationId =
                consultationRepository
                        .findByQueueEntryId(entry.getId())
                        .map(com.primemedical.entity.Consultation::getId)
                        .orElse(null);

        if (consultationId == null && entry.getAppointment() != null) {
            consultationId =
                    consultationRepository
                            .findTopByAppointmentIdOrderByIdDesc(entry.getAppointment().getId())
                            .map(com.primemedical.entity.Consultation::getId)
                            .orElse(null);
        }

        return QueueEntryResponse.builder()
                .id(entry.getId())
                .patientId(patient.getId())
                .patientName(
                        patient.getUser().getFirstName() + " " + patient.getUser().getLastName())
                .patientNumber(patient.getPatientNumber())
                .appointmentId(
                        entry.getAppointment() != null ? entry.getAppointment().getId() : null)
                .queueDate(entry.getQueueDate())
                .queueNumber(entry.getQueueNumber())
                .status(entry.getStatus())
                .priority(entry.getPriority())
                .checkedInAt(entry.getCheckedInAt())
                .calledAt(entry.getCalledAt())
                .completedAt(entry.getCompletedAt())
                .consultationId(consultationId)
                .build();
    }

        private User findActorByEmail(String email) {
                if (email == null || email.isBlank()) {
                        return null;
                }
                return userRepository.findByEmail(email).orElse(null);
        }
}
