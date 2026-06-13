# TÓM TẮT TIẾN ĐỘ DỰ ÁN SMART HOME AI

**Ngày cập nhật:** 25/05/2026  
**Tên dự án:** Smart Home AI / Hệ thống quản lý năng lượng nhà thông minh  
**Mục đích tài liệu:** Tóm tắt khách quan dự án đã làm đến đâu, phần nào đã có, phần nào chưa có, để người khác đọc có thể nắm nhanh trạng thái hiện tại.

---

## 1. Tổng quan dự án

Dự án hướng đến xây dựng một hệ thống nhà thông minh có tích hợp quản lý năng lượng và AI, bao gồm:

- Ứng dụng di động để người dùng giám sát và điều khiển thiết bị.
- Backend API làm trung gian giữa app, cơ sở dữ liệu, AI và phần cứng.
- Cơ sở dữ liệu lưu thông tin người dùng, nhà, thiết bị, dữ liệu điện năng và hạn mức sử dụng.
- API dự báo phụ tải bằng mô hình AI.
- Định hướng kết nối thực tế với PLC, đồng hồ điện MFM384, relay/contactor và tải điện.

Trạng thái phù hợp nhất để mô tả hiện tại là: **prototype phần mềm tương đối hoàn chỉnh, đang chuẩn bị sang giai đoạn kiểm thử phần cứng thực tế**.

---

## 2. Kiến trúc tổng quan

Kiến trúc phần mềm hiện tại:

```text
Mobile App
   |
   | Gọi API
   v
Backend API
   |
   | Lưu và đọc dữ liệu
   v
SQLite Database
   |
   | Dữ liệu điện năng lịch sử
   v
Forecast API / AI Model
   |
   | Trả kết quả dự báo
   v
Mobile App hiển thị kết quả
```

Kiến trúc dự kiến khi kết nối phần cứng:

```text
App
   |
Backend
   |
PLC Command DB / Tag
   |
PLC Logic
   |
Relay trung gian / Contactor
   |
Tải điện thật hoặc tải giả

PLC Status Tag
   |
Backend đọc lại trạng thái
   |
App đồng bộ trạng thái hiển thị
```

Nguyên tắc thiết kế quan trọng: **app không nên ghi trực tiếp vào PLC**. App gửi lệnh lên backend, backend kiểm tra quyền và ghi log, sau đó mới ghi lệnh xuống PLC. PLC xử lý logic điều khiển cuối cùng và backend đọc lại trạng thái thực tế từ PLC để đồng bộ lên app.

---

## 3. Những phần đã làm được

### 3.1. Ứng dụng mobile

Đã có ứng dụng mobile phục vụ các chức năng chính:

- Đăng nhập và đăng ký tài khoản.
- Quản lý nhà/hộ gia đình.
- Quản lý thành viên trong nhà.
- Xem và điều khiển thiết bị.
- Xem dữ liệu năng lượng.
- Xem kết quả dự báo phụ tải AI.
- Thiết lập hạn mức/quota sử dụng điện.

Ứng dụng đã đủ để trình bày ở mức prototype và dùng làm giao diện chính cho hệ thống.

### 3.2. Backend API

Đã có backend làm lớp trung gian giữa app, database, AI và phần cứng dự kiến.

Backend hiện có vai trò:

- Quản lý người dùng.
- Quản lý nhà.
- Quản lý thành viên.
- Quản lý thiết bị.
- Quản lý dữ liệu điện năng.
- Quản lý quota/hạn mức điện.
- Cung cấp API cho app.
- Là nền tảng để sau này kết nối PLC.

Endpoint dữ liệu điện năng cần dùng đúng là:

```text
/api/power/readings
```

Cần tránh ghi nhầm thành `/api/power/report` nếu trong code hiện tại không có endpoint đó.

### 3.3. Cơ sở dữ liệu

Hệ thống hiện dùng SQLite cho giai đoạn prototype.

SQLite phù hợp hiện tại vì:

- Dễ chạy local.
- Dễ demo.
- Không cần cấu hình máy chủ phức tạp.
- Phù hợp với giai đoạn phát triển và kiểm thử ban đầu.

Nếu triển khai thật cho nhiều nhà, nhiều người dùng hoặc dữ liệu lớn, nên chuyển sang PostgreSQL hoặc hệ cơ sở dữ liệu phù hợp production hơn.

### 3.4. Forecast API và mô hình AI

Dự án đã có phần AI dự báo phụ tải riêng.

Các thư mục liên quan:

```text
backend/forecast_api/
ml-training/
```

Một số artifact/model đã có:

