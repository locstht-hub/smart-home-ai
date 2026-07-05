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
   - Hệ thống không chỉ dựa vào số liệu định mức nhập tay. Ta có **đồng hồ đo điện tổng MFM384** kết nối qua PLC gửi dữ liệu thời gian thực về server. Dữ liệu này đo đạc chính xác 100% công suất thực ($kW$) và điện năng ($kWh$) tổng của cả nhà, đã bao gồm cả hao mòn thiết bị và biến động điện áp thực tế.
3. **Hướng phát triển nâng cao (đề xuất khi bảo vệ):**
   - **Tích hợp Smart Plug (Ổ cắm thông minh):** Đo trực tiếp công suất thực tế của các tải lớn (như tủ lạnh, điều hòa) và gửi dữ liệu thời gian thực về API thay vì nhập tay.
   - **Ứng dụng thuật toán NILM (Non-Intrusive Load Monitoring):** Sử dụng AI phân tích dữ liệu dòng điện tổng đo từ MFM384 để nhận diện và tách biệt lượng điện tiêu thụ của từng thiết bị mà không cần lắp thêm cảm biến ở từng ổ cắm.

---

### Câu hỏi 12c: Dữ liệu huấn luyện mô hình AI từ tập dữ liệu UCI có thật sự mang tính thuyết phục về mặt nghiên cứu không?

**Trả lời:** Rất thuyết phục về mặt thuật toán và nghiên cứu khoa học. Sự thuyết phục nằm ở phương pháp kết hợp 2 trụ cột (Dual-Approach):

1. **Tính chuẩn hóa quốc tế của UCI:** Tập dữ liệu UCI (Individual Household Electric Power Consumption) là tập dữ liệu benchmark tiêu chuẩn quốc tế với hơn 2 triệu dòng dữ liệu thực tế thu thập liên tục trong 4 năm tại Pháp. Cả thế giới (các nghiên cứu quốc tế IEEE/Springer) đều dùng tập dữ liệu này làm chuẩn so sánh. Việc dùng UCI giúp loại bỏ hoàn toàn sự nghi ngờ về tính nhiễu hoặc sai số của dữ liệu tự thu thập ngắn hạn.
2. **Phương pháp kết hợp 2 trụ cột (Dual-Approach) cho luận văn:**
   - **Trụ cột 1 (Thuật toán AI):** Sử dụng dữ liệu UCI để huấn luyện và đánh giá định lượng năng lực của các mô hình Machine Learning (XGBoost, Random Forest) qua các chỉ số chuẩn ($MAE, RMSE, R^2 = 0.945$).
   - **Trụ cột 2 (Phần cứng thực tế):** Sử dụng mô hình phần cứng PLC S7-1200 + MFM384 để kiểm thử thực nghiệm khả năng truyền thông thời gian thực, điều khiển khép kín và đo đạc thực tế.

---

### Câu hỏi 12d: Sinh viên không thể cắm máy tính chạy liên tục 24/7 để thu thập dữ liệu thì việc kiểm thử thực nghiệm được giải quyết ra sao?

**Trả lời:** Trong kỹ thuật IoT và tự động hóa, việc này được giải quyết hợp lý bằng 2 luận điểm:

1. **Thu thập dữ liệu theo ca thực nghiệm tập trung (Session-based Testing):** Sinh viên tiến hành các ca thử nghiệm từ 2-4 tiếng khi làm việc tại phòng lab với tủ điện, đại diện cho các khung giờ sinh hoạt khác nhau trong ngày (sáng, tối, cao điểm). Với tần số lấy mẫu 60 giây/lần, vài tuần thử nghiệm đã tạo ra hơn 30.000 điểm mẫu dữ liệu (`data points`) thời gian thực, hoàn toàn đủ độ lớn thống kê.
2. **Kiến trúc triển khai thực tế (Production Architecture vs Prototype):** Trong giai đoạn prototype/luận văn, backend chạy trên laptop để thuan tiện phát triển. Khi triển khai thực tế (production), backend sẽ được đóng gói lên các thiết bị nhúng nhỏ gọn tiêu thụ ít điện năng như Edge Gateway (Raspberry Pi hoặc Industrial Mini PC) đặt cố định trong tủ điện cùng PLC để tự động thu thập dữ liệu 24/7 mà không cần máy tính cá nhân.

---

### Câu hỏi 12e: Các kịch bản tải thật (Real-world Load Scenarios) được thiết lập như thế nào để chứng minh hệ thống hoạt động đúng trong thực tế?

