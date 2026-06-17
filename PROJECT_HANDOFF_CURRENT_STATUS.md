# PROJECT HANDOFF CURRENT STATUS

**Ngay cap nhat:** 17/06/2026
**Repo:** `https://github.com/locstht-hub/smart-home-ai.git`  
**Nhanh chinh:** `main`
**Muc dich:** File nay la diem vao nhanh cho Codex/IDE/AI khac de hieu du an hien tai dang o dau.

---

## 1. Tom tat trang thai hien tai

Du an Smart Home AI hien la prototype kha day du cho do an/luan van:

- Mobile app React Native/Expo da co cac man hinh chinh: dang nhap/dang ky, dashboard, phong/thiet bi, phan tich nang luong, chat, cai dat, quan ly thanh vien.
- Backend Flask van la lop logic trung tam: auth, phan quyen, nha, thanh vien, quota, power readings, audit logs, rooms/devices, admin API.
- Supabase/PostgreSQL da duoc dua vao lam co so du lieu tap trung. SQLite van con la fallback/local dev.
- Admin site da ket noi backend public, dang nhap duoc bang tai khoan `system_admin`, xem du lieu nha/tai khoan/audit log.
- Admin site da co CRUD thu cong cho phong va thiet bi muc 1: them/sua/xoa phong, them/sua/xoa thiet bi, nhap cong suat dinh muc W.
- Mobile `RoomsScreen` da noi voi API rooms/devices thu cong, giup bot phu thuoc vao demo cung.
- Project site/website gioi thieu da duoc redesign/cap nhat noi dung truoc do.
- Tai lieu luan van, phan bien, test plan va goi ngu canh cho AI da duoc tao/cap nhat.

---

## 2. Kien truc hien tai

```text
Mobile App / Admin Site / Project Site
        |
        v
Flask Backend API
        |
        v
Supabase PostgreSQL
        |
        +--> users, homes, home_members, sessions
        +--> audit_logs
        +--> power_readings
        +--> rooms, devices, device_events
```

Luu y quan trong:

- Supabase la database tap trung, **khong thay the Flask backend**.
- Backend Flask van can chay de xu ly dang nhap, phan quyen, API, audit log, dieu khien va doc PLC/MFM384 sau nay.
- Trong prototype, backend co the chay tren laptop de dev/test voi PLC.
- Khi trien khai thuc te, backend nen chuyen sang edge gateway nhu mini PC/Raspberry Pi dat cung mang voi PLC/MFM384.

---

## 3. Backend va Supabase

Thu muc chinh:

```text
backend/smart_home_server/
```

Da co:

- `app.py`: Flask API chinh.
- `auth_store.py`: SQLite store/local fallback.
- `postgres_auth_store.py`: Postgres/Supabase store.
- `.env.example`: mau cau hinh, khong chua mat khau that.
- `migrations/001_supabase_schema.sql`: schema Supabase core.
- `migrations/002_manual_rooms_devices.sql`: schema rooms/devices muc quan ly thu cong.
- `SUPABASE_MIGRATION_PLAN.md`: huong dan va ly do chuyen SQLite -> Supabase/Postgres.

Bang Supabase/Postgres da thiet ke:

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

Y nghia phan luong du lieu:

- Moi nha co `home_id`.
- Moi phong co `home_id`.
- Moi thiet bi co `home_id` va co the co `room_id`.
- Du lieu dien tong nha nam trong `power_readings` theo `home_id`.
- Hanh dong quan trong nam trong `audit_logs`.
- Su kien thiet bi thu cong nam trong `device_events`.

Dang dung muc 1:

- Nguoi quan ly/admin/owner tu them phong.
- Tu them thiet bi.
- Tu nhap cong suat dinh muc W.
- Chua bat buoc auto-discovery thiet bi.
- Chua bat buoc do rieng tung thiet bi.

---

## 4. Admin site

Thu muc:

```text
admin-site/
```

Trang admin hien goi API:

```text
https://api.smarthomeai.id.vn
```

Tai khoan admin mac dinh theo seed backend:

```text
Username: admin
Password: admin123
Role: system_admin
```

Da lam duoc:

- Dang nhap admin.
- Xem tong quan he thong.
- Xem danh sach nha.
- Xem danh sach tai khoan.
- Xem audit log/nhat ky.
- Xem chi tiet tung nha.
- Xem so phong, so thiet bi, tong cong suat dinh muc theo tung nha.
- Quan ly thu cong phong/thiet bi ngay trong chi tiet nha.
- Giao dien admin dang duoc Viet hoa de phu hop demo/luan van.

Luu y van hanh:

- Neu thay `Failed to fetch`, thuong la backend API public dang tat/bi Cloudflare chan/loi deploy.
- Neu thay `API: online`, admin site da ket noi backend thanh cong.
- Neu trinh duyet giu cache JS cu, xem query version cuoi file `admin-site/index.html`.

---

## 5. Mobile app

Thu muc chinh:

```text
src/
App.tsx
```

Da lam duoc:

- Redesign nhieu man hinh mobile cho dong bo UI.
- Dang nhap/dang ky da dep hon va nghiem tuc hon.
- Dashboard/Rooms/Analysis/Chat/Settings da duoc audit/redesign truoc do.
- MemberManagement/Admin screen da duoc lam tiep o cac vong truoc.
- `RoomsScreen` da ket noi API rooms/devices thu cong, khong chi hien demo cung.
- App co the doc nha/phong/thiet bi theo backend.

Build Android:

- Da tung build release APK de cai tren dien thoai.
- File build gan day thuong nam trong:

```text
dist/
```

Khi can build lai nen dung release build va tranh duong dan qua dai.

---

## 6. Project site

Thu muc:

```text
project-site/
```

Da lam:

- Redesign/cap nhat noi dung project site.
- Dong bo thong diep voi mobile/admin site.
- Co trang gioi thieu, tien do/du an va noi dung phuc vu demo.

Domain:

```text
https://smarthomeai.id.vn/
```

Neu trang web van hien giao dien cu:

- Kiem tra Cloudflare Pages da deploy commit moi chua.
- Hard refresh trinh duyet.
- Kiem tra cache/CDN.

---

## 7. Tai lieu luan van va phan bien

File quan trong:

```text
TEST_PLAN_LUAN_VAN.md
TAI_LIEU_PHAN_BIEN_KIEN_TRUC.md
TOM_TAT_TIEN_DO_DU_AN_SMART_HOME_AI.md
TIEN_TRINH_DU_AN.md
BACKEND_ENDPOINT_AUDIT.md
PLC_SERVER_MAPPING_GUIDE.md
HUONG_DAN_SU_DUNG_APP.md
SMART_HOME_APP_SOURCE_FOR_GPT.txt
```

Da thong nhat lap luan quan trong:

- Prototype backend co the chay tren laptop de thuan tien dev/test voi PLC.
- Du lieu tach sang Supabase/Postgres de luu tap trung.
- Trien khai thuc te co the chuyen backend sang edge gateway mini PC/Raspberry Pi.
- Dieu nay phu hop thuc te vi gateway dat cung mang voi PLC/MFM384 se on dinh hon laptop dev.
- Muc 1 quan ly thiet bi la thu cong: admin/owner nhap phong, thiet bi, cong suat dinh muc.

Noi dung nen dung khi phan bien:

```text
Trong giai doan prototype, backend duoc trien khai tren laptop de thuan tien phat trien va kiem thu voi PLC.
Du lieu duoc tach sang Supabase/PostgreSQL nham luu tru tap trung.
Khi trien khai thuc te, backend co the duoc chuyen sang edge gateway nhu mini PC hoac Raspberry Pi dat cung mang voi PLC/MFM384,
giup he thong hoat dong lien tuc va giam phu thuoc vao may phat trien.
```

---

## 8. Kiem thu va so lieu can thu cho luan van

Can uu tien test:

- Dang nhap/dang xuat admin/mobile.
- Tao nha, tao chu nha, tao thanh vien.
- Them/sua/xoa phong va thiet bi thu cong.
- Kiem tra moi nha chi thay dung phong/thiet bi cua nha do.
- Kiem tra audit log khi admin/owner thao tac.
- Kiem tra quota/hien thi dien nang.
- Kiem tra API backend voi Supabase co giu du lieu sau khi restart server.
- Kiem tra do tre API public qua Cloudflare.
- Kiem tra do tre local LAN khi backend chay cung mang PLC.

So lieu nen thu:

- Thoi gian phan hoi API login/list homes/list devices.
- So ban ghi power_readings theo ngay/gio.
- Do tre public API vs local API.
- Ti le thanh cong CRUD phong/thiet bi.
- So lan loi mat ket noi API.
- Anh chup man hinh mobile/admin/project site.

---

## 9. Nhung viec can nho

- `admin-site/app.js` va `admin-site/index.html` da duoc Viet hoa them trong phien 17/06/2026.
- Co 2 artifact GPT pack dang untracked, tam thoi khong commit neu khong can:

```text
GPT55_PROJECT_PACK_20260612/
smart-home-ai-gpt55-context-pack-20260612.zip
```

- Khong commit `.env` vi co the chua password Supabase.
- Neu Supabase password da tung lo trong chat/man hinh, nen reset password trong Supabase khi chuan bi public nghiem tuc.

---

## 10. Buoc tiep theo nen lam

Thu tu hop ly:

1. Hoan tat Viet hoa admin site va commit/push.
2. Test tao phong/thiet bi tren admin site public.
3. Kiem tra mobile RoomsScreen doc dung rooms/devices vua tao.
4. Cap nhat them anh minh hoa vao tai lieu luan van neu can.
5. Neu muon thuc nghiem that: chuan bi kich ban thu du lieu MFM384/PLC va lich thu du lieu ngan, khong can mo laptop 24/7 neu co gateway/lich test hop ly.

---

## 11. Lenh nen chay khi mo lai bang IDE khac

```powershell
git status --short --branch
node --check admin-site\app.js
python -m py_compile backend\smart_home_server\app.py backend\smart_home_server\auth_store.py backend\smart_home_server\postgres_auth_store.py
```

Neu can test backend local:

```powershell
cd backend\smart_home_server
python app.py
```

Neu can test admin site:

```text
Mo admin-site/index.html hoac domain admin public.
Dang nhap: admin / admin123
```
