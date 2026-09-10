# TÀI LIỆU DÀN Ý VÀ ĐỊNH HƯỚNG TRIỂN KHAI LUẬN VĂN TỐT NGHIỆP KỸ SƯ (CTUT)

> **Cập nhật:** 2026-09-10
> **Quy chuẩn áp dụng:** Phụ lục II - Quyết định số 345/QĐ-ĐHKTCN của Trường Đại học Kỹ thuật - Công nghệ Cần Thơ (CTUT).
> **Đề tài:** Nghiên cứu, thiết kế và triển khai hệ thống quản trị năng lượng nhà thông minh (HEMS) tích hợp PLC Siemens S7-1200 và Trí tuệ nhân tạo dự báo phụ tải.

> **Ranh giới trạng thái:** Đây là dàn ý lập kế hoạch, không phải báo cáo
> nghiệm thu. Các mục phần cứng, sa thải tải, cảnh báo, tiết kiệm điện và thử
> nghiệm trong tài liệu này là **đề xuất** nếu chưa được đánh dấu là đã thực
> hiện trong `PROJECT_STATUS_CURRENT.md`. Không dùng dàn ý để khẳng định runtime,
> APK, dữ liệu MFM384 hoặc kết quả nghiên cứu hiện hành.
>
> Các mục tiêu minh họa như độ trễ **<100 ms**, delivery SMS **90%**, ánh xạ
> **Q0.2** và trường **`priority_tier`** chưa có phép đo, schema hoặc mapping
> runtime được xác nhận; chỉ trình bày như phương án cần thiết kế và phê duyệt.

---

## 📌 1. NGUYÊN TẮC VÀ ĐỊNH NGHĨA KỸ THUẬT ĐỀ XUẤT

### 1.1. Phân biệt 2 loại Ngưỡng trong hệ thống:
1. **Ngưỡng Hạn mức Điện năng (kWh):**
   * *Mục đích:* Quản lý tài chính, tiết kiệm chi phí, tránh vượt lên bậc giá điện cao (Bậc 5, Bậc 6 EVN).
   * *Tầng xử lý đề xuất:* Phần mềm (Flask Backend + cơ sở dữ liệu + Mobile App).
   * *Cơ chế đề xuất:* Hiển thị điện năng tích lũy và gửi cảnh báo qua kênh đã cấu hình ở các ngưỡng được duyệt. Các mốc 80%/90%/100% và SMS chỉ là phương án cần xác nhận; không phải cam kết delivery hiện tại.
2. **Ngưỡng Công suất Hoạt động tức thời (kW hoặc A):**
   * *Mục đích:* Bảo vệ an toàn kỹ thuật, chống quá tải khí cụ, chống cháy nổ đường dây và chống nhảy CB tổng.
   * *Tầng xử lý đề xuất:* Thiết bị bảo vệ và logic hiện trường sau khi được thiết kế, liên động và thử nghiệm; không dựa vào cloud hoặc AI.
   * *Cơ chế đề xuất:* Có thể xét sa thải tải theo chính sách an toàn sau khi có telemetry tức thời và feedback. Chưa có cam kết thời gian tác động; `AUTO_LOAD_SHEDDING_KW_SAFETY_READY=False`.

### 1.2. Nhận diện và Phân loại Tải Cấp 3 (Tải sa thải đầu tiên):
* **Cấp 1 (Tải thiết yếu):** Được bảo vệ khỏi lựa chọn sa thải của thuật toán; danh mục cuối phải theo thiết kế điện và phê duyệt an toàn.
* **Cấp 2 (Tải bán thiết yếu):** Chỉ được xét sau khi quá tải kéo dài và chính sách cho phép.
* **Cấp 3 (Tải không thiết yếu):** Là nhóm được xét đầu tiên khi thuật toán được duyệt.
* **Cơ chế nhận diện đề xuất:**
  * *Tiêu chí:* Công suất, loại tải, quán tính nhiệt và nguy cơ phải được đánh giá theo từng tủ; mốc > 1500 W chỉ là ví dụ, không phải ngưỡng runtime.
  * *Phần mềm:* `priority_tier` trong CSDL/App chưa được triển khai; không trình bày như schema hiện tại.
  * *Phần cứng:* `Q0.2` chỉ là ví dụ ánh xạ cần đối chiếu TIA Portal; không khẳng định là mapping runtime của dự án.

### 1.3. Trình tự sa thải tải đề xuất và điều kiện dừng

Đây là thuật toán thiết kế để đánh giá sau này, không phải đường điều khiển hiện
tại:

1. Đọc kW/A tức thời từ telemetry mới và kiểm tra độ tươi, ngưỡng cùng trạng thái liên động.
2. Chỉ khi quá tải **kéo dài** theo thời gian được duyệt, xét tải Cấp 3 đầu tiên.
3. Ghi lệnh, chờ feedback và đo lại; dừng ngay khi công suất về vùng cho phép.
4. Nếu vẫn quá tải kéo dài và chính sách cho phép, mới xét Cấp 2; không chọn Cấp 1 bằng thuật toán này.
5. Dùng hysteresis/cooldown để tránh đóng-cắt liên tục. Telemetry cũ, mất feedback hoặc lỗi liên động thì không phát lệnh mới; khôi phục tải chỉ theo chính sách được duyệt.

Vòng lặp quota kWh lịch sử không được dùng để bật sa thải. Cần hoàn tất thiết
kế phần cứng, schema/config/UI, thử nghiệm tải an toàn và cổng phê duyệt trước
khi thay đổi `AUTO_LOAD_SHEDDING_KW_SAFETY_READY`.

---

