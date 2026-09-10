# BÁO CÁO MỤC TIÊU NGHIÊN CỨU VÀ TÊN ĐỀ TÀI LUẬN VĂN TỐT NGHIỆP

## Hồ sơ nghiên cứu cục bộ ngày 04/09/2026 — lịch sử, không phải trạng thái phần mềm

**Tên bài báo tiếng Việt đã chốt:** Xây dựng mô hình giám sát, điều khiển từ xa và dự báo phụ tải hộ gia đình tích hợp IoT.

**Tên bài báo tiếng Anh:** An IoT-integrated prototype for residential load monitoring, remote control and forecasting.

Tên luận văn tại Mục 1 được giữ để lưu hồ sơ đề tài, không phải tên bài báo hiện hành. Bài TNU báo cáo mô hình tích hợp ở quy mô phòng thí nghiệm; dự báo là thông tin giám sát, chưa phát lệnh tự động xuống PLC. Cảnh báo quota dùng điện năng tích lũy đã đo, không dùng dự báo.

Các đoạn và số liệu dưới đây giữ nguyên bản ghi nghiên cứu cục bộ về phạm vi
bài TNU ngày 04/09/2026. Lượt đồng bộ app + main docs ngày 09–10/09/2026 không
chạy lại nghiên cứu, không thay mô hình phục vụ ứng dụng và không gửi lệnh
phần cứng. Báo cáo, metrics và bản thảo nghiên cứu ngày 04/09 nằm ngoài phạm
vi push; các liên kết chỉ có giá trị khi tệp còn hiện diện cục bộ. Tài liệu này
không khẳng định remote repository có đủ toàn bộ bằng chứng.

Theo hồ sơ đó, đợt bổ sung baseline OLS, ablation và phân tích thống kê chuỗi
thời gian đã chạy offline ngày 04/09/2026, từ 14:03:21 đến 14:32:14 UTC
(khoảng 28 phút 53 giây tính toán; chưa gồm thời gian viết mã, kiểm thử và sửa
bài). Kết quả được ghi trong `research/results/forecast_extension_20260904/metrics.json`;
168 tệp NPZ, 12 kết quả HAC và 20 test nghiên cứu được ghi là đã đối soát.
Không thay mô hình đang phục vụ ứng dụng, không gửi lệnh phần cứng và không đo
lặp cảnh báo trong đợt này. Tình trạng xuất bản thảo/PDF được quản lý riêng tại
`research/LAYOUT_QA_20260904.md`.

---

## Trạng thái phần mềm hiện hành — 10/09/2026

Backend/control suite đạt **42/42**, frontend contract đạt **22/22**, web
dashboard đạt **21/21**; forecast contracts đạt **7 Python + 2 Node**, research
HEAD đạt **7**, admin audit đạt **5** và room presentation đạt **3**. `npm run
lint` và Python compilation đạt. Một native-artifact check được bỏ qua vì chưa
có thiết bị/AVD. QA trên thiết bị thật còn chờ (`adb` không thấy thiết bị, không
có AVD); chưa ghi nhận cài APK hoặc triển khai server. Sa thải tải tự động vẫn bị
khóa bởi `AUTO_LOAD_SHEDDING_KW_SAFETY_READY=False`. Đây là bằng chứng mã nguồn,
không phải phép đo PLC/MFM384 hoặc nghiệm thu phần cứng.

Bản ghi ngày 09/09/2026 được giữ để truy vết: backend/control **39/39**,
frontend **22/22**, lint và Android JavaScript export **1509 modules**. Lượt
10/09 thay thế số backend; export 1509 là bằng chứng lịch sử. Astra review index
đã sửa chưa có kết luận cuối.

## 📌 1. TÊN ĐỀ TÀI LUẬN VĂN ĐÃ LƯU (KHÔNG PHẢI TÊN BÀI TNU HIỆN HÀNH)

**Tên tiếng Việt:**  
`Nghiên cứu, thiết kế và triển khai hệ thống quản trị năng lượng nhà thông minh (HEMS) tích hợp PLC Siemens S7-1200 và Trí tuệ nhân tạo dự báo phụ tải`

**Tên tiếng Anh (International Title):**  
`Research, Design, and Implementation of a Smart Home Energy Management System (HEMS) Integrating Siemens S7-1200 PLC and AI-based Load Forecasting`

---

## 💡 2. TÍNH CẤP THIẾT CỦA ĐỀ TÀI (BACKGROUND & MOTIVATION)

