package com.vietskin.backend_springboot.modules.notifications.service;

import com.vietskin.backend_springboot.modules.notifications.dto.CreateNotificationRequest;
import com.vietskin.backend_springboot.modules.notifications.entity.Notification;
import com.vietskin.backend_springboot.modules.notifications.repository.NotificationRepository;
import com.vietskin.backend_springboot.modules.users.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Map;

@Service
@RequiredArgsConstructor
public class NotificationService {

    private final NotificationRepository notificationRepository;
    private final UserRepository userRepository;

    /** Shortcut: tạo notification đích danh cho 1 user. */
    public Notification notifyUser(Integer userId, String type, String title, String message) {
        CreateNotificationRequest req = new CreateNotificationRequest();
        req.setUserId(userId);
        req.setType(type);
        req.setTitle(title);
        req.setMessage(message);
        return create(req);
    }

    public Notification create(CreateNotificationRequest req) {
        Notification n = new Notification();
        n.setType(req.getType());
        n.setTitle(req.getTitle());
        n.setMessage(req.getMessage());
        n.setTargetRoleId(req.getTargetRoleId());

        if (req.getUserId() != null) {
            userRepository.findById(req.getUserId()).ifPresent(n::setUser);
        }

        return notificationRepository.save(n);
    }

    public List<Notification> findByUser(Integer userId) {
        return notificationRepository.findByUserIdOrderByCreatedAtDesc(userId)
                .stream().limit(50).toList();
    }

    public Map<String, Long> countUnread(Integer userId) {
        long count = notificationRepository.countByUserIdAndIsReadFalse(userId);
        return Map.of("count", count);
    }

    @Transactional
    public Notification markRead(Integer id) {
        Notification n = notificationRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Thông báo không tồn tại"));
        n.setIsRead(true);
        return notificationRepository.save(n);
    }

    @Transactional
    public Map<String, String> markAllRead(Integer userId) {
        List<Notification> unread = notificationRepository.findByUserIdAndIsReadFalse(userId);
        unread.forEach(n -> n.setIsRead(true));
        notificationRepository.saveAll(unread);
        return Map.of("message", "Đã đọc tất cả thông báo");
    }
}
