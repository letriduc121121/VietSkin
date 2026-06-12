package com.vietskin.backend_springboot.modules.auth.controller;

import com.vietskin.backend_springboot.common.response.ApiResponse;
import com.vietskin.backend_springboot.modules.auth.dto.*;
import com.vietskin.backend_springboot.modules.auth.service.AuthService;
import com.vietskin.backend_springboot.common.annotation.CurrentUser;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
public class AuthController {

    private final AuthService authService;

    @PostMapping("/register")
    public ApiResponse<AuthResponse> register(@Valid @RequestBody RegisterRequest req) {
        return ApiResponse.ok(authService.register(req));
    }

    @PostMapping("/login")
    public ApiResponse<AuthResponse> login(@Valid @RequestBody LoginRequest req) {
        return ApiResponse.ok(authService.login(req));
    }

    @PostMapping("/refresh")
    public ApiResponse<java.util.Map<String, String>> refresh(@Valid @RequestBody RefreshTokenRequest req) {
        return ApiResponse.ok(authService.refresh(req.getRefreshToken()));
    }

    @GetMapping("/me")
    public ApiResponse<AuthResponse.UserInfo> me(@CurrentUser UserDetails userDetails) {
        Integer userId = Integer.valueOf(userDetails.getUsername());
        return ApiResponse.ok(authService.me(userId));
    }
}
