# DÀN Ý CHI TIẾT BÀI BÁO THEO MẪU CTUT

> Trạng thái: bản khung để duyệt trước khi viết bài hoàn chỉnh.  
> Nguyên tắc: không tạo số liệu, ảnh phần cứng hoặc kết quả chưa có; mọi vị trí hình và bảng được giữ bằng chỉ dẫn nội dung, không dùng hình giả.

## 1. Định vị bài báo

**Loại bài:** Bài báo hệ thống ứng dụng trong bối cảnh mới.

**Định vị hợp lý:** Bài báo không tuyên bố đề xuất thuật toán AI mới. Đóng góp chính là tổ chức và kiểm chứng một chuỗi đo lường–điều khiển–giám sát–dự báo–quản lý phụ tải cho phòng thí nghiệm Điện công nghiệp, gồm MFM384, PLC S7-1200, Web/App và mô-đun dự báo 24 giờ.

**Câu trung tâm mà toàn bài phải trả lời:**

> Làm thế nào xây dựng và kiểm chứng một mô hình giám sát năng lượng có khả năng đo đại lượng điện, điều khiển phụ tải từ xa, dự báo phụ tải 24 giờ và hỗ trợ quản lý theo Quota trong phòng thí nghiệm Điện công nghiệp?

### Chuỗi logic nghiên cứu

| Thành phần | Nội dung dự kiến |
|---|---|
| Bối cảnh | Phòng thí nghiệm cần đo điện năng, giám sát phụ tải, điều khiển an toàn và hỗ trợ lập kế hoạch sử dụng điện |
| Hạn chế 1 | Nhiều HEMS tập trung vào nhà ở hoặc thuật toán, chưa thể hiện đầy đủ chuỗi công-tơ–PLC–cơ cấu đóng cắt–phản hồi tải |
| Hạn chế 2 | Dự báo phụ tải thường được báo cáo tách khỏi Quota, cảnh báo và quyết định vận hành |
| Hạn chế 3 | Ứng dụng IoT dễ được mô tả như sản phẩm phần mềm nhưng thiếu log phần cứng, trạng thái tiếp điểm và kịch bản an toàn |
| Mục tiêu | Xây dựng và kiểm chứng chuỗi MFM384–S7-1200–relay/contactor–phụ tải–Web/App–dự báo 24 giờ |
| Thách thức 1 | Đồng bộ phép đo V/I/P/E và xác định đúng thanh ghi, hệ số tỉ lệ, chu kỳ lấy mẫu |
| Thách thức 2 | Bảo đảm lệnh điều khiển có phản hồi thật, timeout, liên động, thao tác tay và trạng thái an toàn |
| Thách thức 3 | Đánh giá dự báo đúng thứ tự thời gian và chỉ dùng dự báo cho Quota trong phạm vi bằng chứng cho phép |
| Mô-đun A | Đo lường và thu thập dữ liệu điện |
| Mô-đun B | Điều khiển PLC, phản hồi trạng thái và quản lý tải |
| Mô-đun C | Dự báo phụ tải 24 giờ, cảnh báo Quota và giao diện vận hành |

## 2. Phần đầu bài theo mẫu tạp chí

### Tên bài tiếng Việt đề xuất

**THIẾT KẾ MÔ HÌNH GIÁM SÁT NĂNG LƯỢNG VÀ DỰ BÁO PHỤ TẢI CHO PHÒNG THÍ NGHIỆM ĐIỆN CÔNG NGHIỆP**

### Tên bài tiếng Anh

**Design of an Energy Monitoring and Load Forecasting Model for an Industrial Electrical Engineering Laboratory**

### Thông tin tác giả

- Họ và tên tác giả.
- Khoa/đơn vị, Trường Đại học Kỹ thuật – Công nghệ Cần Thơ.
- Email tác giả chịu trách nhiệm.
- Thông tin đồng tác giả nếu có.

### Tóm tắt tiếng Việt — khung 150–200 từ

Viết thành một đoạn duy nhất theo sáu ý:

