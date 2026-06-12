package com.vietskin.backend_springboot.modules.upload.service;

import com.cloudinary.Cloudinary;
import com.cloudinary.Transformation;
import com.cloudinary.utils.ObjectUtils;
import com.vietskin.backend_springboot.common.exception.AppException;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.util.Map;

@Service
@RequiredArgsConstructor
public class UploadService {

    private final Cloudinary cloudinary;

    public Map<String, String> uploadImage(MultipartFile file, String folder) throws IOException {
        if (file == null || file.isEmpty()) {
            throw new AppException(HttpStatus.BAD_REQUEST, "Không có file được gửi lên");
        }

        String mime = file.getContentType();
        if (mime == null || !mime.matches("image/(jpeg|png|webp|gif)")) {
            throw new AppException(HttpStatus.BAD_REQUEST, "Chỉ chấp nhận ảnh JPG/PNG/WebP/GIF");
        }

        Transformation transformation = new Transformation()
                .width(1200).crop("limit")
                .chain().quality("auto")
                .chain().fetchFormat("auto");

        Map<?, ?> result = cloudinary.uploader().upload(file.getBytes(), ObjectUtils.asMap(
                "folder",        folder != null ? folder : "vietskin",
                "resource_type", "image",
                "transformation", transformation
        ));

        return Map.of(
                "url",      (String) result.get("secure_url"),
                "publicId", (String) result.get("public_id")
        );
    }

    public void deleteImage(String publicId) throws IOException {
        cloudinary.uploader().destroy(publicId, Map.of());
    }
}
