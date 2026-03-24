package com.primemedical.repository;

import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import com.primemedical.entity.VitalSigns;

@Repository
public interface VitalSignsRepository extends JpaRepository<VitalSigns, Long> {

    Optional<VitalSigns> findByConsultationId(Long consultationId);

    Optional<VitalSigns> findByQueueEntryId(Long queueEntryId);

    List<VitalSigns> findByPatientId(Long patientId);

    void deleteByConsultationId(Long consultationId);

    void deleteByQueueEntryId(Long queueEntryId);
}