```text
ml-training/modeltrainingdone/best_model.joblib
ml-training/modeltrainingdone/xgboost_model.joblib
ml-training/modeltrainingdone/random_forest_model.joblib
ml-training/modeltrainingdone/metrics.json
ml-training/modeltrainingdone/sample_forecast.json
```

AI hiện tại nên được hiểu là **mô hình dự báo số liệu điện năng/phụ tải**, không phải chatbot hay mô hình ngôn ngữ.

Cần phân biệt rõ:

- XGBoost/Random Forest/LSTM: dùng để dự báo số liệu điện năng.
- Unsloth/fine-tune tiếng Việt: nếu làm sau này thì dùng cho trợ lý giải thích, tư vấn, trả lời người dùng bằng tiếng Việt; không thay thế mô hình dự báo kW/kWh.

### 3.5. Tài liệu kỹ thuật và bài báo

Đã có các tài liệu trong dự án:

```text
README.md
TIEN_TRINH_DU_AN.md
TAI_LIEU_PHAN_BIEN_KIEN_TRUC.md
PLC_SERVER_MAPPING_GUIDE.md
HUONG_DAN_SU_DUNG_APP.md
```

Ngoài ra đã có bản thảo bài báo khoa học:

```text
C:\Users\ADMIN\Downloads\draft_scientific_paper.md
```

Nội dung bài báo đã được định hướng theo hướng khách quan hơn:

- Không khẳng định quá mức rằng hệ thống đã vận hành PLC thực tế nếu chưa kiểm thử.
- Mô tả hệ thống là prototype/SIL/edge-cloud framework.
- Nêu rõ các khối: app, backend, database, AI forecast và định hướng tích hợp PLC.

### 3.6. GitHub

Code chính đã được đẩy lên GitHub.

Thông tin hiện tại:

```text
Remote: https://github.com/locstht-hub/smart-home-ai.git
Branch: main
Commit mới nhất: e2dc3b8 Add home quota and member management
Trạng thái: main đang đồng bộ với origin/main
```

Lưu ý: file `TAI_LIEU_PHAN_BIEN_KIEN_TRUC.md` đang có chỉnh sửa local chưa commit/push tại thời điểm cập nhật tài liệu này.

---

## 4. Những phần chưa có hoặc chưa nên khẳng định đã hoàn tất

### 4.1. Chưa kiểm thử đầy đủ với PLC thực tế

Hiện tại chưa nên viết rằng hệ thống đã vận hành ổn định với PLC thực tế nếu chưa có:

- PLC thật đã nạp chương trình.
- Data Block/tag trong PLC nhận được lệnh từ backend.
- PLC điều khiển được ngõ ra thật.
- Backend đọc được trạng thái thật từ PLC.
- App hiển thị đúng trạng thái sau khi PLC điều khiển.

Nếu có nút nhấn vật lý đấu vào PLC thì về nguyên tắc có thể đồng bộ lên app, nhưng PLC cần ghi lại trạng thái và backend phải đọc trạng thái đó.

### 4.2. Chưa có dữ liệu MFM384 thực tế

Cần kiểm tra thêm với đồng hồ điện MFM384 thật:

- Đọc điện áp, dòng điện, công suất, điện năng.
- Xác nhận mapping thanh ghi Modbus.
- Kiểm tra sai số dữ liệu.
- Kiểm tra chu kỳ đọc dữ liệu.
- Lưu dữ liệu đọc được vào backend/database.

Khi chưa có dữ liệu MFM384 thật, phần AI nên được trình bày là dự báo trên dữ liệu huấn luyện/mẫu, chưa phải mô hình đã được hiệu chỉnh bằng dữ liệu nhà thật.

### 4.3. Chưa hoàn tất tủ điện và tải thực tế

Cần làm rõ bố trí phần cứng:

- Tủ điện đặt PLC, MCB, nguồn 24VDC, relay trung gian, contactor, terminal và MFM384.
- Nhà mô hình đặt đèn, quạt, ổ cắm mô phỏng, nút nhấn và đèn báo.
- Tải thật hoặc tải giả nên được tách mạch an toàn, không điều khiển trực tiếp bằng ngõ ra PLC nếu tải lớn.

Khuyến nghị phần cứng:

- PLC chỉ điều khiển relay trung gian.
- Relay trung gian điều khiển contactor hoặc relay công suất.
- Tải thật đi qua contactor/relay công suất.
- Đèn báo có thể đấu theo trạng thái output hoặc tiếp điểm phụ để phản ánh trạng thái thực.
- Nên có feedback về PLC để app biết thiết bị thật đang bật hay tắt.

### 4.4. Chưa có cơ chế tự động cắt tải hoàn chỉnh

Hệ thống đã có ý tưởng quota/hạn mức điện, nhưng nếu chưa lập trình và test các phần dưới đây thì chưa nên gọi là demand response hoàn chỉnh:

- Tự động cắt tải khi vượt hạn mức.
- Ưu tiên tải nào cắt trước.
- Điều kiện an toàn khi cắt tải.
- Cho phép người dùng xác nhận trước khi cắt.
- Ghi log sự kiện cắt tải.

Nên mô tả hiện tại là: **đã có nền tảng quản lý quota và định hướng điều khiển tải theo hạn mức**.

### 4.5. Chưa có auto retrain model

Workflow AI hiện tại nên hiểu như sau:

```text
Dữ liệu lịch sử
   |
Train offline
   |
Sinh model artifact
   |
Forecast API load model
   |
Trả kết quả dự báo
```

Chưa có pipeline tự động:

```text
Dữ liệu mới
   |
Tự động làm sạch
   |
Tự động train lại
   |
Tự động đánh giá
   |
Tự động thay model
   |
Tự động restart API
```

Nếu muốn làm tiếp, cần bổ sung retraining pipeline riêng.

### 4.6. Chưa cần fine-tune Unsloth ở giai đoạn này

Unsloth chỉ nên làm nếu mở rộng hệ thống thành trợ lý tiếng Việt cho quản lý năng lượng, ví dụ:

- Giải thích vì sao tiền điện tăng.
- Gợi ý cách tiết kiệm điện.
- Trả lời câu hỏi của người dùng bằng tiếng Việt.
- Tóm tắt báo cáo tiêu thụ điện.

Unsloth không phải thành phần bắt buộc để chứng minh mô hình dự báo phụ tải. Với bài báo hiện tại, nên ưu tiên hoàn thiện HEMS, AI forecast và kiểm thử PLC trước.

### 4.7. Chưa sẵn sàng gọi là production

Hệ thống hiện tại nên gọi là prototype hoặc proof-of-concept, vì vẫn cần:

- Kiểm thử bảo mật.
- Kiểm thử tải thực tế.
- Logging/monitoring đầy đủ.
- Database phù hợp production.
- Cơ chế backup/restore.
- Kiểm thử trên nhiều thiết bị di động.
- Kiểm thử các tình huống mất mạng, mất điện, PLC mất kết nối.

---

## 5. Trạng thái kiểm thử

### Đã có thể kiểm tra

- Code project đã có đầy đủ các module chính.
- Backend và app có cấu trúc rõ ràng.
- Forecast API có model artifact để nạp và dự báo.
- Tài liệu dự án và bài báo đã có khung nội dung.
- GitHub đã có code mới nhất trên branch `main`.

### Cần kiểm thử tiếp

- App chạy trên điện thoại thật.
- Backend chạy liên tục và app gọi API ổn định.
- Forecast API trả dữ liệu đúng định dạng app cần.
- PLC nhận lệnh từ backend.
- PLC đọc nút nhấn vật lý và đồng bộ status về backend/app.
- MFM384 trả dữ liệu thực qua Modbus.
- Relay/contactor điều khiển tải thật an toàn.
- Số liệu hiển thị trên các trang app có đồng nhất với database/API hay không.

---

## 6. Workflow AI dự báo hiện tại

```text
Dữ liệu điện năng lịch sử
   |
Script train model trong ml-training
   |
Sinh model artifact .joblib / .keras
   |
Forecast API load model
   |
Backend hoặc app gọi API dự báo
   |
App hiển thị biểu đồ/kết quả dự báo
```

Nếu sau này có PLC và MFM384 thật:

```text
MFM384
   |
PLC / gateway đọc dữ liệu
   |
Backend ghi vào power_readings
   |
Database tích lũy dữ liệu thật
   |
Retrain model bằng dữ liệu thật
   |
Forecast API dự báo sát với nhà thật hơn
```

---

## 7. Nên làm gì tiếp theo

Thứ tự ưu tiên đề xuất:

1. Tạm dừng thêm tính năng lớn trên app.
2. Hoàn thiện bài báo khoa học và tài liệu bảo vệ.
3. Lập danh sách tag/Data Block PLC cần có: command, status, feedback, power readings.
4. Đấu thử PLC với ít nhất một tải nhỏ và một đèn báo.
5. Đọc dữ liệu thật từ MFM384 và lưu vào `/api/power/readings`.
6. Kiểm tra app có đồng bộ đúng khi bật/tắt bằng nút vật lý hay không.
7. Thu thập dữ liệu thật trong một khoảng thời gian.
8. Sau khi có dữ liệu thật, mới retrain model.
9. Nếu còn thời gian, làm Unsloth/fine-tune tiếng Việt như một hướng mở rộng.

---

## 8. Đánh giá khách quan

