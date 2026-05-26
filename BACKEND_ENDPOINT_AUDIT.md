# BACKEND ENDPOINT AUDIT

**Ngay kiem tra:** 26/05/2026  
**Pham vi:** Backend API, Forecast API, PLC Gateway, mobile app client, admin site client.

## 1. Ket luan nhanh

Backend hien tai **da co du endpoint chinh ma mobile app va admin site dang goi**.

Khong thay endpoint nao trong app/admin dang goi ma backend chinh bi thieu route.

Can luu y:

- `backend/smart_home_server` la backend chinh cho app/admin.
- `backend/forecast_api` la API rieng cho AI forecast.
- `backend/plc_gateway` chi la gateway toi gian doc power current, khong thay the backend chinh.
- README backend cu chua liet ke het endpoint moi, nen da cap nhat lai.
- Endpoint `/forecast/trigger-retrain` hien la POC/gia lap, chua phai auto retrain production.

## 2. Smart Home Server API

Base URL local mac dinh:

```text
http://127.0.0.1:5001
```

Domain cloud:

```text
https://api.smarthomeai.id.vn
```

### Public

| Method | Endpoint | Trang thai | Ghi chu |
| --- | --- | --- | --- |
| GET | `/health` | Co | Health check public. |
| POST | `/api/auth/login` | Co | Dang nhap, tra token/session. |

### Auth/system

| Method | Endpoint | Trang thai | App/Admin dung |
| --- | --- | --- | --- |
| GET | `/api/auth/check` | Co | Mobile app |
| GET | `/api/me` | Co | San sang, app chua goi truc tiep trong client hien tai |
| GET | `/api/system/status` | Co | Mobile app |

### Power

| Method | Endpoint | Trang thai | App/Admin dung |
| --- | --- | --- | --- |
| GET | `/api/power/current` | Co | Mobile app |
| GET | `/api/power/history` | Co | Mobile app |
| POST | `/api/power/readings` | Co | Mobile app/backend collector/PLC gateway sau nay |
| GET | `/api/power/collector/status` | Co | San sang |
| POST | `/api/power/collector/run-once` | Co | San sang, system admin |

### Devices/scenes

| Method | Endpoint | Trang thai | App/Admin dung |
| --- | --- | --- | --- |
| GET | `/api/devices` | Co | Mobile app |
| POST | `/api/devices/<device_id>/turn-on` | Co | Mobile app |
| POST | `/api/devices/<device_id>/turn-off` | Co | Mobile app |
| POST | `/api/scenes/<scene>` | Co | Mobile app |

### Assistant

| Method | Endpoint | Trang thai | App/Admin dung |
| --- | --- | --- | --- |
| POST | `/api/assistant/chat` | Co | Mobile app |

Hien tai endpoint nay dung rule/intent fallback, chua tich hop LoRA User Energy Assistant.

### Home quota/member

| Method | Endpoint | Trang thai | App/Admin dung |
| --- | --- | --- | --- |
| GET | `/api/homes/<home_id>/quota` | Co | Mobile app |
| POST | `/api/homes/<home_id>/quota` | Co | Mobile app |
| GET | `/api/homes/<home_id>/members` | Co | Mobile app |
| POST | `/api/homes/<home_id>/members` | Co | Mobile app |
| PATCH | `/api/homes/<home_id>/members/<user_id>/suspend` | Co | Mobile app |
| PATCH | `/api/homes/<home_id>/members/<user_id>/activate` | Co | Mobile app |
| DELETE | `/api/homes/<home_id>/members/<user_id>` | Co | Mobile app |

### Admin

| Method | Endpoint | Trang thai | Admin site dung |
| --- | --- | --- | --- |
| GET | `/api/admin/homes` | Co | Admin site |
| GET | `/api/admin/users` | Co | Admin site |
| GET | `/api/admin/audit-logs` | Co | Admin site |
| POST | `/api/admin/owners` | Co | Admin site |
| PATCH | `/api/admin/users/<user_id>/suspend` | Co | Admin site |
| PATCH | `/api/admin/users/<user_id>/activate` | Co | Admin site |
| PATCH | `/api/admin/users/<user_id>/reset-password` | Co | Admin site |
| PATCH | `/api/admin/homes/<home_id>/suspend` | Co | Admin site |
| PATCH | `/api/admin/homes/<home_id>/activate` | Co | Admin site |

## 3. Forecast API

Base URL local dang cau hinh trong app:

```text
http://172.16.50.47:5000
```

### Endpoints

