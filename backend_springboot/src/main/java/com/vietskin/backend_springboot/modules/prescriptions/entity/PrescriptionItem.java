package com.vietskin.backend_springboot.modules.prescriptions.entity;

import com.fasterxml.jackson.annotation.JsonIgnore;
import com.vietskin.backend_springboot.modules.medicines.entity.Medicine;
import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "prescription_items")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class PrescriptionItem {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer id;

    @Column(name = "medicine_name", nullable = false, length = 150)
    private String medicineName;

    @Column(length = 80)
    private String dosage;

    @Column(length = 80)
    private String frequency;

    @Column(length = 50)
    private String duration;

    private Integer quantity;

    @Column(columnDefinition = "TEXT")
    private String note;

    // Owning side trỏ về Prescription (Cha)
    @JsonIgnore
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "prescription_id", nullable = false)
    private Prescription prescription;

    // Trỏ về danh mục Thuốc
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "medicine_id")
    private Medicine medicine;
}
