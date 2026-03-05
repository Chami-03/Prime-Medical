package com.medcenter.dto.request;

import java.math.BigDecimal;
import java.time.LocalDate;
import lombok.*;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class InventoryItemRequest {

    private String drugName;
    private String genericName;
    private String category;
    private String description;
    private Integer quantityAdded;
    private BigDecimal unitPrice; // cost per unit
    private BigDecimal sellingPrice; // selling price per unit
    private BigDecimal purchasePrice;
    private LocalDate expiryDate;
    private String batchNumber;
    private Long supplierId;
    private String supplierName; // fallback when supplier not in list
    private String storageLocation;
    private String unit;
    private Integer lowStockThreshold;
}
