package com.vietskin.backend_springboot.modules.medical_record_images.controller;

import com.vietskin.backend_springboot.common.response.ApiResponse;
import com.vietskin.backend_springboot.modules.medical_record_images.entity.MedicalRecordImage;
import com.vietskin.backend_springboot.modules.medical_record_images.service.MedicalRecordImageService;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;

@RestController
@RequestMapping("/api/medical-record-images")
@RequiredArgsConstructor
public class MedicalRecordImageController {

    private final MedicalRecordImageService imageService;

    // Bác sĩ upload ảnh cho bệnh án
    @PostMapping("/upload")
    @PreAuthorize("hasRole('doctor')")
    public ApiResponse<MedicalRecordImage> upload(
            @RequestParam("file") MultipartFile file,
            @RequestParam("medicalRecordId") Integer medicalRecordId,
            @RequestParam(value = "note", required = false) String note,
            @AuthenticationPrincipal UserDetails userDetails) throws Exception {
        Integer doctorUserId = Integer.parseInt(userDetails.getUsername());
        return ApiResponse.ok(imageService.upload(file, medicalRecordId, note, doctorUserId));
    }

    // Xem ảnh theo bệnh án
    @GetMapping
    @PreAuthorize("hasAnyRole('doctor','patient','admin')")
    public ApiResponse<List<MedicalRecordImage>> findByRecord(
            @RequestParam Integer medicalRecordId) {
        return ApiResponse.ok(imageService.findByMedicalRecord(medicalRecordId));
    }

    // Bác sĩ xóa ảnh
    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('doctor')")
    public ApiResponse<Void> delete(
            @PathVariable Integer id,
            @AuthenticationPrincipal UserDetails userDetails) throws Exception {
        Integer doctorUserId = Integer.parseInt(userDetails.getUsername());
        imageService.delete(id, doctorUserId);
        return ApiResponse.ok(null);
    }
}
