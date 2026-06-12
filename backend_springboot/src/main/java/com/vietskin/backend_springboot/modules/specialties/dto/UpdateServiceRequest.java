package com.vietskin.backend_springboot.modules.specialties.dto;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.Positive;
import lombok.Getter;
import lombok.Setter;

import java.math.BigDecimal;

@Getter
@Setter
public class UpdateServiceRequest {

    private String name;
    private String description;

    @Positive(message = "Giá phải lớn hơn 0")
    private BigDecimal price;

    @Min(value = 5, message = "Thời lượng tối thiểu 5 phút")
    private Integer duration;

    private String category;
    private String imageUrl;
    private Boolean active;
}
