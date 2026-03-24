package com.primemedical.repository;

import com.primemedical.entity.StaffProfile;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface StaffProfileRepository extends JpaRepository<StaffProfile, Long> {

    Optional<StaffProfile> findByUserId(Long userId);
}
