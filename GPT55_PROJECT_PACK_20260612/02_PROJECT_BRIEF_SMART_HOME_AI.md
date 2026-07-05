# Project Brief - Smart Home AI

## 1. Ten va muc tieu du an

Smart Home AI la do an xay dung he thong giam sat dien nang va dieu khien nha thong minh. He thong ket hop phan cung do dien, PLC, backend API, ung dung mobile, admin site, project site va AI Forecast.

Muc tieu chinh:

- Do va hien thi du lieu dien nang theo thoi gian: voltage, current, power, energy.
- Dieu khien thiet bi trong nha thong minh qua mobile app va backend API.
- Quan ly tai khoan, nha, thanh vien va phan quyen.
- Ghi audit log cho cac thao tac quan trong.
- Du bao phu tai/cong suat bang model ML/AI Forecast.
- Cung cap project site de gioi thieu kien truc va tien do du an.

## 2. Kien truc tong quan

Luong du lieu/lenh muc tieu:

```text
MFM384 -> RS485/Modbus RTU -> PLC Siemens S7-1200 CPU 1215C
PLC -> Ethernet -> Smart Home Server API
Smart Home Server API -> Mobile App / Admin Site
Power History -> Forecast API -> Analysis Screen / Report
```

Thanh phan chinh:

- Mobile app: React Native / Expo.
- Backend chinh: Flask, thu muc `backend/smart_home_server`.
- Forecast API: Flask/Node fallback, thu muc `backend/forecast_api`.
- PLC gateway/toi gian: `backend/plc_gateway`.
- Database demo/local: SQLite.
- Admin site: static web trong `admin-site`.
- Project site: static web trong `project-site`, deploy qua Cloudflare Pages.
- ML training: `ml-training`.

## 3. Trang thai hien tai

Trang thai tham chieu gan nhat:

- Git commit: `1493400d`.
- Branch: `main`.
- Website/project site da duoc redesign va cache bust.
- Mobile UI da duoc redesign o cac man hinh chinh.
- Admin site da duoc redesign.
- Android release APK gan nhat: `app-release-arm64-v8a.apk`.
- APK release size gan nhat: khoang `34.2 MB`.
- APK da verify signature v2.
- TypeScript check `npx tsc --noEmit` da pass truoc build.

Nhung moc gan day:

- Redesign UI mobile.
- Redesign Login/Register.
- Redesign AdminScreen va MemberManagementScreen.
- Redesign admin site.
- Fix Expo Android config.
- Improve chat text-to-speech.
- Clean production/demo auth tren login/admin site.
- Add release build script.
- Align project site voi mobile/admin UI.
- Add thesis test plan.
- Fix project site visual theme.

## 4. Mobile app

Cong nghe:

- Expo SDK 55.
- React Native 0.83.
- React 19.
- TypeScript.
- React Navigation.
- Expo Speech.
- react-native-voicekit.
- react-native-chart-kit.

Man hinh chinh:

- LoginScreen.
- RegisterScreen.
- DashboardScreen.
- RoomsScreen.
- AnalysisScreen.
- ChatScreen.
- SettingsScreen.
- AdminScreen.
- MemberManagementScreen.

Chuc nang:

- Dang nhap, dang ky.
- Dashboard dien nang/quota/tong quan.
- Quan ly phong va thiet bi.
- Bat/tat thiet bi va scene.
- Chat assistant va voice.
- Analysis/forecast va export report.
- Settings cau hinh backend/forecast.
- Quan ly thanh vien theo role.

## 5. Backend Smart Home Server

Backend chinh nam o:

```text
backend/smart_home_server
```

Vai tro:

- Auth va session token.
- Quan ly user, home, role.
- Doc/giai lap/truyen du lieu power.
- Dieu khien device/scene.
- Ghi lich su power readings.
- Ghi audit log.
- Lam trung gian giua app/admin va PLC/forecast.

Role:

- `system_admin`: quan tri toan he thong qua admin site.
- `owner`: chu nha, quan ly thanh vien trong nha.
- `member`: thanh vien duoc cap quyen.
- `viewer`: chi xem.

Nhom endpoint chinh:

- Auth/system: `/health`, `/api/auth/login`, `/api/auth/check`, `/api/me`, `/api/system/status`.
- Power: `/api/power/current`, `/api/power/history`, `/api/power/readings`, collector status/run-once.
- Devices/scenes: `/api/devices`, `/api/devices/<id>/turn-on`, `/turn-off`, `/api/scenes/<scene>`.
- Assistant: `/api/assistant/chat`.
- Home/quota/member: `/api/homes/<home_id>/quota`, `/members`.
- Admin: `/api/admin/homes`, `/api/admin/users`, `/api/admin/audit-logs`, create owner/home, suspend/activate/reset.

Luu y:

- Assistant chat hien tai la rule/intent fallback, chua phai LoRA/LLM production.
- Power collector co the ghi lich su theo chu ky.
- Mode co the la mock, plc-real hoac auto.
- Neu PLC mat ket noi, backend khong nen gia vo dieu khien thanh cong.

