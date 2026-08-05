# CẨM NANG PHẢN BIỆN ĐỒ ÁN SMART HOME AI

Tài liệu này chỉ giữ các câu hỏi có giá trị khi bảo vệ đồ án. Mục tiêu là trả lời ngắn gọn, đúng kỹ thuật, không nói quá khả năng hiện tại của hệ thống.

---

## 1. Kiến trúc tổng thể

### Câu hỏi 1: Hệ thống của em khác gì một app bật/tắt thiết bị thông thường?

**Trả lời:** Hệ thống không chỉ bật/tắt thiết bị. Đây là prototype HEMS/IoT có đủ các lớp:

1. App di động để người dùng giám sát và điều khiển.
2. Backend API làm trung gian giữa app, database, PLC và Forecast API.
3. Phân quyền nhiều người dùng theo hộ gia đình.
4. Lưu lịch sử điện năng theo `home_id`.
5. Hạn mức kWh và cảnh báo tiêu thụ.
6. Forecast API dự báo phụ tải.
7. Định hướng tích hợp PLC S7-1200 và MFM384 để đọc dữ liệu thật.

Vì vậy hệ thống được định vị là nền tảng quản lý năng lượng nhà thông minh, không chỉ là giao diện điều khiển relay.

---

### Câu hỏi 2: Vì sao App không ghi trực tiếp xuống PLC mà phải qua Backend?

**Trả lời:** Không cho App ghi trực tiếp vào PLC vì không an toàn và khó quản lý quyền. Backend đóng vai trò API Gateway:

1. Xác thực người dùng bằng token.
2. Kiểm tra quyền theo vai trò và `home_id`.
3. Ghi audit log cho thao tác điều khiển.
4. Chuẩn hóa lệnh trước khi ghi xuống PLC.
5. Ẩn địa chỉ IP, tag và cấu trúc PLC khỏi điện thoại người dùng.

Luồng đúng là:

```text
App -> Backend API -> PLC -> Relay/Contactor -> Tải
```

---

### Câu hỏi 3: Vì sao dùng Cloudflare Tunnel?

**Trả lời:** Trong giai đoạn demo, backend chạy trên laptop nên điện thoại ở ngoài mạng LAN không thể gọi trực tiếp IP nội bộ. Cloudflare Tunnel giúp tạo domain HTTPS công khai như `https://api.smarthomeai.id.vn` mà không cần mở port modem, không cần IP tĩnh và an toàn hơn khi demo từ xa.

Khi triển khai thật, có thể chuyển backend lên VPS hoặc dùng Edge Gateway tại từng nhà gửi dữ liệu lên cloud.

---

## 2. PLC, phần cứng và đồng bộ trạng thái

### Câu hỏi 4: Nếu người dùng bấm nút vật lý ngoài tủ điện thì App có đồng bộ được không?

**Trả lời:** Có, nếu nút vật lý được đấu vào input PLC và PLC ghi trạng thái thật ra tag status.

Luồng đúng:

```text
Nút vật lý/App command -> PLC xử lý logic -> Output/Relay/Contactor -> Status feedback -> Backend -> App
```

App không nên hiển thị theo “lệnh vừa gửi”, mà phải hiển thị theo trạng thái thật PLC đọc được. Nhờ vậy bật bằng nút vật lý hay bằng App thì App vẫn đồng bộ.

---

### Câu hỏi 5: Nếu dữ liệu PLC khác trạng thái App thì tin bên nào?

**Trả lời:** Tin trạng thái thật từ PLC/status feedback. App chỉ là giao diện gửi lệnh và hiển thị. PLC là lớp điều khiển tại hiện trường.

Nếu App gửi lệnh bật nhưng relay/contactor không đóng, App phải báo lỗi hoặc hiển thị trạng thái không khớp. Vì vậy cần feedback từ PLC hoặc tiếp điểm phụ của contactor.

---

### Câu hỏi 6: Tại sao phải tách vùng nhớ MD đo lường với vùng nhớ bật/tắt thiết bị?

**Trả lời:** Trong PLC Siemens, `MD` vẫn nằm trên vùng nhớ M. Ví dụ `MD200` chiếm các byte `M200`, `M201`, `M202`, `M203`. Nếu vừa dùng `MD200` để lưu điện áp, vừa dùng `M200.0` làm bit bật/tắt relay, hai biến sẽ ghi đè cùng vùng nhớ.