1. **Nhu cầu quản lý năng lượng hộ gia đình:** Đề tài kết hợp giám sát điện năng, điều khiển từ xa và dự báo trong một prototype HEMS. Khoảng trống cần đánh giá là cách tích hợp các thành phần và phân biệt kết quả dự báo với bằng chứng vận hành, không phải khẳng định mọi hệ thống Smart Home khác chỉ bật/tắt hoặc chưa có dự báo.
2. **Hạ tầng đo lường và điều khiển:** PLC Siemens S7-1200 và đồng hồ MFM384 tạo nền tảng tích hợp giao thức công nghiệp. Việc lựa chọn thiết bị không tự chứng minh độ tin cậy toàn hệ thống, khả năng chống nhiễu vượt trội hoặc an toàn đã được chứng nhận; các khẳng định đó cần phép thử riêng.
3. **Ứng dụng Trí tuệ nhân tạo (AI):** Sự kết hợp giữa hạ tầng điều khiển PLC/IoT và mô hình học máy cho phép nghiên cứu dự báo xu hướng tiêu thụ điện năng 24 giờ tiếp theo. Kết quả dự báo chỉ đóng vai trò tham khảo và hỗ trợ cảnh báo/khuyến nghị; mô hình AI không trực tiếp ra lệnh đóng cắt thiết bị.

---

## 🎯 3. MỤC TIÊU NGHIÊN CỨU (RESEARCH OBJECTIVES)

### 3.1. Mục tiêu tổng quát (General Objective)
Nghiên cứu, thiết kế và hiện thực prototype phần mềm cho một giải pháp HEMS gồm PLC S7-1200/MFM384, Flask Backend, cơ sở dữ liệu, mô hình dự báo phụ tải và ứng dụng React Native/Expo. Phần tích hợp phần cứng, độ trễ end-to-end và dữ liệu đo tại Cần Thơ chỉ được công nhận sau khi hoàn thành ca thử thực nghiệm và lưu bằng chứng thô.

### 3.2. Mục tiêu cụ thể (Specific Objectives)
1. **Nghiên cứu và thiết kế hạ tầng phần cứng công nghiệp:** Hoàn thiện sơ đồ động lực/điều khiển và kế hoạch cấu hình MFM384 truyền thông RS485 Modbus RTU với PLC S7-1200 để thu thập $V$, $I$, $kW$ và $kWh$. Kết quả đo thật phải được xác nhận bằng log thực nghiệm.
2. **Lập trình PLC Siemens S7-1200:** Thiết kế ánh xạ lệnh và feedback trạng thái độc lập, đồng bộ thao tác tại tủ điện với ứng dụng. Các địa chỉ Data Block, độ rộng xung và logic an toàn phải được đối chiếu trực tiếp với TIA Portal trước khi công bố là đã vận hành phần cứng.
3. **Xây dựng Backend và cơ sở dữ liệu:** Flask Backend làm lớp xác thực, phân quyền `system_admin`/`owner`/`member` theo `home_id`, ghi audit log và tuần tự hóa I/O PLC. Hệ thống hỗ trợ SQLite và PostgreSQL/Supabase theo cấu hình; ứng dụng không truy cập trực tiếp database hoặc PLC.
4. **Nghiên cứu dự báo phụ tải:** Đánh giá XGBoost, Random Forest, Persistence, Seasonal Naive 24/168 giờ và baseline tuyến tính OLS trên cùng cửa sổ UCI 730 ngày. Giao thức dự báo 24 giờ dùng ba fold theo thời gian; loại các mẫu có nhãn tương lai vượt ranh giới sang tập kế tiếp. Ba seed RF/XGBoost phản ánh biến thiên do huấn luyện, không được coi là các tập test độc lập. Đợt mở rộng còn đánh giá bỏ nhóm đặc trưng và thống kê loss ghép cặp; không dùng số của benchmark cũ hoặc số giữa chừng. UCI chưa đại diện cho dữ liệu MFM384 tại Cần Thơ.
5. **Xây dựng ứng dụng di động và giao diện quản trị:** Phát triển ứng dụng React Native/Expo để giám sát, quản lý phòng/thiết bị, quota, dự báo và điều khiển qua backend; bổ sung xác thực phiên, nhãn trợ năng, trạng thái chờ/thành công/lỗi và xử lý bàn phím cho đăng nhập/chat.
6. **Thực nghiệm đa kịch bản:** Đã có nhật ký phản hồi API LAN/4G dùng trong bài TNU, mỗi lượt phân tích có 49/50 mẫu hợp lệ. LAN loại một mock-fallback; 4G loại một timeout; lượt 4G trước đó có 50 lỗi xác thực HTTP 403 được giữ log nhưng không dùng tính độ trễ. Các kịch bản SC-01/SC-02/SC-03, đo lặp cảnh báo và độ trễ tiếp điểm chỉ được gọi là hoàn thành khi có bằng chứng riêng, không suy ra từ độ trễ API.

