# 🎓 CẨM NANG PHẢN BIỆN ĐỒ ÁN - KIẾN TRÚC MẠNG & DỮ LIỆU SMART HOME AI

Tài liệu này tổng hợp toàn bộ các câu hỏi phản biện cốt lõi và phương án trả lời chuẩn khoa học, giúp bạn tự tin bảo vệ đồ án tốt nghiệp trước Hội đồng phản biện.

---

## 🗂️ PHẦN 1: HỆ THỐNG MẠNG & CLOUDFLARE TUNNEL

### ❓ Câu hỏi 1: Tại sao hệ thống phải gọi API thông qua Cloudflare Tunnel mà không gọi trực tiếp qua địa chỉ IP?
*   **Câu trả lời chuẩn**: 
    1.  **Vấn đề thực tế (NAT & IP động)**: Khi thiết bị di động (Smart Phone) dùng mạng 4G/5G hoặc kết nối WiFi ngoài (quán cà phê, trường học), nó hoàn toàn không nằm chung mạng cục bộ (LAN) với máy chủ Flask API (đang chạy trên laptop). Do đó, IP nội bộ LAN (ví dụ: `10.203.15.51`) là vô hiệu. Đồng thời, đường truyền mạng gia đình thông thường không có IP tĩnh (Static IP) và bị chặn bởi tường lửa của nhà mạng (NAT/Firewall).
    2.  **Giải pháp Cloudflare Tunnel**: Giúp tạo ra một **"đường ống bảo mật ngược" (Reverse Tunnel)** chủ động từ laptop đi qua tường lửa kết nối thẳng đến trung tâm Cloudflare trên Internet. Nhờ vậy, máy chủ Cloudflare cấp cho ta một tên miền chính thức (`https://api.smarthomeai.id.vn`) chạy giao thức mã hóa HTTPS.
    3.  **Kết quả**: Điện thoại ở bất kỳ nơi đâu trên thế giới chỉ cần gửi yêu cầu đến tên miền trên, Cloudflare sẽ định tuyến an toàn về đúng máy chủ Flask của chúng ta.

---

## 💾 PHẦN 2: LƯU TRỮ & DỰ PHÒNG DỮ LIỆU (RESILIENCE)

### ❓ Câu hỏi 2: Khi tắt máy tính (hoặc dừng Server Flask), dữ liệu có bị mất không? Hệ thống lưu trữ dữ liệu bằng cách nào?
*   **Câu trả lời chuẩn**: **Dữ liệu hoàn toàn không bị mất**, hệ thống áp dụng cơ chế lưu trữ bền vững 2 tầng:
    1.  **Tại máy chủ (Backend)**: Toàn bộ thông tin tài khoản, cấu hình nhà (multi-home), và lịch sử hoạt động (Audit Logs) được lưu trữ bền vững trong file cơ sở dữ liệu **SQLite** (`smart_home_auth.db`). Trạng thái thiết bị mock lưu trong file `.json`. Các file này được ghi trực tiếp xuống ổ cứng vật lý của máy tính. Khi tắt máy, file vẫn nằm trên ổ cứng. Khi bật máy và chạy lại server, Flask sẽ tự động đọc lại các file này và khôi phục toàn bộ trạng thái.
    2.  **Tại ứng dụng (Frontend - Mobile App)**: App di động được tích hợp cơ chế **Dự phòng thông minh (Resilience & Offline Fallback)** thông qua **`AsyncStorage`** (bộ nhớ cache nội bộ của điện thoại). Gần nhất khi có mạng, app sẽ tự lưu một bản sao trạng thái thiết bị xuống điện thoại. Nếu Server bị tắt, app sẽ phát hiện mất kết nối, tự chuyển sang chế độ offline và lấy dữ liệu cache này ra hiển thị để người dùng vẫn xem được giao diện gần nhất thay vì bị crash.

---

## 🌐 PHẦN 3: KIẾN TRÚC TRIỂN KHAI THỰC TẾ (PRODUCTION DEPLOYMENT)

