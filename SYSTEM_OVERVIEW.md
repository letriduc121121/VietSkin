# VietSkin — Tổng Quan Hệ Thống

> **Mục đích tài liệu:** Cung cấp cái nhìn tổng quan về hệ thống quản lý phòng khám da liễu VietSkin cho developer, reviewer hoặc người mới tham gia dự án. Đọc xong tài liệu này sẽ hiểu hệ thống có những gì, hoạt động ra sao, và mở rộng ở đâu.
>
> **Cập nhật lần cuối:** 2026-05-15

---

## 1. Giới Thiệu

**VietSkin** là hệ thống quản lý phòng khám da liễu tư nhân, số hóa toàn bộ quy trình vận hành từ đặt lịch khám đến thanh toán.

**Phạm vi:** Một phòng khám — nhiều bác sĩ — nhiều phòng khám bệnh.

### Quy trình tổng quát

```
Bệnh nhân đặt lịch → Lễ tân xác nhận → Thanh toán & Check-in → Bác sĩ khám → Bệnh án + Đơn thuốc → Hoàn tất
```

---

## 2. Công Nghệ Sử Dụng

| Thành phần | Công nghệ |
|------------|-----------|
| Backend | NestJS 11, TypeScript |
| ORM | Prisma 7 |
| Database | MySQL |
| Frontend | React 19, TypeScript, Vite |
| CSS | Tailwind CSS 4 |
| Auth | JWT (access 15 phút, refresh 7 ngày) |
| Real-time | WebSocket (Socket.IO) |
| HTTP Client | Axios (auto-refresh token) |

**Cổng mặc định:**
- Backend: `http://localhost:3000`
- Frontend: `http://localhost:5173`

---

## 3. Vai Trò Người Dùng (4 Actors)

| Vai trò | Mô tả |
|---------|-------|
| **Admin** | Quản trị toàn hệ thống: nhân sự, dịch vụ, bác sĩ, phòng khám, lịch làm việc, thống kê doanh thu |
| **Receptionist** (Lễ tân) | Xác nhận lịch hẹn, check-in, thu tiền, tạo walk-in, quản lý hàng đợi |
| **Doctor** (Bác sĩ) | Xem lịch khám, khám bệnh, lập bệnh án, kê đơn thuốc |
| **Patient** (Bệnh nhân) | Đặt lịch online, xem lịch hẹn, xem bệnh án & đơn thuốc, quản lý hồ sơ cá nhân |

**Đăng nhập:** Tất cả vai trò đều dùng **số điện thoại + mật khẩu**.

---

## 4. Bản Đồ Chức Năng

### 4.1. Quản lý tài khoản & Xác thực

| Chức năng | Mô tả | Actor |
|-----------|-------|-------|
| Đăng ký tài khoản | Bệnh nhân đăng ký bằng SĐT, tự sinh username nội bộ | Patient |
| Đăng nhập / Đăng xuất | JWT token, auto-refresh khi hết hạn | Tất cả |
| Quản lý profile cá nhân | Xem/sửa thông tin cơ bản, hồ sơ y tế, đổi mật khẩu | Tất cả |
| Quản lý nhân sự (staff) | CRUD tài khoản bác sĩ, lễ tân | Admin |
| Quản lý bệnh nhân | Xem, tìm kiếm, sửa hồ sơ bệnh nhân | Admin |

### 4.2. Đặt Lịch Khám

| Chức năng | Mô tả | Actor |
|-----------|-------|-------|
| Đặt lịch online | Wizard 3 bước: chọn bác sĩ → chọn ngày/slot → xác nhận + chọn dịch vụ | Patient |
| Tạo lịch walk-in | Lễ tân tạo cho bệnh nhân vãng lai (không cần tài khoản, chỉ tên + SĐT) | Receptionist |
| Xem lịch hẹn của tôi | Danh sách lịch hẹn, lọc theo trạng thái, hủy lịch | Patient |
| Quản lý tất cả lịch hẹn | Bảng lọc đa chiều (ngày, bác sĩ, trạng thái), action nhanh | Receptionist |
| Xác nhận lịch hẹn | Duyệt lịch pending → confirmed, gán số thứ tự | Receptionist |
| Auto-link walk-in | Khi bệnh nhân đăng ký SĐT đã từng walk-in → tự gắn tài khoản vào lịch cũ | Hệ thống |

