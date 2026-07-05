# Research Article Starter

## Dang bai phu hop

Du an nay phu hop nhat voi dang:

```text
Applied system paper / prototype implementation and evaluation
```

Nghia la bai bao khong can chung minh mot thuat toan moi hoan toan. Trong tam la thiet ke he thong, trien khai prototype va danh gia thuc nghiem bang so lieu.

## Tieu de goi y

Tieng Viet:

```text
Thiet ke va trien khai he thong giam sat dien nang nha thong minh tich hop PLC, ung dung di dong va AI du bao
```

Tieng Anh:

```text
Design and Implementation of an AI-Assisted Smart Home Energy Monitoring System Using PLC and Mobile Application
```

## Cau truc bai bao goi y

1. Abstract
2. Keywords
3. Introduction
4. Related Work
5. Proposed System Architecture
6. Implementation
7. Experimental Setup
8. Results and Discussion
9. Limitations
10. Conclusion and Future Work
11. References

## Noi dung tung muc

### Abstract

Nen gom:

- Van de: nhu cau giam sat dien nang va dieu khien nha thong minh.
- Giai phap: ket hop MFM384, PLC S7-1200, backend, mobile app, admin site va Forecast API.
- Danh gia: functional test, latency, data collection, forecast metrics.
- Ket qua: chi dua so lieu da co; neu chua do, de placeholder "to be measured".

### Introduction

Nen noi:

- Dien nang trong ho gia dinh can duoc giam sat va quan ly.
- He thong smart home can ket hop do luong, dieu khien va du bao.
- Nhu cau co mobile app, phan quyen va audit log.
- Muc tieu bai bao la trinh bay prototype va danh gia thuc nghiem.

### Related Work

Keyword tim tai lieu:

- smart home energy monitoring
- IoT based energy management system
- PLC based smart home control
- Modbus RTU energy meter monitoring
- residential load forecasting
- machine learning energy consumption forecasting
- mobile application for smart home control

### Proposed System

Can co hinh:

```text
MFM384 -> RS485/Modbus -> PLC -> Backend API -> Mobile/Admin -> Forecast API
```

Nen mo ta:

- Power measurement layer.
- PLC/control layer.
- Backend service layer.
- Application layer.
- Forecast/AI layer.
- Admin/project site layer.

### Implementation

Nen ghi:

- React Native/Expo mobile app.
- Flask backend.
- SQLite demo/local storage.
- REST API.
- Forecast API.
- Static admin/project site.
- Release Android APK arm64-v8a.

### Experimental Setup

Nen co bang:

| Hang muc | Gia tri |
|---|---|
| Dien thoai test | can dien |
| Android version | can dien |
| Backend URL | local/cloud |
| Forecast API URL | local/cloud |
| Sampling interval | 5/10/60 seconds |
| Test duration | can dien |
| APK size | 34.2 MB |

### Results and Discussion

Nen co cac bang:

- Bang pass/fail test case.
- Bang latency lenh dieu khien.
- Bang API latency.
- Bang forecast metrics.
- Bang APK/release info.

Nen co bieu do:

- `power_kw` theo thoi gian.
- `actual_power_kw` vs `forecast_value_kw`.
- Forecast error theo thoi gian.
- Latency distribution.

### Limitations

Nen ghi ro:

- Prototype moi duoc test trong quy mo han che.
- Du lieu thuc nghiem can thu dai ngay hon.
- Forecast metrics hien co dua tren dataset tham chieu/UCI neu chua co du lieu nha that.
- Retrain endpoint hien la POC.
- Can danh gia bao mat va do on dinh dai han truoc production.

### Conclusion

Nen ket luan:

- He thong da trien khai duoc end-to-end.
- Prototype dap ung chuc nang giam sat, dieu khien, phan quyen va du bao o muc demo/thuc nghiem.
- Du lieu va metric thuc nghiem se quyet dinh suc thuyet phuc cua bai bao.

## Claim matrix

| Claim | Co the viet ngay? | Can bang chung |
|---|---|---|
| Da xay dung mobile app | Co | Screenshot, APK, source |
| Da co backend API | Co | Endpoint audit, smoke test |
| Da co admin site | Co | Screenshot, endpoint |
| Da co project site | Co | Domain/screenshot |
| Da co Forecast API | Co | Metrics/API docs |
| AI du bao tot tren nha that | Chua | Can dataset nha that va metric moi |
| He thong on dinh dai ngay | Chua | Can test 24-72 gio |
| Dieu khien thiet bi that nhanh | Chua day du | Can latency bang nhieu lan do |
| San sang production | Khong nen claim | Can bao mat, scale, long-run test |


