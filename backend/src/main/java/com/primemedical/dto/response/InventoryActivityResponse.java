package com.primemedical.dto.response;

import java.time.LocalDateTime;
import lombok.*;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class InventoryActivityResponse {

    private Long id;
    private String itemName;
    private Integer quantityChange;
    private Integer quantityAfter;
    private String reason;
    private String note;
    private Long prescriptionId;
    private String performedByName;
    private LocalDateTime createdAt;
}
