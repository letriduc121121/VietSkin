package com.vietskin.backend_springboot.modules.doctor_work_days.dto;

import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import lombok.Getter;
import lombok.Setter;
import java.time.LocalDate;
import java.util.List;

@Getter
@Setter
public class BulkCreateWorkDayRequest {

    @NotNull
    @Positive
    private Integer doctorId;

    private Integer roomId;

    @NotEmpty
    private List<LocalDate> dates;
}
