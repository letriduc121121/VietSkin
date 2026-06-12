package com.vietskin.backend_springboot.modules.appointments.entity;

import com.vietskin.backend_springboot.common.enums.AppointmentStatus;
import com.vietskin.backend_springboot.modules.doctors.entity.Doctor;
import com.vietskin.backend_springboot.modules.invoices.entity.Invoice;
import com.vietskin.backend_springboot.modules.specialties.entity.Service;
import com.vietskin.backend_springboot.modules.users.entity.User;
import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDate;
import java.time.LocalDateTime;

@Entity
@Table(name = "appointments",
    indexes = {
        @Index(name = "idx_appointments_date", columnList = "date"),
        @Index(name = "idx_appointments_doctor_date", columnList = "doctor_id, date"),
        @Index(name = "idx_appointments_patient", columnList = "patient_id"),
        @Index(name = "idx_appointments_status", columnList = "status")
    }
)
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Appointment {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer id;

    // Tên bệnh nhân lưu thẳng vào appointment (đề phòng User bị xoá vẫn còn lịch sử)
    @Column(name = "patient_name", nullable = false, length = 100)
    private String patientName;

    @Column(name = "patient_phone", length = 20)
    private String patientPhone;

    @Column(name = "patient_email", length = 100)
    private String patientEmail;

    // Lưu dạng "08:30" như Prisma (VarChar 5)
    @Column(nullable = false, length = 5)
    private String time;

    // LocalDate vì Prisma dùng @db.Date
    @Column(nullable = false)
    private LocalDate date;

    // BẮT BUỘC EnumType.STRING để DB lưu "pending", "confirmed"... thay vì 0,1,2...
    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    @Builder.Default
    private AppointmentStatus status = AppointmentStatus.pending;

    @Column(columnDefinition = "TEXT")
    private String symptoms;

    @Column(name = "queue_number", columnDefinition = "SMALLINT")
    private Integer queueNumber;

    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;

    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    // --- QUAN HỆ ---

    // patient có thể null (khách vãng lai đặt lịch không có tài khoản)
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "patient_id")
    private User patient;

    // doctor KHÔNG null — bắt buộc phải chọn bác sĩ
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "doctor_id", nullable = false)
    private Doctor doctor;

    // service có thể null (tư vấn thông thường không chọn dịch vụ)
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "service_id")
    private Service service;

    // Lễ tân/admin đã duyệt lịch — null nếu chưa duyệt hoặc walk-in (tạo thẳng confirmed)
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "confirmed_by")
    private User confirmedBy;

    @Column(name = "confirmed_at")
    private LocalDateTime confirmedAt;

    // invoice — null nếu chưa thu tiền
    @OneToOne(mappedBy = "appointment", fetch = FetchType.LAZY)
    private Invoice invoice;

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
