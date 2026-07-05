# TEST PLAN LUAN VAN - Smart Home AI

Tai lieu nay dung de test he thong, thu thap so lieu thuc nghiem va gom bang chung dua vao luan van Smart Home AI.

## 1. Muc tieu kiem thu

Can chung minh duoc cac diem sau:

- App mobile dang nhap, hien thi du lieu, dieu khien thiet bi va phan quyen dung.
- Backend API dong vai tro trung gian giua app, database, PLC/MFM384 va AI Forecast.
- He thong doc duoc du lieu dien nang theo thoi gian: V, I, kW, kWh.
- Lenh dieu khien di qua API, co log va co trang thai phan hoi.
- AI Forecast co danh gia dinh luong bang MAE, RMSE, MAPE, R2.
- Website project va admin site trinh bay dung kien truc, trang thai va chuc nang quan tri.

## 2. Thong tin phien ban test

Ghi lai truoc moi dot test:

| Hang muc | Gia tri |
|---|---|
| Ngay test | |
| Nguoi test | |
| Commit Git | |
| Ten APK | app-release-arm64-v8a.apk |
| Kich thuoc APK | |
| Dien thoai test | |
| Android version | |
| Backend URL | |
| Forecast API URL | |
| PLC firmware / cau hinh | |
| MFM384 / dong ho dien | |

Lenh lay commit hien tai:

```powershell
git rev-parse --short HEAD
```

Lenh build APK release:

```powershell
npm run build:android:release
```

APK release mac dinh:

```text
android/app/build/outputs/apk/release/app-release-arm64-v8a.apk
```

## 3. Checklist test app mobile

### 3.1 Cai dat va mo app

| ID | Test case | Cach test | Ket qua mong doi | Pass/Fail | Ghi chu |
|---|---|---|---|---|---|
| APP-01 | Cai APK release | Cai `app-release-arm64-v8a.apk` len dien thoai | Cai dat thanh cong | | |
| APP-02 | Mo app lan dau | Bam icon app | App mo khong crash | | |
| APP-03 | Kiem tra logo/splash | Mo lai app | Hien thi dung logo Smart Home AI | | |
| APP-04 | Kiem tra ngon ngu | Di qua cac man hinh | Khong co loi font/ky tu la | | |

### 3.2 Dang nhap va tai khoan

| ID | Test case | Cach test | Ket qua mong doi | Pass/Fail | Ghi chu |
|---|---|---|---|---|---|
| AUTH-01 | Dang nhap owner | Nhap username/password owner do server cap | Dang nhap thanh cong | | |
| AUTH-02 | Dang nhap member | Nhap tai khoan member | Dang nhap thanh cong, quyen dung | | |
| AUTH-03 | Sai mat khau | Nhap sai mat khau | Bao loi ro rang, khong crash | | |
| AUTH-04 | Dang xuat | Vao Settings -> Dang xuat | Quay ve man Login | | |
| AUTH-05 | Doi mat khau | Doi mat khau tu Settings | Server cap nhat, tai khoan dang nhap lai duoc | | |
| AUTH-06 | Phan quyen member | Member vao man quan ly thanh vien | Bi an/chan neu khong co quyen | | |

### 3.3 Dashboard

| ID | Test case | Cach test | Ket qua mong doi | Pass/Fail | Ghi chu |
|---|---|---|---|---|---|
| DASH-01 | Load tong quan | Mo Dashboard | Co tong cong suat, dien nang, quota | | |
| DASH-02 | Refresh du lieu | Keo refresh/doi du lieu backend | Du lieu cap nhat dung | | |
| DASH-03 | Quota hop le | Nhap quota hop le | Luu thanh cong | | |
| DASH-04 | Quota sai | Nhap rong/chu/so am | Bao loi ro rang | | |
| DASH-05 | Tat tat ca thiet bi | Bam action tat tat ca | Backend nhan lenh, thiet bi doi trang thai | | |
| DASH-06 | Che do dem/vang nha | Kich hoat scene | Cac thiet bi muc tieu thay doi dung | | |

### 3.4 Rooms va thiet bi

