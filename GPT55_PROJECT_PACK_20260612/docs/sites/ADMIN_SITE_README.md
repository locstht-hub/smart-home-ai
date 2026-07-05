# Smart Home AI Admin Site

Web admin tĩnh cho `system_admin`.

## Chức năng hiện có

- Đăng nhập bằng `POST /api/auth/login`
- Xem tổng quan số nhà, số tài khoản, số owner, số audit log
- Xem danh sách nhà bằng `GET /api/admin/homes`
- Xem danh sách tài khoản bằng `GET /api/admin/users`
- Xem lịch sử hoạt động bằng `GET /api/admin/audit-logs`

## Tài khoản quản trị

Tài khoản `system_admin` do backend cấp. Không lưu hoặc công bố mật khẩu mặc định trong repo/site public.

## API

Mặc định web gọi:

```text
https://api.smarthomeai.id.vn
```

Nếu cần đổi API, sửa hằng số `API_BASE_URL` trong `app.js`.

## Deploy Cloudflare Pages

Tạo Pages project mới và trỏ:

```text
Build command: để trống
Build output directory: admin-site
```

Tên miền gợi ý:

```text
admin.smarthomeai.id.vn
```

