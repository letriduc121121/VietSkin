-- ============================================================
-- SCHEMA — VietSkin Clinic Management System
-- MySQL 8.x  |  utf8mb4_unicode_ci
-- Chạy sau reset.sql
-- ============================================================

USE vietskin;

-- ── 1. roles ─────────────────────────────────────────────────
CREATE TABLE roles (
    id          INT          NOT NULL AUTO_INCREMENT,
    code        VARCHAR(20)  NOT NULL,
    name        VARCHAR(50)  NOT NULL,
    description TEXT,
    active      BOOLEAN      NOT NULL DEFAULT TRUE,
    created_at  DATETIME     NOT NULL,
    PRIMARY KEY (id),
    UNIQUE KEY uq_roles_code (code)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ── 2. users ─────────────────────────────────────────────────
CREATE TABLE users (
    id             INT          NOT NULL AUTO_INCREMENT,
    username       VARCHAR(50)  NOT NULL,
    password_hash  VARCHAR(255) NOT NULL,
    name           VARCHAR(100) NOT NULL,
    email          VARCHAR(100),
    phone          VARCHAR(20)  NOT NULL,
    avatar         VARCHAR(255),
    active         BOOLEAN      NOT NULL DEFAULT TRUE,
    last_login_at  DATETIME,
    created_at     DATETIME     NOT NULL,
    updated_at     DATETIME,
    role_id        INT          NOT NULL,
    PRIMARY KEY (id),
    UNIQUE KEY uq_users_username (username),
    UNIQUE KEY uq_users_phone    (phone),
    INDEX idx_users_phone   (phone),
    INDEX idx_users_role_id (role_id),
    CONSTRAINT fk_users_role FOREIGN KEY (role_id) REFERENCES roles (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ── 3. patient_profiles ──────────────────────────────────────
CREATE TABLE patient_profiles (
    id                INT         NOT NULL AUTO_INCREMENT,
    patient_code      VARCHAR(20),
    date_of_birth     DATE,
    gender            VARCHAR(10),
    address           TEXT,
    province          VARCHAR(100),
    district          VARCHAR(100),
    ward              VARCHAR(100),
    citizen_id        VARCHAR(20),
    ethnicity         VARCHAR(50),
    medical_history   TEXT,
    allergies         TEXT,
    blood_type        VARCHAR(5),
    emergency_contact VARCHAR(100),
    created_at        DATETIME    NOT NULL,
    updated_at        DATETIME,
    user_id           INT         NOT NULL,
    PRIMARY KEY (id),
    UNIQUE KEY uq_patient_profiles_code    (patient_code),
    UNIQUE KEY uq_patient_profiles_user_id (user_id),
    CONSTRAINT fk_patient_profiles_user FOREIGN KEY (user_id) REFERENCES users (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ── 4. doctors ───────────────────────────────────────────────
CREATE TABLE doctors (
    id               INT            NOT NULL AUTO_INCREMENT,
    specialty        VARCHAR(100),
    experience       VARCHAR(50),
    degree           VARCHAR(100),
    description      TEXT,
    keywords         JSON,
    consultation_fee DECIMAL(12,2)  NOT NULL DEFAULT 150000,
    active           BOOLEAN        NOT NULL DEFAULT TRUE,
    created_at       DATETIME       NOT NULL,
    user_id          INT            NOT NULL,
    PRIMARY KEY (id),
    UNIQUE KEY uq_doctors_user_id (user_id),
    INDEX idx_doctors_specialty (specialty),
    INDEX idx_doctors_active    (active),
    CONSTRAINT fk_doctors_user FOREIGN KEY (user_id) REFERENCES users (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ── 5. rooms ─────────────────────────────────────────────────
CREATE TABLE rooms (
    id         INT         NOT NULL AUTO_INCREMENT,
    name       VARCHAR(50) NOT NULL,
    active     BOOLEAN     NOT NULL DEFAULT TRUE,
    created_at DATETIME    NOT NULL,
    doctor_id  INT,
    PRIMARY KEY (id),
    UNIQUE KEY uq_rooms_doctor_id (doctor_id),
    CONSTRAINT fk_rooms_doctor FOREIGN KEY (doctor_id) REFERENCES doctors (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ── 6. doctor_work_days ──────────────────────────────────────
CREATE TABLE doctor_work_days (
    id         INT      NOT NULL AUTO_INCREMENT,
    date       DATE     NOT NULL,
    created_by INT,
    created_at DATETIME NOT NULL,
    doctor_id  INT      NOT NULL,
    room_id    INT      NOT NULL,
    PRIMARY KEY (id),
    UNIQUE KEY uk_doctor_date (doctor_id, date),
    UNIQUE KEY uk_room_date   (room_id,   date),
    INDEX idx_work_days_date (date),
    CONSTRAINT fk_dwd_doctor FOREIGN KEY (doctor_id) REFERENCES doctors (id),
    CONSTRAINT fk_dwd_room   FOREIGN KEY (room_id)   REFERENCES rooms   (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ── 7. time_slots ────────────────────────────────────────────
CREATE TABLE time_slots (
    id         INT         NOT NULL AUTO_INCREMENT,
    date       DATE        NOT NULL,
    slot_time  VARCHAR(5)  NOT NULL,
    is_blocked BOOLEAN     NOT NULL DEFAULT FALSE,
    note       TEXT,
    created_at DATETIME    NOT NULL,
    doctor_id  INT         NOT NULL,
    PRIMARY KEY (id),
    UNIQUE KEY uk_doctor_date_slot (doctor_id, date, slot_time),
    INDEX idx_time_slots_date (date),
    CONSTRAINT fk_time_slots_doctor FOREIGN KEY (doctor_id) REFERENCES doctors (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ── 8. services ──────────────────────────────────────────────
CREATE TABLE services (
    id          INT            NOT NULL AUTO_INCREMENT,
    name        VARCHAR(150)   NOT NULL,
    description TEXT,
    price       DECIMAL(12,2)  NOT NULL,
    duration    SMALLINT       NOT NULL DEFAULT 30,
    category    VARCHAR(60),
    image_url   VARCHAR(500),
    active      BOOLEAN        NOT NULL DEFAULT TRUE,
    created_at  DATETIME       NOT NULL,
    updated_at  DATETIME,
    PRIMARY KEY (id),
    INDEX idx_services_active (active)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ── 9. appointments ──────────────────────────────────────────
CREATE TABLE appointments (
    id             INT         NOT NULL AUTO_INCREMENT,
    patient_name   VARCHAR(100) NOT NULL,
    patient_phone  VARCHAR(20),
    patient_email  VARCHAR(100),
    time           VARCHAR(5)   NOT NULL,
    date           DATE         NOT NULL,
    status         VARCHAR(20)  NOT NULL DEFAULT 'pending',
    symptoms       TEXT,
    queue_number   SMALLINT,
    created_at     DATETIME     NOT NULL,
    updated_at     DATETIME,
    patient_id     INT,
    doctor_id      INT          NOT NULL,
    service_id     INT,
    confirmed_by   INT,                       -- lễ tân/admin đã duyệt lịch (NULL nếu chưa duyệt / walk-in)
    confirmed_at   DATETIME(3),               -- thời điểm duyệt
    PRIMARY KEY (id),
    INDEX idx_appointments_date        (date),
    INDEX idx_appointments_doctor_date (doctor_id, date),
    INDEX idx_appointments_patient     (patient_id),
    INDEX idx_appointments_status      (status),
    CONSTRAINT fk_apt_patient       FOREIGN KEY (patient_id)   REFERENCES users    (id),
    CONSTRAINT fk_apt_doctor        FOREIGN KEY (doctor_id)    REFERENCES doctors  (id),
    CONSTRAINT fk_apt_service       FOREIGN KEY (service_id)   REFERENCES services (id),
    CONSTRAINT fk_apt_confirmed_by  FOREIGN KEY (confirmed_by) REFERENCES users    (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ── 10. medical_records ──────────────────────────────────────
CREATE TABLE medical_records (
    id              INT          NOT NULL AUTO_INCREMENT,
    symptoms        TEXT,
    skin_type       VARCHAR(50),
    lesion_location VARCHAR(200),
    diagnosis       TEXT,
    treatment       TEXT,
    note            TEXT,
    follow_up_date  DATE,
    created_at      DATETIME     NOT NULL,
    updated_at      DATETIME,
    appointment_id  INT,
    patient_id      INT,
    doctor_id       INT,
    PRIMARY KEY (id),
    UNIQUE KEY uq_medical_records_apt (appointment_id),
    INDEX idx_medical_records_patient (patient_id),
    INDEX idx_medical_records_doctor  (doctor_id),
    CONSTRAINT fk_mr_appointment FOREIGN KEY (appointment_id) REFERENCES appointments (id),
    CONSTRAINT fk_mr_patient     FOREIGN KEY (patient_id)     REFERENCES users        (id),
    CONSTRAINT fk_mr_doctor      FOREIGN KEY (doctor_id)      REFERENCES doctors      (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ── 11. medical_record_images ────────────────────────────────
CREATE TABLE medical_record_images (
    id                INT          NOT NULL AUTO_INCREMENT,
    image_url         VARCHAR(500) NOT NULL,
    public_id         VARCHAR(200) NOT NULL,
    note              TEXT,
    created_at        DATETIME     NOT NULL,
    medical_record_id INT          NOT NULL,
    PRIMARY KEY (id),
    INDEX idx_medical_record_images_record (medical_record_id),
    CONSTRAINT fk_mri_record FOREIGN KEY (medical_record_id) REFERENCES medical_records (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ── 12. medicines ────────────────────────────────────────────
CREATE TABLE medicines (
    id          INT          NOT NULL AUTO_INCREMENT,
    name        VARCHAR(150) NOT NULL,
    unit        VARCHAR(30),
    category    VARCHAR(60),
    description TEXT,
    active      BOOLEAN      NOT NULL DEFAULT TRUE,
    created_at  DATETIME     NOT NULL,
    PRIMARY KEY (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ── 13. prescriptions ────────────────────────────────────────
CREATE TABLE prescriptions (
    id                INT      NOT NULL AUTO_INCREMENT,
    note              TEXT,
    created_at        DATETIME NOT NULL,
    appointment_id    INT,
    medical_record_id INT,
    -- Đã chuẩn hóa: KHÔNG lưu patient_id/doctor_id (suy ra qua appointment → medical_record)
    PRIMARY KEY (id),
    CONSTRAINT fk_px_appointment    FOREIGN KEY (appointment_id)    REFERENCES appointments    (id),
    CONSTRAINT fk_px_medical_record FOREIGN KEY (medical_record_id) REFERENCES medical_records (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ── 14. prescription_items ───────────────────────────────────
CREATE TABLE prescription_items (
    id              INT          NOT NULL AUTO_INCREMENT,
    medicine_name   VARCHAR(150) NOT NULL,
    dosage          VARCHAR(80),
    frequency       VARCHAR(80),
    duration        VARCHAR(50),
    quantity        INT,
    note            TEXT,
    prescription_id INT          NOT NULL,
    medicine_id     INT,
    PRIMARY KEY (id),
    CONSTRAINT fk_pi_prescription FOREIGN KEY (prescription_id) REFERENCES prescriptions (id),
    CONSTRAINT fk_pi_medicine     FOREIGN KEY (medicine_id)     REFERENCES medicines     (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ── 15. invoices ─────────────────────────────────────────────
CREATE TABLE invoices (
    id             INT           NOT NULL AUTO_INCREMENT,
    invoice_code   VARCHAR(20)   NOT NULL,
    patient_name   VARCHAR(100)  NOT NULL,
    description    VARCHAR(255),
    amount         DECIMAL(12,2) NOT NULL,
    status         VARCHAR(20)   NOT NULL DEFAULT 'paid',
    method         VARCHAR(20),
    paid_at        DATETIME,
    note           TEXT,
    created_at     DATETIME      NOT NULL,
    updated_at     DATETIME,
    appointment_id INT,
    patient_id     INT,
    received_by    INT,
    PRIMARY KEY (id),
    UNIQUE KEY uq_invoices_code            (invoice_code),
    UNIQUE KEY uq_invoices_appointment_id  (appointment_id),
    INDEX idx_invoices_status     (status),
    INDEX idx_invoices_patient_id (patient_id),
    INDEX idx_invoices_paid_at    (paid_at),
    CONSTRAINT fk_inv_appointment FOREIGN KEY (appointment_id) REFERENCES appointments (id),
    CONSTRAINT fk_inv_patient     FOREIGN KEY (patient_id)     REFERENCES users        (id),
    CONSTRAINT fk_inv_received_by FOREIGN KEY (received_by)    REFERENCES users        (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ── 16. notifications ────────────────────────────────────────
CREATE TABLE notifications (
    id             INT          NOT NULL AUTO_INCREMENT,
    target_role_id INT,
    type           VARCHAR(30)  NOT NULL,
    title          VARCHAR(200) NOT NULL,
    message        TEXT,
    is_read        BOOLEAN      NOT NULL DEFAULT FALSE,
    created_at     DATETIME     NOT NULL,
    user_id        INT,
    PRIMARY KEY (id),
    INDEX idx_notifications_user    (user_id),
    INDEX idx_notifications_is_read (is_read),
    CONSTRAINT fk_notif_user FOREIGN KEY (user_id) REFERENCES users (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ── 17. chat_conversations ───────────────────────────────────
CREATE TABLE chat_conversations (
    id         INT          NOT NULL AUTO_INCREMENT,
    guest_id   VARCHAR(64),               -- định danh khách vãng lai (FE sinh) khi chưa đăng nhập
    title      VARCHAR(150),              -- tóm tắt, thường lấy câu hỏi đầu tiên
    created_at DATETIME     NOT NULL,
    updated_at DATETIME,
    user_id    INT,                       -- NULL nếu là khách vãng lai
    PRIMARY KEY (id),
    INDEX idx_chat_conv_user  (user_id),
    INDEX idx_chat_conv_guest (guest_id),
    CONSTRAINT fk_chat_conv_user FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ── 18. chat_messages ────────────────────────────────────────
CREATE TABLE chat_messages (
    id              INT          NOT NULL AUTO_INCREMENT,
    role            VARCHAR(20)  NOT NULL,     -- "user" / "assistant"
    content         TEXT         NOT NULL,
    created_at      DATETIME     NOT NULL,
    conversation_id INT          NOT NULL,
    PRIMARY KEY (id),
    INDEX idx_chat_msg_conversation (conversation_id),
    CONSTRAINT fk_chat_msg_conversation FOREIGN KEY (conversation_id)
        REFERENCES chat_conversations (id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
