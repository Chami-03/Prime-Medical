package com.medcenter.entity;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "inventory_settings")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class InventorySettings {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "setting_key", unique = true, nullable = false, length = 100)
    private String key;

    @Column(name = "setting_value", nullable = false, length = 200)
    private String value;

    public static final String LOW_STOCK_THRESHOLD = "low_stock_threshold";
    public static final String EXPIRY_ALERT_DAYS = "expiry_alert_days";
    public static final String EMAIL_ALERTS_ENABLED = "email_alerts_enabled";
}
