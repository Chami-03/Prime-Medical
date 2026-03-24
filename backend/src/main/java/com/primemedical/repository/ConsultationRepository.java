package com.primemedical.repository;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import com.primemedical.entity.Consultation;

@Repository
public interface ConsultationRepository extends JpaRepository<Consultation, Long> {

    @Query(
            "SELECT c FROM Consultation c "
                    + "JOIN FETCH c.doctor d "
                    + "JOIN FETCH c.patient p "
                    + "JOIN FETCH p.user u "
                    + "WHERE c.patient.id = :patientId ORDER BY c.startedAt DESC")
    List<Consultation> findByPatientIdOrderByStartedAtDesc(@Param("patientId") Long patientId);

    List<Consultation> findByPatientId(Long patientId);

    java.util.Optional<Consultation> findByQueueEntryId(Long queueEntryId);

    java.util.Optional<Consultation> findTopByQueueEntryIdOrderByIdDesc(Long queueEntryId);

    java.util.Optional<Consultation> findTopByAppointmentIdOrderByIdDesc(Long appointmentId);

    List<Consultation> findAllByAppointmentId(Long appointmentId);

    @Query(
            "SELECT c FROM Consultation c "
                    + "JOIN FETCH c.doctor d "
                    + "JOIN FETCH c.patient p "
                    + "JOIN FETCH p.user u "
                    + "WHERE c.bloodCheckRequired = true "
                    + "AND c.bloodCheckCompleted = false "
                    + "AND c.status = com.primemedical.enums.ConsultationStatus.IN_PROGRESS "
                    + "ORDER BY c.bloodCheckRequestedAt DESC")
    List<Consultation> findPendingBloodCheckups();

        @Query(
                        "SELECT c FROM Consultation c "
                                        + "JOIN FETCH c.doctor d "
                                        + "JOIN FETCH c.patient p "
                                        + "JOIN FETCH p.user u "
                                        + "WHERE c.bloodCheckRequired = true "
                                        + "AND c.bloodCheckCompleted = true "
                                        + "AND (:doctorId IS NULL OR c.doctor.id = :doctorId) "
                                        + "ORDER BY c.bloodCheckCompletedAt DESC")
        List<Consultation> findCompletedBloodCheckupsForDoctor(@Param("doctorId") Long doctorId);

    boolean existsByAppointmentId(Long appointmentId);
}
