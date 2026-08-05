# KẾ HOẠCH KIỂM THỬ VÀ THỰC NGHIỆM EVIDENCE-SAFE

## 1. Mục tiêu và nguyên tắc

Kế hoạch này là nguồn chính thức thay thế kế hoạch kiểm thử cũ. Mỗi kết quả công bố phải truy ngược được đến raw data, script phân tích, metadata môi trường, code revision và SHA-256. Mock, sample, fallback và dữ liệu nhập tay không được trình bày như kết quả phần cứng thật.

Ba mức bằng chứng được tách riêng:

1. **Software contract:** unit/integration test chứng minh guard và state transition trong môi trường test.
2. **Hardware-in-the-loop:** thử với PLC/relay hoặc tải giả trong khu vực kiểm soát.
3. **Physical validation:** thử PLC, MFM384, contactor và feedback thật có giám sát.

Nếu thiếu bằng chứng mức 2 hoặc 3, bài báo chỉ được mô tả chức năng đã hiện thực, không được kết luận hiệu năng vật lý.

## 2. Phạm vi kết quả hiện tại

### Được phép báo cáo

- Kiểm thử xác thực, logout/revoke session, rate limiting và RBAC theo nhà.
- Telemetry chỉ được ghi bằng service credential và fail-closed khi thiếu token.
- PLC command được tuần tự hóa; feedback không đạt thì không cập nhật trạng thái thành công.
- Auto-load-shedding tắt mặc định.
- Kết quả forecast chỉ khi được sinh từ benchmark hiện hành và canonical evidence gate cho phép.

### Không nằm trong phạm vi kết quả hiện tại

- SMS gateway, độ trễ SMS và chống spam SMS.
- LSTM/CNN-LSTM nếu chưa chạy trong cùng pipeline, split và dữ liệu.
- Tự động sa thải tải thật, tiết kiệm điện hoặc peak reduction.
- Độ trễ PLC/LAN/WAN khi chưa có raw trial được collector xác nhận `source=plc-s7-1200` và `effectiveMode=plc-real`.
- Độ chính xác trên dữ liệu Cần Thơ khi chưa có tối thiểu 30 ngày dữ liệu MFM384 hợp lệ.

## 3. Ma trận câu hỏi nghiên cứu

| Mã | Câu hỏi | Bằng chứng | Tiêu chí mở claim |
|---|---|---|---|
| RQ1 | Kiến trúc có ngăn tài khoản ứng dụng ghi telemetry và vượt quyền không? | Automated security tests, audit log | Toàn bộ test bắt buộc đạt |
| RQ2 | Cơ chế command lock và feedback có tránh trạng thái ảo không? | Unit/integration test và HIL log | Không có state-success khi feedback timeout |
| RQ3 | Mô hình học máy có vượt baseline đơn giản không? | Rolling-origin benchmark, nhiều seed | Cùng dataset/split; báo mean ± sample SD |
| RQ4 | Độ trễ end-to-end trên PLC thật là bao nhiêu? | Raw CSV và metadata | Tối thiểu 30 accepted trial mỗi điều kiện |

## 4. Kiểm thử phần mềm và bảo mật

| ID | Kịch bản | Kết quả mong đợi | Bằng chứng |
|---|---|---|---|
| AUTH-01 | Đăng nhập sai lặp lại | 429 sau ngưỡng cấu hình | Automated test |
| AUTH-02 | Logout rồi dùng lại token | 401 | Automated test |
| RBAC-01 | Viewer điều khiển thiết bị | 403 | Automated test |
| RBAC-02 | User nhà A điều khiển thiết bị nhà B | 403 | Automated test |
| TEL-01 | Bearer user gọi POST telemetry | 401/403 | Automated test |
| TEL-02 | Thiếu service token | 503, không ghi DB | Automated test |
| PLC-01 | Feedback đã ở target | Không phát command pulse thừa | Automated test |
| PLC-02 | Scene lỗi một thiết bị | Trả partial failure theo thiết bị | Automated test |
| SAFE-01 | Vượt quota khi auto-shedding tắt | Không gửi lệnh ngắt tải | Automated test |

## 5. Protocol thu độ trễ phần cứng

### 5.1 Điều kiện bắt buộc

- Auto-load-shedding giữ `false`.
- Chỉ dùng endpoint đọc cho thử latency collector hiện tại.
- Token và home ID được cấp qua environment, không ghi vào raw log.
- Warm-up tối thiểu 5 request; trial chính thức tối thiểu 30 cho mỗi điều kiện.
- Collector chỉ accepted khi HTTP 200, `source=plc-s7-1200` và `effectiveMode=plc-real`.

