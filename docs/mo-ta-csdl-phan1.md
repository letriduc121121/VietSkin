# 2.8.2 Mô tả các bảng

Hệ thống VietSkin sử dụng cơ sở dữ liệu MySQL gồm **14 bảng** được chia thành 6 nhóm chức năng. Dưới đây là mô tả chi tiết từng bảng.

---

## 2.8.2.1 Bảng roles

Bảng roles lưu trữ danh sách các vai trò trong hệ thống, bao gồm: Quản trị viên (admin), Bác sĩ (doctor), Lễ tân (receptionist) và Bệnh nhân (patient). Mỗi người dùng được gán đúng một vai trò.

*Bảng 2.1 Mô tả bảng roles*

| STT | Trường thông tin | Kiểu dữ liệu | Ràng buộc | Mô tả |
|:---:|:---:|:---:|:---:|:---:|
| 1 | id | INT | Khóa chính | Mã vai trò |
| 2 | code | VARCHAR(20) | Unique | Mã code vai trò (admin, doctor, receptionist, patient) |
| 3 | name | VARCHAR(50) | Not Null | Tên hiển thị vai trò |
| 4 | description | TEXT | Null | Mô tả vai trò |
| 5 | active | TINYINT(1) | Default: true | Trạng thái hoạt động |
| 6 | created_at | DATETIME | Default: NOW | Ngày tạo |

---

## 2.8.2.2 Bảng users

Bảng users lưu trữ thông tin tài khoản của tất cả người dùng trong hệ thống (quản trị viên, bác sĩ, lễ tân, bệnh nhân). Mỗi người dùng được liên kết với một vai trò thông qua khóa ngoại role_id.

*Bảng 2.2 Mô tả bảng users*

| STT | Trường thông tin | Kiểu dữ liệu | Ràng buộc | Mô tả |
|:---:|:---:|:---:|:---:|:---:|
| 1 | id | INT | Khóa chính | Mã người dùng |
| 2 | username | VARCHAR(50) | Unique | Tên đăng nhập |
| 3 | password_hash | VARCHAR(191) | Not Null | Mật khẩu đã mã hóa bcrypt |
| 4 | role_id | INT | Khóa ngoại → roles.id | Mã vai trò |
| 5 | name | VARCHAR(100) | Not Null | Họ và tên |
| 6 | email | VARCHAR(100) | Null | Địa chỉ email |
| 7 | phone | VARCHAR(20) | Unique | Số điện thoại |
| 8 | avatar | VARCHAR(255) | Null | Đường dẫn ảnh đại diện |
| 9 | active | TINYINT(1) | Default: true | Trạng thái tài khoản |
| 10 | last_login_at | DATETIME | Null | Lần đăng nhập cuối |
| 11 | created_at | DATETIME | Default: NOW | Ngày tạo |
| 12 | updated_at | DATETIME | Auto Update | Ngày cập nhật |

---

## 2.8.2.3 Bảng patient_profiles

Bảng patient_profiles lưu trữ thông tin hồ sơ y tế chi tiết của bệnh nhân, bao gồm ngày sinh, giới tính, địa chỉ, tiền sử bệnh, dị ứng và nhóm máu. Mỗi bệnh nhân có đúng một hồ sơ liên kết 1-1 với bảng users.

*Bảng 2.3 Mô tả bảng patient_profiles*

| STT | Trường thông tin | Kiểu dữ liệu | Ràng buộc | Mô tả |
|:---:|:---:|:---:|:---:|:---:|
| 1 | id | INT | Khóa chính | Mã hồ sơ bệnh nhân |
| 2 | user_id | INT | Khóa ngoại → users.id, Unique | Mã người dùng |
| 3 | patient_code | VARCHAR(20) | Unique, Null | Mã bệnh nhân (VD: BN000001) |
| 4 | date_of_birth | DATE | Null | Ngày sinh |
| 5 | gender | ENUM('male','female','other') | Null | Giới tính |
| 6 | address | VARCHAR(191) | Null | Địa chỉ chi tiết |
| 7 | province | VARCHAR(100) | Null | Tỉnh/Thành phố |
| 8 | district | VARCHAR(100) | Null | Quận/Huyện |
| 9 | ward | VARCHAR(100) | Null | Phường/Xã |
| 10 | citizen_id | VARCHAR(20) | Null | Số căn cước công dân |
| 11 | ethnicity | VARCHAR(50) | Null | Dân tộc |
| 12 | medical_history | TEXT | Null | Tiền sử bệnh |
| 13 | allergies | VARCHAR(191) | Null | Thông tin dị ứng |
| 14 | blood_type | VARCHAR(5) | Null | Nhóm máu |
| 15 | emergency_contact | VARCHAR(100) | Null | Liên hệ khẩn cấp |
| 16 | created_at | DATETIME | Default: NOW | Ngày tạo |
| 17 | updated_at | DATETIME | Auto Update | Ngày cập nhật |

---

## 2.8.2.4 Bảng doctors

Bảng doctors lưu trữ thông tin chuyên môn của bác sĩ, bao gồm chuyên khoa, kinh nghiệm, học vị và phí khám. Mỗi bác sĩ được liên kết 1-1 với một tài khoản người dùng trong bảng users.

*Bảng 2.4 Mô tả bảng doctors*

