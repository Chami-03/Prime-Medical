package com.primemedical.repository;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import com.primemedical.entity.AppointmentAuditLog;

@Repository
public interface AppointmentAuditLogRepository extends JpaRepository<AppointmentAuditLog, Long> {

    List<AppointmentAuditLog> findByAppointmentIdOrderByChangedAtAscIdAsc(Long appointmentId);

    long deleteByAppointmentId(Long appointmentId);

    @Modifying
    @Query(value = "DELETE FROM appointment_audit_logs WHERE appointment_id = :appointmentId", nativeQuery = true)
    int deleteAllByAppointmentIdNative(Long appointmentId);
}
