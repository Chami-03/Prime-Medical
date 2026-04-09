package com.primemedical.repository;

import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import com.primemedical.entity.Bill;

@Repository
public interface BillRepository extends JpaRepository<Bill, Long> {

    List<Bill> findByPatientId(Long patientId);

    Optional<Bill> findByConsultationId(Long consultationId);

    Optional<Bill> findTopByPatientIdAndConsultationIsNullOrderByCreatedAtDesc(Long patientId);

    List<Bill> findAllByConsultationId(Long consultationId);

    boolean existsByInvoiceNumber(String invoiceNumber);
}
