# Báo cáo kiểm thử chức năng và rà soát UI Web Dashboard

Ngày kiểm thử: 10/08/2026  
Địa chỉ: `http://127.0.0.1:8090`  
Backend: `http://127.0.0.1:5001`  
Nguồn dữ liệu tại thời điểm kiểm thử: `Mô phỏng dự phòng / Auto fallback`

## Kết luận ngắn

Web Dashboard đã đủ các màn hình chính và dùng tốt ở desktop để demo luồng phần mềm. Tuy nhiên, chưa nên xem là bản hoàn thiện để triển khai rộng vì còn bốn nhóm lỗi quan trọng: responsive dưới 980 px, xác nhận hành động dùng `Alert.alert` không phù hợp trên web, timeout API quá ngắn gây trạng thái thất bại giả, và phiên người dùng có thể còn hiển thị khi token web đã mất.

Đánh giá tham khảo:

- Chức năng desktop: 6.5/10.
- Giao diện desktop: 7.5/10.
- Responsive web: 3/10.
- Tính nhất quán hình ảnh: 7/10.
- Mức sẵn sàng để lấy ảnh minh chứng: 7/10, chỉ dùng ảnh desktop và phải ghi rõ dữ liệu mô phỏng.

## Ma trận kiểm thử thủ công

| Nhóm | Kết quả | Nhận xét |
| --- | --- | --- |
| Đăng nhập owner | Đạt | Đăng nhập thành công, chuyển đúng vào Dashboard và tải được trạng thái server. |
| Sai mật khẩu | Một phần | Có chặn đăng nhập nhưng thông báo `Phiên đăng nhập hoặc API token không hợp lệ` không đúng ngữ cảnh mật khẩu sai. |
| Tài khoản system_admin | Đạt | Được chặn khỏi Dashboard người dùng và hướng sang Admin Site. |
| Tài khoản member | Đạt một phần | Không thấy quản lý thành viên; cảnh phòng bị vô hiệu hóa. Tuy nhiên các nút thao tác nhanh ở Dashboard vẫn trông như có thể bấm. |
| Phiên web | Không đạt | Khi token trong `sessionStorage` mất nhưng `currentUser` còn, shell Dashboard vẫn xuất hiện một lúc với trạng thái chưa kết nối. |
| Tổng quan | Đạt | Hiển thị công suất, điện áp, dòng, quota, nguồn dữ liệu và liên kết tới phân tích. |
| Modal quota | Đạt ở mức giao diện | Mở/đóng đúng; không thay đổi quota thật trong đợt kiểm thử. |
| Phòng và thiết bị | Đạt một phần | Danh sách, ảnh phòng, chi tiết phòng và trạng thái thiết bị thủ công hiển thị đúng. |
| Tạo phòng | Không đạt ổn định | Client báo `signal is aborted without reason`, nhưng backend vẫn tạo phòng sau đó. Điều này có thể làm người dùng bấm lại và tạo trùng. Phòng QA đã được xóa sau kiểm thử. |
| Xóa phòng | Thiếu UI | Backend có endpoint xóa nhưng danh sách phòng chưa có thao tác xóa. |
| Thêm thiết bị | Đạt ở mức giao diện | Modal mở đúng; không gửi dữ liệu vì lỗi timeout CRUD cần được xử lý trước. |
| Điều khiển tải | Chưa kiểm thử vật lý | Thiết bị khai báo thủ công được vô hiệu hóa đúng. Không gửi lệnh tải thật để tránh tác động PLC/contactor. |
| Cảnh nhanh | Không đạt trên web | Các hành động xác nhận qua `Alert.alert` không thực thi callback trên Web Dashboard. |
| Phân tích và dự báo | Đạt một phần | Hiển thị nguồn mock rõ ràng, tải được lịch sử API và nút làm mới hoạt động. |
| Xuất PDF | Chưa kiểm thử hết | Không mở hộp thoại chia sẻ hệ điều hành trong kiểm thử tự động. Mã hiện dùng luồng native `expo-print` + `expo-sharing`. |
| Retrain | Không đạt trên web | Bấm nút không đi tiếp vì luồng xác nhận dùng `Alert.alert`. |
| Chatbot tra cứu | Đạt | Trả lời truy vấn điện năng, thời gian phản hồi ghi nhận khoảng 5,3 giây. |
| Chatbot phân quyền | Đạt ở backend | Member không có quyền gửi lệnh và server trả `Device permission denied`; cần Việt hóa thông báo. |
| Quản lý thành viên | Đạt một phần | Danh sách, nhật ký, modal thêm và modal đổi mật khẩu hiển thị được. |
| Tạm khóa/xóa thành viên | Không đạt trên web | Nút có phản hồi bấm nhưng callback xác nhận `Alert.alert` không chạy; trạng thái member vẫn `active`. |
| Autofill biểu mẫu thành viên | Không đạt | Trình duyệt tự điền username quản trị vào ô điện thoại và mật khẩu vào form tạo thành viên. |
| Cài đặt | Đạt một phần | Mở phần nâng cao, làm mới trạng thái và xem thông tin PLC được. Các chức năng dựa vào `Alert.alert` vẫn không phù hợp trên web. |

## Rà soát UI và hình ảnh

### Điểm tốt