### 4.3. Check-in & Thanh toán

| Chức năng | Mô tả | Actor |
|-----------|-------|-------|
| Check-in bệnh nhân | Tra cứu SĐT → chọn lịch hẹn → chọn phương thức thanh toán → tạo hóa đơn → check-in | Receptionist |
| Tạo hóa đơn | Tự sinh mã INV-YYYY-NNNN, ghi nhận người thu tiền | Receptionist |
| Xem hóa đơn | Lọc theo ngày, thống kê doanh thu theo phương thức | Receptionist, Patient |
| Thanh toán QR (mocked VNPay) | Giao diện mô phỏng thanh toán qua VNPay QR code | Receptionist |

### 4.4. Khám Bệnh

| Chức năng | Mô tả | Actor |
|-----------|-------|-------|
| Lịch khám hôm nay | Danh sách bệnh nhân đang chờ (checked_in), chuyển trạng thái | Doctor |
| Khám bệnh (ExaminePage) | Giao diện khám tích hợp: ghi bệnh án + kê đơn thuốc trong 1 trang | Doctor |
| Lập bệnh án | Ghi triệu chứng, loại da, vị trí tổn thương, chẩn đoán, hướng điều trị, ngày tái khám | Doctor |
| Kê đơn thuốc | Chọn thuốc từ danh mục, ghi liều dùng, tần suất, số ngày, số lượng | Doctor |
| Lịch sử khám | Xem danh sách bệnh nhân đã khám | Doctor |
| Xem bệnh án & đơn thuốc | Bệnh nhân xem kết quả sau khám (split-view) | Patient |

### 4.5. Quản trị hệ thống (Admin)

| Chức năng | Mô tả |
|-----------|-------|
| Dashboard tổng quan | Thống kê số liệu toàn hệ thống |
| Quản lý nhân sự | CRUD bác sĩ, lễ tân (kèm phân quyền) |
| Quản lý bệnh nhân | Xem, tìm kiếm, chỉnh sửa hồ sơ bệnh nhân |
| Quản lý dịch vụ | CRUD dịch vụ khám (tên, giá, thời gian, danh mục) |
| Quản lý phòng khám | CRUD phòng, gán bác sĩ mặc định |
| Phân lịch làm việc | Phân công bác sĩ làm việc ngày nào, phòng nào (tạo DoctorWorkDay) |
| Thống kê doanh thu | Xem doanh thu theo khoảng thời gian |

### 4.6. Real-time & Thông báo

| Chức năng | Mô tả |
|-----------|-------|
| WebSocket (Socket.IO) | Cập nhật hàng đợi real-time cho bác sĩ & lễ tân |
| Toast thông báo khám xong | Bác sĩ hoàn tất → lễ tân nhận toast ngay lập tức |
| Thông báo hệ thống | Gửi thông báo theo userId hoặc theo role, đánh dấu đã đọc |

---

## 5. Luồng Nghiệp Vụ Chính

### 5.1. Đặt lịch Online

```
Patient đặt lịch (status: pending)
  → Receptionist xác nhận (status: confirmed, gán số thứ tự)
  → Bệnh nhân đến, Receptionist thu tiền + check-in (status: checked_in)
  → Doctor gọi vào khám (status: in_progress)
  → Doctor lập bệnh án + kê đơn, hoàn tất (status: done)
```

### 5.2. Walk-in (Bệnh nhân vãng lai)

```
Bệnh nhân đến trực tiếp
  → Receptionist tạo lịch (patientId = NULL, lưu tên + SĐT)
  → Thu tiền + check-in ngay (status: checked_in)
  → Doctor khám → bệnh án + đơn thuốc (status: done)
```

