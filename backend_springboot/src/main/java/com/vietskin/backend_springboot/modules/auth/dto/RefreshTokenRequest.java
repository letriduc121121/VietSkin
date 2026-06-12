package com.vietskin.backend_springboot.modules.auth.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.Getter;
import lombok.Setter;

@Getter @Setter
public class RefreshTokenRequest {

    @NotBlank
    private String refreshToken;
}
