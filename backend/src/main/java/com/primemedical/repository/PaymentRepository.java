package com.primemedical.repository;

import com.primemedical.entity.Payment;
import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface PaymentRepository extends JpaRepository<Payment, Long> {

    List<Payment> findByBillId(Long billId);
}
