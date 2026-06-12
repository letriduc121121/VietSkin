# MÔ TẢ CƠ SỞ DỮ LIỆU — HỆ THỐNG QUẢN LÝ PHÒNG KHÁM DA LIỄU VIETSKIN

Hệ thống gồm **18 bảng**, chia theo 6 nhóm chức năng:

| Nhóm | Các bảng |
|------|----------|
| Phân quyền & người dùng | Role, User, PatientProfile |
| Bác sĩ & lịch làm việc | Doctor, Room, DoctorWorkDay, TimeSlot |
| Đặt khám & thanh toán | Service, Appointment, Invoice |
| Khám bệnh & kê đơn | MedicalRecord, MedicalRecordImage, Prescription, PrescriptionItem, Medicine |
| Thông báo | Notification |
| Trợ lý ảo AI | ChatConversation, ChatMessage |

Ghi chú ký hiệu: **PK** = khóa chính, **FK** = khóa ngoại, **UQ** = duy nhất, **NN** = không null (bắt buộc), **D** = giá trị mặc định.

---

## 1. Role — Vai trò người dùng
Lưu các nhóm quyền trong hệ thống (admin, lễ tân, bác sĩ, bệnh nhân).

| Cột | Kiểu | Ràng buộc | Mô tả |
|-----|------|-----------|-------|
| id | INT | PK | Mã vai trò |
| code | VARCHAR(20) | UQ, NN | Mã định danh vai trò (admin, doctor...) |
| name | VARCHAR(50) | NN | Tên hiển thị vai trò |
| description | TEXT | | Mô tả chi tiết |
| active | BOOLEAN | D: true | Còn sử dụng hay không |
| created_at | DATETIME | | Ngày tạo |

## 2. User — Tài khoản người dùng
Tài khoản đăng nhập chung cho mọi vai trò. Đăng nhập bằng **số điện thoại**.

| Cột | Kiểu | Ràng buộc | Mô tả |
|-----|------|-----------|-------|
| id | INT | PK | Mã người dùng |
| username | VARCHAR(50) | UQ, NN | Tên đăng nhập nội bộ (tự sinh `user_09xxxxxxxx`) |
| password_hash | VARCHAR(191) | NN | Mật khẩu đã mã hóa |
| name | VARCHAR(100) | NN | Họ tên |
| email | VARCHAR(100) | | Email |
| phone | VARCHAR(20) | UQ, NN | Số điện thoại (dùng để đăng nhập) |
| avatar | VARCHAR(255) | | Ảnh đại diện |
| active | BOOLEAN | D: true | Trạng thái hoạt động |
| last_login_at | DATETIME | | Lần đăng nhập gần nhất |
| role_id | INT | FK → Role | Vai trò |
| created_at | DATETIME | | Ngày tạo |
| updated_at | DATETIME | | Ngày cập nhật |

## 3. PatientProfile — Hồ sơ bệnh nhân
Thông tin chi tiết của bệnh nhân, mở rộng từ User (mỗi User bệnh nhân có tối đa 1 hồ sơ).

| Cột | Kiểu | Ràng buộc | Mô tả |
|-----|------|-----------|-------|
| id | INT | PK | Mã hồ sơ |
| user_id | INT | FK → User, UQ, NN | Tài khoản tương ứng |
| patient_code | VARCHAR(20) | UQ | Mã bệnh nhân |
| date_of_birth | DATE | | Ngày sinh |
| gender | ENUM(male, female, other) | | Giới tính |
| address | VARCHAR(191) | | Địa chỉ |
| province / district / ward | VARCHAR(100) | | Tỉnh / huyện / xã |
| citizen_id | VARCHAR(20) | | Số CCCD |
| ethnicity | VARCHAR(50) | | Dân tộc |
| blood_type | VARCHAR(5) | | Nhóm máu |
| emergency_contact | VARCHAR(100) | | Liên hệ khẩn cấp |
| medical_history | TEXT | | Tiền sử bệnh |
| allergies | TEXT | | Dị ứng |
| created_at / updated_at | DATETIME | | Ngày tạo / cập nhật |

## 4. Doctor — Bác sĩ
Thông tin chuyên môn của bác sĩ, mở rộng từ User.

