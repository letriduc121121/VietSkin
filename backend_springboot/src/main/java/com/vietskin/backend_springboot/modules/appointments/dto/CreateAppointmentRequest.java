package com.vietskin.backend_springboot.modules.appointments.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Getter;
import lombok.Setter;

import java.time.LocalDate;

@Getter
@Setter
public class CreateAppointmentRequest {

    @NotBlank(message = "Tên bệnh nhân không được để trống")
    private String patientName;

    private String patientPhone;
    private String patientEmail;
    private Integer patientId; // Lễ tân truyền khi liên kết bệnh nhân có tài khoản

    @NotNull(message = "Bác sĩ không được để trống")
    private Integer doctorId;

    private Integer serviceId;

    @NotNull(message = "Ngày khám không được để trống")
    private LocalDate date;

    private String time; // null = walk-in dùng giờ hiện tại

    private String symptoms;

    private Boolean isWalkin; // true = walk-in, auto check-in + cấp STT
}
