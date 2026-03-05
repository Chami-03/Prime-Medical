package com.medcenter.repository;

import com.medcenter.entity.Prescription;
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
}
