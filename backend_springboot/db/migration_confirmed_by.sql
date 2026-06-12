-- Migration: thêm thông tin lễ tân duyệt lịch hẹn vào bảng appointments
-- Chạy MỘT LẦN trên DB hiện có (DB dựng mới từ schema.sql đã có sẵn 2 cột này).
-- Lệnh chạy: mysql -u root -p vietskin < db/migration_confirmed_by.sql

ALTER TABLE appointments
    ADD COLUMN confirmed_by INT NULL AFTER service_id,           -- lễ tân/admin đã duyệt (FK -> users.id)
    ADD COLUMN confirmed_at DATETIME(3) NULL AFTER confirmed_by, -- thời điểm duyệt
    ADD CONSTRAINT fk_apt_confirmed_by
        FOREIGN KEY (confirmed_by) REFERENCES users (id);
