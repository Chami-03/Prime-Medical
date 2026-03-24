package com.primemedical.dto.response;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;
import lombok.*;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class InventoryReportResponse {

    private String reportType; // STOCK_SUMMARY, USAGE, EXPIRY, LOW_STOCK
    private List<ReportRow> rows;
    private BigDecimal totalValue;
    private int totalItems;

    @Getter
    @Setter
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class ReportRow {
        private Long id;
        private String itemName;
        private String category;
        private Integer quantity;
        private String unit;
        private BigDecimal unitPrice;
        private BigDecimal totalValue;
        private LocalDate expiryDate;
        private String batchNumber;
        private String supplier;
        private Integer dispensedQty; // for usage report
    }
}
