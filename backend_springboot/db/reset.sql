-- ============================================================
-- RESET DATABASE — Xóa và tạo lại toàn bộ CSDL VietSkin
-- Chạy file này trước schema.sql
-- ============================================================

DROP DATABASE IF EXISTS vietskin;
CREATE DATABASE vietskin
    CHARACTER SET utf8mb4
    COLLATE utf8mb4_unicode_ci;
USE vietskin;
