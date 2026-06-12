package com.vietskin.backend_springboot.modules.prescriptions.dto;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;
import lombok.Getter;
import lombok.Setter;

import java.util.List;

@Getter
@Setter
public class CreatePrescriptionRequest {

    @NotNull(message = "appointmentId không được để trống")
    private Integer appointmentId;

    private Integer medicalRecordId;
    private String note;

    @NotEmpty(message = "Đơn thuốc phải có ít nhất 1 thuốc")
    @Valid
    private List<PrescriptionItemRequest> items;
}
