package com.primemedical.repository;

import java.time.LocalDateTime;
import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import com.primemedical.entity.Appointment;
import com.primemedical.enums.AppointmentStatus;

@Repository
public interface AppointmentRepository extends JpaRepository<Appointment, Long> {

    @Query(
            "SELECT a FROM Appointment a "
                    + "JOIN FETCH a.doctor d "
                    + "JOIN FETCH a.patient p "
                    + "JOIN FETCH p.user pu "
                    + "WHERE a.doctor.id = :doctorId AND a.appointmentTime BETWEEN :start AND :end")
    List<Appointment> findByDoctorIdAndAppointmentTimeBetween(
            @Param("doctorId") Long doctorId,
            @Param("start") LocalDateTime start,
            @Param("end") LocalDateTime end);

    @Query(
            "SELECT a FROM Appointment a "
                    + "JOIN FETCH a.doctor d "
                    + "JOIN FETCH a.patient p "
                    + "JOIN FETCH p.user pu "
                    + "WHERE a.patient.id = :patientId AND a.appointmentTime BETWEEN :start AND :end")
    List<Appointment> findByPatientIdAndAppointmentTimeBetween(
            @Param("patientId") Long patientId,
            @Param("start") LocalDateTime start,
            @Param("end") LocalDateTime end);

    List<Appointment> findByPatientId(Long patientId);

        List<Appointment> findByRescheduledFromId(Long appointmentId);

    boolean existsByDoctorIdAndAppointmentTimeAndStatusNot(
            Long doctorId, LocalDateTime appointmentTime, AppointmentStatus status);

    boolean existsByConfirmationCode(String confirmationCode);

    @Query(
            "SELECT a FROM Appointment a "
                    + "JOIN FETCH a.doctor d "
                    + "JOIN FETCH a.patient p "
                    + "JOIN FETCH p.user pu "
                    + "WHERE (:doctorId IS NULL OR a.doctor.id = :doctorId) "
                    + "AND (:status IS NULL OR a.status = :status) "
                    + "AND (:startDate IS NULL OR a.appointmentTime >= :startDate) "
                    + "AND (:endDate IS NULL OR a.appointmentTime <= :endDate)")
    List<Appointment> findFilteredAppointments(
            @Param("doctorId") Long doctorId,
            @Param("status") com.primemedical.enums.AppointmentStatus status,
            @Param("startDate") LocalDateTime startDate,
            @Param("endDate") LocalDateTime endDate);
}
