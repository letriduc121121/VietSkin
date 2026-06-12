package com.vietskin.backend_springboot.modules.chatbot.repository;

import com.vietskin.backend_springboot.modules.chatbot.entity.ChatMessage;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface ChatMessageRepository extends JpaRepository<ChatMessage, Integer> {
    List<ChatMessage> findByConversationIdOrderByIdAsc(Integer conversationId);
}
