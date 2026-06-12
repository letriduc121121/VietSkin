# Đặc tả Use Case — Role: Quản trị viên (Admin)

Dưới đây là chi tiết các đặc tả Use Case dành cho tác nhân Quản trị viên (Admin), bao quát toàn bộ các nhóm chức năng của hệ thống.

---

## Nhóm 1: Quản lý Tổng quan (Dashboard)

### Bảng 4.1 Đặc tả UC-A01 — Xem thống kê tổng quan
| Trường | Nội dung |
|---|---|
| **Tác nhân** | Quản trị viên |
| **Mục đích** | Nắm bắt nhanh hoạt động phòng khám trong ngày: tổng người dùng, bác sĩ hoạt động, lịch hẹn, doanh thu. |
| **Điều kiện kích hoạt** | Quản trị viên đăng nhập thành công hoặc chọn mục "Tổng quan". |
| **Điều kiện tiên quyết** | Đã đăng nhập với quyền Admin. |
| **Điều kiện thành công** | Hệ thống hiển thị đầy đủ các chỉ số thống kê theo ngày hiện tại. |
| **Luồng sự kiện chính** | 1. Quản trị viên truy cập trang Tổng quan (Dashboard).<br>2. Hệ thống gọi đồng thời 4 API: `/users`, `/doctors`, `/appointments?date=today`, `/invoices?date=today`.<br>3. Hệ thống hiển thị 4 chỉ số: Tổng người dùng, Bác sĩ đang hoạt động, Số lịch hẹn hôm nay, Doanh thu hôm nay.<br>4. Hệ thống hiển thị danh sách lịch hẹn trong ngày kèm trạng thái.<br>5. Hệ thống hiển thị doanh thu phân theo phương thức thanh toán (tiền mặt, QR, chuyển khoản, thẻ). |
| **Luồng sự kiện thay thế** | **Chưa có dữ liệu trong ngày:** Hiển thị giá trị 0, danh sách rỗng. |
| **Luồng sự kiện ngoại lệ** | Không có. |

### Bảng 4.2 Đặc tả UC-A23 — Xem tổng quan lịch hẹn
| Trường | Nội dung |
|---|---|
| **Tác nhân** | Quản trị viên |
| **Mục đích** | Theo dõi toàn bộ lịch hẹn của phòng khám, lọc theo ngày / bác sĩ / trạng thái. |
| **Điều kiện kích hoạt** | Quản trị viên truy cập trang Tổng quan lịch hẹn. |
| **Luồng sự kiện chính** | 1. Quản trị viên truy cập trang.<br>2. Hệ thống mặc định hiển thị lịch hẹn ngày hôm nay (`GET /appointments`).<br>3. Quản trị viên chọn bộ lọc: ngày khác, bác sĩ cụ thể, trạng thái.<br>4. Hệ thống gọi lại API với params tương ứng và cập nhật danh sách.<br>5. Mỗi dòng hiển thị: giờ, STT hàng chờ, bệnh nhân, SĐT, bác sĩ, trạng thái. |
| **Luồng sự kiện thay thế** | **Không có lịch hẹn theo bộ lọc:** Hiển thị thông báo "Không tìm thấy lịch hẹn nào". |

---

## Nhóm 2: Quản lý Nhân sự

### Bảng 4.3 Đặc tả UC-A02 — Xem danh sách nhân sự
| Trường | Nội dung |
|---|---|
| **Tác nhân** | Quản trị viên |
| **Mục đích** | Xem toàn bộ danh sách lễ tân và bác sĩ trong hệ thống. |
| **Luồng sự kiện chính** | 1. Quản trị viên truy cập trang "Quản lý nhân sự".<br>2. Hệ thống gọi `GET /users` và `GET /doctors`.<br>3. Hệ thống hiển thị 2 tab: Bác sĩ và Lễ tân.<br>4. Mỗi tab hiển thị: ảnh đại diện, họ tên, SĐT, trạng thái hoạt động. Tab Bác sĩ hiển thị thêm chuyên khoa, bằng cấp, phí khám.<br>5. Quản trị viên chuyển tab để xem từng nhóm. |

