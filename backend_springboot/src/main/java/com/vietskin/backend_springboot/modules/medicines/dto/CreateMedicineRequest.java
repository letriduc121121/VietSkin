package com.vietskin.backend_springboot.modules.medicines.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class CreateMedicineRequest {

    @NotBlank(message = "Tên thuốc không được để trống")
    private String name;

    private String unit;
    private String category;
    private String description;
}
