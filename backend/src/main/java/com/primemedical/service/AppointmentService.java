package com.primemedical.service;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.time.Year;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.List;
import java.util.Set;
import java.util.stream.Collectors;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.primemedical.dto.request.AppointmentRequest;
import com.primemedical.dto.response.AppointmentAuditLogResponse;
import com.primemedical.dto.response.AppointmentResponse;
import com.primemedical.entity.Appointment;
import com.primemedical.entity.Patient;
import com.primemedical.entity.Role;
import com.primemedical.entity.StaffProfile;
import com.primemedical.entity.User;
import com.primemedical.enums.AppointmentStatus;
import com.primemedical.enums.RoleName;
import com.primemedical.exception.BadRequestException;
import com.primemedical.exception.ResourceNotFoundException;
import com.primemedical.repository.AppointmentAuditLogRepository;
import com.primemedical.repository.AppointmentRepository;
import com.primemedical.repository.BillRepository;
import com.primemedical.repository.ConsultationRepository;
import com.primemedical.repository.PatientRepository;
import com.primemedical.repository.PrescriptionRepository;
import com.primemedical.repository.QueueEntryRepository;
import com.primemedical.repository.StaffProfileRepository;
import com.primemedical.repository.UserRepository;
import com.primemedical.repository.VitalSignsRepository;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

@Service
@RequiredArgsConstructor
@Slf4j
public class AppointmentService {

    private final AppointmentRepository appointmentRepository;
    private final PatientRepository patientRepository;
    private final UserRepository userRepository;
    private final StaffProfileRepository staffProfileRepository;
    private final QueueEntryRepository queueEntryRepository;
    private final ConsultationRepository consultationRepository;
        private final VitalSignsRepository vitalSignsRepository;
        private final PrescriptionRepository prescriptionRepository;
        private final BillRepository billRepository;
    private final EmailService emailService;
        private final SmsService smsService;
        private final BillingService billingService;
        private final AppointmentAuditLogService appointmentAuditLogService;
        private final AppointmentAuditLogRepository appointmentAuditLogRepository;

    private static final LocalTime SLOT_START = LocalTime.of(9, 0);
    private static final LocalTime SLOT_END = LocalTime.of(17, 0);

    @Transactional
    public AppointmentResponse bookAppointment(AppointmentRequest request, String creatorEmail) {
        User createdBy =
                userRepository
                        .findByEmail(creatorEmail)
                        .orElseThrow(
                                () -> new ResourceNotFoundException("User", "email", creatorEmail));

        boolean creatorIsPatient =
                createdBy.getRoles().stream()
                        .map(Role::getName)
                        .anyMatch(roleName -> roleName == RoleName.PATIENT);

        Long targetPatientId = request.getPatientId();
        if (creatorIsPatient) {
            Patient ownPatient =
                    patientRepository
                            .findByUserId(createdBy.getId())
                            .orElseThrow(
                                    () ->
                                            new ResourceNotFoundException(
                                                    "Patient", "userId", createdBy.getId()));
                        if (request.getPatientId() != null && !ownPatient.getId().equals(request.getPatientId())) {
                throw new BadRequestException("Patients can only book appointments for themselves");
            }
            targetPatientId = ownPatient.getId();
                } else if (targetPatientId == null) {
                        throw new BadRequestException("Patient ID is required");
        }

        final Long resolvedPatientId = targetPatientId;

        Patient patient =
                patientRepository
                        .findById(resolvedPatientId)
                        .orElseThrow(
                                () -> new ResourceNotFoundException("Patient", "id", resolvedPatientId));

        User doctor =
                userRepository
                        .findById(request.getDoctorId())
                        .orElseThrow(
                                () ->
                                        new ResourceNotFoundException(
                                                "Doctor", "id", request.getDoctorId()));

        if (appointmentRepository.existsByDoctorIdAndAppointmentTimeAndStatusNot(
                request.getDoctorId(), request.getAppointmentTime(), AppointmentStatus.CANCELLED)) {
            throw new BadRequestException(
                    "This time slot is already booked for the selected doctor");
        }

        String confirmationCode = generateConfirmationCode();

        Appointment appointment =
                Appointment.builder()
                        .confirmationCode(confirmationCode)
                        .patient(patient)
                        .doctor(doctor)
                        .appointmentTime(request.getAppointmentTime())
                        .status(AppointmentStatus.CONFIRMED)
                        .reason(request.getReason())
                        .visitType(request.getVisitType())
                        .createdBy(createdBy)
                        .build();

        appointment = appointmentRepository.save(appointment);
        log.info("Appointment booked: {} for patient {}", confirmationCode, patient.getPatientNumber());

        appointmentAuditLogService.log(
                appointment,
                "BOOKED",
                null,
                appointment.getStatus(),
                request.getReason(),
                createdBy,
                "Appointment booked for " + request.getAppointmentTime());

                try {
                        billingService.generateBookingBill(patient.getId(), creatorEmail, confirmationCode);
                } catch (Exception e) {
                        log.warn("Failed to auto-generate appointment bill: {}", e.getMessage());
                }

                try {
                        if (patient.getUser() != null && patient.getUser().getEmail() != null) {
                                emailService.sendAppointmentConfirmation(
                                                patient.getUser().getEmail(),
                                                patient.getUser().getFirstName() + " " + patient.getUser().getLastName(),
                                                doctor.getFirstName() + " " + doctor.getLastName(),
                                                request.getAppointmentTime(),
                                                confirmationCode);
                        }
                } catch (Exception e) {
                        log.warn("Failed to send appointment confirmation email: {}", e.getMessage());
                }

        try {
            if (patient.getUser() != null && patient.getUser().getPhone() != null) {
                smsService.sendAppointmentConfirmation(
                        patient.getUser().getPhone(),
                        doctor.getFirstName() + " " + doctor.getLastName(),
                        request.getAppointmentTime(),
                        confirmationCode);
            }
        } catch (Exception e) {
            log.warn("Failed to send appointment confirmation SMS: {}", e.getMessage());
        }

        return mapToResponse(appointment);
    }