1. **Bối cảnh:** nhu cầu giám sát và quản lý phụ tải trong phòng thí nghiệm Điện công nghiệp.
2. **Mô hình:** MFM384 đo V/I/P/E; PLC S7-1200 thu thập, điều khiển relay/contactor và đọc phản hồi.
3. **IoT:** Web/App hỗ trợ tài khoản, giám sát, gửi lệnh, cảnh báo và Quota.
4. **AI:** Random Forest và XGBoost dự báo trực tiếp h+1 đến h+24.
5. **Đánh giá:** nêu bộ dữ liệu, cách chia theo thời gian và các kịch bản phần cứng thật đã thực hiện.
6. **Kết quả–giới hạn:** chỉ điền số đã được kiểm chứng; nói rõ phần nào chưa có log hoặc chưa thử tải.

Không đưa trích dẫn, hình, bảng hoặc giải thích dài vào tóm tắt.

### Từ khóa

`dự báo phụ tải; giám sát năng lượng; MFM384; PLC S7-1200; quản lý phụ tải`

### Abstract và Keywords

Dịch học thuật từ bản tiếng Việt đã chốt; không dịch máy từng câu. Số liệu, phạm vi và giới hạn phải giống hoàn toàn bản tiếng Việt.

---

# 1. ĐẶT VẤN ĐỀ

## Đoạn 1 — Bối cảnh và nhu cầu thực tế

**Nội dung cần viết:**

- Phòng thí nghiệm Điện công nghiệp có nhiều tải với đặc tính và mức ưu tiên khác nhau.
- Việc chỉ quan sát điện năng tổng không đủ để điều khiển, cảnh báo hoặc lập kế hoạch.
- HEMS và IoT cho phép kết hợp đo lường, giám sát từ xa và quản lý nhu cầu.

**Bằng chứng cần dẫn:** 2–3 bài tổng quan HEMS/demand response.

## Đoạn 2 — Các hướng nghiên cứu hiện có

**Nội dung cần viết:**

- Hướng 1: kiến trúc HEMS và thiết bị đo.
- Hướng 2: dự báo phụ tải bằng học máy.
- Hướng 3: đáp ứng nhu cầu, Quota hoặc lập lịch phụ tải.

Không liệt kê từng bài báo độc lập; phải nhóm theo hướng và nhận xét.

## Đoạn 3 — Khoảng trống nghiên cứu

**Lập luận dự kiến:**

- Các nghiên cứu liên quan chưa đồng thời chứng minh chuỗi MFM384–PLC–cơ cấu đóng cắt–Web/App–dự báo trong bối cảnh phòng thí nghiệm.
- Kết quả phần mềm không tự chứng minh tải điện đã đóng/cắt thành công.
- Dự báo tốt trên dữ liệu công khai không tự chứng minh độ chính xác tại mô hình địa phương.

### Bảng 1. Đối chiếu các nghiên cứu gần đề tài

| Công trình | Đối tượng điện | Thiết bị/chuỗi đo | Điều khiển tải | Dự báo | Quota/DR | Loại bằng chứng |
|---|---|---|---|---|---|---|
| Nghiên cứu A | Nhà ở | Smart meter | Có/không | Có/không | Có/không | Mô phỏng/thực nghiệm |
| Nghiên cứu B | Cộng đồng năng lượng | Công-tơ | Có/không | Có | Có/không | Dữ liệu công khai |
| Nghiên cứu này | Phòng thí nghiệm | MFM384–S7-1200 | Relay/contactor | 24 giờ | Quota | Phần mềm + benchmark + thử tải thật |

**Yêu cầu:** chỉ điền “thử tải thật” sau khi có log được chấp nhận.

## Đoạn 4 — Mục tiêu, câu hỏi và đóng góp

### Câu hỏi nghiên cứu

- **RQ1:** Chuỗi thiết bị nào cho phép đo V/I/P/E, truyền dữ liệu và phản hồi đúng trạng thái phụ tải?
- **RQ2:** Web/App và PLC phối hợp như thế nào để gửi lệnh, từ chối, timeout và giữ trạng thái an toàn?
- **RQ3:** Random Forest và XGBoost dự báo h+1 đến h+24 như thế nào so với các đường cơ sở theo thứ tự thời gian?
- **RQ4:** Dự báo và Quota được sử dụng thế nào để cảnh báo, khuyến nghị hoặc sa thải phụ tải trong phạm vi đã kiểm chứng?

