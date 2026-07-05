# KẾ HOẠCH KIỂM THỬ VÀ THỰC NGHIỆM HỆ THỐNG SMART HOME HEMS

Tài liệu này trình bày kế hoạch kiểm thử và các kịch bản thực nghiệm hệ thống Quản trị Năng lượng Nhà thông minh (HEMS) tích hợp PLC Siemens S7-1200 và Mô hình AI dự báo phụ tải. Nội dung được thiết kế tập trung, tinh gọn, nhằm thu thập trực tiếp các số liệu khoa học để đưa vào phần **"3. KẾT QUẢ NGHIÊN CỨU/ THẢO LUẬN"** của bài báo khoa học gửi Tạp chí Khoa học và Công nghệ Cần Thơ (CTJST).

---

## 1. MỤC TIÊU VÀ ĐỐI TƯỢNG THỰC NGHIỆM

Để đáp ứng tính khoa học và thực tiễn của một bài báo công nghệ, chương trình thử nghiệm được cô đọng vào 3 nội dung cốt lõi:
1.  **Thử nghiệm liên kết truyền thông và đo độ trễ (Latency & Communication):** Đánh giá thời gian phản hồi (RTT) của tín hiệu điều khiển trong môi trường LAN và WAN (4G qua Cloudflare Tunnel), cũng như độ trễ thu thập dữ liệu Modbus RTU của PLC S7-1200.
2.  **Đánh giá định lượng mô hình AI dự báo phụ tải (AI Forecast Evaluation):** So sánh hiệu năng của các thuật toán dự báo phụ tải 24h tiếp theo thông qua các chỉ số sai số chuẩn hóa.
3.  **Kiểm chứng các kịch bản vận hành thực tế HEMS (HEMS Operation Scenarios):** Thực nghiệm thuật toán sa thải phụ tải chủ động (Active Load-shedding) theo thứ tự ưu tiên khi hệ thống tiệm cận hoặc tiệm cận hoặc vượt mức giới hạn (Quota) điện năng tháng (kWh).

---

## 2. PHẦN 1: THỬ NGHIỆM ĐỘ TRỄ TRUYỀN THÔNG (LATENCY TESTS)

Mục tiêu là đo lường thời gian cần thiết để một lệnh điều khiển được gửi đi từ ứng dụng di động, đi qua API Gateway (Flask), truyền xuống PLC S7-1200 qua giao thức S7, đóng cắt Relay vật lý và nhận lại trạng thái phản hồi khép kín (Closed-loop State Feedback) hiển thị trên màn hình ứng dụng.

### 2.1. Cấu hình môi trường đo độ trễ
*   **Môi trường mạng LAN:** Điện thoại di động và Flask API Server kết nối cùng một mạng Wi-Fi cục bộ (Access Point TP-Link), kết nối Ethernet trực tiếp tới PLC S7-1200.
*   **Môi trường mạng WAN/4G:** Điện thoại di động sử dụng kết nối 4G LTE mạng Viettel/VinaPhone, kết nối tới Flask API Server thông qua giao dịch HTTPS bảo mật được xuất bản qua Cloudflare Tunnel.

### 2.2. Kịch bản và bảng ghi thông số độ trễ điều khiển

| Mã Test | Kịch bản kiểm thử | Phương thức thực hiện | Kết quả mong đợi | Chỉ số đo lường (ms) |
|---|---|---|---|---|
| **LAT-01** | Độ trễ lệnh bật/tắt thiết bị qua LAN | Bấm nút ON/OFF trên Mobile App (cùng Wi-Fi LAN) | Relay vật lý tác động tức thời. Trạng thái phản hồi trên App cập nhật khép kín. | Mục tiêu: $< 200 \text{ ms}$ |
| **LAT-02** | Độ trễ lệnh bật/tắt thiết bị qua mạng di động (WAN/4G) | Bấm nút ON/OFF trên Mobile App (sử dụng mạng 4G) | Lệnh truyền qua Cloudflare Tunnel, PLC nhận lệnh và điều khiển relay thành công. | Mục tiêu: $< 1500 \text{ ms}$ |
| **LAT-03** | Chu kỳ đọc dữ liệu điện năng qua Modbus RTU | PLC S7-1200 thực hiện vòng quét đọc dữ liệu từ MFM384 | 4 thông số ($V$, $I$, $kW$, $kWh$) được ghi vào Data Block (`DB1`) liên tục mà không lỗi quét. | Vòng quét Modbus: $1 \text{ giây/vòng}$ |
| **LAT-04** | Đồng bộ nút nhấn cơ lý hiện trường | Nhấn nút nhấn vật lý đấu nối vào cổng ngõ vào Digital Input của PLC | Tiếp điểm phụ của contactor thay đổi trạng thái, Mobile App cập nhật hiển thị đồng thời. | Mục tiêu: $< 300 \text{ ms}$ |

