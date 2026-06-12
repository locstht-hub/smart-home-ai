# Supabase Migration Plan

Tai lieu nay mo ta cach nang cap tang luu tru cua Smart Home AI tu SQLite local sang Supabase Postgres, trong khi van giu Flask backend lam trung tam.

## 1. Muc tieu

Muc tieu cua buoc nay:

- Luu tap trung user, home, member, quota, audit log va power readings tren cloud database.
- Giu nguyen API hien tai de mobile app va admin site khong phai doi lon.
- Van co the fallback ve SQLite local khi chua cau hinh Supabase.
- Chuan bi nen tang tot hon cho luan van/bai bao: luu tru tap trung, truy cap nhieu may, backup va du lieu thuc nghiem ro rang.

Kien truc mong muon:

```text
Mobile App / Admin Site
        |
        v
Flask Smart Home Server
        |
        v
Supabase Postgres
```

Khong lam o buoc dau:

- Chua dung Supabase Auth.
- Chua cho app mobile ghi truc tiep vao Supabase.
- Chua thay Flask backend bang Edge Functions.
- Chua them Firebase/FCM trong buoc migration database nay.

## 2. File da them

Migration SQL:

```text
backend/smart_home_server/migrations/001_supabase_schema.sql
```

Postgres store:

```text
backend/smart_home_server/postgres_auth_store.py
```

Backend selector:

```text
backend/smart_home_server/app.py
```

`app.py` da doc bien moi truong `DATABASE_URL`. Neu bien nay co gia tri thi backend dung `PostgresAuthStore`; neu khong co thi van dung SQLite `AuthStore`.

File nay tao cac bang:

- `users`
- `homes`
- `home_members`
- `sessions`
- `audit_logs`
- `power_readings`

Va cac index quan trong:

- `home_id + timestamp` cho lich su dien nang.
- `created_at` cho audit log.
- `actor_user_id`, `home_id`, `action` cho truy van log.
- `lower(username)` de tranh trung username khac hoa/thuong.

## 3. Tao project Supabase

1. Vao Supabase va tao project moi.
2. Mo `SQL Editor`.
3. Copy noi dung file:

```text
backend/smart_home_server/migrations/001_supabase_schema.sql
```

4. Chay SQL.
5. Vao `Project Settings -> Database`.
6. Lay connection string Postgres.

Khong commit connection string len GitHub.

## 4. Cau hinh backend

Backend hien doc `DATABASE_URL` tu bien moi truong:

```powershell
$env:DATABASE_URL="postgresql://postgres.<project-ref>:<password>@aws-...supabase.com:6543/postgres?sslmode=require"
```

Neu connection string/password da tung bi paste vao chat, log hoac anh chup man hinh, nen vao Supabase `Database Settings -> Reset database password` sau khi test xong va cap nhat lai `DATABASE_URL`.

De local van chay SQLite, backend dang co logic:

```text
Neu DATABASE_URL co gia tri -> dung PostgresAuthStore
Neu DATABASE_URL rong       -> dung AuthStore SQLite hien tai
```

Vi vay app mobile/admin site khong can doi URL API.

## 5. Thu tu code da lam va nen lam tiep

### Buoc 1: them dependency Postgres - da lam

Them Python package vao:

```text
backend/smart_home_server/requirements.txt
```

Goi y:

```text
psycopg[binary]
```

Hoac dung SQLAlchemy neu muon abstract database tot hon. Voi code hien tai, `psycopg` la du gon.

Sau khi cap nhat `requirements.txt`, cai dependency:

```powershell
cd backend\smart_home_server
pip install -r requirements.txt
```

### Buoc 2: tao store moi - da lam

Da tao file moi thay vi sua manh file cu:

```text
backend/smart_home_server/postgres_auth_store.py
```

Class goi y:

```text
PostgresAuthStore
```

No nen expose cung method voi `AuthStore` hien tai:

- `login`
- `get_user_by_session`
- `get_me`
- `get_home_access`
- `list_home_members`
- `list_admin_homes`
- `list_collector_homes`
- `list_admin_users`
- `create_owner_with_home`
- `set_user_status`
- `reset_user_password`
- `change_user_password`
- `set_home_status`
- `create_home_member`
- `set_home_member_status`
- `remove_home_member`
- `record_audit_log`
- `list_audit_logs`
- `list_home_audit_logs`
- `record_power_reading`
- `list_power_readings`
- `get_home_quota_status`
- `update_home_quota`

### Buoc 3: chon store trong `app.py` - da lam

`app.py` hien chon store theo:

```python
database_url = os.environ.get("DATABASE_URL", "").strip()
if database_url:
    auth_store = PostgresAuthStore(database_url)
else:
    auth_store = AuthStore(configured_db_path)
```

### Buoc 4: seed demo rieng

Khong chen mat khau demo truc tiep trong migration SQL.

`PostgresAuthStore` hien co seed demo neu bang `users` dang rong, de backend Supabase co the login/test nhanh. Sau khi dua vao production, nen doi hoac xoa tai khoan demo.

### Buoc 5: test Supabase connection - can lam

Tren PowerShell local, dat `DATABASE_URL` roi chay backend:

```powershell
$env:DATABASE_URL="postgresql://postgres.<project-ref>:<password>@aws-...pooler.supabase.com:6543/postgres?sslmode=require"
cd backend\smart_home_server
python app.py
```

Sau do test:

```powershell
curl http://127.0.0.1:5001/health
```

## 6. Kiem thu sau khi tich hop

Test theo thu tu:

| ID | Viec can test | Ket qua mong doi |
|---|---|---|
| DB-01 | Chay migration SQL tren Supabase | Tao du bang/index |
| DB-02 | Backend co `DATABASE_URL` | Ket noi Postgres thanh cong |
| DB-03 | Backend khong co `DATABASE_URL` | Van fallback SQLite |
| AUTH-01 | Login owner/admin | Thanh cong, tra token |
| AUTH-02 | Auth check | Token con han duoc chap nhan |
| HOME-01 | List home/member | Dung role/quyen |
| ADMIN-01 | Admin list homes/users/logs | Du lieu dung |
| POWER-01 | POST `/api/power/readings` | Ghi vao `power_readings` |
| POWER-02 | GET `/api/power/history` | Doc lai dung theo `homeId` |
| QUOTA-01 | Update quota | Luu vao `homes.energy_limit_kwh` |
| AUDIT-01 | Bat/tat device/login/admin action | Co audit log |

## 7. Du lieu nao nen migrate tu SQLite

Neu SQLite hien tai dang co du lieu can giu, migrate cac bang:

```text
users
homes
home_members
sessions
audit_logs
power_readings
```

Luu y:

- `metadata_json` tren SQLite la text JSON, tren Postgres la `jsonb`.
- `can_manage_members` va `can_manage_devices` tren SQLite la `0/1`, tren Postgres la boolean.
- `timestamp`, `created_at`, `last_active`, `expires_at` tren Postgres la `timestamptz`.
- Khong migrate session cu neu khong can; cho user login lai se sach hon.

## 8. Ly do hop ly de dua vao luan van

Co the viet:

```text
Trong giai doan phat trien, he thong su dung SQLite de luu du lieu local.
Sau do, tang luu tru duoc thiet ke mo rong sang PostgreSQL cloud thong qua Supabase,
giup du lieu nguoi dung, nha, phan quyen, audit log va lich su dien nang duoc luu tap trung.
Backend Flask van dong vai tro trung gian de kiem tra quyen, ghi log va giao tiep voi PLC,
tranh viec ung dung mobile truy cap truc tiep vao co so du lieu.
```

Day la cach nang cap hop ly vi no tang tinh mo rong ma khong pha vo kien truc app hien co.

## 9. Viec nen lam sau migration

Sau khi Postgres chay on dinh:

1. Them endpoint export CSV cho `power_readings`.
2. Them backup/restore note cho database.
3. Them bang `device_events` neu muon log tung lenh thiet bi ro hon.
4. Them Firebase Cloud Messaging neu can canh bao vuot quota/mat PLC.
5. Them Prometheus/Grafana neu can monitoring backend.
