# DÀN Ý CHI TIẾT BÀI BÁO THEO MẪU CTUT

> **Trạng thái:** Nguồn sửa đổi chính thức cho bản bài báo Word tiếng Việt. Mọi lần cập nhật DOCX phải lấy phạm vi, cấu trúc, số hình/bảng và ranh giới tuyên bố từ tài liệu này; số liệu chỉ lấy từ nguồn chuẩn hóa hoặc dữ liệu đo thật đã được kiểm tra.
>
> **Định vị:** Bài báo ứng dụng/kỹ thuật hệ thống; không tuyên bố đề xuất thuật toán AI mới.
>
> **Nguyên tắc bằng chứng:** Không tạo số liệu, DOI, thông số thiết bị, ảnh phần cứng hoặc kết quả chưa có. Kế hoạch thử nghiệm phải được phân biệt rõ với kết quả đã thực hiện.

> **Nguồn dữ liệu:** Kết quả phần mềm và dự báo lấy từ `research/results/canonical/canonical_results.json`. Dữ liệu phần cứng mới được nhập bằng `HEMS_Phieu_Thu_Thap_Du_Lieu_Thuc_Nghiem.xlsx`, kèm CSV/JSON/ảnh/log thô, rồi mới chuẩn hóa để đưa vào bài Word.

## Định vị và phạm vi bài báo

**Đối tượng nghiên cứu:** Mô hình phụ tải điện quy mô nhỏ được xây dựng và đặt tại Phòng thí nghiệm Điện công nghiệp, tích hợp MFM384, PLC Siemens S7-1200, cơ cấu đóng cắt, Web/App, quản lý Quota và dự báo phụ tải 24 giờ. Đây là testbed thực nghiệm có các tải được lựa chọn và vận hành có kiểm soát; không phải khảo sát toàn bộ phụ tải đang vận hành của phòng thí nghiệm.

**Chuỗi đóng góp trung tâm:**

> đo lường → thu thập dữ liệu → điều khiển có phản hồi → giám sát → dự báo → cảnh báo và hỗ trợ quản lý điện năng.

Đăng nhập, giao diện, Telegram, chatbot và kiến trúc phần mềm thông thường chỉ là thành phần hỗ trợ, không phải đóng góp khoa học chính nếu không có đánh giá riêng.

**Câu trung tâm của bài báo:**

> Làm thế nào thiết kế và kiểm chứng một mô hình phụ tải quy mô nhỏ tại Phòng thí nghiệm Điện công nghiệp có khả năng đo đại lượng điện, xác nhận điều khiển phụ tải, dự báo 24 giờ và hỗ trợ quản lý điện năng theo Quota?

## Ranh giới bằng chứng hiện tại

Đối chiếu với `research/results/canonical/canonical_results.json`:

- **Benchmark dự báo trên dữ liệu UCI:** Đã có; được báo cáo trong đúng phạm vi UCI.
- **Hợp đồng hành vi phần mềm:** Đã đồng bộ ngày 10/08/2026. `verify` đạt 60/60; `backend` 16/16; `forecast` 9/9; `research` 7/7; `frontend_contract` 20/20; `admin_audit` 5/5; `room_presentation` 3/3. Đây là bằng chứng kiểm thử phần mềm, không thay thế thử nghiệm điện–phần cứng.
- **Benchmark trên dữ liệu MFM384 địa phương:** Chưa có; chỉ là kế hoạch hoặc thử nghiệm ban đầu.
- **Độ trễ App–PLC và sai số MFM384:** Chưa có log phần cứng thật; không được nêu số đo.
- **Sa thải phụ tải tự động:** Chưa đủ bằng chứng; chỉ là chức năng nâng cao hoặc hướng phát triển.

---

## Phần đầu bài theo mẫu tạp chí

### Tên bài tiếng Việt

**GIÁM SÁT NĂNG LƯỢNG VÀ DỰ BÁO PHỤ TẢI TRÊN MÔ HÌNH NHỎ TẠI PHÒNG THÍ NGHIỆM ĐIỆN CÔNG NGHIỆP**

### Tên bài tiếng Anh

**Energy Monitoring and Load Forecasting on a Small-Scale Testbed in an Industrial Electrical Engineering Laboratory**

### Thông tin tác giả

- Họ và tên tác giả.
- Khoa/đơn vị, Trường Đại học Kỹ thuật – Công nghệ Cần Thơ.
- Email tác giả chịu trách nhiệm.
- Thông tin đồng tác giả nếu có.

### Tóm tắt tiếng Việt — khung 150–200 từ

Viết thành một đoạn duy nhất theo sáu ý:

1. **Bối cảnh:** Nhu cầu giám sát và quản lý điện năng trên mô hình phụ tải quy mô nhỏ đặt tại Phòng thí nghiệm Điện công nghiệp.
2. **Mô hình:** MFM384 đo các đại lượng điện; PLC S7-1200 thu thập, điều khiển relay/contactor và đọc phản hồi.
3. **Ứng dụng:** Web/App hỗ trợ giám sát, gửi lệnh, cảnh báo, khuyến nghị và Quota tháng.
4. **Dự báo:** Random Forest và XGBoost dự báo trực tiếp từ h+1 đến h+24.
5. **Đánh giá:** Nêu bộ dữ liệu, cách chia theo thời gian và các kịch bản phần cứng đã thực hiện thật.
6. **Kết quả–giới hạn:** Chỉ điền số đã được kiểm chứng; phân biệt kết quả UCI với dữ liệu MFM384 địa phương.