Quy ước trong dự án:

| Nhóm biến | Vùng nhớ | Mục đích |
|---|---|---|
| Status feedback | `DB1.DBX1.2 -> DB1.DBX1.4` | PLC báo trạng thái thật của 3 tải demo |
| Command từ App | `DB7.DBX0.0 -> DB7.DBX0.5` | Backend gửi xung Start/Stop xuống PLC |
| Đo lường | `MD200` trở lên | `V`, `I`, `kW`, `kWh` từ MFM384 |

Không dùng `M200.0 -> M231.7` cho relay/status/command nếu đang dùng `MD200`, `MD212`, `MD224`, `MD228` cho đo lường.

---

### Câu hỏi 7: Có thể dùng Data Block thay vì vùng M không?

**Trả lời:** Có. Dùng Data Block còn rõ ràng hơn nếu cấu hình PLC cho phép Snap7 truy cập.

Thiết kế đề xuất:

```text
DB_COMMAND: Backend ghi lệnh từ App
DB_STATUS: PLC ghi trạng thái thật
DB_POWER: PLC lưu V, I, kW, kWh
```

Ví dụ:

```text
DB_COMMAND.DBX0.0  -> lệnh bật đèn phòng khách
DB_STATUS.DBX1.2   -> trạng thái thật đèn phòng khách
DB_POWER.DBD0      -> điện áp V
DB_POWER.DBD4      -> dòng điện I
DB_POWER.DBD8      -> công suất kW
DB_POWER.DBD12     -> điện năng kWh
```

Điểm quan trọng là command, status và power phải tách vùng, không ghi chồng nhau.

Mapping demo hiện tại của 3 phòng:

| Phòng | Start | Stop | Status thật |
|---|---|---|---|
| Phòng khách | `DB7.DBX0.0` | `DB7.DBX0.1` | `DB1.DBX1.2` |
| Phòng bếp | `DB7.DBX0.2` | `DB7.DBX0.3` | `DB1.DBX1.3` |
| Phòng ngủ | `DB7.DBX0.4` | `DB7.DBX0.5` | `DB1.DBX1.4` |

---

### Câu hỏi 8: Nếu dùng tải thật thì phần cứng nên bố trí thế nào để an toàn?

**Trả lời:** PLC không nên đóng cắt tải 220VAC trực tiếp. Kiến trúc an toàn:

```text
App -> Backend -> PLC output -> Relay trung gian 24VDC -> Contactor/Relay công suất -> Tải thật
```

Tủ điện nên có:

1. MCB/cầu chì bảo vệ.
2. Nguồn 24VDC cho PLC và relay trung gian.
3. Relay 14 chân làm tầng cách ly điều khiển.
4. Contactor/relay công suất chịu dòng tải thật.
5. MFM384 đo `V`, `I`, `kW`, `kWh`.
6. Tiếp điểm phụ đưa về PLC để xác nhận trạng thái.

---

## 3. Dữ liệu điện năng và Forecast

### Câu hỏi 9: App đang hiển thị đơn vị điện như thế nào cho đúng?

**Trả lời:** Quy ước đúng:

| Đại lượng | Ký hiệu | Đơn vị |
|---|---|---|
| Điện áp | `V` | Volt |
| Dòng điện | `I` | Ampere |
| Công suất tức thời | `P` | `kW` |
| Điện năng tiêu thụ | `E` | `kWh` |

`kW` là công suất tại thời điểm hiện tại. `kWh` là điện năng tích lũy theo thời gian. Không được dùng lẫn hai đơn vị này.

---

### Câu hỏi 10: AI dự báo phụ tải có thật sự cần thiết không?

**Trả lời:** Có, vì HEMS không chỉ giám sát hiện tại mà còn cần dự đoán xu hướng tiêu thụ. Forecast giúp:

1. Ước lượng phụ tải 24 giờ tới.
2. Cảnh báo nguy cơ vượt hạn mức.
3. Gợi ý thời điểm nên giảm tải.
4. Làm nền cho tối ưu chi phí điện sau này.

Trong prototype, XGBoost phù hợp vì chạy nhanh, nhẹ và dễ triển khai API. LSTM/CNN-LSTM là hướng mở rộng cho chuỗi thời gian khi có nhiều dữ liệu thật hơn.

---

### Câu hỏi 11: Nếu MAPE cao thì mô hình có bị xem là kém không?

