package com.vietskin.backend_springboot.modules.doctors.entity;

import com.vietskin.backend_springboot.modules.users.entity.User;
import jakarta.persistence.*;
import lombok.*;
import java.math.BigDecimal;
import java.time.LocalDateTime;

@Entity
@Table(name = "doctors", indexes = {
    @Index(name = "idx_doctors_specialty", columnList = "specialty"),
    @Index(name = "idx_doctors_active", columnList = "active")
})
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Doctor {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer id;

    @Column(length = 100)
    private String specialty;

    @Column(length = 50)
    private String experience;

    @Column(length = 100)
    private String degree;

    @Column(columnDefinition = "TEXT")
    private String description;

    // Lưu JSON array dạng String, ví dụ: ["mụn","da liễu"] — cột NOT NULL, mặc định "[]"
    @Column(columnDefinition = "json")
    @Builder.Default
    private String keywords = "[]";

    @Column(name = "consultation_fee", precision = 12, scale = 2)
    @Builder.Default
    private BigDecimal consultationFee = BigDecimal.valueOf(150000);

    @Builder.Default
    private Boolean active = true;

    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;

    // Owning side — Doctor thuộc về User
    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", unique = true)
    private User user;

    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
    }
}
