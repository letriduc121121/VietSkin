package com.vietskin.backend_springboot.modules.invoices.entity;

import com.fasterxml.jackson.annotation.JsonIgnore;
import com.vietskin.backend_springboot.common.enums.PaymentMethod;
import com.vietskin.backend_springboot.common.enums.PaymentStatus;
import com.vietskin.backend_springboot.modules.appointments.entity.Appointment;
import com.vietskin.backend_springboot.modules.users.entity.User;
import jakarta.persistence.*;
import lombok.*;
import java.math.BigDecimal;
import java.time.LocalDateTime;

@Entity
@Table(name = "invoices", indexes = {
    @Index(name = "idx_invoices_status", columnList = "status"),
    @Index(name = "idx_invoices_patient_id", columnList = "patient_id"),
    @Index(name = "idx_invoices_paid_at", columnList = "paid_at")
})
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Invoice {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer id;

    @Column(name = "invoice_code", unique = true, nullable = false, length = 20)
    private String invoiceCode;

    @Column(name = "patient_name", nullable = false, length = 100)
    private String patientName;

    @Column(length = 255)
    private String description;

    @Column(nullable = false, precision = 12, scale = 2)
    private BigDecimal amount;

    @Enumerated(EnumType.STRING)
    @Builder.Default
    private PaymentStatus status = PaymentStatus.paid;

    @Enumerated(EnumType.STRING)
    private PaymentMethod method;

    @Column(name = "paid_at")
    private LocalDateTime paidAt;

    private String note;

    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;

    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    // Relations
    @JsonIgnore
    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "appointment_id", unique = true)
    private Appointment appointment;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "patient_id")
    private User patient;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "received_by")
    private User receivedBy;

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
