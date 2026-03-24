package com.primemedical.service;

import java.time.Duration;
import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.primemedical.dto.request.BloodCheckupUpdateRequest;
import com.primemedical.dto.request.ConsultationNotesRequest;
import com.primemedical.dto.request.VitalSignsRequest;
import com.primemedical.dto.response.ConsultationResponse;
import com.primemedical.entity.Appointment;
import com.primemedical.entity.Consultation;
import com.primemedical.entity.Patient;
import com.primemedical.entity.QueueEntry;
import com.primemedical.entity.User;
import com.primemedical.entity.VitalSigns;
import com.primemedical.enums.AppointmentStatus;
import com.primemedical.enums.ConsultationStatus;
import com.primemedical.enums.QueueStatus;
import com.primemedical.exception.BadRequestException;
import com.primemedical.exception.ResourceNotFoundException;
import com.primemedical.repository.AppointmentRepository;
import com.primemedical.repository.ConsultationRepository;
import com.primemedical.repository.PatientRepository;
import com.primemedical.repository.QueueEntryRepository;
import com.primemedical.repository.UserRepository;
import com.primemedical.repository.VitalSignsRepository;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

@Service
@RequiredArgsConstructor
@Slf4j
public class ConsultationService {

    private final ConsultationRepository consultationRepository;
    private final AppointmentRepository appointmentRepository;
    private final QueueEntryRepository queueEntryRepository;
    private final VitalSignsRepository vitalSignsRepository;
    private final PatientRepository patientRepository;
    private final UserRepository userRepository;
        private final BillingService billingService;
        private final AppointmentAuditLogService appointmentAuditLogService;

    /** Start a new consultation from an appointment or queue entry. */
    @Transactional
    public ConsultationResponse startConsultation(
            Long appointmentId, Long queueEntryId, Long doctorId) {
                if (queueEntryId != null) {
                        Consultation existingByQueue =
                                        consultationRepository
                                                        .findTopByQueueEntryIdOrderByIdDesc(queueEntryId)
                                                        .orElse(null);
                        if (existingByQueue != null) {
                                return mapToResponse(existingByQueue);
                        }
                }

                if (appointmentId != null) {
                        Consultation existingByAppointment =
                                        consultationRepository
                                                        .findTopByAppointmentIdOrderByIdDesc(appointmentId)
                                                        .orElse(null);
                        if (existingByAppointment != null) {
                                return mapToResponse(existingByAppointment);
                        }
                }

        User doctor =
                userRepository
                        .findById(doctorId)
                        .orElseThrow(() -> new ResourceNotFoundException("Doctor", "id", doctorId));

        Appointment appointment = null;
        QueueEntry queueEntry = null;
        Patient patient;

        if (appointmentId == null && queueEntryId == null) {
            throw new BadRequestException("Either appointmentId or queueEntryId must be provided");
        }

        if (appointmentId != null) {
            appointment =
                    appointmentRepository
                            .findById(appointmentId)
                            .orElseThrow(
                                    () ->
                                            new ResourceNotFoundException(
                                                    "Appointment", "id", appointmentId));
            AppointmentStatus previousStatus = appointment.getStatus();
            appointment.setStatus(AppointmentStatus.IN_CONSULTATION);
            appointmentRepository.save(appointment);
            appointmentAuditLogService.log(
                    appointment,
                    "IN_CONSULTATION_STARTED",
                    previousStatus,
                    AppointmentStatus.IN_CONSULTATION,
                    null,
                    doctor,
                    "Consultation started");
        }

        if (queueEntryId != null) {
            queueEntry =
                    queueEntryRepository
                            .findById(queueEntryId)
                            .orElseThrow(
                                    () ->
                                            new ResourceNotFoundException(
                                                    "QueueEntry", "id", queueEntryId));
            queueEntry.setStatus(QueueStatus.IN_CONSULTATION);
            queueEntryRepository.save(queueEntry);
        }

        if (appointment != null && queueEntry != null) {
            if (!appointment.getPatient().getId().equals(queueEntry.getPatient().getId())) {
                throw new BadRequestException(
                        "Appointment and queue entry belong to different patients");
            }
            patient = appointment.getPatient();
        } else if (appointment != null) {
            patient = appointment.getPatient();
                } else if (queueEntry != null) {
                        patient = queueEntry.getPatient();
        } else {
                        throw new BadRequestException(
                                        "Either appointmentId or queueEntryId is required to start consultation");
        }

        Consultation consultation =
                Consultation.builder()
                        .appointment(appointment)
                        .queueEntry(queueEntry)
                        .patient(patient)
                        .doctor(doctor)
                        .status(ConsultationStatus.IN_PROGRESS)
                        .startedAt(LocalDateTime.now())
                        .build();

        consultation = consultationRepository.save(consultation);
        final Consultation savedConsultation = consultation;

        // Link any pre-recorded vitals from the queue entry to this consultation
        if (queueEntry != null) {
            vitalSignsRepository
                    .findByQueueEntryId(queueEntry.getId())
                    .ifPresent(
                            vitals -> {
                                vitals.setConsultation(savedConsultation);
                                vitalSignsRepository.save(vitals);
                            });
        }

        log.info("Consultation started: #{} by Dr. {}", consultation.getId(), doctor.getLastName());

        return mapToResponse(consultation);
    }