| Cột | Kiểu | Ràng buộc | Mô tả |
|-----|------|-----------|-------|
| id | INT | PK | Mã bác sĩ |
| user_id | INT | FK → User, UQ | Tài khoản tương ứng |
| specialty | VARCHAR(100) | | Chuyên khoa |
| experience | VARCHAR(50) | | Kinh nghiệm |
| degree | VARCHAR(100) | | Học vị / bằng cấp |
| description | TEXT | | Giới thiệu |
| keywords | JSON | | Từ khóa (dùng cho tìm kiếm/chatbot) |
| consultation_fee | DECIMAL(12,2) | | Phí khám |
| active | BOOLEAN | D: true | Trạng thái hoạt động |
| created_at | DATETIME | | Ngày tạo |

## 5. Room — Phòng khám
Phòng khám bệnh, mỗi phòng có thể gán cho 1 bác sĩ.

| Cột | Kiểu | Ràng buộc | Mô tả |
|-----|------|-----------|-------|
| id | INT | PK | Mã phòng |
| name | VARCHAR(50) | NN | Tên phòng |
| doctor_id | INT | FK → Doctor, UQ | Bác sĩ phụ trách |
| active | BOOLEAN | D: true | Trạng thái sử dụng |
| created_at | DATETIME | | Ngày tạo |

## 6. DoctorWorkDay — Ngày làm việc của bác sĩ
Lịch phân công bác sĩ làm việc tại 1 phòng trong 1 ngày.

| Cột | Kiểu | Ràng buộc | Mô tả |
|-----|------|-----------|-------|
| id | INT | PK | Mã lịch làm việc |
| doctor_id | INT | FK → Doctor, UQ(doctor, date) | Bác sĩ |
| room_id | INT | FK → Room, UQ(room, date) | Phòng làm việc |
| date | DATE | NN | Ngày làm việc |
| created_by | INT | | Người tạo lịch |
| created_at | DATETIME | | Ngày tạo |

## 7. TimeSlot — Khung giờ khám
Các khung giờ trong ngày của bác sĩ; có thể bị chặn (nghỉ, bận).

| Cột | Kiểu | Ràng buộc | Mô tả |
|-----|------|-----------|-------|
| id | INT | PK | Mã khung giờ |
| doctor_id | INT | FK → Doctor, NN | Bác sĩ |
| date | DATE | NN | Ngày |
| slot_time | VARCHAR(5) | NN | Giờ bắt đầu (HH:mm) |
| is_blocked | BOOLEAN | D: false | Khung giờ bị chặn |
| note | TEXT | | Ghi chú lý do chặn |
| created_at | DATETIME | | Ngày tạo |

## 8. Service — Dịch vụ
Danh mục dịch vụ của phòng khám.

| Cột | Kiểu | Ràng buộc | Mô tả |
|-----|------|-----------|-------|
| id | INT | PK | Mã dịch vụ |
| name | VARCHAR(150) | NN | Tên dịch vụ |
| description | TEXT | | Mô tả |
| price | DECIMAL(12,2) | NN | Giá tiền |
| duration | SMALLINT | D: 30 | Thời lượng (phút) |
| category | VARCHAR(60) | | Nhóm dịch vụ |
| image_url | VARCHAR(500) | | Ảnh minh họa |
| active | BOOLEAN | D: true | Trạng thái |
| created_at / updated_at | DATETIME | | Ngày tạo / cập nhật |

## 9. Appointment — Lịch hẹn khám
Lịch hẹn của bệnh nhân (đặt online hoặc lễ tân tạo cho khách walk-in).

| Cột | Kiểu | Ràng buộc | Mô tả |
|-----|------|-----------|-------|
| id | INT | PK | Mã lịch hẹn |
| patient_id | INT | FK → User | Bệnh nhân (NULL nếu khách walk-in chưa có tài khoản) |
| patient_name | VARCHAR(100) | NN | Tên người khám |
| patient_phone | VARCHAR(20) | | SĐT liên hệ |
| patient_email | VARCHAR(100) | | Email liên hệ |
| doctor_id | INT | FK → Doctor, NN | Bác sĩ khám |
| service_id | INT | FK → Service | Dịch vụ |
| date | DATE | NN | Ngày hẹn |
| time | VARCHAR(5) | NN | Giờ hẹn |
| status | ENUM | D: pending | Trạng thái (pending, confirmed, checked_in, done, cancelled, no_show) |
| symptoms | TEXT | | Triệu chứng khai báo |
| queue_number | SMALLINT | | Số thứ tự chờ khám |
| created_at / updated_at | DATETIME | | Ngày tạo / cập nhật |

