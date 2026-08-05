# RÀ SOÁT HỌC THUẬT BÀI BÁO HEMS

## 1. Phạm vi và nguyên tắc rà soát

- Bản được rà soát: `HEMS_Paper_Vietnamese_Final_Revision.docx`.
- Bản sau sửa: `HEMS_Paper_Vietnamese_Electrical_Engineering_Revision.docx`.
- Tiêu chí chính: đúng phạm vi Điện công nghiệp; quan hệ khẳng định–bằng chứng; tính nhất quán phương pháp; chất lượng hình, bảng và tài liệu tham khảo; nguy cơ đạo văn; mức sẵn sàng gửi phản biện.
- Nguyên tắc: không suy diễn từ mã nguồn thành kết quả thực nghiệm; không tạo số đo, ảnh phần cứng hoặc tính năng chưa được kiểm chứng; giữ nguyên khuôn bài báo CTUT.

## 2. Kết luận điều hành

Bản sửa đã có trục kỹ thuật rõ hơn: đo lường điện năng bằng MFM384, thu thập qua Modbus RTU, xử lý/điều khiển bằng PLC S7-1200, giám sát từ xa, dự báo phụ tải 24 giờ và logic quản lý phụ tải theo Quota. Phần mềm được trình bày như công cụ hỗ trợ vận hành điện thay vì đóng vai trò đóng góp trung tâm.

Bài **chưa nên gửi phản biện ở trạng thái hiện tại**. Nguyên nhân không nằm ở bố cục hay câu chữ mà ở khoảng trống bằng chứng: chưa có nhật ký đo thực từ MFM384–PLC–phụ tải, chưa xác nhận bản đồ thanh ghi và hệ số tỉ lệ của đúng phiên bản đồng hồ, chưa có thử nghiệm độ trễ/độ tin cậy điều khiển trên phần cứng, chưa chứng minh sa thải phụ tải tự động, và còn các trường thông tin tác giả cần điền.

## 3. Phát hiện theo mức độ

### CRITICAL

1. **Hình 4 cũ là khung giữ chỗ, không phải bằng chứng thực nghiệm.** Hình có chỉ dẫn yêu cầu tác giả thay thế, vì vậy đã bị xóa hoàn toàn. Chỉ chèn ảnh tủ điện, MFM384, PLC và tải thật sau khi có ảnh gốc, chú thích thiết bị và điều kiện thử nghiệm.
2. **Tích hợp dữ liệu thời tiết chưa được chứng minh.** Bộ đặc trưng của thực nghiệm hiện tại không chứa biến thời tiết. Nội dung này đã chuyển thành hướng phát triển, không còn được mô tả như tính năng đã đánh giá.
3. **Khả năng chatbot/phản hồi tức thời chưa có thí nghiệm định lượng.** Các câu kiểu “tối ưu trải nghiệm”, “phản hồi tự nhiên” hoặc “tức thì” đã bị loại vì không có tiêu chí, dữ liệu hay kịch bản đánh giá.
4. **Mục tiêu phần cứng chưa có bằng chứng đo trên mô hình thật.** Bài mới phân biệt rõ kiến trúc/thiết kế đã xây dựng với kết quả đã kiểm chứng. Đây vẫn là điều kiện chặn trước khi gửi bài.

### MAJOR

1. Bản cũ thiên về thuật ngữ CNTT; bản mới chuyển trọng tâm sang đại lượng điện, chuỗi đo, cơ cấu đóng cắt, bảo vệ, phản hồi trạng thái và quản lý phụ tải.
2. Chưa có bảng địa chỉ thanh ghi MFM384, kiểu dữ liệu, thứ tự byte, hệ số nhân và chu kỳ lấy mẫu đã kiểm chứng trên đúng thiết bị.
3. Cần phân biệt Quota năng lượng theo chu kỳ \((kWh)\) với ngưỡng công suất tức thời \((kW)\); bản mới đã tách hai khái niệm nhưng thực nghiệm thật vẫn còn thiếu.
4. Logic sa thải phụ tải mới ở mức thiết kế: cần thứ tự ưu tiên tải, vùng trễ, thời gian giữ tối thiểu, thao tác tay, dừng khẩn và điều kiện phục hồi.
5. Bằng chứng giao diện/mã nguồn không thay thế được thử nghiệm đầu cuối từ lệnh điều khiển đến trạng thái tiếp điểm/tải.
6. Kết quả dự báo trên UCI chứng minh quy trình so sánh mô hình, nhưng không tự động chứng minh độ chính xác trên phòng thí nghiệm địa phương.
7. Danh mục 24 tài liệu cũ có nhiều nguồn về vi dịch vụ, giao diện, an ninh ứng dụng và MLOps không trực tiếp hỗ trợ lập luận điện; đã rút còn 18 nguồn tập trung hơn.

### MINOR

1. Đã giảm cách viết trộn Việt–Anh; các thuật ngữ bắt buộc được giải thích khi xuất hiện lần đầu.
2. Đã chia các câu dài và giảm lối diễn đạt quảng bá.
3. Một số nhãn song ngữ/dấu gạch chéo của mẫu CTUT được giữ vì thuộc khuôn trình bày.
4. Các trường tác giả, đơn vị, email, ngày nhận/sửa/chấp nhận và tài trợ vẫn phải được điền trước khi nộp.

## 4. Ma trận khẳng định–bằng chứng

