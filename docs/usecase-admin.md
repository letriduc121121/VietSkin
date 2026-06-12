# Use Case Diagram — Role: Admin

```mermaid
flowchart LR
    Admin(["👤 Admin"])

    subgraph UC_USER["Quản lý người dùng"]
        U1["Xem danh sách người dùng"]
        U2["Tạo tài khoản"]
        U3["Sửa thông tin tài khoản"]
        U4["Khoá / Mở khoá tài khoản"]
        U5["Phân quyền / Đổi role"]
    end

    subgraph UC_DOCTOR["Quản lý bác sĩ"]
        D1["Xem danh sách bác sĩ"]
        D2["Thêm hồ sơ bác sĩ"]
        D3["Sửa hồ sơ bác sĩ"]
        D4["Xoá bác sĩ"]
    end

    subgraph UC_SERVICE["Quản lý dịch vụ"]
        S1["Xem danh sách dịch vụ"]
        S2["Thêm dịch vụ"]
        S3["Sửa dịch vụ"]
        S4["Xoá / Ẩn dịch vụ"]
    end

    subgraph UC_APT["Quản lý lịch hẹn"]
        A1["Xem toàn bộ lịch hẹn"]
        A2["Huỷ lịch hẹn"]
        A3["Chỉnh sửa lịch hẹn"]
    end

    subgraph UC_MEDICINE["Quản lý thuốc"]
        M1["Xem danh mục thuốc"]
        M2["Thêm / Sửa thuốc"]
        M3["Xoá thuốc"]
    end

    subgraph UC_STAT["Thống kê & Báo cáo"]
        R1["Thống kê doanh thu"]
        R2["Thống kê lượt khám"]
        R3["Báo cáo theo bác sĩ / dịch vụ"]
    end

    subgraph UC_SYS["Cấu hình hệ thống"]
        C1["Cài đặt giờ làm việc"]
        C2["Cập nhật thông tin phòng khám"]
    end

    Admin --- UC_USER
    Admin --- UC_DOCTOR
    Admin --- UC_SERVICE
    Admin --- UC_APT
    Admin --- UC_MEDICINE
    Admin --- UC_STAT
    Admin --- UC_SYS
```

## Tóm tắt use case theo nhóm

| Nhóm | Số UC | Mức độ ưu tiên |
|------|-------|----------------|
| Quản lý người dùng | 5 | Cao |
| Quản lý bác sĩ | 4 | Cao |
| Quản lý dịch vụ | 4 | Cao |
| Quản lý lịch hẹn | 3 | Trung bình |
| Quản lý thuốc | 3 | Trung bình |
| Thống kê & Báo cáo | 3 | Trung bình |
| Cấu hình hệ thống | 2 | Thấp |
| **Tổng** | **24** | |
