package com.vietskin.backend_springboot.modules.prescriptions.entity;

import com.vietskin.backend_springboot.modules.appointments.entity.Appointment;
import com.vietskin.backend_springboot.modules.medical_records.entity.MedicalRecord;
import jakarta.persistence.*;
import lombok.*;

import com.fasterxml.jackson.annotation.JsonIgnore;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "prescriptions")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Prescription {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer id;

    @Column(columnDefinition = "TEXT")
    private String note;

    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;

    // --- QUAN HỆ KHÓA NGOẠI ---
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "appointment_id")
    private Appointment appointment;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "medical_record_id")
    @JsonIgnore
    private MedicalRecord medicalRecord;

    // Lưu ý: bệnh nhân & bác sĩ KHÔNG lưu trực tiếp tại đây (đã chuẩn hóa) —
    // truy xuất qua chuỗi: prescription → appointment → patient/doctor.

    // Quan hệ 1-N với Chi tiết đơn thuốc (Cascade để dễ dàng thao tác CRUD cả đơn)
    @OneToMany(mappedBy = "prescription", cascade = CascadeType.ALL, orphanRemoval = true)
    @Builder.Default
    private List<PrescriptionItem> items = new ArrayList<>();

    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
    }
}