    @Transactional(readOnly = true)
    public List<LocalDateTime> getAvailableSlots(Long doctorId, LocalDate date) {
        userRepository
                .findById(doctorId)
                .orElseThrow(() -> new ResourceNotFoundException("Doctor", "id", doctorId));

        LocalDateTime startOfDay = date.atStartOfDay();
        LocalDateTime endOfDay = date.atTime(23, 59, 59);
        List<Appointment> booked =
                appointmentRepository.findByDoctorIdAndAppointmentTimeBetween(
                        doctorId, startOfDay, endOfDay);
        Set<LocalTime> bookedTimes =
                booked.stream()
                        .filter(a -> a.getStatus() != AppointmentStatus.CANCELLED)
                        .map(a -> a.getAppointmentTime().toLocalTime())
                        .collect(Collectors.toSet());

        List<LocalDateTime> availableSlots = new ArrayList<>();
        LocalTime current = SLOT_START;
        while (current.isBefore(SLOT_END)) {
            if (!bookedTimes.contains(current)) {
                availableSlots.add(LocalDateTime.of(date, current));
            }
            current = current.plusHours(1);
        }

        return availableSlots;
    }

    @Transactional(readOnly = true)
    public List<AppointmentResponse> getDoctorCalendar(Long doctorId, LocalDate date) {
        LocalDateTime startOfDay = date.atStartOfDay();
        LocalDateTime endOfDay = date.atTime(23, 59, 59);
        return appointmentRepository
                .findByDoctorIdAndAppointmentTimeBetween(doctorId, startOfDay, endOfDay)
                .stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<AppointmentResponse> getPatientCalendar(String userEmail, LocalDate date) {
        User requester =
                userRepository
                        .findByEmail(userEmail)
                        .orElseThrow(() -> new ResourceNotFoundException("User", "email", userEmail));
        Long patientId = getPatientIdForUser(requester);

        LocalDateTime startOfDay = date.atStartOfDay();
        LocalDateTime endOfDay = date.atTime(23, 59, 59);
        return appointmentRepository
                .findByPatientIdAndAppointmentTimeBetween(patientId, startOfDay, endOfDay)
                .stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

        @Transactional(readOnly = true)
        public List<AppointmentResponse> getPatientAppointmentsInRange(
                        String userEmail, LocalDate startDate, LocalDate endDate) {
                User requester =
                                userRepository
                                                .findByEmail(userEmail)
                                                .orElseThrow(() -> new ResourceNotFoundException("User", "email", userEmail));
                Long patientId = getPatientIdForUser(requester);

                if (endDate.isBefore(startDate)) {
                        throw new BadRequestException("End date cannot be before start date");
                }

                LocalDateTime start = startDate.atStartOfDay();
                LocalDateTime end = endDate.atTime(23, 59, 59);
                return appointmentRepository
                                .findByPatientIdAndAppointmentTimeBetween(patientId, start, end)
                                .stream()
                                .map(this::mapToResponse)
                                .collect(Collectors.toList());
        }

    @Transactional(readOnly = true)
    public AppointmentResponse getAppointmentById(Long id, String requesterEmail) {
        Appointment appointment =
                appointmentRepository
                        .findById(id)
                        .orElseThrow(() -> new ResourceNotFoundException("Appointment", "id", id));
        assertPatientCanAccess(appointment, requesterEmail);
        return mapToResponse(appointment);
    }

        @Transactional(readOnly = true)
        public List<AppointmentAuditLogResponse> getAppointmentAuditTimeline(Long id, String requesterEmail) {
                Appointment appointment =
                                appointmentRepository
                                                .findById(id)
                                                .orElseThrow(() -> new ResourceNotFoundException("Appointment", "id", id));
                assertPatientCanAccess(appointment, requesterEmail);
                return appointmentAuditLogService.getTimeline(id);
        }

    @Transactional
    public AppointmentResponse cancelAppointment(Long id, String reason, String requesterEmail) {
        Appointment appointment =
                appointmentRepository
                        .findById(id)
                        .orElseThrow(() -> new ResourceNotFoundException("Appointment", "id", id));
        assertPatientCanAccess(appointment, requesterEmail);

        if (appointment.getStatus() == AppointmentStatus.CANCELLED) {
            throw new BadRequestException("Appointment is already cancelled");
        }
        if (appointment.getStatus() == AppointmentStatus.COMPLETED) {
            throw new BadRequestException("Cannot cancel a completed appointment");
        }

        AppointmentStatus previousStatus = appointment.getStatus();
        appointment.setStatus(AppointmentStatus.CANCELLED);
        appointment.setCancellationReason(reason);
        appointment = appointmentRepository.save(appointment);

        appointmentAuditLogService.log(
                appointment,
                "CANCELLED",
                previousStatus,
                AppointmentStatus.CANCELLED,
                reason,
                findActorByEmail(requesterEmail),
                "Appointment cancelled");

        try {
            billingService.rollbackBookingBillForCancelledAppointment(
                    appointment.getPatient().getId(), appointment.getConfirmationCode());
        } catch (Exception e) {
            log.warn("Failed to rollback booking bill on cancellation: {}", e.getMessage());
        }

                try {
                        emailService.sendAppointmentCancellation(
                                        appointment.getPatient().getUser().getEmail(),
                                        appointment.getPatient().getUser().getFirstName(),
                                        appointment.getConfirmationCode(),
                                        reason);
                } catch (Exception e) {
                        log.warn("Failed to send cancellation email: {}", e.getMessage());
                }

        try {
            if (appointment.getPatient().getUser() != null
                    && appointment.getPatient().getUser().getPhone() != null) {
                smsService.sendAppointmentCancellation(
                        appointment.getPatient().getUser().getPhone(),
                        appointment.getConfirmationCode(),
                        reason);
            }
        } catch (Exception e) {
            log.warn("Failed to send cancellation SMS: {}", e.getMessage());
        }

        return mapToResponse(appointment);
    }

    @Transactional
        public AppointmentResponse updateStatus(Long id, AppointmentStatus newStatus, String requesterEmail) {
        Appointment appointment =
                appointmentRepository
                        .findById(id)
                        .orElseThrow(() -> new ResourceNotFoundException("Appointment", "id", id));

        if (appointment.getStatus() == AppointmentStatus.CANCELLED
                || appointment.getStatus() == AppointmentStatus.COMPLETED) {
            throw new BadRequestException(
                    "Cannot change status of a cancelled or completed appointment");
        }

        AppointmentStatus previousStatus = appointment.getStatus();
        appointment.setStatus(newStatus);
        appointment = appointmentRepository.save(appointment);

        appointmentAuditLogService.log(
                appointment,
                "STATUS_CHANGED",
                previousStatus,
                newStatus,
                null,
                findActorByEmail(requesterEmail),
                "Status updated manually");

        return mapToResponse(appointment);
    }

    @Transactional
    public AppointmentResponse rescheduleAppointment(
            Long id, LocalDateTime newTime, String requesterEmail) {
        Appointment appointment =
                appointmentRepository
                        .findById(id)
                        .orElseThrow(() -> new ResourceNotFoundException("Appointment", "id", id));
        assertPatientCanAccess(appointment, requesterEmail);

        if (appointment.getStatus() == AppointmentStatus.CANCELLED
                || appointment.getStatus() == AppointmentStatus.COMPLETED) {
            throw new BadRequestException("Cannot reschedule a cancelled or completed appointment");
        }

                if (appointment.getAppointmentTime() != null
                                && appointment.getAppointmentTime().equals(newTime)) {
                        return mapToResponse(appointment);
                }

        if (appointmentRepository.existsByDoctorIdAndAppointmentTimeAndStatusNot(
                appointment.getDoctor().getId(), newTime, AppointmentStatus.CANCELLED)) {
            throw new BadRequestException(
                    "This time slot is already booked for the selected doctor");
        }

        LocalDateTime previousTime = appointment.getAppointmentTime();
        AppointmentStatus previousStatus = appointment.getStatus();
        appointment.setAppointmentTime(newTime);
        appointment.setStatus(AppointmentStatus.CONFIRMED);
        appointment = appointmentRepository.save(appointment);

        appointmentAuditLogService.log(
                appointment,
                "RESCHEDULED",
                previousStatus,
                AppointmentStatus.CONFIRMED,
                null,
                findActorByEmail(requesterEmail),
                "Rescheduled from " + previousTime + " to " + newTime);

        try {
            if (appointment.getPatient().getUser() != null
                    && appointment.getPatient().getUser().getEmail() != null) {
                emailService.sendAppointmentReschedule(
                        appointment.getPatient().getUser().getEmail(),
                        appointment.getPatient().getUser().getFirstName()
                                + " "
                                + appointment.getPatient().getUser().getLastName(),
                        appointment.getDoctor().getFirstName()
                                + " "
                                + appointment.getDoctor().getLastName(),
                        newTime,
                        appointment.getConfirmationCode());
            }
        } catch (Exception e) {
            log.warn("Failed to send reschedule email: {}", e.getMessage());
        }

                try {
                        if (appointment.getPatient().getUser() != null
                                        && appointment.getPatient().getUser().getPhone() != null) {
                                smsService.sendAppointmentReschedule(
                                                appointment.getPatient().getUser().getPhone(),
                                                appointment.getDoctor().getFirstName()
                                                                + " "
                                                                + appointment.getDoctor().getLastName(),
                                                newTime,
                                                appointment.getConfirmationCode());
                        }
                } catch (Exception e) {
                        log.warn("Failed to send reschedule SMS: {}", e.getMessage());
                }

        return mapToResponse(appointment);
    }

    @Transactional
    public void deleteAppointment(Long id, String requesterEmail) {
        deleteAppointmentPermanently(id, requesterEmail);
    }

    @Transactional
    public void deleteAppointmentPermanently(Long id, String requesterEmail) {
        Appointment appointment =
                appointmentRepository
                        .findById(id)
                        .orElseThrow(() -> new ResourceNotFoundException("Appointment", "id", id));
        assertPatientCanAccess(appointment, requesterEmail);

                List<Appointment> rescheduledChildren = appointmentRepository.findByRescheduledFromId(id);
                if (!rescheduledChildren.isEmpty()) {
                        for (Appointment child : rescheduledChildren) {
                                child.setRescheduledFrom(null);
                        }
                        appointmentRepository.saveAll(rescheduledChildren);
                        appointmentRepository.flush();
                }

                appointmentAuditLogRepository.deleteAllByAppointmentIdNative(id);
                appointmentAuditLogRepository.flush();

                List<com.primemedical.entity.Consultation> linkedConsultations =
                                consultationRepository.findAllByAppointmentId(id);

                for (com.primemedical.entity.Consultation consultation : linkedConsultations) {
                        Long consultationId = consultation.getId();

                        vitalSignsRepository.deleteByConsultationId(consultationId);

                        List<com.primemedical.entity.Prescription> linkedPrescriptions =
                                        prescriptionRepository.findAllByConsultationId(consultationId);
                        if (!linkedPrescriptions.isEmpty()) {
                                prescriptionRepository.deleteAll(linkedPrescriptions);
                        }

                        List<com.primemedical.entity.Bill> linkedBills =
                                        billRepository.findAllByConsultationId(consultationId);
                        if (!linkedBills.isEmpty()) {
                                billRepository.deleteAll(linkedBills);
                        }
                }

                if (!linkedConsultations.isEmpty()) {
                        consultationRepository.deleteAll(linkedConsultations);
                }

        List<com.primemedical.entity.QueueEntry> linkedQueueEntries =
                queueEntryRepository.findAllByAppointmentId(id);
        if (!linkedQueueEntries.isEmpty()) {
            for (com.primemedical.entity.QueueEntry queueEntry : linkedQueueEntries) {
                vitalSignsRepository.deleteByQueueEntryId(queueEntry.getId());
            }
            queueEntryRepository.deleteAll(linkedQueueEntries);
        }

        appointmentRepository.delete(appointment);
    }

    @Transactional(readOnly = true)
    public List<AppointmentResponse> getAllAppointments(
            LocalDate startDate, LocalDate endDate, Long doctorId, AppointmentStatus status) {
        LocalDateTime start = startDate != null ? startDate.atStartOfDay() : null;
        LocalDateTime end = endDate != null ? endDate.atTime(23, 59, 59) : null;

        return appointmentRepository.findFilteredAppointments(doctorId, status, start, end).stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    private String generateConfirmationCode() {
                long sequence = appointmentRepository.count() + 1;
                String confirmationCode;
                do {
                        confirmationCode = String.format("APT-%d-%05d", Year.now().getValue(), sequence);
                        sequence++;
                } while (appointmentRepository.existsByConfirmationCode(confirmationCode));
                return confirmationCode;
    }

    private Long getPatientIdForUser(User user) {
        return patientRepository
                .findByUserId(user.getId())
                .map(Patient::getId)
                .orElseThrow(() -> new ResourceNotFoundException("Patient", "userId", user.getId()));
    }

        private User findActorByEmail(String email) {
                if (email == null || email.isBlank()) {
                        return null;
                }
                return userRepository.findByEmail(email).orElse(null);
        }

    private void assertPatientCanAccess(Appointment appointment, String requesterEmail) {
        User requester =
                userRepository
                        .findByEmail(requesterEmail)
                        .orElseThrow(() -> new ResourceNotFoundException("User", "email", requesterEmail));

        boolean requesterIsPatient =
                requester.getRoles().stream()
                        .map(Role::getName)
                        .anyMatch(roleName -> roleName == RoleName.PATIENT);

        if (!requesterIsPatient) {
            return;
        }

        Long requesterPatientId = getPatientIdForUser(requester);
        Long appointmentPatientId =
                appointment.getPatient() != null ? appointment.getPatient().getId() : null;

        if (appointmentPatientId == null || !appointmentPatientId.equals(requesterPatientId)) {
            throw new BadRequestException("You can only access your own appointments");
        }
    }

    private AppointmentResponse mapToResponse(Appointment appt) {
        if (appt == null) return null;
        User doctor = appt.getDoctor();
        Patient patient = appt.getPatient();

        String specialization =
                (doctor != null)
                        ? staffProfileRepository
                                .findByUserId(doctor.getId())
                                .map(StaffProfile::getSpecialization)
                                .orElse(null)
                        : null;

        String slotTime =
                appt.getAppointmentTime() != null
                        ? appt.getAppointmentTime().format(DateTimeFormatter.ofPattern("HH:mm"))
                        : null;

        return AppointmentResponse.builder()
                .id(appt.getId())
                .confirmationCode(appt.getConfirmationCode())
                .patientId(patient != null ? patient.getId() : null)
                .patientName(
                        patient != null && patient.getUser() != null
                                ? patient.getUser().getFirstName()
                                        + " "
                                        + patient.getUser().getLastName()
                                : "Unknown Patient")
                .patientNumber(patient != null ? patient.getPatientNumber() : null)
                .doctorId(doctor != null ? doctor.getId() : null)
                .doctorName(
                        doctor != null
                                ? doctor.getFirstName() + " " + doctor.getLastName()
                                : "Unknown Doctor")
                .doctorSpecialization(specialization)
                .appointmentTime(appt.getAppointmentTime())
                .slotTime(slotTime)
                .status(appt.getStatus())
                .reason(appt.getReason())
                .visitType(appt.getVisitType())
                .cancellationReason(appt.getCancellationReason())
                .rescheduledFromId(
                        appt.getRescheduledFrom() != null
                                ? appt.getRescheduledFrom().getId()
                                : null)
                .createdAt(appt.getCreatedAt())
                .updatedAt(appt.getUpdatedAt())
                .build();
    }
}