    /** Record vital signs for a consultation. */
    @Transactional
    public ConsultationResponse recordVitals(
            Long consultationId, VitalSignsRequest request, Long nurseId) {
        Consultation consultation =
                consultationRepository
                        .findById(consultationId)
                        .orElseThrow(
                                () ->
                                        new ResourceNotFoundException(
                                                "Consultation", "id", consultationId));

        User nurse =
                userRepository
                        .findById(nurseId)
                        .orElseThrow(() -> new ResourceNotFoundException("User", "id", nurseId));

        VitalSigns vitals =
                VitalSigns.builder()
                        .consultation(consultation)
                        .patient(consultation.getPatient())
                        .bloodPressureSystolic(request.getBloodPressureSystolic())
                        .bloodPressureDiastolic(request.getBloodPressureDiastolic())
                        .heartRate(request.getHeartRate())
                        .temperature(request.getTemperature())
                        .weight(request.getWeight())
                        .height(request.getHeight())
                        .oxygenSaturation(request.getOxygenSaturation())
                        .respiratoryRate(request.getRespiratoryRate())
                        .painScale(request.getPainScale())
                        .notes(request.getNotes())
                        .symptoms(request.getSymptoms())
                        .recordedBy(nurse)
                        .recordedAt(LocalDateTime.now())
                        .build();

        vitalSignsRepository.save(vitals);
        log.info("Vitals recorded for consultation #{}", consultationId);

        return mapToResponse(consultation);
    }

    /** Update notes and diagnosis for a consultation. */
    @Transactional
    public ConsultationResponse updateNotes(Long consultationId, ConsultationNotesRequest request) {
        Consultation consultation =
                consultationRepository
                        .findById(consultationId)
                        .orElseThrow(
                                () ->
                                        new ResourceNotFoundException(
                                                "Consultation", "id", consultationId));

        consultation.setNotes(request.getNotes());
        consultation.setSymptoms(request.getSymptoms());
        consultation.setExamination(request.getExamination());
        consultation.setTreatment(request.getTreatment());
        consultation.setDiagnosis(request.getDiagnosis());
        if (request.getIsConfidential() != null) {
            consultation.setIsConfidential(request.getIsConfidential());
        }

                if (request.getBloodCheckRequired() != null) {
                        boolean required = request.getBloodCheckRequired();
                        boolean wasRequired = Boolean.TRUE.equals(consultation.getBloodCheckRequired());
                        consultation.setBloodCheckRequired(required);

                        if (required) {
                                if (!wasRequired) {
                                        consultation.setBloodCheckRequestedAt(LocalDateTime.now());
                                        consultation.setBloodCheckCompleted(false);
                                        consultation.setBloodCheckCompletedAt(null);
                                        consultation.setBloodCheckupNotes(null);
                                        consultation.setBloodTestType(null);
                                        consultation.setBloodTestReport(null);
                                        consultation.setBloodCheckUpdatedBy(null);
                                }
                        } else {
                                consultation.setBloodCheckCompleted(false);
                                consultation.setBloodCheckRequestedAt(null);
                                consultation.setBloodCheckCompletedAt(null);
                                consultation.setBloodCheckupNotes(null);
                                consultation.setBloodTestType(null);
                                consultation.setBloodTestReport(null);
                                consultation.setBloodCheckUpdatedBy(null);
                        }
                }

        consultation = consultationRepository.save(consultation);

        log.info("Consultation notes updated: #{}", consultationId);
        return mapToResponse(consultation);
    }

