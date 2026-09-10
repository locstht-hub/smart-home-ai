# Smart Home AI — Current Authoritative Status

## Current software snapshot — 2026-09-10

- Backend/control suite: **42/42** checks passed; frontend contract: **22/22** passed;
  web dashboard: **21/21** passed.
- Forecast contracts: **7 Python + 2 Node** passed; research HEAD tests: **7**
  passed; admin audit: **5** passed; room presentation: **3** passed.
- `npm run lint` and Python compilation passed. One native-artifact check remains
  skipped because generated AndroidManifest.xml/build.gradle files are absent from the clean checkout.
- Native device QA is pending (`adb` found no device and no usable AVD). No APK installation or server deployment is recorded.
- Automatic load shedding remains hard-disabled by `AUTO_LOAD_SHEDDING_KW_SAFETY_READY=False`; the three-tier policy is proposed only. See `outputs/chatbot-fix-20260909/VERIFICATION.md` and the bounded research record below.

The earlier **2026-09-09** software record is retained for traceability: backend /
control **39/39**, frontend contract **22/22**, lint, and Android JavaScript
export (**1509 modules**) passed then. The 2026-09-10 follow-up supersedes its
backend count; the export count remains historical evidence. Astra reviewed the repaired index on 2026-09-10 and found no remaining material issues within the reviewed scope.

## Hồ sơ nghiên cứu cục bộ ngày 04/09/2026 — lịch sử, không phải trạng thái phần mềm

Các đoạn dưới đây giữ nguyên bản ghi nghiên cứu cục bộ về một lượt mở rộng
Strategy ngày 04/09/2026. Lượt đồng bộ tài liệu và mã ứng dụng ngày 09–10/09/2026
không chạy lại nghiên cứu, không thay model phục vụ ứng dụng và không gửi lệnh
phần cứng. Các báo cáo, metrics và bản thảo nghiên cứu ngày 04/09 được giữ ở
working tree để truy vết nhưng nằm ngoài phạm vi push app + main docs; liên kết
chỉ có giá trị khi tệp còn hiện diện cục bộ. Phần này không khẳng định mọi bằng
chứng đã có trên GitHub hoặc là bằng chứng runtime hiện hành.

Hồ sơ ghi nhận tên bài TNU theo phạm vi giám sát, điều khiển từ xa và dự báo.
OLS, ablation và HAC được ghi là đã chạy ngoại tuyến tại
`research/results/forecast_extension_20260904/`, qua đối soát độc lập và đồng bộ
vào `benchmark_latest` cùng canonical. Không lấy checkpoint làm kết quả cuối.
Protocol: `research/FORECAST_EXTENSION_PROTOCOL.md`. Bản sao trước sửa:
`research/backups/tnu-before-extended-experiments-20260904/`.
Không thay model ứng dụng, không gọi API hoặc gửi lệnh phần cứng.

- Tên TNU: **Xây dựng mô hình giám sát, điều khiển từ xa và dự báo phụ tải hộ gia đình tích hợp IoT**.
- OLS MAE/RMSE: **0,433809/0,593665 kW**. RF: **0,421925/0,575155**;
  XGB: **0,422275/0,572849**. Sai số năm mô hình cũ tái lập đúng; thời gian
  suy luận đo lại: RF **0,189**, XGB **0,151 ms/mẫu** theo lô, không phải API/PLC.
- Ablation B/B+R/B+C/all: 86/129/102/145 biến. B+C có MAE **0,416899/0,417199**
  (RF/XGB), thấp hơn all; thêm R làm MAE tăng trong cấu hình cố định này.
  Báo cáo cả kết quả này, không chọn biến thể tốt nhất trên test làm mô hình chính.
- HAC chính 168h: XGB−RF Δ **0,000350345 kW**, CI95%
  **[−0,004784398; 0,005485088]**, pHolm **0,893616900**: chưa thấy khác biệt.
  RF−OLS/XGB−OLS pHolm **0,0000395894/0,0004868805**; chỉ là phân tích thăm dò
  chuỗi loss, không chứng minh ưu thế trên nhiều hộ hay bao phủ tái huấn luyện.
