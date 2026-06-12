package com.vietskin.backend_springboot.modules.lookups.controller;

import com.vietskin.backend_springboot.common.response.ApiResponse;
import com.vietskin.backend_springboot.modules.lookups.dto.DegreeDto;
import com.vietskin.backend_springboot.modules.lookups.dto.SpecialtyDto;
import com.vietskin.backend_springboot.modules.lookups.service.LookupService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

/**
 * Lookup data cho dropdown: GET /api/specialties, GET /api/degrees.
 * Khắc phục Bug #1 — 2 endpoint này trước đây không tồn tại (trả 500).
 */
@RestController
@RequiredArgsConstructor
public class LookupController {

    private final LookupService lookupService;

    @GetMapping("/api/specialties")
    public ApiResponse<List<SpecialtyDto>> specialties() {
        return ApiResponse.ok(lookupService.getSpecialties());
    }

    @GetMapping("/api/degrees")
    public ApiResponse<List<DegreeDto>> degrees() {
        return ApiResponse.ok(lookupService.getDegrees());
    }
}
