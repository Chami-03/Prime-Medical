package com.medcenter.entity;

import com.medcenter.enums.RoleName;
import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "app_roles")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Role {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, unique = true)
    private RoleName name;
}
