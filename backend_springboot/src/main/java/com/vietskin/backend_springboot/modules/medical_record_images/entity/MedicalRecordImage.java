package com.vietskin.backend_springboot.modules.medical_record_images.entity;

import com.fasterxml.jackson.annotation.JsonIgnore;
import com.vietskin.backend_springboot.modules.medical_records.entity.MedicalRecord;
import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;

@Entity
@Table(name = "medical_record_images",
    indexes = {
        @Index(name = "idx_medical_record_images_record", columnList = "medical_record_id")
    }
)
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class MedicalRecordImage {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer id;

    // URL ảnh lấy từ Cloudinary
    @Column(name = "image_url", nullable = false, length = 500)
    private String imageUrl;

    // ID public của ảnh trên Cloudinary để xóa
    @Column(name = "public_id", nullable = false, length = 200)
    private String publicId;

    @Column(columnDefinition = "TEXT")
    private String note;

    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;

    // Owning side của quan hệ N-1 với MedicalRecord
    @JsonIgnore
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "medical_record_id", nullable = false)
    private MedicalRecord medicalRecord;

    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
    }
}
