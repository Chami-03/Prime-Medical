package com.primemedical.repository;

import com.primemedical.entity.InventoryStockHistory;
import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface InventoryStockHistoryRepository
        extends JpaRepository<InventoryStockHistory, Long> {

    List<InventoryStockHistory> findByInventoryItem_IdOrderByCreatedAtDesc(
            Long inventoryItemId, org.springframework.data.domain.Pageable pageable);

    List<InventoryStockHistory> findTop5ByOrderByCreatedAtDesc();
}