---

## 3. PHẦN 2: ĐÁNH GIÁ HIỆU NĂNG MÔ HÌNH AI DỰ BÁO (AI FORECAST EVALUATION)

Đánh giá hiệu năng dự báo phụ tải ngắn hạn trước 24 giờ của các mô hình học máy (Machine Learning) và học sâu (Deep Learning) chạy trên Forecast Server. Mô hình được huấn luyện trên tập dữ liệu phụ tải chuẩn để so sánh định lượng.

### 3.1. Các chỉ số đánh giá cốt lõi
*   **MAE (Mean Absolute Error):** Sai số tuyệt đối trung bình (đo lường độ lệch trung bình bằng đơn vị kW).
*   **RMSE (Root Mean Squared Error):** Sai số căn trung bình bình phương (phạt nặng các sai số dự báo lớn).
*   **MAPE (Mean Absolute Percentage Error):** Sai số phần trăm tuyệt đối trung bình (chỉ số quan trọng nhất để báo cáo khoa học).
*   **$R^2$ Score (Coefficient of Determination):** Hệ số xác định, thể hiện mức độ giải thích được biến thiên dữ liệu phụ tải của mô hình (Mục tiêu: $R^2 \ge 0.92$).
*   **Inference Time:** Thời gian thực thi suy luận của mô hình trên 1 bước dự báo (Mục tiêu: $< 100 \text{ ms}$).

### 3.2. Bảng so sánh hiệu năng các mô hình thực nghiệm

| Mô hình thuật toán | MAE (kW) | RMSE (kW) | MAPE (%) | Hệ số $R^2$ | Thời gian suy luận (ms) | Nhận xét tính khả thi |
|---|---|---|---|---|---|---|
| **Random Forest** | *Chờ cập nhật* | *Chờ cập nhật* | *Chờ cập nhật* | *Chờ cập nhật* | *Chờ cập nhật* | Độ chính xác khá, tài nguyên nhẹ |
| **XGBoost (Đề xuất)** | *Chờ cập nhật* | *Chờ cập nhật* | *Chờ cập nhật* | *Chờ cập nhật* | *Chờ cập nhật* | Độ chính xác cao, thời gian xử lý nhanh |
| **LSTM** | *Chờ cập nhật* | *Chờ cập nhật* | *Chờ cập nhật* | *Chờ cập nhật* | *Chờ cập nhật* | Nắm bắt tốt chuỗi thời gian, nặng hơn |
| **CNN-LSTM (Lai)** | *Chờ cập nhật* | *Chờ cập nhật* | *Chờ cập nhật* | *Chờ cập nhật* | *Chờ cập nhật* | Tối ưu hóa tốt đặc trưng không gian-thời gian |

---

## 4. PHẦN 3: THỰC NGHIỆM CÁC KỊCH BẢN VẬN HÀNH HEMS & SA THẢI PHỤ TẢI

Thực nghiệm đánh giá khả năng vận hành thông minh của hệ thống quản lý năng lượng HEMS trong việc bảo vệ lưới điện gia đình và tiết kiệm chi phí năng lượng qua 3 kịch bản thực tế chính:

### 4.1. Định nghĩa mức ưu tiên thiết bị (Priority Levels)
Hệ thống thiết lập thứ tự ưu tiên của 3 phòng tải giả định để thực hiện thuật toán sa thải phụ tải chủ động (Active Load-shedding):
1.  **Tải ưu tiên 1 (Thiết yếu - Priority 1):** Hệ thống chiếu sáng và cổng kết nối thông tin (Phòng ngủ) - *Ngắt cuối cùng*.
2.  **Tải ưu tiên 2 (Bán thiết yếu - Priority 2):** Hệ thống làm mát và quạt (Phòng khách) - *Ngắt thứ hai khi quá tải trung bình*.
3.  **Tải ưu tiên 3 (Không thiết yếu - Priority 3):** Bình nóng lạnh, lò nướng, thiết bị bếp (Phòng bếp) - *Ngắt đầu tiên khi tiệm cận hạn mức*.

### 4.2. Các kịch bản thực nghiệm vận hành HEMS

```text
Kịch bản SC-01 (Vắng nhà): Tự động tối thiểu hóa phụ tải nền (Ngắt tải Priority 2 & 3).
Kịch bản SC-02 (Sinh hoạt): Lập lịch tự động dựa theo thời gian và biểu đồ dự báo của AI.
Kịch bản SC-03 (Quá tải Quota): Kích hoạt thuật toán sa thải phụ tải chủ động theo Priority.
```

