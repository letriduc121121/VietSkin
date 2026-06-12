# CHƯƠNG 4: KẾT LUẬN VÀ HƯỚNG PHÁT TRIỂN

Sau một thời gian nghiên cứu lý thuyết, khảo sát nghiệp vụ thực tế tại các phòng khám da liễu tư nhân và tiến hành thiết kế, xây dựng, thử nghiệm hệ thống quản lý phòng khám da liễu VietSkin, tác giả đã hoàn thành các mục tiêu đề ra ban đầu. Dưới đây là những tổng kết chi tiết về kết quả đã đạt được, những mặt hạn chế còn tồn tại, định hướng phát triển mở rộng hệ thống trong tương lai và kết luận chung về đề tài nghiên cứu.

---

## 4.1. KẾT QUẢ ĐẠT ĐƯỢC

Đề tài nghiên cứu đã xây dựng thành công ứng dụng quản lý phòng khám da liễu VietSkin với kiến trúc chia tách rõ ràng giữa Front-End và Back-End, giải quyết hiệu quả các bài toán thực tế trong quản lý và vận hành phòng khám y khoa. Hệ thống đã số hóa thành công quy trình quản lý khám chữa bệnh, giúp chuyển đổi từ mô hình quản lý thủ công sử dụng sổ sách truyền thống sang mô hình quản lý tập trung trực tuyến. Toàn bộ các quy trình nghiệp vụ đặc thù của phòng khám da liễu bao gồm việc đăng ký đặt lịch hẹn khám trực tuyến từ phía bệnh nhân, quy trình tiếp đón và phân loại hàng đợi của lễ tân, quy trình thăm khám lâm sàng, ghi chép bệnh án điện tử, tải lên ảnh tổn thương da, kê đơn thuốc điện tử của bác sĩ và quy trình thanh toán hóa đơn đều đã được triển khai thực nghiệm thành công. Hệ thống đã trải qua các kịch bản kiểm thử nghiêm ngặt, đạt được độ ổn định cao và đáp ứng tốt các yêu cầu vận hành thực tế.

Giao diện người dùng được xây dựng trên nền tảng Vue 3 kết hợp với Vite và Tailwind CSS, mang lại tốc độ tải trang nhanh chóng và trải nghiệm mượt mà. Việc áp dụng ngôn ngữ thiết kế hiện đại cùng các hiệu ứng chuyển động tinh tế giúp nhân viên y tế thao tác dễ dàng trên cả máy tính để bàn và các thiết bị cầm tay. Phân hệ lễ tân hỗ trợ tiếp đón bệnh nhân vãng lai hoặc duyệt lịch hẹn trực tuyến, tự động cấp số thứ tự khám và quản lý hàng đợi theo thời gian thực. Phân hệ bác sĩ tích hợp các trường dữ liệu da liễu chuyên sâu như phân loại da, vị trí tổn thương, chẩn đoán bệnh lý và kê đơn thuốc điện tử với cơ chế tự động tính toán tổng số lượng thuốc cần phát dựa trên tần suất và ngày sử dụng. Đối với phân hệ quản trị viên, giao diện Dashboard cung cấp các biểu đồ thống kê doanh thu trực quan, quản lý danh mục phòng khám, dịch vụ, nhân sự và phân lịch trực tuần cho bác sĩ dựa trên các ràng buộc nghiệp vụ chặt chẽ ở tầng Back-End.

Về mặt công nghệ và kiến trúc hệ thống, Back-End được xây dựng bằng Spring Boot 3.x kết hợp với cơ sở dữ liệu PostgreSQL và bộ nhớ đệm Redis giúp tối ưu hóa hiệu năng phản hồi API xuống dưới mức 200ms. Việc áp dụng công nghệ Server-Sent Events (SSE) đã giải quyết triệt để bài toán đồng bộ hàng đợi khám của bác sĩ ngay khi lễ tân thực hiện check-in và gửi thông báo tức thời cho lễ tân khi ca khám hoàn tất mà không gây quá tải cho máy chủ. Hệ thống cũng được bảo mật nghiêm ngặt bằng Spring Security với cơ chế xác thực phân quyền dựa trên JWT, sử dụng Access Token ngắn hạn và Refresh Token dài hạn để nâng cao tính an toàn thông tin y bạ và doanh thu tài chính. Đồng thời, hình ảnh tổn thương da của bệnh nhân được lưu trữ an toàn trên dịch vụ đám mây Cloudinary và các báo cáo tài chính được xuất chuyên nghiệp sang định dạng Excel và PDF nhờ các thư viện Apache POI và OpenPDF.

---

## 4.2. HẠN CHẾ CỦA HỆ THỐNG

Mặc dù hệ thống thực nghiệm đạt được nhiều kết quả tích cực, đáp ứng tốt các kịch bản kiểm thử nghiệp vụ lâm sàng và quản lý tài chính, song do giới hạn về mặt thời gian thực hiện đề tài và các nguồn lực kỹ thuật liên quan, hệ thống VietSkin vẫn còn tồn tại một số điểm hạn chế nhất định cần được khắc phục trước khi đưa vào áp dụng thực tế thương mại.

