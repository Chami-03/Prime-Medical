package com.primemedical.dto.response;

import java.time.LocalDate;
import java.util.List;
import lombok.*;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class InventoryAlertsResponse {

    private int lowStockCount;
    private int expiringCount;
    private List<AlertItem> lowStockItems;
    private List<AlertItem> expiringItems;

    @Getter
    @Setter
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class AlertItem {
        private Long id;
        private String itemName;
        private Integer quantity;
        private Integer threshold;
        private LocalDate expiryDate;
        private String batchNumber;
    }
}
