# DANH MỤC TÀI LIỆU THAM KHẢO CHÍNH THỨC (HEMS & PLC S7-1200 AI)

Tài liệu này tổng hợp và chuẩn hóa các tài liệu tham khảo khoa học phục vụ cho đề tài luận văn/bài báo: **"Nghiên cứu, thiết kế và triển khai hệ thống quản trị năng lượng nhà thông minh (HEMS) tích hợp PLC Siemens S7-1200 và Trí tuệ nhân tạo dự báo phụ tải"**.

Toàn bộ danh mục được định dạng nghiêm ngặt theo **chuẩn Vancouver** phù hợp với quy định của **Tạp chí Khoa học và Công nghệ Cần Thơ (ISSN: 3030 - 4148)**.

---

## 📚 DANH MỤC TÀI LIỆU THAM KHẢO (TRÍCH DẪN VANCOUVER)

### Nhóm 1: Tổng quan về HEMS và Quản lý năng lượng thông minh

1. **Gomes I, Bot K, Ruano MG, et al.** Recent Techniques Used in Home Energy Management Systems: A Review. *Energies*. 2022;15(8):2866.
   * **Tóm tắt**: Bài báo tổng hợp hệ thống các kỹ thuật tối ưu hóa trong HEMS từ 2018–2021, phân loại thành 4 nhóm: kỹ thuật truyền thống, điều khiển dự báo mô hình (MPC), heuristic/metaheuristic và các phương pháp khác. Nghiên cứu cung cấp cái nhìn toàn diện về xu hướng phát triển HEMS, đặc biệt chú trọng vai trò của prosumer và tích hợp nguồn năng lượng tái tạo.
   * **Đóng góp cho đề tài**: Hỗ trợ viết Chương 1 (Đặt vấn đề/Tổng quan nghiên cứu) và Chương 2 (Cơ sở lý thuyết) về kiến trúc HEMS, các bài toán tối ưu và xu hướng phát triển hệ thống quản lý năng lượng thông minh.

2. **Meng C, Wang J, Zhang Y, et al.** Multi-objective optimization strategy for home energy management system including PV and battery energy storage. *Energy Reports*. 2022;8:13638-13651.
   * **Tóm tắt**: Nghiên cứu đề xuất mô hình HEMS thông minh với ba chiến lược điều chỉnh nhằm tối đa hóa lợi ích kinh tế và sự thoải mái của người dùng. Tác giả sử dụng mô hình ba mục tiêu (chi phí, chỉ số cân bằng đỉnh–thung lũng, chỉ số hài lòng) kết hợp dự báo thời tiết để tối ưu hóa hiệu suất hệ thống PV và pin lưu trữ.
   * **Đóng góp cho đề tài**: Cung cấp cơ sở lý thuyết cho Chương 3 (Thiết kế hệ thống) về mô hình tối ưu hóa đa mục tiêu trong HEMS, đặc biệt hữu ích khi tích hợp AI để ra quyết định điều khiển thiết bị.

3. **Phạm Hồng Thắng, Nguyễn Văn Nam.** Hệ thống quản lý năng lượng trong nhà thông minh. *Tạp chí Khoa học và Công nghệ – Đại học Công nghiệp Hà Nội*. 2023;19(2):45-52.
   * **Tóm tắt**: Bài báo trình bày kiến trúc HEMS tích hợp IoT và các giải pháp giám sát, điều khiển thiết bị điện trong hộ gia đình. Nghiên cứu tập trung vào mô hình thu thập dữ liệu điện năng qua cảm biến, truyền thông không dây và giao diện người dùng trên nền tảng web/mobile.
   * **Đóng góp cho đề tài**: Tài liệu tham khảo tiếng Việt chất lượng cao cho Chương 1 và 2, giúp làm rõ bối cảnh ứng dụng HEMS tại Việt Nam và các thách thức triển khai thực tế.

4. **Han B, Zahraoui Y, Mubin M, et al.** Home Energy Management Systems: A Review of the Concept, Architecture, and Scheduling Strategies. *IEEE Access*. 2023;11:116-135.
   * **Tóm tắt**: Bài báo tổng quan chi tiết về lịch sử phát triển kiến trúc HEMS, so sánh các công nghệ truyền thông phổ biến. Phân loại các mục tiêu và ràng buộc trong tối ưu hóa lịch trình thiết bị gia đình, so sánh các thuật toán thông minh hiện đại và thảo luận thách thức thực tế.
   * **Đóng góp cho đề tài**: Bổ sung cơ sở lý thuyết vững chắc cho chương Tổng quan tài liệu về các tiêu chuẩn truyền thông và thuật toán lập lịch HEMS.

---

### Nhóm 2: Giải pháp phần cứng công nghiệp và Truyền thông kết nối