Một trong những hạn chế lớn nhất hiện nay là phân hệ thanh toán trực tuyến qua cổng thanh toán điện tử mới chỉ dừng lại ở mức mô phỏng giao diện và dữ liệu tĩnh. Hệ thống chưa thực hiện kết nối trực tiếp đến môi trường Sandbox hoặc API chính thức của các nhà cung cấp dịch vụ thanh toán phổ biến như VNPay, MoMo hay ZaloPay để tự động hóa hoàn toàn luồng tiền và đồng bộ trạng thái hóa đơn qua webhook IPN ngay sau khi bệnh nhân quét mã QR thành công. Bên cạnh đó, hệ thống cũng chưa tích hợp các kênh truyền thông nhắc lịch tự động như SMS Gateway, Zalo ZNS hoặc Email để tự động gửi thông báo xác nhận khi lịch hẹn được duyệt, nhắc nhở lịch tái khám định kỳ hoặc gửi mã OTP xác thực bảo mật khi người dùng đăng ký tài khoản mới.

Phân hệ quản lý thuốc hiện tại của hệ thống cũng mới chỉ dừng lại ở mức quản lý danh mục và thông tin cơ bản dùng để kê đơn thuốc. Hệ thống chưa hỗ trợ các nghiệp vụ quản lý kho dược chuyên sâu như quản lý số lượng tồn kho khả dụng thực tế, theo dõi hạn sử dụng của thuốc theo từng lô nhập, cảnh báo thuốc sắp hết hạn hoặc tự động trừ số lượng tồn kho khả dụng khi đơn thuốc được thanh toán. Ngoài ra, kiến trúc cơ sở dữ liệu hiện tại mới chỉ tối ưu hóa cho mô hình phòng khám đơn lẻ tại một địa điểm, chưa hỗ trợ cấu trúc đa chi nhánh để quản lý chuỗi phòng khám lớn gồm nhiều cơ sở y tế độc lập ở các địa điểm địa lý khác nhau.

---

## 4.3. HƯỚNG PHÁT TRIỂN TRONG TƯƠNG LAI

Để khắc phục các hạn chế nêu trên và biến VietSkin thành một giải pháp phần mềm quản lý phòng khám da liễu toàn diện có tính cạnh tranh cao trên thị trường, định hướng nghiên cứu và phát triển hệ thống trong tương lai sẽ tập trung vào các nội dung trọng tâm.

Trước hết, tác giả sẽ tiến hành đăng ký tài khoản doanh nghiệp thử nghiệm và tích hợp trực tiếp SDK/API của các cổng thanh toán lớn tại Việt Nam nhằm tự động hóa hoàn toàn luồng tiền và đồng bộ trạng thái hóa đơn tức thì từ hệ thống ngân hàng sang cơ sở dữ liệu của phòng khám. Phân hệ quản lý kho dược lâm sàng sẽ được nâng cấp toàn diện bằng cách bổ sung các bảng dữ liệu quản lý nhà cung cấp, phiếu nhập kho, phiếu xuất kho, phiếu kiểm kê định kỳ và xây dựng thuật toán tự động trừ số lượng tồn kho khả dụng của thuốc khi có đơn thuốc được thanh toán thành công. Đồng thời, hệ thống sẽ kết nối với các nhà cung cấp dịch vụ viễn thông hoặc dịch vụ Email để tự động gửi thông báo xác nhận lịch hẹn, nhắc nhở lịch tái khám trước 24 giờ và gửi mã OTP bảo mật cho người dùng.

Tiếp theo, tác giả dự kiến phát triển ứng dụng di động độc lập dành riêng cho bệnh nhân sử dụng các công nghệ lai trên cả hai hệ điều hành Android và iOS để bệnh nhân có thể đặt lịch nhanh, thanh toán qua liên kết ví và nhận thông báo đẩy tức thời. Hơn nữa, việc nghiên cứu tích hợp các mô hình học sâu chuyên về xử lý ảnh để phân tích hình ảnh tổn thương da do bệnh nhân chụp tải lên sẽ hỗ trợ bác sĩ đưa ra chẩn đoán ban đầu nhanh chóng và chính xác hơn. Về mặt hạ tầng, hệ thống sẽ được chuyển đổi sang dạng container hóa bằng Docker, chạy trên nền tảng điều phối Kubernetes của các nhà cung cấp dịch vụ đám mây lớn nhằm đảm bảo khả năng mở rộng linh hoạt, xây dựng đường ống CI/CD tự động và triển khai hệ thống giám sát Prometheus và Grafana để theo dõi hiệu năng hệ thống theo thời gian thực.

---

## 4.4. KẾT LUẬN CHUNG

Đề tài nghiên cứu xây dựng hệ thống quản lý phòng khám da liễu VietSkin đã hoàn thành đầy đủ các mục tiêu đề ra ban đầu, giải quyết tốt bài toán số hóa quy trình vận hành và nâng cao hiệu quả quản trị phòng khám. Các kết quả thực nghiệm kiểm thử và đánh giá cho thấy hệ thống hoạt động ổn định, các ràng buộc dữ liệu được xử lý chặt chẽ ở tầng Back-End và giao diện Front-End thân thiện, dễ sử dụng cho các nhóm đối tượng người dùng khác nhau. Mặc dù vẫn còn một số điểm hạn chế về mặt thanh toán trực tuyến, quản lý kho dược chuyên sâu và hạ tầng triển khai đám mây, các giải pháp và hướng phát triển đề xuất đã mở ra lộ trình rõ ràng để hoàn thiện và đưa sản phẩm vào áp dụng thực tiễn. VietSkin hứa hẹn sẽ trở thành một công cụ quản lý y khoa đắc lực, góp phần nâng cao chất lượng dịch vụ chăm sóc sức khỏe da liễu và thúc đẩy chuyển đổi số trong lĩnh vực y tế tại Việt Nam.