### Ba đóng góp dự kiến

1. Thiết kế chuỗi đo–điều khiển cho mô hình phòng thí nghiệm.
2. Xây dựng cơ chế giám sát từ xa, phản hồi PLC, Quota và quản lý người dùng.
3. Đánh giá mô-đun dự báo 24 giờ và xác lập quy trình kiểm chứng phần cứng–phần mềm.

---

# 2. CƠ SỞ LÝ THUYẾT VÀ MÔ HÌNH ĐỀ XUẤT

## 2.1. Cơ sở đo lường và truyền thông

**Nội dung cần trình bày:**

- Ý nghĩa của điện áp, dòng điện, công suất tác dụng, công suất phản kháng, hệ số công suất và điện năng.
- RS-485 và Modbus RTU: địa chỉ thiết bị, mã hàm, thanh ghi, kiểu dữ liệu, thứ tự byte và xử lý lỗi.
- Vai trò MFM384 và yêu cầu dùng đúng manual của model đang lắp.

**Không được tự điền:** địa chỉ thanh ghi, hệ số nhân hoặc cấp chính xác khi chưa xác minh manual.

## 2.2. Tổng quan mô hình đề xuất

### Hình 1. Kiến trúc tổng thể của mô hình giám sát năng lượng

**Loại hình:** sơ đồ vector, không phải ảnh chụp.

**Thành phần bắt buộc:**

- MFM384.
- RS-485/Modbus RTU.
- PLC Siemens S7-1200.
- Relay/contactor và phụ tải.
- Cổng truyền thông PLC.
- Kho dữ liệu điện.
- Mô-đun dự báo 24 giờ.
- Web Dashboard và ứng dụng di động.

**Các đường mũi tên:**

- Màu xanh lá/nét đứt: dữ liệu đo V/I/P/E.
- Màu xanh dương/nét liền: lệnh điều khiển.
- Màu cam: phản hồi trạng thái và dự báo.

**Chú thích dự kiến:**

> Hình 1. Kiến trúc mô hình gồm chuỗi đo MFM384–S7-1200, chuỗi điều khiển relay/contactor có phản hồi và lớp Web/App hỗ trợ giám sát, dự báo và quản lý phụ tải.

## 2.3. Phần cứng và mạch điều khiển

**Nội dung cần viết:**

- Nguồn cấp, MFM384, PLC, module truyền thông nếu có.
- Relay/contactor, bảo vệ ngắn mạch/quá tải và phụ tải.
- Cách ly mạch lực–mạch điều khiển.
- Tiếp điểm phản hồi, nút dừng khẩn và manual override.

### Bảng 2. Danh mục thiết bị và chức năng

| Thiết bị | Model/thông số | Đại lượng hoặc tín hiệu | Giao tiếp | Vai trò | Trạng thái kiểm chứng |
|---|---|---|---|---|---|
| Công-tơ đa năng | MFM384 | V/I/P/Q/PF/E | RS-485 | Đo năng lượng | Điền sau khi xác minh |
| PLC | S7-1200 | I/O, logic liên động | S7/Modbus | Điều khiển | Điền theo chương trình thật |
| Cơ cấu đóng cắt | Relay/contactor | Command/feedback | Digital I/O | Đóng cắt tải | Cần thử tải |
| Phụ tải | Tên và công suất định mức | P, trạng thái | Mạch lực | Đối tượng thử nghiệm | Cần ảnh và log |

### Hình 2. Mô hình phần cứng thực nghiệm

**Loại hình:** ảnh thật gồm 3–4 panel.

- **(a)** Toàn cảnh mô hình.
- **(b)** MFM384 và dây RS-485.
- **(c)** PLC S7-1200, ngõ vào/ra và nguồn điều khiển.
- **(d)** Relay/contactor, thiết bị bảo vệ và phụ tải.

**Cách chụp:**

- Nền gọn, ánh sáng đều, không dùng ảnh nghiêng hoặc mờ.
- Có mũi tên/nhãn ngắn; không che dây và terminal quan trọng.
- Che mật khẩu, địa chỉ IP công khai hoặc thông tin cá nhân.

**Chú thích dự kiến:**