**Trả lời:** Không nên đánh giá chỉ bằng MAPE. Với phụ tải hộ gia đình, có nhiều thời điểm công suất rất thấp. Khi mẫu số gần 0, MAPE bị phóng đại dù sai số tuyệt đối không quá lớn.

Nên ưu tiên:

1. `MAE`: dễ hiểu vì cùng đơn vị `kW`.
2. `RMSE`: phạt mạnh lỗi ở đỉnh tải.
3. `MAPE`: chỉ dùng tham khảo và phải giải thích giới hạn.

---

### Câu hỏi 12: Khi chưa có dữ liệu người dùng thật, tại sao không dùng thẳng Gemini/GPT thay Forecast API train từ UCI?

**Trả lời:** Gemini/GPT và Forecast API có vai trò khác nhau.

LLM như Gemini/GPT phù hợp để:

1. Giải thích dữ liệu cho người dùng.
2. Trả lời câu hỏi bằng tiếng Việt.
3. Gợi ý tiết kiệm điện.
4. Nhắc người dùng rằng dữ liệu chưa đủ để kết luận chắc chắn.

Forecast API train từ UCI/dữ liệu mẫu phù hợp để:

1. Chứng minh pipeline dự báo hoạt động.
2. Kiểm thử API, biểu đồ và luồng tích hợp app.
3. Có metric định lượng như MAE/RMSE.

LLM không nên tự bịa số `kW/kWh`. Khi có dữ liệu thật từ PLC/MFM384 trong nhiều ngày hoặc nhiều tuần, hệ thống mới retrain mô hình theo từng nhà để cá nhân hóa dự báo.

---

### Câu hỏi 12b: Việc nhập công suất định mức từng thiết bị để quản lý có thực tế không, khi trong thực tế thiết bị hao mòn và không phải lúc nào cũng chạy hết công suất?

**Trả lời:** Nhận xét này hoàn toàn chính xác dưới góc độ kỹ thuật vận hành. Việc nhập công suất định mức chỉ là một giả định đơn giản hóa (simplifying assumption) cho giai đoạn xây dựng prototype và có các đặc điểm sau:

1. **Ý nghĩa của công suất định mức:** 
   - Giúp hệ thống có một mốc tham chiếu (baseline/ceiling) để biết ngưỡng tiêu thụ tối đa lý thuyết của thiết bị.
   - Phù hợp cho đồ án/prototype khi không thể lắp cảm biến đo dòng điện (CT) cho từng ổ cắm/thiết bị riêng lẻ vì hạn chế chi phí và độ phức tạp phần cứng.
2. **Giải pháp thực tế của hệ thống:**
   - Hệ thống được thiết kế để nhận số đo tổng nhà từ **MFM384 qua PLC**. Hiện chưa có bộ log chuẩn đủ để tuyên bố độ chính xác ngoài hiện trường; sai số phải được xác định từ cấp chính xác của đồng hồ, biến dòng và quá trình hiệu chuẩn, không được nói “chính xác 100%”.
3. **Hướng phát triển nâng cao (đề xuất khi bảo vệ):**
   - **Tích hợp Smart Plug (Ổ cắm thông minh):** Đo trực tiếp công suất thực tế của các tải lớn (như tủ lạnh, điều hòa) và gửi dữ liệu thời gian thực về API thay vì nhập tay.
   - **Ứng dụng thuật toán NILM (Non-Intrusive Load Monitoring):** Sử dụng AI phân tích dữ liệu dòng điện tổng đo từ MFM384 để nhận diện và tách biệt lượng điện tiêu thụ của từng thiết bị mà không cần lắp thêm cảm biến ở từng ổ cắm.

---

### Câu hỏi 12c: Dữ liệu huấn luyện mô hình AI từ tập dữ liệu UCI có thật sự mang tính thuyết phục về mặt nghiên cứu không?

**Trả lời:** Rất thuyết phục về mặt thuật toán và nghiên cứu khoa học. Sự thuyết phục nằm ở phương pháp kết hợp 2 trụ cột (Dual-Approach):

