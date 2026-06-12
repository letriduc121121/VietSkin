package com.vietskin.backend_springboot.modules.auth.dto;

import com.vietskin.backend_springboot.common.enums.Gender;
import jakarta.validation.constraints.*;
import lombok.Getter;
import lombok.Setter;
import java.time.LocalDate;

@Getter @Setter
public class RegisterRequest {

    @NotBlank(message = "Số điện thoại không được để trống")
    @Pattern(regexp = "^(0[3|5|7|8|9])+([0-9]{8})$",
            message = "Số điện thoại không hợp lệ (VD: 0912345678)")
    private String phone;

    @NotBlank
    @Size(min = 6, message = "Mật khẩu tối thiểu 6 ký tự")
    private String password;

    @NotBlank(message = "Họ tên không được để trống")
    @Size(max = 100)
    private String name;

    @Email(message = "Email không hợp lệ")
    private String email;

    // ── Thông tin bổ sung khi lễ tân tạo phiếu khám cho bệnh nhân mới ──

    private LocalDate dateOfBirth;

    private Gender gender;

    @Size(max = 255)
    private String address;
}