> Hình 2. Mô hình thực nghiệm gồm MFM384, PLC S7-1200, cơ cấu đóng cắt và các phụ tải sử dụng trong quá trình thu thập dữ liệu và kiểm tra điều khiển.

**Trạng thái:** chưa được phép chèn cho đến khi có ảnh thật.

## 2.4. Web Dashboard, ứng dụng di động và Phân hệ Cảnh báo Telegram API

**Nội dung cần viết ở mức vừa đủ:**

- Tài khoản và phạm vi thiết bị được phép xem/điều khiển.
- Dashboard hiển thị đại lượng điện và trạng thái tải.
- Giao diện gửi lệnh và nhận kết quả có nguyên nhân.
- Quota, cảnh báo và khuyến nghị vận hành.
- **Phân hệ Cảnh báo Sự cố Đa kênh (Telegram Bot API):**
  - Tự động phát tin nhắn Push Notification tức thời (<1s) qua HTTPS REST API khi công suất vượt hạn mức HEMS hoặc mô hình AI phát hiện bất thường (Anomaly).
  - Tích hợp bộ lọc chống rác tin nhắn (Rate-Limiting Cooldown Gate, $T_{\text{cooldown}} = 300\text{s}$) bảo đảm không tắc nghẽn thông báo.
  - Định dạng văn bản HTML giàu thông tin (Công suất thực, Ngưỡng hạn mức, % Tiêu thụ, Chẩn đoán AI).

Không trình bày chi tiết framework, endpoint hoặc cấu trúc mã nguồn nếu không phục vụ lập luận điện.


### Hình 3. Giao diện giám sát và quản lý phụ tải

**Loại hình:** ảnh chụp màn hình thật, 3 panel.

- **(a)** Dashboard V/I/P/E và điện năng.
- **(b)** Dự báo phụ tải 24 giờ và trạng thái Quota.
- **(c)** Điều khiển thiết bị kèm phản hồi thành công, từ chối, lỗi hoặc timeout.

**Không đưa vào hình chính:**

- Màn hình đăng nhập.
- Ảnh phòng trang trí.
- Trang cài đặt không liên quan.
- Chatbot nếu chưa đánh giá độ đúng và thời gian phản hồi.

**Chú thích dự kiến:**

> Hình 3. Giao diện Web/App hỗ trợ quan sát đại lượng điện, theo dõi dự báo–Quota và gửi lệnh điều khiển kèm trạng thái phản hồi.

**Trạng thái:** có thể chụp từ ứng dụng hiện tại sau khi dùng dữ liệu đúng và che thông tin nhạy cảm.

## 2.5. Logic điều khiển PLC và quản lý phụ tải

**Nội dung cần viết:**

- Trạng thái mong muốn và trạng thái thực.
- Chỉ phát xung khi mục tiêu chưa đạt.
- Đọc statusTag/tiếp điểm độc lập để xác nhận.
- Timeout, mất kết nối, từ chối quyền và trạng thái an toàn.
- Phân biệt Quota năng lượng với ngưỡng công suất tức thời.
- Nếu có sa thải tự động: ưu tiên tải, hysteresis, thời gian giữ, dừng khẩn và khôi phục.

### Hình 4. Trình tự điều khiển và xác nhận phản hồi

**Loại hình:** sơ đồ tuần tự vector.

**Bốn lane:**

1. Giao diện vận hành.
2. Kiểm tra yêu cầu/Quota/liên động.
3. Cổng truyền thông PLC.
4. S7-1200 và statusTag/tiếp điểm.

**Chú thích dự kiến:**

> Hình 4. Lệnh chỉ được báo thành công sau khi trạng thái phản hồi độc lập khớp với trạng thái yêu cầu; timeout hoặc mất kết nối được trả về như lỗi.

## 2.6. Mô hình dự báo phụ tải 24 giờ

**Nội dung cần viết:**

- Nguồn dữ liệu và khoảng thời gian.
- Tổng hợp dữ liệu theo giờ.
- Cách xử lý thiếu theo chiều thời gian.
- Đặc trưng thời gian, độ trễ và thống kê trượt.
- Random Forest, XGBoost và ba baseline.
- Dự báo trực tiếp h+1 đến h+24.
- Không nói có thời tiết nếu benchmark chưa có biến thời tiết.

