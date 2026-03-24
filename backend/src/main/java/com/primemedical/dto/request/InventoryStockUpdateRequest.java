package com.primemedical.dto.request;

import java.math.BigDecimal;
import java.time.LocalDate;
import lombok.*;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class InventoryStockUpdateRequest {

    private Integer quantityChange; // + to add, - to subtract
    private String reason; // New Purchase, Return, Damage Adjustment
    private String note;
    private BigDecimal unitCost;
    private BigDecimal sellingPrice;
    private LocalDate expiryDate;
    private String batchNumber;
    private Long supplierId;
    private String supplierName;
    private String storageLocation;
}