1. **Vai trò của UCI:** UCI Individual Household Electric Power Consumption là tập dữ liệu công khai dài hạn, phù hợp để xây pipeline và so sánh mô hình. Bộ chạy chuẩn hiện tại sử dụng 507.970 dòng thô sau bước nạp/lọc của pipeline. UCI giúp benchmark có thể tái lập nhưng không loại bỏ sai số và không chứng minh mô hình phù hợp với hộ gia đình tại Cần Thơ.
2. **Phương pháp kết hợp 2 trụ cột (Dual-Approach) cho luận văn:**
   - **Trụ cột 1 (Thuật toán AI):** Sử dụng dữ liệu UCI để huấn luyện và đánh giá định lượng năng lực của các mô hình Machine Learning (XGBoost, Random Forest) qua các chỉ số chuẩn ($MAE, RMSE, R^2 = 0.945$).
   - **Trụ cột 2 (Phần cứng thực tế):** Sử dụng mô hình phần cứng PLC S7-1200 + MFM384 để kiểm thử thực nghiệm khả năng truyền thông thời gian thực, điều khiển khép kín và đo đạc thực tế.

---

### Câu hỏi 12d: Sinh viên không thể cắm máy tính chạy liên tục 24/7 để thu thập dữ liệu thì việc kiểm thử thực nghiệm được giải quyết ra sao?

**Trả lời:** Trong kỹ thuật IoT và tự động hóa, việc này được giải quyết hợp lý bằng 2 luận điểm:

1. **Thu thập dữ liệu theo ca thực nghiệm tập trung (session-based testing):** Có thể chạy các ca 2–4 giờ tại phòng lab, nhưng chỉ báo cáo số điểm thực thu được từ raw log. Hiện chưa có bằng chứng chuẩn cho con số 30.000 điểm, nên không sử dụng con số đó khi phản biện.
2. **Kiến trúc triển khai:** Trong prototype, backend chạy trên laptop. Kiến trúc production đề xuất chuyển sang edge gateway chạy liên tục trong LAN của PLC; đây là hướng triển khai, chưa phải kết quả đã xác nhận.

---

### Câu hỏi 12e: Các kịch bản tải thật (Real-world Load Scenarios) được thiết lập như thế nào để chứng minh hệ thống hoạt động đúng trong thực tế?

**Trả lời:** Ba kịch bản sau là **kế hoạch thực nghiệm**, chưa được gọi là kết quả hoàn thành nếu chưa có raw log, ảnh bố trí tải, thông số thiết bị đo và đủ số lần lặp:

1. **SC-01 (tải nền):** Dùng tải nhỏ đã đo độc lập để kiểm tra khả năng nhận biết công suất nền.
2. **SC-02 (thay đổi tải):** Đóng/cắt từng tải đã biết để so sánh biến thiên tại MFM384, PLC, API và app.
3. **SC-03 (tải cao/cảnh báo quota):** Dùng tải an toàn trong giới hạn tủ điện để kiểm tra cảnh báo giao diện; không dùng kịch bản này để tự động cắt tải.

Mỗi điều kiện nên có ít nhất 30 lần lặp đối với latency, đồng bộ thời gian và lưu log thô để tính median, p95, tỷ lệ thành công và timeout.

---

### Câu hỏi 12f: Nếu nhiều ngôi nhà khác nhau nhưng chương trình lập trình TIA Portal trên PLC của các nhà đều giống hệt nhau thì hệ thống làm sao phân biệt được để điều khiển đúng nhà?

**Trả lời:** Đây chính là ưu điểm của **Mô hình Mô-đun hóa / Template chuẩn (Standardized Template Design)** trong kỹ thuật IoT công nghiệp:

1. **Chuẩn hóa lập trình (PLC Template):** Kỹ sư chỉ cần lập trình 1 file TIA Portal chuẩn (như `DB7.DBX0.0` luôn là Đèn 1, `DB7.DBX0.2` luôn là Đèn 2) và nạp cho tất cả PLC ở mọi ngôi nhà. Việc này giúp tiết kiệm thời gian thi công và dễ dàng bảo trì hệ thống.
2. **Phân biệt bằng IP và Home ID ở Backend:** Flask Backend quản lý mỗi ngôi nhà theo một `home_id` và lưu địa chỉ IP/VPN tương ứng của PLC nhà đó. Khi người dùng Nhà A bấm nút, Backend tra cứu IP của Nhà A (ví dụ `192.168.1.50`) và mở kết nối Snap7 tới đúng PLC đó để ghi tag. Do đó, dù địa chỉ tag `DB7.DBX0.0` giống nhau, lệnh chỉ được gửi đến đúng PLC của ngôi nhà tương ứng.
3. **Trường hợp demo phòng lab (1 PLC cho 2 nhà):** Nếu demo trên 1 PLC chung trong lab, hệ thống sẽ phân vùng nhớ theo Byte/Data Block (Nhà 1 dùng `DB7.DBX0.x`, Nhà 2 dùng `DB7.DBX1.x` hoặc `DB8`).