### ❓ Câu hỏi 3: Trong thực tế triển khai ở hộ gia đình, ta có bắt buộc phải bật chiếc laptop cá nhân chạy 24/7 không?
*   **Câu trả lời chuẩn**: **Không**. Chiếc laptop cá nhân chỉ phục vụ cho việc **thử nghiệm và demo đồ án** (để giảm thiểu chi phí phần cứng ban đầu). Khi hệ thống được triển khai thương mại thực tế, kiến trúc phần cứng sẽ thay đổi như sau:
    1.  **Tại mỗi gia đình (Edge Gateway)**: Sử dụng các máy tính nhúng siêu tiết kiệm điện chạy 24/7 như **Raspberry Pi** hoặc **Mini PC** (chỉ tiêu thụ 3W - 5W điện). Bộ điều khiển biên này cắm liên tục tại tủ điện gia đình để đọc dữ liệu cảm biến và giao tiếp với PLC S7-1200.
    2.  **Trên đám mây (Cloud Server)**: Hệ thống API Backend và trang Admin sẽ được deploy (triển khai) lên một **máy chủ ảo VPS (Virtual Private Server)** thuê của các nhà cung cấp dịch vụ đám mây (như AWS, Google Cloud, Viettel IDC, FPT Cloud) với chi phí chỉ khoảng 100k - 200k/tháng. VPS này nằm tại Datacenter lớn, chạy liên tục 24/7/365, có IP tĩnh và băng thông cực mạnh. Laptop của Admin lúc này chỉ dùng để mở trình duyệt xem dữ liệu từ xa, không cần bật liên tục.

---

### ❓ Câu hỏi 4: Khi triển khai thực tế, làm sao máy chủ Cloud Admin lấy được dữ liệu điện năng tiêu thụ từ thiết bị Mini PC/Raspberry Pi ở từng nhà về?
*   **Câu trả lời chuẩn**: Hệ thống áp dụng mô hình **Hybrid IoT Cloud** kết hợp hai giao thức truyền dữ liệu:
    1.  **Chiều đẩy dữ liệu (Push Model - Định kỳ)**: Edge Gateway (Raspberry Pi) tại mỗi nhà chạy một tiến trình ngầm (Python script). Cứ định kỳ 5 giây hoặc 2 phút một lần, Gateway tự động đóng gói dữ liệu công suất, điện áp đọc từ PLC và chủ động gửi yêu cầu HTTP POST (hoặc qua giao thức **MQTT** siêu nhẹ) lên máy chủ Cloud trung tâm (`https://api.smarthomeai.id.vn/api/power/report`). Cách này giúp vượt qua mọi loại tường lửa của nhà mạng mà không cần hộ gia đình phải mở cổng mạng hay cài Cloudflare Tunnel. Máy chủ Cloud lưu các gói dữ liệu này vào database.
    2.  **Chiều điều khiển tức thời (Real-time Pull/Control)**: Để gửi lệnh bật/tắt thiết bị tức thời từ App về nhà, Edge Gateway duy trì một kết nối Tunnel hoặc kết nối mạng riêng ảo VPN (như Tailscale/WireGuard) an toàn trỏ thẳng lên máy chủ Cloud. Khi có lệnh điều khiển từ App, máy chủ Cloud sẽ đẩy lệnh ngược qua đường ống kết nối có sẵn này để điều khiển trực tiếp PLC S7-1200.

---

## 👥 PHẦN 4: KIẾN TRÚC PHÂN QUYỀN HEMS & BẢO MẬT

