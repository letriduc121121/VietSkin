# Đặc tả Use Case — Chung (Tất cả vai trò)

---

## Bảng 2.X Đặc tả Use Case Đăng nhập

| | |
|---|---|
| **Tên Use Case** | Đăng nhập |
| **Tác nhân** | Tất cả người dùng (Bệnh nhân, Lễ tân, Bác sĩ, Quản trị viên) |
| **Mục đích** | Người dùng đăng nhập để xác thực danh tính và sử dụng hệ thống |
| **Điều kiện kích hoạt** | Người dùng truy cập trang "Đăng nhập" của hệ thống |
| **Điều kiện tiên quyết** | Không có |
| **Luồng sự kiện chính** | 1. Người dùng vào trang đăng nhập.<br>2. Hệ thống hiển thị form đăng nhập yêu cầu nhập: Số điện thoại, Mật khẩu.<br>3. Người dùng nhập Số điện thoại và Mật khẩu.<br>4. Người dùng bấm "Đăng nhập".<br>5. Hệ thống kiểm tra số điện thoại có tồn tại và khớp với mật khẩu không.<br>6. Hệ thống kiểm tra trạng thái tài khoản có đang hoạt động không.<br>7. Hệ thống cấp token đăng nhập và chuyển người dùng vào giao diện tương ứng theo vai trò. |
| **Luồng sự kiện thay thế** | 5a. Số điện thoại không tồn tại hoặc mật khẩu không khớp → hệ thống thông báo "Thông tin đăng nhập không chính xác", yêu cầu nhập lại. |
| **Luồng sự kiện ngoại lệ** | 6a. Tài khoản đang bị khoá → hệ thống thông báo "Tài khoản của bạn đã bị khoá, vui lòng liên hệ quản trị viên", không cho phép đăng nhập. |

---

## Bảng 2.X Đặc tả Use Case Quản lý thông tin cá nhân

| | |
|---|---|
| **Tên Use Case** | Quản lý thông tin cá nhân |
| **Tác nhân** | Tất cả người dùng (Bệnh nhân, Lễ tân, Bác sĩ, Quản trị viên) |
| **Mục đích** | Người dùng xem và cập nhật thông tin cá nhân của mình trong hệ thống |
| **Điều kiện kích hoạt** | Người dùng nhấn vào mục "Hồ sơ cá nhân" trên giao diện |
| **Điều kiện tiên quyết** | Người dùng đã đăng nhập vào hệ thống |
| **Luồng sự kiện chính** | 1. Người dùng vào trang hồ sơ cá nhân.<br>2. Hệ thống hiển thị thông tin hiện tại: họ tên, số điện thoại, ngày sinh, giới tính, địa chỉ.<br>3. Người dùng chỉnh sửa các thông tin muốn cập nhật.<br>4. Người dùng bấm "Lưu thay đổi".<br>5. Hệ thống xác nhận hợp lệ và cập nhật thông tin thành công.<br>6. Hệ thống hiển thị thông báo "Cập nhật thông tin thành công". |
| **Luồng sự kiện thay thế** | 3a. Người dùng chọn chức năng "Đổi mật khẩu" (extend):<br>&nbsp;&nbsp;&nbsp;&nbsp;1. Hệ thống hiển thị form yêu cầu nhập: Mật khẩu cũ, Mật khẩu mới, Xác nhận mật khẩu mới.<br>&nbsp;&nbsp;&nbsp;&nbsp;2. Người dùng nhập đầy đủ thông tin và bấm "Xác nhận".<br>&nbsp;&nbsp;&nbsp;&nbsp;3. Hệ thống kiểm tra mật khẩu cũ có đúng không.<br>&nbsp;&nbsp;&nbsp;&nbsp;4. Hệ thống cập nhật mật khẩu mới và thông báo thành công. |
| **Luồng sự kiện ngoại lệ** | 5a. Thông tin nhập không hợp lệ → hệ thống hiển thị thông báo lỗi tương ứng, không lưu thay đổi.<br>3a-3. Mật khẩu cũ nhập không đúng → hệ thống thông báo "Mật khẩu cũ không chính xác", không cập nhật mật khẩu.<br>3a-2. Mật khẩu mới và xác nhận mật khẩu không khớp → hệ thống thông báo lỗi, yêu cầu nhập lại. |
