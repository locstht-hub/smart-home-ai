# Nghiên cứu tài liệu cho đề tài HEMS tích hợp PLC Siemens S7-1200 và AI dự báo phụ tải

## Cách sàng lọc và phạm vi tài liệu

Tôi ưu tiên các bài báo công bố từ năm 2020 đến nay, tập trung đúng vào giao điểm giữa **HEMS**, **AI/Machine Learning cho dự báo phụ tải hoặc dự báo nguồn phân tán**, và **tối ưu hóa tiêu thụ điện trong nhà ở**. Danh mục dưới đây được chọn từ các nguồn xuất bản học thuật uy tín như Elsevier, IEEE và MDPI, với trọng tâm là các bài có giá trị chuyển hóa trực tiếp sang một luận văn triển khai HEMS thực nghiệm. citeturn19view0turn6view2turn18view0turn9view0turn12view0

Một điểm quan trọng là không phải tất cả bài báo đều đồng thời làm thật sâu cả hai phần “dự báo” và “tối ưu”. Trong thực tế nghiên cứu hiện nay, mảng này thường chia thành ba nhánh: **HEMS dùng ML để tạo đầu vào dự báo cho bài toán lập lịch**, **HEMS dùng DRL/RL để tối ưu điều khiển theo thời gian thực**, và **nghiên cứu dự báo phụ tải chuyên sâu nhưng được thiết kế để phục vụ trực tiếp HEMS**. Vì vậy, để phục vụ luận văn tốt nghiệp, tôi chọn một bộ tài liệu hỗn hợp gồm các bài “forecasting-first” và “optimization-first”, nhưng tất cả đều liên hệ chặt với vận hành HEMS. citeturn19view0turn16view0turn6view2turn9view0turn12view0

## Danh mục tài liệu cốt lõi

**Smart home energy management processes support through machine learning algorithms**  
**Dịch:** *Hỗ trợ các quy trình quản lý năng lượng nhà thông minh thông qua các thuật toán học máy*  

Tác giả: Nikolaos Koltsaklis, Ioannis Panapakidis, Georgios Christoforidis, Jaroslav Knápek. Tạp chí: *Energy Reports*. Năm: 2022. DOI: **10.1016/j.egyr.2022.01.033**. Bài báo trình bày một HEMS có tích hợp tải linh hoạt, xe điện và bộ lưu trữ năng lượng; hệ thống nhận các dự báo về nhu cầu phụ tải, công suất từ PV/tua-bin gió và giá điện thời gian thực để tối thiểu hóa chi phí. Điểm cốt lõi của bài là nhấn mạnh vai trò của **khối dự báo** như một đầu vào bắt buộc để HEMS vận hành bền vững và tối ưu hơn trong bối cảnh có nguồn phân tán và phụ tải biến động. citeturn19view0

Giá trị cho đề tài của bạn nằm ở việc bài này cung cấp một **kiến trúc HEMS khá “chuẩn luận văn”**: lớp đo lường dữ liệu, lớp dự báo, và lớp tối ưu lịch vận hành. Với đề tài tích hợp PLC Siemens S7-1200, bạn có thể học trực tiếp cách bài báo tổ chức đầu vào dự báo để đưa sang bộ điều khiển lập lịch, rồi chuyển hóa thành cấu trúc “PLC thực thi, AI dự báo, HMI/SCADA giám sát”. Bài cũng hữu ích khi viết phần cơ sở lý thuyết về vì sao HEMS không nên chỉ dùng điều khiển theo luật tĩnh mà cần dự báo phụ tải và giá điện. citeturn19view0

**A real-time demand-side management system considering user preference with adaptive deep Q learning in home area network**  
**Dịch:** *Hệ thống quản lý nhu cầu điện thời gian thực xét đến sở thích người dùng bằng deep Q-learning thích nghi trong mạng gia đình*  

