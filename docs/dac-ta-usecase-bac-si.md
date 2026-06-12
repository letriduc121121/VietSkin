# Đặc tả Use Case — Role: Bác sĩ

---

## Bảng 3.1 Đặc tả Use Case Xem danh sách hàng chờ và Tiếp nhận bệnh nhân

| Thành phần | Nội dung |
|---|---|
| **Tên Use Case** | Xem danh sách hàng chờ và Tiếp nhận bệnh nhân |
| **Tác nhân** | Bác sĩ |
| **Mục đích** | Bác sĩ có thể theo dõi danh sách bệnh nhân đang chờ khám trong ngày và gọi bệnh nhân tiếp theo vào phòng khám. |
| **Điều kiện kích hoạt** | Bác sĩ đăng nhập thành công và truy cập vào trang "Danh sách bệnh nhân". |
| **Điều kiện thành công** | Bác sĩ chọn được bệnh nhân, hệ thống chuyển trạng thái sang "Đang khám" và điều hướng vào trang khám bệnh chi tiết. |
| **Điều kiện tiên quyết** | Bác sĩ đã được phân công lịch làm việc trong ngày. Có bệnh nhân đã được Lễ tân check-in. |
| **Luồng sự kiện chính** | 1. Bác sĩ truy cập vào trang "Danh sách bệnh nhân".<br>2. Hệ thống gọi API lấy danh sách các lịch hẹn trong ngày của bác sĩ đó và phân loại thành 3 tab: TIẾP NHẬN (chờ khám), ĐANG KHÁM, ĐÃ KHÁM.<br>3. Hệ thống sắp xếp tab TIẾP NHẬN theo Số thứ tự (STT) tăng dần.<br>4. Bác sĩ xem thông tin sơ bộ của bệnh nhân (Họ tên, SĐT, Giờ hẹn, Triệu chứng).<br>5. Bác sĩ nhấn nút "Gọi khám" (biểu tượng mũi tên) tại bệnh nhân đầu tiên trong hàng chờ.<br>6. Hệ thống gửi yêu cầu API cập nhật trạng thái lịch hẹn từ "Đã check-in" (checked_in) sang "Đang khám" (in_progress).<br>7. Hệ thống phát tín hiệu realtime (Socket) báo hiệu danh sách hàng chờ có sự thay đổi.<br>8. Màn hình của Lễ tân tự động cập nhật trạng thái của bệnh nhân đó.<br>9. Hệ thống tự động chuyển hướng Bác sĩ sang trang "Thực hiện khám bệnh" cho bệnh nhân vừa chọn. |
| **Luồng sự kiện thay thế** | **3a. Bác sĩ tìm kiếm bệnh nhân cụ thể**<br>3a.1. Bác sĩ nhập tên hoặc mã bệnh nhân vào thanh tìm kiếm.<br>3a.2. Hệ thống lọc và chỉ hiển thị các bệnh nhân khớp với từ khóa trong danh sách.<br>3a.3. Bác sĩ nhấn "Gọi khám" và tiếp tục từ bước 6. |
| **Luồng sự kiện ngoại lệ** | **2a. Không có bệnh nhân nào trong danh sách chờ**<br>2a.1. Hệ thống hiển thị thông báo "Không có bệnh nhân nào".<br><br>**6a. Lỗi khi gọi bệnh nhân (VD: mất mạng)**<br>6a.1. Hệ thống hiển thị thông báo lỗi "Lỗi khi gọi bệnh nhân".<br>6a.2. Bác sĩ cần tải lại trang và thử lại. |

---

## Bảng 3.2 Đặc tả Use Case Thực hiện khám bệnh (Ghi bệnh án & Kê đơn)