| Khẳng định | Bằng chứng hiện có | Mức cho phép trong bài | Việc còn thiếu |
|---|---|---|---|
| Hệ thống có chuỗi MFM384–S7-1200–giám sát | Sơ đồ thiết kế và cấu trúc triển khai | Mô tả kiến trúc/mô hình | Ảnh thật, sơ đồ đấu dây, nhật ký thanh ghi |
| Web/App hỗ trợ giám sát và phát lệnh | Mã nguồn và các luồng phần mềm đã rà | Nêu là chức năng phần mềm | Thử nghiệm đầu cuối trên tải thật |
| Phản hồi PLC được kiểm tra trước khi xác nhận lệnh | Hợp đồng hành vi/mã nguồn | Nêu là cơ chế triển khai phần mềm | Log PLC và đo độ trễ thực |
| RF/XGBoost dự báo trực tiếp 24 bước | Mã huấn luyện, cấu hình và kết quả chuẩn hóa | Nêu kết quả benchmark công khai | Đánh giá trên dữ liệu MFM384 địa phương |
| Quota hỗ trợ cảnh báo/khuyến nghị | Logic và luồng phần mềm | Nêu là chức năng hỗ trợ quyết định | Kịch bản thực nghiệm có hồ sơ phụ tải |
| Tự động sa thải tải công suất lớn | Chưa có bằng chứng chạy thật | Chỉ mô tả thiết kế/định hướng kiểm chứng | PLC program, interlock, log sự kiện, thử nghiệm an toàn |
| Dữ liệu thời tiết cải thiện dự báo | Chưa tích hợp vào benchmark hiện tại | Chỉ nêu hướng phát triển | Nguồn dữ liệu, đồng bộ thời gian, ablation test |
| Chatbot cải thiện vận hành | Chưa có đánh giá | Không dùng làm kết luận khoa học | Bộ câu hỏi, độ đúng, độ trễ, nghiên cứu người dùng |

## 5. Rà soát nguy cơ đạo văn

Không phát hiện đoạn dài có dấu hiệu sao chép nguyên văn trong phần nội dung được rà soát và đối chiếu thủ công với các nguồn cốt lõi. Bản sửa đã:

- diễn đạt lại phần nền tảng theo mạch vấn đề–khoảng trống–mục tiêu;
- gắn trích dẫn ngay tại khẳng định cần nguồn;
- tránh dịch máy sát cấu trúc câu của tóm tắt bài khác;
- không dùng văn phong quảng bá hoặc kết luận vượt bằng chứng.

Tuy vậy, đây **không phải chứng nhận tỷ lệ tương đồng**. Trước khi nộp, cần chạy Turnitin hoặc iThenticate trên đúng tệp cuối cùng; tự kiểm tra riêng tiêu đề bảng/hình, mô tả thuật toán và đoạn tổng quan vì đây là các vùng dễ có cụm từ kỹ thuật trùng lặp.

## 6. Tự chấm bản sau sửa

| Tiêu chí | Điểm /10 | Nhận xét |
|---|---:|---|
| Tính mới và định vị đóng góp | 6.5 | Có giá trị tích hợp cho phòng thí nghiệm, nhưng cần nêu đóng góp vừa mức |
| Phương pháp | 7.5 | Quy trình dự báo và phân tách dữ liệu rõ; phần cứng còn thiếu quy trình kiểm chứng |
| Mức đủ của bằng chứng | 5.5 | Benchmark công khai tốt, bằng chứng mô hình điện thật còn yếu |
| Phù hợp chuyên ngành Điện công nghiệp | 8.5 | Trọng tâm đã chuyển đúng sang đo lường–điều khiển–phụ tải |
| Mạch lập luận và câu chữ | 8.5 | Nhất quán, thận trọng, ít thuật ngữ CNTT thừa |
| Hình và bảng | 8.0 | Gọn, có mục đích; chưa có ảnh/số liệu phần cứng thật |
| Tài liệu tham khảo | 8.5 | 18 nguồn tập trung và có vai trò rõ |

## 7. Khuyến nghị nộp bài

**Mức 3 – cần bổ sung thực nghiệm trọng yếu trước khi nộp.**

Điều kiện tối thiểu để chuyển sang “có thể nộp”:

1. Điền đầy đủ thông tin tác giả và tài trợ.
2. Xác minh manual/bản đồ thanh ghi của đúng MFM384 đang dùng.
3. Thu tối thiểu một bộ log đồng bộ MFM384–PLC–trạng thái tải và mô tả điều kiện đo.
4. Thực hiện các kịch bản bật/tắt, mất truyền thông, phản hồi sai/timeout, chạm Quota và phục hồi an toàn.
5. Nếu tuyên bố sa thải tự động: cung cấp thuật toán PLC, ưu tiên tải, hysteresis, thời gian giữ, thao tác tay và kết quả thử.
6. Chạy kiểm tra tương đồng trên tệp PDF/DOCX cuối.

## 8. Kiểm tra kỹ thuật tệp sau sửa

- DOCX mở và đóng gói hợp lệ; khổ A4, lề và một section khớp mẫu CTUT.
- Có 3 hình inline kèm mô tả thay thế, 4 bảng khoa học có hàng tiêu đề và kích thước cột cố định.
- Có đủ trích dẫn [1]–[18] và 18 mục tham khảo; không có số mồ côi.
- PDF gồm 8 trang, đã rà trực quan từng trang; không phát hiện hình/bảng bị cắt hoặc chú thích tách khỏi đối tượng.
- Kiểm tra khả năng tiếp cận không có lỗi mức cao. Hai cảnh báo mức trung bình thuộc hai bảng bố cục tóm tắt song ngữ của mẫu (không có hàng tiêu đề dữ liệu), không thuộc bốn bảng khoa học.
- Còn 6 nhóm placeholder thông tin hành chính/tác giả cần điền trước khi nộp.
