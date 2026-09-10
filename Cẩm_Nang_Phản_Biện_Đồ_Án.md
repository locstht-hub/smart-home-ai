# CẨM NANG PHẢN BIỆN ĐỒ ÁN SMART HOME AI

Tài liệu này chỉ giữ các câu hỏi có giá trị khi bảo vệ đồ án. Mục tiêu là trả lời ngắn gọn, đúng kỹ thuật, không nói quá khả năng hiện tại của hệ thống.

## Trạng thái phần mềm hiện hành — 10/09/2026

Backend/control suite đạt **42/42**, frontend contract đạt **22/22**, web
dashboard đạt **21/21**; forecast contracts đạt **7 Python + 2 Node**, research
HEAD đạt **7**, admin audit đạt **5** và room presentation đạt **3**. `npm run
lint` và Python compilation đạt. Một native-artifact check được bỏ qua vì chưa
có thiết bị/AVD; QA trên thiết bị thật còn chờ (`adb` không thấy thiết bị, không
có AVD), chưa ghi nhận cài APK hoặc triển khai server. Sa thải tải tự động vẫn bị
khóa bởi `AUTO_LOAD_SHEDDING_KW_SAFETY_READY=False`; ba tầng tải chỉ là đề xuất.

Bản ghi phần mềm ngày **09/09/2026** được giữ để truy vết: backend/control
**39/39**, frontend **22/22**, lint và Android JavaScript export **1509 modules**.
Lượt 10/09 thay thế số backend; export 1509 là bằng chứng lịch sử. Astra vẫn
đang xem xét index đã sửa, nên chưa gọi đây là phê duyệt cuối.

## Hồ sơ nghiên cứu cục bộ ngày 04/09/2026 — lịch sử, không phải trạng thái runtime

Các đoạn và số liệu dưới đây được giữ để truy vết bản ghi nghiên cứu cục bộ ngày
04/09/2026. Lượt đồng bộ ngày 09–10/09/2026 không chạy lại nghiên cứu, không thay
mô hình phục vụ ứng dụng và không gửi lệnh phần cứng. Báo cáo, metrics và bản
thảo nghiên cứu ngày 04/09 nằm ngoài phạm vi push app + main docs; không suy ra
từ các liên kết này rằng remote repository có đủ toàn bộ bằng chứng.

Tên bài được ghi trong hồ sơ: **Xây dựng mô hình giám sát, điều khiển từ xa và dự báo phụ tải hộ gia đình tích hợp IoT**. Tên tiếng Anh: **An IoT-integrated prototype for residential load monitoring, remote control and forecasting**. Đây là tên bài báo, không tự động thay đổi tên đồ án đã đăng ký.

Theo hồ sơ đó, đợt bổ sung baseline OLS, ablation và phân tích thống kê đã
chạy ngày 04/09/2026 trên dữ liệu UCI lưu cục bộ (14:03:21–14:32:14 UTC,
khoảng 28 phút 53 giây chạy tính toán). Nguồn được ghi là
`research/results/forecast_extension_20260904/metrics.json`; 168 tệp NPZ và
12 kết quả HAC được ghi là đã đối soát, cùng 20 test nghiên cứu. Các số này là
bản ghi nghiên cứu, không phải lượt chạy mới của lần đồng bộ này.

Các phép thử không kết nối PLC/MFM384, không gửi lệnh đóng/cắt, không đo lại LAN/4G và không thay mô hình đang phục vụ ứng dụng. Nội dung phần mềm bên dưới mô tả thiết kế hoặc mốc kiểm thử trước đây, không phải chứng nhận trạng thái runtime hiện tại. Tình trạng dàn trang/PDF được ghi riêng trong `research/LAYOUT_QA_20260904.md`, không suy ra từ việc thí nghiệm hoàn tất.

### Kết quả cần nhớ khi phản biện

MAE và RMSE tính bằng kW, trung bình trên ba fold; RF/XGBoost có ba seed mỗi fold, các baseline xác định có một lượt mỗi fold. MAPE dùng sàn mẫu số 0,2 kW.

| Mô hình đầy đủ | MAE | RMSE | MAPE (%) | R² |
|---|---:|---:|---:|---:|
| Persistence | 0,694527 | 0,933305 | 99,846 | −0,806809 |
| Seasonal Naive 24 giờ | 0,514873 | 0,756456 | 66,653 | −0,191510 |
| Seasonal Naive 168 giờ | 0,543852 | 0,784249 | 75,072 | −0,285104 |
| OLS | 0,433809 | 0,593665 | 57,648 | 0,258900 |
| RF | 0,421925 | 0,575155 | 58,120 | 0,308413 |
| XGBoost | 0,422275 | 0,572849 | 58,587 | 0,312770 |

OLS có MAPE thấp hơn RF/XGBoost dù MAE/RMSE cao hơn; không nói RF/XGBoost thắng ở mọi chỉ tiêu. RF được chọn theo MAE validation trong nhóm mô hình đầy đủ, không phải chọn cấu hình sau khi nhìn test.

| Ablation (số đặc trưng) | RF MAE/RMSE | XGBoost MAE/RMSE |
|---|---:|---:|
| Base (86): bỏ lịch và thống kê cửa sổ | 0,432339 / 0,586567 | 0,436179 / 0,586499 |
| Base + rolling (129): bỏ lịch | 0,436769 / 0,588430 | 0,440688 / 0,589298 |
| Base + calendar (102): bỏ thống kê cửa sổ | 0,416899 / 0,573175 | 0,417199 / 0,571785 |
| Đầy đủ (145) | 0,421925 / 0,575155 | 0,422275 / 0,572849 |

Nhóm lịch có 16 biến; nhóm thống kê cửa sổ có 43 biến, gồm rolling/EWM và trung bình cùng giờ bảy ngày; base giữ các biến đo hiện tại, lag và biến dẫn xuất còn lại. Bỏ lịch làm MAE tăng; bỏ nhóm thống kê cửa sổ làm MAE giảm khoảng 0,005025 kW với RF và 0,005076 kW với XGBoost. Đây là kết quả mô tả, **không thay cấu hình chính hoặc model app bằng biến thể 102 đặc trưng theo điểm test**; chưa kiểm định riêng các chênh lệch ablation.

HAC chính dùng độ trễ thực theo giờ 168, nhân Bartlett và tâm hóa riêng từng fold. Loss tại mỗi mốc là sai số tuyệt đối trung bình 24 chân trời, sau đó trung bình loss riêng của ba seed (không lấy sai số của một ensemble dự báo). Có 5.169 mốc test; Holm điều chỉnh ba so sánh trong mỗi băng thông. Khoảng tin cậy dưới đây là khoảng 95% theo từng so sánh, không phải khoảng đồng thời đã hiệu chỉnh Holm.

| So sánh (trái trừ phải) | Δ MAE (kW) | Khoảng tin cậy 95% | p Holm |
|---|---:|---|---:|
| XGBoost − RF | +0,000350 | [−0,004784; 0,005485] | 0,893617 |
| RF − OLS | −0,011885 | [−0,017231; −0,006538] | 0,000039589 |
| XGBoost − OLS | −0,011534 | [−0,017696; −0,005373] | 0,000486880 |