### Bảng 4.4 Đặc tả UC-A03 — Thêm nhân sự mới
| Trường | Nội dung |
|---|---|
| **Tác nhân** | Quản trị viên |
| **Mục đích** | Tạo tài khoản mới cho bác sĩ hoặc lễ tân. |
| **Luồng sự kiện chính** | 1. Quản trị viên nhấn nút "Thêm nhân sự".<br>2. Hệ thống hiển thị form điền thông tin (họ tên, SĐT, mật khẩu, vai trò).<br>3. Nếu chọn vai trò Bác sĩ: form mở rộng nhập chuyên khoa, bằng cấp, kinh nghiệm, phí khám, mô tả.<br>4. Quản trị viên điền thông tin và nhấn "Lưu".<br>5. Hệ thống gọi `POST /users/staff`.<br>6. Backend kiểm tra SĐT, tạo User + Doctor profile (nếu là bác sĩ).<br>7. Làm mới danh sách và thông báo thành công. |
| **Luồng sự kiện ngoại lệ** | **SĐT đã tồn tại:** Backend trả lỗi, hiển thị "Số điện thoại đã được sử dụng".<br>**Thiếu trường:** Báo lỗi validation. |

### Bảng 4.5 Đặc tả UC-A04 — Sửa thông tin nhân sự
| Trường | Nội dung |
|---|---|
| **Tác nhân** | Quản trị viên |
| **Mục đích** | Cập nhật thông tin cá nhân hoặc thông tin chuyên môn của nhân viên. |
| **Luồng sự kiện chính** | 1. Quản trị viên nhấn nút "Sửa" trên một nhân viên.<br>2. Hệ thống hiển thị form với dữ liệu hiện tại.<br>3. Quản trị viên chỉnh sửa thông tin và nhấn "Lưu".<br>4. Hệ thống gọi `PUT /users/:id` và `PUT /doctors/:id` (nếu là bác sĩ).<br>5. Làm mới danh sách và thông báo thành công. |

### Bảng 4.6 Đặc tả UC-A05 — Khoá / Mở tài khoản nhân sự
| Trường | Nội dung |
|---|---|
| **Tác nhân** | Quản trị viên |
| **Mục đích** | Tạm ngừng hoặc khôi phục quyền đăng nhập của một nhân viên. |
| **Luồng sự kiện chính** | 1. Quản trị viên nhấn nút khoá/mở khoá.<br>2. Hệ thống gọi `PUT /users/:id/toggle-active`.<br>3. Backend đảo giá trị `active` (`true` ↔ `false`).<br>4. Cập nhật badge trạng thái trong danh sách ngay lập tức. |

---

## Nhóm 3: Quản lý Bệnh nhân

### Bảng 4.7 Đặc tả UC-A06 — Xem danh sách bệnh nhân
| Trường | Nội dung |
|---|---|
| **Tác nhân** | Quản trị viên (Admin) |
| **Mục đích** | Tra cứu và xem danh sách toàn bộ bệnh nhân đã đăng ký trên hệ thống. |
| **Điều kiện kích hoạt** | Quản trị viên truy cập mục "Hồ sơ bệnh nhân". |
| **Điều kiện tiên quyết** | Đã đăng nhập với quyền Admin. |
| **Điều kiện thành công** | Danh sách bệnh nhân hiển thị đầy đủ, Admin có thể tìm kiếm theo nhiều tiêu chí. |
| **Luồng sự kiện chính** | 1. Quản trị viên truy cập trang Hồ sơ bệnh nhân.<br>2. Hệ thống gọi API `GET /users` và lọc những user có vai trò là Bệnh nhân (role = patient).<br>3. Hệ thống hiển thị danh sách theo bảng gồm: Họ tên, Liên hệ (SĐT, Email), Ngày sinh, Giới tính, Ngày tạo và Trạng thái (Hoạt động/Khóa).<br>4. Quản trị viên nhập từ khóa vào thanh tìm kiếm.<br>5. Hệ thống lọc tự động (real-time) danh sách dựa trên Tên, Số điện thoại hoặc Mã bệnh nhân tương ứng với từ khóa. |
| **Luồng sự kiện thay thế** | **Không tìm thấy kết quả:**<br>1. Nếu từ khóa tìm kiếm không khớp với bất kỳ bệnh nhân nào.<br>2. Bảng dữ liệu trống và hệ thống hiển thị thông báo "Không tìm thấy bệnh nhân nào". |