### Bảng 3. Cấu hình dữ liệu và mô hình dự báo

| Nhóm | Nội dung cần báo cáo |
|---|---|
| Dữ liệu | Nguồn, số bản ghi, chu kỳ và giá trị thiếu |
| Tiền xử lý | Tổng hợp giờ, causal fill, cửa sổ bị loại |
| Đặc trưng | Thời gian, lag, rolling, V/I/Q/sub-metering |
| Random Forest | Số cây, độ sâu, seed |
| XGBoost | Số cây, độ sâu, learning rate, seed |
| Đầu ra | 24 bộ ước lượng cho h+1…h+24 |

---

# 3. THIẾT KẾ THỰC NGHIỆM

## 3.1. Bố trí mô hình và quy trình thu dữ liệu

**Cần trình bày:**

- Sơ đồ mạch lực và mạch điều khiển.
- Danh sách tải và công suất định mức.
- Chu kỳ lấy mẫu.
- Đồng bộ timestamp giữa MFM384, PLC và máy chủ.
- Thiết bị tham chiếu nếu đánh giá sai số đo.
- Thời lượng thu dữ liệu và điều kiện vận hành.

## 3.2. Kịch bản kiểm chứng

### Bảng 4. Ma trận kịch bản thử nghiệm

| Mã | Kịch bản | Tác động | Dữ liệu phải ghi | Chỉ tiêu |
|---|---|---|---|---|
| S1 | Giám sát không tải/có tải | Đóng tải theo kế hoạch | V/I/P/E, timestamp | Sai số/độ ổn định |
| S2 | Điều khiển từ App | Bật/tắt tải | Command, statusTag, tiếp điểm | Tỷ lệ thành công, RTT |
| S3 | Mất kết nối/timeout | Ngắt gateway hoặc PLC | Mã lỗi, trạng thái tải | Fail-closed |
| S4 | Gần/chạm Quota | Tăng điện năng tích lũy | E, Q, cảnh báo | Đúng thời điểm cảnh báo |
| S5 | Sa thải phụ tải | Vượt ngưỡng đã định | P trước–sau, tải bị cắt | Thời gian cắt, tải ưu tiên |
| S6 | Manual override/khôi phục | Thao tác tại chỗ | Trạng thái, log phục hồi | An toàn và khả năng phục hồi |

**Lưu ý:** S5 chỉ được gọi là kết quả nếu đã thử với tải thật và có liên động an toàn.

## 3.3. Thiết kế đánh giá dự báo

**Nội dung cần viết:**

- Chia expanding rolling-origin.
- Train/validation/test theo thứ tự thời gian.
- Seed và số lần chạy.
- MAE là chỉ tiêu chính; RMSE, R² và MAPE là bổ sung.
- Không chọn mô hình bằng tập test.
- Không dùng kiểm định thống kê nếu số fold chưa đủ.

---

# 4. KẾT QUẢ VÀ THẢO LUẬN

## 4.1. Kết quả đo lường và giám sát

**Chỉ viết sau khi có log thật.**

Nội dung dự kiến:

- So sánh MFM384 với thiết bị tham chiếu.
- Khả năng thu dữ liệu liên tục.
- Tỷ lệ mất mẫu và sai timestamp.
- Một đoạn nhận xét nguyên nhân sai số.

### Hình 5. Diễn biến đại lượng điện và trạng thái phụ tải

**Loại hình:** đồ thị thời gian.

- Trục X: thời gian.
- Panel trên: công suất \(P\) hoặc điện năng.
- Panel giữa: điện áp/dòng điện.
- Panel dưới: trạng thái ON/OFF hoặc sự kiện điều khiển.

**Trạng thái:** chỉ tạo từ log thật; không dùng dữ liệu mô phỏng để đại diện phần cứng.

## 4.2. Kết quả điều khiển, Quota và sa thải phụ tải

### Bảng 5. Kết quả kịch bản điều khiển