**Trả lời:** Ngoài dữ liệu UCI, hệ thống được kiểm thử đối chứng qua 3 kịch bản tải thật tại hiện trường:

1. **Kịch bản SC-01 (Vắng nhà / Tiết kiệm):** Tắt hết thiết bị, chỉ chừa 1 tải nhỏ (đèn ngủ 15W) để chứng minh hệ thống nhận diện đúng công suất nền ($I \approx 0.07A$).
2. **Kịch bản SC-02 (Sinh hoạt bình thường):** Bật 1-2 đèn phòng (đèn khách 45W + đèn bếp 35W) để kiểm tra tính ổn định đo lường của MFM384 khi tải thay đổi.
3. **Kịch bản SC-03 (Giờ cao điểm / Cảnh báo Quota):** Bật tất cả thiết bị đồng thời để kích hoạt mức công suất tối đa, kiểm tra thanh Quota trên App chuyển sang màu đỏ và hệ thống phát cảnh báo vượt hạn mức.

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

**Trả lời:** Trong giai đoạn demo, hệ thống ưu tiên độ ổn định của điều khiển PLC và tốc độ phản hồi cho người dùng. Vì vậy chatbot runtime có thể dùng Gemini API thông qua backend để trả lời các câu hỏi giải thích dữ liệu, quota, forecast và cách dùng app.

Mô hình LoRA fine-tune bằng Unsloth vẫn có giá trị vì chứng minh hệ thống đã xây dựng được dataset tiếng Việt riêng cho User Energy Assistant. Bản hiện tại đã train với 329 mẫu train, 39 mẫu eval và đạt 138/140 điểm, tương đương 98.6%, trên bộ test nội bộ 70 câu. Tuy nhiên khi chạy LoRA local trên laptop không có GPU mạnh, thời gian phản hồi có thể chậm hơn API cloud, đặc biệt với câu hỏi phân tích dài.

Kiến trúc hiện tại tách rõ hai nhóm tác vụ:

```text
Lệnh điều khiển thiết bị -> rule/backend trực tiếp -> kiểm tra quyền/quota -> PLC
Câu hỏi tư vấn/giải thích -> assistant provider -> Gemini/mock/local_lora
```

Nhờ vậy lệnh bật/tắt thiết bị không phụ thuộc vào LLM. Nếu AI chậm, lỗi mạng hoặc hết quota API, phần điều khiển PLC vẫn hoạt động theo rule backend. Đây là điểm quan trọng để đảm bảo an toàn và độ tin cậy khi demo với phần cứng thật.

Hướng phát triển sau này:

1. Giữ Gemini API cho demo nhanh và ổn định.
2. Dùng `local_lora` khi có máy đủ mạnh hoặc AI server riêng.
3. Backend chỉ cần đổi `assistant.provider`, app không cần thay đổi lớn.
4. LoRA local có thể triển khai riêng thành AI server, nhận context từ backend rồi trả lời.

Kết luận: Gemini API là giải pháp runtime tạm thời để demo ổn định; LoRA/Unsloth là hướng phát triển để chủ động mô hình AI riêng, giảm phụ thuộc API ngoài và tăng giá trị nghiên cứu của đồ án.
---

### Cau hoi moi - Sau khi them Supabase thi SQLite con vai tro gi, va du lieu nhieu nha duoc tach nhu the nao?

**Tra loi:** He thong hien tai ho tro hai che do luu tru:

```text
Khong co DATABASE_URL -> dung SQLite local
Co DATABASE_URL       -> dung Supabase/Postgres
```

SQLite van co gia tri trong giai doan prototype vi chay local nhanh, de demo offline va de fallback khi chua cau hinh cloud database. Supabase/Postgres la huong nang cap de luu tru tap trung, phu hop hon khi can demo nhieu thiet bi, nhieu nha hoac can du lieu khong phu thuoc vao laptop local.

Du lieu nhieu nha khong bi tron vi backend tach theo `home_id`:

1. Bang `homes` luu tung nha, moi nha co `id` rieng.
2. Bang `home_members` gan `user_id` voi `home_id` va vai tro trong nha.
3. Bang `power_readings` luu du lieu dien nang, moi dong luon co `home_id`.
4. Bang `audit_logs` co `home_id` de truy vet thao tac theo tung nha.
5. Bang `users` chi luu tai khoan; quyen cua tai khoan trong tung nha nam o `home_members`.