### Bảng 4.8 Đặc tả UC-A07 — Xem chi tiết hồ sơ bệnh nhân (có lịch sử khám)
| Trường | Nội dung |
|---|---|
| **Tác nhân** | Quản trị viên (Admin) |
| **Mục đích** | Cho phép Admin xem đầy đủ thông tin cá nhân, tiền sử bệnh và lịch sử các ca khám bệnh của một bệnh nhân cụ thể. |
| **Điều kiện kích hoạt** | Quản trị viên nhấn nút "Xem chi tiết" tại một bệnh nhân trong danh sách. |
| **Điều kiện tiên quyết** | Đã đăng nhập với quyền Admin và bệnh nhân tồn tại trong hệ thống. |
| **Điều kiện thành công** | Modal hiển thị đầy đủ 2 Tab: "Thông tin cá nhân" và "Lịch sử khám" kèm theo dữ liệu chính xác. |
| **Luồng sự kiện chính** | 1. Quản trị viên nhấn nút "Xem chi tiết" tại dòng của một bệnh nhân.<br>2. Hệ thống gọi API `GET /users/:id` để lấy toàn bộ dữ liệu hồ sơ cá nhân mới nhất.<br>3. Hệ thống hiển thị Modal chi tiết mở mặc định ở Tab "Thông tin cá nhân". Tại đây hiển thị Họ tên (có thể chỉnh sửa nhanh), SĐT, Ngày sinh, Giới tính, Nhóm máu, Dị ứng và Tiền sử bệnh.<br>4. Quản trị viên chuyển sang Tab "Lịch sử khám".<br>5. Hệ thống gọi API `GET /appointments/patient/:id` để lấy danh sách toàn bộ lịch sử khám của bệnh nhân này.<br>6. Hệ thống hiển thị một danh sách các khối thông tin (Card) từ trên xuống dưới, mỗi khối tương ứng với một lần khám bệnh.<br>7. Mỗi khối lịch sử khám bao gồm: Ngày giờ khám, Bác sĩ phụ trách, Trạng thái ca khám, Triệu chứng, Chẩn đoán, Phác đồ điều trị, Ghi chú, Lịch tái khám (nếu có) và danh sách chi tiết các đơn thuốc (tên thuốc, liều lượng, cách dùng). |
| **Luồng sự kiện thay thế** | **Bệnh nhân chưa có lịch sử khám:**<br>1. Khi Admin chuyển sang Tab "Lịch sử khám".<br>2. Hệ thống gọi API và nhận về danh sách rỗng.<br>3. Hệ thống hiển thị thông báo "Bệnh nhân chưa có lịch khám nào." ở giữa màn hình. |
| **Luồng sự kiện ngoại lệ** | **Lỗi tải dữ liệu:**<br>1. Quá trình gọi API bị timeout hoặc mất mạng.<br>2. Giao diện bị giữ ở trạng thái "Đang tải dữ liệu..." hoặc "Đang tải lịch sử...". |