Trong phân tích thăm dò này, RF và XGBoost có loss trung bình thấp hơn OLS, nhưng chưa có bằng chứng khác biệt giữa RF và XGBoost. Kết luận theo ngưỡng 0,05 không đổi ở các độ trễ kiểm tra 24, 48 và 336 giờ. Điều này không chứng minh hai mô hình tương đương, không đánh giá bất định do lấy mẫu hộ gia đình hoặc huấn luyện lại và không bảo đảm tính chuyển giao sang Việt Nam.

---

## Trạng thái phần mềm cần dùng khi phản biện (10/09/2026)

- Backend/control suite: **42/42** kiểm thử đạt; web dashboard: **21/21**.
- Forecast contracts: **7 Python + 2 Node**; research HEAD: **7**; admin audit:
  **5**; room presentation: **3**; các nhóm này đều đạt.
- Frontend contract: **22/22** kiểm thử đạt; `npm run lint` và Python compilation đạt.
- QA trên thiết bị thật còn chờ: `adb` không thấy thiết bị và không có AVD khả dụng. Báo cáo này không ghi nhận cài APK hoặc triển khai server.
- Đây là bằng chứng cho mã nguồn và các hợp đồng phần mềm. Không dùng để thay thế phép đo PLC/MFM384, đóng cắt contactor, độ trễ vật lý hoặc điều kiện phát hành production.

Lượt 09/09 vẫn là bằng chứng lịch sử cho lint và Android JavaScript export
**1509 modules**; không diễn giải export đó như APK đã được QA. Astra review của
lượt sửa 10/09 chưa có kết luận cuối.

## 1. Kiến trúc tổng thể

### Câu hỏi 1: Hệ thống của em khác gì một app bật/tắt thiết bị thông thường?

**Trả lời:** Hệ thống không chỉ bật/tắt thiết bị. Đây là prototype HEMS/IoT có đủ các lớp:

1. App di động để người dùng giám sát và điều khiển.
2. Backend API làm trung gian giữa app, database, PLC và Forecast API.
3. Phân quyền nhiều người dùng theo hộ gia đình.
4. Lưu lịch sử điện năng theo `home_id`.
5. Hạn mức kWh và cảnh báo tiêu thụ.
6. Forecast API dự báo phụ tải.
7. Định hướng tích hợp PLC S7-1200 và MFM384 để đọc dữ liệu thật.

Vì vậy hệ thống được định vị là nền tảng quản lý năng lượng nhà thông minh, không chỉ là giao diện điều khiển relay.

---

### Câu hỏi 2: Vì sao App không ghi trực tiếp xuống PLC mà phải qua Backend?

**Trả lời:** Không cho App ghi trực tiếp vào PLC vì không an toàn và khó quản lý quyền. Backend đóng vai trò API Gateway:

1. Xác thực người dùng bằng token.
2. Kiểm tra quyền theo vai trò và `home_id`.
3. Ghi audit log cho thao tác điều khiển.
4. Chuẩn hóa lệnh trước khi ghi xuống PLC.
5. Ẩn địa chỉ IP, tag và cấu trúc PLC khỏi điện thoại người dùng.

Luồng đúng là:

```text
App -> Backend API -> PLC -> Relay/Contactor -> Tải
```

---

### Câu hỏi 3: Vì sao dùng Cloudflare Tunnel?

**Trả lời:** Trong giai đoạn demo, backend chạy trên laptop nên điện thoại ở ngoài mạng LAN không thể gọi trực tiếp IP nội bộ. Cloudflare Tunnel giúp tạo domain HTTPS công khai như `https://api.smarthomeai.id.vn` mà không cần mở port modem, không cần IP tĩnh và an toàn hơn khi demo từ xa.

Khi triển khai thật, có thể chuyển backend lên VPS hoặc dùng Edge Gateway tại từng nhà gửi dữ liệu lên cloud.

---

### Câu hỏi 3b: Nếu mở rộng triển khai hệ thống cho nhiều ngôi nhà hoặc chung cư thì cần những thành phần gì?

**Trả lời:** Dạ thưa Thầy/Cô, hệ thống được thiết kế theo kiến trúc **Đa người thuê (Multi-tenant Edge-Cloud)**.
1. **Tại mỗi ngôi nhà (Local/Edge Layer):** Chỉ cần lắp đặt 1 tủ điện đo lường và điều khiển tại chỗ (Edge) gồm PLC Siemens S7-1200, đồng hồ đo điện đa năng Selec MFM384 (giao tiếp Modbus RTU qua RS485), các contactor đóng cắt tải và kết nối mạng (LAN/Wifi/4G). Mỗi nhà được gán một mã định danh duy nhất (`home_id`).
2. **Hạ tầng Trung tâm dùng chung (Cloud Layer):** Có thể quản lý tập trung cơ sở dữ liệu, phân quyền RBAC (`system_admin`, `owner`, `member`), dự báo và cảnh báo. Khóa `home_id` cùng kiểm tra quyền ở backend hỗ trợ phân tách dữ liệu; chỉ riêng khóa ngoại không bảo đảm an toàn tuyệt đối.

Đây là định hướng mở rộng. Chưa có phép thử tải và triển khai nhiều hộ để khẳng định phục vụ hàng trăm căn hộ đồng thời.

---


## 2. PLC, phần cứng và đồng bộ trạng thái

### Câu hỏi 4: Nếu người dùng bấm nút vật lý ngoài tủ điện thì App có đồng bộ được không?

**Trả lời:** Có, nếu nút vật lý được đấu vào input PLC và PLC ghi trạng thái thật ra tag status.

Luồng đúng:

```text
Nút vật lý/App command -> PLC xử lý logic -> Output/Relay/Contactor -> Status feedback -> Backend -> App
```

App không nên hiển thị theo “lệnh vừa gửi”, mà phải hiển thị theo trạng thái thật PLC đọc được. Nhờ vậy bật bằng nút vật lý hay bằng App thì App vẫn đồng bộ.

---

### Câu hỏi 5: Nếu dữ liệu PLC khác trạng thái App thì tin bên nào?

**Trả lời:** Tin trạng thái thật từ PLC/status feedback. App chỉ là giao diện gửi lệnh và hiển thị. PLC là lớp điều khiển tại hiện trường.

Nếu App gửi lệnh bật nhưng relay/contactor không đóng, App phải báo lỗi hoặc hiển thị trạng thái không khớp. Vì vậy cần feedback từ PLC hoặc tiếp điểm phụ của contactor.

---

### Câu hỏi 6: Tại sao phải tách vùng nhớ MD đo lường với vùng nhớ bật/tắt thiết bị?

**Trả lời:** Trong PLC Siemens, `MD` vẫn nằm trên vùng nhớ M. Ví dụ `MD200` chiếm các byte `M200`, `M201`, `M202`, `M203`. Nếu vừa dùng `MD200` để lưu điện áp, vừa dùng `M200.0` làm bit bật/tắt relay, hai biến sẽ ghi đè cùng vùng nhớ.

Quy ước trong dự án:

| Nhóm biến | Vùng nhớ | Mục đích |
|---|---|---|
| Status feedback | `DB1.DBX1.2 -> DB1.DBX1.4` | PLC báo trạng thái thật của 3 tải demo |
| Command từ App | `DB7.DBX0.0 -> DB7.DBX0.5` | Backend gửi xung Start/Stop xuống PLC |
| Đo lường | `MD200` trở lên | `V`, `I`, `kW`, `kWh` từ MFM384 |

Không dùng `M200.0 -> M231.7` cho relay/status/command nếu đang dùng `MD200`, `MD212`, `MD224`, `MD228` cho đo lường.

---

### Câu hỏi 7: Có thể dùng Data Block thay vì vùng M không?

**Trả lời:** Có. Dùng Data Block còn rõ ràng hơn nếu cấu hình PLC cho phép Snap7 truy cập.

Thiết kế đề xuất:

```text
DB_COMMAND: Backend ghi lệnh từ App
DB_STATUS: PLC ghi trạng thái thật
DB_POWER: PLC lưu V, I, kW, kWh
```

Ví dụ:

```text
DB_COMMAND.DBX0.0  -> lệnh bật đèn phòng khách
DB_STATUS.DBX1.2   -> trạng thái thật đèn phòng khách
DB_POWER.DBD0      -> điện áp V
DB_POWER.DBD4      -> dòng điện I
DB_POWER.DBD8      -> công suất kW
DB_POWER.DBD12     -> điện năng kWh
```

Điểm quan trọng là command, status và power phải tách vùng, không ghi chồng nhau.

Mapping demo hiện tại của 3 phòng:

| Phòng | Start | Stop | Status thật |
|---|---|---|---|
| Phòng khách | `DB7.DBX0.0` | `DB7.DBX0.1` | `DB1.DBX1.2` |
| Phòng bếp | `DB7.DBX0.2` | `DB7.DBX0.3` | `DB1.DBX1.3` |
| Phòng ngủ | `DB7.DBX0.4` | `DB7.DBX0.5` | `DB1.DBX1.4` |

---

### Câu hỏi 8: Nếu dùng tải thật thì phần cứng nên bố trí thế nào để an toàn?

**Trả lời:** PLC không nên đóng cắt tải 220VAC trực tiếp. Kiến trúc an toàn:

```text
App -> Backend -> PLC output -> Relay trung gian 24VDC -> Contactor/Relay công suất -> Tải thật
```

Tủ điện nên có:

1. MCB/cầu chì bảo vệ.
2. Nguồn 24VDC cho PLC và relay trung gian.
3. Relay 14 chân làm tầng cách ly điều khiển.
4. Contactor/relay công suất chịu dòng tải thật.
5. MFM384 đo `V`, `I`, `kW`, `kWh`.
6. Tiếp điểm phụ đưa về PLC để xác nhận trạng thái.

---

## 3. Dữ liệu điện năng và Forecast

### Câu hỏi 9: App đang hiển thị đơn vị điện như thế nào cho đúng?

**Trả lời:** Quy ước đúng:

| Đại lượng | Ký hiệu | Đơn vị |
|---|---|---|
| Điện áp | `V` | Volt |
| Dòng điện | `I` | Ampere |
| Công suất tức thời | `P` | `kW` |
| Điện năng tiêu thụ | `E` | `kWh` |

`kW` là công suất tại thời điểm hiện tại. `kWh` là điện năng tích lũy theo thời gian. Không được dùng lẫn hai đơn vị này.

---

### Câu hỏi 10: AI dự báo phụ tải có thật sự cần thiết không?

**Trả lời:** Dự báo bổ sung thông tin về phụ tải tương lai cho giám sát hiện tại. Trong prototype, kết quả 24 giờ được hiển thị để tham khảo; cảnh báo quota hiện dùng điện năng tích lũy đã đo, không dùng đầu ra dự báo. Những khả năng có thể nghiên cứu tiếp gồm:

1. Ước lượng phụ tải 24 giờ tới.
2. Cảnh báo nguy cơ vượt hạn mức.
3. Gợi ý thời điểm nên giảm tải.
4. Làm nền cho tối ưu chi phí điện sau này.

XGBoost và RF được đánh giá bằng cùng giao thức; thời gian suy luận theo lô không phải độ trễ API hay bằng chứng điều khiển thời gian thực. LSTM/CNN-LSTM là hướng mở rộng, chưa phải kết quả của bài này.

---

### Câu hỏi 11: Nếu MAPE cao thì mô hình có bị xem là kém không?

**Trả lời:** Không nên đánh giá chỉ bằng MAPE. Với phụ tải hộ gia đình, có nhiều thời điểm công suất rất thấp. Khi mẫu số gần 0, MAPE bị phóng đại dù sai số tuyệt đối không quá lớn.

Nên ưu tiên:

1. `MAE`: dễ hiểu vì cùng đơn vị `kW`.
2. `RMSE`: phạt mạnh lỗi ở đỉnh tải.
3. `MAPE`: chỉ dùng tham khảo và phải giải thích giới hạn.

---

### Câu hỏi 12: Khi chưa có dữ liệu người dùng thật, tại sao không dùng thẳng Gemini/GPT thay Forecast API train từ UCI?

**Trả lời:** Gemini/GPT và Forecast API có vai trò khác nhau.

LLM như Gemini/GPT phù hợp để:

1. Giải thích dữ liệu cho người dùng.
2. Trả lời câu hỏi bằng tiếng Việt.
3. Gợi ý tiết kiệm điện.
4. Nhắc người dùng rằng dữ liệu chưa đủ để kết luận chắc chắn.

Forecast API train từ UCI/dữ liệu mẫu phù hợp để:

1. Chứng minh pipeline dự báo hoạt động.
2. Kiểm thử API, biểu đồ và luồng tích hợp app.
3. Có metric định lượng như MAE/RMSE.

LLM không nên tự bịa số `kW/kWh`. Khi có dữ liệu thật từ PLC/MFM384 trong nhiều ngày hoặc nhiều tuần, hệ thống mới retrain mô hình theo từng nhà để cá nhân hóa dự báo.

---

### Câu hỏi 12b: Việc nhập công suất định mức từng thiết bị để quản lý có thực tế không, khi trong thực tế thiết bị hao mòn và không phải lúc nào cũng chạy hết công suất?

**Trả lời:** Nhận xét này hoàn toàn chính xác dưới góc độ kỹ thuật vận hành. Việc nhập công suất định mức chỉ là một giả định đơn giản hóa (simplifying assumption) cho giai đoạn xây dựng prototype và có các đặc điểm sau:

1. **Ý nghĩa của công suất định mức:** 
   - Giúp hệ thống có một mốc tham chiếu (baseline/ceiling) để biết ngưỡng tiêu thụ tối đa lý thuyết của thiết bị.
   - Phù hợp cho đồ án/prototype khi không thể lắp cảm biến đo dòng điện (CT) cho từng ổ cắm/thiết bị riêng lẻ vì hạn chế chi phí và độ phức tạp phần cứng.
