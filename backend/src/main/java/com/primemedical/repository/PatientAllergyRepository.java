package com.primemedical.repository;

import com.primemedical.entity.PatientAllergy;
import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface PatientAllergyRepository extends JpaRepository<PatientAllergy, Long> {

    List<PatientAllergy> findByPatientId(Long patientId);

    java.util.Optional<PatientAllergy> findByIdAndPatientId(Long id, Long patientId);
}