Không đưa trích dẫn, hình, bảng hoặc giải thích dài vào tóm tắt.

### Từ khóa

`dự báo phụ tải; giám sát năng lượng; MFM384; PLC S7-1200; quản lý phụ tải`

### Abstract và Keywords

Dịch học thuật từ bản tiếng Việt đã chốt. Số liệu, phạm vi, đơn vị và giới hạn phải giống hoàn toàn bản tiếng Việt.

---

# 1. ĐẶT VẤN ĐỀ

## 1.1. Bối cảnh và nhu cầu thực tế

**Nội dung cần viết:**

- Phòng thí nghiệm Điện có nhiều tải với đặc tính vận hành và mức ưu tiên khác nhau.
- Quan sát điện năng tổng chưa đủ để xác nhận điều khiển, cảnh báo hoặc hỗ trợ lập kế hoạch sử dụng điện.
- HEMS kết hợp đo lường, PLC, IoT và dự báo có thể hỗ trợ giám sát và quản lý phụ tải.

**Bằng chứng cần dẫn:** 2–3 bài tổng quan HEMS, demand response hoặc quản lý phụ tải có nguồn uy tín.

## 1.2. Các hướng nghiên cứu liên quan

Nhóm tài liệu theo hướng, không liệt kê từng bài độc lập:

- Kiến trúc HEMS, smart meter và thiết bị điều khiển.
- Dự báo phụ tải ngắn hạn bằng học máy.
- Quota, demand response, cảnh báo hoặc lập lịch phụ tải.
- Kiểm chứng hệ thống điện–điều khiển có phản hồi vật lý.

### Bảng 1. Đối chiếu các nhóm nghiên cứu gần đề tài

| Công trình | Đối tượng điện | Chuỗi đo–điều khiển | Phản hồi vật lý | Dự báo | Quota/DR | Loại bằng chứng |
|---|---|---|---|---|---|---|
| Nghiên cứu A | [ĐIỀN TỪ TÀI LIỆU] | [DỮ LIỆU] | [DỮ LIỆU] | [DỮ LIỆU] | [DỮ LIỆU] | Mô phỏng/thực nghiệm |
| Nghiên cứu B | [ĐIỀN TỪ TÀI LIỆU] | [DỮ LIỆU] | [DỮ LIỆU] | [DỮ LIỆU] | [DỮ LIỆU] | Dữ liệu công khai/thực nghiệm |
| Nghiên cứu này | Testbed phòng thí nghiệm | MFM384–S7-1200–tải–Web/App | Theo log/tiếp điểm thật | 24 giờ | Quota và cảnh báo | Phần mềm + UCI + thử nghiệm thật nếu có |

**Quy tắc:** Chỉ ghi “thử nghiệm thật” sau khi có log được chấp nhận; không tạo tên bài báo hoặc DOI.

## 1.3. Khoảng trống nghiên cứu

Lập luận phải tập trung vào loại bằng chứng, không dựa riêng vào việc chưa có công trình sử dụng đúng tổ hợp MFM384 và S7-1200:

- Thiếu kiểm chứng end-to-end từ công-tơ đến PLC, cơ cấu đóng cắt và phản hồi vật lý.
- Kết quả phần mềm không tự chứng minh tải điện thật đã đóng hoặc cắt.
- Kết quả dự báo trên dữ liệu công khai không tự chứng minh độ chính xác tại hệ thống địa phương.
- Quota, cảnh báo và dự báo chưa phải lúc nào cũng được đánh giá cùng chuỗi điều khiển có phản hồi.

Mọi nhận xét về nghiên cứu trước phải có tài liệu hỗ trợ và được diễn đạt thận trọng.

## 1.4. Mục tiêu, câu hỏi và đóng góp

### Câu hỏi nghiên cứu

- **RQ1:** Chuỗi MFM384–PLC S7-1200–cơ cấu đóng cắt có thể thu thập đại lượng điện và xác nhận trạng thái phụ tải như thế nào?
- **RQ2:** Random Forest và XGBoost dự báo phụ tải 24 giờ như thế nào so với các phương pháp cơ sở khi đánh giá theo đúng thứ tự thời gian?
- **RQ3:** Điện năng tháng, Quota và kết quả dự báo được dùng để tạo cảnh báo, khuyến nghị như thế nào; đồng thời cần các điều kiện nào trước khi cho phép sa thải tải?

### Ba đóng góp dự kiến

1. Thiết kế chuỗi đo–điều khiển có phản hồi cho testbed phòng thí nghiệm.
2. Xây dựng cơ chế giám sát, Quota tháng, cảnh báo và khuyến nghị hỗ trợ quyết định trên Web/App; không đồng nhất các chức năng này với tối ưu hóa hoặc sa thải tải.
3. Đánh giá mô-đun dự báo 24 giờ trên dữ liệu công khai và xây dựng quy trình kiểm chứng dữ liệu MFM384 địa phương.