| Method | Endpoint | Trang thai | App dung |
| --- | --- | --- | --- |
| GET | `/health` | Co | Health check |
| GET | `/forecast/model-info?model=xgboost` | Co | Forecast provider |
| GET | `/forecast/model-info?model=lstm` | Co neu artifact LSTM load duoc | Forecast provider |
| GET | `/forecast/sample` | Co | San sang |
| POST | `/forecast/predictions?model=xgboost` | Co | Forecast provider |
| POST | `/forecast/predictions?model=lstm` | Co neu artifact LSTM load duoc | Forecast provider |
| POST | `/forecast/insights?model=xgboost` | Co | Forecast provider |
| POST | `/forecast/anomalies?model=xgboost` | Co | Forecast provider |
| GET | `/forecast/model-compare` | Co | San sang, app chua goi truc tiep |
| POST | `/forecast/trigger-retrain?model=xgboost` | Co, POC | Forecast provider co ham triggerRetrain |

Luu y: `/forecast/trigger-retrain` hien chi la endpoint gia lap/chay nen POC, chua phai pipeline auto retrain production.

## 4. PLC Gateway

| Method | Endpoint | Trang thai | Ghi chu |
| --- | --- | --- | --- |
| GET | `/health` | Co | Gateway health |
| GET | `/api/power/current` | Co | Doc power toi gian |

PLC Gateway khong co day du auth, devices, scenes, members, quota. Neu app can day du chuc nang thi phai dung `smart_home_server`.

## 5. Doi chieu voi mobile app

File mobile client:

```text
src/services/smartHome/client.ts
src/services/forecast/flaskForecastProvider.ts
```

Ket qua doi chieu:

| Nhom | App goi | Backend co | Ghi chu |
| --- | --- | --- | --- |
| Health/auth | Co | Co | OK |
| System status | Co | Co | OK |
| Power current/history/readings | Co | Co | OK |
| Devices/scenes | Co | Co | OK |
| Members/quota | Co | Co | OK |
| Assistant chat | Co | Co | OK, hien la rule fallback |
| Forecast predictions/insights/anomalies/model-info/retrain | Co | Co | OK |

## 6. Doi chieu voi admin site

File admin client:

```text
admin-site/app.js
```

Ket qua doi chieu:

| Admin action | Endpoint | Backend co |
| --- | --- | --- |
| Login | `POST /api/auth/login` | Co |
| List homes | `GET /api/admin/homes` | Co |
| List users | `GET /api/admin/users` | Co |
| List audit logs | `GET /api/admin/audit-logs` | Co |
| Create owner/home | `POST /api/admin/owners` | Co |
| Suspend/activate user | `PATCH /api/admin/users/<user_id>/<action>` | Co |
| Reset password | `PATCH /api/admin/users/<user_id>/reset-password` | Co |
| Suspend/activate home | `PATCH /api/admin/homes/<home_id>/<action>` | Co |

## 7. Smoke test da chay

Da chay Flask test client cho cac endpoint chinh.

Smart Home Server:

```text
GET  /health                                      -> 200
GET  /api/auth/check                             -> 200
GET  /api/system/status                          -> 200
GET  /api/admin/homes                            -> 200
GET  /api/admin/users                            -> 200
GET  /api/admin/audit-logs?limit=5               -> 200
GET  /api/power/current?homeId=home-demo-001     -> 200
GET  /api/power/history?homeId=home-demo-001     -> 200
GET  /api/devices?homeId=home-demo-001           -> 200
GET  /api/homes/home-demo-001/quota              -> 200
GET  /api/homes/home-demo-001/members            -> 200
POST /api/power/readings                         -> 201
POST /api/devices/living_main_light/turn-on      -> 200
POST /api/devices/living_main_light/turn-off     -> 200
POST /api/scenes/sleep                           -> 200
POST /api/assistant/chat                         -> 200
POST /api/power/collector/run-once               -> 200
```

Forecast API:

```text
GET  /health                         -> 200
GET  /forecast/model-info            -> 200
GET  /forecast/sample                -> 200
POST /forecast/predictions           -> 200
POST /forecast/insights              -> 200
POST /forecast/anomalies             -> 200
GET  /forecast/model-compare         -> 200
POST /forecast/trigger-retrain       -> 202
```

## 8. Diem can luu y/chinh sau

1. **Backend endpoint da du cho app hien tai.**
2. **README cu thieu mot so endpoint moi**, nen can doc file audit nay hoac README moi.
3. **Assistant chat chua dung LoRA User Energy Assistant**, hien van la rule fallback.
4. **Forecast retrain endpoint la POC**, khong nen ghi la auto retrain production.
5. **PLC Gateway chi co power current**, khong nen coi la backend day du.
6. **Config dang co API token**, khi test app can gui dung token/session.
7. **Khi test bang PowerShell voi tieng Viet co dau**, co the bi loi encoding trong console; nen test Unicode qua Postman, curl UTF-8, app, hoac Python file UTF-8.

