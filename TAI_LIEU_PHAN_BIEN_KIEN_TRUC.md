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
    1.  **Chiều đẩy dữ liệu (Push Model - Định kỳ)**: Edge Gateway (Raspberry Pi) tại mỗi nhà chạy một tiến trình ngầm (Python script). Cứ định kỳ 5 giây hoặc 2 phút một lần, Gateway tự động đóng gói dữ liệu công suất, điện áp đọc từ PLC và chủ động gửi yêu cầu HTTP POST (hoặc qua giao thức **MQTT** siêu nhẹ) lên máy chủ Cloud trung tâm (`https://api.smarthomeai.id.vn/api/power/readings`). Cách này giúp vượt qua mọi loại tường lửa của nhà mạng mà không cần hộ gia đình phải mở cổng mạng hay cài Cloudflare Tunnel. Máy chủ Cloud lưu các gói dữ liệu này vào database.
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

---

## 🧩 PHẦN 6: CÂU HỎI PHẢN BIỆN MỞ RỘNG KHI HỘI ĐỒNG HỎI SÂU

### ❓ Câu hỏi 7: Nếu người dùng bấm công tắc vật lý ngoài tủ điện thì App có đồng bộ trạng thái được không?
*   **Câu trả lời chuẩn**: **Có, nếu công tắc vật lý được đấu vào input của PLC và trạng thái thật được PLC ghi ra tag status**. Kiến trúc đồng bộ đúng là:
    1.  Nút nhấn/công tắc vật lý đi vào input PLC, ví dụ `I0.0`.
    2.  Lệnh từ App đi qua Backend rồi ghi vào command tag trong PLC, ví dụ `M110.0` hoặc `DB_COMMAND.DBX0.0`.
    3.  PLC xử lý cả hai nguồn lệnh: lệnh vật lý và lệnh từ App.
    4.  PLC điều khiển output/relay/contactor, ví dụ `Q0.0`.
    5.  PLC cập nhật trạng thái thật vào status tag, ví dụ `M100.0` hoặc `DB_STATUS.DBX0.0`.
    6.  Backend đọc status tag và App hiển thị theo trạng thái thật này.

    Vì vậy App không hiển thị theo "lệnh vừa gửi", mà hiển thị theo **trạng thái phản hồi từ PLC**. Nhờ đó, dù bật bằng nút vật lý hay bật bằng App, trạng thái trên App vẫn đồng bộ.

---

### ❓ Câu hỏi 8: Vì sao không cho App ghi trực tiếp xuống PLC mà phải đi qua Backend?
*   **Câu trả lời chuẩn**: Không cho App ghi trực tiếp vào PLC vì lý do bảo mật và kiểm soát quyền. Nếu App kết nối trực tiếp PLC, mỗi điện thoại phải biết IP PLC, cấu trúc DB/tag và có khả năng ghi lệnh công nghiệp trực tiếp, điều này rất rủi ro. Backend đóng vai trò **API Gateway an toàn**:
    1.  Xác thực người dùng bằng token.
    2.  Kiểm tra quyền `owner`, `member`, `viewer`.
    3.  Ghi audit log mọi thao tác bật/tắt.
    4.  Chuẩn hóa lệnh trước khi ghi xuống PLC.
    5.  Ẩn thông tin kỹ thuật của PLC khỏi thiết bị người dùng.

    Luồng đúng là: `App -> Backend -> PLC`. Đây là mô hình an toàn hơn và dễ mở rộng khi có nhiều hộ gia đình hoặc nhiều thiết bị.

---

### ❓ Câu hỏi 9: Lệnh từ App có thể ghi vào Data Block (DB) trong PLC không?
*   **Câu trả lời chuẩn**: **Có**, nếu Data Block trong PLC được cấu hình cho phép truy cập từ thiết bị ngoài và Backend dùng Snap7 hoặc giao thức tương đương để đọc/ghi đúng địa chỉ. Một thiết kế rõ ràng có thể chia thành ba vùng:
    1.  `DB_COMMAND`: Backend ghi lệnh từ App xuống PLC.
    2.  `DB_STATUS`: PLC ghi trạng thái thật để Backend đọc lên App.
    3.  `DB_POWER`: PLC lưu số liệu điện năng như V, A, kW, kWh.

    Ví dụ:
    - `DB_COMMAND.DBX0.0`: lệnh bật đèn phòng khách từ App.
    - `DB_STATUS.DBX0.0`: trạng thái thật của đèn phòng khách.
    - `DB_POWER.DBD0`: điện áp.
    - `DB_POWER.DBD4`: dòng điện.
    - `DB_POWER.DBD8`: tổng công suất kW.
    - `DB_POWER.DBD12`: tổng điện năng kWh.

    Cách chia DB như vậy giúp hệ thống rõ ràng: App chỉ gửi yêu cầu, Backend ghi command, PLC quyết định output, rồi Backend đọc status thật trả lại App.

---

