package com.vietskin.backend_springboot.modules.chatbot.entity;

import com.vietskin.backend_springboot.modules.users.entity.User;
import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "chat_conversations",
    indexes = {
        @Index(name = "idx_chat_conv_user", columnList = "user_id"),
        @Index(name = "idx_chat_conv_guest", columnList = "guest_id")
    }
)
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ChatConversation {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer id;

    // guest_id: định danh khách vãng lai (FE sinh, lưu localStorage) khi chưa đăng nhập
    @Column(name = "guest_id", length = 64)
    private String guestId;

    // Tiêu đề tóm tắt — thường lấy câu hỏi đầu tiên của user
    @Column(length = 150)
    private String title;

    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;

    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    // --- QUAN HỆ ---

    // user có thể null (khách vãng lai chat khi chưa đăng nhập) — giống Appointment.patient
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id")
    private User user;

    // Các tin nhắn trong cuộc hội thoại — xoá hội thoại thì xoá hết tin nhắn con
    @OneToMany(mappedBy = "conversation", cascade = CascadeType.ALL, orphanRemoval = true)
    @OrderBy("id ASC")
    @Builder.Default
    private List<ChatMessage> messages = new ArrayList<>();

    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
        updatedAt = LocalDateTime.now();
    }

    @PreUpdate
    protected void onUpdate() {
        updatedAt = LocalDateTime.now();
    }
}
