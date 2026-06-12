-- Migration: chuẩn hóa bảng prescriptions — bỏ patient_id & doctor_id (dữ liệu dư thừa).
-- Bệnh nhân/bác sĩ truy xuất qua: prescription → appointment → patient/doctor.
-- Chạy MỘT LẦN trên DB hiện có. Lệnh: mysql -u root -p vietskin < db/migration_prescriptions_normalize.sql

ALTER TABLE prescriptions DROP FOREIGN KEY prescriptions_patient_id_fkey;
ALTER TABLE prescriptions DROP FOREIGN KEY prescriptions_doctor_id_fkey;
ALTER TABLE prescriptions DROP COLUMN patient_id;
ALTER TABLE prescriptions DROP COLUMN doctor_id;