2. **Giải pháp thực tế của hệ thống:**
   - Hệ thống được thiết kế để nhận số đo tổng nhà từ **MFM384 qua PLC**. Hiện chưa có bộ log chuẩn đủ để tuyên bố độ chính xác ngoài hiện trường; sai số phải được xác định từ cấp chính xác của đồng hồ, biến dòng và quá trình hiệu chuẩn, không được nói “chính xác 100%”.
3. **Hướng phát triển nâng cao (đề xuất khi bảo vệ):**
   - **Tích hợp Smart Plug (Ổ cắm thông minh):** Đo trực tiếp công suất thực tế của các tải lớn (như tủ lạnh, điều hòa) và gửi dữ liệu thời gian thực về API thay vì nhập tay.
   - **Ứng dụng thuật toán NILM (Non-Intrusive Load Monitoring):** Sử dụng AI phân tích dữ liệu dòng điện tổng đo từ MFM384 để nhận diện và tách biệt lượng điện tiêu thụ của từng thiết bị mà không cần lắp thêm cảm biến ở từng ổ cắm.

---

### Câu hỏi 12c: Dữ liệu huấn luyện mô hình AI từ tập dữ liệu UCI có thật sự mang tính thuyết phục về mặt nghiên cứu không?

**Trả lời:** UCI tạo cơ sở benchmark có thể tái lập, nhưng mức thuyết phục còn phụ thuộc cách chia thời gian, baseline và giới hạn kết luận. Cần tách hai loại bằng chứng:

1. **Vai trò của UCI:** UCI Individual Household Electric Power Consumption là tập dữ liệu công khai dài hạn. Giao thức TNU hiện tại dùng cửa sổ 730 ngày, dự báo 24 giờ, ba fold theo thời gian và ba seed cho RF/XGBoost; các nhãn tương lai ở tập trước phải kết thúc trước mốc bắt đầu tập sau. Không lấy quy mô hoặc điểm số của lượt benchmark cũ để mô tả lượt hiện tại. UCI không chứng minh mô hình phù hợp với hộ gia đình tại Cần Thơ.
2. **Phương pháp kết hợp 2 trụ cột (Dual-Approach) cho luận văn:**
   - **Trụ cột 1 (Dự báo):** Đánh giá MAE, RMSE, MAPE và R² từ đúng file kết quả hoàn tất, kèm baseline và ablation; không gán sẵn một mức R² hoặc “độ chính xác”.
   - **Trụ cột 2 (Tích hợp):** Nhật ký LAN/4G chứng minh độ trễ phản hồi API ở các lượt đo đã lưu. Bằng chứng đó không tự chứng minh độ trễ tiếp điểm, độ chính xác đồng hồ hoặc độ tin cậy cảnh báo.

---

### Câu hỏi 12d: Sinh viên không thể cắm máy tính chạy liên tục 24/7 để thu thập dữ liệu thì việc kiểm thử thực nghiệm được giải quyết ra sao?

**Trả lời:** Trong kỹ thuật IoT và tự động hóa, việc này được giải quyết hợp lý bằng 2 luận điểm:

1. **Thu thập dữ liệu theo ca thực nghiệm tập trung (session-based testing):** Có thể chạy các ca 2–4 giờ tại phòng lab, nhưng chỉ báo cáo số điểm thực thu được từ raw log. Hiện chưa có bằng chứng chuẩn cho con số 30.000 điểm, nên không sử dụng con số đó khi phản biện.
2. **Kiến trúc triển khai:** Trong prototype, backend chạy trên laptop. Kiến trúc production đề xuất chuyển sang edge gateway chạy liên tục trong LAN của PLC; đây là hướng triển khai, chưa phải kết quả đã xác nhận.

---

### Câu hỏi 12e: Các kịch bản tải thật (Real-world Load Scenarios) được thiết lập như thế nào để chứng minh hệ thống hoạt động đúng trong thực tế?

**Trả lời:** Ba kịch bản sau là **kế hoạch thực nghiệm**, chưa được gọi là kết quả hoàn thành nếu chưa có raw log, ảnh bố trí tải, thông số thiết bị đo và đủ số lần lặp:

1. **SC-01 (tải nền):** Dùng tải nhỏ đã đo độc lập để kiểm tra khả năng nhận biết công suất nền.
2. **SC-02 (thay đổi tải):** Đóng/cắt từng tải đã biết để so sánh biến thiên tại MFM384, PLC, API và app.
3. **SC-03 (tải cao/cảnh báo quota):** Dùng tải an toàn trong giới hạn tủ điện để kiểm tra cảnh báo giao diện; không dùng kịch bản này để tự động cắt tải.

Mỗi điều kiện nên có ít nhất 30 lần lặp đối với latency, đồng bộ thời gian và lưu log thô để tính median, p95, tỷ lệ thành công và timeout.

---

### Câu hỏi 12f: Nếu nhiều ngôi nhà khác nhau nhưng chương trình lập trình TIA Portal trên PLC của các nhà đều giống hệt nhau thì hệ thống làm sao phân biệt được để điều khiển đúng nhà?

**Trả lời:** Đây chính là ưu điểm của **Mô hình Mô-đun hóa / Template chuẩn (Standardized Template Design)** trong kỹ thuật IoT công nghiệp:

1. **Chuẩn hóa lập trình (PLC Template):** Kỹ sư chỉ cần lập trình 1 file TIA Portal chuẩn (như `DB7.DBX0.0` luôn là Đèn 1, `DB7.DBX0.2` luôn là Đèn 2) và nạp cho tất cả PLC ở mọi ngôi nhà. Việc này giúp tiết kiệm thời gian thi công và dễ dàng bảo trì hệ thống.
2. **Phân biệt bằng IP và Home ID ở Backend:** Flask Backend quản lý mỗi ngôi nhà theo một `home_id` và lưu địa chỉ IP/VPN tương ứng của PLC nhà đó. Khi người dùng Nhà A bấm nút, Backend tra cứu IP của Nhà A (ví dụ `192.168.1.50`) và mở kết nối Snap7 tới đúng PLC đó để ghi tag. Do đó, dù địa chỉ tag `DB7.DBX0.0` giống nhau, lệnh chỉ được gửi đến đúng PLC của ngôi nhà tương ứng.
3. **Trường hợp demo phòng lab (1 PLC cho 2 nhà):** Nếu demo trên 1 PLC chung trong lab, hệ thống sẽ phân vùng nhớ theo Byte/Data Block (Nhà 1 dùng `DB7.DBX0.x`, Nhà 2 dùng `DB7.DBX1.x` hoặc `DB8`).

---

## 4. Database, bảo mật và vận hành

### Câu hỏi 13: Vì sao dùng SQLite, liệu có đủ cho nhiều nhà không?

**Trả lời:** SQLite phù hợp cho prototype vì nhẹ, dễ chạy local và không cần cài database server. Dữ liệu đã được tách theo `home_id`, nên mô hình multi-home vẫn rõ.

Khi triển khai thật với nhiều hộ gia đình, có thể chuyển sang PostgreSQL/MySQL mà không thay đổi kiến trúc chính. SQLite là lựa chọn cho demo/SIL, còn PostgreSQL phù hợp production.

