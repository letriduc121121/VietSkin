package com.vietskin.backend_springboot.modules.notifications.repository;

import com.vietskin.backend_springboot.modules.notifications.entity.Notification;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface NotificationRepository extends JpaRepository<Notification, Integer> {
    List<Notification> findByUserIdOrderByCreatedAtDesc(Integer userId);
    List<Notification> findByUserIdAndIsReadFalse(Integer userId);
    List<Notification> findByTargetRoleId(Integer targetRoleId);
    long countByUserIdAndIsReadFalse(Integer userId);
}
