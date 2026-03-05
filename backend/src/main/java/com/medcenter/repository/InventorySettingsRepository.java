package com.medcenter.repository;

import com.medcenter.entity.InventorySettings;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface InventorySettingsRepository extends JpaRepository<InventorySettings, Long> {

    Optional<InventorySettings> findByKey(String key);
}
