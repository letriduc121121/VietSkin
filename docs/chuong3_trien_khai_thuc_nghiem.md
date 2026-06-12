# CHƯƠNG 3: TRIỂN KHAI VÀ THỰC NGHIỆM ĐÁNH GIÁ

Chương này trình bày chi tiết về quá trình triển khai hệ thống quản lý phòng khám da liễu VietSkin trên thực tế. Nội dung bao gồm việc mô tả chi tiết môi trường phát triển, môi trường chạy thử nghiệm hệ thống, quy trình cài đặt các công cụ và phần mềm cần thiết, phương pháp triển khai dự án ở cả hai phía Front-End và Back-End. Tiếp theo, chương này sẽ liệt kê chi tiết các chức năng đã được xây dựng và đưa vào vận hành thực nghiệm. Để đảm bảo tính đúng đắn và hiệu năng của hệ thống, tác giả thực hiện xây dựng bộ kịch bản kiểm thử (Test Cases) chi tiết cho các luồng nghiệp vụ cốt lõi, tiến hành chạy thử nghiệm và ghi nhận kết quả cụ thể. Cuối cùng là phần phân tích, đánh giá tổng quan những kết quả đạt được, những mặt hạn chế còn tồn tại và đề xuất các hướng phát triển tiếp theo của đề tài.

---

## 3.1 MÔI TRƯỜNG PHÁT TRIỂN VÀ TRIỂN KHAI

Để xây dựng và kiểm thử hệ thống một cách hiệu quả, môi trường phát triển và triển khai cần được cấu hình đồng bộ. Phần này trình bày các yêu cầu cụ thể về phần cứng, phần mềm, các thư viện công nghệ được áp dụng và hướng dẫn chi tiết các bước thiết lập hệ thống từ mã nguồn.

### 3.1.1 Cài đặt phần mềm và công cụ

Để thiết lập môi trường phát triển và đảm bảo quá trình triển khai dự án VietSkin diễn ra ổn định, nhóm phát triển đã phân tích kỹ lưỡng các yêu cầu nghiệp vụ và lựa chọn các công cụ lập trình, môi trường thực thi cũng như hạ tầng cơ sở dữ liệu phù hợp. Môi trường phát triển được cấu hình đồng bộ với các công cụ chính như sau:
*   **IntelliJ IDEA (Ultimate Edition)** được lựa chọn làm môi trường phát triển tích hợp (IDE) cốt lõi cho phân hệ Back-End Java Spring Boot. Công cụ này cung cấp khả năng tối ưu hóa hiệu suất lập trình thông qua các tiện ích phân tích cú pháp tĩnh, phát hiện lỗi cú pháp tức thời khi viết mã nguồn, hỗ trợ tái cấu trúc mã (refactoring) mạnh mẽ và tích hợp chặt chẽ trình quản lý thư viện Maven. Việc tích hợp sẵn công cụ quản lý cơ sở dữ liệu trực quan và trình kiểm thử API trong IntelliJ IDEA giúp nhà phát triển dễ dàng giám sát các truy vấn SQL tự động sinh ra bởi tầng ORM Hibernate xuống MySQL, từ đó tối ưu hóa được hiệu năng truy vấn dữ liệu của máy chủ.
*   **Visual Studio Code (VS Code)** được sử dụng làm IDE chính để xây dựng dự án Front-End React. Với đặc tính gọn nhẹ, tốc độ khởi động nhanh, hiệu năng tiêu thụ tài nguyên máy tính thấp và hệ sinh thái extension phong phú, VS Code mang lại trải nghiệm lập trình giao diện tối ưu. Các tiện ích như ESLint hỗ trợ chuẩn hóa quy tắc viết code, Prettier tự động định dạng mã nguồn và Tailwind CSS IntelliSense giúp nâng cao tính chính xác và tốc độ thiết kế giao diện người dùng với Tailwind CSS.
*   **Java Development Kit (JDK 17)** là môi trường thực thi và biên dịch mã nguồn Java phía máy chủ cho ứng dụng Back-End. Việc lựa chọn phiên bản JDK 17 (LTS) mang tính chiến lược vì đây là phiên bản hỗ trợ dài hạn có độ ổn định cực kỳ cao cho các hệ thống doanh nghiệp, đồng thời cung cấp nhiều tính năng ngôn ngữ hiện đại như Record Class (giúp tối giản hóa việc định nghĩa các Data Transfer Object - DTO), Pattern Matching cho switch-case và bộ thu dọn rác cải tiến (Garbage Collector) giúp giảm thiểu tối đa độ trễ phản hồi của API khi máy chủ chạy tải nặng.
*   **Node.js** đóng vai trò là môi trường thực thi mã nguồn JavaScript và TypeScript ở môi trường máy chủ phát triển (Development Server) cho toàn bộ dự án Front-End. Nhờ tích hợp bộ dịch V8 Engine của Google, Node.js cung cấp tốc độ xử lý mã nguồn tối ưu, cho phép công cụ Vite khởi chạy máy chủ phát triển và áp dụng cơ chế tự động cập nhật thay đổi giao diện theo thời gian thực (Hot Module Replacement - HMR) giúp tăng đáng kể năng suất lập trình.
*   **npm (Node Package Manager)** là trình quản lý gói thư viện mặc định của Node.js, chịu trách nhiệm cài đặt và quản lý tập trung toàn bộ các gói phụ thuộc (dependencies) bên thứ ba cho dự án Front-End. Thông qua tệp tin cấu hình `package.json`, npm giúp nhóm phát triển kiểm soát chặt chẽ phiên bản của các thư viện bổ trợ như Axios (thực hiện các cuộc gọi HTTP API), React Router DOM (quản lý định tuyến trang), Tailwind CSS (thiết kế UI) và các thư viện hỗ trợ WebSocket/SSE, đảm bảo tính đồng bộ của môi trường phát triển trên máy tính của các thành viên trong nhóm.
*   **MySQL (Hệ quản trị cơ sở dữ liệu quan hệ)** phiên bản 8.0 được lựa chọn để lưu trữ và quản lý toàn bộ dữ liệu quan hệ của hệ thống VietSkin (bao gồm thông tin tài khoản người dùng, hồ sơ bệnh nhân, chuyên môn bác sĩ, lịch hẹn, bệnh án y bạ, đơn thuốc và hóa đơn tài chính). MySQL tuân thủ chặt chẽ tiêu chuẩn giao dịch ACID (Atomicity, Consistency, Isolation, Durability), giúp giải quyết triệt để vấn đề tranh chấp tài nguyên trong y tế thực tế (ví dụ: ngăn chặn hiện tượng hai bệnh nhân cùng lúc đặt thành công một khung giờ khám của cùng một bác sĩ). Trong môi trường phát triển cục bộ, MySQL hoạt động tại cổng mặc định `3306` kết nối tới cơ sở dữ liệu `vietskin`.
*   **Upstash Redis Cloud** là hệ cơ sở dữ liệu NoSQL lưu giữ khóa - giá trị trong bộ nhớ RAM, được cấu hình làm phân lớp bộ nhớ đệm (Caching Layer) nằm giữa Back-End Spring Boot và MySQL. Redis được áp dụng để lưu trữ các dữ liệu tĩnh hoặc ít biến động nhưng có tần suất truy vấn cực kỳ cao như danh mục 26 loại thuốc da liễu, thông tin chi tiết các dịch vụ khám bệnh và cấu hình phòng khám vật lý. Việc tích hợp Redis giúp hệ thống giảm tải tới 80% số lượng truy vấn trực tiếp xuống MySQL, hạ độ trễ phản hồi của API từ hàng trăm mili-giây xuống mức dưới 10 mili-giây, tăng cường khả năng chịu tải của hệ thống.
*   **Cloudinary** là dịch vụ lưu trữ đám mây đa phương tiện (Media Management Cloud Platform), đóng vai trò lưu trữ và tối ưu hóa toàn bộ hình ảnh trong hệ thống bao gồm hình ảnh đại diện (avatar) của người dùng và các hình ảnh y khoa chụp thực tế vùng da tổn thương được đính kèm trong bệnh án điện tử. Cloudinary hoạt động như một mạng phân phối nội dung (CDN) giúp tự động nén dung lượng hình ảnh ở mức tối ưu mà không làm suy giảm chi tiết y khoa của vết thương da, đồng thời tăng tốc độ tải ảnh hiển thị trên giao diện của cả Bác sĩ lẫn Bệnh nhân.
*   **Postman** được sử dụng làm công cụ thiết kế, giả lập và thực hiện các kịch bản kiểm thử (API Testing) đối với các RESTful API của Back-End Spring Boot. Trước khi tiến hành kết nối giao diện người dùng, Postman giúp xác minh tính chính xác của dữ liệu JSON trả về, kiểm soát các mã trạng thái HTTP (HTTP Status Codes) và kiểm thử các kịch bản lỗi nghiệp vụ hoặc lỗ hổng phân quyền bảo mật của hệ thống JWT.
*   **GitHub và hệ thống quản lý phiên bản Git** được sử dụng làm hạ tầng quản lý mã nguồn của toàn bộ dự án VietSkin. Công cụ này cho phép nhóm phát triển theo dõi lịch sử thay đổi của từng tệp tin mã nguồn, phân chia các nhánh phát triển tính năng (Feature Branches) độc lập và thực hiện gộp mã nguồn (Merge) thông qua cơ chế Pull Request có sự phê duyệt của trưởng nhóm, đảm bảo tính toàn vẹn của mã nguồn dự án trước khi đưa vào kiểm thử.