Tác giả: Chia-Shing Tai, Jheng-Huang Hong, De-Yang Hong, Li-Chen Fu. Tạp chí: *Sustainable Energy, Grids and Networks*. Năm: 2022. DOI: **10.1016/j.segan.2021.100572**. Bài báo đề xuất một hệ thống DSM/HEMS đa tác tử theo thời gian thực, trong đó các **Deep Q-Network agents** học thích nghi thói quen sử dụng thiết bị và điều khiển các loại tải cũng như hệ lưu trữ để giảm chi phí điện. Kết quả mô phỏng cho thấy hệ thống giảm **đỉnh phụ tải 28,9%**, giảm **PAR 20,9%** và giảm **chi phí điện 28,6%**; khi áp dụng trên bộ dữ liệu REDD, hệ thống còn đạt mức giảm chi phí cao hơn nữa. citeturn16view0

Đây là tài liệu rất giá trị nếu bạn muốn đưa vào luận văn phần **thuật toán điều khiển thông minh** hoặc “sa thải/dịch chuyển phụ tải theo ưu tiên người dùng”. Điểm mạnh nhất của bài là đưa **hành vi người dùng** vào bài toán tối ưu thay vì chỉ xem phụ tải như một tín hiệu điện thuần túy. Với hướng triển khai S7-1200, bạn có thể để PLC đảm nhiệm việc đóng/cắt tải theo quyết định tác tử AI, còn phần deep Q-learning chạy ở máy tính biên hoặc máy chủ cục bộ. citeturn16view0

**Stochastic optimization of home energy management system using clustered quantile scenario reduction**  
**Dịch:** *Tối ưu hóa ngẫu nhiên cho hệ thống quản lý năng lượng hộ gia đình bằng phương pháp rút gọn kịch bản phân vị theo cụm*  

Tác giả: Minsoo Kim, Taeseop Park, Jaeik Jeong, Hongseok Kim. Tạp chí: *Applied Energy*. Năm: 2023. DOI: **10.1016/j.apenergy.2023.121555**. Bài báo đề xuất một khung HEMS xét đồng thời nhiều bất định từ **phụ tải, PV và gió**, trong đó các kịch bản bất định được sinh bằng deep learning, sau đó rút gọn bằng thuật toán **clustered quantile scenario reduction (CQSR)** để giảm thời gian tính toán mà vẫn giữ đặc trưng xác suất. Kết quả mô phỏng cho thấy **optimality gap** và **thời gian tính toán** giảm rất mạnh so với baseline, lần lượt tới **81,4%** và **93,7%** trong các trường hợp nêu trong bài. citeturn6view2

Đối với luận văn của bạn, đây là một tài liệu “xương sống” vì nó giải quyết đúng bài toán thực tế của HEMS: **dự báo luôn có sai số**, nên bộ tối ưu phải đủ vững trước bất định. Nếu bạn muốn xây dựng một HEMS dùng AI dự báo phụ tải nhưng vẫn chạy được ngoài đời thực, cách tiếp cận “dự báo phân vị + tối ưu ngẫu nhiên” trong bài này là một hướng rất mạnh. Nó đặc biệt phù hợp nếu bạn dự định phát triển thêm phần **day-ahead scheduling** hoặc tối ưu dưới ràng buộc công suất và giá điện biến thiên. citeturn6view2

**A smart home energy management system based on human activity recognition and deep reinforcement learning**  
**Dịch:** *Hệ thống quản lý năng lượng nhà thông minh dựa trên nhận dạng hoạt động con người và học tăng cường sâu*  

Tác giả: Zhouwen Wu, Xia Chen, Yujun Lin, Jinyu Wen, Yin Chen. Tạp chí: *Energy and Buildings*. Năm: 2024. DOI: **10.1016/j.enbuild.2024.114951**. Bài báo xây dựng một SHEMS kết hợp **nhận dạng hoạt động con người (HAR)** với **deep reinforcement learning theo thuật toán soft actor-critic (SAC)**. Hệ thống chia ngữ cảnh điều khiển thành hai nhóm: một nhóm ưu tiên thỏa mãn người dùng trong khi giảm chi phí điện, nhóm còn lại tập trung điều khiển DER để tham gia điều độ lưới và tạo doanh thu, từ đó biến tối ưu năng lượng sang hướng có xét đến **hành vi cư dân** và **dịch vụ phụ trợ**. citeturn18view0

