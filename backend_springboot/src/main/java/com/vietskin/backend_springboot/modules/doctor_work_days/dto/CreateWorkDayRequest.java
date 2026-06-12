package com.vietskin.backend_springboot.modules.doctor_work_days.dto;

import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import lombok.Getter;
import lombok.Setter;
import java.time.LocalDate;

@Getter
@Setter
public class CreateWorkDayRequest {

    @NotNull
    @Positive
    private Integer doctorId;

    // Nullable — tự resolve từ phòng được gán cho bác sĩ
    private Integer roomId;

    @NotNull
    private LocalDate date;
}