- **20/20** kiểm thử nghiên cứu; **168/168** NPZ đối soát SHA, origin/nhãn,
  MAE/RMSE và **12/12** kết quả HAC SE/CI/p/Holm tính lại độc lập đạt.
- Bảng 2 có 6 mô hình, hai nhóm chỉ tiêu một cột; Bảng 3 là ablation,
  Bảng 4 là API. Hình 4/5 và nội dung/tóm tắt/kết luận cập nhật đồng bộ.
- Thông tin tác giả giữ Khánh → Khương → Lộc → Luân, email thầy Khánh
  `ttkhanh@ctuet.edu.vn`. Không đổi tên đề tài luận văn đã đăng ký.
- Hồ sơ cục bộ đã cập nhật hai cẩm nang/tóm tắt nghiên cứu có sẵn, bảng claim–evidence,
  hướng dẫn trích dẫn và map nguồn. Chi tiết bản PDF cuối và kiểm tra trang:
  `research/LAYOUT_QA_20260904.md`.
- Metrics SHA-256: `0ddc2444a36f8b77c07dc29476e15a3ed12426ee45e56ee651ff1006c22a7114`.
- Chưa làm: đo lặp cảnh báo, độ trễ tiếp điểm/end-to-end, importance từng biến,
  benchmark nhiều hộ/nội địa hoặc vòng điều khiển AI. Nhóm tác giả cần chốt
  đóng góp, đơn vị hiện hành, đồng ý bản cuối, tài trợ/COI và khai báo AI.

## Lịch sử các lượt trước mở rộng — không thay thế trạng thái trên

Các ghi nhận dưới đây về chưa ablation/chưa baseline mới, chưa đổi tên và PDF
7 trang là lịch sử trước lượt mở rộng, không phải trạng thái bản thảo hiện hành.

**Research record timestamp:** 2026-09-04 (the 2026-09-09 software verification
record and the 2026-09-10 follow-up are separate; entries referring to the earlier
7-page revision remain bounded historical notes)
**Canonical evidence:** `research/results/canonical/canonical_results.json`

Supervisor-strategy revision 2026-09-04: author order is now Tran Trung Khanh,
Le Quoc Khuong, Nguyen Dai Loc, Tran Huu Luan; corresponding email is
ttkhanh@ctuet.edu.vn. Intro/abstract clarify prototype scope; results add
fold-wise descriptive comparisons from existing canonical runs, not a new
benchmark. Forecast-driven PLC decisions, ablation and repeated alert tests
remain unverified. See the current strategy section of the existing research
audit report. Authorship contributions/declarations and any title change still
require author confirmation. Both final PDFs remain 7 pages.

TNU layout update 2026-09-04: body now stays in two columns throughout.
Table 2 has two stacked metric groups in one column; Figure 5 stacks MAE/RMSE.
Existing prose fills the gap before Figure 6 and final reference columns are
balanced. Both PDFs remain 7 pages; body 11 pt and tables 10 pt unchanged.
No benchmark rerun or metric changes in this layout-only revision.

This file is the current project summary. Historical handoff/progress files do
not override this document, the canonical evidence JSON, or
`docs/CANONICAL_DOCUMENT_MAP.md`.

## Implemented in the current source

### Mobile app and user experience

- React Native/Expo app with dashboard, rooms/devices, quota, forecast,
  assistant/chat and account flows.
- Shared design tokens, semantic icons, accessibility labels/states, responsive
  layouts and inline authentication errors.
- Secure token storage, show/hide password, keyboard configuration for
  login/chat and hidden bottom tabs while the keyboard is open. The current
  frontend contract covers the approved Android keyboard path; native device
  QA remains pending.
- Explicit loading, success and error states for user-facing actions.

### Backend, security and PLC software contract

- Server-side sessions with logout revocation, expiry and suspended-user checks;
  bearer-only user API authentication and a separate telemetry credential.
