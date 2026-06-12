# Đặc tả Use Case — Role: Lễ tân

---

## Bảng 2.x Đặc tả Use Case Quản lý lịch hẹn và tiếp đón bệnh nhân

| | |
|---|---|
| **Tên Use Case** | Quản lý lịch hẹn và tiếp đón bệnh nhân |
| **Tác nhân** | Lễ tân |
| **Mục đích** | Cho phép lễ tân xem danh sách lịch hẹn trong ngày, tìm kiếm bệnh nhân và thực hiện check-in để đưa bệnh nhân vào hàng chờ của bác sĩ |
| **Điều kiện kích hoạt** | Lễ tân đăng nhập vào hệ thống và truy cập vào trang "Quản lý lịch hẹn" |
| **Điều kiện thành công** | Bệnh nhân được check-in thành công và nhận được số thứ tự trong hàng chờ |
| **Điều kiện tiên quyết** | Lễ tân đã đăng nhập vào hệ thống |
| **Luồng sự kiện chính** | 1. Lễ tân truy cập vào trang "Quản lý lịch hẹn".<br>2. Hệ thống gọi API lấy danh sách toàn bộ lịch hẹn trong ngày hiện tại.<br>3. Lễ tân tìm kiếm bệnh nhân bằng cách nhập tên hoặc số điện thoại vào ô tìm kiếm.<br>4. Hệ thống lọc và hiển thị thông tin lịch hẹn tương ứng đang ở trạng thái "Đã xác nhận" (Confirmed).<br>5. Bệnh nhân có mặt tại quầy, lễ tân xác nhận đúng người và nhấn nút "Check-in" trên dòng lịch hẹn đó.<br>6. Hệ thống gửi yêu cầu cập nhật trạng thái lên máy chủ.<br>7. Máy chủ kiểm tra tính hợp lệ của việc chuyển đổi trạng thái (từ "Đã xác nhận" sang "Đã check-in").<br>8. Hệ thống đếm số lượng bệnh nhân đã lấy số của bác sĩ đó trong ngày để tính toán số thứ tự tiếp theo.<br>9. Hệ thống gán số thứ tự cho bệnh nhân, lưu vào cơ sở dữ liệu và chuyển trạng thái thành "Đã check-in".<br>10. Hệ thống phát tín hiệu realtime (Socket) đến các giao diện liên quan.<br>11. Tên và số thứ tự của bệnh nhân ngay lập tức xuất hiện ở bảng "Hàng chờ hôm nay" bên phải màn hình lễ tân và màn hình khám của bác sĩ. |
| **Luồng sự kiện thay thế** | **5a. Bệnh nhân gọi điện yêu cầu hủy lịch**<br>5a.1. Lễ tân tìm kiếm lịch hẹn của bệnh nhân.<br>5a.2. Lễ tân nhấn nút "Hủy lịch".<br>5a.3. Hệ thống yêu cầu xác nhận hành động hủy.<br>5a.4. Lễ tân đồng ý, hệ thống cập nhật trạng thái lịch hẹn thành "Đã hủy" (Cancelled).<br><br>**3a. Không tìm thấy lịch hẹn trong ngày**<br>3a.1. Bệnh nhân đến nhầm ngày hoặc chưa đặt lịch.<br>3a.2. Lễ tân chuyển sang luồng "Tạo phiếu khám trực tiếp" (Walk-in). |
| **Luồng sự kiện ngoại lệ** | **7a. Lịch hẹn đã bị hủy trước đó hoặc đã hoàn thành**<br>7a.1. Hệ thống báo lỗi không thể thao tác trên lịch hẹn này.<br>7a.2. Nút "Check-in" bị ẩn đi đối với các trạng thái không hợp lệ. |

---

## Bảng 2.x Đặc tả Use Case Tạo phiếu khám trực tiếp