### 3.3. Cách giải thích phần thực nghiệm bổ sung khi phản biện

- **OLS:** Đối chứng tuyến tính đơn giản trên cùng tập và mốc thời gian. Không bảo đảm mô hình phức tạp thắng; không chỉnh tham số theo điểm test.
- **Ablation:** Bỏ nhóm đặc trưng theo cấu hình đã ghi rồi huấn luyện lại; giữ nguyên dữ liệu đánh giá. Kết quả có thể tăng hoặc giảm sai số. Đây là tác dụng theo nhóm trong giao thức cụ thể, không phải quan hệ nhân quả hay độ quan trọng SHAP của từng biến.
- **HAC/Newey–West và Holm:** Phân tích chênh lệch loss ghép cặp theo thời điểm, không kiểm định chín điểm MAE như chín mẫu độc lập. HAC xử lý tự tương quan theo giả định và độ trễ đã khai báo; Holm điều chỉnh nhóm so sánh. Phân tích này mang tính thăm dò vì dữ liệu đã được xem trước, không phải xác nhận trên tập test mới.
- **Cách đọc p:** p nhỏ không bảo đảm hiệu quả ngoài thực tế; p không nhỏ không chứng minh tương đương. Không viết p bằng 0 thành “chắc chắn 100%”. Báo cả độ lớn chênh lệch, khoảng tin cậy và độ nhạy với lựa chọn phương pháp.
- **Truy vết:** Thư mục kết quả mở rộng lưu cấu hình, `prediction_manifest.json` và 168 tệp `predictions/*.npz`; đã đối soát kết quả hoàn tất bằng `research/verify_forecast_extension.py`. Các tệp dự báo được tạo từ UCI, không phải log PLC hay phép đo cảnh báo. Giao thức ghi tại `research/FORECAST_EXTENSION_PROTOCOL.md`.
- **Giới hạn:** Không đổi artifact mô hình app, backend điều khiển hoặc cấu hình phần cứng. Việc triển khai mô hình mới là tác vụ riêng. Hoàn thành các thí nghiệm này không đồng nghĩa hoàn thành toàn bộ Strategy hoặc bảo đảm bài được nhận.

### 3.4. Bản ghi nghiên cứu cục bộ ngày 04/09/2026 (không phải lượt chạy của sync 09–10/09)

Phần dữ liệu 730 ngày có 1.051.201 dòng trước tổng hợp, 17.521 dòng giờ và 15.321 mẫu supervised hợp lệ. Ba fold có lần lượt 8.402/10.125/11.848 mốc train; mỗi fold có 1.699 mốc validation và 1.723 mốc test. Nhãn cuối của tập trước phải nằm trước mốc đầu tập tiếp theo; số được điền thiếu không được dùng làm nhãn mục tiêu.

| Mô hình đầy đủ | MAE (kW) | RMSE (kW) | MAPE (%) | R² |
|---|---:|---:|---:|---:|
| Persistence | 0,694527 | 0,933305 | 99,846 | −0,806809 |
| Seasonal Naive 24 giờ | 0,514873 | 0,756456 | 66,653 | −0,191510 |
| Seasonal Naive 168 giờ | 0,543852 | 0,784249 | 75,072 | −0,285104 |
| OLS | 0,433809 | 0,593665 | 57,648 | 0,258900 |
| RF | 0,421925 | 0,575155 | 58,120 | 0,308413 |
| XGBoost | 0,422275 | 0,572849 | 58,587 | 0,312770 |

Đây là trung bình chỉ tiêu test qua ba fold; RF/XGBoost có ba seed mỗi fold. MAPE dùng sàn mẫu số 0,2 kW. OLS có MAPE thấp hơn RF/XGBoost, nên không kết luận mô hình cây thắng trên mọi chỉ tiêu. Lựa chọn RF trong nhóm đầy đủ dựa vào MAE validation, không dựa vào test.