Dự án đã có nền tảng phần mềm tốt để trình bày một hệ thống nhà thông minh kết hợp AI. Điểm mạnh là có đủ các khối quan trọng: app, backend, database, forecast API, model AI và tài liệu kỹ thuật.

Điểm còn yếu là phần thực nghiệm phần cứng chưa được xác nhận đầy đủ. Vì vậy khi viết báo cáo hoặc bài báo, nên trình bày trung thực rằng hệ thống đang ở mức prototype và cần kiểm thử thực tế với PLC, MFM384 và tải điện.

Một câu tóm tắt ngắn gọn:

> Dự án đã hoàn thành nền tảng phần mềm và mô hình AI dự báo cho hệ thống quản lý năng lượng nhà thông minh; bước tiếp theo là kiểm thử với PLC, đồng hồ điện và tải thực tế để biến prototype thành hệ thống vận hành thực nghiệm hoàn chỉnh.
---

## Cap nhat 13/06/2026 - Supabase/Postgres

Du an da duoc bo sung tuy chon luu tru cloud bang Supabase/Postgres, nhung van giu SQLite local lam fallback.

Kien truc luu tru hien tai co hai che do:

```text
Khong co DATABASE_URL -> Flask Backend -> SQLite local
Co DATABASE_URL       -> Flask Backend -> Supabase/Postgres
```

Thay doi da lam:

- Tao migration SQL cho Supabase/Postgres tai `backend/smart_home_server/migrations/001_supabase_schema.sql`.
- Tao `PostgresAuthStore` tai `backend/smart_home_server/postgres_auth_store.py`.
- Backend tu doc bien moi truong `DATABASE_URL` de chon database.
- Them `.env.example` va ho tro doc `.env` local bang `python-dotenv`.
- Cap nhat README backend va `SUPABASE_MIGRATION_PLAN.md`.
- Da test ket noi Supabase thanh cong: login owner/admin, doc `/api/me`, ghi/doc `power_readings`, xem admin homes/users/audit logs.

Cac bang tren Supabase/Postgres:

```text
users
homes
home_members
sessions
audit_logs
power_readings
rooms
devices
device_events
```

Nguyen tac phan tach du lieu nhieu nha:

```text
Moi nha co homes.id rieng.
Moi user thuoc nha nao duoc quan ly qua home_members.
Moi ban ghi dien nang trong power_readings luon gan voi home_id.
Audit log cung co home_id de truy vet thao tac theo tung nha.
```

Dieu can trinh bay trong luan van:

- SQLite la tang luu tru local cho giai doan prototype.
- Supabase/Postgres la huong nang cap cloud storage de luu tap trung user, home, role, quota, audit log va power readings.
- App mobile khong truy cap Supabase truc tiep; app van goi Flask Backend.
- Backend van la lop kiem tra token, phan quyen theo `home_id`, ghi audit log va giao tiep PLC.
- Supabase/Postgres giup du lieu khong phu thuoc vao file SQLite tren laptop va phu hop hon khi demo nhieu thiet bi/nhieu nha.
- Phan `rooms/devices` duoc xac dinh o muc 1: quan ly thu cong phong, thiet bi va cong suat dinh muc. Du lieu do dien thuc te hien van la tong nha trong `power_readings`.

Luu y an toan:

- Khong commit `.env` that va khong dua password Supabase len GitHub.
- File `.env.example` chi chua placeholder.
- Neu connection string/password tung bi paste vao chat/log, nen reset database password tren Supabase va cap nhat lai `.env` local.

Trang thai Git gan nhat cua phan nay:

```text
c0e658dd Add Supabase Postgres backend option
9fe96565 Load backend environment from local env file
```

## Cap nhat 13/06/2026 - Rooms/Devices muc 1

Huong da chot cho du an la quan ly phong/thiet bi o muc 1:

```text
Owner/Admin tu tao phong -> them thiet bi -> nhap cong suat dinh muc -> gan PLC tag neu co.
```

Da them migration:

```text
backend/smart_home_server/migrations/002_manual_rooms_devices.sql
```

Bang moi:

```text
rooms          -> phong thuoc tung nha qua home_id
devices        -> thiet bi thuoc tung nha/phong, co rated_power_w
device_events  -> lich su tao/sua/bat/tat/dong bo trang thai thiet bi
```

Ghi chu quan trong khi viet luan van:

- `rated_power_w` la cong suat dinh muc do nguoi dung nhap hoac lay tu thong so thiet bi.
- He thong chua khang dinh do rieng cong suat tung thiet bi neu chua co kenh PLC/cam bien rieng.
- Du lieu dien thuc nghiem hien luu theo tong nha trong `power_readings`.
- Kien truc nay phu hop prototype vi cho thay cau truc nha thong minh ro rang, dong thoi van de mo rong sang do rieng tung thiet bi sau nay.
