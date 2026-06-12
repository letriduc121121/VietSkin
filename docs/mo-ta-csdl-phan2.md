## 2.8.2.9 Bảng appointments

Bảng appointments lưu trữ thông tin lịch hẹn khám bệnh. Đây là bảng trung tâm của hệ thống, liên kết bệnh nhân với bác sĩ và dịch vụ. Trạng thái lịch hẹn được quản lý theo state machine: pending → confirmed → checked_in → in_progress → done.

*Bảng 2.9 Mô tả bảng appointments*

| STT | Trường thông tin | Kiểu dữ liệu | Ràng buộc | Mô tả |
|:---:|:---:|:---:|:---:|:---:|
| 1 | id | INT | Khóa chính | Mã lịch hẹn |
| 2 | patient_id | INT | Khóa ngoại → users.id, Null | Mã bệnh nhân (Null nếu walk-in) |
| 3 | patient_name | VARCHAR(100) | Not Null | Tên bệnh nhân |
| 4 | patient_phone | VARCHAR(20) | Null | Số điện thoại bệnh nhân |
| 5 | patient_email | VARCHAR(100) | Null | Email bệnh nhân |
| 6 | doctor_id | INT | Khóa ngoại → doctors.id | Mã bác sĩ khám |
| 7 | service_id | INT | Khóa ngoại → services.id, Null | Mã dịch vụ đã chọn |
| 8 | date | DATE | Not Null | Ngày khám |
| 9 | time | VARCHAR(5) | Not Null | Giờ khám (VD: "09:00") |
| 10 | status | ENUM(...) | Default: pending | Trạng thái lịch hẹn |
| 11 | symptoms | VARCHAR(191) | Null | Triệu chứng mô tả ban đầu |
| 12 | queue_number | SMALLINT | Null | Số thứ tự (gán khi check-in) |
| 13 | created_at | DATETIME | Default: NOW | Ngày tạo |
| 14 | updated_at | DATETIME | Auto Update | Ngày cập nhật |

---

## 2.8.2.10 Bảng medical_records

Bảng medical_records lưu trữ bệnh án của bệnh nhân, được bác sĩ tạo trong quá trình khám bệnh. Mỗi bệnh án gắn liền với một lịch hẹn (quan hệ 1-1). Bệnh án chứa thông tin chẩn đoán, phương pháp điều trị, loại da, vị trí tổn thương và ngày tái khám.

*Bảng 2.10 Mô tả bảng medical_records*

| STT | Trường thông tin | Kiểu dữ liệu | Ràng buộc | Mô tả |
|:---:|:---:|:---:|:---:|:---:|
| 1 | id | INT | Khóa chính | Mã bệnh án |
| 2 | appointment_id | INT | Khóa ngoại → appointments.id, Unique | Mã lịch hẹn tương ứng |
| 3 | patient_id | INT | Khóa ngoại → users.id, Null | Mã bệnh nhân |
| 4 | doctor_id | INT | Khóa ngoại → doctors.id, Null | Mã bác sĩ khám |
| 5 | symptoms | VARCHAR(191) | Null | Triệu chứng chi tiết |
| 6 | skin_type | VARCHAR(50) | Null | Loại da (da dầu, da khô, da hỗn hợp) |
| 7 | lesion_location | VARCHAR(200) | Null | Vị trí tổn thương trên cơ thể |
| 8 | diagnosis | VARCHAR(191) | Null | Chẩn đoán bệnh |
| 9 | treatment | VARCHAR(191) | Null | Phương pháp điều trị |
| 10 | note | VARCHAR(191) | Null | Ghi chú của bác sĩ |
| 11 | follow_up_date | DATE | Null | Ngày hẹn tái khám |
| 12 | created_at | DATETIME | Default: NOW | Ngày tạo |
| 13 | updated_at | DATETIME | Auto Update | Ngày cập nhật |

---

## 2.8.2.11 Bảng medicines

Bảng medicines lưu trữ danh mục thuốc trong hệ thống. Quản trị viên sử dụng bảng này để cấu hình sẵn các loại thuốc, giúp bác sĩ chọn nhanh khi kê đơn.

*Bảng 2.11 Mô tả bảng medicines*

| STT | Trường thông tin | Kiểu dữ liệu | Ràng buộc | Mô tả |
|:---:|:---:|:---:|:---:|:---:|
| 1 | id | INT | Khóa chính | Mã thuốc |
| 2 | name | VARCHAR(150) | Not Null | Tên thuốc |
| 3 | unit | VARCHAR(30) | Null | Đơn vị tính (viên, tuýp, lọ) |
| 4 | category | VARCHAR(60) | Null | Nhóm thuốc (Kháng sinh, Thuốc bôi) |
| 5 | description | VARCHAR(191) | Null | Mô tả công dụng thuốc |
| 6 | active | TINYINT(1) | Default: true | Trạng thái hoạt động |
| 7 | created_at | DATETIME | Default: NOW | Ngày tạo |

---

## 2.8.2.12 Bảng prescriptions

Bảng prescriptions lưu trữ đơn thuốc do bác sĩ kê cho bệnh nhân sau khi khám. Mỗi đơn thuốc được liên kết 1-1 với một lịch hẹn và một bệnh án. Chi tiết các thuốc trong đơn được lưu ở bảng prescription_items.

*Bảng 2.12 Mô tả bảng prescriptions*

