-- ============================================================
-- BẢNG CHATBOT AI — chạy file này trong MySQL TRƯỚC khi start backend
-- (vì application.yml để jpa.hibernate.ddl-auto = validate,
--  Hibernate KHÔNG tự tạo bảng, phải tạo tay rồi entity mới khớp)
--
-- Cách chạy:  mysql -u root -p vietskin < chat_tables.sql
-- ============================================================

USE vietskin;

-- Bảng 1: mỗi cuộc hội thoại (1 user/khách có thể có nhiều cuộc)
CREATE TABLE IF NOT EXISTS chat_conversations (
    id         INT AUTO_INCREMENT PRIMARY KEY,
    user_id    INT          NULL,          -- NULL = khách vãng lai chưa đăng nhập
    guest_id   VARCHAR(64)  NULL,          -- định danh khách (FE sinh, lưu localStorage)
    title      VARCHAR(150) NULL,          -- tiêu đề tóm tắt (lấy câu hỏi đầu)
    created_at DATETIME     NOT NULL,
    updated_at DATETIME     NULL,
    CONSTRAINT fk_chat_conv_user
        FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE SET NULL,
    INDEX idx_chat_conv_user (user_id),
    INDEX idx_chat_conv_guest (guest_id)
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_unicode_ci;

-- Bảng 2: từng tin nhắn trong 1 cuộc hội thoại
CREATE TABLE IF NOT EXISTS chat_messages (
    id              INT AUTO_INCREMENT PRIMARY KEY,
    conversation_id INT         NOT NULL,
    role            VARCHAR(20) NOT NULL,   -- 'user' hoặc 'assistant'
    content         TEXT        NOT NULL,
    created_at      DATETIME    NOT NULL,
    CONSTRAINT fk_chat_msg_conversation
        FOREIGN KEY (conversation_id) REFERENCES chat_conversations (id) ON DELETE CASCADE,
    INDEX idx_chat_msg_conversation (conversation_id)
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_unicode_ci;
