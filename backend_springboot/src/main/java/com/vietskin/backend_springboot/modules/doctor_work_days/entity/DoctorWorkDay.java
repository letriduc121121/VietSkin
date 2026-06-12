package com.vietskin.backend_springboot.modules.doctor_work_days.entity;

import com.vietskin.backend_springboot.modules.doctors.entity.Doctor;
import com.vietskin.backend_springboot.modules.rooms.entity.Room;
import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDate;
import java.time.LocalDateTime;

@Entity
@Table(name = "doctor_work_days",
    uniqueConstraints = {
        // Một bác sĩ chỉ được lên lịch 1 lần trong 1 ngày
        @UniqueConstraint(name = "uk_doctor_date", columnNames = {"doctor_id", "date"}),
        // Một phòng chỉ được dùng bởi 1 bác sĩ trong 1 ngày
        @UniqueConstraint(name = "uk_room_date", columnNames = {"room_id", "date"})
    },
    indexes = {
        @Index(name = "idx_work_days_date", columnList = "date")
    }
)
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class DoctorWorkDay {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer id;

    // LocalDate vì Prisma dùng @db.Date (chỉ lưu ngày, không có giờ)
    @Column(nullable = false)
    private LocalDate date;

    @Column(name = "created_by")
    private Integer createdBy;

    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;

    // Owning side — DoctorWorkDay giữ doctor_id
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "doctor_id", nullable = false)
    private Doctor doctor;

    // Owning side — DoctorWorkDay giữ room_id
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "room_id", nullable = false)
    private Room room;

    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
    }
}
