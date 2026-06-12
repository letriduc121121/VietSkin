package com.vietskin.backend_springboot.modules.appointments.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class UpdateStatusRequest {

    @NotBlank
    @Pattern(
            regexp = "confirmed|checked_in|in_progress|done|cancelled|no_show",
            message = "Trạng thái không hợp lệ"
    )
    private String status;
}