Đóng góp của bài với đề tài của bạn là ở khía cạnh **mô hình hóa phụ tải theo ngữ cảnh sử dụng thực**. Nếu bạn triển khai HEMS bằng PLC, rất nhiều quyết định đóng/cắt tải sẽ hợp lý hơn khi biết thiết bị nào đang phục vụ sinh hoạt thật sự và thiết bị nào có thể trì hoãn. Bài này đặc biệt hữu ích khi bạn viết phần “điều khiển theo ưu tiên tiện nghi” hoặc “mối liên hệ giữa dữ liệu cảm biến, trạng thái thiết bị và quyết định quản trị năng lượng”. citeturn18view0

**Personalized federated learning with cost-oriented load forecasting for home energy management systems**  
**Dịch:** *Học liên kết cá nhân hóa với dự báo phụ tải hướng chi phí cho hệ thống quản lý năng lượng gia đình*  

Tác giả: Sara Barja-Martinez, Fei Teng, Adrià Junyent-Ferré, Mònica Aragüés-Peñalba. Tạp chí: *IEEE Transactions on Industry Applications*. Năm: 2025. DOI: **10.1109/TIA.2024.3462668**. Bài báo giải quyết một vấn đề rất thực tế: dự báo phụ tải cho HEMS không chỉ cần sai số nhỏ, mà còn phải giảm **chi phí kinh tế phát sinh do sai số dự báo**. Nhóm tác giả đề xuất một phương pháp **personalized federated learning** có tích hợp **cost-oriented loss function**, vừa học được đặc tính riêng của từng hộ dùng điện, vừa bảo toàn riêng tư dữ liệu từ công tơ thông minh; kết quả cho thấy phương pháp này đạt lỗi dự báo và chi phí phạt thấp hơn các hàm mất mát đối xứng truyền thống, ngay cả với các hộ có ít dữ liệu lịch sử. citeturn9view0

Đây là tài liệu rất phù hợp cho phần **AI dự báo phụ tải** trong luận văn của bạn. Nếu bạn cần một luận điểm học thuật mạnh để biện minh vì sao mô hình dự báo không nên tối ưu đơn thuần theo MAE/MSE mà nên tối ưu theo “chi phí vận hành HEMS”, thì bài này gần như là tài liệu tham chiếu lý tưởng. Với hệ thống thật dùng Siemens S7-1200, bạn có thể học cách tách lớp dữ liệu công tơ, lớp dự báo ML và lớp điều khiển PLC mà vẫn hướng đến mục tiêu kinh tế tổng thể của hệ. citeturn9view0

**Ultra-Short-Term Forecasting-Based Optimization for Proactive Home Energy Management**  
**Dịch:** *Tối ưu hóa dựa trên dự báo siêu ngắn hạn cho quản lý năng lượng chủ động trong gia đình*  

Tác giả: Siqi Liu, Zhiyuan Xie, Zhengwei Hu, Kaisa Zhang, Weidong Gao, Xuewen Liu. Tạp chí: *Energies*. Năm: 2025. DOI: **10.3390/en18153936**. Bài báo đề xuất một HEMS chủ động dựa trên **dự báo siêu ngắn hạn** cho cả phụ tải điện hộ gia đình và công suất PV, sử dụng **Graph Attention Network (GAT)** để dự báo theo cơ chế rolling intra-day. Dựa trên các dự báo đó, nhóm tác giả xây dựng một mô hình tối ưu đa mục tiêu có xét **chi phí điện, tiện nghi người dùng, giá carbon và cân bằng phụ tải lưới**, rồi giải bằng chiến lược lai **GA + Branch-and-Bound**; bài báo nhấn mạnh rằng việc tích hợp dự báo PV/phụ tải vào HEMS giúp giảm chi phí điện và phát thải mà vẫn giữ được mức tham gia của người dùng. citeturn12view0

