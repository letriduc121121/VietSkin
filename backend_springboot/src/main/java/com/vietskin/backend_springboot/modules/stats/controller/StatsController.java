package com.vietskin.backend_springboot.modules.stats.controller;

import com.vietskin.backend_springboot.common.response.ApiResponse;
import com.vietskin.backend_springboot.modules.stats.dto.PatientStatsResponse;
import com.vietskin.backend_springboot.modules.stats.dto.ServiceStatsResponse;
import com.vietskin.backend_springboot.modules.stats.service.StatsService;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/stats")
@RequiredArgsConstructor
public class StatsController {

    private final StatsService statsService;

    /**
     * GET /api/stats/patients
     * Trả về toàn bộ số liệu thống kê bệnh nhân cho trang admin.
     */
    @GetMapping("/patients")
    @PreAuthorize("hasRole('admin')")
    public ApiResponse<PatientStatsResponse> getPatientStats() {
        return ApiResponse.ok(statsService.getPatientStats());
    }

    /**
     * GET /api/stats/services
     * Trả về thống kê dịch vụ (số lượt + doanh thu theo từng dịch vụ) cho trang admin.
     */
    @GetMapping("/services")
    @PreAuthorize("hasRole('admin')")
    public ApiResponse<ServiceStatsResponse> getServiceStats() {
        return ApiResponse.ok(statsService.getServiceStats());
    }
}
