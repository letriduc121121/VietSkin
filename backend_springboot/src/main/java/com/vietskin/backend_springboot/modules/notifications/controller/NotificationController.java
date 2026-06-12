package com.vietskin.backend_springboot.modules.notifications.controller;

import com.vietskin.backend_springboot.common.response.ApiResponse;
import com.vietskin.backend_springboot.modules.notifications.dto.CreateNotificationRequest;
import com.vietskin.backend_springboot.modules.notifications.entity.Notification;
import com.vietskin.backend_springboot.modules.notifications.service.NotificationService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/notifications")
@RequiredArgsConstructor
public class NotificationController {

    private final NotificationService notificationService;

    // Xem thông báo của mình
    @GetMapping
    @PreAuthorize("isAuthenticated()")
    public ApiResponse<List<Notification>> findMy(
            @AuthenticationPrincipal UserDetails userDetails) {
        Integer userId = Integer.parseInt(userDetails.getUsername());
        return ApiResponse.ok(notificationService.findByUser(userId));
    }

    // Đếm thông báo chưa đọc
    @GetMapping("/unread-count")
    @PreAuthorize("isAuthenticated()")
    public ApiResponse<Map<String, Long>> countUnread(
            @AuthenticationPrincipal UserDetails userDetails) {
        Integer userId = Integer.parseInt(userDetails.getUsername());
        return ApiResponse.ok(notificationService.countUnread(userId));
    }

    // Đánh dấu tất cả đã đọc
    @PutMapping("/read-all")
    @PreAuthorize("isAuthenticated()")
    public ApiResponse<Map<String, String>> markAllRead(
            @AuthenticationPrincipal UserDetails userDetails) {
        Integer userId = Integer.parseInt(userDetails.getUsername());
        return ApiResponse.ok(notificationService.markAllRead(userId));
    }

    // Đánh dấu 1 thông báo đã đọc
    @PutMapping("/{id}/read")
    @PreAuthorize("isAuthenticated()")
    public ApiResponse<Notification> markRead(@PathVariable Integer id) {
        return ApiResponse.ok(notificationService.markRead(id));
    }

    // Admin / Lễ tân tạo thông báo
    @PostMapping
    @PreAuthorize("hasAnyRole('admin','receptionist')")
    public ApiResponse<Notification> create(
            @Valid @RequestBody CreateNotificationRequest req) {
        return ApiResponse.ok(notificationService.create(req));
    }
}