**Giới hạn đóng góp:** Đóng góp 1 và phần dữ liệu địa phương của đóng góp 3 chỉ được gọi là kết quả thực nghiệm sau khi có log phần cứng thật.

---

# 2. MÔ HÌNH VÀ PHƯƠNG PHÁP NGHIÊN CỨU

## 2.1. Đo lường, truyền thông và cách xác định Quota

Chỉ trình bày cơ sở trực tiếp phục vụ phương pháp:

- Các đại lượng thực sự được MFM384 thu thập: điện áp, dòng điện, công suất tác dụng, công suất phản kháng, hệ số công suất và điện năng.
- Modbus RTU qua RS-485: địa chỉ thiết bị, mã hàm, thanh ghi, kiểu dữ liệu, byte order, hệ số tỉ lệ, timeout và xử lý lỗi.
- Chỉ điền thanh ghi, hệ số nhân và cấp chính xác sau khi xác minh đúng manual của model MFM384 đang lắp.
- Phân biệt công suất tức thời \(P\) theo kW và điện năng tích lũy \(E\) theo kWh.

### Cách tính điện năng tháng và Quota

Quota là hạn mức **điện năng theo tháng**, đơn vị kWh; không phải ngưỡng công suất tức thời theo kW.

Backend tính điện năng tháng từ `power_readings.energy_kwh` theo nguyên tắc:

\[
E_{\text{month}}(t)=\max(E_{\text{kWh}}[t_0,t])-\min(E_{\text{kWh}}[t_0,t]),
\]

trong đó \(t_0\) là thời điểm bắt đầu tháng. Hệ thống không reset công-tơ MFM384 vật lý vào đầu tháng.

Khi gần hoặc vượt Quota, chức năng chính là:

1. Cảnh báo người dùng.
2. Hiển thị mức sử dụng và phần còn lại.
3. Đề xuất tiết kiệm hoặc điều chỉnh lịch vận hành.

Không mặc định tự động cắt tải khi vượt Quota. Quota nhỏ dùng cho kiểm thử phải được ghi rõ là ngưỡng thử nghiệm, không phải hạn mức tiêu thụ thực tế của cả tháng.

**Ranh giới thuật ngữ bắt buộc trong toàn bài:**

- **Cảnh báo:** thông báo khi một điều kiện hoặc ngưỡng được kích hoạt; không tự thay đổi trạng thái tải.
- **Khuyến nghị:** gợi ý dựa trên quy tắc, Quota hoặc dự báo để người dùng cân nhắc; không phải kết quả tối ưu toán học.
- **Tối ưu hóa:** chỉ được dùng khi có hàm mục tiêu, biến quyết định, ràng buộc, thuật toán, phương án đối chứng và kết quả định lượng. Bằng chứng hiện tại chưa cho phép tuyên bố hệ thống đã tối ưu hóa lịch vận hành.
- **Sa thải tải:** hành động điều khiển vật lý có thứ tự ưu tiên và điều kiện an toàn; phải có phản hồi độc lập, interlock, manual override, dừng khẩn và log thực nghiệm. Không suy ra sa thải tải từ cảnh báo hoặc khuyến nghị.

## 2.2. Kiến trúc tổng thể

### Hình 1. Kiến trúc tổng thể của mô hình phụ tải quy mô nhỏ tại Phòng thí nghiệm Điện công nghiệp

**Loại hình:** Sơ đồ vector.

**Thành phần bắt buộc:**

- MFM384.
- RS-485/Modbus RTU.
- PLC Siemens S7-1200.
- Relay/contactor và phụ tải.
- Cổng truyền thông PLC.
- Kho dữ liệu điện.
- Mô-đun dự báo 24 giờ.
- Web Dashboard và ứng dụng di động.

**Luồng cần thể hiện:** dữ liệu đo, lệnh điều khiển, phản hồi trạng thái, dự báo và cảnh báo.

**Chú thích dự kiến:**

> Hình 1. Kiến trúc mô hình phụ tải quy mô nhỏ đặt tại Phòng thí nghiệm Điện công nghiệp, gồm chuỗi đo MFM384–S7-1200, chuỗi điều khiển relay/contactor có phản hồi và lớp Web/App hỗ trợ giám sát, dự báo và quản lý điện năng.

## 2.3. Phần cứng và mạch điều khiển

**Nội dung cần viết:**

- Nguồn cấp, MFM384, PLC và module truyền thông nếu có.
- Relay/contactor, bảo vệ ngắn mạch/quá tải và tải thử nghiệm.
- Cách ly mạch lực–mạch điều khiển.
- Tiếp điểm phản hồi, nút dừng khẩn và manual override.
- Sơ đồ mạch lực, mạch điều khiển và công suất định mức của từng tải.

### Bảng 2. Danh mục thiết bị, tín hiệu và trạng thái kiểm chứng