| ID | Test case | Cach test | Ket qua mong doi | Pass/Fail | Ghi chu |
|---|---|---|---|---|---|
| ROOM-01 | Danh sach phong | Mo Rooms | Hien thi dung phong/thiet bi | | |
| ROOM-02 | Bat thiet bi | Bam ON mot thiet bi | Trang thai app va backend doi dung | | |
| ROOM-03 | Tat thiet bi | Bam OFF mot thiet bi | Trang thai app va backend doi dung | | |
| ROOM-04 | Bat/tat lien tuc | Bam 5-10 lan co khoang cach 1-2 giay | Khong bi lech trang thai | | |
| ROOM-05 | Dong bo nut vat ly | Bam nut vat ly tren PLC | App cap nhat trang thai that | | |
| ROOM-06 | Mat ket noi backend | Tat backend/roi mang | App bao loi ro rang | | |
| ROOM-07 | Them thiet bi | Them thiet bi neu role cho phep | Thiet bi moi hien dung | | |
| ROOM-08 | Xoa thiet bi | Xoa thiet bi neu role cho phep | Thiet bi bien mat va log duoc ghi | | |

### 3.5 Chat va voice

| ID | Test case | Cach test | Ket qua mong doi | Pass/Fail | Ghi chu |
|---|---|---|---|---|---|
| CHAT-01 | Gui cau hoi | Hoi ve trang thai nha/thiet bi | Bot tra loi hop ly | | |
| CHAT-02 | Lenh dieu khien bang text | Nhap "bat den phong khach" | Lenh duoc xu ly neu backend ho tro | | |
| CHAT-03 | Micro STT | Bam mic va noi cau lenh | Nhan dien duoc noi dung | | |
| CHAT-04 | Doc cau tra loi | Bot tra loi bang TTS | Am thanh ro, khong lap vo han | | |
| CHAT-05 | Tat doc | Bam mute | Bot khong doc nua | | |

### 3.6 Analysis va forecast

| ID | Test case | Cach test | Ket qua mong doi | Pass/Fail | Ghi chu |
|---|---|---|---|---|---|
| ANA-01 | Load bieu do | Mo Analysis | Bieu do hien dung, khong trong | | |
| ANA-02 | Forecast API online | Ket noi Forecast API | Co gia tri du bao | | |
| ANA-03 | Forecast API offline | Tat Forecast API | App dung fallback/bao loi ro rang | | |
| ANA-04 | Export PDF | Tao bao cao PDF | File tao duoc, noi dung dung | | |
| ANA-05 | Retrain action | Bam retrain neu server ho tro | Backend nhan yeu cau, app bao trang thai | | |

### 3.7 Settings

| ID | Test case | Cach test | Ket qua mong doi | Pass/Fail | Ghi chu |
|---|---|---|---|---|---|
| SET-01 | Cau hinh server | Nhap API URL/token | Luu va test ket noi duoc | | |
| SET-02 | Cau hinh Forecast API | Nhap URL forecast | Luu va goi duoc | | |
| SET-03 | Thong tin tai khoan | Mo thong tin ca nhan | Dung user/role/home | | |
| SET-04 | Dang xuat | Dang xuat | Xoa token/hien Login | | |

## 4. Checklist admin site

| ID | Test case | Cach test | Ket qua mong doi | Pass/Fail | Ghi chu |
|---|---|---|---|---|---|
| ADM-01 | Dang nhap admin | Vao admin site va login system_admin | Dang nhap thanh cong | | |
| ADM-02 | Tong quan | Mo dashboard admin | So nha/user/log hien dung | | |
| ADM-03 | Danh sach nha | Mo Homes | Co danh sach nha, owner, trang thai | | |
| ADM-04 | Chi tiet nha | Bam xem chi tiet | Tabs/du lieu hien dung | | |
| ADM-05 | Tao owner/home | Tao chu nha moi | Tao thanh cong, login duoc | | |
| ADM-06 | Khoa/mo user | Suspend/activate user | Trang thai thay doi dung | | |
| ADM-07 | Reset password | Reset password user | User dang nhap bang mat khau moi | | |
| ADM-08 | Audit log | Thuc hien thao tac roi xem log | Log co actor/action/time | | |

## 5. Checklist project site

| ID | Test case | Cach test | Ket qua mong doi | Pass/Fail | Ghi chu |
|---|---|---|---|---|---|
| WEB-01 | Trang chu | Mo `project-site/index.html` hoac domain | Layout dung, khong vo mobile/desktop | | |
| WEB-02 | Progress page | Mo `progress.html` | Noi dung dung trang thai moi | | |
| WEB-03 | Floating FAQ | Mo chatbot va hoi cau mau | Tra loi duoc tu knowledge base | | |
| WEB-04 | Link lien he | Bam email/GitHub/website | Link hoat dong | | |
| WEB-05 | Hinh app | Kiem tra anh `screen1.png` | Anh hien ro, khong meo | | |
| WEB-06 | Deploy | Sau push GitHub | Cloudflare/Pages cap nhat ban moi | | |

