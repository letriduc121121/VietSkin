package com.vietskin.backend_springboot.modules.users.controller;

import com.vietskin.backend_springboot.common.annotation.CurrentUser;
import com.vietskin.backend_springboot.common.response.ApiResponse;
import com.vietskin.backend_springboot.modules.users.dto.*;
import com.vietskin.backend_springboot.modules.users.service.UserService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/users")
@RequiredArgsConstructor
public class UserController {

    private final UserService userService;

    // ── Admin/Lễ tân: danh sách tất cả users ───────────────────────
    @GetMapping
    @PreAuthorize("hasAnyRole('admin', 'receptionist')")
    public ApiResponse<List<Map<String, Object>>> findAll() {
        return ApiResponse.ok(userService.findAll());
    }

    // ── User hiện tại: xem profile ──────────────────────────
    @GetMapping("/profile")
    public ApiResponse<Map<String, Object>> getProfile(@CurrentUser UserDetails userDetails) {
        Integer userId = Integer.valueOf(userDetails.getUsername());
        return ApiResponse.ok(userService.getProfile(userId));
    }

    // ── User hiện tại: cập nhật profile ─────────────────────
    @PutMapping("/profile")
    public ApiResponse<Map<String, Object>> updateProfile(
            @CurrentUser UserDetails userDetails,
            @Valid @RequestBody UpdateProfileRequest req) {
        Integer userId = Integer.valueOf(userDetails.getUsername());
        return ApiResponse.ok(userService.updateProfile(userId, req));
    }

    // ── User hiện tại: đổi mật khẩu ─────────────────────────
    @PutMapping("/change-password")
    public ApiResponse<Map<String, String>> changePassword(
            @CurrentUser UserDetails userDetails,
            @Valid @RequestBody ChangePasswordRequest req) {
        Integer userId = Integer.valueOf(userDetails.getUsername());
        return ApiResponse.ok(userService.changePassword(userId, req));
    }

    // ── Lễ tân: tìm bệnh nhân theo SĐT ─────────────────────
    @GetMapping("/search")
    @PreAuthorize("hasAnyRole('admin', 'receptionist')")
    public ApiResponse<Map<String, Object>> findByPhone(@RequestParam String phone) {
        return ApiResponse.ok(userService.findByPhone(phone));
    }

    // ── Admin/Lễ tân: xem chi tiết 1 user ──────────────────────────
    @GetMapping("/{id}")
    @PreAuthorize("hasAnyRole('admin', 'receptionist')")
    public ApiResponse<Map<String, Object>> findOne(@PathVariable Integer id) {
        return ApiResponse.ok(userService.findOne(id));
    }

    // ── Admin/Lễ tân: cập nhật user ─────────────────────────────────
    @PutMapping("/{id}")
    @PreAuthorize("hasAnyRole('admin', 'receptionist')")
    public ApiResponse<Map<String, Object>> updateUser(
            @PathVariable Integer id,
            @Valid @RequestBody UpdateProfileRequest req) {
        return ApiResponse.ok(userService.updateProfile(id, req));
    }

    // ── Admin/Lễ tân: bật/tắt tài khoản ────────────────────────────
    @PutMapping("/{id}/toggle-active")
    @PreAuthorize("hasAnyRole('admin', 'receptionist')")
    public ApiResponse<Map<String, Object>> toggleActive(@PathVariable Integer id) {
        return ApiResponse.ok(userService.toggleActive(id));
    }

    // ── Admin/Lễ tân: tạo user bất kỳ role ─────────────────────────
    @PostMapping
    @PreAuthorize("hasAnyRole('admin', 'receptionist')")
    public ApiResponse<Map<String, Object>> createUser(@Valid @RequestBody CreateUserRequest req) {
        return ApiResponse.ok(userService.createUser(req));
    }

    // ── Admin: tạo nhân sự (doctor/receptionist) ────────────
    @PostMapping("/staff")
    @PreAuthorize("hasRole('admin')")
    public ApiResponse<Map<String, Object>> createStaff(@Valid @RequestBody CreateStaffRequest req) {
        return ApiResponse.ok(userService.createStaff(req));
    }

    // ── Admin: xóa mềm user ──────────────────────────────────
    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('admin')")
    public ApiResponse<Map<String, Object>> deleteUser(@PathVariable Integer id) {
        return ApiResponse.ok(userService.deleteUser(id));
    }
}
