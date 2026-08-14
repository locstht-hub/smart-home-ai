# Báo cáo sửa lỗi và hoàn thiện Web Dashboard

Ngày thực hiện: 10/08/2026  
Địa chỉ kiểm thử: `http://127.0.0.1:8090`  
Backend kiểm thử: `http://127.0.0.1:5001`  
Nguồn dữ liệu: `Mô phỏng dự phòng / Auto fallback`

## Kết luận

Các lỗi P0 và P1 của đợt rà soát trước đã được xử lý. Web Dashboard hiện có thể dùng ổn định để trình diễn luồng phần mềm ở desktop, tablet và điện thoại; các vai trò owner, member và system_admin được tách đúng; các thao tác nguy hiểm có hộp xác nhận dùng chung; lỗi API được Việt hóa; biểu đồ và thanh điều hướng không còn tràn hoặc kéo giãn bất thường.

Bản này phù hợp để chụp ảnh minh chứng phần mềm nếu chú thích rõ dữ liệu đang là mô phỏng dự phòng. Chưa được xem là bằng chứng kiểm thử hệ thống điện thực vì đợt này không gửi lệnh tới PLC, contactor hay phụ tải vật lý.

## Nội dung đã sửa

| Nhóm | Kết quả sau sửa | Chi tiết |
| --- | --- | --- |
| Phiên đăng nhập web | Đạt | Người dùng server chỉ được khôi phục khi còn session token; thiếu token sẽ quay về đăng nhập. |
| Sai tài khoản/mật khẩu | Đạt | Lỗi 401 tại đăng nhập hiển thị thông báo đúng ngữ cảnh bằng tiếng Việt. |
| Timeout API | Đạt | Health/auth dùng timeout ngắn; đọc dữ liệu, mutation và chatbot có thời gian chờ phù hợp hơn. |
| CRUD bị timeout giả | Đạt | Mutation không retry chéo endpoint; tạo phòng, thiết bị và thành viên có bước đối soát sau lỗi không xác định. |
| Chống tạo trùng | Đạt | Backend tạo phòng và thiết bị theo tên chuẩn hóa có tính idempotent; đã có kiểm thử hồi quy. |
| Xác nhận trên web | Đạt | Thay callback `Alert.alert` bằng `ConfirmDialog` cho cảnh nhanh, phòng, thiết bị, thành viên, retrain và đăng xuất. |
| Phân quyền member | Đạt | Member không có quyền điều khiển sẽ thấy thao tác nhanh bị vô hiệu hóa; không thấy quản lý thành viên. |
| system_admin | Đạt | Tiếp tục được tách khỏi Dashboard người dùng và hướng tới Admin Site riêng. |
| Việt hóa lỗi | Đạt | Lỗi mạng, timeout, hết phiên và từ chối quyền thiết bị không còn lộ chuỗi kỹ thuật tiếng Anh cho người dùng. |
| Responsive navigation | Đạt | Thanh điều hướng dưới 980 px cao cố định 68 px, item cao 48 px và cuộn ngang. |
| Responsive biểu đồ | Đạt | Biểu đồ lấy chiều rộng container bằng `useWindowDimensions` và `onLayout`; không tràn ở năm kích thước kiểm thử. |
| Focus bàn phím | Đạt | Điều hướng và thao tác nhanh dùng vòng focus teal 2 px thay cho outline đen mặc định. |
| Phòng và thiết bị | Đạt | Card desktop cân lại tỷ lệ ảnh/nội dung; có nút xóa phòng và giải thích khi phòng còn thiết bị. |
| Quản lý thành viên | Đạt | Đưa vào cùng shell Dashboard; nút thêm không còn che nhật ký; action nguy hiểm có xác nhận. |
| Autofill | Đạt qua trình duyệt | Form thêm thành viên không bị điền nhầm dữ liệu quản trị; các trường có metadata autocomplete phù hợp. |
| Xuất PDF web | Đạt ở mức mã và hợp đồng | Web mở trang báo cáo và gọi hộp thoại in của trình duyệt để người dùng chọn Save as PDF; native giữ Expo Print/Sharing. |
| Cài đặt | Đạt | Mở phần nâng cao, làm mới trạng thái và xem thông tin PLC hoạt động; không thay đổi cấu hình trong kiểm thử. |

## Ma trận kiểm thử trình duyệt