## 10. Invoice — Hóa đơn
Hóa đơn thanh toán cho 1 lịch hẹn.

| Cột | Kiểu | Ràng buộc | Mô tả |
|-----|------|-----------|-------|
| id | INT | PK | Mã hóa đơn |
| invoice_code | VARCHAR(20) | UQ, NN | Số hóa đơn |
| appointment_id | INT | FK → Appointment, UQ | Lịch hẹn tương ứng |
| patient_id | INT | FK → User | Bệnh nhân |
| patient_name | VARCHAR(100) | NN | Tên người thanh toán |
| description | VARCHAR(255) | | Nội dung |
| amount | DECIMAL(12,2) | NN | Số tiền |
| status | ENUM | D: paid | Trạng thái (paid, pending, refunded...) |
| method | ENUM | | Hình thức (cash, transfer, card...) |
| paid_at | DATETIME | | Thời điểm thanh toán |
| received_by | INT | FK → User | Nhân viên thu tiền |
| note | TEXT | | Ghi chú |
| created_at / updated_at | DATETIME | | Ngày tạo / cập nhật |

## 11. MedicalRecord — Hồ sơ khám bệnh
Kết quả khám bệnh, gắn với 1 lịch hẹn.

| Cột | Kiểu | Ràng buộc | Mô tả |
|-----|------|-----------|-------|
| id | INT | PK | Mã hồ sơ khám |
| appointment_id | INT | FK → Appointment, UQ | Lịch hẹn |
| patient_id | INT | FK → User | Bệnh nhân |
| doctor_id | INT | FK → Doctor | Bác sĩ khám |
| symptoms | TEXT | | Triệu chứng |
| skin_type | VARCHAR(50) | | Loại da |
| lesion_location | VARCHAR(200) | | Vị trí tổn thương |
| diagnosis | TEXT | | Chẩn đoán |
| treatment | TEXT | | Hướng điều trị |
| note | TEXT | | Ghi chú |
| follow_up_date | DATE | | Ngày tái khám |
| created_at / updated_at | DATETIME | | Ngày tạo / cập nhật |

## 12. MedicalRecordImage — Ảnh khám bệnh
Ảnh tổn thương da đính kèm hồ sơ khám (lưu trên Cloudinary).

| Cột | Kiểu | Ràng buộc | Mô tả |
|-----|------|-----------|-------|
| id | INT | PK | Mã ảnh |
| medical_record_id | INT | FK → MedicalRecord, NN | Hồ sơ khám |
| image_url | VARCHAR(500) | NN | Đường dẫn ảnh |
| public_id | VARCHAR(200) | NN | ID ảnh trên Cloudinary (để xóa) |
| note | TEXT | | Ghi chú |
| created_at | DATETIME | | Ngày tạo |

## 13. Prescription — Đơn thuốc
Đơn thuốc do bác sĩ kê sau khi khám.

| Cột | Kiểu | Ràng buộc | Mô tả |
|-----|------|-----------|-------|
| id | INT | PK | Mã đơn thuốc |
| appointment_id | INT | FK → Appointment | Lịch hẹn |
| medical_record_id | INT | FK → MedicalRecord | Hồ sơ khám |
| patient_id | INT | FK → User | Bệnh nhân |
| doctor_id | INT | FK → Doctor | Bác sĩ kê đơn |
| note | TEXT | | Lời dặn |
| created_at | DATETIME | | Ngày tạo |

## 14. PrescriptionItem — Chi tiết đơn thuốc
Từng loại thuốc trong 1 đơn.

| Cột | Kiểu | Ràng buộc | Mô tả |
|-----|------|-----------|-------|
| id | INT | PK | Mã dòng |
| prescription_id | INT | FK → Prescription, NN | Đơn thuốc |
| medicine_id | INT | FK → Medicine | Thuốc (NULL nếu thuốc đã bị xóa) |
| medicine_name | VARCHAR(150) | NN | Tên thuốc (lưu lại để giữ lịch sử) |
| dosage | VARCHAR(80) | | Liều dùng |
| frequency | VARCHAR(80) | | Tần suất |
| duration | VARCHAR(50) | | Thời gian dùng |
| quantity | INT | | Số lượng |
| note | TEXT | | Ghi chú |

