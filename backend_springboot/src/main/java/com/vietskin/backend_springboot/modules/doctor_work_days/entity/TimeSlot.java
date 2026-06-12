package com.vietskin.backend_springboot.modules.doctor_work_days.entity;

import com.vietskin.backend_springboot.modules.doctors.entity.Doctor;
import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDate;
import java.time.LocalDateTime;

@Entity
@Table(name = "time_slots",
    uniqueConstraints = {
        // Một bác sĩ không thể có 2 slot cùng giờ cùng ngày
        @UniqueConstraint(name = "uk_doctor_date_slot", columnNames = {"doctor_id", "date", "slot_time"})
    },
    indexes = {
        @Index(name = "idx_time_slots_date", columnList = "date")
    }
)
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class TimeSlot {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer id;

    // LocalDate vì Prisma dùng @db.Date
    @Column(nullable = false)
    private LocalDate date;

    // Lưu dạng "08:30", "09:00"... (VarChar(5) trong Prisma)
    @Column(name = "slot_time", nullable = false, length = 5)
    private String slotTime;

    @Column(name = "is_blocked")
    @Builder.Default
    private Boolean isBlocked = false;

    @Column(columnDefinition = "TEXT")
    private String note;

    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;

    // Owning side — TimeSlot giữ doctor_id
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "doctor_id", nullable = false)
    private Doctor doctor;

    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
    }
}
