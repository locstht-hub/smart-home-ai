window.PROJECT_KNOWLEDGE = {
  project: {
    name: "Smart Home AI",
    subtitle: "Giám sát điện năng và điều khiển nhà thông minh dùng PLC S7-1200",
    summary:
      "Đồ án xây dựng kiến trúc đọc dữ liệu MFM384 qua PLC Siemens S7-1200 CPU 1215C và Smart Home Server API. Phần mềm đã có; đường dữ liệu phần cứng vẫn chờ kiểm chứng.",
  },
  metrics: [
    { label: "Điện áp (V)", value: "V", note: "Tag đo có thể là V1N trên MFM384/PLC" },
    { label: "Dòng điện (I)", value: "I", note: "Giá trị dòng điện hiển thị theo đơn vị A" },
    { label: "Công suất (P)", value: "kW", note: "Công suất tức thời tại thời điểm đọc" },
    { label: "Điện năng (E)", value: "kWh", note: "Tổng điện năng tiêu thụ theo thời gian" },
    { label: "Quota", value: "% hạn mức", note: "Cảnh báo khi dùng vượt mục tiêu" },
    { label: "Forecast", value: "Xu hướng", note: "Ước lượng từ dữ liệu lịch sử" },
  ],
  workflow: [
    {
      title: "MFM384 Power Meter",
      text: "Đo điện áp, dòng điện, công suất và điện năng tiêu thụ của hệ thống điện dân dụng.",
    },
    {
      title: "RS485 / Modbus RTU",
      text: "Kênh dự kiến để MFM384 truyền dữ liệu đo về PLC; chưa có raw log phần cứng xác minh trên website.",
    },
    {
      title: "PLC S7-1200 CPU 1215C",
      text: "Lớp điều khiển dự kiến xử lý tag/Data Block; chức năng write và phản hồi vật lý vẫn cần thí nghiệm.",
    },
    {
      title: "Smart Home Server API",
      text: "Backend Flask làm lớp trung gian cho app đọc dữ liệu, gửi lệnh, ghi log và gọi AI forecast.",
    },
    {
      title: "App / Website",
      text: "App hiển thị dashboard và điều khiển; website giới thiệu kiến trúc, tiến độ và chatbot dự án.",
    },
  ],
  faq: [
    {
      question: "Dự án này làm gì?",
      answer:
        "Dự án phát triển phần mềm giám sát năng lượng và kiến trúc điều khiển nhà thông minh. Luồng MFM384 - PLC - backend là mục tiêu tích hợp đang chờ bằng chứng phần cứng.",
      keywords: ["du an", "lam gi", "gioi thieu", "muc tieu", "smart home"],
    },
    {
      question: "Hệ thống gồm những thành phần nào?",
      answer:
        "Hệ thống gồm MFM384, PLC Siemens S7-1200 CPU 1215C, RS485/Modbus RTU, backend Flask, SQLite, app mobile, Forecast API và website giới thiệu.",
      keywords: ["thanh phan", "he thong", "kien truc", "phan cung"],
    },
    {
      question: "PLC S7-1200 có vai trò gì?",
      answer:
        "Trong kiến trúc, PLC là lớp điều khiển tại hiện trường, lưu tag/Data Block và cung cấp phản hồi vật lý. Các chức năng này chưa được website trình bày là đã xác minh.",
      keywords: ["plc", "s7", "1200", "1215", "siemens"],
    },
    {
      question: "MFM384 đo thông số nào?",
      answer:
        "Phiên bản hiện tại tập trung vào các thông số chính: điện áp V, dòng điện I, công suất kW và điện năng kWh. Trong PLC/MFM384, tag có thể đặt tên như V1N, I1N, Total kW và Total kWh.",
      keywords: ["mfm384", "dien ap", "dong dien", "cong suat", "kwh"],
    },
    {
      question: "Dữ liệu đi từ MFM384 về app như thế nào?",
      answer:
        "Luồng thiết kế là MFM384 -> RS485/Modbus RTU -> PLC -> Ethernet -> Smart Home Server API -> app mobile/website. Cần raw log để xác nhận luồng thực tế.",
      keywords: ["du lieu", "rs485", "modbus", "api", "app", "workflow"],
    },
    {
      question: "App có điều khiển PLC trực tiếp không?",
      answer:
        "Không nên điều khiển trực tiếp. App gửi lệnh lên backend, backend kiểm tra quyền, ghi log rồi mới chuyển lệnh xuống PLC. Cách này an toàn và dễ kiểm toán hơn.",
      keywords: ["dieu khien", "plc", "backend", "an toan", "lenh"],
    },
    {
      question: "Nút nhấn vật lý trên PLC có đồng bộ lên app không?",
      answer:
        "Có thể đồng bộ nếu chương trình PLC cập nhật trạng thái thật vào tag/Data Block và backend đọc trạng thái đó để trả về app. App nên hiển thị trạng thái phản hồi, không chỉ hiển thị lệnh vừa bấm.",
      keywords: ["nut nhan", "vat ly", "dong bo", "trang thai", "app"],
    },
    {
      question: "Forecast API hoạt động ra sao?",
      answer:
        "Kết quả canonical hiện là benchmark offline gồm persistence, seasonal baselines, Random Forest và XGBoost. Đây chưa phải dự báo vận hành từ dữ liệu PLC địa phương.",
      keywords: ["forecast", "ai", "du bao", "phu tai", "xgboost", "random forest"],
    },
    {
      question: "Chatbot trên web có phải model fine-tune chưa?",
      answer:
        "Không. Website hiện trả lời từ bộ tri thức tĩnh; không có model inference và chức năng này không thuộc kết quả benchmark dự báo.",
      keywords: ["chatbot", "fine tune", "model", "assistant"],
    },
    {
      question: "Dự án đã hoàn thiện tới đâu?",
      answer:
        "Nền tảng phần mềm đã có app, backend, database, Forecast API, website và bộ dữ liệu assistant thử nghiệm. Phần cần ưu tiên tiếp theo là kiểm thử PLC/MFM384/tải thật và thu dữ liệu thực tế.",
      keywords: ["tien do", "hoan thien", "da lam", "chua lam", "kiem thu"],
    },
  ],
};