## 📑 2. DÀN Ý CHI TIẾT 5 CHƯƠNG CHUẨN CTUT

* **PHẦN ĐẦU:** Bìa, Nhiệm vụ đồ án, Lời cảm ơn, Lời cam đoan, Tóm tắt (Việt/Anh), Mục lục, Danh mục từ viết tắt, Danh mục bảng, Danh mục hình.
* **LỜI MỞ ĐẦU:** Bối cảnh, mục tiêu, đối tượng, phạm vi, phương pháp và ý nghĩa đề tài.
* **CHƯƠNG 1: TỔNG QUAN VỀ HỆ THỐNG HEMS VÀ ĐẶT VẤN ĐỀ**
  * 1.1. Khái niệm và vai trò của HEMS trong Lưới điện thông minh & Demand Response.
  * 1.2. Tổng quan tình hình nghiên cứu trong và ngoài nước (33 tài liệu tham khảo).
  * 1.3. Phân tích khoảng trống nghiên cứu và đặt bài toán cho đề tài.
  * 1.4. Bố cục của Luận văn tốt nghiệp.
* **CHƯƠNG 2: CƠ SỞ LÝ THUYẾT, THIẾT BỊ PHẦN CỨNG VÀ THUẬT TOÁN AI**
  * 2.1. Cơ sở đo lường đại lượng điện và đồng hồ Selec MFM384 (kèm CT 50/5A).
  * 2.2. Giao thức Modbus RTU qua chuẩn RS-485 (Trở cuối 120 Ohm, IEEE 754 Float 32-bit).
  * 2.3. Bộ điều khiển lập trình PLC Siemens S7-1200 (CPU 1215C, CM 1241, S7comm, Snap7).
  * 2.4. Khí cụ đóng cắt, bảo vệ và trung gian (MCB, Contactor 220V, Rơ-le kiếng Omron 24VDC, Nguồn tổ ong Meanwell).
  * 2.5. Cơ sở toán học các thuật toán AI dự báo STLF (Persistence, Seasonal Naive, RF, XGBoost, LSTM, CNN-LSTM; mô hình nào được báo cáo phải có kết quả và cấu hình tương ứng).
  * 2.6. Các chỉ số đánh giá sai số mô hình (MAE, RMSE, MAPE, R2).
  * 2.7. Nền tảng công nghệ phần mềm Cloud, bảo mật RBAC, Cloudflare Tunnel và các kênh cảnh báo cấu hình được (Telegram/SMS là phương án; delivery chưa được xác minh).
* **CHƯƠNG 3: TÍNH TOÁN, THIẾT KẾ VÀ THI CÔNG HỆ THỐNG HEMS**
  * 3.1. Tính toán lựa chọn khí cụ điện (Công thức Idm, chọn MCB tổng/nhánh, Contactor, Rơ-le, Nguồn 24VDC).
  * 3.2. Thiết kế bản vẽ mạch điện CAD (Động lực 220VAC, Điều khiển 24VDC, Modbus RS485, Bố trí tủ điện).
  * 3.3. Thiết kế/lập trình TIA Portal (Khối MB_COMM_LOAD, MB_MASTER, Data Blocks DB1, DB2, Contact Feedback Verification, logic sa thải tải phần cứng nếu được duyệt).
  * 3.4. Thiết kế Backend Flask API, CSDL Supabase PostgreSQL (ERD 8 bảng theo phương án), phân quyền RBAC và kênh cảnh báo cấu hình được; SMS/Telegram chưa là bằng chứng delivery.
  * 3.5. Thiết kế UX/UI Mobile App React Native và Web Dashboard Admin.
  * 3.6. Xây dựng Pipeline AI (Tiền xử lý, trích xuất Feature Lags/Rolling/Calendar, 3-Fold Rolling-origin CV theo bản ghi benchmark hiện hành; không gọi là 5-fold).
* **CHƯƠNG 4: KẾT QUẢ THỰC NGHIỆM VÀ ĐÁNH GIÁ ĐỊNH LƯỢNG**
  * 4.1. Kết quả thực nghiệm phần cứng Modbus RTU và độ chính xác đo lường (chỉ điền sau khi có raw log và phép thử được duyệt).
  * 4.2. Kết quả đo đạc độ trễ End-to-End RTT qua LAN và 4G/Cloudflare (kế hoạch; không mặc định N=100 hoặc gán thời gian khi chưa có log).
  * 4.3. Kết quả huấn luyện và đánh giá so sánh các mô hình trên tập UCI; kết quả từ MFM384 địa phương chỉ bổ sung khi có dữ liệu thật.
  * 4.4. Đánh giá các kịch bản cảnh báo quota kWh, xử lý quá tải kW/A và mất mạng theo cổng an toàn; sa thải tự động chưa được coi là kết quả.
  * 4.5. Đánh giá hiệu quả kinh tế và bài toán tiết kiệm tiền điện theo 6 bậc giá EVN (kế hoạch, chưa có kết quả hiện hành).
  * 4.6. Thảo luận kết quả và phân tích nguy cơ đối với tính hợp lệ (Threats to validity).
* **CHƯƠNG 5: KẾT LUẬN VÀ HƯỚNG PHÁT TRIỂN**
  * 5.1. Kết luận những đóng góp kỹ thuật của đề tài.
  * 5.2. Các mặt hạn chế hiện tại.
  * 5.3. Hướng phát triển (Điện mặt trời PV, Pin lưu trữ ESS, Sạc xe điện EV, Deep Reinforcement Learning).
* **TÀI LIỆU THAM KHẢO & PHỤ LỤC (Bản vẽ CAD khổ lớn, Code TIA Portal, Code Backend/AI).**