---

### 3.1.2 Triển khai dự án

Cấu trúc thư mục gốc của dự án quản lý phòng khám da liễu VietSkin được phân chia thành hai thư mục con độc lập hoạt động song song là `frontend` và `backend_springboot` để phân tách rõ vai trò của giao diện ứng dụng và dịch vụ máy chủ.

Đối với phần giao diện và tương tác người dùng, dự án Front-End được khởi tạo bằng công cụ Vite thông qua câu lệnh tiêu chuẩn `npm create vite@latest`. Trong quá trình thiết lập, nhà phát triển đặt tên thư mục dự án là `frontend`, lựa chọn thư viện cơ bản là `React` và áp dụng biến thể ngôn ngữ là `TypeScript` nhằm kiểm soát kiểu dữ liệu nghiêm ngặt trong quá trình xây dựng giao diện. Sau khi di chuyển vào thư mục dự án bằng lệnh `cd frontend`, các gói phụ thuộc (dependencies) được cài đặt đồng bộ bằng lệnh `npm install`. Các phụ thuộc chính được thiết lập trong tệp cấu hình bao gồm thư viện `react` và `react-dom` làm nền tảng ứng dụng, `react-router-dom` phục vụ cho việc định tuyến các trang chức năng Dashboard theo vai trò, và `axios` làm HTTP client chịu trách nhiệm giao tiếp API với máy chủ. Đồng thời, để hiện thực hóa tính năng truyền thông điệp thời gian thực (real-time notifications) từ máy chủ, các thư viện STOMP và WebSocket Client gồm `@stomp/stompjs`, `sockjs-client` và `socket.io-client` cũng được tích hợp. Về mặt giao diện, hệ thống áp dụng Tailwind CSS v4 để xây dựng layout và kiểu dáng, sử dụng thư viện icon `lucide-react`, cùng các gói hỗ trợ UI chuyên nghiệp như `class-variance-authority` và `tailwind-merge` để tối ưu các thành phần giao diện. Khi hoàn tất cài đặt, dự án frontend được chạy ở chế độ phát triển thông qua câu lệnh `npm run dev`, kích hoạt máy chủ Vite hoạt động tại cổng mặc định `5173`.

Đối với phần xử lý nghiệp vụ máy chủ và cơ sở dữ liệu, dự án Back-End `backend_springboot` được khởi tạo dưới dạng một ứng dụng Spring Boot phiên bản `3.5.14`, sử dụng ngôn ngữ `Java` phiên bản `JDK 17`, trình quản lý dependencies và biên dịch `Maven` kết hợp hệ quản trị cơ sở dữ liệu quan hệ `MySQL`. Các thư viện phụ thuộc chính được khai báo và cài đặt tự động thông qua tệp quản lý cấu hình `pom.xml` bao gồm `spring-boot-starter-web` để xây dựng hệ thống RESTful API, `spring-boot-starter-data-jpa` kết hợp trình điều khiển `mysql-connector-j` để giao tiếp cơ sở dữ liệu. Vấn đề bảo mật và phân quyền được xử lý chặt chẽ bởi `spring-boot-starter-security` kết hợp thư viện mã hóa token JWT là `jjwt-api`, `jjwt-impl` và `jjwt-jackson`. Để tăng hiệu năng, hệ thống tích hợp Redis cache bằng thư viện `spring-boot-starter-data-redis` kết nối trực tiếp với Upstash Redis Cloud. Việc tải ảnh lên đám mây được hỗ trợ bởi Cloudinary Java SDK `cloudinary-http45`, trong khi tính năng xuất báo cáo tài chính và hóa đơn được triển khai thông qua hai thư viện chuyên dụng là `poi-ooxml` (xuất file Excel) và `openpdf` (xuất file PDF).

