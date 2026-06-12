package com.vietskin.backend_springboot.modules.doctors.dto;

import lombok.Getter;
import lombok.Setter;
import java.math.BigDecimal;
import java.util.List;

@Getter
@Setter
public class UpdateDoctorRequest {
    private String specialty;
    private String experience;
    private String degree;
    private String description;
    private List<String> keywords;
    private BigDecimal consultationFee;
    private Boolean active;
}
