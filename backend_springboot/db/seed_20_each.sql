-- ============================================================
-- SEED: thêm MỚI 20 bản ghi cho mỗi bảng quản lý
--   services (+20), rooms (+20), doctors (+20 user+doctor), patients (+20 user+profile)
-- Mật khẩu mọi tài khoản mới: Vietskin@123 (đăng nhập bằng SĐT)
--   Bác sĩ:   SĐT 0921000001 .. 0921000020
--   Bệnh nhân: SĐT 0931000001 .. 0931000020
-- Chạy: mysql -u root -p vietskin < db/seed_20_each.sql
-- ============================================================

SET @pw := '$2b$10$QEcmpzoL8saGygoB6nILFOMhoZjOBG8XjtQFwR7fYeg3cTDHwzPoq';

-- ── 1. SERVICES (+20) ────────────────────────────────────────
INSERT INTO services (name, description, price, duration, category, active, created_at, updated_at)
WITH RECURSIVE seq(n) AS (SELECT 1 UNION ALL SELECT n+1 FROM seq WHERE n < 20)
SELECT CONCAT('Dịch vụ da liễu #', LPAD(n,2,'0')),
       CONCAT('Mô tả dịch vụ da liễu demo số ', n),
       100000 + n*50000,
       ELT(1+(n%4), 30, 45, 60, 90),
       ELT(1+(n%5), 'Khám', 'Điều trị', 'Thẩm mỹ', 'Laser', 'Chăm sóc da'),
       1, NOW(), NOW()
FROM seq;

-- ── 2. ROOMS (+20) ───────────────────────────────────────────
INSERT INTO rooms (name, active, created_at, doctor_id)
WITH RECURSIVE seq(n) AS (SELECT 1 UNION ALL SELECT n+1 FROM seq WHERE n < 20)
SELECT CONCAT('Phòng ', 200 + n), 1, NOW(), NULL
FROM seq;

-- ── 3. DOCTORS (+20): users role bác sĩ ──────────────────────
INSERT INTO users (username, password_hash, name, phone, active, created_at, updated_at, role_id)
WITH RECURSIVE seq(n) AS (SELECT 1 UNION ALL SELECT n+1 FROM seq WHERE n < 20)
SELECT CONCAT('doctor_0921', LPAD(n,6,'0')),
       @pw,
       CONCAT('BS. Demo ', LPAD(n,2,'0')),
       CONCAT('0921', LPAD(n,6,'0')),
       1, NOW(), NOW(), 2
FROM seq;

-- ...rồi tạo hồ sơ doctors trỏ vào các user vừa tạo
INSERT INTO doctors (specialty, experience, degree, description, keywords, consultation_fee, active, created_at, user_id)
SELECT ELT(1+(u.id%5), 'Da liễu tổng quát', 'Da liễu thẩm mỹ', 'Laser & Ánh sáng', 'Bệnh da nhiễm trùng', 'Dị ứng - Miễn dịch da'),
       CONCAT(3 + (u.id%15), ' năm'),
       ELT(1+(u.id%3), 'Bác sĩ CKI', 'Bác sĩ CKII', 'Thạc sĩ - Bác sĩ'),
       'Bác sĩ da liễu (dữ liệu demo)',
       JSON_ARRAY('da liễu', 'demo'),
       150000 + (u.id%5)*50000,
       1, NOW(), u.id
FROM users u
WHERE u.role_id = 2 AND u.phone LIKE '0921%';

-- ── 4. PATIENTS (+20): users role bệnh nhân ──────────────────
INSERT INTO users (username, password_hash, name, phone, active, created_at, updated_at, role_id)
WITH RECURSIVE seq(n) AS (SELECT 1 UNION ALL SELECT n+1 FROM seq WHERE n < 20)
SELECT CONCAT('user_0931', LPAD(n,6,'0')),
       @pw,
       CONCAT('Bệnh nhân Demo ', LPAD(n,2,'0')),
       CONCAT('0931', LPAD(n,6,'0')),
       1, NOW(), NOW(), 4
FROM seq;

-- ...rồi tạo patient_profiles trỏ vào các user vừa tạo
INSERT INTO patient_profiles (patient_code, gender, date_of_birth, province, blood_type, created_at, updated_at, user_id)
SELECT CONCAT('BN', LPAD(28 + ROW_NUMBER() OVER (ORDER BY u.id), 6, '0')),
       ELT(1+(u.id%2), 'male', 'female'),   -- gender là ENUM('male','female','other')
       DATE_SUB('2005-01-01', INTERVAL (u.id%40) YEAR),
       ELT(1+(u.id%4), 'Hà Nội', 'TP. Hồ Chí Minh', 'Đà Nẵng', 'Hải Phòng'),
       ELT(1+(u.id%4), 'A', 'B', 'O', 'AB'),
       NOW(), NOW(), u.id
FROM users u
WHERE u.role_id = 4 AND u.phone LIKE '0931%';
