package com.vietskin.backend_springboot.modules.medical_records.dto;

import jakarta.validation.constraints.NotNull;
import lombok.Getter;
import lombok.Setter;

import java.time.LocalDate;

@Getter
@Setter
public class CreateMedicalRecordRequest {

    @NotNull(message = "appointmentId không được để trống")
    private Integer appointmentId;

    private String symptoms;
    private String diagnosis;
    private String skinType;
    private String lesionLocation;
    private String treatment;
    private String note;
    private LocalDate followUpDate;
}
