# PLC - Server - App Mapping Guide

## 1. Muc tieu

App khong doc PLC truc tiep. App goi REST API tu server rieng.

Luong du lieu khuyen nghi:

```text
MFM384 -> RS485/Modbus RTU -> PLC S7-1200 -> Ethernet -> Server API -> App
```

## 2. Tag cong suat tu MFM384

| Thong so | PLC tag | Dia chi | Kieu du lieu |
|---|---|---|---|
| Dien ap | V1N | MD200 | REAL |
| Dong dien | I1N | MD212 | REAL |
| Tong cong suat | Total kW | MD224 | REAL |
| Tong dien nang | Total kWh | MD228 | REAL |

Quan trong: neu cac tag nay trong TIA Portal la `REAL` thi server phai doc voi `"type": "Real"`. Neu doc nham thanh `DWord`, app se thay cac so rat lon nhu `1130692608` vi backend dang hieu byte cua so thuc thanh so nguyen.

Luu y quan trong:

```text
MD200 nghia la dung vung M byte 200 -> 203.
MD212 nghia la dung vung M byte 212 -> 215.
MD224 nghia la dung vung M byte 224 -> 227.
MD228 nghia la dung vung M byte 228 -> 231.
```

Vi vay cac bien MD doc du lieu tu PLC/MFM384 **khong duoc trung byte** voi cac bit dieu khien bat/tat. Mapping demo hien tai tach nhu sau:

| Nhom bien | Vung nho | Muc dich |
|---|---|---|
| Status feedback | DB1.DBX1.2 -> DB1.DBX1.4 | PLC bao trang thai that cua Lamp1, Lamp2, Lamp3 |
| Command tu App | DB7.DBX0.0 -> DB7.DBX0.5 | Server gui xung Start/Stop xuong PLC |
| Du lieu do luong | MD200 tro len | V, I, kW, kWh doc tu MFM384 |

Khong dung cac bit `M200.0 -> M231.7` cho relay/status/command neu `MD200 -> MD228` dang duoc dung cho du lieu do luong. Neu dung trung, khi server doc/ghi bit co the lam sai gia tri V/I/kW/kWh hoac ghi de trang thai bat/tat.

## 3. Mapping dieu khien 3 phong demo

| Phong | Thiet bi | Start command | Stop command | Status that |
|---|---|---|---|---|
| Phong khach | Lamp1 | DB7.DBX0.0 | DB7.DBX0.1 | DB1.DBX1.2 |
| Phong bep | Lamp2 | DB7.DBX0.2 | DB7.DBX0.3 | DB1.DBX1.3 |
| Phong ngu | Lamp3 | DB7.DBX0.4 | DB7.DBX0.5 | DB1.DBX1.4 |

Backend se ghi command theo dang xung:

```text
turn-on  -> ghi Start = true, doi 200ms, ghi Start = false
turn-off -> ghi Stop  = true, doi 200ms, ghi Stop  = false
```

PLC dung xung Start/Stop de SET/RESET output, sau do cap nhat status that ve DB1.

## 4. API server chinh

```text
GET  /api/power/current
GET  /api/devices
POST /api/devices/<device_id>/turn-on
POST /api/devices/<device_id>/turn-off
POST /api/scenes/<scene>
POST /api/assistant/chat
```

## 5. App cau hinh the nao?

Vao tab Cai dat -> Server API rieng:

```text
Emulator: http://10.0.2.2:5001
Dien thoai that: http://<IP-LAPTOP>:5001
Domain/VPS: https://api-tenmiencuaban.com
```

## 6. Ghi chu van hanh

1. PLC doc MFM384 qua RS485.
2. PLC luu gia tri vao MD tag.
3. Server doc PLC bang `python-snap7`.
4. App chi doc/ghi qua server API.
5. Chat AI/Unsloth sau nay nam sau endpoint `/api/assistant/chat`.