| | |
|---|---|
| **Tên Use Case** | Tạo phiếu khám trực tiếp |
| **Tác nhân** | Lễ tân |
| **Mục đích** | Cho phép lễ tân đăng ký khám cho bệnh nhân đến trực tiếp tại quầy mà không đặt lịch trước, đồng thời cấp số thứ tự vào hàng chờ ngay lập tức |
| **Điều kiện kích hoạt** | Lễ tân nhấn nút "Tạo phiếu khám" trên trang Quản lý lịch hẹn |
| **Điều kiện thành công** | Phiếu khám được tạo thành công, bệnh nhân có số thứ tự và vào hàng chờ của bác sĩ |
| **Điều kiện tiên quyết** | Lễ tân đã đăng nhập vào hệ thống. Bác sĩ đang làm việc trong ngày hôm đó |
| **Luồng sự kiện chính** | 1. Lễ tân nhấn nút "Tạo phiếu khám"<br>2. Hệ thống hiển thị form với 2 tab: "Bệnh nhân cũ" và "Bệnh nhân mới"<br>3. Lễ tân ở tab "Bệnh nhân cũ", nhập số điện thoại của bệnh nhân rồi nhấn "Tìm kiếm"<br>4. Hệ thống gọi API tìm kiếm theo số điện thoại trong cơ sở dữ liệu<br>5. Hệ thống tìm thấy tài khoản và hiển thị họ tên bệnh nhân lên màn hình<br>6. Lễ tân chọn bác sĩ khám và chọn khung giờ còn trống trong ngày hôm đó<br>7. Lễ tân nhấn "Tạo phiếu & Check-in"<br>8. Hệ thống kiểm tra khung giờ đó chưa có ai đặt (trạng thái không phải đã hủy hoặc không đến)<br>9. Hệ thống tạo lịch hẹn mới trong cơ sở dữ liệu với trạng thái ban đầu là "Chờ xác nhận"<br>10. Ngay sau đó hệ thống tự động cập nhật trạng thái sang "Đã check-in"<br>11. Hệ thống đếm số bệnh nhân đã check-in và đang khám của bác sĩ đó trong ngày, cộng thêm 1 để tính ra số thứ tự mới<br>12. Hệ thống gán số thứ tự cho bệnh nhân và lưu vào cơ sở dữ liệu<br>13. Hệ thống gửi thông báo realtime để cập nhật hàng chờ trên màn hình bác sĩ ngay lập tức |
| **Luồng sự kiện thay thế** | 5a. Không tìm thấy số điện thoại trong hệ thống (bệnh nhân chưa có tài khoản)<br>5a.1. Hệ thống hiển thị thông báo "Không tìm thấy tài khoản với SĐT này" và gợi ý "Đăng ký mới?"<br>5a.2. Lễ tân nhấn vào gợi ý đó hoặc tự chuyển sang tab "Bệnh nhân mới"<br>5a.3. Lễ tân nhập họ tên và số điện thoại của bệnh nhân vào form<br>5a.4. Hệ thống tạo tài khoản mới với vai trò bệnh nhân, mật khẩu mặc định được đặt bằng số điện thoại<br>5a.5. Lễ tân chọn bác sĩ khám và chọn khung giờ còn trống trong ngày<br>5a.6. Lễ tân nhấn "Đăng ký & Check-in"<br>5a.7. Hệ thống kiểm tra khung giờ đó chưa có ai đặt<br>5a.8. Hệ thống tạo lịch hẹn mới và liên kết với tài khoản vừa tạo<br>5a.9. Hệ thống tự động cập nhật trạng thái sang "Đã check-in" và cấp số thứ tự<br>5a.10. Tên bệnh nhân xuất hiện trong hàng chờ trên màn hình bác sĩ |
| **Luồng sự kiện ngoại lệ** | 8a. Khung giờ lễ tân chọn đã có người khác đặt trước đó<br>8a.1. Hệ thống trả về thông báo lỗi "Khung giờ này đã có người đặt"<br>8a.2. Lễ tân quay lại chọn khung giờ khác còn trống |

---

## Bảng 2.x Đặc tả Use Case Duyệt lịch hẹn online

| | |
|---|---|
| **Tên Use Case** | Duyệt lịch hẹn online |
| **Tác nhân** | Lễ tân |
| **Mục đích** | Cho phép lễ tân xem xét và duyệt các yêu cầu đặt lịch khám mà bệnh nhân gửi qua website, đảm bảo lịch hẹn hợp lệ trước khi xác nhận |
| **Điều kiện kích hoạt** | Lễ tân vào trang "Xác nhận lịch hẹn" |
| **Điều kiện thành công** | Lịch hẹn được duyệt hoặc từ chối, bệnh nhân nhận được phản hồi từ hệ thống |
| **Điều kiện tiên quyết** | Lễ tân đã đăng nhập. Có ít nhất một lịch hẹn đang ở trạng thái "Chờ xác nhận" |
| **Luồng sự kiện chính** | 1. Lễ tân truy cập vào trang "Xác nhận lịch hẹn".<br>2. Hệ thống tự động gọi API lọc và lấy toàn bộ lịch hẹn đang ở trạng thái "Chờ xác nhận" (Pending) từ tất cả các ngày.<br>3. Hệ thống gom nhóm và hiển thị các lịch hẹn theo từng ngày để dễ quản lý.<br>4. Lễ tân kiểm tra chi tiết các thẻ lịch hẹn (bao gồm: tên, SĐT bệnh nhân, giờ khám, bác sĩ được chọn, triệu chứng sơ bộ).<br>5. Lễ tân đối chiếu với lịch làm việc thực tế của phòng khám, nhận thấy khung giờ hợp lệ.<br>6. Lễ tân nhấn nút "Xác nhận" trên thẻ lịch hẹn.<br>7. Hệ thống gửi yêu cầu cập nhật trạng thái lên máy chủ.<br>8. Máy chủ cập nhật trạng thái từ "Chờ xác nhận" sang "Đã xác nhận" (Confirmed).<br>9. Giao diện tải lại tự động, thẻ lịch hẹn vừa duyệt sẽ biến mất khỏi danh sách chờ. |
| **Luồng sự kiện thay thế** | **5a. Khung giờ không hợp lệ hoặc bác sĩ bận đột xuất**<br>5a.1. Lễ tân quyết định không tiếp nhận lịch hẹn này.<br>5a.2. Lễ tân nhấn nút "Từ chối" trên thẻ lịch hẹn.<br>5a.3. Hệ thống hiển thị popup xác nhận việc từ chối.<br>5a.4. Lễ tân đồng ý, hệ thống gọi API hủy lịch hẹn.<br>5a.5. Trạng thái lịch hẹn chuyển sang "Đã hủy" (Cancelled) và thẻ lịch hẹn biến mất khỏi danh sách chờ duyệt.<br><br>**6a. Lễ tân duyệt hàng loạt**<br>6a.1. Lễ tân kiểm tra nhanh và thấy tất cả lịch trong danh sách đều hợp lệ.<br>6a.2. Lễ tân nhấn nút "Xác nhận tất cả".<br>6a.3. Hệ thống yêu cầu xác nhận thao tác hàng loạt.<br>6a.4. Hệ thống gọi API cập nhật trạng thái cho toàn bộ danh sách sang "Đã xác nhận". |
| **Luồng sự kiện ngoại lệ** | **2a. Không có dữ liệu chờ duyệt**<br>2a.1. Hệ thống hiển thị thông báo màn hình trống: "Không có lịch hẹn nào cần xác nhận". |