        /** Nurse/admin/doctor updates blood checkup execution details. */
        @Transactional
        public ConsultationResponse updateBloodCheckup(
                        Long consultationId, BloodCheckupUpdateRequest request, Long staffId) {
                if (staffId == null) {
                        throw new BadRequestException("Authenticated staff user is required");
                }

                Consultation consultation =
                                consultationRepository
                                                .findById(consultationId)
                                                .orElseThrow(
                                                                () ->
                                                                                new ResourceNotFoundException(
                                                                                                "Consultation", "id", consultationId));

                if (!Boolean.TRUE.equals(consultation.getBloodCheckRequired())) {
                        throw new BadRequestException("Blood checkup is not requested for this consultation");
                }

                User staff =
                                userRepository
                                                .findById(staffId)
                                                .orElseThrow(() -> new ResourceNotFoundException("User", "id", staffId));

                boolean completed = request.getBloodCheckCompleted() == null || request.getBloodCheckCompleted();

                if (completed) {
                        if (request.getBloodTestType() == null || request.getBloodTestType().trim().isEmpty()) {
                                throw new BadRequestException("Blood test type is required when completing blood checkup");
                        }
                        if (request.getBloodTestReport() == null || request.getBloodTestReport().trim().isEmpty()) {
                                throw new BadRequestException("Blood test report is required when completing blood checkup");
                        }
                }

                consultation.setBloodCheckCompleted(completed);
                consultation.setBloodCheckupNotes(request.getBloodCheckupNotes());
                consultation.setBloodTestType(
                        request.getBloodTestType() != null ? request.getBloodTestType().trim() : null);
                consultation.setBloodTestReport(
                        request.getBloodTestReport() != null ? request.getBloodTestReport().trim() : null);
                consultation.setBloodCheckUpdatedBy(staff);
                consultation.setBloodCheckCompletedAt(completed ? LocalDateTime.now() : null);

                consultation = consultationRepository.save(consultation);

                if (completed) {
                        try {
                                String actorEmail = staff.getEmail();
                                billingService.syncBillWithBloodCheckup(consultationId, actorEmail);
                        } catch (Exception e) {
                                log.error(
                                                "Blood checkup updated for consultation #{}, but billing sync failed: {}",
                                                consultationId,
                                                e.getMessage(),
                                                e);
                        }
                }

                log.info("Blood checkup updated for consultation #{} by user #{}", consultationId, staffId);
                return mapToResponse(consultation);
        }

        /** Get pending blood checkup requests for nurse workflow. */
        @Transactional(readOnly = true)
        public List<ConsultationResponse> getPendingBloodCheckups() {
                return consultationRepository.findPendingBloodCheckups().stream()
                                .map(this::mapToResponse)
                                .collect(Collectors.toList());
        }

        /** Get completed blood checkup reports so doctors can review nurse submissions. */
        @Transactional(readOnly = true)
        public List<ConsultationResponse> getCompletedBloodCheckupsForDoctor(Long doctorId) {
                return consultationRepository.findCompletedBloodCheckupsForDoctor(doctorId).stream()
                                .map(this::mapToResponse)
                                .collect(Collectors.toList());
        }

    /**
     * End a consultation — set COMPLETED, calculate duration, and cascade status to appointment and
     * queue entry.
     */
    @Transactional
        public ConsultationResponse endConsultation(Long consultationId, String requesterEmail) {
        Consultation consultation =
                consultationRepository
                        .findById(consultationId)
                        .orElseThrow(
                                () ->
                                        new ResourceNotFoundException(
                                                "Consultation", "id", consultationId));

        if (consultation.getStatus() == ConsultationStatus.COMPLETED) {
            throw new BadRequestException("Consultation is already completed");
        }

                LocalDateTime endTime = LocalDateTime.now();
                LocalDateTime startTime = consultation.getStartedAt();
                if (startTime == null) {
                        startTime = endTime;
                        consultation.setStartedAt(startTime);
                }

                long rawMinutes = Duration.between(startTime, endTime).toMinutes();
                int minutes = (int) Math.max(rawMinutes, 0);

        consultation.setStatus(ConsultationStatus.COMPLETED);
        consultation.setEndedAt(endTime);
        consultation.setDurationMinutes(minutes);
        consultation = consultationRepository.save(consultation);

        // Cascade: update appointment status
        if (consultation.getAppointment() != null) {
                        AppointmentStatus previousStatus = consultation.getAppointment().getStatus();
            consultation.getAppointment().setStatus(AppointmentStatus.COMPLETED);
            appointmentRepository.save(consultation.getAppointment());
                        appointmentAuditLogService.log(
                                        consultation.getAppointment(),
                                        "COMPLETED",
                                        previousStatus,
                                        AppointmentStatus.COMPLETED,
                                        null,
                                        userRepository.findByEmail(requesterEmail).orElse(null),
                                        "Consultation ended");
        }

        // Cascade: complete queue entry
        if (consultation.getQueueEntry() != null) {
            consultation.getQueueEntry().setStatus(QueueStatus.COMPLETED);
            consultation.getQueueEntry().setCompletedAt(endTime);
            queueEntryRepository.save(consultation.getQueueEntry());
        }

                try {
                        billingService.generateConsultationFeeBillIfAbsent(consultation.getId());
                } catch (Exception e) {
                        log.error(
                                        "Consultation #{} completed, but billing generation failed: {}",
                                        consultation.getId(),
                                        e.getMessage(),
                                        e);
                }

        log.info("Consultation ended: #{} ({}min)", consultationId, minutes);
        return mapToResponse(consultation);
    }

