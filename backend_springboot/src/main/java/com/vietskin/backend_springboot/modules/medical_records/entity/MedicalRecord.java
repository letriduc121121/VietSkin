package com.vietskin.backend_springboot.modules.medical_records.entity;

import com.vietskin.backend_springboot.modules.appointments.entity.Appointment;
import com.vietskin.backend_springboot.modules.doctors.entity.Doctor;
import com.vietskin.backend_springboot.modules.medical_record_images.entity.MedicalRecordImage;
import com.vietskin.backend_springboot.modules.users.entity.User;
import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "medical_records",
    indexes = {
        @Index(name = "idx_medical_records_patient", columnList = "patient_id"),
        @Index(name = "idx_medical_records_doctor", columnList = "doctor_id")
    }
)
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class MedicalRecord {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer id;

    @Column(columnDefinition = "TEXT")
    private String symptoms;

    @Column(name = "skin_type", length = 50)
    private String skinType;

    @Column(name = "lesion_location", length = 200)
    private String lesionLocation;

    @Column(columnDefinition = "TEXT")
    private String diagnosis;

    @Column(columnDefinition = "TEXT")
    private String treatment;

    @Column(columnDefinition = "TEXT")
    private String note;

    @Column(name = "follow_up_date")
    private LocalDate followUpDate;

    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;

    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    // --- QUAN HỆ ---

    // Quan hệ 1-1 với Appointment. MedicalRecord là bên giữ khóa ngoại
    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "appointment_id", unique = true)
    private Appointment appointment;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "patient_id")
    private User patient;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "doctor_id")
    private Doctor doctor;

    // Quan hệ 1-N với ảnh bệnh án, áp dụng cascade để dễ dàng insert/delete ảnh cùng lúc với bệnh án
    @OneToMany(mappedBy = "medicalRecord", cascade = CascadeType.ALL, orphanRemoval = true)
    @Builder.Default
    private List<MedicalRecordImage> images = new ArrayList<>();

    // Quan hệ 1-N với đơn thuốc, để khi lấy chi tiết bệnh án sẽ có kèm đơn thuốc
    @OneToMany(mappedBy = "medicalRecord", cascade = CascadeType.ALL, orphanRemoval = true)
    @Builder.Default
    private List<com.vietskin.backend_springboot.modules.prescriptions.entity.Prescription> prescriptions = new ArrayList<>();

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