| Kịch bản | Số lần thử | Thành công | Timeout/lỗi | Thời gian phản hồi | Trạng thái an toàn |
|---|---:|---:|---:|---:|---|
| Bật tải | [DỮ LIỆU] | [DỮ LIỆU] | [DỮ LIỆU] | [DỮ LIỆU] | [NHẬN XÉT] |
| Tắt tải | [DỮ LIỆU] | [DỮ LIỆU] | [DỮ LIỆU] | [DỮ LIỆU] | [NHẬN XÉT] |
| Mất kết nối | [DỮ LIỆU] | — | [DỮ LIỆU] | [DỮ LIỆU] | [NHẬN XÉT] |
| Sa thải tải | [DỮ LIỆU] | [DỮ LIỆU] | [DỮ LIỆU] | [DỮ LIỆU] | [NHẬN XÉT] |

Không điền số ước lượng hoặc số “đẹp” để hoàn thiện bảng.

## 4.3. Kết quả dự báo phụ tải

**Phần đã có thể viết:**

- So sánh Persistence, Seasonal Naive 24 h, Seasonal Naive 168 h, Random Forest và XGBoost.
- Báo cáo mean ± sample SD.
- Nhấn mạnh RF và XGBoost gần tương đương nếu chênh lệch nhỏ hơn độ phân tán.
- Giới hạn kết quả trong phạm vi UCI.

### Hình 6. Sai số dự báo theo chân trời

**Loại hình:** hai panel MAE và RMSE.

- Các chân trời đại diện: h+1, h+6, h+12, h+24.
- Mỗi mô hình có màu + marker + kiểu đường riêng.
- Có error bar và đơn vị kW.

### Bảng 6. Kết quả benchmark dự báo

| Mô hình | MAE (kW) | RMSE (kW) | MAPE (%) | R² | Số lần chạy |
|---|---:|---:|---:|---:|---:|
| Persistence | Kết quả chuẩn hóa | Kết quả chuẩn hóa | Kết quả chuẩn hóa | Kết quả chuẩn hóa | n |
| Seasonal naive 24 h | Kết quả chuẩn hóa | Kết quả chuẩn hóa | Kết quả chuẩn hóa | Kết quả chuẩn hóa | n |
| Seasonal naive 168 h | Kết quả chuẩn hóa | Kết quả chuẩn hóa | Kết quả chuẩn hóa | Kết quả chuẩn hóa | n |
| Random Forest | Kết quả chuẩn hóa | Kết quả chuẩn hóa | Kết quả chuẩn hóa | Kết quả chuẩn hóa | n |
| XGBoost | Kết quả chuẩn hóa | Kết quả chuẩn hóa | Kết quả chuẩn hóa | Kết quả chuẩn hóa | n |

## 4.4. Thảo luận

Trình bày theo bốn ý:

1. Mô hình giải quyết được gì cho phòng thí nghiệm Điện công nghiệp?
2. Tại sao phản hồi PLC/tiếp điểm quan trọng hơn xác nhận của phần mềm?
3. Dự báo hỗ trợ Quota và vận hành đến mức nào, chưa hỗ trợ đến mức nào?
4. Vì sao kết quả UCI chưa đại diện cho dữ liệu MFM384 tại Cần Thơ?

## 4.5. Nguy cơ đối với tính hợp lệ

- **Nội tại:** chưa có thiết bị tham chiếu, số lần thử ít, timestamp không đồng bộ.
- **Ngoại tại:** một phòng thí nghiệm, số loại tải hạn chế.
- **Mô hình:** dữ liệu UCI khác khí hậu và hành vi địa phương.
- **Đo lường:** sai số công-tơ, hệ số tỉ lệ hoặc mất mẫu.
- **Phần mềm:** test mã nguồn không thay thế thử nghiệm điện.

---

# 5. KẾT LUẬN VÀ HƯỚNG PHÁT TRIỂN

## 5.1. Kết luận

Viết thành một đoạn ngắn:

- Nhắc lại mô hình đã xây dựng.
- Trả lời trực tiếp các RQ.
- Nêu kết quả chính bằng số đã kiểm chứng.
- Không lặp toàn bộ phương pháp.
- Không đưa đóng góp mới chưa xuất hiện trong bài.

## 5.2. Hạn chế và hướng phát triển

Chỉ nêu các hướng có quan hệ trực tiếp:

