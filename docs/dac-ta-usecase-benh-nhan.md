# Đặc tả Use Case — Role: Bệnh nhân (Patient)

Dưới đây là chi tiết các đặc tả Use Case dành cho tác nhân Bệnh nhân (Patient), tập trung vào trải nghiệm đặt lịch khám trực tuyến và quản lý hồ sơ sức khỏe cá nhân.

---

## Bảng 5.1 Đặc tả Use Case Đặt lịch khám trực tuyến (Booking)

| Thành phần | Nội dung |
|---|---|
| **Tên Use Case** | Đặt lịch khám bệnh trực tuyến |
| **Tác nhân** | Bệnh nhân |
| **Mục đích** | Cho phép bệnh nhân chủ động chọn bác sĩ, dịch vụ và khung giờ mong muốn để hẹn lịch khám trước khi đến phòng khám. |
| **Điều kiện kích hoạt** | Bệnh nhân truy cập trang "Đặt lịch khám" trên ứng dụng/website. |
| **Điều kiện tiên quyết** | Bệnh nhân có tài khoản và đã đăng nhập. Hệ thống có sẵn lịch làm việc của bác sĩ. |
| **Điều kiện thành công** | Lịch hẹn được lưu vào cơ sở dữ liệu với trạng thái "Chờ xác nhận" (pending) hoặc "Đã xác nhận" (confirmed), hệ thống sinh ra mã QR/mã đặt lịch thành công. |
| **Luồng sự kiện chính** | 1. Bệnh nhân truy cập trang "Đặt lịch khám".<br>2. Hệ thống tải danh sách các Bác sĩ đang hoạt động và danh mục Dịch vụ khám.<br>3. Bệnh nhân chọn một Dịch vụ cần khám.<br>4. Bệnh nhân chọn Bác sĩ mong muốn (hoặc để hệ thống tự phân công).<br>5. Bệnh nhân chọn Ngày khám (chỉ chọn được những ngày bác sĩ có lịch làm việc).<br>6. Hệ thống gọi API kiểm tra các khung giờ trống trong ngày đó và hiển thị danh sách (VD: 08:00, 08:30...).<br>7. Bệnh nhân chọn một khung giờ.<br>8. Bệnh nhân nhập mô tả triệu chứng sơ bộ (không bắt buộc).<br>9. Bệnh nhân nhấn nút "Xác nhận đặt lịch".<br>10. Hệ thống kiểm tra lần cuối xem khung giờ có bị người khác đặt mất chưa. Nếu hợp lệ, gọi API `POST /appointments`.<br>11. Lịch hẹn được tạo thành công, giao diện chuyển sang trang thông báo hoàn tất. |
| **Luồng sự kiện thay thế** | **Khung giờ đã hết chỗ:**<br>1. Tại bước 6, nếu bác sĩ đã kín lịch trong ngày, hệ thống báo "Bác sĩ đã hết ca trống trong ngày này".<br>2. Bệnh nhân phải chọn ngày khác. |
| **Luồng sự kiện ngoại lệ** | **Lỗi xung đột lịch (Conflict):**<br>1. Tại bước 10, nếu có người khác vừa bấm đặt trùng khung giờ trước đó 1 giây, API trả về lỗi.<br>2. Hệ thống báo "Khung giờ này vừa có người đặt. Vui lòng chọn giờ khác". |

---

## Bảng 5.2 Đặc tả Use Case Quản lý lịch hẹn của tôi