| Kịch bản | Kết quả | Ghi chú |
| --- | --- | --- |
| Owner đăng nhập và mở Tổng quan | Đạt | Nguồn dữ liệu, quota, phòng và thao tác nhanh hiển thị đúng. |
| Owner nhập sai mật khẩu | Đạt | Hiển thị thông báo sai thông tin đăng nhập bằng tiếng Việt. |
| Member đăng nhập | Đạt | Không có quản lý thành viên; thao tác điều khiển bị vô hiệu hóa theo quyền. |
| Member gửi lệnh qua chatbot | Đạt | Backend từ chối và giao diện diễn giải bằng tiếng Việt. |
| system_admin đăng nhập | Đạt | Hiển thị ranh giới quản trị và liên kết Admin Site. |
| Mở/hủy cảnh nhanh | Đạt | Hộp xác nhận hiển thị; hủy không gửi mutation. |
| Mở/hủy khóa thành viên | Đạt | Hộp xác nhận hiển thị; hủy không đổi trạng thái tài khoản. |
| Mở form thêm thành viên | Đạt | Các trường để trống, không bị autofill chéo. |
| Cài đặt nâng cao | Đạt | Làm mới trạng thái và mở/đóng thông tin PLC thành công. |
| 1440 × 900 | Đạt | Sidebar desktop, canvas và card cân đối. |
| 1024 × 768 | Đạt | Sidebar desktop vẫn sử dụng được. |
| 979 × 768 | Đạt | Chuyển sang điều hướng ngang đúng breakpoint, không kéo giãn. |
| 768 × 900 | Đạt | Không có tràn ngang tài liệu. |
| 390 × 844 | Đạt | Nội dung bắt đầu ngay sau thanh điều hướng; biểu đồ vừa container. |

## Kết quả kiểm thử tự động

| Lệnh | Kết quả |
| --- | --- |
| `npm run typecheck` | Đạt |
| `npm run test:web-dashboard` | Đạt, 20/20 |
| `npm run test:frontend-contract` | Đạt, 20/20 |
| `npm run test:room-presentation` | Đạt, 3/3 |
| `npm run test:admin-audit` | Đạt, 5/5 |
| `npm run test:backend` | Đạt, 18/18 |

Tổng cộng: 66/66 kiểm tra đạt.

## Xác nhận backend sau khi khởi động lại

- Backend đã được khởi động lại từ mã nguồn hiện tại lúc 14:53 ngày 10/08/2026.
- Chỉ có một listener trên cổng `5001`, tiến trình Python PID `22728` chạy `app.py` với `debug=false`.
- `GET /health` trả HTTP 200, `ok=true`, service `smart-home-server`, mode `auto`.
- Hai kiểm thử chống tạo trùng phòng và thiết bị đã chạy lại sau khi khởi động và đều đạt.

## Bằng chứng hình ảnh

- `before-desktop.png`: desktop trước sửa.
- `before-mobile-390.png`: mobile trước sửa.
- `after-overview-1440.png`, `after-overview-1024.png`, `after-overview-979.png`, `after-overview-768.png`, `after-overview-390.png`: Tổng quan sau sửa ở năm kích thước.
- `after-analysis-390.png`: biểu đồ và trang phân tích ở 390 px.
- `after-rooms-1440.png`: card phòng và thao tác xóa phòng.
- `after-members-1440.png`: quản lý thành viên trong cùng Dashboard shell.
- `after-confirm-dialog-390.png`: hộp xác nhận dùng chung trên mobile web.

Các ảnh không chứa mật khẩu, API token hoặc dữ liệu xác thực.

## Giới hạn còn lại

1. Không gửi lệnh điều khiển tới PLC, contactor hoặc tải thật; cần kiểm thử phần cứng riêng với interlock và người giám sát.
2. Hộp thoại in hệ điều hành của trình duyệt không được tự động bấm trong phiên kiểm thử; bước cuối “Save as PDF” cần người dùng xác nhận thủ công.
3. Logo neon và bộ minh họa phòng vẫn có khác biệt phong cách nhẹ. Đây là vấn đề nhận diện hình ảnh mức P2, không ảnh hưởng chức năng.
4. Dữ liệu đang là mô phỏng dự phòng; ảnh chỉ chứng minh luồng giao diện/phần mềm, không chứng minh độ chính xác đo lường điện hay độ trễ PLC.

## Khuyến nghị trước khi trình diễn hoặc lấy số liệu báo cáo

1. Trước khi demo, kiểm tra lại `/health` và xác nhận nguồn dữ liệu hiển thị đúng chế độ mong muốn.
2. Nếu trình diễn với phần cứng, chạy checklist interlock/manual override/dừng khẩn trước khi cho phép điều khiển.
3. Tạo PDF thử bằng trình duyệt và kiểm tra khổ giấy, ngắt trang, dấu tiếng Việt.
4. Khi chụp minh chứng, giữ nhãn nguồn dữ liệu trong khung hình và không trộn ảnh mô phỏng với kết quả thực nghiệm.
