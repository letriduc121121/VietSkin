# Mô Tả Đề Tài: Hệ Thống Quản Lý Phòng Khám Da Liễu VietSkin

> File này dùng để paste vào prompt khi học OOAD / thiết kế CSDL.
> Cập nhật lần cuối: 2026-05-03

---

## 1. Tổng Quan Hệ Thống

**Tên hệ thống:** VietSkin — Hệ thống quản lý phòng khám da liễu  
**Mục đích:** Số hóa toàn bộ quy trình hoạt động của một phòng khám da liễu tư nhân, từ đặt lịch → khám bệnh → kê đơn → thanh toán.  
**Phạm vi:** Một phòng khám, nhiều bác sĩ, nhiều phòng khám.

---

## 2. Actors (Vai Trò Người Dùng)

| Actor | Mô tả |
|-------|-------|
| **Admin** | Quản trị toàn hệ thống: quản lý người dùng, dịch vụ, bác sĩ, báo cáo |
| **Receptionist (Lễ tân)** | Tiếp đón bệnh nhân, tạo lịch hẹn walk-in, check-in, xuất hóa đơn |
| **Doctor (Bác sĩ)** | Xem lịch khám, lập bệnh án, kê đơn thuốc |
| **Patient (Bệnh nhân)** | Đặt lịch online, xem lịch sử khám, xem đơn thuốc |

**Đăng nhập:** Tất cả dùng **số điện thoại + mật khẩu** (không dùng email/username).

---

## 3. Chức Năng Chính Theo Actor

### 3.1 Patient (Bệnh nhân)
- Đăng ký tài khoản bằng SĐT
- Đặt lịch khám online: chọn bác sĩ → chọn dịch vụ → chọn ngày/giờ
- Xem danh sách lịch hẹn của mình
- Xem bệnh án sau những lần khám
- Cập nhật thông tin cá nhân (ngày sinh, giới tính, địa chỉ, nhóm máu, dị ứng...)

### 3.2 Receptionist (Lễ tân)
- Tạo lịch hẹn **walk-in** (bệnh nhân vãng lai, không cần tài khoản): lưu tên + SĐT
- Xác nhận lịch hẹn online của bệnh nhân
- Check-in khi bệnh nhân đến: cấp số thứ tự hàng đợi
- Quản lý danh sách bệnh nhân trong ngày

### 3.3 Doctor (Bác sĩ)
- Xem lịch khám trong ngày (danh sách hàng đợi)
- Tạo bệnh án: ghi triệu chứng, loại da, vị trí tổn thương, chẩn đoán, hướng điều trị
- Kê đơn thuốc: chọn thuốc từ danh mục, ghi liều dùng, số ngày
- Ghi ngày tái khám

### 3.4 Admin
- Quản lý tài khoản người dùng (CRUD, khóa/mở tài khoản)
- Quản lý danh mục dịch vụ (tên, giá, thời gian, loại)
- Quản lý bác sĩ (chuyên khoa, học vị, phí khám)
- Phân công lịch làm việc bác sĩ: ngày làm + phòng khám
- Quản lý danh mục thuốc

---

## 4. Quy Trình Nghiệp Vụ Chính

### Quy trình A — Đặt lịch Online (Patient tự đặt)
```
Patient đặt lịch (status: pending)
  → Lễ tân xác nhận (status: confirmed)
  → Bệnh nhân đến, lễ tân check-in (status: checked_in, cấp số TT)
  → Bác sĩ khám (status: in_progress)
  → Bác sĩ hoàn thành, lập bệnh án + kê đơn (status: done)
  → Lễ tân xuất hóa đơn
```

### Quy trình B — Walk-in (Lễ tân tạo trực tiếp)
```
Bệnh nhân đến trực tiếp, lễ tân tạo lịch hẹn (patientId = NULL, lưu tên+SĐT)
  → Check-in luôn (status: checked_in)
  → Bác sĩ khám → bệnh án + đơn thuốc (status: done)
  → Lễ tân xuất hóa đơn
```

### Quy trình C — Liên kết tài khoản (Auto-link)
```
Nếu bệnh nhân walk-in sau đó đăng ký tài khoản với SĐT đã có
  → Hệ thống tự gắn patientId vào các appointment walk-in cũ
```

---

## 5. Quy Tắc Nghiệp Vụ (Business Rules)

