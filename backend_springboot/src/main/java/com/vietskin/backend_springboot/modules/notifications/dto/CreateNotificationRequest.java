package com.vietskin.backend_springboot.modules.notifications.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class CreateNotificationRequest {

    private Integer userId;
    private Integer targetRoleId;

    @NotBlank(message = "type không được để trống")
    private String type;

    @NotBlank(message = "title không được để trống")
    private String title;

    private String message;
}
