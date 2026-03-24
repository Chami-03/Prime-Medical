package com.primemedical.service;

import java.time.LocalDate;
import java.util.List;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;

import com.primemedical.entity.InventoryItem;

@Service
public class AlertService {

    private static final Logger log = LoggerFactory.getLogger(AlertService.class);

    private final InventoryService inventoryService;

    public AlertService(InventoryService inventoryService) {
        this.inventoryService = inventoryService;
    }

    /**
     * Scheduled job to run every day at 08:00 AM. Checks for low stock thresholds and upcoming
     * expiries.
     */
    @Scheduled(cron = "0 0 8 * * ?")
    public void checkThresholdsAndExpiries() {
        log.info("Starting scheduled daily check for pharmacy inventory alerts...");

        // 1. Low Stock Check
        List<InventoryItem> lowStockItems = inventoryService.getLowStockItems();
        if (!lowStockItems.isEmpty()) {
            log.warn("ALERT: Found {} items running low on stock.", lowStockItems.size());
            for (InventoryItem item : lowStockItems) {
                log.warn(
                        " - {} (Batch: {}): Remaining Qty: {} (Threshold: {})",
                        item.getDrugName(),
                        item.getBatchNumber(),
                        item.getQuantity(),
                        item.getLowStockThreshold());
                // Email functionality to Pharmacist can be integrated here using JavaMailSender.
            }
        } else {
            log.info("Stock levels are healthy. No items below their thresholds.");
        }

        // 2. Expiry Check (e.g., within 30 days)
        LocalDate thirtyDaysFromNow = LocalDate.now().plusDays(30);
        List<InventoryItem> expiringItems = inventoryService.getExpiringItems(thirtyDaysFromNow);

        if (!expiringItems.isEmpty()) {
            log.warn(
                    "ALERT: Found {} items approaching expiry date before {}.",
                    expiringItems.size(),
                    thirtyDaysFromNow);
            for (InventoryItem item : expiringItems) {
                log.warn(
                        " - {} (Batch: {}): Expiry Date: {} (Qty: {})",
                        item.getDrugName(),
                        item.getBatchNumber(),
                        item.getExpiryDate(),
                        item.getQuantity());
                // Email functionality to Pharmacist can be integrated here using JavaMailSender.
            }
        } else {
            log.info("No items expiring within the next 30 days.");
        }

        log.info("Completed daily inventory alert checks.");
    }
}
