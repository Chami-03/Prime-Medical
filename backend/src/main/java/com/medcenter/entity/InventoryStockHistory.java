package com.medcenter.entity;

import jakarta.persistence.*;
import java.time.LocalDateTime;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;

@Entity
@Table(
        name = "inventory_stock_history",
        indexes = {
            @Index(name = "idx_stock_history_item", columnList = "inventory_item_id"),
            @Index(name = "idx_stock_history_date", columnList = "created_at")
        })
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class InventoryStockHistory {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "inventory_item_id", nullable = false)
    private InventoryItem inventoryItem;

    @Column(nullable = false)
    private Integer quantityChange; // positive = added, negative = deducted

    @Column(nullable = false)
    private Integer quantityAfter;

    @Column(length = 50)
    private String reason; // New Purchase, Return, Damage Adjustment, Dispensed, etc.

    @Column(columnDefinition = "TEXT")
    private String note;

    @Column(name = "prescription_id")
    private Long prescriptionId;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id")
    private User performedBy;

    @CreationTimestamp
    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;
}
