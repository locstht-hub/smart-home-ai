window.PROJECT_KNOWLEDGE = {
  project: {
    name: "Smart Home AI",
    subtitle: "Giám sát điện năng và điều khiển nhà thông minh dùng PLC S7-1200",
    summary:
      "Đồ án xây dựng hệ thống đọc dữ liệu điện năng từ MFM384, đưa về PLC Siemens S7-1200 CPU 1215C, truyền dữ liệu lên Smart Home Server API và hiển thị trên app/web.",
  },
  metrics: [
    { label: "Điện áp", value: "V1N", note: "Thông số từ MFM384/PLC" },
    { label: "Dòng điện", value: "I1N", note: "Theo dõi tải theo thời gian" },
    { label: "Công suất", value: "Total kW", note: "Dùng cho dashboard hiện tại" },
    { label: "Điện năng", value: "Total kWh", note: "Dùng cho quota và forecast" },
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
      text: "MFM384 truyền dữ liệu đo về PLC qua RS485 theo giao thức Modbus RTU.",
    },
    {
      title: "PLC S7-1200 CPU 1215C",
      text: "PLC nhận dữ liệu, xử lý logic, lưu tag/Data Block và phản hồi trạng thái thiết bị.",
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
        "Dự án giám sát điện năng và hỗ trợ điều khiển nhà thông minh. Dữ liệu được đo bằng MFM384, đưa về PLC S7-1200, sau đó backend đọc và hiển thị lên app/web.",
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
        "PLC là lớp điều khiển tại hiện trường. PLC nhận dữ liệu từ MFM384, xử lý logic, lưu tag/Data Block và là nơi đồng bộ trạng thái nút nhấn vật lý hoặc relay về app.",
      keywords: ["plc", "s7", "1200", "1215", "siemens"],
    },
    {
      question: "MFM384 đo thông số nào?",
      answer:
        "Bản demo tập trung vào các thông số chính như V1N, I1N, Total kW và Total kWh. Các thông số này dùng cho dashboard, quota và mô hình dự báo phụ tải.",
      keywords: ["mfm384", "dien ap", "dong dien", "cong suat", "kwh"],
    },
    {
      question: "Dữ liệu đi từ MFM384 về app như thế nào?",
      answer:
        "Luồng dữ liệu là MFM384 -> RS485/Modbus RTU -> PLC -> Ethernet -> Smart Home Server API -> app mobile/website.",
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
        "Forecast API dùng dữ liệu lịch sử điện năng để dự báo xu hướng tiêu thụ trong tương lai. Hiện có pipeline cho XGBoost, Random Forest, LSTM và CNN-LSTM; khi có dữ liệu thật từ PLC thì nên retrain lại.",
      keywords: ["forecast", "ai", "du bao", "phu tai", "xgboost", "lstm"],
    },
    {
      question: "Chatbot trên web có phải model fine-tune chưa?",
      answer:
        "Bản web hiện tại là chatbot tri thức tĩnh để trả lời nhanh trên Cloudflare Pages. Model fine-tune bằng Unsloth có thể thay thế sau, nhưng cần backend inference API hoặc model server để web gọi tới.",
      keywords: ["chatbot", "fine tune", "unsloth", "model", "assistant"],
    },
    {
      question: "Dự án đã hoàn thiện tới đâu?",
      answer:
        "Nền tảng phần mềm đã có app, backend, database, Forecast API, website và bộ dữ liệu assistant thử nghiệm. Phần cần ưu tiên tiếp theo là kiểm thử PLC/MFM384/tải thật và thu dữ liệu thực tế.",
      keywords: ["tien do", "hoan thien", "da lam", "chua lam", "kiem thu"],
    },
  ],
};
