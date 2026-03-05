package com.medcenter.dto.response;

import java.time.LocalDateTime;
import lombok.*;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class InventoryStockHistoryResponse {

    private Long id;
    private Integer quantityChange;
    private Integer quantityAfter;
    private String reason;
    private String note;
    private Long prescriptionId;
    private String performedByName;
    private LocalDateTime createdAt;
}