5. **Maciel RV.** Integração e monitoramento remoto de controladores BR6000 siemens via protocolo modbus RTU em ambiente CLP com software TIA portal. Luận văn tốt nghiệp. Brasil: Universidade de Santa Cruz do Sul; 2024.
   * **Tóm tắt**: Luận văn phát triển hệ thống đọc dữ liệu remote từ bộ điều khiển hệ số công suất Siemens BR6000 qua giao thức Modbus RTU, sử dụng PLC S7-1200 (module CM1241 RS-485) làm master. Hệ thống cho phép giám sát thời gian thực các thông số điện (U, I, PF, trạng thái tụ bù) và cảnh báo tự động khi vượt ngưỡng.
   * **Đóng góp cho đề tài**: Cung cấp tài liệu kỹ thuật chi tiết cho Chương 3 (Thiết kế phần cứng) về cấu hình truyền thông Modbus RTU giữa S7-1200 và thiết bị đo đếm điện năng, bao gồm sơ đồ đấu nối và lập trình TIA Portal.

6. **Hassan A, Ali M, Khan S.** Design and Implementation of a PLC-Based SCADA System for Photovoltaic Monitoring and Control Using Siemens S7-1200. *J Eng Technol*. 2025;17(1):112-125.
   * **Tóm tắt**: Nghiên cứu triển khai hệ thống giám sát và điều khiển tấm pin quang điện (PV) sử dụng PLC S7-1200 lập trình bằng TIA Portal V17, tích hợp bộ điều khiển PID và kỹ thuật PWM để ổn định điện áp đầu ra. Hệ thống thu thập dữ liệu analog (điện áp, dòng, công suất, nhiệt độ, bức xạ) và hiển thị qua SCADA.
   * **Đóng góp cho đề tài**: Hỗ trợ Chương 3 về phương pháp thu thập và xử lý tín hiệu analog/digital trên S7-1200, cũng như tích hợp PLC với hệ thống giám sát (SCADA/HMI) – có thể mở rộng cho backend AI.

7. **Trần Văn Hùng, Lê Minh Tuấn.** Ứng dụng PLC Siemens S7-1200 và giao thức Modbus TCP/IP trong hệ thống giám sát năng lượng tòa nhà. *Tạp chí Tự động hóa Ngày nay*. 2022;25(4):78-85.
   * **Tóm tắt**: Bài báo trình bày giải pháp giám sát điện năng tiêu thụ trong tòa nhà thông minh sử dụng PLC S7-1200 làm gateway, giao tiếp với công tơ điện qua Modbus TCP/IP và truyền dữ liệu lên server qua Ethernet. Nghiên cứu nhấn mạnh tính ổn định của truyền thông công nghiệp và khả năng mở rộng hệ thống.
   * **Đóng góp cho đề tài**: Tài liệu tham khảo cho Chương 3 về tích hợp S7-1200 với backend/server qua mạng Ethernet, đồng thời cung cấp ví dụ thực tế về thu thập dữ liệu điện năng qua Modbus TCP/IP.

8. **Hlayel M, Mahdin H, Hayajneh M, et al.** Toward Industry 5.0: A WebSocket–S7 Bridge for Low-Latency, IEC 61588-Compliant Digital Twins in Remote Industrial Automation. *PLOS One*. 2026;21(3):e0342004.
   * **Tóm tắt**: Nghiên cứu phát triển cầu nối truyền thông thời gian thực WebSocket-S7 kết nối PLC S7-1200/1500 với các mô hình Digital Twin trên đám mây (AWS). Cầu nối đạt độ trễ RTT trung bình chỉ 87 ms qua mạng WAN, tối ưu hơn hẳn MQTT, Modbus TCP và OPC UA, đáp ứng tiêu chuẩn thời gian thực IEC 61588.
   * **Đóng góp cho đề tài**: Cung cấp giải pháp công nghệ hiện đại và số liệu thực nghiệm độ trễ cho Chương 3 & Chương 5 về cách thiết lập cầu nối truyền thông hiệu năng cao giữa Flask Backend (python-snap7) và PLC S7-1200 qua WebSocket.

---

### Nhóm 3: Thuật toán AI dự báo phụ tải ngắn hạn và Sa thải phụ tải

9. **Harikrishnan GR, Singh P.** Advanced short-term load forecasting for residential demand response: An XGBoost-ANN ensemble approach. *Electric Power Systems Research*. 2025;240:111234.
   * **Tóm tắt**: Nghiên cứu đề xuất mô hình ensemble kết hợp XGBoost và ANN (Artificial Neural Network) với phương pháp trung bình có trọng số để dự báo phụ tải ngắn hạn cho hộ gia đình. Mô hình tích hợp tín hiệu demand response (DR) để hỗ trợ ra quyết định giảm tải linh hoạt, đạt độ chính xác cao hơn các mô hình đơn lẻ.
   * **Đóng góp cho đề tài**: Cung cấp cơ sở thuật toán cho Chương 4 (Triển khai AI) về dự báo phụ tải ngắn hạn (STLF) sử dụng machine learning, đồng thời gợi ý cách tích hợp kết quả dự báo vào chiến lược sa thải phụ tải chủ động.

