package com.primemedical.dto.response;

import com.primemedical.enums.BillStatus;
import com.primemedical.enums.ItemType;
import com.primemedical.enums.PaymentMethod;
import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class BillResponse {

    private Long id;

    private String invoiceNumber;

    private Long patientId;
    private String patientName;

    private Long consultationId;

    private BigDecimal subtotal;

    private BigDecimal discount;

    private BigDecimal taxAmount;

    private BigDecimal netAmount;

    private BillStatus status;

    private String createdByName;

    private LocalDateTime createdAt;

    private LocalDateTime updatedAt;

    private List<LineItemInfo> lineItems;

    private List<PaymentInfo> payments;

    // ── Nested DTOs ──────────────────────────────────────────────

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class LineItemInfo {
        private Long id;
        private String description;
        private ItemType itemType;
        private Integer quantity;
        private BigDecimal unitPrice;
        private BigDecimal totalPrice;
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class PaymentInfo {
        private Long id;
        private BigDecimal amount;
        private PaymentMethod paymentMethod;
        private String paymentReference;
        private String processedByName;
        private LocalDateTime paidAt;
        private String notes;
    }
}
