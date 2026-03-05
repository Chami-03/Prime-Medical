package com.medcenter.entity;

import jakarta.persistence.*;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

@Entity
@Table(
        name = "inventory_items",
        indexes = {
            @Index(name = "idx_inv_drug", columnList = "drug_name"),
            @Index(name = "idx_inv_expiry", columnList = "expiry_date")
        })
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class InventoryItem {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "drug_name", nullable = false, length = 200)
    private String drugName;

    @Column(name = "generic_name", length = 200)
    private String genericName;

    @Column(name = "batch_number", length = 100)
    private String batchNumber;

    @Column(nullable = false)
    @Builder.Default
    private Integer quantity = 0;

    @Column(length = 50)
    @Builder.Default
    private String unit = "tablets";

    @Column(name = "unit_cost", precision = 10, scale = 2)
    private BigDecimal unitCost;

    @Column(name = "selling_price", precision = 10, scale = 2)
    private BigDecimal sellingPrice;

    @Column(length = 200)
    private String supplier;

    @Column(name = "expiry_date", nullable = false)
    private LocalDate expiryDate;

    @Column(name = "low_stock_threshold")
    @Builder.Default
    private Integer lowStockThreshold = 10;

    @Column(length = 100)
    private String category;

    @Column(columnDefinition = "TEXT")
    private String description;

    @Column(name = "purchase_price", precision = 12, scale = 2)
    private java.math.BigDecimal purchasePrice;

    @Column(name = "storage_location", length = 100)
    private String storageLocation;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "supplier_id")
    private Supplier supplierEntity;

    @Column(name = "is_archived")
    @Builder.Default
    private Boolean isArchived = false;

    @Column(name = "archived_reason", length = 200)
    private String archivedReason;

    @Column(name = "archived_at")
    private java.time.LocalDateTime archivedAt;

    @CreationTimestamp
    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at")
    private LocalDateTime updatedAt;
}
