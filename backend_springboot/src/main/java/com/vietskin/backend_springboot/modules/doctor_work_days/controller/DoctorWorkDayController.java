package com.vietskin.backend_springboot.modules.doctor_work_days.controller;

import com.vietskin.backend_springboot.common.annotation.CurrentUser;
import com.vietskin.backend_springboot.common.response.ApiResponse;
import com.vietskin.backend_springboot.modules.doctor_work_days.dto.BulkCreateWorkDayRequest;
import com.vietskin.backend_springboot.modules.doctor_work_days.dto.CreateWorkDayRequest;
import com.vietskin.backend_springboot.modules.doctor_work_days.service.DoctorWorkDayService;
import com.vietskin.backend_springboot.modules.doctors.repository.DoctorRepository;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/doctor-work-days")
@RequiredArgsConstructor
public class DoctorWorkDayController {

    private final DoctorWorkDayService workDayService;
    private final DoctorRepository doctorRepository;

    // Admin/Lễ tân/Bác sĩ — xem lịch theo tháng
    @GetMapping
    @PreAuthorize("hasAnyRole('admin', 'receptionist', 'doctor')")
    public ApiResponse<List<Map<String, Object>>> findByMonth(
            @RequestParam String month,
            @RequestParam(required = false) Integer doctorId) {
        return ApiResponse.ok(workDayService.findByMonth(month, doctorId));
    }

    // Bác sĩ — xem lịch của chính mình
    @GetMapping("/my")
    @PreAuthorize("hasRole('doctor')")
    public ApiResponse<List<Map<String, Object>>> findMine(
            @RequestParam String month,
            @CurrentUser UserDetails userDetails) {
        Integer userId = Integer.valueOf(userDetails.getUsername());
        Integer doctorId = doctorRepository.findByUserId(userId)
                .map(d -> d.getId())
                .orElse(null);
        if (doctorId == null) return ApiResponse.ok(List.of());
        return ApiResponse.ok(workDayService.findByMonth(month, doctorId));
    }

    // Admin — phân 1 ngày làm
    @PostMapping
    @PreAuthorize("hasRole('admin')")
    public ApiResponse<Map<String, Object>> create(
            @Valid @RequestBody CreateWorkDayRequest req,
            @CurrentUser UserDetails userDetails) {
        Integer adminId = Integer.valueOf(userDetails.getUsername());
        return ApiResponse.ok(workDayService.create(req, adminId));
    }

    // Admin — phân nhiều ngày cùng lúc
    @PostMapping("/bulk")
    @PreAuthorize("hasRole('admin')")
    public ApiResponse<Map<String, Object>> bulkCreate(
            @Valid @RequestBody BulkCreateWorkDayRequest req,
            @CurrentUser UserDetails userDetails) {
        Integer adminId = Integer.valueOf(userDetails.getUsername());
        return ApiResponse.ok(workDayService.bulkCreate(req, adminId));
    }

    // Admin — xóa 1 ngày làm
    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('admin')")
    public ApiResponse<Map<String, Object>> remove(@PathVariable Integer id) {
        return ApiResponse.ok(workDayService.remove(id));
    }
}