- Home-scoped RBAC, configured CORS origins, login rate limiting, audit logging
  and fail-closed telemetry ingestion.
- Serialized PLC I/O, independent status-feedback verification, physical-device
  home isolation, idempotent repeated commands and per-device scene results.
- Collector retry backoff; mock fallback is not persisted as real telemetry in
  automatic mode.
- SQLite and PostgreSQL-compatible stores behind the Flask Backend. The app does
  not access the database or PLC directly.

### Forecast service and research pipeline

- Real-model Python forecast contract and an explicitly sample-only Node server.
- Model artifact manifest verification by SHA-256/size, request-size limits,
  malformed-timestamp rejection, unsupported-model rejection and explicit
  sample-source metadata.
- Canonical result generation, reproducible figures, a hardware trial
  collector/analyzer and evidence-safe paper/thesis working drafts.
- Real retraining is deliberately not simulated: the endpoint returns HTTP 501.

## Historical verification run on 2026-07-16

The counts in this bounded block describe the 2026-07-16 run and are retained
for history only. Use the 2026-09-09 software verification above for the
current app status.

- TypeScript/JavaScript lint gate: passed.
- Python compilation gate: passed.
- Backend security/control tests: 16/16 passed.
- Forecast contracts: 6 Python tests and 2 Node tests passed.
- Research baseline/statistics tests: 5/5 passed.
- Admin audit tests: 5/5 passed; room-presentation unit tests: 3/3 passed.
- Frontend contract: **16/20 passed** in that historical run. Four regressions
  were recorded then; this count is superseded by **22/22** on 2026-09-09 and
  remains **22/22** in the 2026-09-10 follow-up.

The forecast runtime also reports serialization-version warnings for XGBoost
and scikit-learn artifacts. Contracts pass, but artifacts should be exported in
the pinned runtime format before a production claim.

## Existing canonical forecast evidence — research record, not rerun in this sync

The following metrics are retained from the existing canonical research record.
They are not a 2026-09-09 or 2026-09-10 software run, and the research files may be absent
from the app + main docs push.

- Run completed 2026-09-04 04:20:43 UTC. Source: `research/results/benchmark_latest/metrics.json`.
- UCI source: 2,075,259 minute rows; retained last 730 days: 1,051,201 rows,
  17,521 hourly timestamps, 15,321 supervised samples before partition purging.
- Expanding rolling origin: 3 folds, seeds 42/3407/2026. At each train/validation
  and validation/test boundary, prior-partition origin + 24 h must be strictly
  earlier than the next partition's first origin. Test windows unchanged.
- Train sizes 8,402 / 10,125 / 11,848; validation 1,699 and test 1,723 per fold.
- RF test MAE 0.421924621 kW, SD 0.052660204; XGBoost 0.422274967 kW,
  SD 0.046394880. Improvements over Seasonal Naive 24 h: 18.1% / 18.0%.
- RF / XGBoost batch inference: 0.150 / 0.115 ms per sample; this is not
  end-to-end latency and cannot establish a deployment speedup over an older run.
- MAPE with denominator floor 0.2 kW: 58.1% / 58.6%; R² 0.308 / 0.313.
  Errors remain substantial; no local-household accuracy or significance claim.
- 145 features, actual factory parameters, package versions, source hashes,
  command, folds, seeds and per-horizon selected tree counts are retained.
- 13/13 research tests passed. Canonical forecast permission now requires
  verified target boundaries. This does not certify the complete system.
- Existing deployed model artifacts were NOT replaced or retrained in place.

Evidence flags remain:

- `publicDatasetBenchmark = true`
- `targetBoundariesVerified = true`
- `localMfm384Benchmark = false`
- `realHardwareLatency = false` (API response logs exist, but contact-switching
  and end-to-end hardware latency have not been measured)
- `automaticLoadShedding = false`

## Academic artifact readiness in the local research record