Đây là bài sát nhất với cụm từ khóa bạn đang theo đuổi: **AI dự báo phụ tải + tối ưu HEMS chủ động**. Nếu bạn cần một “mẫu bài báo mới” để xây dựng chương phương pháp nghiên cứu, bài này gần như cho sẵn khung lý thuyết: dữ liệu cảm biến → dự báo ngắn hạn → bài toán tối ưu đa mục tiêu → lịch điều khiển tải. Nó cũng gợi ý một hướng nâng cấp tốt cho luận văn: không chỉ dự báo phụ tải ngày hôm sau, mà còn cập nhật dự báo theo cửa sổ trượt để cải thiện chất lượng điều khiển thời gian thực. citeturn12view0

## Những hướng kỹ thuật rút ra trực tiếp cho luận văn

Nhìn từ sáu tài liệu trên, một kiến trúc HEMS khả thi cho luận văn của bạn nên gồm ba lớp rõ ràng: **lớp thu thập dữ liệu và trạng thái tải**, **lớp AI dự báo**, và **lớp tối ưu/điều khiển**. Các bài của Koltsaklis, Kim và Liu đều coi dự báo phụ tải, PV và giá điện là đầu vào trung tâm cho bộ lập lịch; trong khi các bài của Tai và Wu cho thấy nếu chỉ tối ưu từ tín hiệu điện mà bỏ qua hành vi người dùng thì hiệu quả thực tế sẽ giảm. citeturn19view0turn6view2turn18view0turn12view0

Về riêng phần **dự báo phụ tải**, tài liệu của Barja-Martinez đặc biệt hữu ích vì nó chuyển trọng tâm từ “dự báo càng đúng càng tốt” sang “dự báo phải phục vụ quyết định HEMS với chi phí vận hành thấp nhất”. Còn bài của Liu gợi ý rằng nếu công trình của bạn có PV, thì tốt nhất không nên chỉ dự báo phụ tải mà nên dự báo đồng thời **phụ tải + công suất PV** để bộ tối ưu có thể ra quyết định chủ động hơn cho lưu trữ, mua điện lưới và điều khiển tải linh hoạt. citeturn9view0turn12view0

Về **tối ưu hóa và điều khiển**, có thể nhìn thấy hai nhánh rõ: nhánh **stochastic optimization** của Kim phù hợp khi bạn muốn một mô hình bài bản, dễ viết luận văn và có khả năng giải thích toán học; nhánh **deep reinforcement learning** của Tai và Wu phù hợp khi bạn muốn nhấn mạnh tính thích nghi theo thời gian thực, hành vi người dùng, hoặc điều khiển dưới điều kiện thay đổi nhanh. Đối với luận văn tốt nghiệp có triển khai hệ thống, một lựa chọn hợp lý là dùng **mô hình dự báo ML cho day-ahead/intra-day** kết hợp với **quy tắc tối ưu hoặc MILP/ràng buộc logic** ở tầng thực thi, thay vì cố huấn luyện RL hoàn toàn end-to-end trên PLC. Đây là suy luận triển khai dựa trên cách các nghiên cứu đang tách biệt lớp dự báo và lớp điều khiển. citeturn6view2turn16view0turn18view0turn12view0

## Gợi ý ghép với PLC Siemens S7-1200 trong luận văn

