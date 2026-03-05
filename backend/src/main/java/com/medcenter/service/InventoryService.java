package com.medcenter.service;

import com.medcenter.dto.request.InventoryItemRequest;
import com.medcenter.dto.request.InventoryStockUpdateRequest;
import com.medcenter.dto.response.InventoryActivityResponse;
import com.medcenter.dto.response.InventoryAlertsResponse;
import com.medcenter.dto.response.InventoryReportResponse;
import com.medcenter.dto.response.InventoryStockHistoryResponse;
import com.medcenter.entity.*;
import com.medcenter.exception.BadRequestException;
import com.medcenter.exception.ResourceNotFoundException;
import com.medcenter.repository.*;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
@Slf4j
public class InventoryService {

        private final InventoryItemRepository inventoryItemRepository;
        private final InventoryStockHistoryRepository stockHistoryRepository;
        private final InventorySettingsRepository settingsRepository;
        private final SupplierRepository supplierRepository;
        private final UserRepository userRepository;

        private static final int DEFAULT_LOW_STOCK = 10;
        private static final int DEFAULT_EXPIRY_DAYS = 30;

        @Transactional(readOnly = true)
        public List<InventoryItem> getAllItems() {
                return inventoryItemRepository.findByIsArchivedFalse();
        }

        @Transactional(readOnly = true)
        public List<InventoryItem> getArchivedItems() {
                return inventoryItemRepository.findByIsArchivedTrue();
        }

        @Transactional(readOnly = true)
        public List<InventoryItem> searchItems(
                        String keyword,
                        String category,
                        String supplier,
                        String expiryRange,
                        String stockLevel,
                        LocalDate dateAddedFrom) {
                List<InventoryItem> base = keyword != null && !keyword.trim().isEmpty()
                                ? inventoryItemRepository.searchByNameCategoryOrSupplier(keyword)
                                : inventoryItemRepository.findByIsArchivedFalse();

                if (category != null && !category.isEmpty()) {
                        base = base.stream()
                                        .filter(i -> category.equalsIgnoreCase(i.getCategory()))
                                        .collect(Collectors.toList());
                }
                if (supplier != null && !supplier.isEmpty()) {
                        base = base.stream()
                                        .filter(
                                                        i -> {
                                                                String s = i.getSupplierEntity() != null
                                                                                ? i.getSupplierEntity().getName()
                                                                                : i.getSupplier();
                                                                return s != null
                                                                                && s.toLowerCase().contains(
                                                                                                supplier.toLowerCase());
                                                        })
                                        .collect(Collectors.toList());
                }
                if (expiryRange != null && !expiryRange.isEmpty()) {
                        LocalDate from = LocalDate.now();
                        LocalDate to = switch (expiryRange) {
                                case "7" -> from.plusDays(7);
                                case "30" -> from.plusDays(30);
                                case "90" -> from.plusDays(90);
                                default -> from.plusDays(30);
                        };
                        base = base.stream()
                                        .filter(
                                                        i -> {
                                                                LocalDate exp = i.getExpiryDate();
                                                                return exp != null
                                                                                && !exp.isBefore(from)
                                                                                && !exp.isAfter(to);
                                                        })
                                        .collect(Collectors.toList());
                }
                if (stockLevel != null && !stockLevel.isEmpty()) {
                        base = base.stream()
                                        .filter(
                                                        i -> {
                                                                int th = valueOrDefault(
                                                                                i.getLowStockThreshold(),
                                                                                DEFAULT_LOW_STOCK);
                                                                int quantity = valueOrDefault(i.getQuantity(), 0);
                                                                return switch (stockLevel) {
                                                                        case "low" -> quantity <= th;
                                                                        case "medium" -> quantity > th
                                                                                        && quantity <= th * 3;
                                                                        case "high" -> quantity > th * 3;
                                                                        default -> true;
                                                                };
                                                        })
                                        .collect(Collectors.toList());
                }
                if (dateAddedFrom != null) {
                        base = base.stream()
                                        .filter(
                                                        i -> i.getCreatedAt() != null
                                                                        && !i.getCreatedAt()
                                                                                        .toLocalDate()
                                                                                        .isBefore(dateAddedFrom))
                                        .collect(Collectors.toList());
                }
                return base;
        }