- Current TNU manuscript: `HO_SO_NOP_BAI_BAO_TAP_CHI_DAI_HOC_THAI_NGUYEN_TNU_JST/Ban_Thao_Day_Du_Thong_Tin_TNU_JST.docx`;
  blind version in the same folder. Source: `apply_evidence_safe_revisions.py`.
- The latest local 04/09 research layout record reports both TNU PDFs as **8
  pages**. References to 7 pages describe an earlier revision. Body Times New
  Roman 11 pt; tables/references 10 pt; Table 2 keeps its two metric groups in
  one column and Figure 5 stacks MAE/RMSE. Figure 6 is cropped from original
  screenshots without rewritten text; displayed 332/333 ms are not measurements.
- The July paper/workbook and Can Tho packages are historical drafts, not
  numerical authorities for TNU. They were not regenerated by this revision.
- Canonical thesis:
  `outputs/20260712-smart-home-research/Smart_Home_Thesis_CTUT_Appendix_II.docx`.
  It remains a working draft with missing author/advisor metadata, incomplete
  subsections, duplicated results and stale wording.
- Six TNU figures are maintained in the existing figure and submission folders.
  Screenshots support displayed content, not event timing or alert reliability.
- Revision details and remaining author checks:
  `research/RA_SOAT_NOI_DUNG_DINH_DANG_TNU_20260904.md` and
  `research/LAYOUT_QA_20260904.md`.

## Deliberately disabled, incomplete or unproven

- Automatic load shedding is hard-disabled by a safety gate.
- API latency has preserved LAN/4G logs (49 valid of 50 attempts per condition).
  Contact-switching latency, Telegram delivery latency and load-shedding trials
  remain unproven. No new LAN/4G trials were run during this revision.
- Local Cần Thơ forecast accuracy is pending genuine MFM384 data.
- SMS/Zalo/push notification delivery and software lockout/tagout are not established by the
  current canonical evidence and must not be presented as implemented.
- LoRA/Unsloth remains a research direction until model artifacts, training
  logs, runtime configuration and reproducible evaluation are preserved.
- Multi-worker PLC access is prohibited; the current server requires one worker.
- Android JavaScript export is not automatically a production APK release;
  native device testing, release signing and production network configuration
  remain separate gates. The 2026-09-09 report and 2026-09-10 follow-up record no
  APK installation or server deployment.

## Evidence policy

`research/results/canonical/canonical_results.json` is the intended authority for
experimental claims when that local research record is available. A claim whose
evidence flag is `false` must be described as a limitation, implementation
status or future work. Software contract tests must not be substituted for
physical measurements, and this document does not assert that the canonical
research files are included in the current GitHub revision.

## Required before TNU submission

- Authors confirm order, affiliation, corresponding email, contribution,
  funding/conflict statements and AI-assistance disclosure. Do not fabricate
  author declarations or submit the internal raw chat screenshot.
- Human review at print size, particularly Figure 6's low-resolution source.
- Confirm journal preference for subfigure labels: a/b were omitted at the
  user's request; the official example recommends them for multi-part figures.
- No guarantee of acceptance; no plagiarism-screening or electrical certification
  was performed. Submission/upload has not been initiated.

## Historical thesis work still pending (not part of this TNU revision)

- Fill all author, student, advisor, faculty and program metadata.
- Complete the empty research-question, requirements and test-scenario sections.
- Remove duplicated result paragraphs and repair punctuation/numbering issues.
- Reconcile the related-work table with the bibliography and verify every DOI or
  bibliographic record against a primary source.
- Add the minimum persuasive figures listed above and regenerate the canonical
  DOCX/PDF outputs only after the text and evidence are frozen.
- Increase the forecast evaluation to at least 5 rolling folds with multiple
  seeds; add horizon-wise errors and actual-vs-predicted plots.

## Required before real-load operation

- Verified electrical schematic and TIA Portal project.
- Critical-load classification, physical interlock and manual override.
- Safe test load, emergency-stop procedure and recovery test.
- At least 30 valid hardware trials per condition with preserved raw logs.
- Approved evidence gate for any automatic control claim.

Passing software tests does not make this prototype production-ready or
electrically certified.
