# VietSkin Clinic Management System

Hệ thống quản lý phòng khám da liễu — Đồ án tốt nghiệp.

## Cấu trúc dự án

```
d:\DoAnTotNghiep\VietSkin\
├── backend/    NestJS 11 + Prisma 7 + PostgreSQL (port 5433) → chạy port 3000
└── frontend/   React 19 + Vite + Tailwind CSS 4              → chạy port 5173
```

## Khởi động

```bash
# Terminal 1 — Backend
cd backend && npm run dev

# Terminal 2 — Frontend
cd frontend && npm run dev
```

## Database

```
postgresql://admin:123456@127.0.0.1:5433/vietskin
```

**Seed accounts** (password: `Vietskin@123`, đăng nhập bằng SĐT):

| Role | SĐT | Tên |
|------|-----|-----|
| admin | 0901234567 | Quản trị viên |
| receptionist | 0901234568 | Phạm Thu Hà |
| doctor | 0901234569 | BS. Nguyễn Văn A |
| doctor | 0901234570 | BS. Trần Thị B |
| patient | 0901234571 | Lê Văn C |
| patient | 0901234572 | Nguyễn Thị D |

## Backend — 10 Module (100% hoàn thành)

| Module | Route prefix |
|--------|-------------|
| Auth | `/api/auth` |
| Users | `/api/users` |
| Doctors | `/api/doctors` |
| Services | `/api/services` |
| Appointments | `/api/appointments` |
| Medical Records | `/api/medical-records` |
| Medicines | `/api/medicines` |
| Prescriptions | `/api/prescriptions` |
| Invoices | `/api/invoices` |
| Notifications | `/api/notifications` |

**Response format chuẩn:**
```json
{ "success": true, "statusCode": 200, "data": {...}, "timestamp": "..." }
{ "success": false, "statusCode": 400, "message": "lỗi gì", "timestamp": "..." }
```

## Frontend — Tiến độ

### ✅ Xong
- `lib/axios.js` — axios + auto refresh token khi 401
- `contexts/AuthContext.jsx` — login/register/logout bằng SĐT
- `router/index.jsx` — routes + RequireAuth + RedirectIfAuth
- `layouts/PublicLayout.jsx` — Header + Outlet + Footer
- `layouts/DashboardLayout.jsx` — Sidebar theo role + Outlet
- `components/common/Header.jsx` + `Footer.jsx`
- `pages/public/LandingPage.jsx`
- `pages/auth/LoginPage.jsx` — đăng nhập bằng SĐT
- `pages/auth/RegisterPage.jsx` — đăng ký bằng SĐT

### ⬜ Chưa làm (theo thứ tự)
1. **Patient**: DashboardPage, BookingPage, AppointmentsPage, ProfilePage
2. **Receptionist**: AppointmentListPage, CheckInPage, InvoicePage
3. **Doctor**: TodaySchedulePage, MedicalRecordPage, PrescriptionPage
4. **Admin**: UserManagementPage, ServiceManagementPage, DoctorManagementPage

## Kiến trúc quan trọng

### Auth — Đăng nhập bằng SĐT
- Login/Register dùng `phone` + `password` (không dùng username)
- `username` trong DB tự sinh = `user_09xxxxxxxx` (nội bộ, không expose)
- `accessToken` hết hạn 15 phút, `refreshToken` 7 ngày
- Frontend tự động refresh trong `axios.js` interceptor

### Walk-in vs Online Booking
- **Walk-in** (lễ tân tạo): `Appointment.patientId = NULL`, lưu `patientPhone`
- **Online** (bệnh nhân đặt): `Appointment.patientId = user.id`
- **Link tự động**: Khi đăng ký tài khoản với SĐT đã walk-in → tự gắn `patientId` vào các appointment cũ

### Route Guard
```
/login /register  → RedirectIfAuth (đã login thì về dashboard)
/patient/*        → RequireAuth role=patient
/doctor/*         → RequireAuth role=doctor
/receptionist/*   → RequireAuth role=receptionist
/admin/*          → RequireAuth role=admin
```

### DashboardLayout sidebar menu
Mỗi role có menu riêng định nghĩa trong `layouts/DashboardLayout.jsx` (menuByRole object).

## ⚠️ Đang dở — Cần làm ngay khi mở session mới

**Feature: Migration phone unique** — code đã sửa xong, chưa apply vào DB.

```bash
cd backend
npx prisma migrate resolve --rolled-back 20260422_phone_unique_login
npx prisma migrate deploy
npx prisma generate
npx ts-node --transpile-only prisma/seed.ts
```

Sau đó test:
```bash
# Đăng ký
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"phone":"0912345678","password":"123456","name":"Test User"}'

# Đăng nhập
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"phone":"0901234567","password":"Vietskin@123"}'
```