    /** Get a patient's consultation history (most recent first). */
    @Transactional(readOnly = true)
    public List<ConsultationResponse> getPatientHistory(Long patientId) {
        patientRepository
                .findById(patientId)
                .orElseThrow(() -> new ResourceNotFoundException("Patient", "id", patientId));

        return consultationRepository.findByPatientIdOrderByStartedAtDesc(patientId).stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    /** Get a single consultation by ID. */
    @Transactional(readOnly = true)
    public ConsultationResponse getConsultationById(Long id) {
        Consultation consultation =
                consultationRepository
                        .findById(id)
                        .orElseThrow(() -> new ResourceNotFoundException("Consultation", "id", id));
        return mapToResponse(consultation);
    }

    // ── Private helpers ──────────────────────────────────────────

    private ConsultationResponse mapToResponse(Consultation c) {
        ConsultationResponse.VitalSignsInfo vitalsInfo =
                vitalSignsRepository
                        .findByConsultationId(c.getId())
                        .map(
                                v ->
                                        ConsultationResponse.VitalSignsInfo.builder()
                                                .id(v.getId())
                                                .bloodPressureSystolic(v.getBloodPressureSystolic())
                                                .bloodPressureDiastolic(
                                                        v.getBloodPressureDiastolic())
                                                .heartRate(v.getHeartRate())
                                                .temperature(v.getTemperature())
                                                .weight(v.getWeight())
                                                .height(v.getHeight())
                                                .oxygenSaturation(v.getOxygenSaturation())
                                                .respiratoryRate(v.getRespiratoryRate())
                                                .painScale(v.getPainScale())
                                                .notes(v.getNotes())
                                                .symptoms(v.getSymptoms())
                                                .recordedByName(
                                                        v.getRecordedBy() != null
                                                                ? v.getRecordedBy().getFirstName()
                                                                        + " "
                                                                        + v.getRecordedBy()
                                                                                .getLastName()
                                                                : "Unknown Staff")
                                                .recordedAt(v.getRecordedAt())
                                                .build())
                        .orElse(null);

        String patientName = "Unknown";
        if (c.getPatient() != null && c.getPatient().getUser() != null) {
            patientName =
                    c.getPatient().getUser().getFirstName()
                            + " "
                            + c.getPatient().getUser().getLastName();
        }

        String doctorName = "Unknown";
        if (c.getDoctor() != null) {
            doctorName = c.getDoctor().getFirstName() + " " + c.getDoctor().getLastName();
        }

        String bloodCheckUpdatedByName = null;
        if (c.getBloodCheckUpdatedBy() != null) {
            bloodCheckUpdatedByName =
                    c.getBloodCheckUpdatedBy().getFirstName()
                            + " "
                            + c.getBloodCheckUpdatedBy().getLastName();
        }

        return ConsultationResponse.builder()
                .id(c.getId())
                .appointmentId(c.getAppointment() != null ? c.getAppointment().getId() : null)
                .queueEntryId(c.getQueueEntry() != null ? c.getQueueEntry().getId() : null)
                .patientId(c.getPatient() != null ? c.getPatient().getId() : null)
                .patientName(patientName)
                .patientNumber(c.getPatient() != null ? c.getPatient().getPatientNumber() : "N/A")
                .doctorId(c.getDoctor() != null ? c.getDoctor().getId() : null)
                .doctorName(doctorName)
                .notes(c.getNotes())
                .symptoms(c.getSymptoms())
                .examination(c.getExamination())
                .treatment(c.getTreatment())
                .diagnosis(c.getDiagnosis())
                .isConfidential(c.getIsConfidential())
                .bloodCheckRequired(c.getBloodCheckRequired())
                .bloodCheckCompleted(c.getBloodCheckCompleted())
                .bloodCheckupNotes(c.getBloodCheckupNotes())
                .bloodTestType(c.getBloodTestType())
                .bloodTestReport(c.getBloodTestReport())
                .bloodCheckRequestedAt(c.getBloodCheckRequestedAt())
                .bloodCheckCompletedAt(c.getBloodCheckCompletedAt())
                .bloodCheckUpdatedByName(bloodCheckUpdatedByName)
                .status(c.getStatus())
                .startedAt(c.getStartedAt())
                .endedAt(c.getEndedAt())
                .durationMinutes(c.getDurationMinutes())
                .createdAt(c.getCreatedAt())
                .updatedAt(c.getUpdatedAt())
                .vitalSigns(vitalsInfo)
                .build();
    }
}
