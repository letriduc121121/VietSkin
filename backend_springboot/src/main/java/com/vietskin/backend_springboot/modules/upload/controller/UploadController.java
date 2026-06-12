package com.vietskin.backend_springboot.modules.upload.controller;

import com.vietskin.backend_springboot.common.response.ApiResponse;
import com.vietskin.backend_springboot.modules.upload.service.UploadService;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.Map;

@RestController
@RequestMapping("/api/upload")
@RequiredArgsConstructor
public class UploadController {

    private final UploadService uploadService;

    // Tất cả user đã đăng nhập đều upload được ảnh đại diện
    @PostMapping
    @PreAuthorize("isAuthenticated()")
    public ApiResponse<Map<String, String>> upload(
            @RequestParam("file") MultipartFile file,
            @RequestParam(value = "folder", required = false) String folder) throws Exception {
        return ApiResponse.ok(uploadService.uploadImage(file, folder));
    }
}