---

## 4. Database, bảo mật và vận hành

### Câu hỏi 13: Vì sao dùng SQLite, liệu có đủ cho nhiều nhà không?

**Trả lời:** SQLite phù hợp cho prototype vì nhẹ, dễ chạy local và không cần cài database server. Dữ liệu đã được tách theo `home_id`, nên mô hình multi-home vẫn rõ.

Khi triển khai thật với nhiều hộ gia đình, có thể chuyển sang PostgreSQL/MySQL mà không thay đổi kiến trúc chính. SQLite là lựa chọn cho demo/SIL, còn PostgreSQL phù hợp production.

---

### Câu hỏi 14: Nếu tắt server hoặc mất Internet thì dữ liệu và điều khiển ra sao?

**Trả lời:** Cần tách rõ:

1. Tắt server: dữ liệu trong SQLite và file trạng thái không mất, vì đã lưu trên ổ cứng.
2. Mất Internet nhưng còn LAN: app có thể gọi API nội bộ nếu cấu hình local IP.
3. Mất Internet khi ở ngoài nhà: không điều khiển từ xa được.
4. Mất backend nhưng PLC còn chạy: nút vật lý và logic PLC vẫn hoạt động tại chỗ.

App có thể hiển thị cache gần nhất, nhưng cache không được xem là trạng thái thời gian thực.

---

### Câu hỏi 15: Hạn mức điện năng hiện tại có tự cắt tải không?

**Trả lời:** Phiên bản hiện tại tập trung vào giám sát và cảnh báo quota. Chủ hộ đặt hạn mức kWh, backend tính mức đã dùng từ lịch sử điện năng, app hiển thị tỷ lệ và cảnh báo.

Tự động cắt tải là hướng phát triển tiếp theo. Nếu làm thật, cần có:

1. Phân loại tải quan trọng và tải có thể cắt.
2. Luật ưu tiên an toàn.
3. Feedback từ relay/contactor về PLC.
4. Cơ chế xác nhận của người dùng trước khi cắt tải nhạy cảm.

---

## 5. Hướng phát triển thực tế

### Câu hỏi 16: Sau thời điểm hiện tại nên làm gì trước?

**Trả lời:** Thứ tự hợp lý:

1. Hoàn thiện tủ điện demo an toàn.
2. Xác nhận PLC đọc đúng `V`, `I`, `kW`, `kWh` từ MFM384.
3. Xác nhận backend đọc đúng tag PLC qua Snap7.
4. So sánh số liệu giữa TIA Portal, API `/api/power/current` và App Dashboard.
5. Thu dữ liệu thật vài ngày đến vài tuần.
6. Sau đó mới retrain forecast theo dữ liệu của nhà thật.

Không nên phát triển thêm quá nhiều giao diện hoặc AI Assistant trước khi dữ liệu PLC thật ổn định, vì dễ làm phần mềm đẹp nhưng sai giả định kỹ thuật.

---

### Câu hỏi 17: Vì sao chatbot runtime tạm thời dùng Gemini API, còn LoRA/Unsloth để hướng phát triển?

**Trả lời:** Trong giai đoạn demo, hệ thống ưu tiên độ ổn định của luồng điều khiển PLC và khả năng phản hồi của giao diện. Chatbot được tách thành một dịch vụ tư vấn; backend có thể cấu hình nhà cung cấp `Gemini`, `mock` hoặc `local_lora` mà không cho mô hình ngôn ngữ quyền ghi trực tiếp xuống PLC.

Kho mã hiện có dữ liệu và kịch bản phục vụ hướng fine-tune LoRA/Unsloth, nhưng chưa có bộ bằng chứng chuẩn gồm artifact mô hình, log huấn luyện, cấu hình phần cứng, thời gian suy luận và kết quả đánh giá có thể tái lập. Vì vậy khi phản biện **không tuyên bố LoRA đã huấn luyện thành công hoặc đạt 98,6%** nếu chưa xuất trình đủ các bằng chứng này.

Kiến trúc hiện tại tách rõ hai nhóm tác vụ:

```text
Lệnh điều khiển thiết bị -> rule/backend trực tiếp -> kiểm tra quyền/quota -> PLC
Câu hỏi tư vấn/giải thích -> assistant provider -> Gemini/mock/local_lora
```

Nhờ vậy lệnh bật/tắt thiết bị không phụ thuộc vào LLM. Nếu AI chậm, lỗi mạng hoặc hết quota API, phần điều khiển PLC vẫn hoạt động theo rule backend. Đây là điểm quan trọng để đảm bảo an toàn và độ tin cậy khi demo với phần cứng thật.

Hướng phát triển sau này:

1. Dùng Gemini API khi cần bản demo phản hồi ổn định và có kết nối mạng.
2. Dùng `mock` cho kiểm thử hợp đồng phần mềm, không xem là bằng chứng chất lượng AI.
3. Chỉ công bố `local_lora` sau khi có artifact và báo cáo đánh giá tái lập.
4. Backend chỉ đổi `assistant.provider`; ứng dụng không cần thay đổi luồng điều khiển thiết bị.

Kết luận: Gemini API là lựa chọn runtime cho phần hỏi đáp; LoRA/Unsloth hiện là hướng nghiên cứu. Cả hai đều độc lập với đường điều khiển an toàn.

---

### Câu hỏi 18: Sau khi thêm Supabase/PostgreSQL thì SQLite còn vai trò gì, và dữ liệu nhiều nhà được tách như thế nào?

**Trả lời:** Hệ thống hỗ trợ hai chế độ lưu trữ:

```text
Không có DATABASE_URL -> dùng SQLite cục bộ
Có DATABASE_URL       -> dùng PostgreSQL/Supabase
```

SQLite phù hợp cho phát triển và demo cục bộ. PostgreSQL/Supabase phù hợp hơn khi cần lưu trữ tập trung và nhiều hộ. Việc có mã hỗ trợ hai chế độ không đồng nghĩa bản cloud đã được chứng nhận cho production.

Dữ liệu nhiều nhà được tách theo `home_id`:

1. `homes` lưu từng nhà với mã riêng.
2. `home_members` gắn `user_id`, `home_id` và vai trò trong nhà.
3. `power_readings` và `audit_logs` luôn gắn với `home_id`.
4. Backend kiểm tra tư cách thành viên trước khi đọc dữ liệu hoặc gửi lệnh.

Luồng truy cập đúng là:

```text
Mobile App/Admin Site -> Flask Backend -> SQLite hoặc PostgreSQL/Supabase
```

Ứng dụng không ghi trực tiếp vào database hoặc PLC. Flask Backend chịu trách nhiệm xác thực phiên, kiểm tra quyền theo nhà, ghi nhật ký và điều phối I/O PLC.

---

### Câu hỏi 19: Backend còn chạy trên laptop thì có thực tế không?

**Trả lời:** Laptop phù hợp cho prototype, debug và kiểm thử trong phòng lab, nhưng không phải kiến trúc production cuối cùng. Nếu laptop tắt thì dịch vụ API và đường điều khiển từ xa không hoạt động, dù database bên ngoài có thể vẫn lưu dữ liệu.

```text
Prototype: Flask Backend chạy trên máy phát triển
Triển khai sau này: Flask Backend chạy trên edge gateway trong LAN của PLC
```

Khi triển khai thực tế, backend có thể chuyển sang mini PC, Raspberry Pi hoặc industrial PC đặt cùng mạng với PLC/MFM384. Đây là kiến trúc đề xuất, chưa phải kết quả triển khai đã được đo kiểm.

```text
Mobile App/Admin Site
        -> Edge Gateway chạy Flask Backend
             -> PLC/MFM384 trong mạng nội bộ
             -> PostgreSQL/Supabase (tùy cấu hình)
```

PLC không nên được mở trực tiếp ra Internet. Edge gateway giữ đường PLC trong LAN; truy cập từ xa cần VPN/tunnel và chính sách bảo mật được cấu hình riêng.

Câu trả lời ngắn khi phản biện:

> Trong prototype, backend chạy trên laptop để phát triển và kiểm thử. Kiến trúc production đề xuất chuyển backend sang edge gateway đặt cùng LAN với PLC; phương án này vẫn cần được triển khai và đo kiểm thực tế.

---

### Câu hỏi 20: Hệ thống quản lý thiết bị từng nhà như thế nào khi chưa đo riêng từng tải?

