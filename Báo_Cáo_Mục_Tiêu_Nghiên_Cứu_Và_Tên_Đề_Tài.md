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
3. **Ứng dụng Trí tuệ nhân tạo (AI):** Sự kết hợp giữa hạ tầng điều khiển cứng (PLC/IoT) và các thuật toán học máy (Machine Learning) cho phép dự đoán xu hướng tiêu thụ điện năng 24h tiếp theo, từ đó đưa ra các cảnh báo vượt hạn mức (Quota) và hỗ trợ cơ chế đề xuất sa thải phụ tải phi thiết yếu có điều kiện khi tiệm cận hạn mức điện năng tháng.

---

## 🎯 3. MỤC TIÊU NGHIÊN CỨU (RESEARCH OBJECTIVES)

### 3.1. Mục tiêu tổng quát (General Objective)
Xây dựng thành công một giải pháp tổng thể HEMS khép kín bao gồm: Tủ điện điều khiển và đo lường công nghiệp (PLC S7-1200, MFM384), Backend API Server trung gian, Cơ sở dữ liệu đám mây (Supabase Postgres), Mô hình AI dự báo phụ tải và Ứng dụng di động (React Native/Expo) giám sát thời gian thực.

### 3.2. Mục tiêu cụ thể (Specific Objectives)
1. **Nghiên cứu & Thiết kế hạ tầng Phần cứng Công nghiệp:** Đấu nối hoàn chỉnh sơ đồ động lực và điều khiển; cấu hình đồng hồ MFM384 truyền thông nối tiếp RS485 Modbus RTU về PLC S7-1200 để thu thập thời gian thực 4 đại lượng điện năng nòng cốt: Điện áp ($V$), Dòng điện ($I$), Công suất tức thời ($kW$) và Điện năng lũy kế ($kWh$).
2. **Lập trình Bộ điều khiển PLC Siemens S7-1200:** Lập trình khối Data Block (`DB7` cho lệnh Command và `DB1` cho phản hồi Status) trên phần mềm TIA Portal V17/V18. Thiết lập cơ chế tạo xung điều khiển (Pulse Command 200ms) và cơ chế phản hồi khép kín (Closed-loop State Feedback) giúp hỗ trợ đồng bộ trạng thái theo phản hồi thực tế từ PLC giữa nút bấm vật lý tại tủ điện và ứng dụng di động.
3. **Xây dựng Kiến trúc Phần mềm Backend & Cơ sở dữ liệu Đám mây:** Xây dựng Flask Backend API trung tâm đóng vai trò làm API Gateway an toàn, phân quyền người dùng đa tầng (`system_admin`, `owner`, `member`) theo từng mã định danh hộ gia đình (`home_id`). Tích hợp thư viện `python-snap7` để khởi tạo kết nối giao thức S7 Protocol TCP/IP tới PLC. Triển khai cơ sở dữ liệu tập trung Supabase PostgreSQL và xuất bản API công khai qua Cloudflare Tunnel.
4. **Nghiên cứu & Tích hợp Thuật toán Trí tuệ nhân tạo (AI & Machine Learning):** Xây dựng và tối ưu hóa các thuật toán Học máy (XGBoost, Random Forest) trên tập dữ liệu chuỗi thời gian tiêu chuẩn quốc tế UCI (hơn 2 triệu dòng dữ liệu) để dự báo chính xác phụ tải điện năng 24 giờ tiếp theo, được đánh giá bằng các chỉ số MAE, RMSE, MAPE và R². Thiết lập thuật toán đề xuất sa thải phụ tải có điều kiện đối với các tải phi thiết yếu đã cấu hình trước để hỗ trợ tối ưu hóa điện năng tiêu thụ.
5. **Xây dựng Ứng dụng Di động & Giao diện Quản trị:** Phát triển ứng dụng di động đa nền tảng (Android/iOS) bằng React Native/Expo cung cấp giao diện trực quan cho người dùng giám sát chỉ số điện năng, theo dõi biểu đồ dự báo AI, thiết lập hạn mức Quota và điều khiển thiết bị từ xa qua 4G/Wi-Fi với độ trễ đáp ứng yêu cầu thử nghiệm trong phạm vi mô hình.
6. **Thực nghiệm & Kiểm thử Hệ thống Đa kịch bản:** Thực hiện đo đạc và phân tích định lượng độ trễ truyền thông (Latency Test) trong mạng LAN và mạng 4G; Tiến hành 3 kịch bản thực nghiệm tải thực tế tại hiện trường (SC-01 Vắng nhà, SC-02 Sinh hoạt bình thường, SC-03 Giờ cao điểm) để đánh giá khả năng hoạt động của hệ thống qua kịch bản thực nghiệm.

---

## 🔍 4. ĐỐI TƯỢNG VÀ PHẠM VI NGHIÊN CỨU (SCOPE & DELIMITATIONS)

- **Đối tượng nghiên cứu:** Các thuật toán học máy dự báo phụ tải điện năng chuỗi thời gian; Giao thức truyền thông công nghiệp (Modbus RTU, Siemens S7 Protocol TCP/IP); Mô hình kiến trúc phần mềm HEMS.
- **Phạm vi phần cứng thực nghiệm:** PLC Siemens CPU 1215C DC/DC/DC, Đồng hồ đo điện MFM384, Tủ điện mô hình 3 phòng (Phòng khách, Phòng bếp, Phòng ngủ).
- **Phạm vi phần mềm:** Mobile App (React Native/Expo), Web Admin quản trị, Flask API Server, Cloud Database Supabase Postgres.

---

## 🌟 5. ĐÓNG GÓP VÀ Ý NGHĨA CỦA ĐỀ TÀI (EXPECTED CONTRIBUTIONS)

- **Ý nghĩa khoa học:** Chứng minh tính hiệu quả của việc kết hợp hạ tầng điều khiển công nghiệp (PLC) với các kỹ thuật Trí tuệ nhân tạo (Machine Learning) trong bài toán quản lý năng lượng hộ gia đình.
- **Ý nghĩa thực tiễn:** Tạo ra một sản phẩm prototype hoàn chỉnh, có khả năng thương mại hóa hoặc ứng dụng thực tế trong các mô hình căn hộ/nhà thông minh hiện đại, góp phần nâng cao ý thức tiết kiệm điện và bảo vệ lưới điện.

---

## 📚 6. DANH MỤC TÀI LIỆU THAM KHẢO (REFERENCES)
*Xem chi tiết tóm tắt và đóng góp của từng tài liệu tại [DANH_MUC_TAI_LIEU_THAM_KHAO.md](file:///c:/Users/ADMIN/.gemini/antigravity/scratch/smart-home-app/DANH_MUC_TAI_LIEU_THAM_KHAO.md)*

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