### Bảng 4.9 Đặc tả UC-A08 — Khoá / Mở tài khoản bệnh nhân
| Trường | Nội dung |
|---|---|
| **Tác nhân** | Quản trị viên (Admin) |
| **Mục đích** | Tạm ngừng hoặc khôi phục quyền truy cập vào hệ thống của một bệnh nhân (ví dụ do vi phạm quy định đặt lịch ảo). |
| **Điều kiện kích hoạt** | Quản trị viên nhấn nút "Khóa tài khoản / Mở tài khoản" trong Modal chi tiết bệnh nhân. |
| **Luồng sự kiện chính** | 1. Quản trị viên cuộn xuống dưới cùng của Tab "Thông tin cá nhân" trong Modal chi tiết.<br>2. Quản trị viên nhấn nút Khóa (màu đỏ) hoặc Mở (màu xanh).<br>3. Hệ thống gọi API `PUT /users/:id/toggle-active`.<br>4. Backend đảo ngược giá trị `active` của tài khoản này trong Database.<br>5. Hệ thống cập nhật trạng thái hoạt động ngay lập tức trên Modal và thay đổi Badge trạng thái trên danh sách bệnh nhân bên ngoài từ "Hoạt động" sang "Khóa" (hoặc ngược lại). |

---

## Nhóm 4: Quản lý Dịch vụ & Giá

### Bảng 4.10 Đặc tả UC-A09 — Xem danh sách dịch vụ
| Trường | Nội dung |
|---|---|
| **Tác nhân** | Quản trị viên |
| **Luồng sự kiện chính** | 1. Quản trị viên truy cập "Dịch vụ & Giá".<br>2. Hệ thống gọi `GET /services?all=true`.<br>3. Hiển thị danh sách dịch vụ (bao gồm dịch vụ đang ẩn). |

### Bảng 4.11 Đặc tả UC-A10 — Thêm dịch vụ
| Trường | Nội dung |
|---|---|
| **Tác nhân** | Quản trị viên |
| **Luồng sự kiện chính** | 1. Quản trị viên nhấn "Thêm dịch vụ".<br>2. Hiển thị form: tên, giá, thời gian thực hiện, ảnh.<br>3. Quản trị viên tải ảnh lên (`POST /upload`).<br>4. Điền xong nhấn "Lưu" (`POST /services`). |

### Bảng 4.12 Đặc tả UC-A11 & UC-A12 — Sửa / Ẩn hiện dịch vụ
| Trường | Nội dung |
|---|---|
| **Tác nhân** | Quản trị viên |
| **Luồng sự kiện chính** | **Sửa:** Cập nhật thông tin qua `PUT /services/:id`.<br>**Ẩn/Hiện:** Chuyển đổi trạng thái `active` (ngưng hiển thị với bệnh nhân nhưng không xóa dữ liệu). |

---

## Nhóm 5: Quản lý Phòng khám

### Bảng 4.13 Đặc tả UC-A13 & UC-A14 — Xem và Thêm phòng khám
| Trường | Nội dung |
|---|---|
| **Tác nhân** | Quản trị viên |
| **Luồng sự kiện chính** | 1. Xem danh sách phòng khám dạng Card (`GET /rooms`).<br>2. Nhấn "Thêm phòng", nhập tên phòng và chọn Bác sĩ phụ trách từ dropdown (chỉ hiển thị bác sĩ chưa có phòng).<br>3. Nhấn "Lưu" (`POST /rooms`). |

### Bảng 4.14 Đặc tả UC-A15 — Sửa phòng / Gán bác sĩ
| Trường | Nội dung |
|---|---|
| **Tác nhân** | Quản trị viên |
| **Luồng sự kiện chính** | Cập nhật tên phòng hoặc đổi bác sĩ phụ trách qua API `PUT /rooms/:id`. |

---

## Nhóm 6: Quản lý Lịch làm việc

