package com.primemedical.repository;

import com.primemedical.entity.Prescription;
import com.primemedical.enums.PrescriptionStatus;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface PrescriptionRepository extends JpaRepository<Prescription, Long> {

    Optional<Prescription> findByConsultationId(Long consultationId);

    Optional<Prescription> findTopByConsultationIdOrderByIdDesc(Long consultationId);

    List<Prescription> findAllByConsultationId(Long consultationId);

    List<Prescription> findByPatientId(Long patientId);

    List<Prescription> findByStatusOrderByPrescribedAtDesc(PrescriptionStatus status);

    List<Prescription> findByStatusAndDispensedAtAfterOrderByDispensedAtDesc(
            PrescriptionStatus status, LocalDateTime dispensedAfter);

    Optional<Prescription> findTopByPatientIdAndStatusOrderByDispensedAtDesc(
            Long patientId, PrescriptionStatus status);

        List<Prescription> findByStatusAndPrescribedAtAfterOrderByPrescribedAtDesc(
            PrescriptionStatus status, LocalDateTime prescribedAfter);
}