- Thu dữ liệu MFM384 địa phương trong thời gian dài hơn.
- Đánh giá sai số đo và độ trễ App–PLC.
- Kiểm chứng sa thải tải có interlock, manual override và phục hồi.
- Tích hợp thời tiết và thực hiện ablation test.
- Đánh giá chatbot như một mô-đun phụ nếu có bộ câu hỏi, độ đúng và độ trễ.

---

# TUYÊN BỐ DỮ LIỆU, ĐẠO ĐỨC VÀ LIÊM CHÍNH

- Nêu DOI của bộ dữ liệu công khai.
- Chỉ rõ vị trí mã và kết quả tái lập.
- Nêu dữ liệu phần cứng nào được công khai/không công khai.
- Điền đóng góp CRediT, nguồn tài trợ và xung đột lợi ích.
- Nếu có dùng AI để hỗ trợ diễn đạt, hình hoặc mã: mô tả phạm vi và xác nhận tác giả chịu trách nhiệm cuối cùng.

# TÀI LIỆU THAM KHẢO

Nhóm tài liệu cần có:

1. Tổng quan HEMS và demand response.
2. Kiến trúc HEMS có thiết bị đo và điều khiển.
3. Manual Siemens S7-1200.
4. Modbus Application Protocol và Modbus Serial Line.
5. NIST SP 800-82 Rev. 3.
6. UCI Individual Household Electric Power Consumption.
7. Random Forest, XGBoost và đánh giá chuỗi thời gian.
8. Nghiên cứu dự báo phụ tải và quản lý tải gần đây.

Không bổ sung tài liệu về UI, microservices, mật mã hoặc MLOps nếu nội dung bài không đánh giá các vấn đề đó.

---

# TỔNG HỢP HÌNH VÀ BẢNG

## Hình

| Số | Nội dung | Loại | Có thể làm ngay? |
|---:|---|---|---|
| Hình 1 | Kiến trúc tổng thể MFM384–PLC–tải–Web/App–dự báo | Sơ đồ vector | Có |
| Hình 2 | Mô hình phần cứng thực nghiệm | Ảnh thật 3–4 panel | Chưa; cần ảnh |
| Hình 3 | Dashboard, dự báo–Quota và phản hồi điều khiển | Screenshot thật 3 panel | Có thể chụp từ App |
| Hình 4 | Trình tự gửi lệnh và xác nhận statusTag | Sơ đồ vector | Có |
| Hình 5 | Diễn biến V/I/P/E và trạng thái tải | Đồ thị từ log thật | Chưa; cần log |
| Hình 6 | Sai số dự báo theo chân trời | Đồ thị tái lập | Có |

## Bảng

| Số | Nội dung | Trạng thái |
|---:|---|---|
| Bảng 1 | So sánh nghiên cứu liên quan | Có thể hoàn thiện từ tài liệu |
| Bảng 2 | Thiết bị, tín hiệu và vai trò | Cần xác nhận model/thông số |
| Bảng 3 | Dữ liệu và cấu hình dự báo | Có dữ liệu chuẩn hóa |
| Bảng 4 | Kịch bản thực nghiệm | Có thể chốt thiết kế ngay |
| Bảng 5 | Kết quả điều khiển/sa thải tải | Chưa; cần thử thật |
| Bảng 6 | Kết quả benchmark dự báo | Có dữ liệu chuẩn hóa |

# KIỂM TRA TÍNH NHẤT QUÁN

- Hạn chế → mục tiêu: **Đạt**.
- Mục tiêu → thách thức: **Đạt**.
- Thách thức → mô-đun phương pháp: **Đạt**.
- Phương pháp → đóng góp và kết quả: **Đạt có điều kiện**; phần đo lường và sa thải tải chỉ được coi là đóng góp thực nghiệm sau khi có log phần cứng.

# QUY TẮC TRƯỚC KHI VIẾT BẢN HOÀN CHỈNH

1. Chốt dàn ý và thứ tự hình/bảng.
2. Thu ảnh thật cho Hình 2.
3. Chụp App cho Hình 3 bằng dữ liệu đúng.
4. Chốt manual và thông số MFM384 cho Bảng 2.
5. Thực hiện kịch bản Bảng 4 để điền Bảng 5 và tạo Hình 5.
6. Chỉ sau đó mới viết toàn văn và xuất DOCX/PDF theo mẫu CTUT.