## 6. Forecast API va AI

Forecast API nam o:

```text
backend/forecast_api
```

Endpoints:

- `GET /health`
- `GET /forecast/model-info`
- `GET /forecast/sample`
- `POST /forecast/predictions`
- `POST /forecast/insights`
- `POST /forecast/anomalies`
- `GET /forecast/model-compare`
- `POST /forecast/trigger-retrain`

Trang thai:

- Co artifact/metrics cho model ML.
- Dataset tham chieu hien tai la UCI Individual Household Electric Power Consumption.
- Best model trong metrics hien tai: XGBoost.
- Endpoint retrain hien la POC/gia lap, khong nen ghi la auto retrain production.

Metrics XGBoost test hien co trong `model_metrics/metrics.json`:

- MAE: about `0.4010`.
- RMSE: about `0.5589`.
- MAPE: about `55.81`.

Can luu y khi viet bai:

- Metrics tren den tu dataset UCI, khong mac dinh la du lieu nha that cua prototype.
- Neu muon bai bao thuyet phuc hon, can thu du lieu thuc te tu MFM384/PLC va tinh lai metrics/fine-tune theo du lieu do.

## 7. Admin site

Thu muc:

```text
admin-site
```

Vai tro:

- Web admin tinh cho system admin.
- Dang nhap qua backend.
- Xem dashboard so nha/user/owner/audit log.
- Quan ly homes/users.
- Tao owner/home.
- Suspend/activate user/home.
- Reset password.
- Xem audit log.

Deploy goi y:

```text
admin.smarthomeai.id.vn
```

## 8. Project site

Thu muc:

```text
project-site
```

Vai tro:

- Website gioi thieu do an.
- Trinh bay kien truc, mobile app, backend, AI forecast, tien do.
- Co chatbot/FAQ tinh dua tren knowledge base.
- Deploy tren Cloudflare Pages.

Domain:

```text
https://smarthomeai.id.vn
```

Backend domain:

```text
https://api.smarthomeai.id.vn
```

## 9. Test plan luan van

File chinh:

```text
docs/TEST_PLAN_LUAN_VAN.md
```

Nhom test:

- Mobile app: install APK, login, dashboard, rooms, chat, analysis, settings.
- Admin site: login, dashboard, homes/users/audit log, create/suspend/reset.
- Project site: desktop/mobile layout, progress page, FAQ, link, deploy.
- Hardware: no load, light load, medium load, high load, physical button, disconnect PLC/backend/forecast.
- Data collection: voltage, current, power, energy, state, command, latency.
- AI Forecast: train/validation/test split, MAE, RMSE, MAPE, R2, inference time.
- Performance: login latency, dashboard load, command latency, API latency, forecast latency, stability, APK size.

Du lieu nen thu:

- Toi thieu: 2-4 gio voi nhieu muc tai neu chua co dieu kien chay dai.
- Tot hon: 1-3 ngay, chu ky 5-60 giay.
- Can tach ro data thuc nghiem, mock/demo va dataset cong khai.

## 10. De xuat huong bai bao khoa hoc

Kieu bai phu hop:

```text
Applied system paper / prototype evaluation paper
```

Thong diep nghien cuu nen la:

Du an de xuat va trien khai mot he thong giam sat dien nang nha thong minh tich hop PLC, backend API, ung dung mobile, admin site va AI Forecast; sau do danh gia qua tinh dung chuc nang, do tre dieu khien, kha nang thu thap du lieu dien nang va sai so du bao.

Dong gop co the viet:

1. Thiet ke kien truc end-to-end ket noi MFM384, PLC, backend, app mobile va Forecast API.
2. Trien khai prototype co auth, role, quota, device control, audit log va dashboard.
3. Xay dung quy trinh thu thap du lieu va danh gia latency/chuc nang.
4. Tich hop module AI Forecast va danh gia bang cac metric MAE, RMSE, MAPE.
5. Cung cap admin/project site ho tro quan tri va trinh bay he thong.

Claim nen can than:

- Co the noi "prototype" hoac "experimental system".
- Khong nen noi "production ready" neu chua co test dai ngay/bao mat day du.
- Khong nen noi "AI du bao chinh xac cao" neu MAPE con cao hoac chua co du lieu nha that.
- Khong nen noi "auto retrain hoan chinh" vi retrain endpoint hien la POC.

## 11. Nhung viec can bo sung de bai bao thuyet phuc hon

Nen co truoc khi viet ket qua:

- Dataset CSV tu MFM384/PLC, co timestamp va chu ky lay mau ro.
- Bang latency bat/tat thiet bi it nhat 20-30 lan.
- Bang pass/fail test case mobile/backend/admin/project site.
- Anh bang chung app, admin site, project site, PLC/MFM384.
- Bieu do power_kw theo thoi gian.
- Bieu do forecast vs actual.
- Bang so sanh model neu co Random Forest, XGBoost, LSTM.
- Mo ta dieu kien test: dien thoai, Android version, backend URL, firmware/config PLC, thoi gian test.