| Thiết bị | Model/thông số | Đại lượng hoặc tín hiệu | Giao tiếp | Vai trò | Trạng thái kiểm chứng |
|---|---|---|---|---|---|
| Công-tơ đa năng | MFM384; thông số chờ manual | V/I/P/Q/PF/E | RS-485 | Đo điện | `[CHỜ XÁC MINH]` |
| PLC | S7-1200; CPU/module thực tế | I/O, logic liên động | S7/Modbus | Điều khiển | `[ĐIỀN THEO CHƯƠNG TRÌNH THẬT]` |
| Cơ cấu đóng cắt | Relay/contactor thực tế | Command/feedback | Digital I/O | Đóng cắt tải | `[CHỈ VIẾT SAU KHI CÓ LOG THẬT]` |
| Tải thử nghiệm | Tên và công suất định mức | P, trạng thái | Mạch lực | Đối tượng thử | `[CHỜ ẢNH VÀ LOG]` |

### Hình 2. Mô hình phần cứng thực nghiệm

**Loại hình:** Ảnh thật gồm 3–4 panel: toàn cảnh, MFM384/RS-485, PLC/I/O và relay/contactor/tải.

**Trạng thái:** `[CHƯA CÓ ẢNH THỰC NGHIỆM ĐƯỢC CHẤP NHẬN]`.

Không chèn ảnh minh họa giả; che mật khẩu, địa chỉ IP công khai và thông tin cá nhân.

## 2.4. Logic điều khiển PLC và phản hồi trạng thái

**Nội dung cần viết:**

- Phân biệt trạng thái yêu cầu và trạng thái thực.
- Chỉ phát lệnh khi mục tiêu chưa đạt.
- Dùng `statusTag` hoặc tiếp điểm độc lập để xác nhận.
- Chỉ báo thành công khi trạng thái phản hồi khớp với yêu cầu.
- Timeout, mất kết nối, từ chối quyền và trạng thái fail-closed.
- Interlock, manual override, dừng khẩn và trình tự khôi phục.

Mô tả trình tự điều khiển bằng đoạn thuật toán ngắn; không dùng thêm hình tuần tự riêng để bảo đảm giới hạn hình/bảng của tạp chí.

### Vị trí của sa thải phụ tải

Sa thải phụ tải là chức năng nâng cao, có điều kiện, chỉ áp dụng cho tải phi thiết yếu khi người dùng cho phép/cấu hình hoặc trong thử nghiệm được kiểm soát.

Chỉ được báo cáo là kết quả sau khi có tải thật, contactor/relay phù hợp, phản hồi độc lập, interlock, manual override, dừng khẩn, log trước–sau và người có chuyên môn giám sát. Nếu thiếu một trong các điều kiện này, nội dung chỉ được đặt ở phần hướng phát triển.

Sa thải tải không phải là tên gọi khác của cảnh báo, khuyến nghị hoặc tối ưu hóa. Trong bản bài báo hiện tại, cảnh báo/khuyến nghị thuộc lớp hỗ trợ quyết định; tối ưu hóa chưa được tuyên bố; sa thải tải vẫn là kịch bản kiểm chứng an toàn chưa có bằng chứng thực nghiệm.

## 2.5. Web/App, Quota và cảnh báo

**Nội dung ở mức vừa đủ:**

- Tài khoản và phạm vi thiết bị được phép xem/điều khiển.
- Dashboard hiển thị đại lượng điện và trạng thái tải.
- Giao diện gửi lệnh và nhận kết quả thành công, từ chối, lỗi hoặc timeout.
- Điện năng tháng, Quota, cảnh báo và khuyến nghị vận hành.
- Telegram Bot API hỗ trợ gửi cảnh báo và dùng cooldown để hạn chế thông báo lặp.

Không tuyên bố độ trễ Telegram `<1 s` khi chưa có log đo thực nghiệm. Chỉ giữ \(T_{\text{cooldown}}=300\,\text{s}\) nếu đối chiếu được với cấu hình hoặc mã nguồn hiện tại.

Phát hiện bất thường chỉ là chức năng phụ/hướng phát triển nếu chưa có định nghĩa bất thường, dữ liệu hoặc quy tắc đối chiếu, Precision, Recall, F1-score và log thử nghiệm.

Giao diện không chiếm một hình độc lập. Nếu cần chứng minh khả năng sử dụng, chèn một ảnh nhỏ đã ẩn danh vào **Hình 3** cùng đồ thị đo thật; ảnh này chỉ minh họa cách người dùng quan sát dữ liệu và phản hồi điều khiển. Không dùng màn hình đăng nhập, ảnh trang trí hoặc chatbot chưa được đánh giá.

## 2.6. Mô hình dự báo phụ tải 24 giờ

**Nội dung cần viết:**

- Nguồn dữ liệu, khoảng thời gian và đơn vị.
- Tổng hợp dữ liệu theo giờ.
- Xử lý thiếu theo chiều thời gian, chỉ sử dụng dữ liệu quá khứ.
- Đặc trưng thời gian, độ trễ và thống kê trượt.
- Persistence, Seasonal Naive 24 h, Seasonal Naive 168 h, Random Forest và XGBoost.
- Dự báo trực tiếp h+1 đến h+24.
- Không nói mô hình sử dụng thời tiết nếu benchmark chưa có biến thời tiết.