| Thành phần | Nội dung |
|---|---|
| **Tên Use Case** | Xem và Hủy lịch hẹn |
| **Tác nhân** | Bệnh nhân |
| **Mục đích** | Bệnh nhân theo dõi trạng thái các lịch khám đã đặt và có thể hủy lịch nếu bận đột xuất. |
| **Điều kiện kích hoạt** | Bệnh nhân chọn mục "Lịch hẹn của tôi". |
| **Điều kiện tiên quyết** | Đã đăng nhập hệ thống. |
| **Luồng sự kiện chính** | 1. Bệnh nhân vào trang "Lịch hẹn của tôi".<br>2. Hệ thống gọi API `GET /appointments/my`.<br>3. Danh sách lịch hẹn hiển thị dạng thẻ (Card), được sắp xếp từ mới đến cũ.<br>4. Mỗi thẻ hiển thị: Thời gian khám, Tên bác sĩ, Dịch vụ, và Trạng thái hiện tại (Chờ xác nhận, Đã xác nhận, Đã check-in, Đã hủy...).<br>5. Bệnh nhân có thể nhấn vào tab để lọc xem lịch Sắp tới hoặc lịch Đã qua.<br>6. Bệnh nhân tìm đến một lịch hẹn đang ở trạng thái "Chờ xác nhận" hoặc "Đã xác nhận" và nhấn "Hủy lịch".<br>7. Hệ thống hiển thị popup xác nhận: "Bạn có chắc chắn muốn hủy lịch hẹn này?".<br>8. Bệnh nhân nhấn "Đồng ý". Hệ thống gọi API `PUT /appointments/:id/cancel`.<br>9. Trạng thái lịch chuyển thành "Đã hủy" (cancelled). |
| **Luồng sự kiện thay thế** | **Không thể hủy lịch:** Nếu trạng thái lịch đã là "Đã check-in" hoặc "Đang khám", nút "Hủy lịch" sẽ bị ẩn, bệnh nhân không thể tự hủy trên web mà phải báo cho Lễ tân. |

---

## Bảng 5.3 Đặc tả Use Case Xem Hồ sơ bệnh án điện tử

| Thành phần | Nội dung |
|---|---|
| **Tên Use Case** | Xem Hồ sơ bệnh án & Đơn thuốc |
| **Tác nhân** | Bệnh nhân |
| **Mục đích** | Bệnh nhân có thể xem lại kết quả khám bệnh, lời dặn của bác sĩ và toa thuốc đã kê ở bất cứ đâu mà không cần sổ khám bệnh giấy. |
| **Điều kiện kích hoạt** | Bệnh nhân chọn mục "Hồ sơ bệnh án". |
| **Điều kiện tiên quyết** | Đã đăng nhập. Bệnh nhân đã hoàn thành ít nhất 1 ca khám. |
| **Luồng sự kiện chính** | 1. Bệnh nhân truy cập "Hồ sơ bệnh án".<br>2. Hệ thống gọi API lấy danh sách các lịch khám có trạng thái "Hoàn thành" (done).<br>3. Bệnh nhân nhấn "Xem chi tiết" tại một lượt khám cụ thể.<br>4. Hệ thống tải chi tiết Medical Record và Prescription tương ứng.<br>5. Bệnh nhân có thể đọc các thông tin: Chẩn đoán lâm sàng, Hướng điều trị, Ghi chú y khoa.<br>6. Bệnh nhân cuộn xuống phần Đơn thuốc để xem danh sách các loại thuốc, liều lượng (Sáng mấy viên, Tối mấy viên) và số ngày uống.<br>7. Nếu có lịch hẹn tái khám, hệ thống sẽ bôi đậm và làm nổi bật ngày tái khám. |

---

## Bảng 5.4 Đặc tả Use Case Cập nhật Thông tin cá nhân & Tiền sử bệnh

| Thành phần | Nội dung |
|---|---|
| **Tên Use Case** | Cập nhật Hồ sơ Y tế cá nhân |
| **Tác nhân** | Bệnh nhân |
| **Mục đích** | Cho phép bệnh nhân tự khai báo hoặc chỉnh sửa các thông tin cơ địa (Dị ứng, Nhóm máu) để hỗ trợ bác sĩ tốt hơn trong quá trình điều trị. |
| **Điều kiện kích hoạt** | Bệnh nhân vào trang "Thông tin cá nhân". |
| **Luồng sự kiện chính** | 1. Bệnh nhân vào "Thông tin cá nhân".<br>2. Hệ thống hiển thị 2 phần: Thông tin tài khoản và Hồ sơ Y tế (`PatientProfile`).<br>3. Bệnh nhân thay đổi thông tin ở các trường: Nhóm máu, Tiền sử dị ứng, Bệnh lý nền.<br>4. Bệnh nhân nhấn "Lưu thay đổi".<br>5. Hệ thống gọi API `PUT /users/profile` cập nhật vào CSDL.<br>6. Thông tin mới sẽ hiển thị ngay trên màn hình của Bác sĩ trong lần khám tiếp theo. |
