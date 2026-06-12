# 4. ĐÁNH GIÁ VÀ SO SÁNH

Sau khi hoàn tất quá trình thiết kế, triển khai và kiểm thử thực nghiệm hệ thống quản lý phòng khám da liễu VietSkin, phần này tiến hành đánh giá một cách khách quan mức độ đạt được các mục tiêu đã đề ra ban đầu, đặt sản phẩm trong tương quan so sánh với các giải pháp tương tự đang có trên thị trường về ba phương diện (tính năng, hiệu năng và trải nghiệm người dùng), từ đó làm nổi bật những điểm mạnh cũng như những điểm còn hạn chế của hệ thống.

---

## 4.1. Đánh giá mức độ đạt được các mục tiêu đã đặt ra

Đề tài được khởi đầu với mục tiêu tổng quát là số hóa toàn bộ quy trình vận hành của một phòng khám da liễu tư nhân, chuyển đổi từ mô hình quản lý thủ công bằng sổ sách giấy tờ sang mô hình quản lý tập trung trực tuyến. Đối chiếu giữa các mục tiêu cụ thể đã đặt ra trong phần mở đầu với kết quả thực tế thu được sau quá trình kiểm thử, có thể đánh giá mức độ hoàn thành như sau:

| STT | Mục tiêu đề ra ban đầu | Mức độ đạt được | Minh chứng / Ghi chú |
|---|---|---|---|
| 1 | Xây dựng quy trình nghiệp vụ khép kín cho 4 vai trò (Bệnh nhân – Lễ tân – Bác sĩ – Admin) | **Hoàn thành 100%** | Luồng dữ liệu liên hoàn: đặt lịch → duyệt → thanh toán & check-in → khám → bệnh án + đơn thuốc → hóa đơn (TC-01 đến TC-14 đều Đạt) |
| 2 | Hỗ trợ song song hai hình thức: đặt lịch trực tuyến và khám vãng lai (walk-in) | **Hoàn thành 100%** | Walk-in lưu `patient_id = NULL`; cơ chế Auto-Link tự gắn tài khoản vào lịch sử khám cũ khi bệnh nhân đăng ký |
| 3 | Số hóa bệnh án điện tử chuyên sâu cho lĩnh vực da liễu | **Hoàn thành 100%** | Trường dữ liệu chuyên khoa: phân loại da, vị trí tổn thương, chẩn đoán, hướng điều trị, ảnh tổn thương (Cloudinary), ngày tái khám |
| 4 | Kê đơn thuốc điện tử với danh mục thuốc da liễu | **Hoàn thành 100%** | Tìm kiếm thuốc trong danh mục 26 loại, tự động tính tổng số lượng cấp phát theo liều × tần suất × số ngày |
| 5 | Quản lý thanh toán, xuất hóa đơn và thống kê doanh thu | **Hoàn thành (mức mô phỏng)** | Sinh mã `INV-YYYY-NNNN`, nhiều phương thức thanh toán; xuất báo cáo Excel/PDF. Cổng thanh toán điện tử mới ở mức mô phỏng QR |
| 6 | Đồng bộ hàng đợi khám và thông báo theo thời gian thực | **Hoàn thành 100%** | Server-Sent Events (SSE) đồng bộ hàng đợi bác sĩ tức thời khi check-in; toast thông báo khám xong cho lễ tân (TC-10, TC-12 Đạt) |
| 7 | Đảm bảo an toàn, bảo mật thông tin y tế và tài chính | **Hoàn thành 100%** | Spring Security + JWT (Access/Refresh Token), mật khẩu băm BCrypt, phân quyền theo vai trò (TC-15, TC-16 Đạt) |
| 8 | Xây dựng giao diện hiện đại, thân thiện, đa nền tảng | **Hoàn thành 100%** | React 19 + Tailwind CSS 4, bố cục Dashboard responsive theo từng vai trò |
| 9 | Hỗ trợ ra quyết định quản trị bằng số liệu thống kê | **Hoàn thành 100%** | Biểu đồ doanh thu, cơ cấu thanh toán, Top bác sĩ, Top 10 chẩn đoán; xuất báo cáo tài chính chuyên nghiệp |
| 10 | Tính năng mở rộng nâng cao trải nghiệm | **Vượt mục tiêu** | Tích hợp trợ lý ảo Chatbot AI (Groq LLM + Tool Calling) truy vấn dịch vụ/bác sĩ thật, phản hồi dạng streaming |