| Cấu hình ablation | Số đặc trưng | RF MAE/RMSE (kW) | XGBoost MAE/RMSE (kW) |
|---|---:|---:|---:|
| Base: bỏ cả lịch và thống kê cửa sổ | 86 | 0,432339 / 0,586567 | 0,436179 / 0,586499 |
| Base + rolling: bỏ lịch | 129 | 0,436769 / 0,588430 | 0,440688 / 0,589298 |
| Base + calendar: bỏ thống kê cửa sổ | 102 | 0,416899 / 0,573175 | 0,417199 / 0,571785 |
| Đầy đủ | 145 | 0,421925 / 0,575155 | 0,422275 / 0,572849 |

Nhóm lịch gồm 16 biến; nhóm thống kê cửa sổ gồm 43 biến (rolling/EWM/trung bình cùng giờ bảy ngày); nhóm base giữ đo hiện tại, lag và các biến dẫn xuất còn lại. Bỏ lịch làm tăng MAE so với đầy đủ; bỏ thống kê cửa sổ giảm MAE khoảng 0,005025 kW (RF) và 0,005076 kW (XGBoost). Báo cáo cả chiều bất lợi và thuận lợi này; chưa kiểm định riêng ablation và không dùng test để thay cấu hình chính/model app bằng biến thể 102 biến.

Phân tích chính dùng HAC Bartlett tâm hóa từng fold, độ trễ theo giờ thực 168, 5.169 mốc test. Loss là trung bình sai số tuyệt đối 24 chân trời rồi trung bình loss riêng của từng seed; không phải loss từ trung bình dự báo ensemble. Holm điều chỉnh ba so sánh tại mỗi độ trễ; khoảng tin cậy là khoảng 95% riêng lẻ, không phải khoảng đồng thời Holm.

| So sánh (trái trừ phải) | Δ MAE (kW) | Khoảng tin cậy 95% | p Holm |
|---|---:|---|---:|
| XGBoost − RF | +0,000350 | [−0,004784; 0,005485] | 0,893617 |
| RF − OLS | −0,011885 | [−0,017231; −0,006538] | 0,000039589 |
| XGBoost − OLS | −0,011534 | [−0,017696; −0,005373] | 0,000486880 |

Kết quả thăm dò cho thấy loss trung bình RF/XGBoost thấp hơn OLS; chưa có bằng chứng khác biệt RF với XGBoost. Kết luận theo ngưỡng 0,05 giữ nguyên ở kiểm tra độ nhạy 24, 48 và 336 giờ. Không suy ra tương đương, bất định quần thể hộ gia đình, hiệu quả tiết kiệm điện hay vòng điều khiển AI. Các phân tích dùng dữ liệu đã xem trước, chưa phải kiểm định xác nhận độc lập.

---

## 🔍 4. ĐỐI TƯỢNG VÀ PHẠM VI NGHIÊN CỨU (SCOPE & DELIMITATIONS)

- **Đối tượng nghiên cứu:** Các thuật toán học máy dự báo phụ tải điện năng chuỗi thời gian; Giao thức truyền thông công nghiệp (Modbus RTU, Siemens S7 Protocol TCP/IP); Mô hình kiến trúc phần mềm HEMS.
- **Phạm vi phần cứng thực nghiệm:** PLC Siemens CPU 1215C DC/DC/DC, Đồng hồ đo điện MFM384, Tủ điện mô hình 3 phòng (Phòng khách, Phòng bếp, Phòng ngủ).
- **Phạm vi phần mềm:** Mobile App (React Native/Expo), Web Admin quản trị, Flask API Server, Cloud Database Supabase Postgres.

---

## 🌟 5. ĐÓNG GÓP VÀ Ý NGHĨA CỦA ĐỀ TÀI (EXPECTED CONTRIBUTIONS)

- **Ý nghĩa khoa học:** Xây dựng một khung tích hợp và đánh giá có kiểm soát giữa PLC, backend/app và dự báo phụ tải, đồng thời tách rõ bằng chứng benchmark công khai, kiểm thử phần mềm và thực nghiệm phần cứng.
- **Ý nghĩa thực tiễn:** Tạo prototype có thể tiếp tục kiểm thử trong phòng lab. Khả năng thương mại hóa hoặc vận hành tải thật chỉ được xem xét sau khi hoàn tất an toàn điện, thử nghiệm phần cứng, release signing và đánh giá bảo mật/độ tin cậy.

---