| Thành phần | Nội dung |
|---|---|
| **Tên Use Case** | Thực hiện khám bệnh |
| **Tác nhân** | Bác sĩ |
| **Mục đích** | Bác sĩ tiến hành thăm khám, tra cứu tiền sử bệnh, ghi nhận chẩn đoán lâm sàng, kê đơn thuốc và hoàn tất phiên khám cho bệnh nhân. |
| **Điều kiện kích hoạt** | Bác sĩ vừa tiếp nhận bệnh nhân thành công (hoặc nhấn nút "Tiếp tục khám" / "Xem bệnh án" từ danh sách). |
| **Điều kiện thành công** | Hồ sơ bệnh án và toa thuốc được lưu vào cơ sở dữ liệu, trạng thái lịch hẹn chuyển sang "Đã khám" (done). |
| **Điều kiện tiên quyết** | Trạng thái của lịch hẹn đang là "Đang khám" (in_progress). |
| **Luồng sự kiện chính** | 1. Hệ thống hiển thị giao diện khám bệnh gồm 2 phần: Thông tin bệnh nhân/Lịch sử khám (cột trái) và Form tạo hồ sơ khám (cột phải).<br>2. Bác sĩ tra cứu nhanh thông tin dị ứng, tiền sử bệnh và các lần khám trước đó của bệnh nhân ở cột trái.<br>3. Bác sĩ nhập thông tin vào form: Triệu chứng, Chuẩn đoán, Loại da, Vị trí tổn thương, Hướng điều trị và Ghi chú.<br>4. (Tùy chọn) Bác sĩ đánh dấu "Hẹn tái khám" và chọn ngày.<br>5. Bác sĩ mở tab "Toa thuốc" để tiến hành kê đơn.<br>6. Bác sĩ nhập từ khóa vào ô tìm kiếm thuốc, hệ thống hiển thị danh sách gợi ý.<br>7. Bác sĩ chọn thuốc, nhập Liều dùng, Tần suất, Số ngày và Số lượng cho từng loại thuốc.<br>8. Bác sĩ nhấn "Lưu toa thuốc". Hệ thống gọi API lưu hồ sơ bệnh án và đơn thuốc vào cơ sở dữ liệu.<br>9. Hệ thống thông báo "Đã lưu toa thuốc" và khóa phần chỉnh sửa đơn thuốc thành dạng chỉ đọc.<br>10. Bác sĩ nhấn nút "Hoàn tất khám".<br>11. Hệ thống gọi API chuyển trạng thái lịch hẹn sang "Đã hoàn thành" (done).<br>12. Hệ thống đưa Bác sĩ quay trở lại trang "Danh sách bệnh nhân" ban đầu. |
| **Luồng sự kiện thay thế** | **5a. Bác sĩ không kê đơn thuốc**<br>5a.1. Bác sĩ chỉ nhập phần thông tin bệnh án (Chuẩn đoán, hướng điều trị).<br>5a.2. Bác sĩ bỏ qua bước kê đơn và nhấn thẳng nút "Lưu hồ sơ" hoặc "Hoàn tất khám".<br>5a.3. Hệ thống chỉ lưu hồ sơ bệnh án, không tạo bản ghi toa thuốc.<br>5a.4. Tiếp tục bước 11 của luồng chính. |
| **Luồng sự kiện ngoại lệ** | **8a. Lỗi khi lưu dữ liệu**<br>8a.1. Hệ thống báo lỗi (do mất kết nối hoặc thiếu trường bắt buộc).<br>8a.2. Bác sĩ bổ sung thông tin và nhấn Lưu lại.<br><br>**10a. Bác sĩ rời trang mà chưa hoàn tất**<br>10a.1. Trạng thái lịch hẹn vẫn giữ nguyên là "Đang khám".<br>10a.2. Bác sĩ có thể vào lại từ tab ĐANG KHÁM để tiếp tục. |

---

## Bảng 3.3 Đặc tả Use Case Xem tổng quan và Lịch làm việc

| Thành phần | Nội dung |
|---|---|
| **Tên Use Case** | Xem tổng quan và Lịch làm việc |
| **Tác nhân** | Bác sĩ |
| **Mục đích** | Bác sĩ có thể xem thống kê tổng quan ca bệnh trong ngày, bệnh nhân đang khám hiện tại và danh sách lịch hẹn sắp tới. |
| **Điều kiện kích hoạt** | Bác sĩ đăng nhập vào hệ thống và truy cập trang "Tổng quan" (Dashboard). |
| **Điều kiện thành công** | Bác sĩ nắm bắt được tình hình công việc trong ngày và chuyển sang trạng thái sẵn sàng tiếp nhận bệnh nhân. |
| **Điều kiện tiên quyết** | Bác sĩ có tài khoản hợp lệ và đã đăng nhập. |
| **Luồng sự kiện chính** | 1. Bác sĩ truy cập vào trang "Tổng quan".<br>2. Hệ thống gọi API `/doctors` để xác định hồ sơ của bác sĩ đang đăng nhập.<br>3. Hệ thống gọi tiếp API `/appointments` với tham số là ngày hiện tại và `doctorId` vừa lấy được.<br>4. Hệ thống phân tích dữ liệu và hiển thị 4 thẻ thống kê: Tổng lịch hôm nay, Đang chờ khám, Đang khám, Đã hoàn thành.<br>5. Hệ thống trích xuất thông tin bệnh nhân có trạng thái "Đang khám" (in_progress) hoặc người đầu tiên trong hàng "Đang chờ khám" (checked_in) để hiển thị lên thẻ "Bệnh nhân hiện tại".<br>6. Bác sĩ có thể nhấn vào nút "Xem lịch" ở phần Bệnh nhân hiện tại hoặc "Lịch hôm nay" để chuyển sang giao diện hàng chờ chi tiết. |
| **Luồng sự kiện thay thế** | **5a. Không có bệnh nhân nào trong danh sách hôm nay**<br>5a.1. Các thẻ thống kê hiển thị số 0.<br>5a.2. Thẻ "Bệnh nhân hiện tại" hiển thị thông báo "Không có bệnh nhân đang khám". |
| **Luồng sự kiện ngoại lệ** | **2a. Lỗi kết nối mạng hoặc server không phản hồi**<br>2a.1. Giao diện bị kẹt ở trạng thái "Đang tải...".<br>2a.2. Hệ thống hiển thị cảnh báo lỗi mạng nếu API quá hạn (timeout). |

---