        @Transactional
        public InventoryItem addItem(InventoryItemRequest request, Long userId) {
                validateAddRequest(request);

                if (request.getBatchNumber() != null && !request.getBatchNumber().trim().isEmpty()) {
                        if (inventoryItemRepository.existsByBatchNumber(request.getBatchNumber())) {
                                throw new BadRequestException(
                                                "Batch number already exists: " + request.getBatchNumber());
                        }
                }

                Supplier supplier = null;
                String supplierName = request.getSupplierName();
                if (request.getSupplierId() != null) {
                        supplier = supplierRepository.findById(request.getSupplierId()).orElse(null);
                        if (supplier != null)
                                supplierName = supplier.getName();
                }

                int qty = Math.max(valueOrDefault(request.getQuantityAdded(), 0), 0);

                InventoryItem item = InventoryItem.builder()
                                .drugName(request.getDrugName())
                                .genericName(request.getGenericName())
                                .category(request.getCategory())
                                .description(request.getDescription())
                                .quantity(qty)
                                .unit(request.getUnit() != null ? request.getUnit() : "tablets")
                                .unitCost(request.getUnitPrice())
                                .sellingPrice(
                                                request.getSellingPrice() != null
                                                                ? request.getSellingPrice()
                                                                : request.getUnitPrice())
                                .purchasePrice(request.getPurchasePrice())
                                .expiryDate(request.getExpiryDate())
                                .batchNumber(request.getBatchNumber())
                                .supplier(supplierName)
                                .supplierEntity(supplier)
                                .storageLocation(request.getStorageLocation())
                                .lowStockThreshold(valueOrDefault(request.getLowStockThreshold(), DEFAULT_LOW_STOCK))
                                .isArchived(false)
                                .build();

                item = inventoryItemRepository.save(item);

                if (qty > 0) {
                        User user = userId != null ? userRepository.findById(userId).orElse(null) : null;
                        createStockHistory(item, qty, qty, "New Purchase", "Item added", null, user);
                }

                log.info("Inventory item added: {} (qty: {})", item.getDrugName(), qty);
                return item;
        }

        @Transactional
        public InventoryItem addItemLegacy(InventoryItem item) {
                validateInventoryItem(item);
                if (item.getBatchNumber() != null && !item.getBatchNumber().isEmpty()) {
                        if (inventoryItemRepository.existsByBatchNumber(item.getBatchNumber())) {
                                throw new BadRequestException(
                                                "Batch number already exists: " + item.getBatchNumber());
                        }
                }
                InventoryItem saved = inventoryItemRepository.save(item);
                if (saved.getQuantity() != null && saved.getQuantity() > 0) {
                        createStockHistory(
                                        saved,
                                        saved.getQuantity(),
                                        saved.getQuantity(),
                                        "New Purchase",
                                        "Item added",
                                        null,
                                        null);
                }
                return saved;
        }

        @Transactional
        public InventoryItem updateItem(Long id, InventoryItem updated) {
                validateInventoryItem(updated);
                InventoryItem existing = inventoryItemRepository
                                .findById(id)
                                .orElseThrow(
                                                () -> new ResourceNotFoundException("InventoryItem", "id", id));
                if (existing.getIsArchived() != null && existing.getIsArchived()) {
                        throw new BadRequestException("Cannot update archived item");
                }

                existing.setGenericName(updated.getGenericName());
                existing.setQuantity(updated.getQuantity());
                existing.setUnit(updated.getUnit());
                existing.setUnitCost(updated.getUnitCost());
                existing.setSellingPrice(updated.getSellingPrice());
                existing.setSupplier(updated.getSupplier());
                existing.setExpiryDate(updated.getExpiryDate());
                existing.setLowStockThreshold(updated.getLowStockThreshold());
                existing.setCategory(updated.getCategory());
                existing.setDescription(updated.getDescription());
                existing.setPurchasePrice(updated.getPurchasePrice());
                existing.setStorageLocation(updated.getStorageLocation());

                return inventoryItemRepository.save(existing);
        }