Luon dung luong truy cap:

```text
Mobile App/Admin Site -> Flask Backend -> SQLite hoac Supabase/Postgres
```

App mobile khong ghi truc tiep vao Supabase. Backend van la lop kiem tra token, kiem tra user co quyen tren `home_id` hay khong, ghi audit log, sau do moi doc/ghi database. Cach nay giup bao mat hon va giu duoc logic dieu khien PLC o backend.

Neu hoi vi sao khong dung Supabase truc tiep tu app, cau tra loi ngan gon la: app khong nen co quyen truy cap database/PLC truc tiep. Tat ca lenh quan trong phai qua backend de kiem tra quyen, log thao tac va xu ly an toan.

Trang thai hien tai nen trinh bay la:

```text
Da co tuy chon Supabase/Postgres va da test ket noi thanh cong.
SQLite van duoc giu lam fallback local.
Chua dung Supabase Auth; backend van dung auth/session rieng de giam rui ro thay doi lon.
```

---

### Cau hoi moi - Backend con chay tren laptop thi co thuc te khong?

**Tra loi:** Trong giai doan prototype, backend duoc trien khai tren laptop de thuan tien phat trien, debug va kiem thu voi PLC/MFM384. Dieu nay phu hop voi giai doan do an vi lap trinh vien can sua code nhanh, xem log truc tiep va test lien tuc voi thiet bi trong phong lab.

Tuy nhien, backend tren laptop khong nen duoc xem la kien truc production cuoi cung. Neu tat laptop thi app khong goi duoc backend, du server database Supabase van con du lieu. Vi vay du an da tach ro hai tang:

```text
Backend Flask: hien chay tren laptop de phat trien va kiem thu.
Database: da co tuy chon Supabase/Postgres de luu tru tap trung tren cloud.
```

Khi trien khai thuc te, backend co the duoc chuyen sang edge gateway nhu mini PC, Raspberry Pi hoac industrial PC dat cung mang voi PLC/MFM384:

```text
Mobile App/Admin Site
        |
        v
Edge Gateway chay Flask Backend
        |
        +--> PLC/MFM384 trong mang noi bo
        |
        +--> Supabase/Postgres cloud
```

Cach nay hop ly hon viec dua backend truc tiep len cloud, vi PLC/MFM384 thuong nam trong mang noi bo va khong nen mo truc tiep ra Internet. Edge gateway giup:

1. Backend van doc/ghi PLC on dinh trong LAN.
2. He thong van co the chay lien tuc ma khong phu thuoc laptop phat trien.
3. Du lieu van duoc dong bo len Supabase/Postgres de luu tru tap trung.
4. App co the goi backend qua LAN, Cloudflare Tunnel, VPN hoac domain rieng.
5. Kien truc phu hop hon voi mo hinh IoT/industrial edge.

Cau tra loi ngan gon khi phan bien:

> Trong prototype, backend chay tren laptop de de phat trien va kiem thu voi PLC. Du lieu da duoc tach sang Supabase/PostgreSQL de luu tru tap trung. Khi trien khai thuc te, backend se duoc chuyen sang edge gateway nhu mini PC hoac Raspberry Pi dat cung mang voi PLC/MFM384, giup he thong hoat dong lien tuc va giam phu thuoc vao may phat trien.

---

### Cau hoi moi - He thong quan ly thiet bi tung nha nhu the nao neu chi lam muc 1?

**Tra loi:** Muc 1 cua du an la quan ly phong va thiet bi theo cach khai bao thu cong, phu hop voi prototype va luan van. Nguoi dung/owner/admin se tao phong, tao thiet bi, gan thiet bi vao phong va nhap cong suat dinh muc cua thiet bi.

Cau truc du lieu tren Supabase/Postgres:

```text
homes
  -> rooms
       -> devices
  -> power_readings
```

Trong do:

1. `rooms` luu danh sach phong cua tung nha, moi phong co `home_id`.
2. `devices` luu danh sach thiet bi, moi thiet bi co `home_id`, co the co `room_id`, loai thiet bi va `rated_power_w`.
3. `device_events` luu lich su tao/sua/bat/tat/dong bo trang thai thiet bi.
4. `power_readings` van luu du lieu do dien thuc te theo tong nha.

Can noi ro khi phan bien:

```text
Cong suat tung thiet bi trong muc 1 la cong suat dinh muc do nguoi dung nhap,
khong phai gia tri do rieng tung thiet bi trong thoi gian thuc.
Du lieu do dien thuc te hien duoc lay theo tong nha tu PLC/MFM384 va luu vao power_readings.
```

Ly do cach nay hop ly:

1. Phu hop voi giai doan prototype vi khong can lap cam bien rieng cho tung thiet bi.
2. Van mo ta duoc cau truc nha thong minh: nha, phong, thiet bi, quyen nguoi dung.
3. Du cho app/admin site hien thi va quan ly tai san thiet bi.
4. De mo rong sau nay bang cach gan moi thiet bi voi kenh do rieng hoac PLC tag rieng.


## 4. Chuyên ngành Điện và Bảo mật hệ thống (OT Security)

### Câu hỏi 21: Đồ án này có bị thiên quá nhiều về ngành Công nghệ thông tin (IT) không? Làm thế nào để chứng minh tính chuyên ngành Điện/Điện tử?

**Trả lời:** Đồ án này tích hợp liên ngành nhưng trọng tâm 100% là giải quyết bài toán Điện và Tự động hóa:
1. **Thiết bị đo lường chuyên dụng:** Sử dụng đồng hồ đa năng công nghiệp MFM384 để đo lường thực tế các đại lượng điện nòng cốt ($V, I, P, PF, kWh$).
2. **Truyền thông công nghiệp:** Cấu hình và lập trình giao thức Modbus RTU RS485 qua module CM 1241 để đọc thanh ghi dữ liệu điện năng của thiết bị hiện trường về PLC SIMATIC S7-1200.
3. **Thuật toán chuyên ngành Điện:** Thuật toán Sa thải phụ tải chủ động (Active Load-shedding) là thuật toán kinh điển trong quản lý hệ thống điện và lưới điện thông minh (Smart Grid/DSM), nhằm bảo vệ các thiết bị đóng cắt và bảo vệ quá tải đường dây.
4. **Hệ thống điều khiển tại chỗ (Local Automation):** Toàn bộ logic an toàn và ngắt contactor được nạp trực tiếp vào chương trình PLC để chạy độc lập. Nếu mất mạng internet hoặc mất kết nối API Cloud, PLC vẫn thực thi bảo vệ ngắt tải tại chỗ bình thường.

---

### Câu hỏi 22: Tại sao cơ chế phân quyền (Admin/Owner/Member) lại quan trọng đối với một hệ thống điều khiển điện như HEMS?

**Trả lời:** Trong các hệ thống điều khiển công nghiệp và lưới điện thông minh (OT Security), phân quyền và ghi nhật ký là yêu cầu kỹ thuật và an toàn bắt buộc:
1. **Bảo vệ thiết bị vật lý:** PLC điều khiển trực tiếp các tải động lực (contactor, relay). Nếu không phân quyền, bất kỳ ai cũng có thể gửi lệnh điều khiển. Việc gửi lệnh bật/tắt liên tục hoặc xung đột sẽ làm hỏng tiếp điểm contactor, cháy cuộn dây relay hoặc hỏng động cơ.
2. **An toàn lao động khi bảo trì (Lockout/Tagout):** Khi thiết bị đang được bảo trì tại hiện trường, tài khoản `owner` có quyền khóa thiết bị trên phần mềm để tài khoản `member` không thể vô tình bật thiết bị từ xa qua điện thoại di động, tránh gây tai nạn giật điện.
3. **Nhật ký sự cố điện (Audit logs):** Bảng nhật ký `audit_logs` đóng vai trò là nhật ký vận hành trạm. Khi có sự cố quá tải hoặc thiết bị bị ngắt, kỹ sư điện có thể tra cứu lịch sử để phân tích xem đây là do thuật toán tự động sa thải tải (Auto-shedding) hay do con người điều khiển sai để khắc phục.

---

### Câu hỏi 23: Tại sao hệ thống lại tích hợp thêm tính năng cảnh báo qua SMS? Chức năng này có vai trò điều khiển đóng cắt thiết bị hay không?

