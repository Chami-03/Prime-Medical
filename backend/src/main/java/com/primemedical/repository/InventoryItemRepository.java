package com.primemedical.repository;

import java.time.LocalDate;
import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import com.primemedical.entity.InventoryItem;

@Repository
public interface InventoryItemRepository extends JpaRepository<InventoryItem, Long> {

    /** Items at or below their low-stock threshold */
    List<InventoryItem> findByQuantityLessThanEqual(Integer threshold);

    /** Items expiring before a given date */
    List<InventoryItem> findByExpiryDateBefore(LocalDate date);

    List<InventoryItem> findByDrugNameContainingIgnoreCase(String keyword);

    boolean existsByBatchNumber(String batchNumber);

    boolean existsByDrugName(String drugName);

        @Query("SELECT i FROM InventoryItem i LEFT JOIN FETCH i.supplierEntity WHERE i.isArchived = false")
        List<InventoryItem> findByIsArchivedFalse();

        @Query("SELECT i FROM InventoryItem i LEFT JOIN FETCH i.supplierEntity WHERE i.isArchived = true")
        List<InventoryItem> findByIsArchivedTrue();

    @Query(
            "SELECT i FROM InventoryItem i LEFT JOIN FETCH i.supplierEntity s WHERE i.isArchived = false AND "
                    + "(LOWER(i.drugName) LIKE LOWER(CONCAT('%', :keyword, '%')) OR "
                    + "LOWER(i.category) LIKE LOWER(CONCAT('%', :keyword, '%')) OR "
                + "LOWER(COALESCE(i.supplier, s.name, '')) LIKE LOWER(CONCAT('%', :keyword, '%')))")
    List<InventoryItem> searchByNameCategoryOrSupplier(@Param("keyword") String keyword);

    List<InventoryItem> findByCategoryAndIsArchivedFalse(String category);

    List<InventoryItem> findBySupplierAndIsArchivedFalse(String supplier);

    List<InventoryItem> findByExpiryDateBetween(LocalDate from, LocalDate to);

    @Query("SELECT i FROM InventoryItem i LEFT JOIN FETCH i.supplierEntity WHERE i.id = :id")
    java.util.Optional<InventoryItem> findByIdWithSupplier(@Param("id") Long id);
}