Để giữ giới hạn 4 bảng, cấu hình dự báo được viết gọn trong văn bản phương pháp, không tách thành bảng riêng: dữ liệu UCI gồm 17.521 dòng theo giờ và 15.321 mẫu có giám sát; dữ liệu thiếu được xử lý theo chiều thời gian với causal fill tối đa 6 giờ và không dùng giá trị điền làm mục tiêu; đánh giá expanding rolling-origin gồm 3 fold; seed 42, 3407 và 2026; Random Forest dùng 25 cây, độ sâu tối đa 12; XGBoost dùng 75 cây, độ sâu tối đa 5 và learning rate 0,035; đầu ra là dự báo trực tiếp h+1…h+24. Mọi giá trị phải tiếp tục lấy từ `canonical_results.json`, không sao chép từ tài liệu trạng thái cũ.

## 2.7. Kế hoạch thu thập dữ liệu trên mô hình tại Phòng thí nghiệm Điện công nghiệp

### Vai trò của testbed

> Dữ liệu phòng thí nghiệm được dùng để kiểm chứng chuỗi đo lường, truyền thông, điều khiển, Quota và khả năng vận hành của mô hình thực nghiệm. Dữ liệu này chưa đại diện đầy đủ cho hành vi tiêu thụ điện của hộ gia đình.

Phiếu nhập chính thức là `outputs/20260712-smart-home-research/HEMS_Phieu_Thu_Thap_Du_Lieu_Thuc_Nghiem.xlsx`. Mỗi dòng phải giữ `session_id`, timestamp, nguồn dữ liệu, trạng thái chất lượng và đường dẫn bằng chứng thô. Workbook chỉ là phiếu ghi nhận; số liệu chỉ được đưa vào bài sau khi đối chiếu CSV/JSON/log/ảnh gốc và chạy bước chuẩn hóa.

Phân chia vai trò dữ liệu:

- **UCI:** benchmark dự báo phụ tải hộ gia đình.
- **MFM384 tại phòng thí nghiệm:** kiểm chứng tích hợp phần cứng và đánh giá thử nghiệm ban đầu.
- Không dùng UCI để khẳng định độ chính xác tại phòng thí nghiệm Cần Thơ.
- Không dùng dữ liệu phòng thí nghiệm ngắn hạn để khẳng định khả năng tổng quát cho hộ gia đình.

### Thời gian và chu kỳ lấy mẫu dự kiến

- Thu trong 30 ngày theo lịch.
- MFM384, PLC và máy chủ ghi tự động 24 giờ/ngày nếu quy định và điều kiện an toàn cho phép.
- Chỉ để hệ thống đo/ghi hoạt động ngoài giờ; không để tải công suất nguy hiểm vận hành không giám sát.
- Phụ tải vận hành có chủ đích khoảng 6–8 giờ trong ngày làm việc.
- Khoảng lấy mẫu thô dự kiến: 5–10 giây.
- Log điều khiển giữ timestamp ở mức giây hoặc mili giây.
- Dữ liệu dự báo được tổng hợp thành một mẫu mỗi giờ.
- Ghi nhật ký ngày nghỉ, thời gian không tải, tải hoạt động, lệnh điều khiển và sự cố.

Nếu chỉ thu được 14 ngày, dữ liệu địa phương chỉ được gọi là kiểm chứng tích hợp hoặc thử nghiệm ban đầu, không phải đánh giá dự báo dài hạn.

### Các loại ngày và phiên vận hành dự kiến

- Ngày tải thấp.
- Ngày tải bình thường.
- Ngày tải cao hoặc biến động trong giới hạn an toàn.
- Ngày nghỉ hoặc phòng không hoạt động.

Một phiên vận hành tham khảo:

1. 30 phút không tải hoặc tải nền.
2. 1–1,5 giờ tải thấp.
3. 1,5–2 giờ tải trung bình.
4. 1,5–2 giờ tải cao trong giới hạn định mức.
5. 1 giờ tải biến thiên.
6. 30–60 phút kiểm tra điều khiển, phản hồi và cảnh báo.

Không lặp lịch bật/tắt giống hệt nhau mỗi ngày. Thời điểm và tổ hợp tải có thể thay đổi nhưng phải được ghi trong nhật ký thử nghiệm.

## 2.8. Kịch bản và chỉ tiêu đánh giá

### Bảng 3. Ma trận kịch bản và vị trí ghi kết quả thực nghiệm

