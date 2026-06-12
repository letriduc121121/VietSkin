package com.vietskin.backend_springboot.modules.medicines.controller;

import com.vietskin.backend_springboot.common.response.ApiResponse;
import com.vietskin.backend_springboot.modules.medicines.dto.CreateMedicineRequest;
import com.vietskin.backend_springboot.modules.medicines.entity.Medicine;
import com.vietskin.backend_springboot.modules.medicines.service.MedicineService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/medicines")
@RequiredArgsConstructor
public class MedicineController {

    private final MedicineService medicineService;

    @GetMapping
    @PreAuthorize("isAuthenticated()")
    public ApiResponse<List<Medicine>> findAll(
            @RequestParam(required = false) String search) {
        if (search != null && !search.isBlank())
            return ApiResponse.ok(medicineService.search(search));
        return ApiResponse.ok(medicineService.findAll());
    }

    @GetMapping("/{id}")
    @PreAuthorize("isAuthenticated()")
    public ApiResponse<Medicine> findOne(@PathVariable Integer id) {
        return ApiResponse.ok(medicineService.findOne(id));
    }

    @PostMapping
    @PreAuthorize("hasAnyRole('admin','doctor')")
    public ApiResponse<Medicine> create(@Valid @RequestBody CreateMedicineRequest req) {
        return ApiResponse.ok(medicineService.create(req));
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasAnyRole('admin','doctor')")
    public ApiResponse<Medicine> update(
            @PathVariable Integer id,
            @Valid @RequestBody CreateMedicineRequest req) {
        return ApiResponse.ok(medicineService.update(id, req));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('admin')")
    public ApiResponse<Medicine> remove(@PathVariable Integer id) {
        return ApiResponse.ok(medicineService.remove(id));
    }
}
