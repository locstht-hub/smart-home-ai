# Smart Home Server API

Server rieng lam trung tam dieu khien va giam sat trong do an.

## Workflow

```text
MFM384 -> RS485/Modbus RTU -> PLC S7-1200 CPU 1215C
PLC -> Ethernet -> Laptop/VPS chay Smart Home Server
App -> REST API/domain server rieng
```

## Chay local

```powershell
cd c:\Users\ADMIN\.gemini\antigravity\scratch\smart-home-app\backend\smart_home_server
python -m venv .venv
.venv\Scripts\Activate.ps1
pip install -r requirements.txt
python app.py
```

Mac dinh backend dung SQLite local. Neu muon dung Supabase/Postgres, dat bien moi truong `DATABASE_URL` truoc khi chay:

```powershell
$env:DATABASE_URL="postgresql://postgres.<project-ref>:<password>@aws-...pooler.supabase.com:6543/postgres?sslmode=require"
python app.py
```

Co the copy file `.env.example` thanh `.env` de luu cau hinh local, nhung khong commit `.env`.

Mac dinh server chay:

```text
http://127.0.0.1:5001
```

App Android emulator dung:

```text
http://10.0.2.2:5001
```

Dien thoai that dung IP LAN cua laptop:

```text
http://<IP-LAPTOP>:5001
```

Khi deploy domain:

```text
https://api-tenmiencuaban.com
```

## Endpoint hien co

```text
GET  /health
POST /api/auth/login
GET  /api/auth/check
GET  /api/me
GET  /api/system/status
GET  /api/power/current
GET  /api/power/history
POST /api/power/readings
GET  /api/power/collector/status
POST /api/power/collector/run-once
GET  /api/devices
POST /api/devices/<device_id>/turn-on
POST /api/devices/<device_id>/turn-off
POST /api/scenes/<scene>
POST /api/assistant/chat

GET    /api/homes/<home_id>/quota
POST   /api/homes/<home_id>/quota
GET    /api/homes/<home_id>/members
POST   /api/homes/<home_id>/members
PATCH  /api/homes/<home_id>/members/<user_id>/suspend
PATCH  /api/homes/<home_id>/members/<user_id>/activate
DELETE /api/homes/<home_id>/members/<user_id>

GET   /api/admin/homes
GET   /api/admin/users
GET   /api/admin/audit-logs
POST  /api/admin/owners
PATCH /api/admin/users/<user_id>/suspend
PATCH /api/admin/users/<user_id>/activate
PATCH /api/admin/users/<user_id>/reset-password
PATCH /api/admin/homes/<home_id>/suspend
PATCH /api/admin/homes/<home_id>/activate
```

## Tai khoan va phan quyen

Backend da co nen mong SQLite/Postgres cho 2 tang quan tri:

```text
system_admin -> dung cho web admin quan ly cac nha/tai khoan cha
owner        -> tai khoan cha trong tung nha, quan ly thanh vien bang app
member       -> tai khoan con, dieu khien theo quyen duoc cap
viewer       -> chi xem trang thai
```

File database mac dinh neu khong co `DATABASE_URL`:

```text
backend/smart_home_server/smart_home_auth.db
```

Neu co `DATABASE_URL`, backend se dung Supabase/Postgres qua `PostgresAuthStore`. Xem them:

```text
backend/smart_home_server/SUPABASE_MIGRATION_PLAN.md
backend/smart_home_server/migrations/001_supabase_schema.sql
backend/smart_home_server/migrations/002_manual_rooms_devices.sql
```

Lan dau chay server se tu tao tai khoan mau:

```text
system admin: admin / admin123
owner mau:    owner / owner123
member mau:   member / member123
```

Endpoint auth:

```text
POST /api/auth/login
GET  /api/me
GET  /api/admin/homes
GET  /api/admin/users
GET  /api/admin/audit-logs
```

Vi du login:

```json
{
  "username": "owner",
  "password": "owner123"
}
```

Sau khi login, app/web dung token tra ve trong header:

```text
Authorization: Bearer <session-token>
```

## Audit log

Backend ghi log cac hanh dong quan trong vao bang `audit_logs`:

```text
auth.login_success
auth.login_failed
admin.view_homes
admin.view_users
admin.view_audit_logs
device.turn_on
device.turn_off
scene.apply
assistant.chat
```

Web admin co the doc lich su bang:

```text
GET /api/admin/audit-logs?limit=100
```

Chi `system_admin` moi doc duoc audit log toan he thong.

## Power readings theo nha

Backend luu lich su dien nang theo `homeId` trong bang `power_readings`. Bang nay nam trong SQLite local hoac Supabase/Postgres tuy theo `DATABASE_URL`.

```text
GET  /api/power/history?limit=288
POST /api/power/readings
```

`GET /api/power/current` cung tu ghi mot snapshot vao lich su neu request co nha hop le.

Server co the tu ghi lich su dinh ky bang `powerCollector` trong `config.json`:

```json
{
  "powerCollector": {
    "enabled": true,
    "intervalSeconds": 60,
    "initialEnergyKwh": 12.3,
    "homeIds": ["home-demo-001"]
  }
}
```

- `intervalSeconds`: chu ky lay mau. Demo nen de 30-60 giay, thuc te co the 60-300 giay.
- `homeIds`: danh sach nha can ghi. De mang rong thi collector ghi cho tat ca nha active.
- `GET /api/power/collector/status`: xem collector dang chay, lan ghi cuoi, loi gan nhat.
- `POST /api/power/collector/run-once`: system admin kich hoat ghi thu mot lan de test.
- Dat bien moi truong `SMART_HOME_DISABLE_COLLECTOR=1` neu muon tam tat collector khi test backend.