## Bảng 3.4 Đặc tả Use Case Xem lịch làm việc trong tháng

| Thành phần | Nội dung |
|---|---|
| **Tên Use Case** | Xem lịch làm việc trong tháng |
| **Tác nhân** | Bác sĩ |
| **Mục đích** | Bác sĩ xem toàn bộ lịch làm việc của mình trong tháng để nắm bắt các ngày được phân công và số lượng bệnh nhân đặt lịch từng ngày |
| **Điều kiện kích hoạt** | Bác sĩ chọn mục "Lịch làm việc" trên thanh điều hướng |
| **Điều kiện thành công** | Hệ thống hiển thị đúng lịch làm việc theo tháng của bác sĩ đang đăng nhập |
| **Điều kiện tiên quyết** | Bác sĩ đã đăng nhập. Quản trị viên đã phân công lịch làm việc cho bác sĩ trong tháng đó |
| **Luồng sự kiện chính** | 1. Bác sĩ truy cập trang "Lịch làm việc".<br>2. Hệ thống mặc định hiển thị tháng hiện tại.<br>3. Hệ thống gọi API `GET /doctor-work-days/my?month=YYYY-MM` để lấy danh sách các ngày làm việc được phân công của bác sĩ trong tháng.<br>4. Hệ thống gọi thêm API `GET /appointments?doctorId=&status=confirmed` để đếm số lượng bệnh nhân đã đặt lịch cho từng ngày.<br>5. Giao diện hiển thị lịch dạng tháng (Calendar view), mỗi ô ngày làm việc hiển thị ca làm (Sáng/Chiều) và số lượng bệnh nhân đã đặt.<br>6. Bác sĩ nhấn mũi tên Trái/Phải để chuyển sang tháng trước hoặc tháng sau.<br>7. Bác sĩ nhấn vào một ngày cụ thể để xem danh sách bệnh nhân đã đặt lịch trong ngày đó. |
| **Luồng sự kiện thay thế** | 7a. Bác sĩ nhấn vào ngày chưa có ai đặt lịch → hệ thống hiển thị "Chưa có lịch hẹn nào trong ngày này". |
| **Luồng sự kiện ngoại lệ** | 3a. Quản trị viên chưa phân công lịch cho tháng đang xem → toàn bộ ô ngày hiển thị trống, hệ thống thông báo "Chưa có lịch phân công cho tháng này". |

---

## Bảng 3.5 Đặc tả Use Case Xem lịch sử các ca khám bệnh

| Thành phần | Nội dung |
|---|---|
| **Tên Use Case** | Xem lịch sử các ca khám bệnh |
| **Tác nhân** | Bác sĩ |
| **Mục đích** | Bác sĩ tra cứu lại danh sách các ca đã hoàn tất khám và xem chi tiết hồ sơ bệnh án, toa thuốc của từng ca |
| **Điều kiện kích hoạt** | Bác sĩ chọn mục "Lịch sử khám" trên thanh điều hướng |
| **Điều kiện thành công** | Hệ thống hiển thị đúng danh sách các ca đã khám xong của bác sĩ, bác sĩ xem được chi tiết hồ sơ |
| **Điều kiện tiên quyết** | Bác sĩ đã đăng nhập và đã hoàn tất ít nhất một ca khám trước đó |
| **Luồng sự kiện chính** | 1. Bác sĩ truy cập trang "Lịch sử khám".<br>2. Hệ thống gọi API `GET /doctors/me/profile` để lấy `doctorId` của bác sĩ đang đăng nhập.<br>3. Hệ thống gọi API `GET /appointments?doctorId=&status=done` để lấy danh sách các lịch hẹn đã hoàn thành, sắp xếp theo thời gian mới nhất.<br>4. Hệ thống hiển thị danh sách dạng bảng gồm: Ngày khám, Họ tên bệnh nhân, Số điện thoại, Dịch vụ, Triệu chứng.<br>5. Bác sĩ có thể lọc theo khoảng thời gian (Từ ngày - Đến ngày) hoặc tìm kiếm theo tên, số điện thoại bệnh nhân.<br>6. Bác sĩ nhấn "Xem chi tiết" tại một dòng bất kỳ.<br>7. Hệ thống gọi API `GET /medical-records/patient/:patientId` để lấy hồ sơ bệnh án.<br>8. Hệ thống hiển thị chi tiết hồ sơ: triệu chứng, chẩn đoán, hướng điều trị, toa thuốc ở chế độ chỉ đọc. |
| **Luồng sự kiện thay thế** | 5a. Không tìm thấy kết quả phù hợp với bộ lọc → hệ thống hiển thị thông báo "Không tìm thấy hồ sơ bệnh án nào phù hợp". |
| **Luồng sự kiện ngoại lệ** | 3a. Bác sĩ chưa có ca khám nào hoàn tất → hệ thống hiển thị danh sách trống và thông báo "Bạn chưa có lịch sử khám bệnh".<br>7a. Lỗi tải chi tiết hồ sơ → hệ thống thông báo "Không thể tải chi tiết hồ sơ, vui lòng thử lại sau". |