### 5.3. State Machine — Trạng thái lịch hẹn

```
pending ──→ confirmed ──→ checked_in ──→ in_progress ──→ done
  │             │                                          (kết thúc)
  ↓             ↓
cancelled    cancelled / no_show
(kết thúc)   (kết thúc)
```

**Quy tắc quan trọng:** Chuyển sang `checked_in` bắt buộc phải có hóa đơn `status = paid`.

---

## 6. Kiến Trúc Hệ Thống

### 6.1. Backend — Các Module

```
backend/src/
├── auth/               # Xác thực: login, register, refresh, logout
├── users/              # CRUD người dùng, profile bệnh nhân
├── doctors/            # Hồ sơ bác sĩ, slot khả dụng
├── doctor-work-days/   # Lịch làm việc bác sĩ theo ngày
├── rooms/              # Quản lý phòng khám
├── services/           # Dịch vụ khám & giá
├── appointments/       # Lịch hẹn (trung tâm nghiệp vụ)
├── medical-records/    # Bệnh án điện tử
├── medicines/          # Danh mục thuốc
├── prescriptions/      # Đơn thuốc
├── invoices/           # Hóa đơn thanh toán
├── notifications/      # Thông báo
├── gateway/            # WebSocket real-time (Socket.IO)
├── upload/             # Upload file/ảnh
└── prisma/             # Prisma Client singleton
```

**Chuẩn response API:**
```json
{ "success": true, "statusCode": 200, "data": {...}, "timestamp": "..." }
{ "success": false, "statusCode": 400, "message": "...", "timestamp": "..." }
```

### 6.2. Frontend — Cấu trúc

```
frontend/src/
├── contexts/AuthContext.tsx       # Global auth state (React Context)
├── lib/axios.ts                   # Axios instance + auto-refresh interceptor
├── router/index.tsx               # Routes + guard (RequireAuth, RedirectIfAuth)
├── layouts/DashboardLayout.tsx    # Sidebar + topbar theo role
├── components/
│   ├── ExamToast.tsx              # Toast real-time khi bác sĩ khám xong
│   ├── AuthModal.tsx              # Modal đăng nhập/đăng ký
│   └── ui/                        # Shared UI components (shadcn/ui)
└── pages/
    ├── public/                    # LandingPage
    ├── auth/                      # LoginPage, RegisterPage
    ├── patient/                   # 6 trang
    ├── receptionist/              # 5 trang
    ├── doctor/                    # 7 trang
    └── admin/                     # 9 trang
```

### 6.3. Trang Frontend theo Role

#### Patient (6 trang)
| Trang | Route | Chức năng |
|-------|-------|-----------|
| Dashboard | `/patient/dashboard` | Tổng quan: lịch sắp tới, lịch sử khám, thông báo |
| Đặt lịch | `/patient/booking` | Wizard đặt lịch 3 bước |
| Lịch hẹn | `/patient/appointments` | Danh sách lịch hẹn, lọc theo tab, hủy lịch |
| Bệnh án | `/patient/records` | Split-view: danh sách + chi tiết bệnh án & đơn thuốc |
| Hóa đơn | `/patient/invoices` | Xem lịch sử hóa đơn |
| Hồ sơ | `/patient/profile` | 3 tab: thông tin cơ bản, hồ sơ y tế, đổi mật khẩu |

#### Receptionist (5 trang)
| Trang | Route | Chức năng |
|-------|-------|-----------|
| Dashboard | `/receptionist/dashboard` | Stats, lịch hôm nay, doanh thu |
| Quản lý lịch hẹn | `/receptionist/appointments` | Bảng lọc đa chiều, tạo walk-in |
| Xác nhận lịch hẹn | `/receptionist/confirm` | Duyệt lịch hẹn online (pending → confirmed) |
| Check-in | `/receptionist/checkin` | Tra cứu SĐT → thanh toán → check-in, hàng đợi |
| Hồ sơ | `/receptionist/profile` | Thông tin cá nhân |