---

### Câu hỏi 14: Nếu tắt server hoặc mất Internet thì dữ liệu và điều khiển ra sao?

**Trả lời:** Cần tách rõ:

1. Tắt server: dữ liệu trong SQLite và file trạng thái không mất, vì đã lưu trên ổ cứng.
2. Mất Internet nhưng còn LAN: app có thể gọi API nội bộ nếu cấu hình local IP.
3. Mất Internet khi ở ngoài nhà: không điều khiển từ xa được.
4. Mất backend nhưng PLC còn chạy: nút vật lý và logic PLC vẫn hoạt động tại chỗ.

App có thể hiển thị cache gần nhất, nhưng cache không được xem là trạng thái thời gian thực.

---

### Câu hỏi 15: Hạn mức điện năng hiện tại có tự cắt tải không?

**Trả lời:** Phiên bản hiện tại tập trung vào giám sát và cảnh báo quota. Chủ hộ đặt hạn mức kWh, backend tính mức đã dùng từ lịch sử điện năng, app hiển thị tỷ lệ và cảnh báo.

Tự động cắt tải là hướng phát triển tiếp theo. Nếu làm thật, cần có:

1. Phân loại tải quan trọng và tải có thể cắt.
2. Luật ưu tiên an toàn.
3. Feedback từ relay/contactor về PLC.
4. Cơ chế xác nhận của người dùng trước khi cắt tải nhạy cảm.

---

### Câu hỏi 15a: Vì sao thiết kế ba tầng tải chưa được triển khai?

**Trả lời:** Ba tầng hiện chỉ là thiết kế đề xuất, vì đường cắt tải tự động chưa
đạt cổng an toàn. Quy tắc dự kiến là: **Tầng 1 được bảo vệ khỏi thuật toán sa
thải; Tầng 2 chỉ được xét khi quá tải kéo dài; Tầng 3 là nhóm được xét đầu tiên**.
Danh sách tải, ngưỡng và quyền chỉnh sửa phải được duyệt theo từng tủ điện.

Mã hiện tại giữ `AUTO_LOAD_SHEDDING_KW_SAFETY_READY=False`; chưa có schema/UI
`priority_tier` hay ánh xạ PLC dành riêng cho ba tầng. Vòng lặp quota kWh cũ
không được dùng để bật sa thải. Khi có thiết kế được duyệt, trình tự an toàn
đề xuất là: đọc kW/A tức thời từ telemetry mới; chỉ khi quá tải kéo dài mới xét
Tầng 3; đọc feedback và đo lại; dừng khi công suất về vùng cho phép; chỉ sau
đó, nếu chính sách cho phép và quá tải vẫn kéo dài, mới xét Tầng 2. Cần có
hysteresis, cooldown và quy tắc phục hồi rõ ràng. Telemetry cũ hoặc mất feedback
phải dừng việc phát lệnh mới; khôi phục tải phải theo chính sách được duyệt.

---

### Câu hỏi 15b: Hạn mức kWh khác ngưỡng kW/A như thế nào?

**Trả lời:** `kWh` là điện năng tích lũy theo thời gian, phù hợp cho quota,
chi phí và cảnh báo mức đã dùng. `kW` là công suất tức thời, còn `A` là dòng
điện tức thời, phù hợp để đánh giá tải và bảo vệ theo thiết kế điện. Vì vậy
quota kWh hiện chỉ tạo thông tin/cảnh báo; không dùng nó làm tín hiệu cắt tải
khẩn cấp. Ngưỡng kW/A và thiết bị bảo vệ hiện trường phải được thiết kế, hiệu
chuẩn và thử riêng; mô hình dự báo cũng không tự thay thế chúng.

## 5. Hướng phát triển thực tế

### Câu hỏi 16: Sau thời điểm hiện tại nên làm gì trước?

**Trả lời:** Thứ tự hợp lý:

1. Hoàn thiện tủ điện demo an toàn.
2. Xác nhận PLC đọc đúng `V`, `I`, `kW`, `kWh` từ MFM384.
3. Xác nhận backend đọc đúng tag PLC qua Snap7.
4. So sánh số liệu giữa TIA Portal, API `/api/power/current` và App Dashboard.
5. Thu dữ liệu thật vài ngày đến vài tuần.
6. Sau đó mới retrain forecast theo dữ liệu của nhà thật.

Không nên phát triển thêm quá nhiều giao diện hoặc AI Assistant trước khi dữ liệu PLC thật ổn định, vì dễ làm phần mềm đẹp nhưng sai giả định kỹ thuật.

---

### Câu hỏi 17: Vì sao tách chatbot khỏi đường điều khiển, và provider nào được dùng?

**Trả lời:** Trong giai đoạn demo, hệ thống ưu tiên tách đường điều khiển
thiết bị khỏi dịch vụ tư vấn. Backend có thể cấu hình provider `mock`, `gemini`,
`openai` hoặc `local_lora`; provider thực tế phụ thuộc file cấu hình và biến môi
trường tại máy chạy. Không mặc định hoặc khẳng định Gemini đang hoạt động, và
provider/network chưa phải bằng chứng chất lượng AI hay độ trễ vận hành.

Kho mã hiện có dữ liệu và kịch bản phục vụ hướng fine-tune LoRA/Unsloth, nhưng chưa có bộ bằng chứng chuẩn gồm artifact mô hình, log huấn luyện, cấu hình phần cứng, thời gian suy luận và kết quả đánh giá có thể tái lập. Vì vậy khi phản biện **không tuyên bố LoRA đã huấn luyện thành công hoặc đạt 98,6%** nếu chưa xuất trình đủ các bằng chứng này.

Kiến trúc hiện tại tách rõ hai nhóm tác vụ:

```text
Lệnh điều khiển thiết bị -> rule/backend trực tiếp -> kiểm tra quyền/quota -> PLC
Câu hỏi tư vấn/giải thích -> assistant provider cấu hình được -> mock/LLM/local_lora
```

Nhờ vậy lệnh bật/tắt thiết bị không phụ thuộc vào LLM. Nếu AI chậm, lỗi mạng hoặc hết quota API, phần điều khiển PLC vẫn hoạt động theo rule backend. Đây là điểm quan trọng để đảm bảo an toàn và độ tin cậy khi demo với phần cứng thật.

Hướng phát triển sau này:

1. Chọn provider có cấu hình và mạng phù hợp khi cần bản demo; không gọi đó là mặc định của dự án.
2. Dùng `mock` cho kiểm thử hợp đồng phần mềm, không xem là bằng chứng chất lượng AI.
3. Chỉ công bố `local_lora` sau khi có artifact và báo cáo đánh giá tái lập.
4. Backend chỉ đổi `assistant.provider`; ứng dụng không cần thay đổi luồng điều khiển thiết bị.

Kết luận: provider hỏi đáp là cấu hình độc lập với đường điều khiển an toàn;
LoRA/Unsloth hiện là hướng nghiên cứu. Không suy ra provider nào đã được triển
khai production từ việc mã có hỗ trợ lựa chọn đó.