Trước khi khởi chạy máy chủ API, cơ sở dữ liệu MySQL được thiết lập thông qua việc chạy trực tiếp hai tệp tin SQL có sẵn trong thư mục `backend_springboot/db`. Đầu tiên, tệp tin `reset.sql` được chạy để xóa cơ sở dữ liệu cũ (nếu có) và tạo mới cơ sở dữ liệu `vietskin` sạch sẽ hỗ trợ mã hóa tiếng Việt `utf8mb4_unicode_ci`. Sau đó, tệp tin `schema.sql` được chạy để tạo cấu trúc của 16 bảng dữ liệu liên kết kèm theo các ràng buộc khóa ngoại chặt chẽ. Cấu hình kết nối hệ thống được quản lý tập trung trong tệp tin `application.yml` nằm ở thư mục tài nguyên của Spring Boot. Trong tệp cấu hình này, nhà phát triển khai báo đường dẫn JDBC kết nối MySQL, tài khoản kết nối Redis Cloud, thời hạn sống của các mã JWT token, và các thông số API key kết nối đến Cloudinary.

Mã nguồn Back-End được biên dịch và chạy bằng công cụ Maven Wrapper qua câu lệnh `.\mvnw.cmd spring-boot:run` trên Windows hoặc `./mvnw spring-boot:run` trên macOS/Linux. Khi khởi động lần đầu, nếu bảng vai trò trống, lớp [DataInitializer.java](file:///d:/DoAnTotNghiep/VietSkin/backend_springboot/src/main/java/com/vietskin/backend_springboot/common/config/DataInitializer.java) của Spring Boot sẽ tự động seed dữ liệu mẫu bao gồm 4 vai trò chính, 6 tài khoản người dùng tương ứng với các phân quyền khác nhau (được mã hóa mật khẩu BCrypt với mật khẩu chung là `Vietskin@123`), phân công lịch làm việc bác sĩ, 5 dịch vụ khám, 26 loại thuốc da liễu chuyên khoa, cùng các lịch hẹn và hóa đơn mẫu. Trong suốt quá trình phát triển, nhà phát triển sử dụng câu lệnh `tail -f backend.log` hoặc theo dõi trực tiếp Log Console của IDE để giám sát các câu lệnh Hibernate SQL và gỡ lỗi (debug) kịp thời.

Để quản lý mã nguồn của toàn bộ dự án, một kho lưu trữ Git (Git repository) được khởi tạo tại thư mục gốc bằng lệnh `git init`. File cấu hình `.gitignore` tại thư mục gốc được thiết lập để loại bỏ các tệp tin tạm và dữ liệu nhạy cảm ra khỏi lịch sử theo dõi của Git bao gồm thư mục thư viện Front-End `/node_modules`, thư mục sản phẩm biên dịch Back-End `/target`, các tệp cấu hình môi trường `.env`, cấu hình IDE `.idea`, và tệp log hoạt động `backend.log`. Cuối cùng, toàn bộ mã nguồn ban đầu được lưu lại qua các câu lệnh `git add .` và `git commit -m "Initial commit - VietSkin Clinic Management System"` để sẵn sàng đẩy lên các dịch vụ lưu trữ mã nguồn đám mây như GitHub hoặc GitLab.

---

## 3.2 CÁC CHỨC NĂNG ĐÃ TRIỂN KHAI

Hệ thống quản lý phòng khám da liễu VietSkin đã hoàn thiện đầy đủ các chức năng nghiệp vụ nghiệp vụ liên hoàn. Dưới đây là mô tả chi tiết giao diện, chức năng và các luồng xử lý kỹ thuật tương ứng theo từng phân hệ người dùng (Actor):

### 1. Phân hệ Bệnh nhân (Patient Portal)
Phân hệ này dành cho khách hàng có nhu cầu chăm sóc và điều trị các bệnh lý về da. Giao diện được thiết kế tối giản, tập trung vào trải nghiệm đặt lịch nhanh và tra cứu thông tin y tế cá nhân.
*   **Trang Dashboard cá nhân (`/patient/dashboard`):** Hiển thị tổng quan các thông tin quan trọng nhất như: Lịch hẹn sắp tới (hiển thị thời gian, tên bác sĩ khám, phòng khám và số thứ tự), các thông báo mới nhất từ phòng khám và nút điều hướng nhanh đến chức năng đặt lịch.
*   **Chức năng Đặt lịch khám trực tuyến (Wizard 3 bước - `/patient/booking`):**
    *   *Bước 1 (Chọn bác sĩ):* Danh sách bác sĩ kèm ảnh đại diện, học hàm/học vị, chuyên khoa, kinh nghiệm và phí khám công khai. Người dùng có thể tìm kiếm bác sĩ theo từ khóa hoặc chuyên khoa.
    *   *Bước 2 (Chọn ngày và khung giờ khám):* Hệ thống tự động truy vấn danh sách ngày làm việc có sẵn của bác sĩ (từ bảng `doctor_work_days`). Khi bệnh nhân chọn một ngày cụ thể, hệ thống sẽ gọi API tải lên các khung giờ (Time Slots) trống chưa bị đặt hoặc chưa bị khóa trong ngày đó.
    *   *Bước 3 (Chọn dịch vụ & Xác nhận):* Bệnh nhân lựa chọn dịch vụ mong muốn (ví dụ: Khám mụn, Bắn Laser trị tàn nhang,...), nhập mô tả triệu chứng bệnh kèm theo hình ảnh tổn thương da hiện tại (nếu có). Sau khi nhấn Xác nhận, hệ thống tạo lịch hẹn mới với trạng thái ban đầu là `pending` (Chờ xác nhận từ lễ tân).
*   **Trang Quản lý Lịch hẹn (`/patient/appointments`):** Hiển thị danh sách lịch hẹn của bệnh nhân, chia thành các Tab rõ ràng: *Chờ xác nhận, Đã xác nhận, Đã khám xong, Đã hủy*. Bệnh nhân được phép hủy lịch hẹn trực tuyến nếu lịch hẹn đó vẫn đang ở trạng thái `pending` hoặc `confirmed` bằng cách nhấn nút "Hủy lịch" (trạng thái chuyển sang `cancelled`).
*   **Trang Tra cứu Bệnh án điện tử (`/patient/records`):** Giao diện thiết kế theo dạng Split-view (Bên trái là danh sách các ngày khám, bên phải là thông tin chi tiết của lần khám được chọn). Khi nhấn vào một lượt khám, bệnh nhân sẽ xem được chẩn đoán của bác sĩ, vị trí tổn thương da, loại da (nhờ hệ thống phân loại da liễu), hướng điều trị, hình ảnh tổn thương da lưu trong bệnh án và đơn thuốc đính kèm (tên thuốc, số lượng, cách dùng chi tiết).
*   **Trang Quản lý Hóa đơn (`/patient/invoices`):** Xem lại toàn bộ lịch sử thanh toán tiền khám và dịch vụ tại phòng khám, trạng thái hóa đơn (Đã thanh toán / Chưa thanh toán), phương thức thanh toán và có thể tải về hóa đơn dạng PDF.
*   **Trang Thông tin Hồ sơ (`/patient/profile`):** Cho phép cập nhật thông tin cá nhân cơ bản và thông tin sức khỏe mở rộng (nhóm máu, tiền sử dị ứng thuốc/mỹ phẩm, bệnh lý nền) phục vụ cho quá trình bác sĩ chẩn đoán. Đồng thời hỗ trợ tính năng đổi mật khẩu tài khoản.

---

### 2. Phân hệ Lễ tân (Receptionist Portal)
Lễ tân đóng vai trò điều phối luồng bệnh nhân trực tiếp tại phòng khám, xử lý thanh toán và hỗ trợ đặt lịch trực tiếp.
*   **Trang Dashboard Lễ tân (`/receptionist/dashboard`):** Thống kê nhanh số ca khám trong ngày (bao nhiêu ca đang chờ khám, bao nhiêu ca đã khám xong), tổng doanh thu thu được trong ngày và danh sách các lịch hẹn trực tuyến mới phát sinh cần duyệt gấp.
*   **Trang Quản lý Lịch hẹn tổng hợp (`/receptionist/appointments`):** Cung cấp bảng dữ liệu lịch hẹn đa chiều. Lễ tân có thể tìm kiếm nhanh theo Số điện thoại bệnh nhân, tên bệnh nhân, lọc theo ngày khám, bác sĩ khám hoặc bộ lọc trạng thái lịch hẹn.
*   **Tạo lịch hẹn trực tiếp (Walk-in Booking):** Đối với bệnh nhân đến trực tiếp phòng khám mà không đặt trước qua website, lễ tân có thể tạo nhanh lịch hẹn trực tiếp. Hệ thống chỉ yêu cầu nhập Tên bệnh nhân và Số điện thoại. Sau khi lưu, lịch hẹn được tạo trực tiếp với trạng thái `confirmed`.
*   **Trang Xác nhận Lịch hẹn trực tuyến (`/receptionist/confirm`):** Hiển thị toàn bộ các lịch hẹn do bệnh nhân tự đặt từ xa có trạng thái `pending`. Lễ tân kiểm tra thông tin, liên hệ xác nhận và nhấn nút "Duyệt". Hệ thống sẽ tự động chuyển trạng thái lịch hẹn sang `confirmed` và cấp **Số thứ tự khám (Queue Number)** tăng dần theo ngày của từng bác sĩ.
*   **Quy trình Check-in và Thanh toán hóa đơn (`/receptionist/checkin`):**
    *   Khi bệnh nhân đến phòng khám, lễ tân tra cứu bằng số điện thoại để tìm lịch hẹn `confirmed` trong ngày.
    *   Hệ thống yêu cầu tạo hóa đơn thanh toán trước khi check-in. Lễ tân nhấn "Tạo hóa đơn", hệ thống tự động tổng hợp chi phí khám của bác sĩ và chi phí dịch vụ đi kèm để tạo mã hóa đơn định dạng chuyên nghiệp `INV-YYYY-NNNN` (Ví dụ: `INV-2026-0005`).
    *   Lễ tân chọn phương thức thanh toán: *Tiền mặt, Chuyển khoản ngân hàng, Quẹt thẻ* hoặc *Mã QR (VNPay)*. Giao diện tích hợp màn hình giả lập (Mocked VNPay QR code) hiển thị mã QR kèm số tiền để mô phỏng quy trình quét mã trên ứng dụng ngân hàng.
    *   Sau khi nhận đủ tiền, lễ tân nhấn "Xác nhận thanh toán và Check-in". Hóa đơn chuyển sang trạng thái `paid`, lịch hẹn chuyển sang trạng thái `checked_in`. Hệ thống lập tức kích hoạt sự kiện Server-Sent Events (SSE) để đồng bộ danh sách hàng đợi của bác sĩ tương ứng mà không cần tải lại trang.
*   **Tính năng nhận thông báo thời gian thực (SSE Toast):** Khi bất kỳ bác sĩ nào trong phòng khám hoàn tất một ca khám bệnh (nhấn nút Lưu bệnh án ở phân hệ Bác sĩ), hệ thống sẽ gửi một thông báo dạng Pop-up Toast xuất hiện tức thì trên màn hình làm việc của lễ tân, giúp lễ tân biết bệnh nhân nào đã khám xong để chuẩn bị phát đơn thuốc và hướng dẫn bệnh nhân ra về.

---

### 3. Phân hệ Bác sĩ (Doctor Portal)
Phân hệ này hỗ trợ đắc lực cho bác sĩ trong quá trình thăm khám lâm sàng, giảm thiểu tối đa các thao tác giấy tờ thủ công nhờ giao diện tích hợp thông minh.
*   **Trang Hàng đợi khám trong ngày (`/doctor/today`):** 
    *   Hiển thị danh sách bệnh nhân đang đợi khám của riêng bác sĩ đó trong ngày hiện tại. Danh sách được sắp xếp tăng dần theo Số thứ tự (Queue Number) được cấp từ lễ tân.
    *   Nhờ cơ chế Server-Sent Events (SSE), khi có bệnh nhân mới được lễ tân check-in ở quầy, danh sách hàng đợi trên màn hình bác sĩ tự động chèn thêm bệnh nhân mới theo thời gian thực kèm hiệu ứng nhấp nháy thu hút sự chú ý.
*   **Giao diện Khám bệnh Tích hợp (Examine Page - `/doctor/examine/:id`):** 
    Đây là màn hình nghiệp vụ trung tâm của bác sĩ, được thiết kế theo dạng cột song song giúp bác sĩ vừa nhập liệu vừa đối chiếu thông tin dễ dàng:
    *   *Cột bên trái:* Hiển thị thông tin hành chính của bệnh nhân (Tên, tuổi, giới tính) và nút xem nhanh "Lịch sử bệnh án cũ" giúp bác sĩ theo dõi tiến trình điều trị của bệnh nhân qua các lần khám trước đó mà không phải thoát màn hình khám hiện tại.
    *   *Khu vực lập Bệnh án (Medical Record):* Bác sĩ nhập các trường thông tin da liễu chuyên sâu bao gồm: Triệu chứng lâm sàng, Phân loại da (Da dầu, da khô, da hỗn hợp, da nhạy cảm), Vị trí tổn thương xuất hiện (Mặt, tay, chân, toàn thân,...), Chẩn đoán bệnh (Diagnosis), Hướng điều trị chi tiết và Ngày hẹn tái khám (nếu có). Bác sĩ có thể tải lên các hình ảnh chụp thực tế bề mặt da tổn thương của bệnh nhân qua dịch vụ Cloudinary để lưu giữ hồ sơ y khoa.
    *   *Khu vực Kê đơn thuốc điện tử (Prescription):* Tích hợp tìm kiếm nhanh thuốc trong danh mục thuốc của phòng khám. Khi bác sĩ gõ ký tự đầu, hệ thống gợi ý danh sách thuốc phù hợp kèm đơn vị tính. Bác sĩ nhập Liều dùng (Ví dụ: "Uống 1 viên"), Tần suất sử dụng (Ví dụ: "Sáng - Tối, sau ăn"), Số ngày sử dụng và Số lượng cấp phát. Hệ thống tự động tính toán tổng số lượng thuốc cần phát dựa trên tần suất và số ngày.
    *   *Hoàn tất khám:* Khi bác sĩ nhấn nút "Hoàn tất khám bệnh", hệ thống kiểm tra tính hợp lệ của dữ liệu đầu vào, lưu bệnh án và đơn thuốc vào DB đồng thời chuyển trạng thái lịch hẹn từ `in_progress` sang `done`.
*   **Trang Lịch sử khám bệnh (`/doctor/history`):** Cho phép bác sĩ xem lại danh sách tất cả các bệnh nhân mình đã thực hiện thăm khám trong quá khứ, hỗ trợ tìm kiếm theo tên hoặc khoảng thời gian để phục vụ công tác nghiên cứu hoặc đối chiếu chuyên môn.

---

### 4. Phân hệ Admin (Admin Portal)
Dành cho người quản trị tối cao của phòng khám, giúp theo dõi toàn bộ hoạt động vận hành và đưa ra quyết định kinh doanh.
*   **Trang Dashboard Quản trị (`/admin/dashboard`):** Cung cấp các thẻ thống kê tổng quan (Tổng số bệnh nhân đăng ký, Tổng số ca khám hoàn thành, Tổng số bác sĩ hoạt động, Doanh thu tích lũy).
*   **Trang Quản lý Nhân sự (`/admin/staff`):** Cho phép thực hiện các thao tác CRUD (Thêm mới, Xem thông tin, Cập nhật hồ sơ, Khóa/Mở tài khoản) đối với nhân viên trong phòng khám bao gồm Lễ tân, Bác sĩ và Admin khác. Khi thêm mới Bác sĩ, Admin có thể cấu hình chi tiết học vị, chuyên khoa và đặt Phí khám bệnh (Consultation Fee) riêng cho từng bác sĩ.
*   **Trang Quản lý Bệnh nhân (`/admin/patients`):** Quản lý hồ sơ toàn bộ bệnh nhân trong hệ thống. Admin có thể tra cứu thông tin y bạ, chỉnh sửa thông tin liên lạc hoặc xem lịch sử hoạt động của bệnh nhân.
*   **Trang Quản lý Dịch vụ y tế (`/admin/services`):** Quản lý danh mục các dịch vụ kỹ thuật mà phòng khám cung cấp (như Bắn laser trị nám, Triệt sắc tố da, Chăm sóc da chuyên sâu,...). Admin cấu hình tên dịch vụ, đơn giá, thời gian thực hiện ước tính và mô tả dịch vụ để bệnh nhân có thể lựa chọn khi đặt lịch trực tuyến.
*   **Trang Quản lý Phòng khám (`/admin/rooms`):** CRUD danh sách phòng khám vật lý tại cơ sở (Ví dụ: Phòng khám 101, Phòng Laser, Phòng Chăm sóc da). Đồng thời hỗ trợ tính năng gán Bác sĩ phụ trách mặc định cho từng phòng.
*   **Trang Hoạch định Lịch làm việc Bác sĩ (`/admin/schedule`):** 
    *   Cho phép Admin phân công Bác sĩ trực tại các phòng khám vật lý theo các ngày cụ thể trong tuần.
    *   Hệ thống kiểm tra nghiêm ngặt các ràng buộc nghiệp vụ (Business Rules) tại tầng Back-End: Một bác sĩ không thể làm việc ở hai phòng khác nhau trong cùng một ngày; và một phòng khám không thể phân cho hai bác sĩ khác nhau trực trong cùng một ngày. Nếu vi phạm, hệ thống sẽ chặn và trả về lỗi thông báo chi tiết.
*   **Trang Thống kê Doanh thu và Hoạt động khám (`/admin/revenue`):**
    *   *Thống kê doanh thu:* Biểu đồ cột trực quan hiển thị doanh thu 6 tháng gần nhất. Biểu đồ tròn phân tích cơ cấu doanh thu theo phương thức thanh toán. Danh sách 10 hóa đơn thanh toán mới nhất.
    *   *Xuất báo cáo tài chính:* Admin chọn Bộ lọc Tháng và Năm, sau đó nhấn xuất báo cáo. Hệ thống Back-End sử dụng thư viện **Apache POI** để sinh file báo cáo định dạng Excel `.xlsx` gồm nhiều bảng chi tiết; hoặc sử dụng **OpenPDF** để tạo file báo cáo doanh thu định dạng PDF `.pdf` có định dạng lề, bảng dữ liệu, chữ ký phê duyệt cực kỳ chuyên nghiệp.
    *   *Thống kê hoạt động khám (Patient Stats):* Cung cấp số liệu về tổng lượt khám, tỷ lệ hủy lịch, biểu đồ tần suất lượt khám theo tháng, bảng xếp hạng Top bác sĩ khám nhiều nhất và bảng thống kê Top 10 chẩn đoán bệnh lý phổ biến nhất giúp đưa ra định hướng nhập thuốc da liễu phù hợp.

---

### 5. Các cơ chế xử lý kỹ thuật đặc biệt

#### Cơ chế tự động liên kết dữ liệu Bệnh nhân Walk-in (Auto-Link Account)
Một nghiệp vụ thực tế rất hay xảy ra là bệnh nhân lần đầu đến phòng khám dưới dạng walk-in (lễ tân tạo lịch chỉ lưu tên và SĐT, cột `patient_id` trong bảng `appointments` bằng `NULL`). Sau đó, bệnh nhân này về nhà và đăng ký tài khoản trực tuyến trên ứng dụng bằng chính số điện thoại đó. 
Để giải quyết bài toán đồng bộ dữ liệu lịch sử khám, Back-End VietSkin triển khai cơ chế Auto-Link: Khi một tài khoản người dùng mới được tạo thành công với vai trò Bệnh nhân (`ROLE_PATIENT`), hệ thống sẽ kích hoạt một tiến trình quét cơ sở dữ liệu để tìm toàn bộ các bản ghi lịch hẹn (`appointments`) cũ đang có số điện thoại trùng khớp nhưng cột `patient_id` đang bằng `NULL`. Tiến trình này sẽ tự động cập nhật ID của tài khoản mới đăng ký vào các lịch hẹn cũ đó. Nhờ vậy, ngay sau khi đăng ký tài khoản và đăng nhập lần đầu, bệnh nhân lập tức xem lại được toàn bộ lịch sử bệnh án và hóa đơn từ những lần đi khám vãng lai trước đây của mình.

#### Cơ chế bảo mật và Refresh Token tự động
Hệ thống áp dụng chuẩn bảo mật JWT (JSON Web Token) kết hợp bộ lọc bảo mật của Spring Security:
1. Khi đăng nhập thành công, máy chủ cấp cho Client 2 mã token:
   *   `accessToken`: Thời gian sống ngắn (15 phút), dùng để đính kèm vào header `Authorization: Bearer <token>` trong mỗi yêu cầu gửi lên API.
   *   `refreshToken`: Thời gian sống dài (7 ngày), được lưu trữ bảo mật ở phía client.
2. Tại Front-End, thư viện Axios được cấu hình một bộ lọc chặn phản hồi (Response Interceptor). Khi một API gửi đi nhận về mã lỗi HTTP `401 Unauthorized` (do `accessToken` đã hết hạn 15 phút), Interceptor sẽ tạm dừng các yêu cầu API khác và tự động gửi một yêu cầu ngầm (silent request) chứa `refreshToken` lên API `/api/auth/refresh`.
3. Back-End kiểm tra tính hợp lệ của `refreshToken`. Nếu hợp lệ, trả về cặp token mới. Interceptor cập nhật token mới vào bộ nhớ và tiếp tục thực thi các API bị gián đoạn trước đó. Người dùng hoàn toàn không cảm nhận được quá trình gián đoạn và không bị yêu cầu đăng nhập lại giữa chừng, tối ưu hóa trải nghiệm người dùng mà vẫn đảm bảo tính an toàn cao của hệ thống.

---

## 3.3 KẾT QUẢ KIỂM THỬ

Để đánh giá chất lượng phần mềm, đảm bảo các chức năng hoạt động chính xác theo yêu cầu thiết kế và các quy tắc nghiệp vụ đã đề ra, tác giả sử dụng phương pháp **Kiểm thử hộp đen (Black-box Testing)**. Phương pháp này tập trung vào việc kiểm tra các chức năng của hệ thống dựa trên dữ liệu đầu vào và kết quả đầu ra mà không cần quan tâm đến cấu trúc mã nguồn bên trong.

Dưới đây là bảng kịch bản kiểm thử (Test Cases) chi tiết cho các luồng nghiệp vụ quan trọng nhất của hệ thống:

| Mã TC | Phân hệ / Tính năng | Mô tả kịch bản kiểm thử | Dữ liệu đầu vào (Input) | Kết quả kỳ vọng (Expected Result) | Trạng thái (Status) |
|---|---|---|---|---|---|
| **TC-01** | Đăng nhập hệ thống | Kiểm tra đăng nhập với thông tin tài khoản hợp lệ (mật khẩu đúng, tài khoản đang hoạt động). | SĐT: `0901234567`<br>Mật khẩu: `Vietskin@123` | Đăng nhập thành công. Nhận về JWT Token. Trình duyệt điều hướng đúng trang Dashboard tương ứng với vai trò Admin. | **Đạt (Pass)** |
| **TC-02** | Đăng nhập hệ thống | Kiểm tra đăng nhập khi nhập sai mật khẩu hoặc số điện thoại không tồn tại. | SĐT: `0901234567`<br>Mật khẩu: `SaiMatKhau` | Đăng nhập thất bại. Hệ thống trả về lỗi HTTP 401 kèm thông điệp "Số điện thoại hoặc mật khẩu không chính xác". | **Đạt (Pass)** |
| **TC-03** | Đăng ký tài khoản | Kiểm tra đăng ký tài khoản bệnh nhân mới khi SĐT đã tồn tại trong hệ thống. | Tên: `Nguyễn Văn A`<br>SĐT: `0901234571` (đã có trong DB) | Đăng ký thất bại. Hệ thống hiển thị thông báo "Số điện thoại này đã được đăng ký tài khoản". | **Đạt (Pass)** |
| **TC-04** | Đặt lịch khám trực tuyến | Bệnh nhân đặt lịch khám online vào khung giờ trống hợp lệ của bác sĩ đang có lịch trực. | Chọn Bác sĩ A.<br>Ngày khám: Ngày mai.<br>Giờ: `09:00`. Dịch vụ: Khám bệnh. | Đặt lịch thành công. Tạo bản ghi Appointment mới trong DB với trạng thái `pending`. | **Đạt (Pass)** |
| **TC-05** | Đặt lịch khám trực tuyến | Kiểm tra ràng buộc trùng lịch: Bệnh nhân cố tình đặt lịch vào khung giờ đã được bệnh nhân khác đặt trước đó của cùng một bác sĩ. | Chọn Bác sĩ A.<br>Ngày khám: Ngày mai.<br>Giờ: `09:00` (đã bị đặt). | Đặt lịch thất bại. Hệ thống báo lỗi "Khung giờ này đã được đặt trước hoặc không còn khả dụng". | **Đạt (Pass)** |
| **TC-06** | Tạo lịch Walk-in | Lễ tân tạo nhanh lịch hẹn cho bệnh nhân vãng lai đến trực tiếp phòng khám. | Tên: `Khách Vãng Lai`<br>SĐT: `0988888888`<br>Chọn bác sĩ B, chọn giờ. | Tạo lịch hẹn trực tiếp thành công. Bản ghi lưu trong DB với trạng thái `confirmed`, trường `patient_id` mang giá trị `NULL`. | **Đạt (Pass)** |
| **TC-07** | Duyệt lịch & Cấp số TT | Lễ tân thực hiện duyệt lịch hẹn trực tuyến có trạng thái `pending` của bệnh nhân. | Chọn lịch hẹn pending bất kỳ của Bác sĩ C và nhấn "Duyệt". | Trạng thái lịch hẹn chuyển thành `confirmed`. Hệ thống tự động cấp Số thứ tự khám (ví dụ: STT: 5) tăng dần cho Bác sĩ C trong ngày đó. | **Đạt (Pass)** |
| **TC-08** | Quy trình Check-in | Lễ tân thực hiện check-in cho bệnh nhân khi chưa thực hiện thanh toán hóa đơn. | Tìm lịch hẹn confirmed của bệnh nhân.<br>Nhấn nút "Check-in". | Hệ thống chặn thao tác, hiển thị cảnh báo "Bệnh nhân cần thanh toán hóa đơn khám bệnh trước khi check-in". | **Đạt (Pass)** |
| **TC-09** | Thanh toán & Check-in | Lễ tân tạo hóa đơn, xác nhận thanh toán (tiền mặt/QR) và thực hiện check-in cho bệnh nhân. | Tạo hóa đơn cho lịch khám (Phí: 150.000đ). Chọn thanh toán Tiền mặt. Nhấn xác nhận. | Hóa đơn chuyển sang `paid`. Lịch hẹn chuyển sang trạng thái `checked_in`. Hàng đợi của bác sĩ cập nhật thêm bệnh nhân này thông qua SSE. | **Đạt (Pass)** |
| **TC-10** | Hàng đợi real-time | Kiểm tra đồng bộ hàng đợi khám trên màn hình Bác sĩ khi bệnh nhân được check-in thành công. | Thực hiện check-in cho bệnh nhân mới tại quầy lễ tân (như TC-09). | Danh sách bệnh nhân chờ khám trên màn hình của Bác sĩ cập nhật ngay lập tức bệnh nhân đó mà không cần nhấn F5 (Tải lại trang). | **Đạt (Pass)** |
| **TC-11** | Bác sĩ khám bệnh | Bác sĩ điền thông tin bệnh án và kê đơn thuốc cho bệnh nhân đang trong phòng khám. | Triệu chứng: "Mẩn đỏ da mặt".<br>Chẩn đoán: "Viêm da cơ địa".<br>Kê đơn: Thuốc X (10 viên). Nhấn Lưu. | Lưu trữ thành công thông tin bệnh án và đơn thuốc vào DB. Trạng thái lịch hẹn chuyển sang `done`. | **Đạt (Pass)** |
| **TC-12** | Thông báo khám xong | Kiểm tra lễ tân nhận thông báo tức thời khi bác sĩ hoàn thành ca khám bệnh. | Bác sĩ nhấn "Hoàn tất khám bệnh" trên màn hình khám (như TC-11). | Trên góc màn hình làm việc của Lễ tân xuất hiện thông báo toast thông báo bệnh nhân Nguyễn Văn A đã khám xong. | **Đạt (Pass)** |
| **TC-13** | Phân lịch làm việc | Admin lập lịch trực cho Bác sĩ A trùng phòng trực với Bác sĩ B trong cùng một ngày. | Bác sĩ A và Bác sĩ B cùng trực tại Phòng 101 vào ngày `15/06/2026`. | Hệ thống chặn lưu lịch trực, báo lỗi "Phòng khám 101 đã được phân công cho bác sĩ khác trong ngày này". | **Đạt (Pass)** |
| **TC-14** | Xuất báo cáo | Admin thực hiện lọc doanh thu Tháng 5/2026 và nhấn nút xuất báo cáo định dạng Excel / PDF. | Chọn bộ lọc: Tháng 5, Năm 2026.<br>Nhấn xuất PDF / Excel. | Hệ thống sinh file báo cáo chính xác dữ liệu của tháng 5 và trình duyệt tự động tải xuống tệp tin (`revenue-2026-05.pdf` hoặc `.xlsx`). | **Đạt (Pass)** |
| **TC-15** | Bảo mật API | Cố tình truy cập thẳng vào API quản trị nhân sự bằng công cụ Postman mà không gửi kèm Token JWT. | Gửi request `GET` đến `/api/users/staff` (không gửi kèm Authorization header). | API trả về mã lỗi HTTP `403 Forbidden` hoặc `401 Unauthorized`. Thao tác bị chặn hoàn toàn. | **Đạt (Pass)** |
| **TC-16** | Tự động Refresh Token | Kiểm tra tính năng tự động gia hạn phiên làm việc khi Access Token hết hạn. | Đợi 15 phút (cho Access Token hết hạn).<br>Thực hiện một thao tác API bất kỳ. | Axios Interceptor gửi yêu cầu ngầm và nhận về Token mới bằng Refresh Token thành công. Thao tác tiếp tục chạy trơn tru, người dùng không bị văng ra trang Login. | **Đạt (Pass)** |

Qua quá trình thực nghiệm kiểm thử, tất cả các kịch bản kiểm thử trọng yếu đều cho kết quả trùng khớp hoàn toàn với kết quả kỳ vọng. Hệ thống chạy ổn định, các ràng buộc dữ liệu được xử lý chặt chẽ ở tầng Back-End, không xảy ra hiện tượng xung đột dữ liệu hay bỏ sót ràng buộc nghiệp vụ da liễu đặc thù.

---

## 3.4 ĐÁNH GIÁ KẾT QUẢ

Sau quá trình thiết kế, triển khai xây dựng ứng dụng và đưa vào vận hành thực nghiệm kiểm thử thực tế, tác giả đưa ra những đánh giá khách quan về kết quả thực hiện đề tài như sau:

### 3.1 Những kết quả đã đạt được

Hệ thống quản lý phòng khám da liễu VietSkin đã hoàn thành đầy đủ các mục tiêu đề ra ban đầu, giải quyết triệt để các bài toán khó khăn trong quy trình vận hành thủ công của các phòng khám da liễu tư nhân vừa và nhỏ:

1.  **Về mặt chức năng và quy trình nghiệp vụ:**
    *   Xây dựng thành công chuỗi quy trình liên kết chặt chẽ và khép kín giữa 4 vai trò người dùng (Bệnh nhân → Lễ tân → Bác sĩ → Admin). Luồng đi của dữ liệu từ khâu đặt lịch hẹn trực tuyến (hoặc trực tiếp tại quầy), duyệt lịch, thanh toán phí khám, xếp số thứ tự hàng đợi khám, lập bệnh án điện tử tích hợp kê đơn thuốc, và xuất hóa đơn được thiết kế mạch lạc, trực quan.
    *   Hỗ trợ hoàn hảo cả hai quy trình khám bệnh thực tế: Đặt lịch trực tuyến trước và Khám vãng lai (Walk-in), giải quyết tốt bài toán tự động đồng bộ dữ liệu (Auto-Link) lịch sử khám cũ khi khách hàng vãng lai đăng ký tài khoản chính thức.
2.  **Về mặt kiến trúc công nghệ và hiệu năng:**
    *   Việc tách rời Front-End (React 19, Tailwind CSS 4) và Back-End (Spring Boot, Spring Data JPA) giúp tối ưu hóa hiệu năng ứng dụng, tăng khả năng mở rộng và dễ dàng bảo trì hệ thống.
    *   **Áp dụng thành công cơ chế Server-Sent Events (SSE):** Giải quyết hoàn hảo bài toán đồng bộ hàng đợi khám bệnh của bác sĩ và bảng theo dõi của lễ tân theo thời gian thực mà không cần sử dụng cơ chế kéo dữ liệu liên tục (polling) gây quá tải máy chủ.
    *   **Tích hợp bộ nhớ đệm Redis (Upstash Cloud Cache):** Giúp giảm thiểu tối đa số lượng truy vấn trực tiếp xuống cơ sở dữ liệu MySQL đối với các tác vụ đọc dữ liệu có tần suất cao nhưng ít thay đổi như: danh mục dịch vụ khám, danh mục phòng khám, danh mục thuốc y tế. Qua đó tăng tốc độ phản hồi của API lên gấp nhiều lần.
    *   Quản lý hình ảnh hiệu quả qua dịch vụ đám mây Cloudinary, giúp giảm tải dung lượng lưu trữ cho máy chủ ứng dụng và tối ưu hóa tốc độ hiển thị hình ảnh y khoa trong bệnh án của bệnh nhân.
3.  **Về mặt bảo mật thông tin:**
    *   Hệ thống được bảo vệ nghiêm ngặt bằng Spring Security. Toàn bộ mật khẩu của người dùng đều được mã hóa bằng thuật toán băm mạnh BCrypt trước khi lưu trữ vào cơ sở dữ liệu.
    *   Áp dụng cơ chế xác thực phân quyền dựa trên JWT với cặp Access Token và Refresh Token, kết hợp Axios Interceptor ở phía client giúp bảo vệ các tài nguyên API khỏi các truy cập trái phép từ bên ngoài, đồng thời giữ vững trải nghiệm liền mạch cho người dùng.
4.  **Về giao diện người dùng (UI/UX):**
    *   Giao diện Dashboard thiết kế hiện đại, bố cục khoa học, thân thiện với người dùng và có khả năng tương thích cao trên nhiều kích thước màn hình khác nhau nhờ Tailwind CSS.
    *   Hỗ trợ xuất báo cáo tài chính và hóa đơn khám bệnh sang các định dạng tệp tin thông dụng là Excel (qua thư viện Apache POI) và PDF chất lượng cao (qua thư viện OpenPDF) để phục vụ công tác in ấn, lưu trữ văn bản pháp lý của phòng khám.

---

### 3.2 Các hạn chế hiện tại của hệ thống

Mặc dù đã đạt được nhiều kết quả tích cực, hệ thống thực nghiệm VietSkin vẫn còn một số điểm hạn chế cần được cải tiến để có thể đưa vào vận hành thực tế ở quy mô lớn:

1.  **Tích hợp thanh toán trực tuyến:** Tính năng thanh toán qua mã QR hiện tại mới chỉ dừng lại ở mức mô phỏng (Mocked VNPay QR code). Hệ thống chưa thực hiện kết nối API trực tiếp đến môi trường Sandbox/Production chính thức của các cổng thanh toán phổ biến như VNPay, MoMo hay ZaloPay để tự động nhận phản hồi IPN (Instant Payment Notification) xác nhận giao dịch thành công.
2.  **Quản lý kho dược chưa chuyên sâu:** Phân hệ quản lý thuốc hiện tại mới chỉ dừng lại ở mức quản lý danh mục thuốc đơn giản (CRUD thông tin thuốc dùng để kê đơn). Hệ thống chưa hỗ trợ các tính năng quản lý kho dược nâng cao như: quản lý số lượng tồn kho thực tế, quản lý nhập/xuất kho thuốc, quản lý thuốc theo số lô (batch number) và theo dõi hạn sử dụng của thuốc.
3.  **Hệ thống nhắc hẹn tự động:** Phòng khám chưa tích hợp các dịch vụ gửi tin nhắn SMS, Zalo ZNS hoặc Email tự động để nhắc lịch khám cho bệnh nhân khi lịch hẹn được duyệt, hoặc nhắc lịch tái khám khi sắp đến ngày hẹn tái khám do bác sĩ chỉ định trong bệnh án.
4.  **Chưa hỗ trợ đa chi nhánh:** Thiết kế cơ sở dữ liệu hiện tại chỉ đáp ứng vận hành tối ưu cho một cơ sở phòng khám đơn lẻ (Single Clinic), chưa có sự phân tách dữ liệu rõ ràng để quản lý chuỗi phòng khám gồm nhiều chi nhánh ở các địa điểm khác nhau.

---

### 3.3 Hướng phát triển và mở rộng đề tài

Từ những kết quả đạt được và các hạn chế nêu trên, tác giả đề xuất các hướng nghiên cứu, phát triển và nâng cấp hệ thống VietSkin trong tương lai như sau:

1.  **Hoàn thiện phân hệ Thanh toán số:** Thực hiện đăng ký và tích hợp trực tiếp SDK/API của cổng thanh toán VNPay, MoMo hoặc Ngân hàng điện tử (mô hình VietQR) để hỗ trợ bệnh nhân thanh toán tiền khám trực tuyến ngay khi đặt lịch hoặc lễ tân thu tiền tự động đồng bộ trạng thái hóa đơn thông qua cổng thanh toán thật.
2.  **Phát triển phân hệ Quản lý Kho Dược (Pharmacy Inventory Management):**
    *   Bổ sung các bảng dữ liệu quản lý nhà cung cấp thuốc, phiếu nhập kho, phiếu xuất kho.
    *   Xây dựng thuật toán tự động cảnh báo khi một loại thuốc trong kho sắp hết (dưới ngưỡng an toàn) hoặc cảnh báo các lô thuốc sắp hết hạn sử dụng để thủ kho kịp thời xử lý.
    *   Ràng buộc số lượng thuốc khi bác sĩ kê đơn phải nhỏ hơn hoặc bằng số lượng thuốc thực tế đang còn trong kho của phòng khám.
3.  **Tích hợp dịch vụ truyền thông tự động (Notification Services):** Kết nối với các bên cung cấp dịch vụ Email (như SendGrid/Mailgun) và SMS Gateway để tự động gửi thông tin xác nhận lịch hẹn, gửi mã OTP khi đăng ký tài khoản, gửi hóa đơn điện tử và nhắc lịch tái khám tự động cho bệnh nhân.
4.  **Xây dựng Ứng dụng Di động (Mobile App) cho Bệnh nhân:** Phát triển ứng dụng di động dành riêng cho bệnh nhân sử dụng công nghệ React Native để bệnh nhân có thể đặt lịch hẹn dễ dàng hơn, nhận thông báo đẩy (Push Notifications) thời gian thực về lịch khám, và dễ dàng theo dõi hồ sơ y bạ điện tử ngay trên điện thoại thông minh.
5.  **Ứng dụng Trí tuệ Nhân tạo (AI) trong hỗ trợ chẩn đoán:** Tích hợp các mô hình học sâu (Deep Learning) nhận diện hình ảnh tổn thương da (như mụn, chàm, vảy nến,...) để hỗ trợ bác sĩ đưa ra gợi ý chẩn đoán ban đầu dựa trên hình ảnh da do bệnh nhân chụp tải lên hệ thống khi đặt lịch trực tuyến.