### ❓ Câu hỏi 10: Nếu mất Internet thì hệ thống còn điều khiển được không?
*   **Câu trả lời chuẩn**: Tùy trường hợp mất kết nối:
    1.  **Mất Internet nhưng điện thoại vẫn cùng WiFi LAN với Backend/Gateway**: App vẫn có thể gọi local API, ví dụ `http://IP-LAPTOP:5001`, nên vẫn điều khiển được trong mạng nội bộ.
    2.  **Mất Internet và điện thoại đang ở ngoài nhà**: App không thể truy cập Cloudflare Tunnel, nên không điều khiển từ xa được. Đây là giới hạn tự nhiên của hệ thống IoT phụ thuộc mạng.
    3.  **Mất Backend nhưng PLC vẫn chạy**: Các nút vật lý và logic PLC vẫn có thể điều khiển tải tại chỗ. App có thể hiển thị cache gần nhất nhưng không nên coi đó là trạng thái thời gian thực.

    Điểm mạnh của kiến trúc là tách PLC khỏi App: PLC vẫn giữ vai trò điều khiển cục bộ an toàn, còn App/Cloud là lớp giám sát và điều khiển tiện ích.

---

### ❓ Câu hỏi 11: Vì sao dùng SQLite, liệu có đủ cho hệ thống nhiều nhà không?
*   **Câu trả lời chuẩn**: Trong giai đoạn đồ án và prototype, SQLite là lựa chọn hợp lý vì nhẹ, dễ triển khai, không cần cài database server riêng và đủ cho demo multi-home trên một máy chủ. Dữ liệu đã được tách bằng `home_id`, nên về mặt mô hình dữ liệu vẫn hỗ trợ multi-tenant.

    Khi triển khai thương mại hoặc có nhiều hộ gia đình thật, SQLite có thể được thay bằng PostgreSQL hoặc MySQL mà không thay đổi kiến trúc tổng thể. Nói cách khác, SQLite là lựa chọn phù hợp cho **prototype/SIL**, còn PostgreSQL là hướng nâng cấp cho **production**.

---

### ❓ Câu hỏi 12: Hạn mức điện năng HEMS hiện tại có tự động cắt tải khi vượt ngưỡng không?
*   **Câu trả lời chuẩn**: Phiên bản hiện tại tập trung vào **giám sát, tính toán và cảnh báo hạn mức**. Chủ hộ có thể đặt hạn mức kWh/tháng, Backend tính lượng tiêu thụ hiện tại từ lịch sử `power_readings`, App hiển thị tỷ lệ đã dùng và đổi màu cảnh báo.

    Cơ chế tự động cắt tải hoặc từ chối bật tải nặng theo quota là hướng phát triển tiếp theo. Để làm đúng trong thực tế, hệ thống cần thêm:
    1.  Phân loại tải quan trọng và tải có thể cắt.
    2.  Luật ưu tiên an toàn, không cắt tải thiết yếu.
    3.  Feedback trạng thái từ relay/contactor về PLC.
    4.  Chế độ cho phép người dùng xác nhận trước khi cắt tải.

    Trả lời như vậy giúp phân biệt rõ phần đã làm và phần mở rộng, tránh nói quá mức so với hệ thống hiện tại.

---

### ❓ Câu hỏi 13: Nếu dùng tải thật thì kiến trúc phần cứng nên bố trí như thế nào để an toàn?
*   **Câu trả lời chuẩn**: Không nên để PLC hoặc App đóng cắt tải 220VAC trực tiếp. Kiến trúc an toàn nên là:

```text
App -> Backend -> PLC output -> relay trung gian 24VDC -> contactor/relay công suất -> tải thật
```

    Trong đó:
    1.  PLC xử lý logic điều khiển.
    2.  Relay 14 chân đóng vai trò relay trung gian.
    3.  Contactor/relay công suất chịu dòng tải thật.
    4.  MFM384 đo dòng, áp, kW, kWh của nhóm tải.
    5.  Tiếp điểm phụ của contactor đưa về input PLC để xác nhận trạng thái thật.

    Tủ điện nên tách mạch điều khiển 24VDC và mạch tải 220VAC, có MCB/cầu chì riêng, terminal rõ ràng và nút dừng khẩn nếu demo tải thật.

---

### ❓ Câu hỏi 14: Nếu chưa có phần cứng PLC hoàn chỉnh thì bài báo/đồ án có còn giá trị không?
*   **Câu trả lời chuẩn**: **Có**, nếu định vị đúng là hệ thống prototype hoặc Software-in-the-Loop (SIL). Giá trị của đồ án không chỉ nằm ở phần cứng, mà nằm ở kiến trúc tổng thể:
    1.  App di động.
    2.  Backend API.
    3.  Phân quyền người dùng.
    4.  Lưu lịch sử điện năng.
    5.  Hạn mức điện năng.
    6.  Dự báo phụ tải bằng AI.
    7.  Khả năng mở rộng sang PLC thật.

    Tuy nhiên, khi trình bày khoa học cần nói trung thực: phần PLC/MFM384 là thiết kế tích hợp và hướng triển khai thực nghiệm; phần đã kiểm chứng đầy đủ là pipeline App - Backend - Database - Forecast - Collector ở môi trường local/SIL.