        @Transactional
        public InventoryItem adjustStock(Long id, InventoryStockUpdateRequest request, Long userId) {
                InventoryItem item = inventoryItemRepository
                                .findById(id)
                                .orElseThrow(
                                                () -> new ResourceNotFoundException("InventoryItem", "id", id));
                if (item.getIsArchived() != null && item.getIsArchived()) {
                        throw new BadRequestException("Cannot adjust archived item");
                }

                int change = valueOrDefault(request.getQuantityChange(), 0);
                int current = valueOrDefault(item.getQuantity(), 0);
                int newQty = current + change;

                if (newQty < 0) {
                        throw new BadRequestException(
                                        "Quantity cannot be negative. Current: " + current + ", Change: " + change);
                }

                if (request.getUnitCost() != null)
                        item.setUnitCost(request.getUnitCost());
                if (request.getSellingPrice() != null)
                        item.setSellingPrice(request.getSellingPrice());
                if (request.getExpiryDate() != null)
                        item.setExpiryDate(request.getExpiryDate());
                if (request.getBatchNumber() != null)
                        item.setBatchNumber(request.getBatchNumber());
                if (request.getStorageLocation() != null)
                        item.setStorageLocation(request.getStorageLocation());
                if (request.getSupplierId() != null) {
                        Supplier s = supplierRepository.findById(request.getSupplierId()).orElse(null);
                        if (s != null) {
                                item.setSupplierEntity(s);
                                item.setSupplier(s.getName());
                        }
                } else if (request.getSupplierName() != null) {
                        item.setSupplier(request.getSupplierName());
                }

                item.setQuantity(newQty);
                item = inventoryItemRepository.save(item);

                User user = userId != null ? userRepository.findById(userId).orElse(null) : null;
                createStockHistory(
                                item,
                                change,
                                newQty,
                                request.getReason() != null ? request.getReason() : "Adjustment",
                                request.getNote(),
                                null,
                                user);

                log.info("Stock adjusted: {} (id: {}) change: {}", item.getDrugName(), id, change);
                return item;
        }

        public void createStockHistory(
                        InventoryItem item,
                        int change,
                        int after,
                        String reason,
                        String note,
                        Long prescriptionId,
                        User user) {
                InventoryStockHistory h = InventoryStockHistory.builder()
                                .inventoryItem(item)
                                .quantityChange(change)
                                .quantityAfter(after)
                                .reason(reason)
                                .note(note)
                                .prescriptionId(prescriptionId)
                                .performedBy(user)
                                .build();
                stockHistoryRepository.save(h);
        }

        @Transactional(readOnly = true)
        public List<InventoryActivityResponse> getRecentActivity(int limit) {
                List<InventoryStockHistory> history = stockHistoryRepository.findTop5ByOrderByCreatedAtDesc();
                return history.stream()
                                .map(
                                                h -> {
                                                        String itemName = h.getInventoryItem() != null
                                                                        ? h.getInventoryItem().getDrugName()
                                                                        : "Unknown";
                                                        String userName = h.getPerformedBy() != null
                                                                        ? h.getPerformedBy().getFirstName()
                                                                                        + " "
                                                                                        + h.getPerformedBy()
                                                                                                        .getLastName()
                                                                        : "System";
                                                        return InventoryActivityResponse.builder()
                                                                        .id(h.getId())
                                                                        .itemName(itemName)
                                                                        .quantityChange(h.getQuantityChange())
                                                                        .quantityAfter(h.getQuantityAfter())
                                                                        .reason(h.getReason())
                                                                        .note(h.getNote())
                                                                        .prescriptionId(h.getPrescriptionId())
                                                                        .performedByName(userName)
                                                                        .createdAt(h.getCreatedAt())
                                                                        .build();
                                                })
                                .collect(Collectors.toList());
        }

