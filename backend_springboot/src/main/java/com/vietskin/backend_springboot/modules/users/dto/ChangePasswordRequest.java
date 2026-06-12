package com.vietskin.backend_springboot.modules.users.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class ChangePasswordRequest {

    @NotBlank(message = "Mật khẩu hiện tại không được để trống")
    private String currentPassword;

    @NotBlank
    @Size(min = 6, message = "Mật khẩu mới tối thiểu 6 ký tự")
    private String newPassword;
}
