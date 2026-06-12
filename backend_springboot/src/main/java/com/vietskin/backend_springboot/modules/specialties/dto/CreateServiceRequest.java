package com.vietskin.backend_springboot.modules.specialties.dto;

import jakarta.validation.constraints.*;
import lombok.Getter;
import lombok.Setter;

import java.math.BigDecimal;

@Getter
@Setter
public class CreateServiceRequest {

    @NotBlank(message = "Tên dịch vụ không được để trống")
    private String name;

    private String description;

    @NotNull
    @Positive(message = "Giá phải lớn hơn 0")
    private BigDecimal price;

    @NotNull
    @Min(value = 5, message = "Thời lượng tối thiểu 5 phút")
    private Integer duration;

    private String category;

    private String imageUrl;
}
