# NHẬT KÝ SỬA ĐỔI BÀI BÁO

## 1. Thay đổi định vị

- Đổi tiêu đề để phản ánh đúng đối tượng: mô hình giám sát năng lượng và dự báo phụ tải cho phòng thí nghiệm Điện công nghiệp.
- Chuyển đóng góp trung tâm từ kiến trúc phần mềm sang chuỗi đo lường–điều khiển–giám sát–dự báo–quản lý phụ tải.
- Giới hạn kết luận theo ba mức: đã kiểm chứng bằng benchmark, đã thể hiện trong mã/thiết kế, và còn cần kiểm chứng phần cứng.

## 2. Tóm tắt và từ khóa

- Viết lại tóm tắt tiếng Việt và tiếng Anh theo cấu trúc: vấn đề, phương pháp, bằng chứng, kết quả, giới hạn và đóng góp.
- Loại các phát biểu chưa có dữ liệu về thời tiết, chatbot và phản hồi “tức thì”.
- Từ khóa tập trung vào dự báo phụ tải, giám sát năng lượng, MFM384, PLC S7-1200 và quản lý phụ tải.

## 3. Nội dung chuyên môn

- Bổ sung mô tả chuỗi MFM384–Modbus RTU–S7-1200–relay/contactor–tải.
- Làm rõ các đại lượng điện cần đo: điện áp, dòng điện, công suất và điện năng; không tự điền bản đồ thanh ghi hoặc hệ số tỉ lệ chưa xác minh.
- Bổ sung nguyên tắc bảo vệ, liên động, phản hồi trạng thái, fail-closed, thao tác tay, dừng khẩn và điều kiện phục hồi.
- Phân biệt Quota năng lượng theo chu kỳ với ngưỡng công suất tức thời.
- Mô tả sa thải phụ tải như logic cần kiểm chứng, không phải kết quả đã hoàn thành.
- Sửa phần dự báo theo đúng mã huấn luyện: đặc trưng thời gian tuần hoàn, độ trễ, cửa sổ trượt, sai phân/tỉ số/EWM và các đại lượng điện; không có biến thời tiết.
- Làm rõ benchmark 24 bước trực tiếp, chia cuốn chiếu theo thời gian và so sánh baseline.

## 4. Câu chữ và tính liêm chính

- Giảm thuật ngữ CNTT không cần thiết và các câu mang tính quảng bá.
- Thay các khẳng định tuyệt đối bằng mô tả có điều kiện, truy được về bằng chứng.
- Chia câu dài, thống nhất thuật ngữ tiếng Việt, giải thích viết tắt khi xuất hiện đầu tiên.
- Không tạo số liệu, ảnh, log hoặc kết quả thử nghiệm mới.

## 5. Hình, bảng và tài liệu tham khảo

- Giữ 3 hình có vai trò khoa học; xóa Hình 4 giữ chỗ.
- Tổ chức 4 bảng khoa học theo khoảng trống, thành phần triển khai, kết quả dự báo và trạng thái bằng chứng.
- Rút danh mục từ 24 còn 18 nguồn; loại các tài liệu vi dịch vụ, UI, OWASP, mật mã và MLOps không phục vụ lập luận trung tâm.
- Bổ sung hướng dẫn Modbus Serial Line và một nghiên cứu HEMS/demand response.
- Kiểm tra: đủ trích dẫn [1]–[18], không có trích dẫn mồ côi.

## 6. Các mục cố ý chưa hoàn thiện

- Thông tin tác giả, đơn vị, email, ngày nhận/sửa/chấp nhận và tài trợ.
- Bản đồ thanh ghi/hệ số tỉ lệ của đúng model MFM384.
- Ảnh mô hình và sơ đồ đấu dây được xác nhận.
- Log dữ liệu địa phương và thử nghiệm điều khiển/sa thải tải trên phần cứng.
- Báo cáo Turnitin/iThenticate.

## 7. Kiểm tra đầu ra cuối

- Kết cấu: 1 section A4 theo mẫu, 3 hình, 4 bảng khoa học, 18 tài liệu tham khảo.
- Trích dẫn: liên tục [1]–[18], không thiếu mục và không vượt phạm vi.
- Đóng gói DOCX: hợp lệ; hình có alt text; bảng khoa học có header và cột cố định.
- PDF: 8 trang, đã xem từng trang; không có đối tượng bị cắt hoặc tràn lề.
- Hình 1 được vẽ lại theo chuỗi MFM384–S7-1200–relay/contactor–tải thay vì nhấn mạnh token/API.
- Hình 2 được giản lược nhãn theo luồng vận hành–kiểm tra lệnh–PLC gateway–statusTag.