#### Doctor (5 trang chính + 2 phụ)
| Trang | Route | Chức năng |
|-------|-------|-----------|
| Dashboard | `/doctor/dashboard` | Tổng quan lịch hôm nay, stats |
| Lịch hôm nay | `/doctor/today` | Hàng đợi bệnh nhân, chuyển trạng thái |
| Khám bệnh | `/doctor/examine/:id` | Ghi bệnh án + kê đơn tích hợp |
| Lịch sử khám | `/doctor/history` | Danh sách bệnh nhân đã khám |
| Hồ sơ | `/doctor/profile` | Thông tin cá nhân |

#### Admin (7 trang)
| Trang | Route | Chức năng |
|-------|-------|-----------|
| Dashboard | `/admin/dashboard` | Thống kê tổng quan hệ thống |
| Quản lý nhân sự | `/admin/staff` | CRUD bác sĩ, lễ tân |
| Quản lý bệnh nhân | `/admin/patients` | Xem, tìm, sửa hồ sơ bệnh nhân |
| Quản lý dịch vụ | `/admin/services` | CRUD dịch vụ & giá |
| Phân lịch làm việc | `/admin/schedule` | Phân công bác sĩ theo ngày + phòng |
| Quản lý phòng | `/admin/rooms` | CRUD phòng khám |
| Thống kê doanh thu | `/admin/revenue` | Doanh thu theo thời gian |

---

## 7. Cơ Sở Dữ Liệu — Các Bảng Chính

### Nhóm Người dùng & Vai trò
| Bảng | Mô tả | Quan hệ |
|------|-------|---------|
| `roles` | 4 vai trò: admin, doctor, receptionist, patient | 1-N → users |
| `users` | Tài khoản đăng nhập (SĐT unique, username tự sinh) | N-1 → role |
| `patient_profiles` | Hồ sơ y tế mở rộng (nhóm máu, dị ứng, CCCD...) | 1-1 → user |
| `doctors` | Hồ sơ bác sĩ (chuyên khoa, học vị, phí khám) | 1-1 → user |

### Nhóm Lịch làm việc
| Bảng | Mô tả | Ràng buộc |
|------|-------|-----------|
| `rooms` | Phòng khám vật lý | 1 phòng ↔ 1 bác sĩ mặc định (optional) |
| `doctor_work_days` | Ngày cụ thể bác sĩ làm việc + phòng | Unique: 1 bác sĩ/ngày, 1 phòng/ngày |
| `time_slots` | Slot bị block thủ công (optional) | Unique: bác sĩ + ngày + giờ |

### Nhóm Dịch vụ & Lịch hẹn
| Bảng | Mô tả |
|------|-------|
| `services` | Dịch vụ khám (tên, giá, thời gian, danh mục) |
| `appointments` | **Bảng trung tâm** — `patientId = NULL` nếu walk-in |

### Nhóm Bệnh án & Đơn thuốc
| Bảng | Mô tả |
|------|-------|
| `medical_records` | Bệnh án: triệu chứng, chẩn đoán, loại da, vị trí tổn thương, ngày tái khám |
| `medicines` | Danh mục thuốc |
| `prescriptions` | Đơn thuốc (1-1 với appointment) |
| `prescription_items` | Chi tiết từng thuốc: liều, tần suất, số ngày, số lượng |

### Nhóm Tài chính & Hệ thống
| Bảng | Mô tả |
|------|-------|
| `invoices` | Hóa đơn (`invoiceCode` dạng INV-YYYY-NNNN) |
| `notifications` | Thông báo theo userId hoặc targetRoleId |

---

## 8. Quy Tắc Nghiệp Vụ Quan Trọng