- Bảng màu xanh rêu–teal, nền sáng và card tối tạo cảm giác phù hợp với giám sát năng lượng.
- Trạng thái nguồn `PLC`, `Mô phỏng dự phòng`, `Auto fallback` được trình bày rõ, có giá trị cho báo cáo khoa học.
- Bộ năm ảnh phòng có cùng kích thước, nét vẽ, nền bo góc và màu trung tính; không bị lệch hoặc méo.
- Icon, số liệu và nhãn trong trang tổng quan có phân cấp khá rõ; số dùng tabular numerals.
- Trang đăng nhập có nền mạch điện nhẹ, logo và form dễ nhận diện.

### Điểm cần sửa

- Logo neon xanh–tím mang phong cách cyberpunk, trong khi ảnh phòng là line-art màu be/xanh rêu. Hai hệ hình ảnh chưa cùng một ngôn ngữ thị giác.
- Card phòng desktop cao khoảng 178 px nhưng ảnh chỉ 58 px, tạo nhiều khoảng trắng và làm hình minh họa bị nhỏ so với diện tích card.
- Các màn hình vốn thiết kế theo mobile đang được kéo rộng trong canvas desktop; một số card quá dài và thiếu bố cục dashboard chuyên biệt.
- Trang quản lý thành viên tách khỏi sidebar, dùng header tối toàn chiều ngang và nút cố định phía dưới che một phần nhật ký. Phong cách này chưa đồng nhất với shell Dashboard.
- Nhiều tiêu đề dùng font hệ thống với trọng lượng 800–900; giao diện rõ nhưng hơi nặng và chưa có bản sắc typography riêng.
- Focus outline màu đen trên một số hàng cài đặt quá mạnh so với bảng màu xanh rêu.
- Thông báo lỗi còn lẫn tiếng Anh hoặc lỗi kỹ thuật thô: `signal is aborted without reason`, `Device permission denied`.
- Form tạo phòng/thiết bị và nhiều nút modal chưa khai báo đầy đủ `accessibilityRole`, nên snapshot chỉ nhận là `generic`.

## Responsive

- Ở 1024 px: bố cục desktop còn sử dụng được nhưng khá chật.
- Ngay dưới breakpoint 980 px: sidebar biến thành thanh điều hướng ngang nhưng mỗi mục bị kéo cao gần 360 px. Phần nội dung bị đẩy xuống dưới màn hình đầu tiên.
- Ở 390 px: người dùng chỉ thấy các card điều hướng rất lớn; nội dung chính bắt đầu quá thấp và bị cắt ngang.
- Biểu đồ phân tích dùng `Dimensions.get('window').width` tại thời điểm module được tải. Khi đổi kích thước, biểu đồ không co lại đúng và bị tràn/cắt trên màn hình hẹp.

## Thứ tự ưu tiên sửa

1. **P0:** Sửa mobile navigation dưới 980 px; đặt chiều cao cố định khoảng 48–56 px và không để item bị stretch theo chiều dọc.
2. **P0:** Thay các luồng xác nhận `Alert.alert` bằng modal xác nhận dùng chung cho web và mobile.
3. **P0:** Tăng timeout cho các thao tác CRUD hoặc tách timeout local hợp lý; xử lý idempotency để không tạo trùng khi client timeout nhưng server đã ghi dữ liệu.
4. **P0:** Nếu không còn token phiên web thì xóa `currentUser` và quay về trang đăng nhập ngay.
5. **P1:** Ẩn/vô hiệu hóa toàn bộ thao tác điều khiển ở Dashboard khi người dùng không có `canManageDevices`.
6. **P1:** Việt hóa và phân loại lỗi đăng nhập, lỗi quyền và lỗi kết nối.
7. **P1:** Bổ sung `autoComplete` phù hợp cho form thêm thành viên và ngăn autofill sai trường.
8. **P1:** Dùng `useWindowDimensions()` cho biểu đồ và giới hạn chiều rộng theo container thực tế.
9. **P2:** Tăng tỷ lệ ảnh phòng hoặc chuyển card phòng sang bố cục ảnh trái–thông tin phải để giảm khoảng trắng.
10. **P2:** Đồng bộ phong cách logo với bộ ảnh phòng, chuẩn hóa font và đưa màn quản lý thành viên vào cùng shell Dashboard.

## Tệp ảnh kiểm thử

- `01-overview-desktop.png`: tổng quan desktop.
- `02-analysis-desktop.png`: phân tích desktop.
- `03-rooms-desktop.png`: phòng và thiết bị desktop.
- `04-members-desktop.png`: quản lý thành viên.
- `05-settings-desktop.png`: cài đặt nâng cao.
- `06-overview-1024.png`: bố cục 1024 px.
- `07-overview-979.png`: lỗi breakpoint 979 px.
- `08-overview-390.png`: lỗi bố cục điện thoại.
- `09-analysis-390.png`: trang phân tích trên điện thoại.
- `10-chart-390.png`: biểu đồ bị cắt/tràn ở 390 px.

## Kiểm thử tự động bổ sung

- Web Dashboard: 12/12 đạt.
- Frontend contract: 20/20 đạt.
- Room presentation: 3/3 đạt.
- Admin audit: 5/5 đạt.

Các kiểm thử tự động hiện chưa bắt được lỗi co giãn chiều cao của navigation, callback `Alert.alert` trên web, autofill và trạng thái server ghi thành công sau khi client timeout. Đây là khoảng trống cần bổ sung vào bộ test.
