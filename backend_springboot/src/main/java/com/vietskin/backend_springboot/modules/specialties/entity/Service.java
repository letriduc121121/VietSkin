package com.vietskin.backend_springboot.modules.specialties.entity;

import jakarta.persistence.*;
import lombok.*;
import java.math.BigDecimal;
import java.time.LocalDateTime;

@Entity
@Table(name = "services",
    indexes = {
        @Index(name = "idx_services_active", columnList = "active")
    }
)
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Service {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer id;

    @Column(nullable = false, length = 150)
    private String name;

    @Column(columnDefinition = "TEXT")
    private String description;

    // BẮT BUỘC dùng BigDecimal cho tiền, tuyệt đối không dùng Double/Float
    @Column(nullable = false, precision = 12, scale = 2)
    private BigDecimal price;

    // Thời gian khám ước tính (phút), default 30
    @Column(columnDefinition = "SMALLINT")
    @Builder.Default
    private Integer duration = 30;

    @Column(length = 60)
    private String category;

    @Column(name = "image_url", length = 500)
    private String imageUrl;

    @Builder.Default
    private Boolean active = true;

    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;

    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
        updatedAt = LocalDateTime.now();
    }

    @PreUpdate
    protected void onUpdate() {
        updatedAt = LocalDateTime.now();
    }
}
