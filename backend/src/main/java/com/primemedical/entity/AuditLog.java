package com.primemedical.entity;

import jakarta.persistence.*;
import java.time.LocalDateTime;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;

@Entity
@Table(
        name = "audit_logs",
        indexes = {
            @Index(name = "idx_audit_user", columnList = "user_id"),
            @Index(name = "idx_audit_action", columnList = "action"),
            @Index(name = "idx_audit_time", columnList = "created_at")
        })
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class AuditLog {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id")
    private User user;

    @Column(nullable = false, length = 100)
    private String action;

    @Column(name = "entity_type", length = 100)
    private String entityType;

    @Column(name = "entity_id")
    private Long entityId;

    @Column(name = "ip_address", length = 45)
    private String ipAddress;

    @Builder.Default private Boolean success = true;

    @Column(columnDefinition = "TEXT")
    private String details;

    @CreationTimestamp
    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;
}
