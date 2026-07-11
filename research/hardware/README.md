# Quy trình thu dữ liệu phần cứng

Thư mục này là đường thu dữ liệu chính thức cho bài báo và luận văn. Công cụ mặc định chỉ chấp nhận phản hồi có `source=plc-s7-1200` và `effectiveMode=plc-real`; dữ liệu `mock` hoặc `mock-fallback` vẫn được ghi để kiểm tra lỗi nhưng không được đưa vào thống kê.

## Chuẩn bị

1. Đồng bộ giờ trên máy chạy API và máy đo.
2. Xác nhận PLC, MFM384 và backend đang ở chế độ thật.
3. Dùng tài khoản chỉ có quyền đọc cho biến môi trường `SMART_HOME_EXPERIMENT_API_TOKEN`.
4. Ghi lại PLC model/firmware, cấu hình mạng, loại kết nối, tải thử, ngày giờ và người thực hiện.
5. Không chạy thử điều khiển contactor tự động bằng script này.

## Thu mẫu

Mỗi điều kiện mạng cần tối thiểu 30 mẫu hợp lệ sau 5 lượt warm-up. Ví dụ:

```powershell
$env:SMART_HOME_EXPERIMENT_API_TOKEN='token-doc-rieng'
python research/hardware/collect_hardware_trials.py --base-url http://192.168.1.10:5001 --home-id home-demo-001 --network-label lan_wifi5 --trials 35
python research/hardware/collect_hardware_trials.py --base-url https://api.example.com --home-id home-demo-001 --network-label wan_4g --trials 35
```

Không dùng `--allow-non-real` cho dữ liệu luận văn.

## Thống kê

```powershell
python research/hardware/analyze_hardware_trials.py research/data/raw/*.csv --min-trials 30
```

Kết quả gồm `n`, mean, median, sample standard deviation, min, p95, max và số mẫu bị loại. Các file raw và metadata phải được lưu cùng phiên bản mã nguồn dùng để thu.