Nhìn chung, hệ thống VietSkin đã **hoàn thành đầy đủ các mục tiêu cốt lõi** đề ra ban đầu. Toàn bộ 16 kịch bản kiểm thử hộp đen (Black-box Testing) cho các luồng nghiệp vụ trọng yếu đều cho kết quả trùng khớp hoàn toàn với kỳ vọng (Pass 16/16). Đáng chú ý, hệ thống còn **vượt phạm vi mục tiêu ban đầu** khi tích hợp thêm trợ lý ảo Chatbot ứng dụng mô hình ngôn ngữ lớn (LLM) có khả năng gọi công cụ (Tool Calling) để truy vấn dữ liệu dịch vụ và bác sĩ thực tế trong cơ sở dữ liệu. Mục tiêu duy nhất chưa hoàn thành trọn vẹn là tích hợp cổng thanh toán điện tử thật — hiện mới dừng ở mức mô phỏng giao diện quét mã QR, sẽ được hoàn thiện trong giai đoạn phát triển tiếp theo.

---

## 4.2. So sánh với các sản phẩm tương tự

Trên thị trường Việt Nam hiện có nhiều nhóm giải pháp phục vụ hoạt động khám chữa bệnh. Để đánh giá vị trí của VietSkin một cách khách quan, đề tài lựa chọn so sánh với ba nhóm sản phẩm tiêu biểu:

- **Nhóm 1 — Quản lý thủ công truyền thống:** mô hình ghi chép sổ sách giấy, lịch hẹn trên giấy/điện thoại, đang được đa số phòng khám tư nhân vừa và nhỏ sử dụng.
- **Nhóm 2 — Phần mềm quản lý phòng khám tổng quát (HIS thu nhỏ):** các sản phẩm như KiotViet Clinic, DrCloud, MediPro, Sasolution… cung cấp đầy đủ nghiệp vụ tiếp đón, viện phí, dược, báo cáo cho phòng khám đa khoa.
- **Nhóm 3 — Nền tảng đặt lịch khám trực tuyến:** các nền tảng như Medpro, YouMed, Docosan, BookingCare… tập trung mạnh vào khâu đặt lịch và kết nối bệnh nhân với cơ sở y tế.

### 4.2.1. So sánh về tính năng

| Tiêu chí tính năng | Thủ công (sổ sách) | PM phòng khám tổng quát | Nền tảng đặt lịch online | **VietSkin** |
|---|:---:|:---:|:---:|:---:|
| Đặt lịch khám trực tuyến | ✗ | Một phần | ✔ (thế mạnh) | ✔ |
| Tiếp đón & khám vãng lai (walk-in) | ✔ | ✔ | ✗ | ✔ |
| Tự liên kết lịch sử walk-in ↔ tài khoản | ✗ | Hiếm | ✗ | ✔ (Auto-Link) |
| Bệnh án điện tử **chuyên sâu da liễu** | ✗ | Tổng quát, không chuyên khoa | ✗ | ✔ (phân loại da, vị trí tổn thương, ảnh) |
| Kê đơn thuốc điện tử | ✗ | ✔ | ✗ | ✔ |
| Hàng đợi & thông báo thời gian thực | ✗ | Một phần | ✗ | ✔ (SSE) |
| Thống kê – báo cáo doanh thu (Excel/PDF) | Thủ công | ✔ | Hạn chế | ✔ |
| Trợ lý ảo AI tư vấn dịch vụ/bác sĩ | ✗ | Hiếm | Một phần (chatbot kịch bản) | ✔ (LLM + Tool Calling) |
| Thanh toán điện tử (cổng thật) | ✗ | ✔ | ✔ | Mô phỏng (chưa tích hợp thật) |
| Quản lý kho dược chuyên sâu (tồn kho, lô, HSD) | Thủ công | ✔ (thế mạnh) | ✗ | ✗ (chưa có) |
| Quản lý đa chi nhánh | ✗ | ✔ | ✔ | ✗ (đơn cơ sở) |

**Nhận xét:** Các phần mềm tổng quát nhóm 2 có độ phủ nghiệp vụ rộng (đặc biệt là kho dược và đa chi nhánh) nhưng được thiết kế cho phòng khám đa khoa nên **không có các trường dữ liệu chuyên sâu cho da liễu**. Các nền tảng nhóm 3 mạnh ở khâu đặt lịch nhưng gần như **không xử lý nghiệp vụ nội bộ** (khám, bệnh án, viện phí, hàng đợi). VietSkin định vị ở khoảng giữa: bao phủ trọn vẹn quy trình nội bộ của một phòng khám **đồng thời** chuyên biệt hóa sâu cho lĩnh vực da liễu — điều mà cả ba nhóm sản phẩm hiện có đều chưa đáp ứng đồng thời.