Payload mau de PLC/laptop ghi du lieu:

```json
{
  "homeId": "home-demo-001",
  "timestamp": "2026-05-24T12:00:00+07:00",
  "voltage": 220.5,
  "current": 1.25,
  "power_kw": 0.276,
  "energy_kwh": 12.7,
  "source": "plc-s7-1200"
}
```

Du lieu nay la nen tang de ve lich su 24h/ngay/thang va retrain model forecast rieng cho tung nha.

## Quan ly phong/thiet bi muc 1

Supabase co them schema muc 1 cho quan ly thu cong:

```text
rooms
devices
device_events
```

Y nghia:

- `rooms`: phong thuoc tung nha qua `home_id`.
- `devices`: thiet bi thuoc tung nha/phong qua `home_id` va `room_id`.
- `rated_power_w`: cong suat dinh muc do nguoi dung nhap thu cong, khong phai so do rieng tung thiet bi neu chua co cam bien/kenh PLC rieng.
- `device_events`: lich su tao/sua/bat/tat/dong bo trang thai thiet bi.

Trong prototype hien tai, du lieu dien do thuc te van la tong nha trong `power_readings`. Bang `devices` giup app/admin site bieu dien cau truc nha thong minh ro hon va co nen tang de mo rong sang do rieng tung thiet bi sau nay.

## Bao mat API bang token

`/health` de public de kiem tra server con song. Tat ca endpoint `/api/...` se yeu cau token neu cau hinh `security.apiToken` trong `config.json` hoac bien moi truong `SMART_HOME_API_TOKEN`.

Vi du `config.json`:

```json
{
  "security": {
    "apiToken": "doi-thanh-token-dai-ngau-nhien"
  }
}
```

App gui token bang header:

```text
Authorization: Bearer <token>
X-API-Token: <token>
```

Trong app vao `Cai dat -> Server API rieng -> API token` va nhap dung token tren server. Bam `Luu & kiem tra`; neu token sai server se tra `401 Unauthorized`.

## Tag cong suat dang cau hinh

```text
V1N       -> MD200 -> voltage    -> REAL
I1N       -> MD212 -> current    -> REAL
Total kW  -> MD224 -> power_kw   -> REAL
Total kWh -> MD228 -> energy_kwh -> REAL
```

Neu PLC dang luu cac gia tri nay dang `REAL` thi `config.json` phai de `"type": "Real"`. Khong doc cac tag REAL bang `"DWord"`, vi byte cua so thuc se bi hieu thanh so nguyen rat lon.

Neu PLC IP that khac `192.168.0.1`, sua trong `config.json`:

```json
{
  "plc": {
    "host": "192.168.0.1",
    "rack": 0,
    "slot": 1
  }
}
```

## Chuyen sang PLC that

1. Trong TIA Portal bat PUT/GET:

```text
CPU Properties -> Protection & Security
-> Permit access with PUT/GET communication from remote partner
```

2. Doi mode trong `config.json`:

```json
{
  "mode": "auto"
}
```

3. Chay lai server.

## Ghi chu

- `mock` mode dung de app test khong can PLC.
- `plc-real` mode doc power tag va device status tag bang `python-snap7`.
- `auto` mode uu tien PLC that khi ket noi duoc; neu PLC chua cam hoac Snap7 loi thi endpoint doc se fallback mock kem `plcError`, khong ghi mock fallback vao lich su dien that.
- Lenh dieu khien trong `auto` van phai ghi duoc xuong PLC moi bao thanh cong; backend khong gia vo bat/tat thiet bi neu PLC dang mat ket noi.
- Lenh dieu khien uu tien `onCommandTag`/`offCommandTag`: backend gui xung Start/Stop, PLC SET/RESET output roi cap nhat lai `statusTag`.
- Mapping demo hien tai: Lamp1 status `DB1.DBX1.2`, Lamp2 `DB1.DBX1.3`, Lamp3 `DB1.DBX1.4`; command Start/Stop nam tren `DB7.DBX0.0 -> DB7.DBX0.5`.
- Endpoint `/api/assistant/chat` hien la rule fallback. Sau nay co the thay bang Unsloth/LLM de tra JSON intent.

## Assistant provider tam thoi

Endpoint `/api/assistant/chat` giu rule dieu khien thiet bi cho cac lenh bat/tat/canh, sau do moi dung provider AI cho cac cau hoi tu van/nang luong.

Provider ho tro:

```text
mock       -> tra loi fallback noi bo, khong can API key
gemini     -> goi Gemini API
openai     -> goi OpenAI Responses API
local_lora -> goi AI server rieng chay LoRA/Unsloth sau nay
```

Config mau:

```json
{
  "assistant": {
    "provider": "gemini",
    "model": "gemini-2.0-flash",
    "timeoutSeconds": 20,
    "maxOutputTokens": 512,
    "temperature": 0.2,
    "sendHomeContext": true,
    "localLoraUrl": "http://127.0.0.1:8008/chat"
  }
}
```

API key nen dat bang bien moi truong, khong dua vao app mobile:

```powershell
$env:GEMINI_API_KEY="..."
$env:OPENAI_API_KEY="..."
$env:SMART_HOME_ASSISTANT_PROVIDER="gemini"
```

Backend chi gui ngu canh can thiet cho AI: che do server, role tai khoan, power `V/I/kW/kWh`, quota, danh sach thiet bi va trang thai. Khong gui password, token hay thong tin nhay cam.
