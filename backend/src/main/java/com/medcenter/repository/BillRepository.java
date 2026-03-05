package com.medcenter.repository;

import com.medcenter.entity.Bill;
import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface BillRepository extends JpaRepository<Bill, Long> {

    List<Bill> findByPatientId(Long patientId);

    Optional<Bill> findByConsultationId(Long consultationId);

    List<Bill> findAllByConsultationId(Long consultationId);
}
