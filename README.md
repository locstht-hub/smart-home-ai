# Smart Home AI

Smart Home AI là đồ án giám sát điện năng và điều khiển nhà thông minh dùng MFM384, PLC Siemens S7-1200 CPU 1215C, backend API, app Android và website giới thiệu.

## Trạng thái hiện tại

Trước khi làm tiếp dự án bằng IDE khác, đọc file:

```text
PROJECT_STATUS_CURRENT.md
```

Mốc mới nhất đã có:

- Xác minh phần mềm ngày 10/09/2026: backend/control suite **42/42**, frontend
  contract **22/22** và web dashboard **21/21**; forecast contracts **7 Python +
  2 Node**, research HEAD **7**, admin audit **5** và room presentation **3**
  đều đạt. `npm run lint` và Python compilation cũng đạt.
- Bản ghi ngày 09/09/2026 được giữ để truy vết: backend/control **39/39**,
  frontend **22/22**, lint và Android JavaScript export **1509 modules**.
- QA native còn chờ vì không có thiết bị `adb` hoặc AVD khả dụng; chưa ghi nhận
  cài APK hay triển khai server. Sa thải tải tự động vẫn bị khóa bởi
  `AUTO_LOAD_SHEDDING_KW_SAFETY_READY=False`. Astra đã duyệt index đã sửa ngày 10/09; không còn lỗi đáng kể trong phạm vi rà soát.
- Backend Flask vẫn là lớp API trung tâm.
- Supabase/PostgreSQL đã được thêm để lưu dữ liệu tập trung.
- Schema Supabase đã có `users`, `homes`, `home_members`, `audit_logs`, `power_readings`, `rooms`, `devices`, `device_events`.
- Admin site đã đăng nhập được, xem nhà/tài khoản/nhật ký, và quản lý thủ công phòng/thiết bị.
- Mobile RoomsScreen đã nối với API rooms/devices thủ công.
- Dự án đang ở mức prototype/luận văn, phù hợp để demo và tiếp tục kiểm thử phần cứng.

Đọc [bản đồ tài liệu hiện hành](docs/CANONICAL_DOCUMENT_MAP.md) để biết nguồn
ưu tiên cho từng nhóm thông tin. Báo cáo xác minh phần mềm nằm tại
`outputs/chatbot-fix-20260909/VERIFICATION.md`; cẩm nang phản biện và dàn ý
luận văn chỉ mô tả thiết kế, giới hạn và kế hoạch kiểm thử.

Các metrics, báo cáo và bản thảo nghiên cứu ngày 04/09/2026 là bản ghi cục bộ
được giữ để truy vết. Lượt đồng bộ app + main docs không xuất bản các hồ sơ đó
và không phải là khẳng định bài báo đã được nhận hoặc công bố.

## Thành phần

- `src/`: app React Native / Expo.
- `backend/smart_home_server/`: Flask API chính cho app, thiết bị và dữ liệu công suất.
- `backend/forecast_api/`: API dự báo phụ tải bằng model ML.
- `backend/plc_gateway/`: API/gateway thử nghiệm đọc PLC.
- `ml-training/`: script huấn luyện model và tài liệu ML.
- `project-site/`: website tĩnh giới thiệu đồ án, deploy được lên Cloudflare Pages.

## Domain

```text
https://smarthomeai.id.vn      -> website giới thiệu tĩnh
https://api.smarthomeai.id.vn  -> API backend qua Cloudflare Tunnel
```

## Chạy app

```powershell
npm install
npm start
```

Android:

```powershell
npm run android
```

## Chạy backend API local

```powershell
cd backend\smart_home_server
python -m venv .venv
.venv\Scripts\Activate.ps1
pip install -r requirements.txt
python app.py
```

API local:

```text
http://127.0.0.1:5001/health
```

## Cloudflare Tunnel

Máy laptop có thể chạy backend local và public qua Cloudflare Tunnel:

```text
https://api.smarthomeai.id.vn -> http://localhost:5001
```

Script hỗ trợ trên máy local nằm ở:

```text
C:\tmp\smart-home-api-runner
```

Các script này không nằm trong repo vì chứa token/môi trường riêng của máy.

## Deploy website giới thiệu

Upload thư mục:

```text
project-site
```

lên Cloudflare Pages bằng Direct Upload hoặc Git integration.

## Ghi chú GitHub

Repo đã ignore các file nặng/tạm:

- `node_modules/`
- `.venv/`
- `android/`, `ios/`, build output
- log, APK/AAB
- model artifact như `.joblib`, `.keras`, `model_artifacts.zip`
- config runtime như `backend/**/config.json`

Artifact forecast production `ml-training/modeltrainingdone/best_model.joblib` là ngoại lệ có chủ đích: file khoảng 7,61 MiB được lưu trực tiếp trong Git và kiểm tra bằng SHA-256 trong `artifact_manifest.json`. Cách này giúp clean clone chạy được mà không phụ thuộc liên kết tải ngoài. Các artifact thử nghiệm `.joblib`, `.keras` và ZIP khác tiếp tục bị loại khỏi Git.
