# Rà soát học thuật so sánh cho bài báo HEMS tích hợp PLC và dự báo phụ tải

**Ngày rà soát:** 2026-07-16  
**Manuscript được đọc:** `HEMS_Paper_Canonical.docx`  
**Chế độ:** chỉ đọc; không chỉnh sửa manuscript hoặc template  
**Quyết định biên tập sơ bộ:** **Major revision trước khi nộp**

## 1. Phạm vi và phương pháp rà soát

Rà soát này đối chiếu bản thảo với 18 công trình thuộc năm nhóm: tổng quan
HEMS; kiến trúc/edge/middleware; giao diện và phản hồi người dùng; PLC và
closed-loop; forecasting, uncertainty và scheduling. Nguồn được ưu tiên từ
IEEE, Elsevier, Springer Nature, MDPI và PLOS. DOI và metadata được kiểm tra
trên trang nhà xuất bản hoặc DOI chính thức.

Đây là comparative literature audit có mục tiêu, không phải systematic review
PRISMA. Ký hiệu mức truy cập:

- **FT:** kiểm tra được nội dung toàn văn trên trang nhà xuất bản hoặc bản open access.
- **ABS:** kiểm tra metadata, abstract và section snippets; chưa đọc toàn văn.
- **META:** chỉ kiểm tra metadata/bibliography đáng tin cậy.

Bài báo hiện hành có 66 đoạn, 2 bảng, 3 hình và 22 tài liệu tham khảo. Phần nội
dung trước tài liệu tham khảo chỉ khoảng 1.386 từ; cộng nội dung bảng khoảng
1.602 từ. Mức này quá ngắn cho một system/prototype paper có đồng thời kiến
trúc, bảo mật, PLC feedback và forecasting.

## 2. Bảng so sánh 18 công trình gần đề tài

