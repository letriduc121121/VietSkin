package com.vietskin.backend_springboot.modules.chatbot.repository;

import com.vietskin.backend_springboot.modules.chatbot.entity.ChatConversation;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface ChatConversationRepository extends JpaRepository<ChatConversation, Integer> {
    List<ChatConversation> findByUserIdOrderByUpdatedAtDesc(Integer userId);
    List<ChatConversation> findByGuestIdOrderByUpdatedAtDesc(String guestId);
}
