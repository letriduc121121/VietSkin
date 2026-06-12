package com.vietskin.backend_springboot.modules.users.repository;

import com.vietskin.backend_springboot.modules.users.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.LocalDateTime;
import java.util.Optional;

public interface UserRepository extends JpaRepository<User, Integer> {
    Optional<User> findByPhone(String phone);
    Optional<User> findByUsername(String username);
    boolean existsByPhone(String phone);
    boolean existsByEmail(String email);

    // --- STATS ---

    @Query("SELECT COUNT(u) FROM User u WHERE u.role.code = 'patient'")
    long countPatients();

    // Bệnh nhân mới đăng ký trong khoảng thời gian
    @Query("SELECT COUNT(u) FROM User u WHERE u.role.code = 'patient' AND u.createdAt >= :from AND u.createdAt < :to")
    long countNewPatients(@Param("from") LocalDateTime from, @Param("to") LocalDateTime to);
}
