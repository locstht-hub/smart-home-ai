# KẾ HOẠCH HÌNH VÀ BẢNG

## 1. Hình đang giữ trong bản mới

| Hình | Vai trò khoa học | Đánh giá | Hành động |
|---:|---|---|---|
| Hình 1 | Cho thấy chuỗi đo MFM384–Modbus RTU–S7-1200–cơ cấu đóng cắt–Web/App | Cần thiết, đúng trọng tâm điện | Giữ; khi hoàn thiện có thể bổ sung nhãn đại lượng đo và chiều phản hồi |
| Hình 2 | Diễn giải luồng lệnh, kiểm tra an toàn, phản hồi PLC và xác nhận trạng thái | Cần thiết cho luận điểm điều khiển tin cậy | Giữ; không biến thành sơ đồ phần mềm quá chi tiết |
| Hình 3 | Trình bày kết quả benchmark dự báo 24 bước | Là hình kết quả định lượng chính | Giữ; mọi số phải truy về tệp kết quả chuẩn hóa |

## 2. Hình đã loại

| Hình cũ | Quyết định | Lý do |
|---|---|---|
| Hình 4 – cụm ảnh giao diện/phần cứng dạng giữ chỗ | Xóa | Không phải ảnh thực nghiệm, có chỉ dẫn thay thế và làm giảm độ tin cậy trình bày |

## 3. Hình chỉ được bổ sung sau khi có bằng chứng thật

1. **Ảnh mô hình thí nghiệm:** toàn cảnh tủ/bàn thực hành, MFM384, PLC S7-1200, relay/contactor, bảo vệ và tải; ảnh rõ nhãn thiết bị nhưng che thông tin nhạy cảm.
2. **Sơ đồ đấu dây đã xác nhận:** nguồn, CT nếu có, cổng RS-485, A/B/GND, termination/bias, ngõ ra PLC, cuộn contactor, bảo vệ và dừng khẩn.
3. **Ảnh chụp màn hình vận hành:** cùng một mốc thời gian cho số đo, lệnh điều khiển, trạng thái phản hồi và cảnh báo Quota.
4. **Đồ thị dữ liệu địa phương:** công suất thực–dự báo, sai số theo chân trời và trạng thái đóng cắt, chỉ tạo sau khi có log MFM384 hợp lệ.

Không dùng ảnh sinh bởi AI, mockup hoặc hình trang trí để đại diện cho phần cứng/kết quả thật.

## 4. Bảng khoa học trong bản mới

| Bảng | Nội dung | Đánh giá |
|---:|---|---|
| Bảng 1 | So sánh nghiên cứu liên quan theo đối tượng điện, đo–điều khiển, dự báo/quản lý tải và bằng chứng | Đủ để xác định khoảng trống; tránh liệt kê thuần túy |
| Bảng 2 | Thành phần triển khai và vai trò trong giám sát/điều khiển điện | Cần thiết; giữ thuật ngữ phần mềm ở mức tối thiểu |
| Bảng 3 | Kết quả dự báo trên các fold/chân trời và baseline | Bảng định lượng trung tâm; không thêm số ngoài kết quả chuẩn hóa |
| Bảng 4 | Kịch bản vận hành, trạng thái bằng chứng và giới hạn kết luận | Quan trọng để ngăn tuyên bố vượt bằng chứng |

## 5. Quy tắc trình bày cuối

- Mỗi hình/bảng phải được gọi và giải thích trong nội dung trước hoặc ngay sau khi xuất hiện.
- Chú thích phải trả lời “hình/bảng chứng minh điều gì”, không chỉ lặp tên đối tượng.
- Không chụp màn hình có chữ quá nhỏ; ưu tiên xuất vector cho sơ đồ/đồ thị.
- Không tách tiêu đề bảng khỏi bảng hoặc chú thích hình khỏi hình khi sang trang.
- Dùng nhất quán đơn vị SI: V, A, W/kW, Wh/kWh, s, ms; nêu rõ giá trị tức thời hay năng lượng tích lũy.