---

### ❓ Câu hỏi 15: AI dự báo phụ tải có thật sự cần thiết trong hệ thống nhà thông minh không?
*   **Câu trả lời chuẩn**: Có, vì nhà thông minh thông thường chỉ điều khiển bật/tắt, còn HEMS cần thêm khả năng **dự báo và ra quyết định trước**. AI dự báo phụ tải giúp:
    1.  Ước lượng xu hướng tiêu thụ trong 24 giờ tới.
    2.  Cảnh báo nguy cơ tăng tải hoặc vượt hạn mức.
    3.  Hỗ trợ đề xuất lịch bật/tắt thiết bị.
    4.  Làm nền cho tối ưu chi phí điện trong tương lai.

    Trong kết quả hiện tại, XGBoost đạt MAE khoảng `0.4010 kW`, tốt hơn nhẹ so với Random Forest `0.4097 kW`, đồng thời có kích thước mô hình nhỏ hơn đáng kể. Vì vậy XGBoost phù hợp làm mô hình mặc định cho prototype HEMS.

---

### ❓ Câu hỏi 16: MAPE hơn 50% có làm mô hình AI bị xem là kém không?
*   **Câu trả lời chuẩn**: Không nên đánh giá mô hình chỉ bằng MAPE trong dữ liệu điện hộ gia đình. Với phụ tải hộ gia đình, có nhiều thời điểm công suất rất thấp hoặc gần bằng 0. Khi mẫu số nhỏ, MAPE bị phóng đại rất mạnh dù sai số tuyệt đối không quá lớn.

    Vì vậy bài toán này nên ưu tiên MAE và RMSE:
    1.  MAE cho biết sai số trung bình theo đơn vị kW, dễ hiểu và ổn định hơn.
    2.  RMSE phạt mạnh các lỗi lớn, phù hợp kiểm tra sai số đỉnh tải.
    3.  MAPE chỉ dùng tham khảo và cần giải thích giới hạn.

    Trả lời như vậy cho thấy mình hiểu bản chất metric, không chỉ đọc số liệu máy móc.

---

### ❓ Câu hỏi 17: Làm sao chứng minh đây không chỉ là một app demo bật/tắt thiết bị?
*   **Câu trả lời chuẩn**: Điểm khác biệt của hệ thống nằm ở kiến trúc HEMS hoàn chỉnh hơn app bật/tắt thông thường:
    1.  Có Backend API riêng, không điều khiển cục bộ đơn lẻ.
    2.  Có phân quyền nhiều vai trò và nhiều hộ gia đình.
    3.  Có lưu lịch sử điện năng theo `home_id`.
    4.  Có collector tự ghi dữ liệu định kỳ.
    5.  Có hạn mức kWh và cảnh báo tiêu thụ.
    6.  Có Forecast API dự báo phụ tải.
    7.  Có định hướng tích hợp PLC công nghiệp và MFM384.

    Vì vậy hệ thống được định vị là prototype HEMS/IoT Edge-Cloud, không chỉ là app điều khiển relay.

---

### ❓ Câu hỏi 18: Nếu dữ liệu đọc từ PLC khác với trạng thái App thì hệ thống tin bên nào?
*   **Câu trả lời chuẩn**: Hệ thống phải ưu tiên **trạng thái thực tế từ PLC/status feedback**, không ưu tiên trạng thái hiển thị tạm trên App. App chỉ là giao diện gửi lệnh và hiển thị. PLC mới là lớp điều khiển tại hiện trường.

    Quy tắc đúng là:
    1.  App gửi lệnh.
    2.  Backend ghi command xuống PLC.
    3.  PLC điều khiển output.
    4.  PLC cập nhật status thật.
    5.  Backend đọc status thật.
    6.  App cập nhật lại theo status thật.

    Nếu lệnh gửi thành công nhưng relay/contactor không đóng, App phải hiển thị lỗi hoặc trạng thái không khớp. Đây là lý do cần feedback từ PLC hoặc tiếp điểm phụ contactor.

---

### ❓ Câu hỏi 19: Hướng phát triển thực tế tiếp theo nên làm gì trước?
*   **Câu trả lời chuẩn**: Thứ tự hợp lý nhất là:
    1.  Hoàn thiện tủ điện demo an toàn: PLC, relay trung gian, contactor, MFM384, tải giả/tải nhỏ.
    2.  Xác nhận PLC đọc đúng V, A, kW, kWh từ MFM384.
    3.  Xác nhận Backend đọc đúng tag PLC qua Snap7.
    4.  So sánh số liệu giữa TIA Portal, API `/api/power/current` và App Dashboard.
    5.  Sau khi dữ liệu thật ổn mới chỉnh giao diện App, biểu đồ và thuật toán quota theo dữ liệu thực.

    Không nên phát triển thêm nhiều màn hình App trước khi có dữ liệu PLC thật, vì dễ làm giao diện đẹp nhưng sai giả định kỹ thuật.
