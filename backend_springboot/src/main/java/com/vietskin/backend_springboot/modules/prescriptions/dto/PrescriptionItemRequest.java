package com.vietskin.backend_springboot.modules.prescriptions.dto;

import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class PrescriptionItemRequest {
    private Integer medicineId;
    private String medicineName;
    private String dosage;
    private String frequency;
    private String duration;
    private Integer quantity;
    private String note;
}
