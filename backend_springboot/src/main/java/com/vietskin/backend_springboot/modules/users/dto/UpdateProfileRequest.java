package com.vietskin.backend_springboot.modules.users.dto;

import com.vietskin.backend_springboot.common.enums.Gender;
import jakarta.validation.constraints.Email;
import lombok.Getter;
import lombok.Setter;

import java.time.LocalDate;

@Getter
@Setter
public class UpdateProfileRequest {
    // User fields
    private String name;
    @Email(message = "Email không hợp lệ")
    private String email;
    private String avatar;

    // PatientProfile fields
    private LocalDate dateOfBirth;
    private Gender gender;
    private String address;
    private String province;
    private String district;
    private String ward;
    private String citizenId;
    private String ethnicity;
    private String bloodType;
    private String allergies;
    private String medicalHistory;
    private String emergencyContact;
}
