package com.primemedical.controller;

import com.primemedical.dto.request.InventoryItemRequest;
import com.primemedical.dto.request.InventoryStockUpdateRequest;
import com.primemedical.dto.response.ApiResponse;
import com.primemedical.dto.response.InventoryActivityResponse;
import com.primemedical.dto.response.InventoryAlertsResponse;
import com.primemedical.dto.response.InventoryReportResponse;
import com.primemedical.dto.response.InventoryStockHistoryResponse;
import com.primemedical.entity.InventoryItem;
import com.primemedical.repository.UserRepository;
import com.primemedical.service.InventoryService;
import java.time.LocalDate;
import java.util.List;
import lombok.RequiredArgsConstructor;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/inventory")
@RequiredArgsConstructor
public class InventoryController {

    private final InventoryService inventoryService;
    private final UserRepository userRepository;

    @GetMapping
    @PreAuthorize("hasAnyRole('ADMIN','PHARMACIST','DOCTOR','NURSE')")
    public ResponseEntity<ApiResponse<List<InventoryItem>>> getAllItems(
            @RequestParam(required = false) String keyword,
            @RequestParam(required = false) String category,
            @RequestParam(required = false) String supplier,
            @RequestParam(required = false) String expiryRange,
            @RequestParam(required = false) String stockLevel,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE)
                    LocalDate dateAddedFrom) {
        List<InventoryItem> items;
        if (keyword != null
                || category != null
                || supplier != null
                || expiryRange != null
                || stockLevel != null
                || dateAddedFrom != null) {
            items =
                    inventoryService.searchItems(
                            keyword, category, supplier, expiryRange, stockLevel, dateAddedFrom);
        } else {
            items = inventoryService.getAllItems();
        }
        return ResponseEntity.ok(ApiResponse.success(items));
    }

    @GetMapping("/archived")
    @PreAuthorize("hasAnyRole('ADMIN','PHARMACIST','DOCTOR')")
    public ResponseEntity<ApiResponse<List<InventoryItem>>> getArchivedItems() {
        return ResponseEntity.ok(ApiResponse.success(inventoryService.getArchivedItems()));
    }

    @GetMapping("/activity")
    @PreAuthorize("hasAnyRole('ADMIN','PHARMACIST','DOCTOR')")
    public ResponseEntity<ApiResponse<List<InventoryActivityResponse>>> getRecentActivity() {
        return ResponseEntity.ok(ApiResponse.success(inventoryService.getRecentActivity(5)));
    }

    @GetMapping("/alerts")
    @PreAuthorize("hasAnyRole('ADMIN','PHARMACIST','DOCTOR')")
    public ResponseEntity<ApiResponse<InventoryAlertsResponse>> getAlerts() {
        return ResponseEntity.ok(ApiResponse.success(inventoryService.getAlerts()));
    }

    @GetMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN','PHARMACIST','DOCTOR','NURSE')")
    public ResponseEntity<ApiResponse<InventoryItem>> getItemById(@PathVariable Long id) {
        return ResponseEntity.ok(ApiResponse.success(inventoryService.getItemById(id)));
    }

    @GetMapping("/{id}/history")
    @PreAuthorize("hasAnyRole('ADMIN','PHARMACIST','DOCTOR')")
    public ResponseEntity<ApiResponse<List<InventoryStockHistoryResponse>>> getItemHistory(
            @PathVariable Long id,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE)
                    LocalDate from,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE)
                    LocalDate to) {
        return ResponseEntity.ok(
                ApiResponse.success(inventoryService.getItemHistory(id, from, to)));
    }

    @PostMapping
    @PreAuthorize("hasAnyRole('ADMIN','PHARMACIST','DOCTOR')")
    public ResponseEntity<ApiResponse<InventoryItem>> addItem(
            @RequestBody InventoryItemRequest request, @AuthenticationPrincipal UserDetails user) {
        Long userId = user != null ? getUserIdFromUserDetails(user) : null;
        InventoryItem saved = inventoryService.addItem(request, userId);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success("Item added successfully", saved));
    }

    @PostMapping("/legacy")
    @PreAuthorize("hasAnyRole('ADMIN','PHARMACIST','DOCTOR')")
    public ResponseEntity<ApiResponse<InventoryItem>> addItemLegacy(
            @RequestBody InventoryItem item) {
        InventoryItem saved = inventoryService.addItemLegacy(item);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success("Inventory item added", saved));
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN','PHARMACIST','DOCTOR')")
    public ResponseEntity<ApiResponse<InventoryItem>> updateItem(
            @PathVariable Long id, @RequestBody InventoryItem item) {
        InventoryItem updated = inventoryService.updateItem(id, item);
        return ResponseEntity.ok(ApiResponse.success("Inventory item updated", updated));
    }

    @PostMapping("/{id}/adjust")
    @PreAuthorize("hasAnyRole('ADMIN','PHARMACIST')")
    public ResponseEntity<ApiResponse<InventoryItem>> adjustStock(
            @PathVariable Long id,
            @RequestBody InventoryStockUpdateRequest request,
            @AuthenticationPrincipal UserDetails user) {
        Long userId = user != null ? getUserIdFromUserDetails(user) : null;
        InventoryItem updated = inventoryService.adjustStock(id, request, userId);
        return ResponseEntity.ok(ApiResponse.success("Stock updated", updated));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN','PHARMACIST','DOCTOR')")
    public ResponseEntity<ApiResponse<Void>> deleteItem(
            @PathVariable Long id, @RequestParam(required = false) String reason) {
        inventoryService.deleteItem(id, reason);
        return ResponseEntity.ok(ApiResponse.success("Inventory item archived", null));
    }

    @GetMapping("/low-stock")
    @PreAuthorize("hasAnyRole('ADMIN','PHARMACIST','DOCTOR')")
    public ResponseEntity<ApiResponse<List<InventoryItem>>> getLowStockItems() {
        List<InventoryItem> items = inventoryService.getLowStockItems();
        return ResponseEntity.ok(ApiResponse.success(items));
    }

    @GetMapping("/search")
    @PreAuthorize("hasAnyRole('ADMIN','PHARMACIST','DOCTOR','NURSE')")
    public ResponseEntity<ApiResponse<List<InventoryItem>>> searchByDrugName(
            @RequestParam String keyword) {
        List<InventoryItem> items = inventoryService.searchByDrugName(keyword);
        return ResponseEntity.ok(ApiResponse.success(items));
    }

    @GetMapping("/expiring")
    @PreAuthorize("hasAnyRole('ADMIN','PHARMACIST','DOCTOR')")
    public ResponseEntity<ApiResponse<List<InventoryItem>>> getExpiringItems(
            @RequestParam(required = false) String beforeDate) {
        LocalDate date = (beforeDate != null) ? LocalDate.parse(beforeDate) : null;
        List<InventoryItem> items = inventoryService.getExpiringItems(date);
        return ResponseEntity.ok(ApiResponse.success(items));
    }

    @GetMapping("/reports")
    @PreAuthorize("hasAnyRole('ADMIN','PHARMACIST','DOCTOR')")
    public ResponseEntity<ApiResponse<InventoryReportResponse>> getReport(
            @RequestParam String type, @RequestParam(required = false) String beforeDate) {
        InventoryReportResponse report =
                switch (type != null ? type.toUpperCase() : "STOCK") {
                    case "STOCK_SUMMARY", "STOCK" -> inventoryService.getStockSummaryReport();
                    case "EXPIRY" -> inventoryService.getExpiryReport(
                            beforeDate != null ? LocalDate.parse(beforeDate) : null);
                    case "LOW_STOCK" -> inventoryService.getLowStockReport();
                    default -> inventoryService.getStockSummaryReport();
                };
        return ResponseEntity.ok(ApiResponse.success(report));
    }

    private Long getUserIdFromUserDetails(UserDetails user) {
        if (user == null) return null;
        return userRepository
                .findByEmail(user.getUsername())
                .map(com.primemedical.entity.User::getId)
                .orElse(null);
    }
}
