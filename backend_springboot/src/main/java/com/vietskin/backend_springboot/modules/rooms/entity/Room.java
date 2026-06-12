package com.vietskin.backend_springboot.modules.rooms.entity;

import com.vietskin.backend_springboot.modules.doctors.entity.Doctor;
import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "rooms")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Room {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer id;

    @Column(nullable = false, length = 50)
    private String name;

    @Builder.Default
    private Boolean active = true;

    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;

    // Owning side — Room gắn với Doctor
    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "doctor_id", unique = true)
    private Doctor doctor;

    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
    }
}
