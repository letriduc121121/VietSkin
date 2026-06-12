package com.vietskin.backend_springboot.modules.auth.dto;

import jakarta.validation.constraints.*;
import lombok.Getter;
import lombok.Setter;

@Getter @Setter
public class LoginRequest {

    @NotBlank(message = "Số điện thoại không được để trống")
    @Pattern(regexp = "^(0[3|5|7|8|9])+([0-9]{8})$",
            message = "Số điện thoại không hợp lệ")
    private String phone;

    @NotBlank
    @Size(min = 6, message = "Mật khẩu tối thiểu 6 ký tự")
    private String password;
}
