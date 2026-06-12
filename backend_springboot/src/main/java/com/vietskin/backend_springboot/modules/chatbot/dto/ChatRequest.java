package com.vietskin.backend_springboot.modules.chatbot.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class ChatRequest {

    // null = bắt đầu cuộc hội thoại mới; có giá trị = tiếp tục cuộc cũ
    private Integer conversationId;

    // định danh khách vãng lai (FE sinh, lưu localStorage) khi chưa đăng nhập
    private String guestId;

    @NotBlank(message = "Nội dung tin nhắn không được để trống")
    private String message;
}