| Mã | Kịch bản/tác động | Dữ liệu phải ghi | Số lần/thời lượng dự kiến | Chỉ tiêu | Kết quả |
|---|---|---|---|---|---|
| S1 | Không tải, tải thấp, trung bình và cao | V/I/P/Q/PF/E, timestamp, tải hoạt động | Theo kế hoạch 30 ngày | Mất mẫu, ổn định, sai số nếu có tham chiếu | `[CHỈ VIẾT SAU KHI CÓ LOG THẬT]` |
| S2 | Bật/tắt tải từ Web/App | Command, thời điểm gửi, `statusTag`, tiếp điểm | Dự kiến 20–30 lần cho mỗi trạng thái | Tỷ lệ thành công, RTT | `[CHƯA CÓ DỮ LIỆU THỰC NGHIỆM]` |
| S3 | Mất kết nối hoặc timeout có kiểm soát | Mã lỗi, trạng thái yêu cầu/thực, trạng thái tải | Chốt trước khi thử | Fail-closed, khả năng phục hồi | `[CHƯA CÓ DỮ LIỆU THỰC NGHIỆM]` |
| S4 | Gần/chạm Quota thử nghiệm | E tháng, Quota, thời điểm cảnh báo | Chốt trước khi thử | Cảnh báo đúng ngưỡng, không nhầm kW/kWh | `[CHƯA CÓ DỮ LIỆU THỰC NGHIỆM]` |
| S5 | Manual override và khôi phục | Trạng thái trước–sau, log phục hồi | Chốt trước khi thử | An toàn và khả năng phục hồi | `[CHƯA CÓ DỮ LIỆU THỰC NGHIỆM]` |
| S6 | Sa thải tải phi thiết yếu | P/E trước–sau, tải bị cắt, interlock | Chỉ thực hiện khi đủ điều kiện an toàn | Thời gian cắt, đúng thứ tự ưu tiên | `[KHÔNG ĐƯỢC TUYÊN BỐ LÀ KẾT QUẢ]` |

### Đánh giá dự báo

- Chia expanding rolling-origin theo thứ tự thời gian.
- Dùng tập validation để lựa chọn/cấu hình; không chọn mô hình bằng tập test.
- MAE là chỉ tiêu chính; RMSE, R² và MAPE là chỉ tiêu bổ sung.
- Báo cáo mean ± sample SD và số fold × số seed.
- Không dùng kiểm định thống kê nếu số fold/quan sát độc lập chưa đủ.

### Đánh giá phần mềm

- Chỉ nêu suite và hành vi có log kiểm thử.
- Trạng thái chuẩn hóa ngày 10/08/2026: `verify` 60/60; `backend` 16/16; `forecast` 9/9; `research` 7/7; `frontend_contract` 20/20; `admin_audit` 5/5; `room_presentation` 3/3; tất cả suite đều đạt.
- Có thể tuyên bố các hợp đồng hành vi phần mềm trong `claimPermissions` đã được kiểm thử, nhưng không suy rộng thành độ tin cậy phần cứng, độ trễ App–PLC hoặc hiệu quả sa thải tải.

---

# 3. KẾT QUẢ VÀ THẢO LUẬN

## 3.1. Kết quả kiểm chứng phần mềm

**Phần có thể viết từ bằng chứng hiện tại:**

- Nêu các hành vi được phép theo `claimPermissions`.
- Ghi rõ toàn bộ kiểm tra kho mã đạt 60/60; kèm kết quả các suite thành phần: backend 16/16, forecast 9/9, research 7/7, frontend contract 20/20, admin audit 5/5 và room presentation 3/3.
- Nêu commit `b475e1e388bd2ac60b03997f43efdb31bb88c470`, thời điểm kiểm thử và việc working tree còn thay đổi tại thời điểm thu bằng chứng để bảo đảm khả năng truy vết.
- Không dùng test phần mềm để thay thế thử nghiệm điện hoặc xác nhận tiếp điểm thật.

## 3.2. Kết quả đo lường tại phòng thí nghiệm

`[CHỈ VIẾT SAU KHI CÓ LOG THẬT]`

Nội dung dự kiến:

- So sánh MFM384 với thiết bị tham chiếu nếu có.
- Tính liên tục của dữ liệu.
- Tỷ lệ mất mẫu và sai timestamp.
- Độ ổn định theo các mức tải.
- Nguyên nhân và giới hạn của sai số.

### Hình 3. Diễn biến đại lượng điện, trạng thái phụ tải và bằng chứng giao diện

**Loại hình:** Hình ghép ưu tiên đồ thị thời gian tạo từ log thật; tối đa một panel nhỏ là ảnh App/Web thật đã ẩn danh.

- Panel trên: công suất hoặc điện năng.
- Panel giữa: điện áp/dòng điện.
- Panel dưới: trạng thái ON/OFF và sự kiện điều khiển.
- Panel giao diện tùy chọn: cùng timestamp/phiên thử, cho thấy giá trị giám sát và phản hồi lệnh; không dùng để thay thế log PLC/tiếp điểm.

**Trạng thái:** `[CHƯA CÓ DỮ LIỆU THỰC NGHIỆM]`. Không dùng dữ liệu mô phỏng để đại diện phần cứng.

## 3.3. Kết quả điều khiển, Quota và cảnh báo

`[CHƯA CÓ DỮ LIỆU THỰC NGHIỆM]`

Khi có log, điền cột “Kết quả” của Bảng 3 và thảo luận:

- Tỷ lệ bật/tắt thành công dựa trên phản hồi độc lập.
- Timeout, mất kết nối và trạng thái fail-closed.
- Độ trễ App–PLC đo trên phần cứng thật.
- Thời điểm cảnh báo Quota và khuyến nghị.
- Manual override và khả năng khôi phục.

Không báo cáo độ trễ, tỷ lệ thành công hoặc sa thải tải bằng số ước lượng.

## 3.4. Kết quả benchmark dự báo phụ tải

