package com.vietskin.backend_springboot.modules.auth.dto;

import lombok.Builder;
import lombok.Getter;

@Getter
@Builder
public class AuthResponse {
    private String accessToken;
    private String refreshToken;
    private UserInfo user;

    @Getter
    @Builder
    public static class UserInfo {
        private Integer id;
        private String name;
        private String phone;
        private String email;
        private String avatar;
        private String role;
        private String roleName;
        private Integer doctorId;
    }
}