## 6. Thu thap du lieu dien nang

### 6.1 Cac cot du lieu can co

Nen xuat CSV voi cac cot sau:

```text
timestamp
voltage_v
current_a
power_kw
energy_kwh
frequency_hz
power_factor
home_id
room_id
device_id
device_name
device_state
command_source
command_action
command_success
command_latency_ms
api_latency_ms
forecast_value_kw
actual_value_kw
quota_percent
alert_level
note
```

### 6.2 Giai doan thu du lieu

| Dot | Thoi luong | Muc tieu | Can ghi |
|---|---:|---|---|
| DATA-01 | 10 phut | Khong tai / tai rat nhe | Noise nen, dien ap, dong dien gan 0 |
| DATA-02 | 20 phut | Tai nhe | 1 den/1 tai nho |
| DATA-03 | 20 phut | Tai trung binh | Nhieu thiet bi bat cung luc |
| DATA-04 | 20 phut | Tai cao | Gan nguong canh bao/quota |
| DATA-05 | 20 phut | Bat/tat lien tuc | Latency, do on dinh trang thai |
| DATA-06 | 1-3 ngay | Du lieu theo chu ky ngay | Du lieu de train/test forecast |

Toi thieu cho bao cao:

- Neu chua co dieu kien chay dai: thu 2-4 gio du lieu co nhieu muc tai.
- Neu co dieu kien tot: thu 1-3 ngay du lieu, chu ky lay mau 5-60 giay.

### 6.3 Quy tac lay mau

| Hang muc | Khuyen nghi |
|---|---|
| Chu ky lay mau | 5 giay, 10 giay hoac 60 giay |
| Don vi power | kW |
| Don vi energy | kWh |
| Timestamp | ISO 8601 hoac `YYYY-MM-DD HH:mm:ss` |
| Timezone | Asia/Bangkok |
| Missing data | Ghi rong va them `note` |
| Loi ket noi | Ghi `alert_level=connection_error` |

## 7. Kich ban test phan cung

| ID | Kich ban | Cach thuc hien | So lieu can lay |
|---|---|---|---|
| HW-01 | Khong tai | Tat tat ca tai | V, I, kW, kWh nen |
| HW-02 | Tai nhe | Bat 1 den/tai nho | Bien dong I/kW |
| HW-03 | Tai trung binh | Bat them quat/o cam | kW tang theo tai |
| HW-04 | Tai cao | Bat nhieu tai | Canh bao quota/overload neu co |
| HW-05 | Nut vat ly | Bam nut tren PLC | Trang thai app sync |
| HW-06 | Mat PLC | Rut/disable ket noi PLC | Backend/app bao loi |
| HW-07 | Mat backend | Tat backend | App khong crash, bao loi |
| HW-08 | Mat forecast API | Tat forecast service | Analysis dung fallback/bao loi |

## 8. Danh gia AI Forecast

### 8.1 Chia tap du lieu

| Tap | Ty le goi y | Muc dich |
|---|---:|---|
| Train | 70% | Huan luyen model |
| Validation | 15% | Chon tham so |
| Test | 15% | Bao cao ket qua cuoi |

Neu du lieu it, co the dung chia theo thoi gian:

- 80% thoi gian dau de train.
- 20% thoi gian sau de test.

### 8.2 Chi so can bao cao

| Metric | Y nghia |
|---|---|
| MAE | Sai so tuyet doi trung binh |
| RMSE | Phat nang cac sai so lon |
| MAPE | Sai so phan tram, de trinh bay trong luan van |
| R2 Score | Do giai thich bien thien du lieu |
| Inference time | Thoi gian model tra du bao |

### 8.3 Bang so sanh model

| Model | MAE | RMSE | MAPE | R2 | Inference time | Nhan xet |
|---|---:|---:|---:|---:|---:|---|
| Random Forest | | | | | | |
| XGBoost | | | | | | |
| LSTM | | | | | | |
| CNN-LSTM | | | | | | |

