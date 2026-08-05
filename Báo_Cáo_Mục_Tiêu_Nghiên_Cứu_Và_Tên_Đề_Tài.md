# BÁO CÁO MỤC TIÊU NGHIÊN CỨU VÀ TÊN ĐỀ TÀI LUẬN VĂN TỐT NGHIỆP

---

## 📌 1. TÊN ĐỀ TÀI CHÍNH THỨC (PROJECT TITLE)

**Tên tiếng Việt:**  
`Nghiên cứu, thiết kế và triển khai hệ thống quản trị năng lượng nhà thông minh (HEMS) tích hợp PLC Siemens S7-1200 và Trí tuệ nhân tạo dự báo phụ tải`

**Tên tiếng Anh (International Title):**  
`Research, Design, and Implementation of a Smart Home Energy Management System (HEMS) Integrating Siemens S7-1200 PLC and AI-based Load Forecasting`

---

## 💡 2. TÍNH CẤP THIẾT CỦA ĐỀ TÀI (BACKGROUND & MOTIVATION)

1. **Thách thức về quản lý năng lượng hộ gia đình:** Trong bối cảnh giá điện gia tăng và xu hướng chuyển dịch năng lượng xanh, việc tối ưu hóa mức tiêu thụ điện trong hộ gia đình (HEMS - Home Energy Management System) trở thành nhu cầu cấp thiết. Các hệ thống Smart Home hiện nay đa phần chỉ dừng lại ở mức điều khiển bật/tắt thiết bị đơn thuần mà thiếu đi tính năng giám sát công suất tức thời và dự báo nhu cầu tiêu thụ.
2. **Yêu cầu về độ tin cậy chuẩn công nghiệp:** Việc áp dụng bộ điều khiển lập trình được (PLC - Programmable Logic Controller) Siemens S7-1200 kết hợp với đồng hồ đo điện đa năng công nghiệp MFM384 đảm bảo độ tin cậy, tính ổn định cao và khả năng chống nhiễu vượt trội so với các vi điều khiển phổ thông.
3. **Ứng dụng Trí tuệ nhân tạo (AI):** Sự kết hợp giữa hạ tầng điều khiển PLC/IoT và mô hình học máy cho phép nghiên cứu dự báo xu hướng tiêu thụ điện năng 24 giờ tiếp theo. Kết quả dự báo chỉ đóng vai trò tham khảo và hỗ trợ cảnh báo/khuyến nghị; mô hình AI không trực tiếp ra lệnh đóng cắt thiết bị.

---

## 🎯 3. MỤC TIÊU NGHIÊN CỨU (RESEARCH OBJECTIVES)

### 3.1. Mục tiêu tổng quát (General Objective)
Nghiên cứu, thiết kế và hiện thực prototype phần mềm cho một giải pháp HEMS gồm PLC S7-1200/MFM384, Flask Backend, cơ sở dữ liệu, mô hình dự báo phụ tải và ứng dụng React Native/Expo. Phần tích hợp phần cứng, độ trễ end-to-end và dữ liệu đo tại Cần Thơ chỉ được công nhận sau khi hoàn thành ca thử thực nghiệm và lưu bằng chứng thô.

### 3.2. Mục tiêu cụ thể (Specific Objectives)
1. **Nghiên cứu và thiết kế hạ tầng phần cứng công nghiệp:** Hoàn thiện sơ đồ động lực/điều khiển và kế hoạch cấu hình MFM384 truyền thông RS485 Modbus RTU với PLC S7-1200 để thu thập $V$, $I$, $kW$ và $kWh$. Kết quả đo thật phải được xác nhận bằng log thực nghiệm.
2. **Lập trình PLC Siemens S7-1200:** Thiết kế ánh xạ lệnh và feedback trạng thái độc lập, đồng bộ thao tác tại tủ điện với ứng dụng. Các địa chỉ Data Block, độ rộng xung và logic an toàn phải được đối chiếu trực tiếp với TIA Portal trước khi công bố là đã vận hành phần cứng.
3. **Xây dựng Backend và cơ sở dữ liệu:** Flask Backend làm lớp xác thực, phân quyền `system_admin`/`owner`/`member` theo `home_id`, ghi audit log và tuần tự hóa I/O PLC. Hệ thống hỗ trợ SQLite và PostgreSQL/Supabase theo cấu hình; ứng dụng không truy cập trực tiếp database hoặc PLC.
4. **Nghiên cứu dự báo phụ tải:** Đánh giá XGBoost, Random Forest và các baseline trên phần dữ liệu UCI được pipeline chuẩn xử lý gồm 507.970 dòng thô, 8.761 dòng theo giờ và 8.401 mẫu supervised. Kết quả XGBoost hiện tại (MAE 0,4855 kW; RMSE 0,6475 kW; MAPE 66,24%; R² 0,2219) là benchmark công khai ban đầu, chưa đại diện cho dữ liệu MFM384 tại Cần Thơ.
5. **Xây dựng ứng dụng di động và giao diện quản trị:** Phát triển ứng dụng React Native/Expo để giám sát, quản lý phòng/thiết bị, quota, dự báo và điều khiển qua backend; bổ sung xác thực phiên, nhãn trợ năng, trạng thái chờ/thành công/lỗi và xử lý bàn phím cho đăng nhập/chat.
6. **Thực nghiệm đa kịch bản:** Chuẩn bị công cụ thu thập/phân tích latency và kế hoạch SC-01/SC-02/SC-03. Đây là công việc đang chờ chạy với PLC/MFM384 và tải thật; không trình bày như kết quả đã hoàn thành trước khi có raw log và đủ số lần lặp.

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
*Xem chi tiết tóm tắt và đóng góp của từng tài liệu tại `Danh_Mục_Tài_Liệu_Tham_Khảo.md`.*

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