### Câu hỏi 17a: Nếu câu hỏi trong chat mơ hồ thì hệ thống có tự gửi lệnh không?

**Trả lời:** Không. Chỉ intent điều khiển có thiết bị và trạng thái rõ ràng,
được kiểm tra quyền và phạm vi nhà mới đi vào đường lệnh. Câu hỏi trạng thái,
giải thích hoặc câu mơ hồ được trả lời theo rule/provider hoặc yêu cầu người
dùng nói rõ hơn; không được coi là lệnh PLC. Provider ngôn ngữ không có quyền
ghi trực tiếp xuống PLC, và phản hồi chat không phải bằng chứng thiết bị đã đổi
trạng thái.

---

### Câu hỏi 18: Sau khi thêm Supabase/PostgreSQL thì SQLite còn vai trò gì, và dữ liệu nhiều nhà được tách như thế nào?

**Trả lời:** Hệ thống hỗ trợ hai chế độ lưu trữ:

```text
Không có DATABASE_URL -> dùng SQLite cục bộ
Có DATABASE_URL       -> dùng PostgreSQL/Supabase
```

SQLite phù hợp cho phát triển và demo cục bộ. PostgreSQL/Supabase phù hợp hơn khi cần lưu trữ tập trung và nhiều hộ. Việc có mã hỗ trợ hai chế độ không đồng nghĩa bản cloud đã được chứng nhận cho production.

Dữ liệu nhiều nhà được tách theo `home_id`:

1. `homes` lưu từng nhà với mã riêng.
2. `home_members` gắn `user_id`, `home_id` và vai trò trong nhà.
3. `power_readings` và `audit_logs` luôn gắn với `home_id`.
4. Backend kiểm tra tư cách thành viên trước khi đọc dữ liệu hoặc gửi lệnh.

Luồng truy cập đúng là:

```text
Mobile App/Admin Site -> Flask Backend -> SQLite hoặc PostgreSQL/Supabase
```

Ứng dụng không ghi trực tiếp vào database hoặc PLC. Flask Backend chịu trách nhiệm xác thực phiên, kiểm tra quyền theo nhà, ghi nhật ký và điều phối I/O PLC.

---

### Câu hỏi 19: Backend còn chạy trên laptop thì có thực tế không?

**Trả lời:** Laptop phù hợp cho prototype, debug và kiểm thử trong phòng lab, nhưng không phải kiến trúc production cuối cùng. Nếu laptop tắt thì dịch vụ API và đường điều khiển từ xa không hoạt động, dù database bên ngoài có thể vẫn lưu dữ liệu.

```text
Prototype: Flask Backend chạy trên máy phát triển
Triển khai sau này: Flask Backend chạy trên edge gateway trong LAN của PLC
```

Khi triển khai thực tế, backend có thể chuyển sang mini PC, Raspberry Pi hoặc industrial PC đặt cùng mạng với PLC/MFM384. Đây là kiến trúc đề xuất, chưa phải kết quả triển khai đã được đo kiểm.

```text
Mobile App/Admin Site
        -> Edge Gateway chạy Flask Backend
             -> PLC/MFM384 trong mạng nội bộ
             -> PostgreSQL/Supabase (tùy cấu hình)
```

PLC không nên được mở trực tiếp ra Internet. Edge gateway giữ đường PLC trong LAN; truy cập từ xa cần VPN/tunnel và chính sách bảo mật được cấu hình riêng.

Câu trả lời ngắn khi phản biện:

> Trong prototype, backend chạy trên laptop để phát triển và kiểm thử. Kiến trúc production đề xuất chuyển backend sang edge gateway đặt cùng LAN với PLC; phương án này vẫn cần được triển khai và đo kiểm thực tế.

---

### Câu hỏi 20: Hệ thống quản lý thiết bị từng nhà như thế nào khi chưa đo riêng từng tải?

**Trả lời:** Ở mức hiện tại, owner/admin khai báo phòng, thiết bị, loại thiết bị và công suất định mức. Dữ liệu công suất đo thực tế là số đo tổng nhà từ PLC/MFM384; không được trình bày công suất định mức như số đo thời gian thực của từng thiết bị.

Cấu trúc dữ liệu:

```text
homes
  -> rooms
       -> devices
  -> power_readings
```

Trong đó, `rooms` và `devices` thuộc một `home_id`; `device_events` lưu lịch sử thao tác; `power_readings` lưu dữ liệu đo tổng nhà. Cần nói rõ khi phản biện:

```text
Công suất của từng thiết bị hiện là công suất định mức do người dùng nhập,
không phải giá trị đo riêng từng tải theo thời gian thực.
```

Muốn đánh giá từng tải thật, cần gắn kênh đo hoặc tag PLC riêng và hiệu chuẩn thiết bị đo.

---

## 6. Những phần mềm đã hoàn thiện thêm và cách chứng minh phản hồi ứng dụng

### Câu hỏi 21: Sau bản thảo ngày 12/7, phần mềm đã hoàn thiện thêm những gì?

**Trả lời:** Có thể trình bày các phần đã có trong mã và kết quả xác minh ngày
10/09/2026. Backend/control suite đạt **42/42**, frontend contract đạt
**22/22**, web dashboard đạt **21/21**, forecast contracts đạt **7 Python + 2
Node**, research HEAD đạt **7**, admin audit đạt **5** và room presentation đạt
**3**; `npm run lint` và Python compilation cũng đạt. Đây là kiểm thử mã nguồn;
QA trên thiết bị thật vẫn chờ vì không có thiết bị `adb` hoặc AVD khả dụng.

1. Token người dùng được lưu bằng SecureStore; đăng xuất phía server có thu hồi phiên; API người dùng chỉ nhận Bearer token.
2. Phân quyền theo `home_id`, tách credential thu thập telemetry và giới hạn đăng nhập.
3. I/O PLC được tuần tự hóa; trạng thái thiết bị lấy từ đường feedback độc lập; scene trả kết quả theo từng thiết bị và xử lý lỗi một phần.
4. Collector có backoff; dữ liệu mock không được ghi như dữ liệu thật trong chế độ tự động.
5. Forecast API kiểm tra checksum/kích thước artifact, giới hạn request, từ chối timestamp sai và trả `501` cho retrain chưa triển khai.
6. App có trạng thái chờ/thành công/lỗi rõ hơn, nhãn trợ năng, lỗi đăng nhập tại chỗ, ẩn/hiện mật khẩu và đường xử lý bàn phím đã được bao phủ trong frontend contract hiện tại.

Đây là bằng chứng phần mềm; không dùng nó để thay thế số đo PLC/MFM384 hoặc latency phần cứng.

Mốc **16/20** và bốn regression thuộc lượt kiểm tra ngày 16/07/2026, chỉ giữ
ở phần lịch sử của `PROJECT_STATUS_CURRENT.md`; không dùng thay cho kết quả
22/22 hiện tại. Báo cáo 09/09 và follow-up 10/09 đều không ghi nhận cài APK hay
triển khai server. Bản ghi 09/09 giữ Android JavaScript export **1509 modules**;
đó là bằng chứng lịch sử, không phải QA native.

---

