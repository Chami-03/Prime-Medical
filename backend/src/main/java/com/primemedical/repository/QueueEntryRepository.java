package com.primemedical.repository;

import java.time.LocalDate;
import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import com.primemedical.entity.QueueEntry;
import com.primemedical.enums.QueueStatus;

@Repository
public interface QueueEntryRepository extends JpaRepository<QueueEntry, Long> {

    List<QueueEntry> findByQueueDateOrderByPriorityDescQueueNumberAsc(LocalDate queueDate);

    List<QueueEntry> findByQueueDateAndStatus(LocalDate queueDate, QueueStatus status);

    long countByQueueDate(LocalDate queueDate);

    boolean existsByAppointmentId(Long appointmentId);

    List<QueueEntry> findByPatientId(Long patientId);

    List<QueueEntry> findAllByAppointmentId(Long appointmentId);

    void deleteByAppointmentId(Long appointmentId);
}
