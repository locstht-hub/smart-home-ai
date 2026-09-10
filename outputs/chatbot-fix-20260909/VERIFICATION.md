# Báo cáo xác minh sửa Chatbot và bàn phím

Ngày kiểm tra gốc: 2026-09-09

## Cập nhật xác minh phần mềm ngày 10/09/2026

- Backend/control suite: **42/42** kiểm thử đạt.
- Frontend contract: **22/22**; web dashboard: **21/21**.
- Forecast contracts: **7 Python + 2 Node**; research HEAD: **7**; admin audit:
  **5**; room presentation: **3**. Các nhóm này đều đạt.
- `npm run lint` và Python compilation đạt.
- Một native-artifact check được bỏ qua vì bản checkout sạch không có các tệp AndroidManifest.xml/build.gradle sinh tự động; QA trên thiết bị thật vẫn chờ. Không ghi nhận cài APK hoặc triển khai server.

Đây là follow-up kỹ thuật ngày 10/09, không phải kiểm tra xuất bản. Astra đã duyệt index đã sửa ngày 10/09 và không còn lỗi đáng kể trong phạm vi rà soát. Backend cuối đạt 42/42 trong 61.077 giây. Không dùng báo cáo này để gọi hồ sơ
nghiên cứu là đã xuất bản hoặc bài báo đã được chấp nhận.

## Bản ghi xác minh gốc ngày 09/09/2026

- Frontend contract: **22/22** kiểm thử đạt.
- `npm run lint`: đạt.
- `npx expo export --platform android --output-dir outputs/chatbot-fix-20260909/android-bundle`: đạt, bundler xử lý **1509 modules**.

## QA native

Chưa thực hiện QA trên thiết bị thật: `adb` không phát hiện thiết bị và máy ảo không có AVD khả dụng.

Checklist trên điện thoại khi có thiết bị:

1. Lặp lại thao tác focus ô nhập rồi đóng bàn phím; composer vẫn hiển thị đúng.
2. Nhập nội dung nhiều dòng; kiểm tra toàn bộ nội dung và nút gửi đều nhìn thấy.
3. Gửi tin nhắn; kiểm tra tin nhắn mới nhất có thể truy cập được.
4. Chuyển tab khi bàn phím đang hiện và đã đóng; kiểm tra bố cục và thanh tab ổn định.

Không ghi nhận việc cài APK hoặc triển khai server trong báo cáo này.

## Backend trong bản ghi 09/09

Trạng thái backend: **39/39** kiểm thử đạt trong 53.962 giây; kiểm tra socket mạng bị chặn trong môi trường xác minh.

Đã xác minh các đường đi an toàn cho phủ định, câu hỏi trạng thái/giải thích, lệnh bật/tắt hỗn hợp, loại trừ, ranh giới alias, ưu tiên dự báo, giới hạn phạm vi thiết bị và lỗi PLC; câu hỏi trạng thái không tự suy diễn thiết bị đang tắt khi dữ liệu PLC không khả dụng.

Astra đã rà soát bản ghi 09/09 và xác nhận không còn lỗi đáng kể trong phạm vi
backend khi đó. Frontend contract **22/22**, lint và Android export giữ nguyên
kết quả lịch sử đã ghi ở trên. Đây không phải kết luận cho follow-up 10/09; không
triển khai server và không cài APK.

Tài liệu tham khảo keyboard: https://docs.swmansion.com/react-native-reanimated/docs/device/useAnimatedKeyboard/