### 4.2.2. So sánh về hiệu năng

| Tiêu chí hiệu năng | PM phòng khám tổng quát | Nền tảng đặt lịch online | **VietSkin** |
|---|:---:|:---:|:---:|
| Kiến trúc | Phần lớn nguyên khối (monolith), nhiều bản desktop/on-premise | Web/Cloud quy mô lớn | Tách Front-End / Back-End (REST API) |
| Cập nhật trạng thái | Thường dùng tải lại trang / polling | Đẩy thông báo qua hạ tầng riêng | SSE — đẩy thời gian thực, không polling, nhẹ tải máy chủ |
| Tối ưu truy vấn | Tùy sản phẩm | Có cache phân tán | Redis cache giảm ~80% truy vấn xuống MySQL, độ trễ đọc < 10ms |
| Thời gian phản hồi API | Trung bình | Tốt (hạ tầng lớn) | < 200ms cho phần lớn API nghiệp vụ |
| Lưu trữ hình ảnh y khoa | Lưu trên server cục bộ | CDN | Cloudinary (CDN, tự nén tối ưu) |

**Nhận xét:** Xét trên quy mô một phòng khám đơn lẻ, VietSkin đạt hiệu năng tương đương hoặc tốt hơn nhờ kiến trúc tách lớp, bộ nhớ đệm Redis và cơ chế SSE thay cho polling. Tất nhiên, các nền tảng nhóm 3 có hạ tầng phục vụ hàng triệu người dùng nên xét về **quy mô chịu tải tổng thể** vẫn vượt trội — đây là sự khác biệt về phạm vi triển khai chứ không phải về chất lượng giải pháp kỹ thuật ở quy mô đề tài hướng tới.

### 4.2.3. So sánh về trải nghiệm người dùng (UX)

| Tiêu chí UX | Thủ công | PM phòng khám tổng quát | Nền tảng đặt lịch online | **VietSkin** |
|---|:---:|:---:|:---:|:---:|
| Giao diện hiện đại, responsive | ✗ | Trung bình (nhiều bản giao diện cũ) | Tốt | Tốt (React 19 + Tailwind 4) |
| Phân tách giao diện theo vai trò | ✗ | Một phần | ✗ | ✔ (Dashboard riêng 4 vai trò) |
| Giao diện khám tích hợp (bệnh án + đơn thuốc 1 màn hình) | ✗ | Hiếm (tách nhiều bước) | ✗ | ✔ |
| Phiên đăng nhập liền mạch (auto-refresh token) | — | Tùy sản phẩm | ✔ | ✔ |
| Hỗ trợ tư vấn tức thời bằng AI | ✗ | ✗ | Một phần | ✔ |
| Đường cong làm quen (learning curve) | Thấp nhưng dễ sai sót | Cao (nhiều chức năng, phức tạp) | Thấp | Thấp – Trung bình |

**Nhận xét:** Ưu thế UX của VietSkin nằm ở việc **may đo trải nghiệm theo đúng vai trò và đúng nghiệp vụ da liễu**: lễ tân có màn hình check-in và hàng đợi tối giản, bác sĩ có giao diện khám tích hợp cho phép vừa lập bệnh án vừa kê đơn trên một màn hình, bệnh nhân có wizard đặt lịch ba bước trực quan. Trong khi đó, phần mềm tổng quát thường có giao diện dày đặc chức năng gây khó làm quen, còn nền tảng đặt lịch lại không phục vụ tác nghiệp nội bộ.

---

## 4.3. Điểm mạnh và điểm yếu của hệ thống

### 4.3.1. Điểm mạnh

1. **Chuyên biệt hóa sâu cho da liễu:** Bệnh án điện tử tích hợp các trường dữ liệu đặc thù (phân loại da, vị trí tổn thương, ảnh tổn thương da lưu trên Cloudinary), điều mà các phần mềm quản lý phòng khám tổng quát không có. Đây là lợi thế cạnh tranh khác biệt cốt lõi của sản phẩm.

