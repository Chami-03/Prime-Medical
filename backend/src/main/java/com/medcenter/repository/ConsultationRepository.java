package com.medcenter.repository;

import com.medcenter.entity.Consultation;
import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

@Repository
public interface ConsultationRepository extends JpaRepository<Consultation, Long> {

    @Query(
            "SELECT c FROM Consultation c "
                    + "JOIN FETCH c.doctor d "
                    + "JOIN FETCH c.patient p "
                    + "JOIN FETCH p.user u "
                    + "WHERE c.patient.id = :patientId ORDER BY c.startedAt DESC")
    List<Consultation> findByPatientIdOrderByStartedAtDesc(@Param("patientId") Long patientId);

    java.util.Optional<Consultation> findByQueueEntryId(Long queueEntryId);

    java.util.Optional<Consultation> findTopByQueueEntryIdOrderByIdDesc(Long queueEntryId);

    java.util.Optional<Consultation> findTopByAppointmentIdOrderByIdDesc(Long appointmentId);

    List<Consultation> findAllByAppointmentId(Long appointmentId);

    boolean existsByAppointmentId(Long appointmentId);
}
