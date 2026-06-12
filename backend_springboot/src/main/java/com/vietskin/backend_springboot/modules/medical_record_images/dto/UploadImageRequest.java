package com.vietskin.backend_springboot.modules.medical_record_images.dto;

import jakarta.validation.constraints.NotNull;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class UploadImageRequest {

    @NotNull(message = "medicalRecordId không được để trống")
    private Integer medicalRecordId;

    private String note;
}
