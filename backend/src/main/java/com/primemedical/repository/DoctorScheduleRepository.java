package com.primemedical.repository;

import com.primemedical.entity.DoctorSchedule;
import java.time.LocalDate;
import java.time.LocalTime;
import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

@Repository
public interface DoctorScheduleRepository extends JpaRepository<DoctorSchedule, Long> {

    /** Get all schedule slots for a doctor on a given date. */
    List<DoctorSchedule> findByDoctorIdAndScheduleDate(Long doctorId, LocalDate scheduleDate);

    /** Check if a specific slot already exists (guard for duplicate insertion). */
    boolean existsByDoctorIdAndScheduleDateAndSlotTime(
            Long doctorId, LocalDate scheduleDate, LocalTime slotTime);

    /** Get all non-blocked slots for a doctor on a given date. */
    @Query(
            "SELECT ds FROM DoctorSchedule ds "
                    + "WHERE ds.doctor.id = :doctorId "
                    + "AND ds.scheduleDate = :date "
                    + "AND ds.isBlocked = false "
                    + "ORDER BY ds.slotTime ASC")
    List<DoctorSchedule> findAvailableSlots(
            @Param("doctorId") Long doctorId, @Param("date") LocalDate date);
}
