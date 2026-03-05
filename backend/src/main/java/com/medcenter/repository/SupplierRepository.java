package com.medcenter.repository;

import com.medcenter.entity.Supplier;
import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface SupplierRepository extends JpaRepository<Supplier, Long> {

    List<Supplier> findByNameContainingIgnoreCase(String keyword);

    List<Supplier> findByContactPersonContainingIgnoreCase(String keyword);
}
