package com.vietskin.backend_springboot.modules.doctors.controller;

import com.vietskin.backend_springboot.common.annotation.CurrentUser;
import com.vietskin.backend_springboot.common.response.ApiResponse;
import com.vietskin.backend_springboot.modules.doctors.dto.UpdateDoctorRequest;
import com.vietskin.backend_springboot.modules.doctors.service.DoctorService;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/doctors")
@RequiredArgsConstructor
public class DoctorController {

    private final DoctorService doctorService;

    // Public — bệnh nhân xem danh sách bác sĩ
    @GetMapping
    public ApiResponse<List<Map<String, Object>>> findAll() {
        return ApiResponse.ok(doctorService.findAll());
    }

    // Admin — tất cả bác sĩ kể inactive
    @GetMapping("/admin/all")
    @PreAuthorize("hasRole('admin')")
    public ApiResponse<List<Map<String, Object>>> findAllForAdmin() {
        return ApiResponse.ok(doctorService.findAllForAdmin());
    }

    // Admin — bật/tắt trạng thái bác sĩ
    @PutMapping("/{id}/toggle-active")
    @PreAuthorize("hasRole('admin')")
    public ApiResponse<Map<String, Object>> toggleActive(@PathVariable Integer id) {
        return ApiResponse.ok(doctorService.toggleActive(id));
    }

    // Public — slot trống để đặt lịch
    @GetMapping("/{id}/slots")
    public ApiResponse<Map<String, Object>> getSlots(
            @PathVariable Integer id,
            @RequestParam String date) {
        return ApiResponse.ok(doctorService.getAvailableSlots(id, date));
    }

    // Public — chi tiết 1 bác sĩ
    @GetMapping("/{id}")
    public ApiResponse<Map<String, Object>> findOne(@PathVariable Integer id) {
        return ApiResponse.ok(doctorService.findOne(id));
    }

    // Doctor/Admin — cập nhật hồ sơ bác sĩ
    @PutMapping("/{id}")
    @PreAuthorize("hasAnyRole('doctor', 'admin')")
    public ApiResponse<Map<String, Object>> update(
            @PathVariable Integer id,
            @RequestBody UpdateDoctorRequest req) {
        return ApiResponse.ok(doctorService.update(id, req));
    }

    // Doctor — lấy hồ sơ của chính mình
    @GetMapping("/me/profile")
    @PreAuthorize("hasRole('doctor')")
    public ApiResponse<Map<String, Object>> getMyProfile(
            @CurrentUser UserDetails userDetails) {
        Integer userId = Integer.valueOf(userDetails.getUsername());
        return ApiResponse.ok(doctorService.findByUserId(userId));
    }
}
