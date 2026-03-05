package com.medcenter.repository;

import com.medcenter.entity.VitalSigns;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface VitalSignsRepository extends JpaRepository<VitalSigns, Long> {

    Optional<VitalSigns> findByConsultationId(Long consultationId);

    Optional<VitalSigns> findByQueueEntryId(Long queueEntryId);

    void deleteByConsultationId(Long consultationId);

    void deleteByQueueEntryId(Long queueEntryId);
}