### Bảng 4.15 Đặc tả UC-A16, UC-A17, UC-A18 — Phân bổ và Quản lý lịch làm việc
| Trường | Nội dung |
|---|---|
| **Tác nhân** | Quản trị viên (Admin) |
| **Mục đích** | Cho phép Admin thiết lập và điều chỉnh ngày làm việc cho từng bác sĩ. Bác sĩ sẽ làm việc cả ngày theo lịch đã phân, không chia theo ca sáng/chiều hay chọn giờ làm cụ thể. |
| **Điều kiện kích hoạt** | Admin truy cập mục "Lịch làm việc" và chọn một Bác sĩ từ danh sách. |
| **Điều kiện tiên quyết** | Bác sĩ đã được tạo tài khoản và đã được gán "Phòng làm việc" (Room) trong hệ thống. |
| **Điều kiện thành công** | Lịch làm việc được lưu thành công vào CSDL. Bác sĩ có thể xem được lịch này trên màn hình của họ và bệnh nhân có thể bắt đầu đặt hẹn vào những ngày đó. |
| **Luồng sự kiện chính (Thêm lịch)** | 1. Admin truy cập trang "Lịch làm việc".<br>2. Admin chọn Bác sĩ cần phân lịch từ danh sách sổ xuống (Dropdown).<br>3. Hệ thống hiển thị Lịch (Calendar) của tháng hiện tại. Các ngày Bác sĩ đã có lịch làm việc từ trước sẽ được tô màu xanh.<br>4. Admin thực hiện tích (click) vào các ô ngày trống trên Lịch để phân lịch. (Hệ thống làm mờ và vô hiệu hóa không cho phép tích chọn ngày Chủ nhật).<br>5. Các ngày được tích sẽ hiển thị danh sách chờ ở cột bên trái.<br>6. Admin nhấn nút "Phân lịch X ngày" (Lưu).<br>7. Hệ thống gọi API `POST /doctor-work-days/bulk` để lưu đồng loạt các ngày đã chọn vào database.<br>8. Giao diện tải lại, các ngày vừa chọn chuyển sang trạng thái đã có lịch. |
| **Luồng sự kiện thay thế (Hủy/Xóa lịch)** | **Bỏ chọn lịch chưa lưu:**<br>Nếu Admin lỡ tích nhầm một ngày trống, chỉ cần **tích thêm lần nữa (ấn 2 lần)** vào ô đó, hệ thống sẽ tự động bỏ chọn ngày đó.<br><br>**Xóa lịch đã lưu từ trước:**<br>1. Tại một ô ngày màu xanh (đã được phân lịch và lưu thành công từ trước), Admin rê chuột vào ô đó.<br>2. Biểu tượng thùng rác xuất hiện.<br>3. Admin click vào biểu tượng thùng rác.<br>4. Hệ thống gọi API `DELETE /doctor-work-days/:id` và ô ngày đó lập tức trở về trạng thái trống. |
| **Luồng sự kiện ngoại lệ** | **Bác sĩ chưa có phòng:**<br>1. Khi Admin chọn Bác sĩ từ Dropdown, hệ thống kiểm tra thấy bác sĩ chưa được gán phòng khám.<br>2. Hệ thống hiển thị cảnh báo yêu cầu gán phòng và khóa toàn bộ tờ lịch (không cho phép tích ngày).<br>3. Admin phải sang trang "Phòng khám" để thiết lập phòng trước. |

---

## Nhóm 7: Quản lý Thuốc

### Bảng 4.18 Đặc tả Quản lý danh mục thuốc (UC-A19 -> UC-A22)
| Trường | Nội dung |
|---|---|
| **Tác nhân** | Quản trị viên |
| **Luồng sự kiện chính** | **Xem (UC-A19):** Xem toàn bộ danh mục thuốc `GET /medicines`.<br>**Thêm (UC-A20):** Nhập thông tin tên, đơn vị, danh mục (`POST /medicines`).<br>**Sửa (UC-A21):** Cập nhật thông tin thuốc (`PUT /medicines/:id`).<br>**Ẩn (UC-A22):** Xóa mềm `DELETE /medicines/:id`, thuốc không còn xuất hiện trong màn hình kê đơn của bác sĩ nhưng vẫn lưu trong đơn cũ. |
