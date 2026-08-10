# Web Dashboard người dùng

Web Dashboard dùng chung mã Expo, AuthContext, DataContext, ForecastContext và SmartHomeApiClient với ứng dụng di động. `admin-site/` vẫn là cổng riêng cho `system_admin` và không được gộp vào Dashboard người dùng.

## Phạm vi chức năng

- Đăng nhập, đăng xuất, đổi mật khẩu và lưu phiên trong `sessionStorage` trên trình duyệt.
- Tổng quan điện áp, dòng điện, công suất, điện năng, nguồn dữ liệu, chế độ vận hành, trạng thái PLC/API và Quota.
- Phòng, thiết bị, cảnh điều khiển và phản hồi trạng thái từ server/PLC.
- Lịch sử điện năng, dự báo, bất thường và khuyến nghị.
- Quản lý thành viên dành cho chủ nhà có quyền tương ứng.
- Chatbot dùng endpoint `/api/assistant/chat`; bản web không yêu cầu quyền micro.
- Cài đặt tài khoản và thông tin kết nối. Backend tiếp tục là nơi quyết định quyền cuối cùng.

## Chạy và kiểm tra cục bộ

Yêu cầu Node.js và dependencies của dự án đã được cài đặt.

```powershell
npm run web
```

Mặc định Expo mở trang phát triển trên localhost. Dữ liệu thật vẫn đến từ API đã cấu hình; các trạng thái mô phỏng được gắn nhãn rõ trên giao diện.

Trước khi đóng gói:

```powershell
npm run typecheck
npm run lint
npm run test:frontend-contract
npm run test:admin-audit
npm run test:web-dashboard
npm run verify
npm run build:web
```

Lệnh cuối tạo thư mục `dist/`. Tệp `public/_redirects` được Expo sao chép vào output để Cloudflare Pages phục vụ SPA khi người dùng tải lại đường dẫn.

## Chuẩn bị Cloudflare Pages

Thiết lập một Pages project riêng cho Dashboard, không dùng chung project của website giới thiệu hoặc Admin Site.

- Production branch: nhánh triển khai do nhóm dự án chọn.
- Build command: `npm run build:web`.
- Build output directory: `dist`.
- Biến môi trường tùy chọn cho Forecast API: `EXPO_PUBLIC_FORECAST_API_URL`, bắt buộc dùng HTTPS ở production.
- Custom domain dự kiến: `dashboard.smarthomeai.id.vn`.

Chỉ thực hiện deploy và tạo DNS khi có yêu cầu riêng. Tài liệu này không thay đổi trạng thái Cloudflare.

## CORS phía backend

Thêm origin Dashboard vào `security.allowedOrigins` của cấu hình backend đang chạy:

```json
"https://dashboard.smarthomeai.id.vn"
```

Mẫu đã được cập nhật trong `backend/smart_home_server/config.example.json`. Không dùng `*` cùng cookie hoặc dữ liệu xác thực. Sau khi sửa cấu hình thật, khởi động lại backend và kiểm tra preflight từ đúng domain production.

## Quy tắc HTTPS và phiên đăng nhập

- Production web chỉ gọi endpoint HTTPS. HTTP mạng LAN chỉ được phép ở bản development khi bật rõ `EXPO_PUBLIC_ALLOW_INSECURE_LAN_HTTP=true`.
- Token web nằm trong `sessionStorage`, không nằm trong URL hoặc nội dung hiển thị.
- Đăng xuất luôn xóa phiên phía trình duyệt và cố gắng thu hồi token phía server.
- `viewer` không được điều khiển; `member` chỉ điều khiển khi có `canManageDevices`; chỉ `owner` có `canManageMembers` mới thấy chức năng quản lý thành viên.
- `system_admin` được hướng sang Admin Site tách biệt.

## Kiểm tra sau khi triển khai

1. Mở trang bằng HTTPS và đăng nhập lần lượt bằng owner, member, viewer và system_admin.
2. Xác nhận owner thấy Quota và quản lý thành viên; viewer không thể gửi lệnh thiết bị.
3. Tắt backend để kiểm tra banner lỗi, sau đó bật lại và làm mới dữ liệu.
4. Gửi một lệnh thiết bị và đối chiếu trạng thái yêu cầu với phản hồi PLC.
5. Kiểm tra các nhãn nguồn `PLC S7-1200`, `Mô phỏng dự phòng` và chế độ hiệu lực.
6. Tải lại trang ở một đường dẫn SPA để xác nhận `_redirects` hoạt động.
7. Kiểm tra console trình duyệt không có mixed-content, CORS hoặc token leak.