### ❓ Câu hỏi 5: Cơ chế phân quyền 3 cấp (Admin - Cha - Con) được thiết kế và bảo mật như thế nào?
*   **Câu trả lời chuẩn**:
    1.  **Mô hình Phân quyền (RBAC - Role-Based Access Control)**:
        *   `system_admin`: Có quyền xem toàn bộ hệ thống (danh sách hộ gia đình, tài khoản cha, lịch sử audit log toàn hệ thống) thông qua trang `admin-site/`.
        *   `owner` (tài khoản cha): Có quyền sở hữu 1 căn hộ cụ thể, quản lý các thành viên con (`member`/`viewer`) trong nhà mình, cài đặt hạn mức tiêu thụ điện gia đình.
        *   `member`/`viewer` (tài khoản con): Chỉ có quyền xem hoặc điều khiển các thiết bị trong phạm vi phòng được chỉ định (như phòng ngủ của mình), bị giới hạn các thiết bị nặng vào giờ cao điểm.
    2.  **Thiết kế Database (Multi-tenant)**: Áp dụng mô hình **Shared Application, Isolated Data** (Chung ứng dụng, Cô lập dữ liệu). Toàn bộ dữ liệu nằm chung một DB SQLite nhưng mỗi bảng đều có liên kết chặt chẽ qua khóa ngoại `home_id`. Mọi truy vấn API về thiết bị hay năng lượng tại backend đều bắt buộc phải kiểm tra quyền sở hữu căn hộ (`home_id` của user đăng nhập phải trùng khớp với `home_id` của thiết bị được yêu cầu). Điều này đảm bảo hộ gia đình này không bao giờ xem hay điều khiển được thiết bị của hộ gia đình khác.
    3.  **Bảo mật API**: Sử dụng cơ chế truyền token xác thực bảo mật **Bearer Token** trong HTTP Headers (`Authorization: Bearer <token>`) và trường `X-API-Token`. Mỗi khi người dùng đăng nhập thành công, server sẽ sinh ra một chuỗi token ngẫu nhiên có thời hạn và lưu vào database để xác thực cho các request tiếp theo.

---

## 🤖 PHẦN 5: ĐỊNH HƯỚNG NÂNG CẤP CÔNG NGHỆ AI ĐỘT PHÁ

### ❓ Câu hỏi 6: Các mô hình AI dự báo phụ tải (XGBoost, LSTM) hoạt động ra sao và hướng nâng cấp tiếp theo để đồ án hoàn thiện hơn là gì?
*   **Câu trả lời chuẩn**:
    1.  **Cơ chế dự báo hiện tại**: Chúng ta sử dụng mô hình học máy **XGBoost** (chạy nhanh, chính xác với dữ liệu dạng bảng) và mô hình mạng nơ-ron sâu **LSTM/CNN-LSTM** (phù hợp với chuỗi thời gian). API biên có khả năng so sánh sai số dự báo (MAE, RMSE, MAPE) giữa các mô hình và hỗ trợ chuyển đổi linh hoạt qua tham số `?model=`.
    2.  **Định hướng nâng cấp 1 (XAI - Explainable AI)**: Tích hợp phương pháp **SHAP (SHapley Additive exPlanations)** để giải thích trực quan các đặc trưng làm tăng/giảm phụ tải ngay trên giao diện App (ví dụ: giải thích công suất đỉnh 18h tăng cao do nhiệt độ môi trường tăng 38°C đóng góp +1.2kW, do thói quen sinh hoạt cuối tuần đóng góp +2.0kW). Điều này giải quyết bài toán "hộp đen" của AI, giúp mô hình trở nên minh bạch trước hội đồng.
    3.  **Định hướng nâng cấp 2 (LLM Edge Consultant - Unsloth)**: Fine-tune một mô hình ngôn ngữ nhỏ (SLM) như Llama-3-8B hoặc Phi-3 bằng framework **Unsloth** để chạy trực tiếp trên biên. Mô hình này kết hợp dữ liệu tiêu thụ điện của gia đình, hạn mức cài đặt và kết quả dự báo 24h để đưa ra các lời tư vấn/khuyến nghị tiết kiệm năng lượng bằng tiếng Việt tự nhiên và cực kỳ thông minh qua giọng nói hoặc chatbox.