        @Transactional(readOnly = true)
        public List<InventoryStockHistoryResponse> getItemHistory(
                        Long itemId, LocalDate from, LocalDate to) {
                List<InventoryStockHistory> list = stockHistoryRepository.findByInventoryItem_IdOrderByCreatedAtDesc(
                                itemId, PageRequest.of(0, 100));
                return list.stream()
                                .filter(
                                                h -> (from == null
                                                                || (h.getCreatedAt() != null
                                                                                && !h.getCreatedAt()
                                                                                                .toLocalDate()
                                                                                                .isBefore(from)))
                                                                && (to == null
                                                                                || (h.getCreatedAt() != null
                                                                                                && !h.getCreatedAt()
                                                                                                                .toLocalDate()
                                                                                                                .isAfter(to))))
                                .map(
                                                h -> InventoryStockHistoryResponse.builder()
                                                                .id(h.getId())
                                                                .quantityChange(h.getQuantityChange())
                                                                .quantityAfter(h.getQuantityAfter())
                                                                .reason(h.getReason())
                                                                .note(h.getNote())
                                                                .prescriptionId(h.getPrescriptionId())
                                                                .performedByName(
                                                                                h.getPerformedBy() != null
                                                                                                ? h.getPerformedBy()
                                                                                                                .getFirstName()
                                                                                                                + " "
                                                                                                                + h.getPerformedBy()
                                                                                                                                .getLastName()
                                                                                                : "System")
                                                                .createdAt(h.getCreatedAt())
                                                                .build())
                                .collect(Collectors.toList());
        }

        @Transactional(readOnly = true)
        public InventoryItem getItemById(Long id) {
                return inventoryItemRepository
                                .findById(id)
                                .orElseThrow(() -> new ResourceNotFoundException("InventoryItem", "id", id));
        }

        @Transactional(readOnly = true)
        public List<InventoryItem> getLowStockItems() {
                return inventoryItemRepository.findByIsArchivedFalse().stream()
                                .filter(
                                                i -> valueOrDefault(i.getQuantity(), 0) <= valueOrDefault(
                                                                i.getLowStockThreshold(), DEFAULT_LOW_STOCK))
                                .collect(Collectors.toList());
        }

        @Transactional(readOnly = true)
        public List<InventoryItem> getExpiringItems(LocalDate beforeDate) {
                LocalDate today = LocalDate.now();
                LocalDate toDate = beforeDate != null ? beforeDate : today.plusDays(getExpiryAlertDays());
                return inventoryItemRepository.findByExpiryDateBetween(today, toDate).stream()
                                .filter(i -> i.getIsArchived() == null || !i.getIsArchived())
                                .collect(Collectors.toList());
        }

        @Transactional(readOnly = true)
        public InventoryAlertsResponse getAlerts() {
                List<InventoryItem> lowStock = getLowStockItems();
                List<InventoryItem> expiring = getExpiringItems(null);

                List<InventoryAlertsResponse.AlertItem> lowItems = lowStock.stream()
                                .map(
                                                i -> InventoryAlertsResponse.AlertItem.builder()
                                                                .id(i.getId())
                                                                .itemName(i.getDrugName())
                                                                .quantity(i.getQuantity())
                                                                .threshold(valueOrDefault(
                                                                                i.getLowStockThreshold(),
                                                                                DEFAULT_LOW_STOCK))
                                                                .expiryDate(i.getExpiryDate())
                                                                .batchNumber(i.getBatchNumber())
                                                                .build())
                                .collect(Collectors.toList());

                List<InventoryAlertsResponse.AlertItem> expItems = expiring.stream()
                                .map(
                                                i -> InventoryAlertsResponse.AlertItem.builder()
                                                                .id(i.getId())
                                                                .itemName(i.getDrugName())
                                                                .quantity(i.getQuantity())
                                                                .threshold(valueOrDefault(
                                                                                i.getLowStockThreshold(),
                                                                                DEFAULT_LOW_STOCK))
                                                                .expiryDate(i.getExpiryDate())
                                                                .batchNumber(i.getBatchNumber())
                                                                .build())
                                .collect(Collectors.toList());

                return InventoryAlertsResponse.builder()
                                .lowStockCount(lowStock.size())
                                .expiringCount(expiring.size())
                                .lowStockItems(lowItems)
                                .expiringItems(expItems)
                                .build();
        }