**Phần có thể viết từ kết quả chuẩn hiện tại:**

- Dữ liệu: UCI Individual Household Electric Power Consumption.
- 17.521 dòng theo giờ và 15.321 mẫu có giám sát.
- 3 rolling fold × 3 seed cho Random Forest/XGBoost.
- Random Forest và XGBoost cho kết quả gần tương đương; không tuyên bố một mô hình vượt trội về độ chính xác tổng thể.
- Giới hạn toàn bộ kết luận trong phạm vi UCI.

### Hình 4. Sai số dự báo theo chân trời

**Loại hình:** Hai panel MAE và RMSE cho các chân trời h+1, h+6, h+12 và h+24; có error bar và đơn vị kW.

Đồ thị phải được tạo lại từ kết quả chuẩn, không vẽ thủ công.

### Bảng 4. Kết quả benchmark dự báo trên tập test

| Mô hình | MAE (kW) | RMSE (kW) | MAPE (%) | R² | Số lần chạy |
|---|---:|---:|---:|---:|---:|
| Persistence | 0,695 ± 0,162 | 0,933 ± 0,180 | 99,846 ± 16,042 | -0,807 ± 0,164 | 3 |
| Seasonal Naive 24 h | 0,515 ± 0,101 | 0,756 ± 0,130 | 66,653 ± 8,208 | -0,192 ± 0,068 | 3 |
| Seasonal Naive 168 h | 0,544 ± 0,088 | 0,784 ± 0,126 | 75,072 ± 6,663 | -0,285 ± 0,062 | 3 |
| Random Forest | 0,422 ± 0,052 | 0,575 ± 0,077 | 58,175 ± 3,824 | 0,308 ± 0,014 | 9 |
| XGBoost | 0,422 ± 0,047 | 0,573 ± 0,074 | 58,478 ± 4,577 | 0,313 ± 0,022 | 9 |

**Cách diễn giải bắt buộc:** Chênh lệch MAE giữa Random Forest và XGBoost rất nhỏ so với độ phân tán giữa các lần chạy. Không dùng bảng này để khẳng định độ chính xác trên dữ liệu MFM384 tại Cần Thơ.

## 3.5. Thảo luận

Trình bày theo bốn ý:

1. Testbed giải quyết được gì cho giám sát và quản lý điện năng trong phòng thí nghiệm?
2. Vì sao phản hồi PLC/tiếp điểm quan trọng hơn xác nhận đơn thuần từ giao diện?
3. Dự báo hỗ trợ Quota, cảnh báo và khuyến nghị đến mức nào; chưa hỗ trợ đến mức nào?
4. Vì sao kết quả UCI chưa đại diện cho dữ liệu MFM384 và hành vi sử dụng điện tại Cần Thơ?

## 3.6. Nguy cơ đối với tính hợp lệ

- **Nội tại:** Thiếu thiết bị tham chiếu, ít lần thử hoặc timestamp chưa đồng bộ.
- **Ngoại tại:** Một phòng thí nghiệm, số loại tải hạn chế và khác hành vi hộ gia đình.
- **Mô hình:** Dữ liệu UCI khác khí hậu, thiết bị và hành vi địa phương.
- **Đo lường:** Sai số công-tơ, hệ số tỉ lệ, rollover điện năng hoặc mất mẫu.
- **Phần mềm:** Test mã nguồn không thay thế thử nghiệm điện; kết quả 60/60 chỉ chứng minh các hợp đồng hành vi trong phạm vi suite và trạng thái mã được ghi nhận.
- **Thời gian:** Dữ liệu 14–30 ngày chưa phản ánh mùa hoặc biến động dài hạn.

---

# 4. KẾT LUẬN VÀ HƯỚNG PHÁT TRIỂN

## 4.1. Kết luận

Viết thành một đoạn ngắn:

- Nhắc lại mô hình đã xây dựng.
- Trả lời lần lượt RQ1–RQ3 bằng bằng chứng đã có.
- Nêu kết quả chính bằng số đã kiểm chứng.
- Phân biệt benchmark UCI với thử nghiệm MFM384 địa phương.
- Không lặp toàn bộ phương pháp hoặc đưa đóng góp mới.

Nếu RQ1 hoặc RQ3 chưa có log phần cứng, kết luận phải ghi đây là thiết kế hoặc trạng thái triển khai, không phải kết quả thực nghiệm hoàn chỉnh.

## 4.2. Hạn chế và hướng phát triển

- Thu dữ liệu MFM384 địa phương trong thời gian dài hơn.
- Đánh giá sai số đo bằng thiết bị tham chiếu.
- Đo độ trễ App–PLC và Telegram bằng log thực nghiệm.
- Duy trì bộ kiểm thử phần mềm khi mã thay đổi và tái tạo bằng chứng chuẩn hóa trước khi nộp bài.
- Kiểm chứng sa thải tải có interlock, manual override, dừng khẩn và phục hồi.
- Tích hợp thời tiết và thực hiện ablation test nếu dữ liệu cho phép.
- Chỉ đánh giá chatbot hoặc anomaly khi có bộ dữ liệu, chỉ tiêu và kịch bản riêng.

---

## Tuyên bố dữ liệu, đạo đức và liêm chính