1. **Đăng nhập bằng SĐT** — `username` tự sinh nội bộ, không expose ra ngoài.
2. **Slot khả dụng** — Chỉ xuất hiện khi bác sĩ có `DoctorWorkDay` cho ngày đó, slot chưa bị book và chưa bị block.
3. **Check-in bắt buộc có hóa đơn paid** — Không thể chuyển sang `checked_in` nếu chưa tạo invoice.
4. **Walk-in: `patientId = NULL`** — Bình thường, không phải lỗi. Tra cứu bằng `patientPhone`.
5. **Auto-link** — Khi bệnh nhân đăng ký SĐT đã từng walk-in → hệ thống tự gắn `patientId` vào lịch cũ.
6. **1 bác sĩ / 1 ngày chỉ 1 phòng** — Ràng buộc unique trên `doctor_work_days`.
7. **1 slot = 1 lịch hẹn** — Không thể đặt trùng bác sĩ + ngày + giờ.
8. **Số thứ tự (queueNumber)** — Gán tự động khi lễ tân confirm.

**Slot mặc định:** `08:00, 08:30, 09:00, 09:30, 10:00, 10:30, 13:00, 13:30, 14:00, 14:30, 15:00, 15:30, 16:00, 16:30`

---

## 9. Hướng Dẫn Mở Rộng

Kiến trúc được thiết kế theo module, mỗi chức năng là một module độc lập ở cả backend lẫn frontend. Khi cần mở rộng, thêm module mới mà không ảnh hưởng module cũ.

### Cách thêm module mới (Backend)

```
1. Tạo thư mục: backend/src/<tên-module>/
2. Tạo các file: <module>.module.ts, <module>.controller.ts, <module>.service.ts, dto/
3. Thêm model vào prisma/schema.prisma → chạy prisma migrate
4. Import module vào app.module.ts
```

### Cách thêm trang mới (Frontend)

```
1. Tạo file: frontend/src/pages/<role>/<TenTrang>.tsx
2. Thêm route vào frontend/src/router/index.tsx
3. Thêm menu item vào frontend/src/layouts/DashboardLayout.tsx
```

### Gợi ý các chức năng có thể mở rộng

| Hướng mở rộng | Mô tả | Độ phức tạp |
|---------------|-------|-------------|
| Xét nghiệm (Lab Tests) | Bác sĩ chỉ định xét nghiệm, theo dõi kết quả | Trung bình |
| Hình ảnh y khoa | Upload & quản lý ảnh da bệnh nhân theo bệnh án | Thấp |
| Nhắc lịch tái khám | Tự động gửi thông báo/SMS khi đến ngày tái khám | Trung bình |
| Báo cáo & Dashboard nâng cao | Biểu đồ doanh thu, thống kê bệnh nhân theo thời gian | Thấp |
| Tích hợp thanh toán thật | Kết nối VNPay/MoMo/ZaloPay thật thay vì mock | Trung bình |
| Chat bác sĩ - bệnh nhân | Nhắn tin realtime giữa bác sĩ và bệnh nhân | Cao |
| Quản lý kho thuốc | Theo dõi tồn kho, nhập/xuất thuốc | Trung bình |
| Đánh giá & Feedback | Bệnh nhân đánh giá bác sĩ sau khám | Thấp |
| Đa chi nhánh | Mở rộng hệ thống cho nhiều phòng khám | Cao |
| Mobile App | React Native sử dụng chung API backend | Cao |

---

## 10. Khởi Động & Lệnh Thường Dùng

```bash
# Khởi động Backend
cd backend && npm run dev

# Khởi động Frontend
cd frontend && npm run dev

# Database
cd backend && npx prisma migrate deploy    # Chạy migration
cd backend && npx prisma generate          # Generate Prisma Client
cd backend && npx ts-node --transpile-only prisma/seed.ts  # Seed dữ liệu
cd backend && npx prisma studio            # Xem DB qua browser
```

### Tài khoản mẫu (mật khẩu: `Vietskin@123`)

| Vai trò | SĐT | Tên |
|---------|-----|-----|
| Admin | 0901234567 | Quản trị viên |
| Receptionist | 0901234568 | Phạm Thu Hà |
| Doctor | 0901234569 | BS. Nguyễn Văn A |
| Doctor | 0901234570 | BS. Trần Thị B |
| Patient | 0901234571 | Lê Văn C |
| Patient | 0901234572 | Nguyễn Thị D |