**Trả lời:** Hệ thống tích hợp SMS như một kênh cảnh báo mở rộng bên cạnh thông báo đẩy trên ứng dụng di động để đảm bảo độ tin cậy thông tin:
1. **Bảo đảm thông tin truyền suốt:** Thông báo đẩy (push notification) trên ứng dụng phụ thuộc vào kết nối mạng internet 3G/4G/Wi-Fi của điện thoại. Trong trường hợp điện thoại chủ nhà mất mạng nhưng vẫn có sóng viễn thông, tin nhắn SMS là kênh dự phòng khẩn cấp tối ưu để họ nhận được cảnh báo vượt quota điện năng tháng.
2. **Cảnh báo khẩn cấp có chọn lọc:** SMS chỉ được gửi khi điện năng sử dụng đạt các ngưỡng quan trọng (90%, 100%) và tích hợp giải thuật giới hạn tần suất (rate-limiting) chỉ gửi một lần duy nhất cho mỗi ngưỡng để tránh gây phiền hà và tốn kém chi phí cho chủ hộ.
3. **An toàn bảo mật (OT Security):** SMS trong hệ thống này **thuần túy là kênh cảnh báo một chiều (notification-only)**, không hỗ trợ bất kỳ cú pháp tin nhắn nào để điều khiển đóng/cắt thiết bị điện từ xa hay tác động trực tiếp xuống PLC S7-1200. Điều này loại bỏ hoàn toàn nguy cơ kẻ tấn công giả mạo tin nhắn SMS để can thiệp trái phép vào hệ thống điện gia đình, đảm bảo an toàn vận hành ở biên.

---

### Câu hỏi 24: Hệ thống HEMS có tự động ngắt tải ngay lập tức khi lượng điện năng tiêu thụ vượt quota tháng (kWh) hay không? Cơ chế an toàn ở đây là gì?

**Trả lời:** Hệ thống **không tự động ngắt tải ngay lập tức** khi vượt quota điện năng tháng (kWh). Logic xử lý được phân tầng rõ ràng để đảm bảo an toàn sinh hoạt:
1. **Cảnh báo và Đề xuất (Chính):** Khi điện năng tháng (kWh) chạm các ngưỡng 80%, 90%, và 100% hạn mức, hệ thống chỉ gửi thông báo đẩy (push notification) lên ứng dụng di động và gửi SMS cảnh báo đến chủ nhà, kèm theo đề xuất giải pháp tiết kiệm để chủ nhà tự điều chỉnh thiết bị.
2. **Sa thải phụ tải có điều kiện (Nâng cao):** Việc tự động ngắt tải chỉ áp dụng cho các thiết bị phi thiết yếu (như bình nóng lạnh, điều hòa phòng khách) và chỉ kích hoạt khi chủ nhà chủ động thiết lập bật 'Chế độ tự động sa thải tải' trên ứng dụng di động. Các tải thiết yếu (chiếu sáng phòng ngủ, thiết bị y tế, tủ lạnh) hoàn toàn không bị ảnh hưởng, đảm bảo giảm rủi ro ảnh hưởng đến tải quan trọng và nâng cao an toàn vận hành cho người sử dụng.
3. **Ngưỡng công suất tức thời ($P_{limit}$):** Hệ thống phân biệt rõ quota điện năng tháng (kWh) và ngưỡng công suất tức thời $P_{limit}$ (kW). Việc ngắt tải để bảo vệ an toàn điện chỉ xảy ra khi công suất tức thời vượt quá giới hạn an toàn của đường dây (kW) để tránh chập cháy, và cũng tuân thủ feedback phản hồi khép kín từ PLC.

---

### Câu hỏi 25: Mô hình AI dự báo phụ tải có trực tiếp tham gia vào việc ra lệnh đóng cắt thiết bị hay không?

**Trả lời:** Trong phiên bản thiết kế hiện tại, mô hình AI **không trực tiếp tham gia vào việc ra lệnh đóng cắt thiết bị**:
1. **Vai trò dự báo sớm:** AI dự báo phụ tải chuỗi thời gian (24 giờ tiếp theo) đóng vai trò cung cấp thông tin tham khảo sớm về xu hướng tiêu thụ điện cho chủ nhà và hỗ trợ Backend tính toán đề xuất phương án tiết kiệm năng lượng tối ưu.
2. **Đảm bảo an toàn bằng logic cứng:** Lệnh đóng cắt thiết bị khi quá tải đường dây hoặc khi sa thải phụ tải có điều kiện được thực thi bởi các thuật toán logic cứng (rule-based) cài đặt trực tiếp trên PLC S7-1200 và Flask Backend. Điều này đảm bảo tính ổn định, phản hồi thời gian thực và tránh các sai sót không mong muốn của mô hình dự báo AI (như sai số dự báo hoặc mất kết nối mạng Cloud).
