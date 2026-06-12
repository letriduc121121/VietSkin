package com.vietskin.backend_springboot.modules.users.dto;

import jakarta.validation.constraints.*;
import lombok.Getter;
import lombok.Setter;

import java.math.BigDecimal;

@Getter
@Setter
public class CreateStaffRequest {

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
    @Pattern(regexp = "doctor|receptionist|admin", message = "roleCode phải là doctor, receptionist hoặc admin")
    private String roleCode;

    private String avatar;

    // Doctor fields (chỉ dùng khi roleCode = doctor)
    private String specialty;
    private String degree;
    private String experience;
    private String description;
    private BigDecimal consultationFee;
}
