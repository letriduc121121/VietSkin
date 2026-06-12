package com.vietskin.backend_springboot.modules.chatbot.dto;

import lombok.AllArgsConstructor;
import lombok.Getter;

@Getter
@AllArgsConstructor
public class ChatResponse {
    private Integer conversationId;  // trả về để FE gửi kèm cho các tin nhắn sau
    private String reply;            // câu trả lời của bot
}