| # | Công trình, năm, DOI | Bài toán và kiến trúc | Dữ liệu/phương pháp | Baseline, chỉ số và phần cứng | Hình/bài học nên tiếp thu | Khác với đề tài hiện tại |
|---|---|---|---|---|---|---|
| 1 | Shareef et al., *Review on Home Energy Management System Considering Demand Responses, Smart Technologies, and Intelligent Controllers*, IEEE Access 2018, [DOI](https://doi.org/10.1109/ACCESS.2018.2831917) — META | Tổng quan HEMS, demand response, controller và smart technology | Tổng hợp phân loại | Không phải bài thực nghiệm | Taxonomy liên kết chức năng HEMS với công nghệ | Không có PLC feedback, RBAC hay provenance |
| 2 | Gomes et al., *Recent Techniques Used in Home Energy Management Systems: A Review*, Energies 2022, [DOI](https://doi.org/10.3390/en15082866) — FT | Systematic review về kỹ thuật tối ưu HEMS | Có research questions, search string, inclusion/exclusion và bảng mã hóa | Phân loại mathematical programming, MPC, heuristic/metaheuristic | Cách viết RQ, search strategy và comparison matrix rất rõ | Là review paper, không phải prototype |
| 3 | Han et al., *Home Energy Management Systems: A Review of the Concept, Architecture, and Scheduling Strategies*, IEEE Access 2023, [DOI](https://doi.org/10.1109/ACCESS.2023.3248502) — META | Kiến trúc, topology, communication và scheduling | Tổng quan 2015–2022 | Không có prototype của chính bài | Taxonomy kiến trúc và scheduling | Không kiểm chứng PLC/app cụ thể |
| 4 | Taghizad-Tavana et al., *An Overview of the Architecture of HEMS as Microgrids, Automation Systems, Communication Protocols, Security, and Cyber Challenges*, Sustainability 2022, [DOI](https://doi.org/10.3390/su142315938) — FT | HEMS như microgrid/automation system, có security và communication | Tổng quan kiến trúc | Không phải hardware trial | Hình kiến trúc nhiều lớp và bảng protocol/security | Rộng hơn đề tài; không có evidence gate |
| 5 | Aliero et al., *Smart Home Energy Management Systems in IoT Networks for Green Cities Demands and Services*, Environmental Technology & Innovation 2021, [DOI](https://doi.org/10.1016/j.eti.2021.101443) — ABS | Đánh giá xu hướng và hạn chế của IoT-HEMS | Tổng hợp hệ thống hiện có | Nêu thiếu security, privacy, scalability, interoperability | Bảng quality attributes và research challenges | Không xây PLC prototype |
| 6 | *Closed-loop HEMS with Renewable Energy Sources in a Smart Grid: A Comprehensive Review*, Journal of Energy Storage 2022, [DOI](https://doi.org/10.1016/j.est.2022.104609) — ABS | Trình bày HEMS như closed-loop control system | Tổng quan sensing, controller, communication, DSM/DR và scheduling | Không có phép đo của prototype | Sơ đồ closed-loop, phân loại smart appliance và monitoring device | Khái niệm closed-loop rộng; bài hiện tại có statusTag độc lập nhưng chưa đo vật lý |
| 7 | *A Review of AIoT-enabled Cyber-Physical Systems in Building Energy Management*, Applied Energy 2026, [DOI](https://doi.org/10.1016/j.apenergy.2026.127482) — ABS | AIoT-CPS cho closed-loop building energy management | PRISMA review 109 studies, framework bốn lớp | Phân tích interoperability, cyber/privacy, generalization, HMI | Strength–limitation matrix và roadmap | Là BEM review; hữu ích để định vị evidence-safe CPS |
| 8 | Motta et al., *General Overview and Proof of Concept of a Smart HEMS Architecture*, Electronics 2023, [DOI](https://doi.org/10.3390/electronics12214453) — FT | End-to-end PoC từ smart outlets, controller, middleware đến web/mobile | Wi-SUN, edge microservices, cloud, NILM | Integrity tests, hardware/consumption traces; có PoC thực | Hình tổng thể, sơ đồ middleware, ảnh board, waveform, screenshot web/mobile và bảng so sánh chức năng | Gần nhất với system paper; có phần cứng/UI evidence phong phú hơn, nhưng không có S7-1200/RBAC theo nhà |
| 9 | Ferreira et al., *Edge Computing and Microservices Middleware for HEMS*, IEEE Access 2022, [DOI](https://doi.org/10.1109/ACCESS.2022.3214229) — ABS | Middleware edge giảm phụ thuộc cloud | REST API và microservices gần thiết bị | So sánh thời gian triển khai microservice edge/cloud | Architecture reference model và performance chart | Gần backend edge của đề tài; không tập trung PLC feedback/forecast |
| 10 | Xu et al., *A Generic User Interface for Energy Management in Smart Homes*, Energy Informatics 2018, [DOI](https://doi.org/10.1186/s42162-018-0060-0) — FT | UI generic, role/permission, device models và automation scenes | Prototype tại Energy Smart Home Lab | Đánh giá định tính/định lượng; SUS 79,0 | UML data model, scene model, UI screenshots và usability result | Gần RBAC/UI; bài hiện tại chưa có user study nên không được suy diễn usability |
| 11 | Alkatheiri et al., *Cyber Security Framework for Smart Home Energy Management Systems*, SETA 2021, [DOI](https://doi.org/10.1016/j.seta.2021.101232) — ABS | Online security framework giám sát threat trong EMS | Predictive monitoring | Energy efficiency, interruption, failure, detection rate; mô phỏng | Threat model và security workflow | Bài hiện tại mạnh ở auth/RBAC contract nhưng chưa đánh giá attack detection |
| 12 | Hlayel et al., *Toward Industry 5.0: A WebSocket–S7 Bridge for Low-Latency Digital Twins*, PLOS ONE 2026, [DOI](https://doi.org/10.1371/journal.pone.0342004) — FT | Android/cloud/Node-RED kết nối PLC S7-1500 hai chiều | So sánh WebSocket–S7, MQTT, OPC UA và Modbus | RTT, p95/p99, throughput, CPU/RAM, error rate; 2.200 interaction/protocol, nhiều user | Sequence/flow, testbed, timer points, latency distribution và scalability | Gần nhất về S7/remote feedback; đề tài hiện chưa có latency thật và dùng S7-1200 |
| 13 | Cao et al., *Energy Management Optimisation Using a Combined LSTM–PSO Model*, Journal of Cleaner Production 2021, [DOI](https://doi.org/10.1016/j.jclepro.2021.129246) — ABS | Forecast heat-pump load rồi tích hợp HEMS optimization | Measured UK heat-pump data, LSTM + PSO | BPNN, SARIMA, RF, Holt-Winters; MAPE; Wilcoxon; phân tích data resolution | Actual-vs-predicted, baseline table, significance test và cost impact | Forecast được nối với outcome quản lý; bài hiện tại mới benchmark, chưa chứng minh downstream benefit |
| 14 | Lemos-Vinasco et al., *Probabilistic Load Forecasting Considering Temporal Correlation*, Applied Energy 2021, [DOI](https://doi.org/10.1016/j.apenergy.2021.117594) — ABS | Probabilistic forecast cho online HEMS | Nhà có người ở tại Đan Mạch; RLS residual và quantile–copula | Đánh giá marginal distribution và temporal correlation | Fan chart/scenario và calibration theo nhiều horizon | Bài hiện tại chỉ point forecast, chưa có uncertainty calibration |
| 15 | Semmelmann et al., *Load Forecasting for Energy Communities: A Novel LSTM-XGBoost Hybrid Model*, Energy Informatics 2022, [DOI](https://doi.org/10.1186/s42162-022-00212-9) — FT | Day-ahead forecast, tách pattern và peak | Smart meter của 130 hộ; BiLSTM + XGBoost | Standard load profile, LSTM; 12-fold CV; MAPE/RMSE; kiểm định thống kê | Actual-vs-predicted, feature importance, peak-time/peak-load, cross-fold result | Dữ liệu cộng đồng có độ gộp cao; bài hiện tại là một hộ và chưa kiểm định RF–XGB |
| 16 | Kim et al., *Stochastic Optimization of HEMS Using Clustered Quantile Scenario Reduction*, Applied Energy 2023, [DOI](https://doi.org/10.1016/j.apenergy.2023.121555) — ABS | Scheduling dưới bất định load/PV/wind | Quantile LSTM, clustering, Wasserstein-1 | Optimality gap, computation time, nhiều baseline; mô phỏng | Framework, scenario-reduction flow, cost/time trade-off | Bài hiện tại không có scheduling/optimization; chỉ nên dùng để thảo luận uncertainty |
| 17 | Zheng et al., *An Integrated Smart HEMS Model Based on a Pyramid Taxonomy*, Applied Energy 2021, [DOI](https://doi.org/10.1016/j.apenergy.2021.117159) — FT | Bốn lớp Monitoring → Forecasting → Scheduling → Coordinating | Probabilistic forecast, stochastic programming, PV-battery sharing | Rule-based/selfish scheduling; cost/economic outcomes; simulation realistic | Pyramid overview và module-to-outcome logic | Đề tài chỉ hoàn thiện monitoring/software contract và forecast benchmark, chưa scheduling/coordination |
| 18 | Mortaji et al., *Load Shedding and Smart-Direct Load Control Using IoT*, IEEE Transactions on Industry Applications 2017, [DOI](https://doi.org/10.1109/TIA.2017.2740832) — ABS | Forecast + direct load control/load shedding | ARIMA, IoT/stream analytics, mô phỏng 100 khách hàng | Outage/PAR/comfort; simulation | Load classification, priority, schedule và control logic | Không phải bằng chứng để bật auto-shedding của prototype; chỉ là nền tảng future work |

## 3. Các bài tương tự thường trình bày gì?

### 3.1. Gần như bắt buộc đối với system/prototype paper

1. **Research gap có đối tượng so sánh cụ thể.** Không chỉ nói “ít nghiên cứu”,
   mà chỉ ra từng nhóm trước đây giải quyết forecasting, middleware, security hay
   PLC latency, còn thiếu giao điểm nào.
2. **Contributions có thể kiểm chứng.** Mỗi đóng góp phải ánh xạ tới một section,
   một experiment hoặc một artifact.
3. **Kiến trúc và ranh giới hệ thống.** Có diagram thành phần, protocol, trust
   boundary và phân biệt command/telemetry.
4. **Implementation details đủ tái lập.** Phần cứng/phần mềm, phiên bản, sampling,
   endpoint, PLC tag/feedback concept, network topology và failure handling.
5. **Experimental questions.** Ví dụ: authorization isolation có đúng không;
   concurrent commands có gây lost update không; forecast có hơn seasonal
   baseline không; RTT/p95/timeout ra sao.
6. **Baseline và ablation.** Forecast paper dùng naïve/seasonal/statistical/ML;
   architecture paper dùng cloud-only, unprotected endpoint, command-only state
   hoặc protocol khác làm baseline.
7. **Nhiều loại hình bằng chứng.** Testbed photo, sequence diagram,
   actual-vs-predicted, latency distribution, error/timeout table và UI state.
8. **Discussion tách khỏi Results.** Giải thích vì sao có kết quả, trade-off,
   external validity và phạm vi không được khái quát.
9. **Data/code availability và limitations.** Đặc biệt quan trọng với HEMS vì
   dữ liệu hộ gia đình, an toàn điện và quyền riêng tư.

### 3.2. Chỉ cần khi phù hợp với đóng góp

- Screenshot app chỉ cần nếu UI/interaction là một contribution hoặc được dùng
  để chứng minh state transition. Screenshot trang trí không đủ giá trị khoa học.
- User study/SUS chỉ cần nếu bài tuyên bố usability hoặc behavior change.
- Load shedding chỉ cần nếu có thuật toán, load priority, interlock và thử nghiệm
  an toàn. Nếu chưa có, chỉ đặt ở limitations/future work.
- Forecast uncertainty/interval cần nếu output được dùng cho scheduling/control.
- Cost saving cần khi bài có tariff/scheduling; không nên tự thêm nếu hệ thống
  hiện chỉ monitoring và advisory forecast.

## 4. Đánh giá bài báo hiện tại

### 4.1. Điểm mạnh

- Bản thảo trung thực về giới hạn UCI, MAPE cao và domain mismatch.
- Có persistence/seasonal baseline, rolling-origin, nhiều seed và dispersion.
- Tách tài khoản người dùng khỏi telemetry service credential.
- Có home-scoped authorization, serialized PLC I/O và feedback tag độc lập ở
  mức software contract.
- Evidence gate và canonical result source là hướng provenance tốt, khác với
  nhiều prototype paper chỉ mô tả chức năng.
- Không biến placeholder latency hoặc auto-shedding thành kết quả.

### 4.2. CRITICAL — phải giải quyết trước khi nộp

1. **Related-work table không khớp bibliography.** Bảng nêu Gomes, Koltsaklis,
   Kim, Mortaji và Hlayel nhưng danh mục [1]–[22] không chứa các mục này theo
   mapping tương ứng. Người đọc không thể truy vết nguồn.
2. **Research gap chưa được chứng minh.** Câu “ít công trình đồng thời...” không
   dựa trên comparison matrix có citation cho từng capability. Cần thay bằng
   bảng đối chiếu 8–10 công trình đã xác minh.
3. **Thiếu phương pháp đủ tái lập.** Chưa nêu rõ toàn bộ window/horizon mapping,
   feature set, hyperparameter search, fold ranges, sample count theo split,
   preprocessing missing values và cách tổng hợp mean±SD.
4. **Không có experiment cho đóng góp PLC/security.** Bài gọi auth, telemetry,
   serialization và feedback là contributions nhưng Results chỉ có forecast.
   Cần ít nhất software-contract experiment table; nếu chưa có PLC thật phải ghi
   rõ đây không phải hardware validation.
5. **Manuscript chưa ở trạng thái nộp.** Dòng “BẢN THẢO LÀM VIỆC”, ghi chú thiếu
   tác giả/đơn vị và metadata trống phải được thay trước submission.
6. **Độ dài và chiều sâu không cân với phạm vi.** Khoảng 1.600 từ nội dung+bảng
   không đủ cho bốn contribution domains. Cần thu hẹp contribution hoặc mở rộng
   Methods/Results/Discussion trong đúng template hiện có.

### 4.3. MAJOR — ảnh hưởng mạnh tới sức thuyết phục

1. **Abstract chỉ có kết quả forecast.** Cần đủ objective → architecture/method →
   evidence classes → main result → limitation → contribution.
2. **Research questions chưa đánh số.** Đoạn giới thiệu nêu ba câu hỏi bằng văn
   xuôi nhưng Results không trả lời lần lượt.
3. **Không có dedicated Discussion.** High MAPE, XGBoost–RF gần như hòa, domain
   mismatch và trade-off inference cần được giải thích riêng.
4. **Figure set chưa đủ.** Architecture và provenance pipeline giải thích design;
   bar chart MAE/RMSE không cho thấy temporal fit, horizon degradation hoặc
   app-to-feedback behavior.
5. **Forecast comparison chưa đủ mạnh cho chữ “AI” làm trọng tâm.** XGBoost chỉ
   hơn RF khoảng 1,2% MAE, nhỏ hơn dispersion; chưa có paired test hoặc confidence
   interval của difference.
6. **Một số thông tin đã lỗi thời.** Section 6 nói rate limiting chưa đầy đủ dù
   login rate limiting đã có; cần nêu đúng phần nào đã test và phần nào còn thiếu.
7. **ISO 50001 đặt trong forecast method chưa hợp logic.** Chuyển sang background
   hoặc system requirements; tiêu chuẩn này không biện minh cho model choice.
8. **Không có data/code availability statement.** Cần chỉ rõ canonical JSON,
   dataset DOI, scripts và phần nào không thể công khai vì an toàn/credential.

### 4.4. MINOR

1. Từ khóa trộn Việt/Anh; nên thống nhất theo quy định tạp chí.
2. “random seed” nên dùng “random seeds” trong cả Việt và Anh.
3. Abstract Việt/Anh cần song song về nội dung, không chỉ tương đương gần đúng.
4. Paragraph liệt kê nhóm citation [1]–[22] là meta-text, không tạo lập luận.
5. Kết quả ở Tóm tắt và Section 5 lặp gần nguyên văn; nên tóm tắt cô đọng ở
   Abstract và diễn giải đầy đủ ở Results.
6. Inference của baseline làm tròn 0.000 dễ gây hiểu nhầm; thêm số chữ số hoặc
   ghi `<0.001 ms/sample`.

## 5. Nên bổ sung gì, ở đâu và cần bằng chứng nào?

| Ưu tiên | Nội dung | Vị trí trong cấu trúc hiện có | Vì sao/công trình đối chiếu | Bằng chứng |
|---|---|---|---|---|
| Bắt buộc | 3 RQ đánh số: architecture isolation; command-feedback safety; forecast benchmark | Cuối Giới thiệu | Gomes dùng RQ rõ; Motta ánh xạ contribution–section | Dùng nội dung hiện có |
| Bắt buộc | Related-work matrix 8–10 bài với capability và evidence type | Section 2 | Motta dùng comparison table; Gomes dùng coded attributes | Dùng nguồn đã xác minh |
| Bắt buộc | Chi tiết dataset/split/fold/seed/features/hyperparameters | Section 4 | Cao, Semmelmann và Kim mô tả pipeline và baseline đầy đủ | Canonical JSON + script hiện có; hyperparameter cần trích từ code |
| Bắt buộc | Bảng software assurance experiments | Section 5 | System paper phải kiểm chứng contribution ngoài forecast | Dùng backend/forecast/research test hiện có; ghi rõ software-only |
| Bắt buộc | Actual-vs-predicted 1–2 tuần đại diện | Section 5 | Cao và Semmelmann cho thấy temporal fit | Cần sinh từ prediction artifact chuẩn; không dùng số thủ công |
| Bắt buộc | Horizon MAE/RMSE tại h+1, h+6, h+12, h+24 | Section 5 | Multi-horizon forecast cần chỉ ra degradation | Đã có trong canonical JSON |
| Bắt buộc | Discussion riêng | Sau Results, trước Limitations | Các bài Applied Energy tách Results/Discussion | Dùng kết quả hiện tại |
| Nên có | Sequence diagram command → RBAC → queue → PLC write → status feedback → UI | Section 3 | Hlayel và Xu cho thấy flow/command model rõ | Dùng kiến trúc/code hiện có; ghi software contract |
| Nên có | Evidence classification table | Section 5 | Là đóng góp provenance đặc trưng của bài | Dùng evidence flags hiện có |
| Nên có | Paired comparison XGB–RF–seasonal trên cùng origin | Section 5 | Cao dùng Wilcoxon; Semmelmann dùng fold-wise test | Cần thêm test thống kê; 2 folds hiện quá ít, nên tăng folds |
| Nên có | Threat model table: asset, threat, control, residual risk | Section 3 | Taghizad-Tavana và Alkatheiri | Dùng code+NIST hiện có; không tự nhận physical safety |
| Tùy chọn | Một panel app `loading/success/error/timeout` | Section 3 hoặc supplement | Motta dùng screenshots; Xu đánh giá UI | Chỉ dùng nếu flow app là contribution; không gọi là usability evidence |
| Chờ dữ liệu | Boxplot/ECDF RTT và success/timeout | Section 5 | Hlayel báo p95/p99 và multi-point timing | Cần raw PLC/MFM384 trial thật; hiện không được thêm |
| Chờ dữ liệu | Local MFM384 forecast và drift | Section 5/future work | Lemos-Vinasco dùng inhabited-home data | Cần dữ liệu địa phương thật |

## 6. Nên bỏ, rút gọn hoặc chuyển vị trí

### Bỏ trước khi nộp

- “BẢN THẢO LÀM VIỆC - EVIDENCE SAFE”.
- Ghi chú “Thông tin tác giả... chưa được cung cấp”.
- Bất kỳ row nào trong related-work table không có bibliography entry và DOI
  đã xác minh.

### Rút gọn

- Paragraph liệt kê toàn bộ nhóm citation [1]–[22]. Thay bằng synthesis có lập
  luận, không mô tả cách tài liệu được xếp.
- Mô tả chung về XGBoost, RF, LSTM. Chỉ giữ phần cần cho model choice và
  reproducibility.
- Kết quả forecast lặp nguyên văn giữa Abstract và Results.
- Các tính năng app như chatbot, theme, icon, phòng hoặc admin UI nếu không phục
  vụ RQ. Các phần này phù hợp với luận văn hơn.

### Chuyển

- ISO 50001 từ Forecast method sang Background/System requirements.
- Auto-load-shedding từ contribution/result sang Limitations/Future work.
- Screenshot giao diện chi tiết sang luận văn hoặc supplementary material; bài
  báo chỉ giữ một figure nếu nó minh họa state transition.

## 7. Định vị chiến lược đề xuất

### 7.1. Loại bài phù hợp nhất

Bài hiện tại gần nhất với **system architecture + software-validated prototype
paper**, không phải forecasting/model paper và chưa phải experimental hardware
evaluation paper.

### 7.2. Đóng góp trung tâm nên chốt

1. Kiến trúc edge HEMS nhiều lớp với home-scoped authorization và telemetry
   credential tách khỏi tài khoản người dùng.
2. Software control contract tuần tự hóa PLC command và xác nhận trạng thái qua
   feedback độc lập, tránh coi command echo là trạng thái vật lý.
3. Evidence-gated reproducibility pipeline khóa dataset/metrics/artifacts bằng
   fingerprint và ngăn claim chưa có raw evidence.
4. Forecast benchmark là case study minh họa pipeline, không phải novelty chính
   của thuật toán.

### 7.3. Có nên đưa phản hồi app vào bài báo?

**Có, nhưng ở mức sequence/state evidence, không phải bộ ảnh UI.** Một figure
gộp command-feedback và một bảng test loading/success/error/timeout giúp chứng
minh system contribution. Latency chỉ được thêm sau khi có PLC thật. User study
không cần nếu không tuyên bố usability.

### 7.4. Có nên giữ model trong tiêu đề/contributions?

- Có thể giữ “load forecasting” như một module/case study.
- Không nên dùng “AI-based forecasting” như novelty chính với 2 folds và khác
  biệt XGB–RF khoảng 1,2%.
- Nếu muốn AI là contribution chính: tăng ít nhất 5 rolling folds, paired test,
  actual-vs-predicted, per-horizon error, uncertainty và local MFM384 benchmark.
- Nếu chưa làm được, giữ tiêu đề evidence-safe hiện tại hoặc đổi theo hướng
  “software-validated architecture ... with a reproducible load-forecasting
  benchmark”.

## 8. Dàn ý sửa đổi nhưng giữ nguyên template

Không thay đổi font, lề, số cột, citation style hoặc thứ tự lớn của template.
Chỉ làm sâu nội dung bên trong:

1. **Tóm tắt/Abstract:** motivation; objective; architecture; three evidence
   classes; forecast result; limitation; contribution.
2. **1. Giới thiệu:** background ngắn; limitations của ba dòng nghiên cứu;
   research essence; RQ1–RQ3; contributions; paper organization.
3. **2. Nền tảng và công trình liên quan:** HEMS architecture; PLC/edge feedback;
   forecasting; security; comparison matrix; gap synthesis.
4. **3. Kiến trúc hệ thống:** layers; trust boundaries; command vs telemetry;
   sequence diagram; threat/control table.
5. **4. Pipeline dữ liệu và dự báo:** dataset; preprocessing; split/folds;
   features; models/baselines; metrics; statistical plan; provenance.
6. **5. Kết quả hiện có và evidence gate:** software contract results; forecast
   table; actual-vs-predicted; horizon errors; evidence-class table.
7. **6. Thảo luận, hạn chế và hướng hoàn thiện:** interpretation; RF–XGB tie;
   high MAPE; domain shift; security residual risks; missing hardware evidence.
8. **7. Kết luận:** trả lời RQ; đóng góp đã chứng minh; không mở rộng claim.

## 9. Tổng hợp phản biện đa góc nhìn

- **Editor-in-Chief:** Chủ đề phù hợp HEMS/IoT/automation, nhưng manuscript quá
  ngắn và contribution chưa được chứng minh đồng đều. Quyết định: Major revision.
- **Methodology reviewer:** Forecast có baseline và rolling-origin tốt hơn nhiều
  đồ án, nhưng 2 folds, không paired test, thiếu preprocessing/hyperparameters và
  actual-vs-predicted.
- **Domain reviewer:** PLC/MFM384 và Modbus tạo tính chuyên ngành, nhưng không có
  testbed/raw log nên chỉ được gọi là architecture/software contract.
- **Cross-disciplinary reviewer:** RBAC, service credential và app state là điểm
  mạnh; cần sequence diagram và test matrix, không cần thêm chatbot.
- **Devil's Advocate:** Counter-argument mạnh nhất là “đây là ba project đặt cạnh
  nhau: app/backend, PLC concept và UCI forecast”. Bài chỉ đứng vững nếu chứng minh
  logic tích hợp bằng RQ, traceability matrix và evidence gate.

## 10. Ba danh sách kết luận

### Phải sửa trước khi nộp

1. Đồng bộ related-work table với bibliography và DOI.
2. Viết lại research gap/RQ/contributions theo comparison matrix.
3. Bổ sung Methods đủ tái lập.
4. Thêm software experiment results cho security/PLC contract.
5. Thêm actual-vs-predicted và horizon metrics.
6. Tách Discussion khỏi Results.
7. Điền metadata tác giả/đơn vị và bỏ nhãn working draft.

### Nên bổ sung để tăng sức thuyết phục

1. Sequence diagram command-feedback.
2. Evidence classification table.
3. Threat/control/residual-risk table.
4. Ít nhất 5 rolling folds và paired test.
5. Data/code availability statement.
6. Latency distribution sau khi có trial thật.

### Có thể bỏ hoặc rút gọn

1. Meta-paragraph liệt kê citation groups.
2. Chatbot/LoRA và chi tiết UI không phục vụ RQ.
3. Auto-load-shedding ngoài future work.
4. Screenshot trang trí không có state/test mapping.
5. Phần giải thích thuật toán cơ bản không cần thiết.

## 11. Kết luận cuối

Bản thảo có một hướng công bố khả thi nếu được định vị là **evidence-safe,
software-validated HEMS architecture**. Điểm khác biệt đáng bảo vệ là sự kết hợp
của home-scoped authorization, telemetry separation, serialized command,
independent feedback và canonical evidence pipeline. Forecast nên là case study
reproducible hỗ trợ hệ thống. Khi chưa có PLC/MFM384 raw trials, bài không nên
được định vị là real-hardware performance paper hoặc AI forecasting paper.