        @Transactional(readOnly = true)
        public List<InventoryItem> searchByDrugName(String keyword) {
                return inventoryItemRepository.findByDrugNameContainingIgnoreCase(keyword).stream()
                                .filter(i -> i.getIsArchived() == null || !i.getIsArchived())
                                .collect(Collectors.toList());
        }

        @Transactional
        public void deleteItem(Long id) {
                deleteItem(id, null);
        }

        @Transactional
        public void deleteItem(Long id, String reason) {
                InventoryItem item = inventoryItemRepository
                                .findById(id)
                                .orElseThrow(
                                                () -> new ResourceNotFoundException("InventoryItem", "id", id));

                if (item.getQuantity() != null
                                && item.getQuantity() > 0
                                && (reason == null || reason.isEmpty())) {
                        throw new BadRequestException(
                                        "Cannot delete item with active stock. Archive with reason instead.");
                }

                item.setIsArchived(true);
                item.setArchivedReason(reason != null ? reason : "Deleted");
                item.setArchivedAt(LocalDateTime.now());
                inventoryItemRepository.save(item);
                log.info("Inventory item archived: id {} reason: {}", id, reason);
        }

        @Transactional
        public void deleteItemPermanent(Long id) {
                if (!inventoryItemRepository.existsById(id)) {
                        throw new ResourceNotFoundException("InventoryItem", "id", id);
                }
                inventoryItemRepository.deleteById(id);
                log.info("Inventory item permanently deleted: id {}", id);
        }

        private void validateAddRequest(InventoryItemRequest request) {
                if (request.getDrugName() == null || request.getDrugName().trim().isEmpty()) {
                        throw new BadRequestException("Item name is required.");
                }
                if (request.getExpiryDate() != null && request.getExpiryDate().isBefore(LocalDate.now())) {
                        throw new BadRequestException("Expiry date cannot be in the past.");
                }
                if (request.getQuantityAdded() != null && request.getQuantityAdded() < 0) {
                        throw new BadRequestException("Quantity must be positive.");
                }
        }

        private void validateInventoryItem(InventoryItem item) {
                if (item.getQuantity() != null && item.getQuantity() < 0) {
                        throw new BadRequestException("Quantity must be a positive number.");
                }
                if (item.getSellingPrice() != null && item.getSellingPrice().doubleValue() < 0) {
                        throw new BadRequestException("Selling price must be a positive number.");
                }
                if (item.getExpiryDate() != null && item.getExpiryDate().isBefore(LocalDate.now())) {
                        throw new BadRequestException("Expiry date cannot be in the past.");
                }
        }

        private int getExpiryAlertDays() {
                return settingsRepository
                                .findByKey(InventorySettings.EXPIRY_ALERT_DAYS)
                                .map(
                                                s -> {
                                                        try {
                                                                return Integer.parseInt(s.getValue());
                                                        } catch (NumberFormatException e) {
                                                                return DEFAULT_EXPIRY_DAYS;
                                                        }
                                                })
                                .orElse(DEFAULT_EXPIRY_DAYS);
        }

        private int valueOrDefault(Integer value, int fallback) {
                return value != null ? value : fallback;
        }