### Câu hỏi 22: Có cần đưa khả năng xử lý phản hồi của ứng dụng vào luận văn và bài báo không?

**Trả lời:** Có, đặc biệt trong luận văn, vì phản hồi khép kín là điểm nối giữa app, backend và PLC. Không nên chỉ chèn ảnh màn hình đẹp. Nên đưa một chuỗi bằng chứng:

```text
Người dùng thao tác
  -> app hiển thị trạng thái đang xử lý
  -> backend xác thực và kiểm tra quyền
  -> hàng đợi ghi lệnh PLC
  -> đọc feedback trạng thái độc lập
  -> app hiển thị thành công, lỗi hoặc timeout
```

Luận văn nên có sơ đồ tuần tự, ảnh ghép 4 trạng thái `loading/success/error/timeout` và bảng test case. Bài báo chỉ nên dành chỗ cho phần này nếu phản hồi end-to-end là một đóng góp chính; khi đó phải kèm phân bố latency đo trên phần cứng thật, không chỉ ảnh giao diện.

---

### Câu hỏi 23: Có thể nói APK hiện tại đã sẵn sàng phát hành không?

**Trả lời:** Không nên nói APK đã được xác minh trong lượt 10/09. Bằng chứng
hiện có là các contract, lint và Python compilation; `adb` không có thiết bị và
không có AVD khả dụng, nên QA native còn chờ. Bản ghi 09/09 có Android
JavaScript bundle export **1509 modules**, nhưng đó không phải APK QA. Chưa ghi
nhận cài APK hoặc triển khai server. Release signing, kiểm thử thiết bị mục tiêu
và cấu hình HTTPS/domain production vẫn là các cổng riêng.

---

## 7. Chuyên ngành Điện và bảo mật hệ thống (OT Security)

### Câu hỏi 24: Đồ án có bị thiên quá nhiều về Công nghệ thông tin không?

**Trả lời:** Đây là đề tài liên ngành. Thành phần Điện/Tự động hóa nằm ở MFM384, Modbus RTU/RS485, S7-1200, ánh xạ tag, relay/contactor, feedback vật lý và thiết kế ca thử tải. Phần mềm cung cấp giám sát, phân quyền, lưu vết và dự báo. Không nên nói trọng tâm “100% là điện” khi bằng chứng phần cứng còn thiếu; thay vào đó, cần chứng minh hai miền được tích hợp và phân định đúng trách nhiệm an toàn.

---

### Câu hỏi 25: Vì sao phân quyền và audit log quan trọng?

**Trả lời:** Lệnh điều khiển phải đi qua backend để xác thực phiên, kiểm tra quyền theo nhà và ghi nhật ký. Điều này giảm nguy cơ truy cập chéo nhà và giúp truy vết thao tác. Tuy nhiên RBAC phần mềm **không thay thế** khóa liên động, aptomat, E-stop hoặc quy trình lockout/tagout vật lý; dự án chưa tuyên bố đã triển khai khóa bảo trì đạt chuẩn.

---

### Câu hỏi 26: Hệ thống đã có cơ chế cảnh báo tự động ra bên ngoài chưa (Zalo / Telegram / Notification)?

**Trả lời:** Backend có logic kiểm tra hạn mức và các provider/kênh gửi tin có
thể cấu hình. Bài TNU chỉ trình bày minh họa Telegram ở ngưỡng 80% và 100% của
hạn mức thử nghiệm 0,10 kWh. Cảnh báo dựa trên điện năng tích lũy, không phải
dự báo AI; không kích hoạt sa thải phụ tải trong phạm vi đã kiểm chứng. Zalo,
SMS và push chưa có bằng chứng delivery được đo và không được giới thiệu như
chức năng đã phát hành.

Ảnh minh họa và mã tích hợp không đủ chứng minh gửi tin tức thời, tỷ lệ thành công 100% hoặc toàn bộ chức năng Zalo. Các endpoint/thử nghiệm xác thực kênh không thay thế phép đo delivery. Muốn báo cáo độ tin cậy cần đo lặp có timestamp, định nghĩa thời điểm bắt đầu/kết thúc, số lần thất bại và thời gian chống gửi lặp. Đợt thí nghiệm UCI này không thực hiện phép đo cảnh báo.

---

### Câu hỏi 27: Khi vượt ngưỡng quá tải thì có kích hoạt Dừng khẩn cấp (Emergency Stop) không, hay chỉ thông báo?

**Trả lời:** Cần phân biệt rõ giữa 2 khái niệm kỹ thuật điện:

1. **Vượt Hạn Mức Điện Năng Tháng (Over-Quota):**
   * Xử lý theo thiết kế minh họa: **CHỈ THÔNG BÁO qua các kênh được cấu hình (App + Telegram) và ĐỀ XUẤT cắt giảm/dịch chuyển tải (Human-in-the-loop).** Delivery Telegram chưa được đo và không được trình bày như đã bảo đảm.
   * Lý do: Hạn mức tiền điện là bài toán chi phí. Tự ý ngắt điện sinh hoạt cưỡng bức có thể gây mất an toàn (tắt tủ lạnh, tắt máy thở, tắt đèn ban đêm); mọi thao tác cắt tải phải theo chính sách và liên động đã duyệt.

2. **Quá Tải Dòng Điện / Chập Cháy Nguy Hiểm ($I > I_{\text{đm}}$ hoặc $P > P_{\text{max}}$):**
   * Xử lý: Phải có thiết kế bảo vệ điện phù hợp bằng thiết bị bảo vệ và liên động tại hiện trường; không dựa vào cảnh báo cloud hoặc AI. Không gán thời gian tác động dưới 50 ms cho tủ điện khi chưa có thông số thiết bị, thiết kế phối hợp bảo vệ và phép đo tương ứng. PLC thông thường hoặc nút E-stop không tự thay thế thiết bị bảo vệ quá dòng.

---

### Câu hỏi 28: Tại sao dùng bộ dữ liệu UCI của Pháp để huấn luyện AI? Có phù hợp với Việt Nam không?

**Trả lời:**
1. **Lý do dùng UCI thay vì đo ngắn ngày tại phòng lab:** Dữ liệu dài hạn cho phép đánh giá nhiều chu kỳ và thời đoạn khác nhau. Vài giờ demo không đủ để đánh giá dự báo 24 giờ một cách đáng tin cậy; không có một yêu cầu phổ quát rằng mọi mô hình đều bắt buộc cần đúng 6 tháng đến 2 năm.
2. **Xuất xứ & Quy mô:** Bộ dữ liệu UCI (*Individual Household Electric Power Consumption*) đo liên tục suốt gần 4 năm (hơn 2.075.000 bản ghi) tại ngoại ô Paris, Pháp.
3. **Tính phù hợp với Việt Nam:**
   * Không suy ra tính chuyển giao từ điện áp hoặc giả định giờ sinh hoạt giống nhau. Khí hậu, thiết bị, hành vi và số hộ đều có thể khác.
   * Benchmark công khai giúp kiểm tra phương pháp và so sánh trong cùng dữ liệu/giao thức, không tự tạo ra so sánh công bằng với mọi công trình khác.
   * Cần thu dữ liệu địa phương đủ dài và đánh giá ngoài mẫu trước khi kết luận phù hợp với hộ gia đình Việt Nam.