### 5.2 Nhóm thử nghiệm

| ID | Điều kiện | Thao tác | Chỉ số |
|---|---|---|---|
| HW-READ-LAN | LAN có dây/Wi-Fi đã mô tả | GET current power | success rate, mean, median, SD, p95, max |
| HW-READ-WAN | WAN/4G qua endpoint HTTPS | GET current power | success rate, mean, median, SD, p95, max |
| HIL-FB-ON | Tải giả, người giám sát | Command ON và chờ statusTag | end-to-end feedback latency, timeout rate |
| HIL-FB-OFF | Tải giả, người giám sát | Command OFF và chờ statusTag | end-to-end feedback latency, timeout rate |
| HIL-FAIL | Mất mạng/feedback đứng yên | Gửi command có kiểm soát | fail-closed, không cập nhật state ảo |

Ngưỡng 200/300/1500 ms, nếu sử dụng, chỉ là engineering acceptance criterion. Nó không được trình bày như kết quả và phải có lý do lựa chọn.

### 5.3 Thống kê

Giữ cả mẫu accepted và rejected. Báo cáo `n`, `rejected_n`, mean, median, sample SD, min, p95 và max. Khi đủ dữ liệu, bổ sung bootstrap 95% CI cho median/p95. Không loại outlier chỉ để làm kết quả đẹp; mọi quy tắc loại mẫu phải được định nghĩa trước khi xem kết quả.

## 6. Protocol benchmark forecast

### 6.1 Dữ liệu và chống leakage

- Resample theo giờ và chia theo thời gian; không random split.
- Feature rolling luôn shift ít nhất một bước trước khi tính.
- Ghi dataset SHA-256, khoảng thời gian, số dòng, timezone, bước xử lý missing và code revision.
- UCI dùng kiểm tra khả năng tái lập; dữ liệu MFM384 địa phương dùng đánh giá cùng miền.

### 6.2 Baseline và mô hình

| Nhóm | Thành phần |
|---|---|
| Baseline bắt buộc | Persistence, seasonal-naive 24 giờ, seasonal-naive 168 giờ |
| Mô hình học máy | Random Forest, XGBoost |
| Ngoài phạm vi cho đến khi chạy được | LSTM, CNN-LSTM |

Mô hình được chọn bằng validation MAE. Test không dùng để chọn mô hình.

### 6.3 Lặp và đánh giá

- Tối thiểu 2 rolling-origin folds; mục tiêu 3-5 folds khi tài nguyên cho phép.
- Tối thiểu 2 random seeds cho mô hình ngẫu nhiên; báo mean ± sample SD.
- Metric chính: MAE. Metric phụ: RMSE, R², MAPE có floor 0,2 kW và inference ms/sample.
- Báo riêng h+1, h+6, h+12 và h+24.
- Không đặt trước mục tiêu R² hoặc gọi XGBoost là mô hình đề xuất trước khi validation hoàn tất.

## 7. Load-shedding an toàn

Load-shedding không nằm trong kết quả thực nghiệm hiện tại. Lộ trình mở lại gồm:

1. Offline policy simulation, không gửi lệnh.
2. Dry-run trên backend, chỉ log quyết định.
3. HIL với tải giả, interlock, essential-load exclusion và manual override.
4. Hazard analysis và phê duyệt quy trình.
5. Physical supervised trial.

Cho đến khi hoàn tất cả năm bước, `allowAutomaticLoadSheddingClaims` phải luôn là `false`.

## 8. Canonical evidence pipeline

```text
raw data + metadata
        -> analyzer/benchmark script
        -> metrics JSON + fingerprints
        -> canonical_results.json
        -> Excel + CSV + figures + paper + thesis
```

Không chỉnh tay số trong Excel, hình, bài báo hoặc luận văn. Nếu evidence gate là false, artifact phải hiển thị “Chờ bằng chứng”, không hiển thị 0 hoặc số minh họa.

## 9. Checklist trước khi công bố

- [ ] Raw source tồn tại và có SHA-256.
- [ ] Script chạy lại thành công từ môi trường sạch.
- [ ] Baseline và mô hình dùng cùng split.
- [ ] Báo mean ± SD cho thí nghiệm lặp.
- [ ] Hardware row xác nhận nguồn PLC thật.
- [ ] Không có SMS, LSTM, load-shedding hoặc local-accuracy claim chưa triển khai.
- [ ] Bảng, hình, bài báo và luận văn được sinh từ cùng canonical source.
- [ ] Tài liệu tham khảo có DOI hoặc trang nhà xuất bản chính thức.
