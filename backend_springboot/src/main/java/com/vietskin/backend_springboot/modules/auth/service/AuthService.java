package com.vietskin.backend_springboot.modules.auth.service;

import com.vietskin.backend_springboot.common.exception.AppException;
import com.vietskin.backend_springboot.modules.auth.dto.*;
import com.vietskin.backend_springboot.modules.doctors.repository.DoctorRepository;
import com.vietskin.backend_springboot.modules.users.entity.*;
import com.vietskin.backend_springboot.modules.users.repository.*;
import com.vietskin.backend_springboot.security.CustomUserDetailsService;
import com.vietskin.backend_springboot.security.jwt.JwtService;
import io.jsonwebtoken.Claims;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;

@Service
@RequiredArgsConstructor
public class AuthService {

    private final UserRepository userRepository;
    private final RoleRepository roleRepository;
    private final PatientProfileRepository patientProfileRepository;
    private final DoctorRepository doctorRepository;
    private final JwtService jwtService;
    private final PasswordEncoder passwordEncoder;
    private final CustomUserDetailsService userDetailsService;

    @Transactional
    public AuthResponse register(RegisterRequest req) {
        if (userRepository.existsByPhone(req.getPhone()))
            throw new AppException(HttpStatus.CONFLICT,
                    "Số điện thoại đã đăng ký. Vui lòng nhập số điện thoại khác");

        if (req.getEmail() != null && userRepository.existsByEmail(req.getEmail()))
            throw new AppException(HttpStatus.CONFLICT, "Email đã được sử dụng");

        Role patientRole = roleRepository.findByCode("patient")
                .orElseThrow(() -> new AppException(HttpStatus.INTERNAL_SERVER_ERROR,
                        "Role 'patient' không tồn tại. Vui lòng chạy seed trước."));

        User user = User.builder()
                .username("user_" + req.getPhone())
                .passwordHash(passwordEncoder.encode(req.getPassword()))
                .name(req.getName())
                .phone(req.getPhone())
                .email(req.getEmail())
                .role(patientRole)
                .active(true)
                .build();
        user = userRepository.save(user);

        // Tạo PatientProfile + mã bệnh nhân
        String patientCode = "BN" + String.format("%06d", user.getId());
        PatientProfile profile = PatientProfile.builder()
                .user(user)
                .patientCode(patientCode)
                .dateOfBirth(req.getDateOfBirth())
                .gender(req.getGender())
                .address(req.getAddress())
                .build();
        patientProfileRepository.save(profile);

        return buildAuthResponse(user, null);
    }

    public AuthResponse login(LoginRequest req) {
        User user = userRepository.findByPhone(req.getPhone())
                .orElseThrow(() -> new AppException(HttpStatus.UNAUTHORIZED,
                        "Số điện thoại không tồn tại hoặc tài khoản đã bị khóa"));

        if (!user.getActive())
            throw new AppException(HttpStatus.UNAUTHORIZED, "Tài khoản đã bị khóa");

        if (!passwordEncoder.matches(req.getPassword(), user.getPasswordHash()))
            throw new AppException(HttpStatus.UNAUTHORIZED, "Mật khẩu không đúng");

        user.setLastLoginAt(LocalDateTime.now());
        userRepository.save(user);

        Integer doctorId = null;
        if ("doctor".equals(user.getRole().getCode())) {
            doctorId = doctorRepository.findByUserId(user.getId())
                    .map(d -> d.getId()).orElse(null);
        }

        return buildAuthResponse(user, doctorId);
    }

    public AuthResponse.UserInfo me(Integer userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new AppException(HttpStatus.NOT_FOUND, "Người dùng không tồn tại"));

        Integer doctorId = null;
        if ("doctor".equals(user.getRole().getCode())) {
            doctorId = doctorRepository.findByUserId(userId)
                    .map(d -> d.getId()).orElse(null);
        }

        return AuthResponse.UserInfo.builder()
                .id(user.getId())
                .name(user.getName())
                .phone(user.getPhone())
                .email(user.getEmail())
                .avatar(user.getAvatar())
                .role(user.getRole().getCode())
                .roleName(user.getRole().getName())
                .doctorId(doctorId)
                .build();
    }

    public java.util.Map<String, String> refresh(String refreshToken) {
        try {
            Claims claims = jwtService.parseRefreshToken(refreshToken);
            Integer userId = Integer.valueOf(claims.getSubject());
            String username = claims.get("username", String.class);
            String roleCode = claims.get("roleCode", String.class);
            String newAccess = jwtService.generateAccessToken(userId, username, roleCode);
            String newRefresh = jwtService.generateRefreshToken(userId, username, roleCode);
            return java.util.Map.of("accessToken", newAccess, "refreshToken", newRefresh);
        } catch (Exception e) {
            throw new AppException(HttpStatus.UNAUTHORIZED,
                    "Refresh token không hợp lệ hoặc đã hết hạn");
        }
    }

    // ── helper ──────────────────────────────────────────────
    private AuthResponse buildAuthResponse(User user, Integer doctorId) {
        String accessToken = jwtService.generateAccessToken(
                user.getId(), user.getUsername(), user.getRole().getCode());
        String refreshToken = jwtService.generateRefreshToken(
                user.getId(), user.getUsername(), user.getRole().getCode());

        return AuthResponse.builder()
                .accessToken(accessToken)
                .refreshToken(refreshToken)
                .user(AuthResponse.UserInfo.builder()
                        .id(user.getId())
                        .name(user.getName())
                        .phone(user.getPhone())
                        .email(user.getEmail())
                        .avatar(user.getAvatar())
                        .role(user.getRole().getCode())
                        .roleName(user.getRole().getName())
                        .doctorId(doctorId)
                        .build())
                .build();
    }
}