- Nêu DOI của bộ dữ liệu công khai sau khi xác minh.
- Chỉ rõ vị trí mã và kết quả tái lập.
- Nêu dữ liệu phần cứng nào được công khai hoặc không công khai.
- Điền đóng góp CRediT, nguồn tài trợ và xung đột lợi ích.
- Nếu dùng AI hỗ trợ diễn đạt, hình hoặc mã, mô tả phạm vi và xác nhận tác giả chịu trách nhiệm cuối cùng.

## Tài liệu tham khảo cần chuẩn bị

1. Tổng quan HEMS và demand response.
2. Kiến trúc HEMS có thiết bị đo và điều khiển.
3. Manual đúng model MFM384 đang sử dụng.
4. Manual Siemens S7-1200.
5. Modbus Application Protocol và Modbus Serial Line.
6. NIST SP 800-82 Rev. 3.
7. UCI Individual Household Electric Power Consumption.
8. Random Forest, XGBoost và đánh giá chuỗi thời gian.
9. Nghiên cứu dự báo phụ tải và quản lý tải gần đây.

Không bổ sung tài liệu về UI, microservices, mật mã hoặc MLOps nếu bài không đánh giá trực tiếp các vấn đề đó. Trích dẫn và danh mục tài liệu phải theo Vancouver và theo thứ tự xuất hiện.

---

## Tổng hợp hình và bảng

### Hình — 4 hình

| Số | Nội dung | Loại | Trạng thái |
|---:|---|---|---|
| Hình 1 | Kiến trúc tổng thể MFM384–PLC–tải–Web/App–dự báo | Sơ đồ vector | Có thể làm ngay |
| Hình 2 | Mô hình phần cứng thực nghiệm | Ảnh thật 3–4 panel | Chờ ảnh thật |
| Hình 3 | Diễn biến V/I/P/E, trạng thái tải và tối đa một panel giao diện cùng phiên thử | Đồ thị log thật + ảnh giao diện thật tùy chọn | Chờ log phần cứng |
| Hình 4 | Sai số dự báo theo chân trời | Đồ thị tái lập | Có dữ liệu chuẩn |

### Bảng — 4 bảng

| Số | Nội dung | Trạng thái |
|---:|---|---|
| Bảng 1 | So sánh nghiên cứu liên quan | Chờ tài liệu đã xác minh |
| Bảng 2 | Thiết bị, tín hiệu và trạng thái kiểm chứng | Chờ manual/thiết bị thật |
| Bảng 3 | Kịch bản và kết quả thực nghiệm | Thiết kế có sẵn; kết quả chờ log |
| Bảng 4 | Kết quả benchmark dự báo | Có dữ liệu chuẩn |

**Tổng cộng cố định:** 4 hình + 4 bảng = 8. Không bổ sung hình/bảng độc lập nếu chưa sửa nguồn dàn ý này và chứng minh sự cần thiết.

## Kiểm tra trước khi viết bản hoàn chỉnh

- [x] Đúng bốn phần chính của bài báo.
- [x] Có đúng ba câu hỏi nghiên cứu.
- [x] Cấu trúc được chốt đúng 4 hình + 4 bảng.
- [x] Quota được trình bày bằng kWh và tách khỏi ngưỡng công suất kW.
- [x] Backend tính điện năng tháng từ dữ liệu tích lũy; không reset MFM384 vật lý.
- [x] Sa thải tải không phải chức năng mặc định.
- [x] Kế hoạch thu dữ liệu 30 ngày được ghi là kế hoạch.
- [x] Đối tượng được định vị rõ là mô hình phụ tải quy mô nhỏ đặt tại Phòng thí nghiệm Điện công nghiệp, không phải toàn bộ phụ tải của phòng.
- [x] Cảnh báo/khuyến nghị được tách khỏi tối ưu hóa và sa thải tải.
- [x] Kết quả kiểm thử phần mềm mới đã đồng bộ từ nguồn chuẩn hóa ngày 10/08/2026.
- [x] Kết quả UCI không được dùng để đại diện dữ liệu địa phương.
- [x] Random Forest và XGBoost không bị diễn giải thành vượt trội khi chênh lệch rất nhỏ.
- [x] Các mục chưa có bằng chứng được đánh dấu rõ.
- [ ] Chốt manual và thông số MFM384.
- [ ] Thu ảnh thật cho Hình 2.
- [ ] Điền `HEMS_Phieu_Thu_Thap_Du_Lieu_Thuc_Nghiem.xlsx` và gửi kèm raw log/ảnh/video để kiểm tra.
- [ ] Chụp App/Web bằng dữ liệu đúng, cùng phiên thử và che thông tin nhạy cảm nếu dùng panel giao diện trong Hình 3.
- [ ] Thực hiện kịch bản Bảng 3 để điền kết quả và tạo Hình 3.
- [ ] Xác minh DOI và định dạng toàn bộ tài liệu tham khảo.
- [ ] Sau khi dữ liệu thật được chuẩn hóa, sửa bản Word tiếng Việt trực tiếp từ nguồn dàn ý này; sau đó mới xuất DOCX/PDF theo mẫu CTUT.
