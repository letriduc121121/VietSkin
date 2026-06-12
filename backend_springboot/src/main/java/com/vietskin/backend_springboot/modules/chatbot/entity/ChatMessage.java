package com.vietskin.backend_springboot.modules.chatbot.entity;

import com.vietskin.backend_springboot.common.enums.ChatRole;
import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;

@Entity
@Table(name = "chat_messages",
    indexes = {
        @Index(name = "idx_chat_msg_conversation", columnList = "conversation_id")
    }
)
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ChatMessage {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer id;

    // EnumType.STRING để DB lưu "user"/"assistant" thay vì 0,1
    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private ChatRole role;

    @Column(nullable = false, columnDefinition = "TEXT")
    private String content;

    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;

    // --- QUAN HỆ ---

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "conversation_id", nullable = false)
    private ChatConversation conversation;

    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
    }
}
