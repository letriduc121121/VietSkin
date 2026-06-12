package com.vietskin.backend_springboot.modules.users.dto;

import jakarta.validation.constraints.*;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class CreateUserRequest {

    @NotBlank(message = "Họ tên không được để trống")
    private String name;

    @NotBlank
    @Pattern(regexp = "^(0[3|5|7|8|9])+([0-9]{8})$", message = "Số điện thoại không hợp lệ")
    private String phone;

    @Email
    private String email;

    @NotBlank
    @Size(min = 6, message = "Mật khẩu tối thiểu 6 ký tự")
    private String password;

    @NotBlank
    @Pattern(regexp = "admin|doctor|receptionist|patient", message = "Role không hợp lệ")
    private String roleCode;

    private String avatar;
}
