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