---

### Câu hỏi 29: Kết quả thực nghiệm phần cứng thực tế đo đạc được là bao nhiêu?

**Trả lời:** Hồ sơ TNU nghiên cứu cục bộ dùng độ trễ phản hồi API của hai lượt
đo đã đối soát; đây không phải kết quả của lượt xác minh phần mềm 09/09 hoặc
10/09, cũng không phải độ trễ tiếp điểm phần cứng:
* **Độ trễ truyền thông API:**
  * Mạng nội bộ Wi-Fi (LAN): Trung vị **$1.403,63\text{ ms}$** ($N=49$, P95 = $2.454,55\text{ ms}$).
  * Mạng di động 4G (WAN): Trung vị **$4.382,21\text{ ms}$** ($N=49$, P95 = $5.959,67\text{ ms}$).

Mỗi điều kiện có 50 phép thử, 49 phản hồi hợp lệ. LAN loại một mẫu mock-fallback; 4G loại một timeout. Lượt 4G trước đó có 50 lỗi HTTP 403 do cấu hình xác thực, vẫn giữ log nhưng không đưa vào thống kê độ trễ. Tỷ lệ 49/50 chỉ thuộc từng lượt được phân tích, không đại diện cả ba lượt.

Không sử dụng các con số tiếp điểm/điện lưới từng ghi trong bản cẩm nang cũ nếu chưa đối soát được nguồn đo, tiêu chí và chuỗi timestamp. Ảnh giao diện có nhãn 332/333 ms cũng không thay thế phân bố độ trễ tiếp điểm vật lý.

---

### Câu hỏi 30: Khi nhấn nút vật lý ngoài tủ điện thì trên App có cập nhật không?

**Trả lời:** Mã có đường cập nhật trạng thái từ PLC về app, nhưng lượt xác minh
09/09 và 10/09 không chạy thiết bị thật. Chỉ gọi là hoạt động sau khi có cấu hình và ca
thử đã quan sát; không tuyên bố đồng bộ 100% hoặc tức thời trong mọi điều kiện.
1. Khi nhấn nút cơ ngoài tủ, tín hiệu vào ngõ vào DI của PLC, PLC đảo bit trạng thái ngõ ra DO / Data Block (`DB1`).
2. Server Python liên tục đọc dữ liệu thật từ PLC qua thư viện Snap7.
3. Ứng dụng có cơ chế polling và kéo làm mới. Thời điểm hiển thị còn phụ thuộc chu kỳ đọc, mạng và trạng thái backend; công suất định mức từng thiết bị không phải số đo riêng từng tải. Muốn khẳng định độ trễ đồng bộ cần đo riêng toàn chuỗi nút vật lý–tiếp điểm–PLC–API–app.

---

## 8. Hỏi đáp về đợt bổ sung thực nghiệm TNU-JST

### Câu hỏi 31: Baseline OLS bổ sung để làm gì?

**Trả lời:** OLS là hồi quy tuyến tính bình phương tối thiểu, làm mốc so sánh đơn giản có học từ dữ liệu. Nó được đánh giá trên cùng dữ liệu, mốc train/validation/test và chân trời 24 giờ như RF/XGBoost. Nếu OLS tốt hơn hoặc xấp xỉ, phải báo cáo như vậy; mô hình phức tạp không mặc nhiên tốt hơn. Không chọn lại cấu hình theo điểm test để giữ lợi thế cho RF/XGBoost.

### Câu hỏi 32: Ablation có phải chứng minh đặc trưng nào cũng hữu ích không?

**Trả lời:** Không. Ablation giữ nguyên giao thức, lần lượt bỏ nhóm đặc trưng theo thiết kế đã ghi trong cấu hình, rồi huấn luyện lại và so sánh. Bỏ một nhóm mà sai số giảm là kết quả cần báo cáo, không phải lý do loại lượt chạy. Tác dụng phụ thuộc mô hình, nhóm còn lại và thời đoạn; đây không phải bằng chứng quan hệ nhân quả. Ablation theo nhóm cũng không đồng nghĩa đã có SHAP hoặc bảng xếp hạng tầm quan trọng từng đặc trưng.

### Câu hỏi 33: Tại sao dùng HAC và hiệu chỉnh Holm thay vì kiểm định 9 điểm MAE?

**Trả lời:** Các seed dùng chung thời đoạn test, còn sai số chuỗi thời gian có thể tự tương quan; chín điểm MAE không phải chín mẫu độc lập. Phân tích dùng chênh lệch loss ghép cặp tại cùng thời điểm dự báo, xử lý seed theo giao thức và ước lượng sai số chuẩn HAC (Newey–West). Holm điều chỉnh cho nhóm so sánh đã xác định. Phải nêu loss, độ trễ HAC, cách ghép fold/seed và phân tích độ nhạy, không chọn độ trễ sau khi nhìn p để có kết quả đẹp.

Đây là phân tích **thăm dò trên dữ liệu đã từng được xem xét**, không phải kiểm định xác nhận trên tập ngoài mẫu mới. `p < 0,05` không chứng minh mô hình tốt hơn ở mọi nhà; `p >= 0,05` không chứng minh tương đương. Nếu máy làm tròn p thành 0, không nói xác suất sai bằng 0 hoặc chắc chắn 100%; cần báo ngưỡng phù hợp, độ lớn chênh lệch và khoảng tin cậy kèm giới hạn phương pháp.

### Câu hỏi 34: Bằng chứng lưu ở đâu và có tác động phần cứng không?

**Trả lời:** Kết quả mở rộng đã hoàn tất trong `research/results/forecast_extension_20260904/`: `metrics.json` tổng hợp, 168 tệp `predictions/*.npz` lưu đầu ra số theo lượt chạy và `prediction_manifest.json` đối chiếu các tệp. `research/verify_forecast_extension.py` tính lại chỉ tiêu và 12 kết quả HAC từ NPZ; `research/FORECAST_EXTENSION_PROTOCOL.md` mô tả giao thức. NPZ không phải ảnh minh họa hay dữ liệu mô phỏng phần cứng.

Các phép thử chạy offline trên UCI, không gọi PLC/MFM384, không gửi cảnh báo, không đổi mô hình/artifact phục vụ app. Kết quả benchmark không tự động trở thành mô hình triển khai. Muốn cập nhật app cần quy trình triển khai và kiểm thử riêng.

### Câu hỏi 35: Làm xong ba mục này có nghĩa hoàn thành toàn bộ Strategy không?

**Trả lời:** Không. Chúng gia cố đối chứng, đánh giá nhóm đặc trưng và phân tích sai số dự báo. Đo lặp cảnh báo, độ trễ tiếp điểm, đánh giá nhiều hộ, hiệu quả tiết kiệm điện và vòng điều khiển dùng dự báo vẫn là những việc khác. Bài được định vị là prototype tích hợp trong phòng lab; không chấm điểm chắc chắn hoặc bảo đảm tạp chí chấp nhận.