| Mã Kịch Bản | Tên Kịch Bản | Điều kiện kích hoạt | Logic xử lý của HEMS | Chỉ số thu thập |
|---|---|---|---|---|
| **SC-01** | Chế độ vắng nhà (Away Mode) | Người dùng kích hoạt Scene "Vắng nhà" từ xa qua App | PLC nhận lệnh ngắt tức thời các tải Priority 2 (Phòng khách) và Priority 3 (Phòng bếp). Chỉ giữ lại tải nền thiết yếu. | Công suất nền thực tế ($kW$), Trạng thái phản hồi thiết bị. |
| **SC-02** | Sinh hoạt bình thường (Normal Mode) | Hệ thống vận hành theo lịch sinh hoạt mặc định | Thiết bị hoạt động bình thường, mô hình AI chạy nền liên tục dự báo phụ tải cho 24 giờ tiếp theo để cảnh báo sớm. | Biểu đồ công suất thực tế so với biểu đồ dự báo AI. |
| **SC-03** | Sa thải phụ tải chủ động (Active Load-shedding) | Điện năng tháng vượt ngưỡng cảnh báo hạn mức (kWh) và công suất tức thời vượt $P_{limit}$ (kW) | **Bước 1:** Gửi cảnh báo đỏ (Alert) lên Mobile App.<br>**Bước 2:** PLC đề xuất hoặc tự động ngắt tải phi thiết yếu (Priority 3) nếu chủ nhà bật chế độ tự động.<br>**Bước 3:** Nếu vẫn vượt ngưỡng, ngắt tiếp tải phi thiết yếu Priority 2 (Phòng khách). | Ngưỡng công suất quota ($kW$), Thời gian PLC kích hoạt lệnh ngắt bảo vệ ($ms$). |

---

## 5. PHẦN 4: THỰC NGHIỆM GỬI CẢNH BÁO SMS VÀ TRÁNH SPAM TIN NHẮN (SMS ALERTS)

Kiểm thử chức năng gửi cảnh báo SMS thông qua SMS Gateway/API khi tiệm cận hoặc vượt hạn mức điện năng tháng, và kiểm tra tính hiệu quả của cơ chế chống spam (rate-limiting).

### 5.1. Kịch bản thực nghiệm cảnh báo SMS

| Mã Test | Kịch bản kiểm thử | Phương thức thực hiện | Kết quả mong đợi | Chỉ số đo lường |
|---|---|---|---|---|
| **SMS-01** | Kiểm thử cảnh báo khi đạt ngưỡng 80%, 90%, 100% quota tháng (kWh) | Giả lập điện năng tiêu thụ lũy kế tháng đạt các ngưỡng tương ứng | Ngưỡng 80% chỉ gửi thông báo App; Ngưỡng 90% và 100% gửi cả thông báo App và gọi API SMS Gateway gửi tin nhắn. | App notification + SMS trigger thành công |
| **SMS-02** | Kiểm thử cơ chế rate-limiting chống gửi lặp SMS | Duy trì liên tục phụ tải ở mức 92% quota trong nhiều chu kỳ đo | Chỉ gửi đúng 1 tin nhắn SMS duy nhất cho ngưỡng 90%, không gửi tin nhắn thứ hai gây spam. | Số lượng SMS gửi đi: $1 \text{ tin}$ |
| **SMS-03** | Đo độ trễ phản hồi gửi SMS | Đo khoảng thời gian từ lúc Backend phát hiện vượt ngưỡng đến lúc SMS được gửi qua Mock API Gateway | Tin nhắn gửi đi nhanh chóng để thông báo tức thời cho chủ nhà. | Độ trễ phản hồi: $< 5 \text{ giây}$ |

## 6. CÁC BIỂU ĐỒ VÀ BẰNG CHỨNG THỰC NGHIỆM CẦN CÓ CHO BÀI BÁO

Để đưa vào mục Kết quả nghiên cứu và thảo luận của bài báo, các hình ảnh và biểu đồ sau cần được xuất ra từ thực nghiệm:
1.  **Biểu đồ dự báo phụ tải chuỗi thời gian (Load Forecasting Curve):** Biểu diễn đường công suất thực tế ($P_{actual}$) chạy đè lên đường dự báo của AI ($P_{forecast}$) trong 24 giờ để thể hiện trực quan độ sai lệch.
2.  **Sơ đồ đấu nối và lắp đặt tủ điện thực tế:** Ảnh chụp tủ điện demo bao gồm PLC S7-1200 CPU 1215C, đồng hồ MFM384, hàng relay kiếng trung gian và các contactor động lực đóng cắt tải.
3.  **Biểu đồ phân tích độ trễ phản hồi (Response Latency Chart):** Biểu đồ cột so sánh độ trễ trung bình của các lệnh điều khiển điều phối qua LAN và WAN/4G.
4.  **Đồ thị minh họa quá trình sa thải phụ tải chủ động:** Biểu đồ thể hiện công suất tăng vọt vượt quota tại thời điểm $t_1$, sau đó giảm bậc thang về dưới mức quota tại thời điểm $t_2$ và $t_3$ sau khi HEMS gửi lệnh ngắt các tải ưu tiên thấp.