**Trả lời:** Ở mức hiện tại, owner/admin khai báo phòng, thiết bị, loại thiết bị và công suất định mức. Dữ liệu công suất đo thực tế là số đo tổng nhà từ PLC/MFM384; không được trình bày công suất định mức như số đo thời gian thực của từng thiết bị.

Cấu trúc dữ liệu:

```text
homes
  -> rooms
       -> devices
  -> power_readings
```

Trong đó, `rooms` và `devices` thuộc một `home_id`; `device_events` lưu lịch sử thao tác; `power_readings` lưu dữ liệu đo tổng nhà. Cần nói rõ khi phản biện:

```text
Công suất của từng thiết bị hiện là công suất định mức do người dùng nhập,
không phải giá trị đo riêng từng tải theo thời gian thực.
```

Muốn đánh giá từng tải thật, cần gắn kênh đo hoặc tag PLC riêng và hiệu chuẩn thiết bị đo.

---

## 6. Những phần mềm đã hoàn thiện thêm và cách chứng minh phản hồi ứng dụng

### Câu hỏi 21: Sau bản thảo ngày 12/7, phần mềm đã hoàn thiện thêm những gì?

**Trả lời:** Có thể trình bày các phần đã có trong mã. Backend, forecast, research, admin audit và helper ánh xạ phòng đã vượt các bộ test riêng; cổng frontend tổng hiện đạt 16/20 nên không nói toàn bộ giao diện đã kiểm thử hoàn tất:

1. Token người dùng được lưu bằng SecureStore; đăng xuất phía server có thu hồi phiên; API người dùng chỉ nhận Bearer token.
2. Phân quyền theo `home_id`, tách credential thu thập telemetry và giới hạn đăng nhập.
3. I/O PLC được tuần tự hóa; trạng thái thiết bị lấy từ đường feedback độc lập; scene trả kết quả theo từng thiết bị và xử lý lỗi một phần.
4. Collector có backoff; dữ liệu mock không được ghi như dữ liệu thật trong chế độ tự động.
5. Forecast API kiểm tra checksum/kích thước artifact, giới hạn request, từ chối timestamp sai và trả `501` cho retrain chưa triển khai.
6. App có trạng thái chờ/thành công/lỗi rõ hơn, nhãn trợ năng, lỗi đăng nhập tại chỗ và ẩn/hiện mật khẩu. Bốn regression frontend còn phải sửa: tích hợp helper hình phòng/nhãn trợ năng, tiếng Việt có dấu, một đường xử lý bàn phím Android thống nhất và AppTheme dùng chung trong RoomsScreen.

Đây là bằng chứng phần mềm; không dùng nó để thay thế số đo PLC/MFM384 hoặc latency phần cứng.

---

### Câu hỏi 22: Có cần đưa khả năng xử lý phản hồi của ứng dụng vào luận văn và bài báo không?

**Trả lời:** Có, đặc biệt trong luận văn, vì phản hồi khép kín là điểm nối giữa app, backend và PLC. Không nên chỉ chèn ảnh màn hình đẹp. Nên đưa một chuỗi bằng chứng:

```text
Người dùng thao tác
  -> app hiển thị trạng thái đang xử lý
  -> backend xác thực và kiểm tra quyền
  -> hàng đợi ghi lệnh PLC
  -> đọc feedback trạng thái độc lập
  -> app hiển thị thành công, lỗi hoặc timeout
```

Luận văn nên có sơ đồ tuần tự, ảnh ghép 4 trạng thái `loading/success/error/timeout` và bảng test case. Bài báo chỉ nên dành chỗ cho phần này nếu phản hồi end-to-end là một đóng góp chính; khi đó phải kèm phân bố latency đo trên phần cứng thật, không chỉ ảnh giao diện.

---

### Câu hỏi 23: Có thể nói APK hiện tại đã sẵn sàng phát hành không?

**Trả lời:** Có thể nói đã tạo và xác minh APK phục vụ thử nghiệm, nhưng chưa gọi là bản phát hành production nếu còn dùng khóa ký debug, chưa kiểm thử thiết bị mục tiêu và chưa hoàn tất cấu hình HTTPS/domain production. Phải tách “build thành công” khỏi “đủ điều kiện phân phối”.

---

## 7. Chuyên ngành Điện và bảo mật hệ thống (OT Security)

### Câu hỏi 24: Đồ án có bị thiên quá nhiều về Công nghệ thông tin không?

