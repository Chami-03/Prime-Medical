package com.primemedical.repository;

import com.primemedical.entity.Patient;
import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

@Repository
public interface PatientRepository extends JpaRepository<Patient, Long> {

    Optional<Patient> findByPatientNumber(String patientNumber);

    Optional<Patient> findByUserId(Long userId);

    @Query(
            "SELECT p FROM Patient p JOIN FETCH p.user u LEFT JOIN FETCH u.roles WHERE "
                    + "LOWER(u.firstName) LIKE LOWER(CONCAT('%', :keyword, '%')) OR "
                    + "LOWER(u.lastName) LIKE LOWER(CONCAT('%', :keyword, '%')) OR "
                    + "u.phone LIKE CONCAT('%', :keyword, '%') OR "
                    + "p.nicNumber LIKE CONCAT('%', :keyword, '%')")
    List<Patient> searchByNameOrPhoneOrNic(@Param("keyword") String keyword);
}
