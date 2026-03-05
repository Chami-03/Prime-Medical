package com.medcenter.repository;

import com.medcenter.entity.PatientAllergy;
import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface PatientAllergyRepository extends JpaRepository<PatientAllergy, Long> {

    List<PatientAllergy> findByPatientId(Long patientId);
}