| STT | Trường thông tin | Kiểu dữ liệu | Ràng buộc | Mô tả |
|:---:|:---:|:---:|:---:|:---:|
| 1 | id | INT | Khóa chính | Mã đơn thuốc |
| 2 | appointment_id | INT | Khóa ngoại → appointments.id, Unique | Mã lịch hẹn |
| 3 | medical_record_id | INT | Khóa ngoại → medical_records.id, Unique | Mã bệnh án |
| 4 | patient_id | INT | Khóa ngoại → users.id, Null | Mã bệnh nhân |
| 5 | doctor_id | INT | Khóa ngoại → doctors.id, Null | Mã bác sĩ kê đơn |
| 6 | note | VARCHAR(191) | Null | Ghi chú dặn dò bệnh nhân |
| 7 | created_at | DATETIME | Default: NOW | Ngày tạo |

---

## 2.8.2.13 Bảng prescription_items

Bảng prescription_items lưu trữ chi tiết từng loại thuốc trong một đơn thuốc, bao gồm liều dùng, tần suất, thời gian sử dụng và số lượng. Mỗi bản ghi tham chiếu đến một thuốc trong danh mục (medicines) và thuộc về một đơn thuốc (prescriptions).

*Bảng 2.13 Mô tả bảng prescription_items*

| STT | Trường thông tin | Kiểu dữ liệu | Ràng buộc | Mô tả |
|:---:|:---:|:---:|:---:|:---:|
| 1 | id | INT | Khóa chính | Mã chi tiết đơn thuốc |
| 2 | prescription_id | INT | Khóa ngoại → prescriptions.id | Mã đơn thuốc |
| 3 | medicine_id | INT | Khóa ngoại → medicines.id, Null | Mã thuốc trong danh mục |
| 4 | medicine_name | VARCHAR(150) | Not Null | Tên thuốc (lưu snapshot) |
| 5 | dosage | VARCHAR(80) | Null | Liều dùng (VD: 1 viên) |
| 6 | frequency | VARCHAR(80) | Null | Tần suất (VD: 2 lần/ngày) |
| 7 | duration | VARCHAR(50) | Null | Thời gian dùng (VD: 7 ngày) |
| 8 | quantity | INT | Null | Số lượng |
| 9 | note | VARCHAR(191) | Null | Ghi chú cách dùng |

---

## 2.8.2.14 Bảng invoices

Bảng invoices lưu trữ hóa đơn thanh toán. Lễ tân tạo hóa đơn khi bệnh nhân check-in và thanh toán phí khám. Mỗi hóa đơn liên kết 1-1 với một lịch hẹn.

*Bảng 2.14 Mô tả bảng invoices*

| STT | Trường thông tin | Kiểu dữ liệu | Ràng buộc | Mô tả |
|:---:|:---:|:---:|:---:|:---:|
| 1 | id | INT | Khóa chính | Mã hóa đơn |
| 2 | invoice_code | VARCHAR(20) | Unique | Mã hóa đơn hiển thị (VD: INV-2026-0001) |
| 3 | appointment_id | INT | Khóa ngoại → appointments.id, Unique | Mã lịch hẹn |
| 4 | patient_id | INT | Khóa ngoại → users.id, Null | Mã bệnh nhân |
| 5 | patient_name | VARCHAR(100) | Not Null | Tên bệnh nhân |
| 6 | description | VARCHAR(255) | Null | Mô tả dịch vụ thanh toán |
| 7 | amount | DECIMAL(12,2) | Not Null | Số tiền thanh toán (VNĐ) |
| 8 | status | ENUM('unpaid','paid','refunded') | Default: paid | Trạng thái thanh toán |
| 9 | method | ENUM('cash','bank_transfer','qr_code','card') | Null | Phương thức thanh toán |
| 10 | paid_at | DATETIME | Null | Thời điểm thanh toán |
| 11 | received_by | INT | Khóa ngoại → users.id, Null | Mã lễ tân thu tiền |
| 12 | note | VARCHAR(191) | Null | Ghi chú |
| 13 | created_at | DATETIME | Default: NOW | Ngày tạo |
| 14 | updated_at | DATETIME | Auto Update | Ngày cập nhật |

---

## 2.8.2.15 Bảng notifications

Bảng notifications lưu trữ thông báo gửi đến người dùng. Hệ thống sử dụng bảng này để thông báo trạng thái lịch hẹn, nhắc nhở tái khám và các thông báo hệ thống. Thông báo có thể gửi đến một người dùng cụ thể (user_id) hoặc theo vai trò (target_role_id).

*Bảng 2.15 Mô tả bảng notifications*

| STT | Trường thông tin | Kiểu dữ liệu | Ràng buộc | Mô tả |
|:---:|:---:|:---:|:---:|:---:|
| 1 | id | INT | Khóa chính | Mã thông báo |
| 2 | user_id | INT | Khóa ngoại → users.id, Null | Mã người nhận cụ thể |
| 3 | target_role_id | INT | Null | Gửi broadcast theo vai trò |
| 4 | type | VARCHAR(30) | Not Null | Loại thông báo (appointment, reminder, system) |
| 5 | title | VARCHAR(200) | Not Null | Tiêu đề thông báo |
| 6 | message | VARCHAR(191) | Null | Nội dung thông báo |
| 7 | is_read | TINYINT(1) | Default: false | Trạng thái đã đọc |
| 8 | created_at | DATETIME | Default: NOW | Ngày tạo |