### 8.4 Bieu do can co

- Bieu do `actual_power_kw` theo thoi gian.
- Bieu do `forecast_value_kw` vs `actual_value_kw`.
- Bieu do sai so theo thoi gian.
- Bieu do so sanh MAE/RMSE/MAPE giua cac model.

## 9. Do hieu nang he thong

| Metric | Cach do | Muc tieu tham khao |
|---|---|---|
| Login latency | Bam login den vao Dashboard | < 2 giay |
| Dashboard load | Mo Dashboard den khi co du lieu | < 2 giay |
| Device command latency | Bam ON/OFF den khi trang thai that doi | < 1-2 giay local |
| API latency | Log backend request time | < 500 ms local, < 2 giay cloud |
| Forecast latency | Goi forecast den co ket qua | < 2-3 giay |
| App stability | Dung lien tuc | 15-30 phut khong crash |
| APK release size | Kiem tra file APK | Khoang 34 MB hien tai |

## 10. Bang ghi latency dieu khien

| Lan do | Thiet bi | Lenh | Nguon lenh | Start time | End time | Latency ms | Thanh cong | Ghi chu |
|---:|---|---|---|---|---|---:|---|---|
| 1 | | ON | mobile | | | | | |
| 2 | | OFF | mobile | | | | | |
| 3 | | ON | physical_button | | | | | |
| 4 | | OFF | admin | | | | | |

## 11. Anh/chung cu can chup

Can gom vao thu muc rieng khi viet luan van:

```text
evidence/
  mobile-login.png
  mobile-dashboard.png
  mobile-rooms.png
  mobile-analysis.png
  mobile-settings.png
  admin-overview.png
  admin-users.png
  admin-home-detail.png
  project-site-home.png
  project-site-progress.png
  backend-api-health.png
  plc-wiring.jpg
  mfm384-reading.jpg
  forecast-vs-actual.png
  model-metrics-table.png
```

## 12. Bang test tong hop cho luan van

| Nhom | Tong test | Pass | Fail | Ti le pass | Ghi chu |
|---|---:|---:|---:|---:|---|
| Mobile app | | | | | |
| Backend API | | | | | |
| PLC/MFM384 | | | | | |
| Admin site | | | | | |
| Project site | | | | | |
| AI Forecast | | | | | |

## 13. Cac nang cap nen lam neu con thoi gian

Uu tien cao:

1. Export CSV cho power readings va forecast comparison.
2. Man `System Health`: backend, PLC, Forecast API, last data timestamp.
3. Bieu do `forecast vs actual` trong app/admin.
4. Audit log ro hon: actor, role, action, result, latency.
5. Bao cao PDF/CSV dua vao phu luc luan van.

Uu tien sau:

1. Push notification khi vuot quota.
2. Auto load shedding theo muc uu tien tai.
3. Auto retrain model khi co du lieu moi.
4. AI voice/chatbot cloud qua backend.
5. Chuyen SQLite sang PostgreSQL neu trien khai nhieu ho gia dinh.

## 14. Cau truc ket qua nen dua vao luan van

### 14.1 Chuong thuc nghiem

- Mo ta mo hinh test.
- So do ket noi: MFM384 -> PLC -> Backend -> App.
- Cau hinh thiet bi va moi truong test.
- Bang test case.
- Bang ket qua pass/fail.
- Bang latency.

### 14.2 Chuong AI Forecast

- Mo ta dataset.
- Tien xu ly du lieu.
- Chia train/test.
- Bang so sanh model.
- Bieu do forecast vs actual.
- Nhan xet model phu hop nhat.

### 14.3 Chuong danh gia he thong

- Diem manh.
- Gioi han hien tai.
- Huong phat trien.

## 15. Checklist truoc khi bao ve

- [ ] APK release cai duoc tren dien thoai.
- [ ] Co anh app mobile moi nhat.
- [ ] Co anh admin site moi nhat.
- [ ] Co anh project site moi nhat.
- [ ] Co dataset CSV dien nang.
- [ ] Co bang test case pass/fail.
- [ ] Co bang latency dieu khien.
- [ ] Co bang so sanh model AI.
- [ ] Co bieu do forecast vs actual.
- [ ] Co mo ta kien truc he thong.
- [ ] Co phan han che va huong phat trien.
- [ ] GitHub da push commit moi nhat.
- [ ] Website deploy public da cap nhat.