## 15. Medicine — Danh mục thuốc
Kho danh mục thuốc của phòng khám.

| Cột | Kiểu | Ràng buộc | Mô tả |
|-----|------|-----------|-------|
| id | INT | PK | Mã thuốc |
| name | VARCHAR(150) | NN | Tên thuốc |
| unit | VARCHAR(30) | | Đơn vị (viên, tuýp...) |
| category | VARCHAR(60) | | Nhóm thuốc |
| description | TEXT | | Mô tả |
| active | BOOLEAN | D: true | Còn sử dụng |
| created_at | DATETIME | | Ngày tạo |

## 16. Notification — Thông báo
Thông báo gửi tới người dùng hoặc nhóm vai trò.

| Cột | Kiểu | Ràng buộc | Mô tả |
|-----|------|-----------|-------|
| id | INT | PK | Mã thông báo |
| user_id | INT | FK → User | Người nhận (NULL nếu gửi theo vai trò) |
| target_role_id | INT | | Gửi cho cả 1 nhóm vai trò |
| type | VARCHAR(30) | NN | Loại thông báo |
| title | VARCHAR(200) | NN | Tiêu đề |
| message | TEXT | | Nội dung |
| is_read | BOOLEAN | D: false | Đã đọc hay chưa |
| created_at | DATETIME | | Ngày tạo |

## 17. ChatConversation — Cuộc trò chuyện với chatbot AI
Một phiên trò chuyện giữa người dùng và trợ lý ảo AI.

| Cột | Kiểu | Ràng buộc | Mô tả |
|-----|------|-----------|-------|
| id | INT | PK | Mã cuộc trò chuyện |
| user_id | INT | FK → User | Người dùng (NULL nếu khách vãng lai chưa đăng nhập) |
| guest_id | VARCHAR(64) | | Mã định danh khách vãng lai (lưu ở localStorage) |
| title | VARCHAR(150) | | Tiêu đề (thường là câu hỏi đầu tiên) |
| created_at | DATETIME | | Ngày tạo |
| updated_at | DATETIME | | Lần chat gần nhất |

## 18. ChatMessage — Tin nhắn chatbot AI
Từng tin nhắn trong 1 cuộc trò chuyện.

| Cột | Kiểu | Ràng buộc | Mô tả |
|-----|------|-----------|-------|
| id | INT | PK | Mã tin nhắn |
| conversation_id | INT | FK → ChatConversation, NN | Cuộc trò chuyện chứa tin nhắn |
| role | ENUM(user, assistant) | NN | Người gửi: user (người dùng) hoặc assistant (bot AI) |
| content | TEXT | NN | Nội dung tin nhắn |
| created_at | DATETIME | | Thời điểm gửi |

---

## TỔNG HỢP QUAN HỆ CHÍNH

| Quan hệ | Loại | Bội số |
|---------|------|--------|
| Role → User | Liên kết | 1 — * |
| User → PatientProfile | Sở hữu (composition) | 1 — 0..1 |
| User → Doctor | Liên kết | 1 — 0..1 |
| User → Notification | Liên kết | 1 — * |
| User → Appointment | Liên kết | 1 — * |
| User → ChatConversation | Liên kết | 0..1 — * |
| Doctor → Room | Liên kết | 1 — 0..1 |
| Doctor → DoctorWorkDay | Liên kết | 1 — * |
| Room → DoctorWorkDay | Liên kết | 1 — * |
| Doctor → TimeSlot | Liên kết | 1 — * |
| Doctor → Appointment | Liên kết | 1 — * |
| Service → Appointment | Liên kết | 0..1 — * |
| Appointment → MedicalRecord | Sở hữu (composition) | 1 — 0..1 |
| Appointment → Invoice | Sở hữu (composition) | 1 — 0..1 |
| Appointment → Prescription | Liên kết | 1 — * |
| MedicalRecord → MedicalRecordImage | Sở hữu (composition) | 1 — * |
| MedicalRecord → Prescription | Sở hữu (composition) | 1 — * |
| Prescription → PrescriptionItem | Sở hữu (composition) | 1 — * |
| Medicine → PrescriptionItem | Liên kết | 0..1 — * |
| ChatConversation → ChatMessage | Sở hữu (composition) | 1 — * |