2. **Quy trình nghiệp vụ khép kín và liền mạch:** Hệ thống bao phủ trọn vẹn vòng đời một lượt khám cho cả hai luồng trực tuyến và vãng lai, với State Machine trạng thái lịch hẹn chặt chẽ và cơ chế Auto-Link thông minh tự đồng bộ lịch sử khám của bệnh nhân vãng lai.

3. **Kiến trúc hiện đại, hiệu năng cao:** Tách lớp Front-End/Back-End giúp dễ bảo trì và mở rộng; Redis cache giảm ~80% truy vấn xuống cơ sở dữ liệu; cơ chế Server-Sent Events đồng bộ thời gian thực mà không gây quá tải máy chủ như polling truyền thống.

4. **Bảo mật chặt chẽ:** Áp dụng Spring Security với JWT (Access/Refresh Token), băm mật khẩu BCrypt và phân quyền theo vai trò ở tầng Back-End, bảo vệ an toàn dữ liệu y bạ và tài chính nhạy cảm.

5. **Hỗ trợ ra quyết định và nghiệp vụ giấy tờ:** Hệ thống thống kê đa chiều (doanh thu, cơ cấu thanh toán, Top chẩn đoán bệnh lý) và xuất báo cáo Excel/PDF chuyên nghiệp phục vụ in ấn, lưu trữ pháp lý.

6. **Tích hợp Trí tuệ nhân tạo:** Trợ lý ảo Chatbot ứng dụng mô hình ngôn ngữ lớn kết hợp Tool Calling, có khả năng truy vấn dữ liệu dịch vụ và bác sĩ thật trong hệ thống để tư vấn cho bệnh nhân theo thời gian thực (streaming), là điểm nhấn vượt trội so với phạm vi một đồ án.

### 4.3.2. Điểm yếu

1. **Thanh toán điện tử mới ở mức mô phỏng:** Chức năng thanh toán qua mã QR hiện chỉ giả lập giao diện, chưa kết nối API/IPN thật của các cổng VNPay, MoMo, ZaloPay để tự động hóa và đối soát luồng tiền.

2. **Chưa quản lý kho dược chuyên sâu:** Phân hệ thuốc mới dừng ở quản lý danh mục để kê đơn, chưa có quản lý tồn kho thực tế, số lô, hạn sử dụng hay tự động trừ kho khi cấp phát — đây là điểm các phần mềm tổng quát làm tốt hơn.

3. **Chỉ hỗ trợ phòng khám đơn cơ sở:** Cấu trúc cơ sở dữ liệu hiện tối ưu cho một phòng khám đơn lẻ, chưa phân tách dữ liệu để vận hành chuỗi phòng khám đa chi nhánh.

4. **Thiếu kênh truyền thông tự động:** Chưa tích hợp SMS/Zalo ZNS/Email để gửi xác nhận lịch hẹn, mã OTP hay nhắc lịch tái khám tự động.

5. **Chưa có ứng dụng di động riêng:** Hệ thống mới triển khai trên nền web responsive, chưa có ứng dụng di động native/lai với thông báo đẩy (push notification) dành cho bệnh nhân.

6. **Phạm vi kiểm thử và quy mô chịu tải:** Hệ thống được kiểm thử chủ yếu bằng phương pháp hộp đen trên các luồng nghiệp vụ trọng yếu ở quy mô một phòng khám, chưa thực hiện kiểm thử hiệu năng/chịu tải (load testing) ở quy mô lớn như các nền tảng thương mại.

### 4.3.3. Kết luận đánh giá

So với các giải pháp hiện có, VietSkin chưa thể cạnh tranh về độ phủ nghiệp vụ tổng quát (kho dược, đa chi nhánh) hay quy mô hạ tầng so với các sản phẩm thương mại lớn. Tuy nhiên, xét đúng phạm vi mục tiêu — một hệ thống quản lý **chuyên biệt cho phòng khám da liễu vừa và nhỏ** — sản phẩm đã đạt được sự **cân bằng tốt giữa độ chuyên sâu nghiệp vụ, hiệu năng kỹ thuật và trải nghiệm người dùng**, đồng thời sở hữu các điểm khác biệt (chuyên khoa hóa da liễu, Auto-Link, đồng bộ thời gian thực bằng SSE, trợ lý ảo AI) mà các nhóm sản phẩm so sánh chưa đồng thời đáp ứng. Các điểm yếu còn lại đều mang tính mở rộng và đã có lộ trình khắc phục rõ ràng trong phần hướng phát triển, hoàn toàn khả thi để đưa sản phẩm tiến gần hơn tới khả năng triển khai thực tế.