1. Mỗi lịch hẹn phải có **1 bác sĩ** phụ trách.
2. Một bác sĩ chỉ làm việc tại **1 phòng** trong **1 ngày**.
3. Một time slot (bác sĩ + ngày + giờ) chỉ đặt **1 lịch hẹn**.
4. Bệnh nhân walk-in **không cần tài khoản** — chỉ cần tên và SĐT.
5. Bệnh án và đơn thuốc được tạo sau khi khám xong, liên kết với lịch hẹn.
6. Hóa đơn liên kết 1-1 với lịch hẹn; ghi nhận người thu tiền (lễ tân).
7. Đơn thuốc có thể gồm nhiều loại thuốc (mỗi thuốc có liều + tần suất + số ngày).
8. Bác sĩ có thể **không có tài khoản** trong hệ thống (chỉ là hồ sơ bác sĩ).
9. Lịch hẹn bị hủy hoặc no-show không tạo bệnh án / hóa đơn.
10. Accesstoken hết hạn 15 phút, refresh token 7 ngày.

---

## 6. Các Thực Thể Chính (Entities) — Gợi ý ban đầu

> ⚠️ Đây là gợi ý để bắt đầu phân tích, chưa phải thiết kế cuối cùng.

| Thực thể | Ý nghĩa |
|----------|---------|
| **User** | Tài khoản hệ thống (admin/lễ tân/bác sĩ/bệnh nhân) |
| **Role** | Vai trò (admin, receptionist, doctor, patient) |
| **PatientProfile** | Thông tin y tế chi tiết của bệnh nhân |
| **Doctor** | Hồ sơ bác sĩ (chuyên khoa, học vị, phí khám) |
| **Room** | Phòng khám vật lý |
| **DoctorWorkDay** | Lịch phân công bác sĩ theo ngày + phòng |
| **TimeSlot** | Khung giờ cụ thể của bác sĩ trong ngày |
| **Service** | Dịch vụ khám (tên, giá, thời gian thực hiện) |
| **Appointment** | Lịch hẹn (online hoặc walk-in) |
| **MedicalRecord** | Bệnh án sau khi khám |
| **Medicine** | Danh mục thuốc |
| **Prescription** | Đơn thuốc |
| **PrescriptionItem** | Chi tiết từng thuốc trong đơn |
| **Invoice** | Hóa đơn thanh toán |

---

## 7. Trạng Thái Lịch Hẹn (State Machine)

```
pending → confirmed → checked_in → in_progress → done
                                                   ↑
pending → (walk-in) → checked_in ────────────────┘

Bất kỳ trạng thái nào (trừ done) → cancelled
checked_in trở đi → no_show (nếu không xuất hiện)
```

---

## 8. Thông Tin Kỹ Thuật (để tham khảo)

- **Backend:** NestJS 11 + Prisma ORM + PostgreSQL (port 5433)
- **Frontend:** React 19 + Vite + Tailwind CSS 4
- **Auth:** JWT — accessToken 15 phút, refreshToken 7 ngày
- **API format:** `{ success, statusCode, data, timestamp }`
- **Đặc biệt:** username trong DB tự sinh = `user_09xxxxxxxx`, không expose ra ngoài

---

## Cách Dùng File Này Trong Prompt

### Prompt mẫu — Xác định Entities:
```
Dưới đây là mô tả hệ thống VietSkin:
[paste toàn bộ nội dung file này]

Bước 1: Chỉ làm bước xác định Actors.
Liệt kê tất cả Actors, giải thích vai trò từng người.
Chờ tôi xác nhận trước khi sang bước tiếp theo.
```

### Prompt mẫu — Thiết kế một bảng cụ thể:
```
[paste mô tả hệ thống]

Tập trung vào thực thể Appointment.
1. Liệt kê các thuộc tính cần thiết
2. Xác định khóa chính
3. Xác định các khóa ngoại và giải thích mối quan hệ
4. Chỉ ra ràng buộc nghiệp vụ ảnh hưởng đến thiết kế bảng này
```

### Prompt mẫu — Vẽ ERD:
```
[paste mô tả hệ thống]

Vẽ ERD (dạng PlantUML) cho nhóm bảng liên quan đến quy trình khám bệnh:
Appointment → MedicalRecord → Prescription → PrescriptionItem
Giải thích từng mối quan hệ (1-1, 1-N, N-N).
```

### Prompt mẫu — Kiểm tra chuẩn hóa:
```
[paste mô tả hệ thống]

Bảng Appointment hiện có các cột:
patientId, patientName, patientPhone, patientEmail, doctorId, serviceId, date, time, status, symptoms, queueNumber

Hãy kiểm tra bảng này theo 1NF, 2NF, 3NF.
Chỉ ra vi phạm (nếu có) và giải thích tại sao thiết kế hiện tại vẫn chấp nhận được
trong bối cảnh walk-in patient.
```