| STT | Trường thông tin | Kiểu dữ liệu | Ràng buộc | Mô tả |
|:---:|:---:|:---:|:---:|:---:|
| 1 | id | INT | Khóa chính | Mã bác sĩ |
| 2 | user_id | INT | Khóa ngoại → users.id, Unique | Mã tài khoản người dùng |
| 3 | specialty | VARCHAR(100) | Null | Chuyên khoa |
| 4 | experience | VARCHAR(50) | Null | Kinh nghiệm làm việc |
| 5 | degree | VARCHAR(100) | Null | Học vị/Học hàm |
| 6 | description | VARCHAR(191) | Null | Mô tả giới thiệu bác sĩ |
| 7 | keywords | JSON | Default: [] | Từ khóa chuyên môn |
| 8 | consultation_fee | DECIMAL(12,2) | Default: 150000 | Phí khám bệnh |
| 9 | active | TINYINT(1) | Default: true | Trạng thái hoạt động |
| 10 | created_at | DATETIME | Default: NOW | Ngày tạo |

---

## 2.8.2.5 Bảng rooms

Bảng rooms lưu trữ danh sách các phòng khám trong phòng khám. Mỗi phòng có thể được gán cho một bác sĩ phụ trách (quan hệ 1-1 với bảng doctors).

*Bảng 2.5 Mô tả bảng rooms*

| STT | Trường thông tin | Kiểu dữ liệu | Ràng buộc | Mô tả |
|:---:|:---:|:---:|:---:|:---:|
| 1 | id | INT | Khóa chính | Mã phòng khám |
| 2 | name | VARCHAR(50) | Not Null | Tên phòng (VD: Phòng khám 1) |
| 3 | doctor_id | INT | Khóa ngoại → doctors.id, Unique, Null | Bác sĩ phụ trách phòng |
| 4 | active | TINYINT(1) | Default: true | Trạng thái hoạt động |
| 5 | created_at | DATETIME | Default: NOW | Ngày tạo |

---

## 2.8.2.6 Bảng doctor_work_days

Bảng doctor_work_days lưu trữ lịch làm việc của bác sĩ theo từng ngày. Mỗi bản ghi xác định bác sĩ nào làm việc tại phòng nào vào ngày nào. Ràng buộc đảm bảo mỗi bác sĩ chỉ làm 1 phòng/ngày và mỗi phòng chỉ có 1 bác sĩ/ngày.

*Bảng 2.6 Mô tả bảng doctor_work_days*

| STT | Trường thông tin | Kiểu dữ liệu | Ràng buộc | Mô tả |
|:---:|:---:|:---:|:---:|:---:|
| 1 | id | INT | Khóa chính | Mã bản ghi |
| 2 | doctor_id | INT | Khóa ngoại → doctors.id, Unique(doctor_id, date) | Mã bác sĩ |
| 3 | room_id | INT | Khóa ngoại → rooms.id, Unique(room_id, date) | Mã phòng khám |
| 4 | date | DATE | Not Null | Ngày làm việc |
| 5 | created_by | INT | Null | Người phân lịch (Admin) |
| 6 | created_at | DATETIME | Default: NOW | Ngày tạo |

---

## 2.8.2.7 Bảng time_slots

Bảng time_slots lưu trữ các khung giờ khám của bác sĩ theo từng ngày. Khi bệnh nhân đặt lịch, hệ thống sẽ đánh dấu khung giờ đó là đã bị chặn (is_blocked = true) để tránh đặt trùng.

*Bảng 2.7 Mô tả bảng time_slots*

| STT | Trường thông tin | Kiểu dữ liệu | Ràng buộc | Mô tả |
|:---:|:---:|:---:|:---:|:---:|
| 1 | id | INT | Khóa chính | Mã khung giờ |
| 2 | doctor_id | INT | Khóa ngoại → doctors.id | Mã bác sĩ |
| 3 | date | DATE | Not Null | Ngày khám |
| 4 | slot_time | VARCHAR(5) | Not Null, Unique(doctor_id, date, slot_time) | Giờ khám (VD: "09:00") |
| 5 | is_blocked | TINYINT(1) | Default: false | Đã bị chặn hay chưa |
| 6 | note | VARCHAR(191) | Null | Ghi chú |
| 7 | created_at | DATETIME | Default: NOW | Ngày tạo |

---

## 2.8.2.8 Bảng services

Bảng services lưu trữ danh mục các dịch vụ khám bệnh mà phòng khám cung cấp, bao gồm tên dịch vụ, giá, thời lượng khám và phân loại.

*Bảng 2.8 Mô tả bảng services*

| STT | Trường thông tin | Kiểu dữ liệu | Ràng buộc | Mô tả |
|:---:|:---:|:---:|:---:|:---:|
| 1 | id | INT | Khóa chính | Mã dịch vụ |
| 2 | name | VARCHAR(150) | Not Null | Tên dịch vụ |
| 3 | description | VARCHAR(191) | Null | Mô tả dịch vụ |
| 4 | price | DECIMAL(12,2) | Not Null | Giá dịch vụ (VNĐ) |
| 5 | duration | SMALLINT | Default: 30 | Thời lượng khám (phút) |
| 6 | category | VARCHAR(60) | Null | Nhóm dịch vụ (Khám thường, Tái khám) |
| 7 | image_url | VARCHAR(500) | Null | Đường dẫn ảnh minh họa |
| 8 | active | TINYINT(1) | Default: true | Trạng thái hoạt động |
| 9 | created_at | DATETIME | Default: NOW | Ngày tạo |
| 10 | updated_at | DATETIME | Auto Update | Ngày cập nhật |
