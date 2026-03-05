package com.medcenter.repository;

import com.medcenter.entity.QueueEntry;
import com.medcenter.enums.QueueStatus;
import java.time.LocalDate;
import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface QueueEntryRepository extends JpaRepository<QueueEntry, Long> {

    List<QueueEntry> findByQueueDateOrderByPriorityDescQueueNumberAsc(LocalDate queueDate);

    List<QueueEntry> findByQueueDateAndStatus(LocalDate queueDate, QueueStatus status);

    long countByQueueDate(LocalDate queueDate);

    boolean existsByAppointmentId(Long appointmentId);

    List<QueueEntry> findAllByAppointmentId(Long appointmentId);

    void deleteByAppointmentId(Long appointmentId);
}