Từ góc nhìn triển khai, một phương án rất “đẹp luận văn” là để **Siemens S7-1200** đảm nhiệm phần **thu thập tín hiệu số/analog, liên động, bảo vệ, điều khiển đóng cắt tải, giám sát trạng thái relay/contactor, và thực thi lệnh lịch biểu**; còn phần **AI dự báo phụ tải** và **tối ưu hóa tiêu thụ** nên chạy ở tầng máy tính biên hoặc máy chủ cục bộ. Cách tách lớp này phù hợp với tinh thần của các bài HEMS hiện đại, trong đó dữ liệu đa nguồn được thu thập liên tục, khối dự báo sinh ra đầu vào cho bộ lập lịch, rồi bộ điều khiển thực thi quyết định xuống thiết bị. citeturn19view0turn6view2turn12view0

Nếu bạn muốn luận văn có chiều sâu học thuật nhưng vẫn khả thi về khối lượng triển khai, bộ tài liệu nên đọc kỹ nhất trước khi viết chương phương pháp là **Kim 2023**, **Barja-Martinez 2025** và **Liu 2025**. Lý do là ba bài này lần lượt giúp bạn xây dựng: **khung tối ưu dưới bất định**, **khung dự báo phụ tải hướng chi phí cho HEMS**, và **khung HEMS chủ động dựa trên dự báo ngắn hạn nhiều mục tiêu**. Sau đó, bạn có thể dùng **Tai 2022** và **Wu 2024** để bổ sung chiều sâu về hành vi người dùng, phụ tải linh hoạt, tiện nghi và điều khiển thông minh theo ngữ cảnh. citeturn6view2turn9view0turn12view0turn16view0turn18view0

Nếu mục tiêu của bạn là viết chương “đóng góp đề xuất”, một đóng góp hợp lý và có tính mới ở mức luận văn tốt nghiệp là: **xây dựng HEMS ba lớp gồm PLC S7-1200, AI dự báo phụ tải ngắn hạn, và bộ tối ưu lịch cho tải ưu tiên/không ưu tiên**, sau đó đánh giá theo các chỉ tiêu như **chi phí điện, peak shaving, PAR, sai số dự báo, và mức đáp ứng tiện nghi**. Nhóm chỉ tiêu này bám rất sát các hướng đánh giá của các bài báo đã chọn, nên vừa có cơ sở học thuật, vừa thuận lợi cho phần thực nghiệm và so sánh kết quả. citeturn16view0turn6view2turn18view0turn9view0turn12view0

## Trích dẫn theo chuẩn Vancouver

[1] Koltsaklis N, Panapakidis I, Christoforidis G, Knápek J. Smart home energy management processes support through machine learning algorithms. Energy Reports. 2022;8 Suppl 3:1-6. doi:10.1016/j.egyr.2022.01.033. citeturn19view0

[2] Tai CS, Hong JH, Hong DY, Fu LC. A real-time demand-side management system considering user preference with adaptive deep Q learning in home area network. Sustain Energy Grids Netw. 2022;29:100572. doi:10.1016/j.segan.2021.100572. citeturn16view0

[3] Kim M, Park T, Jeong J, Kim H. Stochastic optimization of home energy management system using clustered quantile scenario reduction. Applied Energy. 2023;349:121555. doi:10.1016/j.apenergy.2023.121555. citeturn6view2

[4] Wu Z, Chen X, Lin Y, Wen J, Chen Y. A smart home energy management system based on human activity recognition and deep reinforcement learning. Energy Build. 2024;325:114951. doi:10.1016/j.enbuild.2024.114951. citeturn18view0

[5] Barja-Martinez S, Teng F, Junyent-Ferré A, Aragüés-Peñalba M. Personalized federated learning with cost-oriented load forecasting for home energy management systems. IEEE Trans Ind Appl. 2025;61(1):1410-1419. doi:10.1109/TIA.2024.3462668. citeturn9view0

[6] Liu S, Xie Z, Hu Z, Zhang K, Gao W, Liu X. Ultra-Short-Term Forecasting-Based Optimization for Proactive Home Energy Management. Energies. 2025;18(15):3936. doi:10.3390/en18153936. citeturn12view0