## 📚 6. DANH MỤC TÀI LIỆU THAM KHẢO (REFERENCES)

**Lưu ý đối soát:** Danh sách dưới đây là danh sách lưu từ giai đoạn đề xuất luận văn, chưa được xác minh lại toàn bộ trong đợt sửa này và không phải danh mục đã chốt của bài TNU. Không sao chép các mục này vào bài báo hoặc dùng để bảo chứng kết luận nếu chưa kiểm tra sự tồn tại và metadata. Danh mục TNU hiện hành được quản lý trong `apply_evidence_safe_revisions.py` và hai bản thảo xuất từ script đó; hai nguồn thống kê bổ sung là Newey–West (1987) và Holm (1979). Holm dùng địa chỉ JSTOR ổn định, không gán DOI `10.2307/4615733` chưa tồn tại trên hệ thống DOI.

*Tài liệu `Danh_Mục_Tài_Liệu_Tham_Khảo.md` cũng cần đối soát độc lập trước khi dùng; không xem việc được liệt kê là đã xác minh.*

1. **Gomes I, Bot K, Ruano MG, et al.** Recent Techniques Used in Home Energy Management Systems: A Review. *Energies*. 2022;15(8):2866.
2. **Meng C, Wang J, Zhang Y, et al.** Multi-objective optimization strategy for home energy management system including PV and battery energy storage. *Energy Reports*. 2022;8:13638-13651.
3. **Phạm Hồng Thắng, Nguyễn Văn Nam.** Hệ thống quản lý năng lượng trong nhà thông minh. *Tạp chí Khoa học và Công nghệ – Đại học Công nghiệp Hà Nội*. 2023;19(2):45-52.
4. **Han B, Zahraoui Y, Mubin M, et al.** Home Energy Management Systems: A Review of the Concept, Architecture, and Scheduling Strategies. *IEEE Access*. 2023;11:116-135.
5. **Maciel RV.** Integração e monitoramento remoto de controladores BR6000 siemens via protocolo modbus RTU em ambiente CLP com software TIA portal. Luận văn tốt nghiệp. Brasil: Universidade de Santa Cruz do Sul; 2024.
6. **Hassan A, Ali M, Khan S.** Design and Implementation of a PLC-Based SCADA System for Photovoltaic Monitoring and Control Using Siemens S7-1200. *J Eng Technol*. 2025;17(1):112-125.
7. **Trần Văn Hùng, Lê Minh Tuấn.** Ứng dụng PLC Siemens S7-1200 và giao thức Modbus TCP/IP trong hệ thống giám sát năng lượng tòa nhà. *Tạp chí Tự động hóa Ngày nay*. 2022;25(4):78-85.
8. **Hlayel M, Mahdin H, Hayajneh M, et al.** Toward Industry 5.0: A WebSocket–S7 Bridge for Low-Latency, IEC 61588-Compliant Digital Twins in Remote Industrial Automation. *PLOS One*. 2026;21(3):e0342004.
9. **Harikrishnan GR, Singh P.** Advanced short-term load forecasting for residential demand response: An XGBoost-ANN ensemble approach. *Electric Power Systems Research*. 2025;240:111234.
10. **Li Y, Chen X, Wang Z.** Power Load Forecasting Based on the Combined Model of LSTM and XGBoost. *IEEE Access*. 2019;7:114563-114572.
11. **Xu Y, Jiang C, Zheng Z, et al.** LSTM Short-term Residential Load Forecasting Based on Federated Learning. In: *2022 IEEE International Conference on Smart Grid Communications (SmartGridComm)*; 24-27 Oct 2022; Singapore. IEEE; 2022. p. 145-150.
12. **Mortaji H, Ow SH, Moghavvemi M, et al.** Load Shedding and Smart-Direct Load Control Using Internet of Things in Smart Grid Demand Response Management. *IEEE Trans Ind Appl*. 2017;53(5):5155-5163.
13. **Fabiano P, De Rosa M, Milano F, et al.** Demand response algorithms for smart-grid ready residential buildings using machine learning models. *Appl Energy*. 2019;239:1066-1079.
14. **Nguyễn Tấn Đạt, Võ Hoàng Minh.** Ứng dụng mạng LSTM trong dự báo phụ tải điện ngắn hạn cho hệ thống quản lý năng lượng hộ gia đình. *Tạp chí Khoa học Đại học Quốc gia TP.HCM – Lĩnh vực Khoa học Tự nhiên và Công nghệ*. 2023;39(3):210-221.