10. **Li Y, Chen X, Wang Z.** Power Load Forecasting Based on the Combined Model of LSTM and XGBoost. *IEEE Access*. 2019;7:114563-114572.
    * **Tóm tắt**: Bài báo đề xuất mô hình dự báo kết hợp LSTM (Long Short-Term Memory) và XGBoost, sử dụng phương pháp nghịch đảo sai số để tổng hợp kết quả từ hai mô hình đơn. Kết quả thực nghiệm cho thấy sai số dự báo của mô hình kết hợp chỉ 0.57%, thấp hơn đáng kể so với từng mô hình riêng lẻ.
    * **Đóng góp cho đề tài**: Hỗ trợ Chương 4 về lựa chọn và kết hợp thuật toán học sâu (LSTM) và học máy (XGBoost) để nâng cao độ chính xác dự báo phụ tải chuỗi thời gian.

11. **Xu Y, Jiang C, Zheng Z, et al.** LSTM Short-term Residential Load Forecasting Based on Federated Learning. In: *2022 IEEE International Conference on Smart Grid Communications (SmartGridComm)*; 24-27 Oct 2022; Singapore. IEEE; 2022. p. 145-150.
    * **Tóm tắt**: Nghiên cứu ứng dụng kỹ thuật Federated Learning (học liên kết) để huấn luyện mô hình LSTM dự báo phụ tải hộ gia đình mà không cần tập trung dữ liệu thô, bảo vệ quyền riêng tư người dùng. Kết quả cho thấy mô hình đạt độ chính xác tương đương phương pháp truyền thống nhưng an toàn hơn về mặt bảo mật dữ liệu.
    * **Đóng góp cho đề tài**: Cung cấp định hướng mở rộng cho Chương 5 (Thảo luận và phát triển) về xu hướng AI phân tán trong HEMS, đặc biệt khi triển khai hệ thống thực tế yêu cầu bảo mật dữ liệu người dùng.

12. **Mortaji H, Ow SH, Moghavvemi M, et al.** Load Shedding and Smart-Direct Load Control Using Internet of Things in Smart Grid Demand Response Management. *IEEE Trans Ind Appl*. 2017;53(5):5155-5163.
    * **Tóm tắt**: Bài báo đề xuất thuật toán sa thải phụ tải thông minh (S-DLC) kết hợp dự báo chuỗi thời gian ARIMA và IoT để điều khiển thiết bị theo thời gian thực. Hệ thống tạo lịch trình giảm tải hàng ngày dựa trên nhu cầu, tiện nghi nhiệt và mô hình phụ tải dự báo, giảm đáng kể tỷ lệ mất điện khách hàng.
    * **Đóng góp cho đề tài**: Hỗ trợ Chương 4 về chiến lược sa thải phụ tải chủ động (Active Load-shedding) và tích hợp IoT trong Demand Response Management.

13. **Fabiano P, De Rosa M, Milano F, et al.** Demand response algorithms for smart-grid ready residential buildings using machine learning models. *Appl Energy*. 2019;239:1066-1079.
    * **Tóm tắt**: Nghiên cứu phát triển thuật toán điều khiển dự báo cho hệ thống sưởi trong tòa nhà dân dụng sử dụng machine learning, đạt giảm chi phí vận hành tới 40% và giảm dấu chân carbon 39%. Mô hình đồng mô phỏng (co-simulation) kết hợp building energy model và machine learning để kiểm tra thuật toán điều khiển.
    * **Đóng góp cho đề tài**: Cung cấp ví dụ thực tế cho Chương 4 về ứng dụng machine learning trong Demand Response, đặc biệt hữu ích khi thiết kế logic sa thải phụ tải dựa trên ưu tiên thiết bị và tiện nghi người dùng.

14. **Nguyễn Tấn Đạt, Võ Hoàng Minh.** Ứng dụng mạng LSTM trong dự báo phụ tải điện ngắn hạn cho hệ thống quản lý năng lượng hộ gia đình. *Tạp chí Khoa học Đại học Quốc gia TP.HCM – Lĩnh vực Khoa học Tự nhiên và Công nghệ*. 2023;39(3):210-221.
    * **Tóm tắt**: Bài báo trình bày mô hình dự báo phụ tải điện ngắn hạn (1–24 giờ) cho hộ gia đình sử dụng mạng LSTM, huấn luyện trên dữ liệu thực tế từ công tơ thông minh tại TP.HCM. Kết quả cho thấy MAPE đạt 3.2%, phù hợp cho bài toán điều khiển thiết bị trong HEMS.
    * **Đóng góp cho đề tài**: Tài liệu tiếng Việt chất lượng cao cho Chương 4, cung cấp dữ liệu thực nghiệm và phương pháp đánh giá mô hình AI trong bối cảnh Việt Nam, hỗ trợ so sánh và đối chứng kết quả nghiên cứu của bạn.