**Trả lời:** Đây là đề tài liên ngành. Thành phần Điện/Tự động hóa nằm ở MFM384, Modbus RTU/RS485, S7-1200, ánh xạ tag, relay/contactor, feedback vật lý và thiết kế ca thử tải. Phần mềm cung cấp giám sát, phân quyền, lưu vết và dự báo. Không nên nói trọng tâm “100% là điện” khi bằng chứng phần cứng còn thiếu; thay vào đó, cần chứng minh hai miền được tích hợp và phân định đúng trách nhiệm an toàn.

---

### Câu hỏi 25: Vì sao phân quyền và audit log quan trọng?

**Trả lời:** Lệnh điều khiển phải đi qua backend để xác thực phiên, kiểm tra quyền theo nhà và ghi nhật ký. Điều này giảm nguy cơ truy cập chéo nhà và giúp truy vết thao tác. Tuy nhiên RBAC phần mềm **không thay thế** khóa liên động, aptomat, E-stop hoặc quy trình lockout/tagout vật lý; dự án chưa tuyên bố đã triển khai khóa bảo trì đạt chuẩn.

---

### Câu hỏi 26: Hệ thống đã có SMS hoặc push notification chưa?

**Trả lời:** Chưa có bằng chứng mã nguồn và kiểm thử đủ để công bố SMS/push đã triển khai. Hiện có thể trình bày cảnh báo quota trong ứng dụng; SMS/push là hướng mở rộng. Khi triển khai cần quản lý sự đồng ý của người dùng, rate limit, chi phí, bảo mật credential và kiểm thử gửi nhận.

---

### Câu hỏi 27: Hệ thống có tự động ngắt tải khi vượt quota hoặc ngưỡng công suất không?

**Trả lời:** Không. Phiên bản hiện tại khóa cứng tự động sa thải tải bằng cờ an toàn trong mã, kể cả khi biến môi trường yêu cầu bật. Quota dùng để giám sát và cảnh báo. Muốn nghiên cứu tự động cắt tải phải có phân loại tải, interlock, manual override, feedback contactor, quy trình E-stop/recovery và dữ liệu thử nghiệm thật được phê duyệt.

---

### Câu hỏi 28: Mô hình AI dự báo có trực tiếp ra lệnh đóng cắt thiết bị không?

**Trả lời:** Không. Forecast chỉ cung cấp thông tin tham khảo; đường điều khiển thiết bị tách khỏi mô hình. Endpoint retrain thật hiện trả `HTTP 501`, tránh tạo cảm giác mô hình đã tự học lại trong production.

---

### Câu hỏi 29: Kết quả dự báo hiện tại đã đủ mạnh chưa?

**Trả lời:** Kết quả chuẩn hiện tại là benchmark trên dữ liệu UCI, chưa phải dữ liệu MFM384 tại Cần Thơ. XGBoost đạt MAE `0,4855 kW`, RMSE `0,6475 kW`, MAPE `66,24%` và R² `0,2219`; tốt hơn Seasonal Naive 24h khoảng `9,8%` theo MAE nhưng chỉ hơn Random Forest khoảng `1,2%`. Vì vậy đây là bằng chứng khả thi ban đầu, chưa đủ để tuyên bố mô hình vượt trội hoặc tổng quát cho ngôi nhà thật.

Để thuyết phục hơn cần thêm dữ liệu địa phương, ít nhất 5 rolling folds với nhiều seed, sai số theo từng horizon, đồ thị actual-vs-predicted, khoảng dự báo, kiểm định so sánh mô hình và phân tích drift/ablation.

---

### Câu hỏi 30: Ba hình hiện tại trong luận văn/bài báo đã đủ thuyết phục chưa?

**Trả lời:** Chưa. Sơ đồ kiến trúc, pipeline bằng chứng và biểu đồ MAE/RMSE là nền tảng tốt nhưng chưa chứng minh hệ thống hoạt động end-to-end. Nên bổ sung:

1. Sơ đồ tuần tự command-feedback, tách rõ luồng điều khiển và telemetry.
2. Ảnh ghép trạng thái app `loading/success/error/timeout`.
3. Đồ thị actual-vs-predicted theo thời gian và sai số theo horizon.
4. Boxplot/ECDF latency thật khi có đủ ca đo PLC/MFM384.
5. Bảng evidence gate ghi rõ mục nào là software test, public benchmark hay real hardware.

Không dùng hình placeholder latency như một kết quả thực nghiệm.
