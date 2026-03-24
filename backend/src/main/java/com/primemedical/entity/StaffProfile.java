package com.primemedical.entity;

import jakarta.persistence.*;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.util.List;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

@Entity
@Table(name = "staff_profiles")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class StaffProfile {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false, unique = true)
    private User user;

    @Column(length = 200)
    private String specialization;

    @Column(columnDefinition = "TEXT")
    private String qualifications;

    @Column(name = "license_number", length = 100)
    private String licenseNumber;

    @Column(name = "shift_start")
    private LocalTime shiftStart;

    @Column(name = "shift_end")
    private LocalTime shiftEnd;

    @Column(columnDefinition = "TEXT")
    private String bio;

    @ElementCollection
    @CollectionTable(
            name = "staff_permissions",
            joinColumns = @JoinColumn(name = "staff_profile_id"))
    @Column(name = "permission")
    private List<String> permissions;

    @CreationTimestamp
    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at")
    private LocalDateTime updatedAt;
}
