# Canonical Document Map

## Nguồn ưu tiên hiện hành

`README.md` và `PROJECT_STATUS_CURRENT.md` là điểm vào cho trạng thái dự án.
Kết quả xác minh phần mềm ngày 10/09/2026 và bản ghi lịch sử 09/09 nằm trong
`outputs/chatbot-fix-20260909/VERIFICATION.md` khi bản ghi cục bộ đó có mặt.
`docs/DAN_Y_LUAN_VAN_CHINH_THUC_CTUT.md` là dàn ý lập kế hoạch; các mục phần
cứng, ba tầng tải, sa thải và tiết kiệm điện trong đó là đề xuất, không phải
runtime.

Hồ sơ nghiên cứu, metrics và bản thảo ngày 04/09/2026 được giữ cục bộ để truy
vết. Chúng nằm ngoài phạm vi push app + main docs của lượt này; bảng map chỉ
chỉ ra vị trí dự kiến, không khẳng định remote repository có canonical JSON,
PDF hoặc toàn bộ bằng chứng. Bản ghi layout mới nhất cục bộ nêu hai PDF TNU
8 trang; các ghi nhận 7 trang là lịch sử của phiên bản trước.

Gia cố theo `TNU_JST_Strategy.md`: lịch sử xử lý MR-01–MR-14 và điểm chưa làm
được ghi trong `research/RA_SOAT_NOI_DUNG_DINH_DANG_TNU_20260904.md`. Tên bài
TNU theo phạm vi giám sát, điều khiển từ xa và dự báo không tự đổi tên luận văn
đã đăng ký.

Tài liệu này xác định nguồn dự kiến cho từng nhóm thông tin khi tệp hiện diện
cục bộ. Các bản cũ trong `docs/archive/` chỉ để truy vết lịch sử và không được
dùng làm hướng dẫn vận hành hoặc nguồn số liệu công bố.

| Nhóm thông tin | Nguồn hiện hành duy nhất | Ghi chú |
|---|---|---|
| Tổng quan và cách chạy dự án | `README.md` | Điểm vào chính của repository |
| Trạng thái hiện tại, việc đã làm và giới hạn | `PROJECT_STATUS_CURRENT.md` | Thay cho handoff/progress/summary cũ |
| Xác minh phần mềm ngày 10/09/2026; lịch sử 09/09 | `outputs/chatbot-fix-20260909/VERIFICATION.md` | Hiện tại backend 42/42, web 21/21, frontend 22/22 và các contract phụ trợ; lịch sử giữ backend 39/39 và Android JS export 1509 modules; QA native còn chờ; bản ghi có thể chỉ ở local |
| Dàn ý luận văn | `docs/DAN_Y_LUAN_VAN_CHINH_THUC_CTUT.md` | Nguồn lập kế hoạch; ba tầng tải và kết quả phần cứng là đề xuất |
| Kế hoạch kiểm thử luận văn | `Kế_Hoạch_Kiểm_Thử_Luận_Văn.md` | Protocol evidence-safe chính thức |
| Tài liệu tham khảo | `Danh_Mục_Tài_Liệu_Tham_Khảo.md` | Phân biệt danh mục luận văn và 20 nguồn IEEE TNU; số thứ tự TNU lấy từ `ieee_refs` trong script sinh bài |
| Quy trình nghiên cứu tái lập | `research/README.md` | Raw -> metrics -> canonical -> artifacts |
| Quyền công bố claim | `research/results/canonical/canonical_results.json` | Nguồn máy đọc duy nhất |
| Bảng forecast chuẩn | `research/results/canonical/forecast_metrics.csv` | Sinh tự động từ canonical pipeline |
| Bảng hardware chuẩn | `research/results/canonical/hardware_latency.csv` | Có thể rỗng khi chưa có PLC thật |
| Workbook bản cũ tháng 7 | `outputs/20260712-smart-home-research/Smart_Home_Canonical_Results.xlsx` | Chưa sinh lại sau sửa ranh giới 04/09; không dùng làm số liệu nộp TNU |
| Bài báo bản cũ tháng 7 | `outputs/20260712-smart-home-research/HEMS_Paper_Canonical.docx` | Lưu lịch sử, TNU dùng hai bản bên dưới |
| Luận văn hiện hành | `outputs/20260712-smart-home-research/Smart_Home_Thesis_CTUT_Appendix_II.docx` | Đúng form Phụ lục II và sinh từ canonical results |
| Quy cách luận văn chính thức | `docs/templates/CTUT_Quyet_dinh_345_Phu_luc_I_II_III_2025.docx` | Phụ lục II, Quyết định 345/QĐ-ĐHKTCN ngày 08/04/2025 |
| Template bài báo chính thức | `Template_Bai_Bao_Tap_Chi_KHCN_Can_Tho.docx` | Mẫu Tạp chí Khoa học và Công nghệ Cần Thơ |
| Bản thảo TNU-JST đầy đủ thông tin | `HO_SO_NOP_BAI_BAO_TAP_CHI_DAI_HOC_THAI_NGUYEN_TNU_JST/Ban_Thao_Day_Du_Thong_Tin_TNU_JST.docx` | Hồ sơ nghiên cứu cục bộ; ngoài phạm vi push app + main docs |
| Bản thảo TNU-JST phản biện kín | `HO_SO_NOP_BAI_BAO_TAP_CHI_DAI_HOC_THAI_NGUYEN_TNU_JST/Ban_Thao_Phan_Bien_An_Danh_TNU_JST.docx` | Hồ sơ nghiên cứu cục bộ; ngoài phạm vi push app + main docs |
| Script sinh TNU duy nhất | `apply_evidence_safe_revisions.py` | Đọc số từ canonical; không sinh từ các script nháp root |
| Benchmark trong hồ sơ local | `research/results/benchmark_latest/metrics.json` | Bản ghi ngày 04/09/2026, không rerun trong sync 09–10/09 và có thể không được push |
| Kiểm tra sửa bài TNU trong hồ sơ local | `research/RA_SOAT_NOI_DUNG_DINH_DANG_TNU_20260904.md` | Trạng thái sửa và giới hạn nghiên cứu; không phải software runtime |
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