        @Transactional(readOnly = true)
        public InventoryReportResponse getStockSummaryReport() {
                List<InventoryItem> items = getAllItems();
                List<InventoryReportResponse.ReportRow> rows = items.stream()
                                .map(
                                                i -> {
                                                        BigDecimal val = (i.getSellingPrice() != null
                                                                        && i.getQuantity() != null)
                                                                                        ? i.getSellingPrice()
                                                                                                        .multiply(
                                                                                                                        java.math.BigDecimal
                                                                                                                                        .valueOf(
                                                                                                                                                        i.getQuantity()))
                                                                                        : java.math.BigDecimal.ZERO;
                                                        return InventoryReportResponse.ReportRow.builder()
                                                                        .id(i.getId())
                                                                        .itemName(i.getDrugName())
                                                                        .category(i.getCategory())
                                                                        .quantity(i.getQuantity())
                                                                        .unit(i.getUnit())
                                                                        .unitPrice(i.getSellingPrice())
                                                                        .totalValue(val)
                                                                        .expiryDate(i.getExpiryDate())
                                                                        .batchNumber(i.getBatchNumber())
                                                                        .supplier(
                                                                                        i.getSupplierEntity() != null
                                                                                                        ? i.getSupplierEntity()
                                                                                                                        .getName()
                                                                                                        : i.getSupplier())
                                                                        .build();
                                                })
                                .collect(Collectors.toList());
                BigDecimal total = rows.stream()
                                .map(
                                                r -> r.getTotalValue() != null
                                                                ? r.getTotalValue()
                                                                : java.math.BigDecimal.ZERO)
                                .reduce(java.math.BigDecimal.ZERO, java.math.BigDecimal::add);
                return InventoryReportResponse.builder()
                                .reportType("STOCK_SUMMARY")
                                .rows(rows)
                                .totalValue(total)
                                .totalItems(rows.size())
                                .build();
        }

        @Transactional(readOnly = true)
        public InventoryReportResponse getExpiryReport(LocalDate beforeDate) {
                List<InventoryItem> items = getExpiringItems(beforeDate);
                List<InventoryReportResponse.ReportRow> rows = items.stream()
                                .map(
                                                i -> InventoryReportResponse.ReportRow.builder()
                                                                .id(i.getId())
                                                                .itemName(i.getDrugName())
                                                                .category(i.getCategory())
                                                                .quantity(i.getQuantity())
                                                                .unit(i.getUnit())
                                                                .unitPrice(i.getSellingPrice())
                                                                .expiryDate(i.getExpiryDate())
                                                                .batchNumber(i.getBatchNumber())
                                                                .supplier(
                                                                                i.getSupplierEntity() != null
                                                                                                ? i.getSupplierEntity()
                                                                                                                .getName()
                                                                                                : i.getSupplier())
                                                                .build())
                                .collect(Collectors.toList());
                return InventoryReportResponse.builder()
                                .reportType("EXPIRY")
                                .rows(rows)
                                .totalItems(rows.size())
                                .build();
        }

        @Transactional(readOnly = true)
        public InventoryReportResponse getLowStockReport() {
                List<InventoryItem> items = getLowStockItems();
                List<InventoryReportResponse.ReportRow> rows = items.stream()
                                .map(
                                                i -> InventoryReportResponse.ReportRow.builder()
                                                                .id(i.getId())
                                                                .itemName(i.getDrugName())
                                                                .category(i.getCategory())
                                                                .quantity(i.getQuantity())
                                                                .unit(i.getUnit())
                                                                .unitPrice(i.getSellingPrice())
                                                                .expiryDate(i.getExpiryDate())
                                                                .batchNumber(i.getBatchNumber())
                                                                .supplier(
                                                                                i.getSupplierEntity() != null
                                                                                                ? i.getSupplierEntity()
                                                                                                                .getName()
                                                                                                : i.getSupplier())
                                                                .build())
                                .collect(Collectors.toList());
                return InventoryReportResponse.builder()
                                .reportType("LOW_STOCK")
                                .rows(rows)
                                .totalItems(rows.size())
                                .build();
        }
}
