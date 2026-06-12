package com.vietskin.backend_springboot.modules.specialties.controller;

import com.vietskin.backend_springboot.common.response.ApiResponse;
import com.vietskin.backend_springboot.modules.specialties.dto.CreateServiceRequest;
import com.vietskin.backend_springboot.modules.specialties.dto.UpdateServiceRequest;
import com.vietskin.backend_springboot.modules.specialties.entity.Service;
import com.vietskin.backend_springboot.modules.specialties.service.ClinicServiceService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/services")
@RequiredArgsConstructor
public class ServiceController {

    private final ClinicServiceService clinicServiceService;

    // Public — bệnh nhân xem dịch vụ
    // ?all=true → admin xem tất cả kể inactive
    @GetMapping
    public ApiResponse<List<Service>> findAll(
            @RequestParam(required = false) String all) {
        if ("true".equals(all))
            return ApiResponse.ok(clinicServiceService.findAllAdmin());
        return ApiResponse.ok(clinicServiceService.findAll());
    }

    // Public — chi tiết 1 dịch vụ
    @GetMapping("/{id}")
    public ApiResponse<Service> findOne(@PathVariable Integer id) {
        return ApiResponse.ok(clinicServiceService.findOne(id));
    }

    // Admin — tạo dịch vụ
    @PostMapping
    @PreAuthorize("hasRole('admin')")
    public ApiResponse<Service> create(@Valid @RequestBody CreateServiceRequest req) {
        return ApiResponse.ok(clinicServiceService.create(req));
    }

    // Admin — cập nhật dịch vụ
    @PutMapping("/{id}")
    @PreAuthorize("hasRole('admin')")
    public ApiResponse<Service> update(
            @PathVariable Integer id,
            @Valid @RequestBody UpdateServiceRequest req) {
        return ApiResponse.ok(clinicServiceService.update(id, req));
    }

    // Admin — xóa mềm dịch vụ
    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('admin')")
    public ApiResponse<Service> remove(@PathVariable Integer id) {
        return ApiResponse.ok(clinicServiceService.remove(id));
    }
}
