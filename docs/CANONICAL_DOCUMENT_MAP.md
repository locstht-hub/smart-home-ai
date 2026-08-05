# Canonical Document Map

Tài liệu này xác định một nguồn hiện hành duy nhất cho mỗi nhóm thông tin. Các bản cũ được lưu trong `docs/archive/` chỉ để truy vết lịch sử và không được dùng làm hướng dẫn vận hành hoặc nguồn số liệu công bố.

| Nhóm thông tin | Nguồn hiện hành duy nhất | Ghi chú |
|---|---|---|
| Tổng quan và cách chạy dự án | `README.md` | Điểm vào chính của repository |
| Trạng thái hiện tại, việc đã làm và giới hạn | `PROJECT_STATUS_CURRENT.md` | Thay cho handoff/progress/summary cũ |
| Kế hoạch kiểm thử luận văn | `Kế_Hoạch_Kiểm_Thử_Luận_Văn.md` | Protocol evidence-safe chính thức |
| Tài liệu tham khảo | `Danh_Mục_Tài_Liệu_Tham_Khảo.md` | Chỉ chứa nguồn đã xác minh |
| Quy trình nghiên cứu tái lập | `research/README.md` | Raw -> metrics -> canonical -> artifacts |
| Quyền công bố claim | `research/results/canonical/canonical_results.json` | Nguồn máy đọc duy nhất |
| Bảng forecast chuẩn | `research/results/canonical/forecast_metrics.csv` | Sinh tự động từ canonical pipeline |
| Bảng hardware chuẩn | `research/results/canonical/hardware_latency.csv` | Có thể rỗng khi chưa có PLC thật |
| Workbook hiện hành | `outputs/20260712-smart-home-research/Smart_Home_Canonical_Results.xlsx` | Không chỉnh số liệu thủ công |
| Bài báo hiện hành | `outputs/20260712-smart-home-research/HEMS_Paper_Canonical.docx` | Sinh từ canonical results |
| Luận văn hiện hành | `outputs/20260712-smart-home-research/Smart_Home_Thesis_CTUT_Appendix_II.docx` | Đúng form Phụ lục II và sinh từ canonical results |
| Quy cách luận văn chính thức | `docs/templates/CTUT_Quyet_dinh_345_Phu_luc_I_II_III_2025.docx` | Phụ lục II, Quyết định 345/QĐ-ĐHKTCN ngày 08/04/2025 |
| Template bài báo chính thức | `Template_Bai_Bao_Tap_Chi_KHCN_Can_Tho.docx` | Mẫu Tạp chí Khoa học và Công nghệ Cần Thơ |
| Backend/API | README trong từng thư mục `backend/*` | Không dùng bản sao trong GPT55 pack |
| Hướng dẫn ứng dụng | `HUONG_DAN_SU_DUNG_APP.md` | Bản root là nguồn cập nhật |
| Mục tiêu và tên đề tài | `Báo_Cáo_Mục_Tiêu_Nghiên_Cứu_Và_Tên_Đề_Tài.md` | DOCX cũ đã lưu archive |
| Cẩm nang phản biện | `Cẩm_Nang_Phản_Biện_Đồ_Án.md` | DOCX cũ đã lưu archive |

## Quy tắc chống trùng lặp

- Không tạo thêm file có tên `final`, `final_v2`, `hoan_chinh` hoặc `latest` bằng cách sao chép thủ công.
- Sửa nội dung nguồn Markdown/script trước, sau đó chạy generator để tạo Word, Excel và hình.
- `GPT55_PROJECT_PACK_20260612/` là snapshot lịch sử, không phải nguồn hiện hành.
- File trong `docs/archive/` không được trích dẫn như trạng thái hiện tại.
- Ảnh logo trong `assets/`, `project-site/assets/` và Android resource có thể trùng byte nhưng được giữ vì mỗi build target cần đường dẫn riêng.
