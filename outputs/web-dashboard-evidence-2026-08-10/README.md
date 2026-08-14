# Bộ ảnh minh chứng Web Dashboard

Ngày ghi nhận: 10/08/2026  
Môi trường: Web Dashboard chạy cục bộ tại `http://127.0.0.1:8090` và Server API tại `http://127.0.0.1:5001`  
Vai trò kiểm tra: tài khoản chủ sở hữu (owner)

## Danh mục ảnh

| Tệp | Nội dung minh chứng |
| --- | --- |
| `01-dang-nhap.png` | Giao diện đăng nhập Web Dashboard; không hiển thị thông tin đăng nhập. |
| `02-tong-quan-dashboard.png` | Trang tổng quan điện năng, hạn mức, thao tác nhanh và trạng thái nguồn dữ liệu. |
| `03-phong-va-thiet-bi.png` | Danh sách phòng, thiết bị và các cảnh điều khiển nhanh. |
| `04-chi-tiet-dieu-khien-thiet-bi.png` | Chi tiết phòng và thiết bị khai báo thủ công; giao diện nêu rõ thiết bị chưa được ánh xạ PLC nên không cho điều khiển như thiết bị thật. |
| `05-phan-tich-va-du-bao.png` | Trang phân tích và dự báo; khi Forecast API chưa cung cấp dữ liệu hợp lệ, giao diện ghi rõ đang dùng dữ liệu mô phỏng dự phòng. |
| `06-tro-ly-nang-luong.png` | Trợ lý năng lượng nhận câu hỏi và trả lời qua Server API nội bộ, kèm thời gian phản hồi. |
| `07-quan-ly-thanh-vien.png` | Chức năng quản lý thành viên dành cho chủ sở hữu và nhật ký hoạt động. |
| `08-tai-khoan-va-cai-dat.png` | Thông tin tài khoản, quản lý gia đình, bảo mật và mục cấu hình hệ thống. |

## Phạm vi sử dụng trong báo cáo/bài báo

- Có thể dùng các ảnh này để minh chứng giao diện Web Dashboard, phân quyền chủ sở hữu, luồng quản lý thiết bị, chatbot và cách hệ thống công bố nguồn dữ liệu.
- Trạng thái `Mô phỏng dự phòng`/`Auto fallback` là dữ liệu dự phòng, không phải số đo thực từ PLC hoặc công tơ MFM384.
- Thiết bị khai báo thủ công chưa được ánh xạ PLC không phải bằng chứng điều khiển tải vật lý.
- Ảnh dự báo hiện minh chứng giao diện và cơ chế fallback; chưa được dùng để khẳng định độ chính xác của mô hình dự báo. Muốn kết luận về mô hình cần số liệu thực, tập kiểm thử và các chỉ số MAE/RMSE/MAPE.
- Không có mật khẩu hoặc API token trong bộ ảnh.
- Không đưa ảnh giao diện Web Dashboard ở chiều rộng điện thoại vào bộ minh chứng vì thanh điều hướng web hiện chưa tối ưu cho màn hình hẹp. Ứng dụng di động nên được chụp riêng trên thiết bị/emulator.

## Gợi ý chọn ảnh cho bài báo

Nếu bài báo bị giới hạn số hình, ưu tiên ghép `02`, `03`, `05` và `06` thành một hình nhiều tiểu mục (a)–(d). Hai ảnh `07` và `08` phù hợp hơn với luận văn hoặc phụ lục kiểm thử chức năng.
