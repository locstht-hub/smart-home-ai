const fs = require("fs");
const path = require("path");
const {
  AlignmentType,
  BorderStyle,
  Document,
  Footer,
  Header,
  HeadingLevel,
  LevelFormat,
  Packer,
  PageBreak,
  PageNumber,
  Paragraph,
  ShadingType,
  Table,
  TableCell,
  TableRow,
  TextRun,
  VerticalAlign,
  WidthType,
} = require("docx");

const OUTPUT = path.resolve(
  "outputs/20260712-smart-home-research/Huong_Dan_Thu_Thap_Du_Lieu_Thuc_Nghiem_HEMS.docx",
);

const PAGE_WIDTH = 11906;
const PAGE_HEIGHT = 16838;
const MARGIN = 1134;
const CONTENT_WIDTH = 9600;
const NAVY = "17365D";
const BLUE = "D9EAF7";
const PALE_BLUE = "EEF5FA";
const GREEN = "E2F0D9";
const YELLOW = "FFF2CC";
const RED = "F4CCCC";
const GRAY = "E7E6E6";
const WHITE = "FFFFFF";
const BORDER = { style: BorderStyle.SINGLE, size: 4, color: "AAB7C4" };
const BORDERS = { top: BORDER, bottom: BORDER, left: BORDER, right: BORDER };

function run(text, options = {}) {
  return new TextRun({ text, font: options.font || "Arial", size: options.size || 22, ...options });
}

function paragraph(text, options = {}) {
  const children = Array.isArray(text) ? text : [run(text, options.run || {})];
  return new Paragraph({
    children,
    alignment: options.alignment,
    spacing: options.spacing || { after: 100, line: 300 },
    keepNext: options.keepNext,
    pageBreakBefore: options.pageBreakBefore,
    border: options.border,
    shading: options.shading,
    indent: options.indent,
  });
}

function heading(text, level = 1, pageBreakBefore = false) {
  const map = {
    1: HeadingLevel.HEADING_1,
    2: HeadingLevel.HEADING_2,
    3: HeadingLevel.HEADING_3,
  };
  return new Paragraph({
    heading: map[level],
    pageBreakBefore,
    children: [run(text, { bold: true })],
  });
}

function bullet(text, level = 0, reference = "bullets") {
  return new Paragraph({
    numbering: { reference, level },
    spacing: { after: 70, line: 280 },
    children: [run(text)],
  });
}

function numbered(text, level = 0, reference = "steps") {
  return new Paragraph({
    numbering: { reference, level },
    spacing: { after: 80, line: 290 },
    children: [run(text)],
  });
}

function codeBlock(lines) {
  return new Paragraph({
    spacing: { before: 80, after: 140, line: 250 },
    indent: { left: 240, right: 240 },
    shading: { fill: "F3F5F7", type: ShadingType.CLEAR },
    border: {
      top: { style: BorderStyle.SINGLE, size: 4, color: "C7D0D9" },
      bottom: { style: BorderStyle.SINGLE, size: 4, color: "C7D0D9" },
      right: { style: BorderStyle.SINGLE, size: 4, color: "C7D0D9" },
    },
    children: lines.flatMap((line, index) => [
      run(line, { font: "Consolas", size: 18 }),
      ...(index < lines.length - 1 ? [new TextRun({ break: 1 })] : []),
    ]),
  });
}

function noteBox(title, text, fill = YELLOW) {
  return new Table({
    width: { size: CONTENT_WIDTH, type: WidthType.DXA },
    columnWidths: [CONTENT_WIDTH],
    rows: [
      new TableRow({
        children: [
          new TableCell({
            width: { size: CONTENT_WIDTH, type: WidthType.DXA },
            borders: BORDERS,
            shading: { fill, type: ShadingType.CLEAR },
            margins: { top: 120, bottom: 120, left: 160, right: 160 },
            children: [
              paragraph([run(`${title}: `, { bold: true, color: NAVY }), run(text)], {
                spacing: { after: 0, line: 285 },
              }),
            ],
          }),
        ],
      }),
    ],
  });
}

function cell(text, width, options = {}) {
  const lines = String(text).split("\n");
  return new TableCell({
    width: { size: width, type: WidthType.DXA },
    verticalAlign: VerticalAlign.CENTER,
    borders: BORDERS,
    shading: options.fill ? { fill: options.fill, type: ShadingType.CLEAR } : undefined,
    margins: { top: 90, bottom: 90, left: 110, right: 110 },
    children: lines.map((line) =>
      paragraph([run(line, { bold: options.bold, color: options.color, size: options.size || 19 })], {
        alignment: options.alignment,
        spacing: { after: 30, line: 245 },
      }),
    ),
  });
}

function table(headers, rows, widths) {
  return new Table({
    width: { size: CONTENT_WIDTH, type: WidthType.DXA },
    columnWidths: widths,
    rows: [
      new TableRow({
        tableHeader: true,
        children: headers.map((header, i) =>
          cell(header, widths[i], {
            bold: true,
            fill: NAVY,
            color: WHITE,
            alignment: AlignmentType.CENTER,
          }),
        ),
      }),
      ...rows.map(
        (row, rowIndex) =>
          new TableRow({
            children: row.map((value, i) =>
              cell(value, widths[i], { fill: rowIndex % 2 === 0 ? "F8FBFD" : WHITE }),
            ),
          }),
      ),
    ],
  });
}

function spacer(after = 100) {
  return new Paragraph({ spacing: { after }, children: [] });
}

const children = [];

children.push(
  spacer(900),
  paragraph([run("HƯỚNG DẪN TỪNG BƯỚC", { bold: true, size: 36, color: NAVY })], {
    alignment: AlignmentType.CENTER,
    spacing: { after: 180 },
  }),
  paragraph([run("THU THẬP DỮ LIỆU THỰC NGHIỆM HEMS", { bold: true, size: 44, color: NAVY })], {
    alignment: AlignmentType.CENTER,
    spacing: { after: 240 },
    border: { bottom: { style: BorderStyle.SINGLE, size: 18, color: "5B9BD5", space: 6 } },
  }),
  paragraph("Mô hình phụ tải điện quy mô nhỏ tại Phòng thí nghiệm Điện công nghiệp", {
    alignment: AlignmentType.CENTER,
    run: { italic: true, size: 25, color: "3F3F3F" },
    spacing: { after: 600 },
  }),
  noteBox(
    "Mục tiêu",
    "Giúp người thực hiện biết chính xác dữ liệu nào bắt buộc, dữ liệu nào hệ thống tự ghi, cách thu từng loại bằng chứng và cách gửi lại để cập nhật bài báo Word.",
    BLUE,
  ),
  spacer(360),
  table(
    ["Tài liệu liên quan", "Tên tệp"],
    [
      ["Phiếu nhập dữ liệu", "HEMS_Phieu_Thu_Thap_Du_Lieu_Thuc_Nghiem.xlsx"],
      ["Nguồn sửa bài báo", "HEMS_Paper_Detailed_Outline_CTUT.md"],
      ["Phạm vi", "MFM384 – PLC S7-1200 – tải – Web/App – Quota – dự báo"],
      ["Ngày cập nhật", "10/08/2026"],
    ],
    [3000, 6600],
  ),
  spacer(420),
  paragraph("Lưu ý an toàn", {
    alignment: AlignmentType.CENTER,
    run: { bold: true, size: 25, color: "9C0006" },
    spacing: { after: 80 },
  }),
  paragraph(
    "Tài liệu này hướng dẫn thu và ghi dữ liệu, không hướng dẫn đấu nối điện. Việc lắp MFM384, PLC, relay/contactor, thiết bị bảo vệ và tải phải do người có chuyên môn thực hiện. Không thử sa thải tải hoặc tải công suất lớn khi chưa có interlock, manual override và dừng khẩn.",
    {
      alignment: AlignmentType.JUSTIFIED,
      run: { bold: true, color: "9C0006" },
      shading: { fill: RED, type: ShadingType.CLEAR },
      spacing: { after: 0, line: 300 },
    },
  ),
  new Paragraph({ children: [new PageBreak()] }),
);

children.push(
  heading("1. PHẠM VI VÀ NGUYÊN TẮC", 1),
  paragraph(
    "Đối tượng của bài báo là mô hình phụ tải điện quy mô nhỏ được xây dựng và đặt tại Phòng thí nghiệm Điện công nghiệp. Dữ liệu từ một ngôi nhà thật, nếu có sự đồng ý và được ẩn danh, chỉ nên dùng như dữ liệu bổ sung; không tự động thay đổi phạm vi bài báo thành khảo sát toàn bộ một ngôi nhà.",
  ),
  heading("1.1. Ba loại dữ liệu", 2),
  table(
    ["Loại", "Ví dụ", "Cách xử lý"],
    [
      ["Hệ thống tự đo", "V, I, P, E, timestamp", "Thu từ MFM384/PLC; không chép tay từng mẫu"],
      ["Hệ thống tự tính", "Điện năng tháng, % Quota, RTT", "Lấy từ API/log; kiểm tra lại công thức và nguồn"],
      ["Người thực hiện ghi", "Thiết bị, tải, điều kiện mạng, ảnh, quan sát", "Nhập một lần hoặc theo từng phiên thử"],
    ],
    [2200, 3000, 4400],
  ),
  spacer(),
  heading("1.2. Quy tắc chấp nhận dữ liệu", 2),
  bullet("Dữ liệu phần cứng phải có source = plc-s7-1200 hoặc mfm384-direct."),
  bullet("Dữ liệu qua backend phải có effectiveMode = plc-real."),
  bullet("Dữ liệu mock hoặc mock-fallback vẫn giữ để truy lỗi nhưng không đưa vào kết quả khoa học."),
  bullet("Không sửa số thô, không làm tròn trước khi lưu và không tạo dữ liệu để lấp ô trống."),
  bullet("Mỗi số liệu phải truy ngược được đến session_id và tệp bằng chứng gốc."),
  noteBox(
    "Không bắt buộc",
    "Q, kVA, PF, tần số và dữ liệu riêng từng pha có thể để trống nếu backend hiện chưa thu. Mã hiện tại tự thu bốn đại lượng chính: V, I, P và E.",
    GREEN,
  ),
  heading("2. HỒ SƠ TỐI THIỂU PHẢI CÓ", 1, true),
  table(
    ["Sheet", "Mức độ", "Nội dung tối thiểu"],
    [
      ["THIET_BI", "BẮT BUỘC", "MFM384, PLC, cơ cấu đóng cắt, tải, mạng/server"],
      ["PHIEN_THU", "BẮT BUỘC", "Mã phiên, thời gian, điều kiện mạng, tải và người thực hiện"],
      ["DU_LIEU_MFM384", "BẮT BUỘC", "Timestamp, V, I, P, E, trạng thái tải, nguồn và chất lượng"],
      ["DO_TRE_API", "NÊN CÓ", "Tối thiểu 30 mẫu hợp lệ cho mỗi điều kiện mạng được công bố"],
      ["LENH_PLC", "BẮT BUỘC NẾU NÓI VỀ ĐIỀU KHIỂN", "Lệnh, actualState, phản hồi độc lập, RTT và kết quả"],
      ["QUOTA_CANH_BAO", "BẮT BUỘC NẾU NÓI VỀ QUOTA", "NORMAL, NEAR, EXCEEDED; cảnh báo và khuyến nghị"],
      ["SU_CO_AN_TOAN", "CÓ ĐIỀU KIỆN", "Chỉ nhập nếu đã thử timeout, mất mạng hoặc manual override"],
      ["NHAT_KY_TEP", "BẮT BUỘC", "Ảnh, video, CSV, JSON, manual và log gốc"],
    ],
    [2350, 1900, 5350],
  ),
  spacer(),
  noteBox(
    "Kịch bản S6",
    "Sa thải tải tự động không bắt buộc. Nếu chưa đủ điều kiện an toàn, ghi KHÔNG THỰC HIỆN hoặc CHƯA ĐỦ ĐIỀU KIỆN AN TOÀN.",
    RED,
  ),
);

children.push(
  heading("3. CHUẨN BỊ TRƯỚC BUỔI ĐO", 1, true),
  heading("3.1. Chuẩn bị thư mục", 2),
  paragraph("Tạo một thư mục riêng cho mỗi phiên thử. Ví dụ:"),
  codeBlock([
    "research/data/raw/LAB-20260810-01/",
    "  LAB-20260810-01_mfm384.csv",
    "  LAB-20260810-01_latency.csv",
    "  LAB-20260810-01_control.json",
    "  LAB-20260810-01_testbed.jpg",
    "  LAB-20260810-01_app-feedback.png",
    "  LAB-20260810-01_notes.txt",
  ]),
  heading("3.2. Đồng bộ và kiểm tra", 2),
  numbered("Đồng bộ ngày giờ của máy chạy backend, PLC/HMI nếu có và điện thoại dùng App."),
  numbered("Kiểm tra đúng home_id dùng cho thử nghiệm; không dùng tài khoản không được phép."),
  numbered("Xác nhận tải nằm trong định mức và mạch bảo vệ đang hoạt động."),
  numbered("Đảm bảo cấu hình autoLoadSheddingEnabled vẫn là false."),
  numbered("Chụp một ảnh toàn cảnh trước khi bắt đầu."),
  numbered("Không ghi token, mật khẩu, địa chỉ IP công khai hoặc thông tin cá nhân vào ảnh và tài liệu gửi đi."),
  heading("4. BƯỚC 1 — KHAI BÁO THIẾT BỊ", 1, true),
  paragraph("Mở sheet THIET_BI. Mỗi thiết bị chỉ nhập một dòng."),
  table(
    ["Thiết bị", "Lấy thông tin ở đâu", "Nội dung cần nhập"],
    [
      ["MFM384", "Nhãn máy và manual", "Model đầy đủ, serial, giao tiếp RS-485, trạng thái hiệu chuẩn"],
      ["PLC S7-1200", "Nhãn CPU và TIA Portal", "Mã CPU, firmware, IP nội bộ, rack/slot"],
      ["Relay/contactor", "Nhãn thiết bị và sơ đồ điện", "Model, định mức, tải được điều khiển, tiếp điểm phản hồi"],
      ["Tải", "Nhãn tải", "Tên tải, công suất định mức, mức ưu tiên, vị trí"],
      ["Mạng/server", "Cấu hình máy và router", "LAN/Wi-Fi/4G, máy chạy backend, phiên bản phần mềm"],
      ["Đồng hồ tham chiếu", "Nhãn/chứng chỉ", "Chỉ nhập nếu dùng để đánh giá sai số MFM384"],
    ],
    [2100, 3000, 4500],
  ),
  spacer(),
  noteBox(
    "Nếu thiếu chứng chỉ hiệu chuẩn",
    "Ghi NO hoặc KHÔNG CÓ. Khi đó không công bố độ chính xác đo của MFM384; chỉ dùng dữ liệu để kiểm chứng tích hợp và xu hướng tải.",
    YELLOW,
  ),
);

children.push(
  heading("5. BƯỚC 2 — TẠO PHIÊN THỬ", 1, true),
  paragraph("Mở sheet PHIEN_THU và nhập một dòng trước khi bật thu dữ liệu."),
  table(
    ["Trường", "Ví dụ", "Quy tắc"],
    [
      ["session_id", "LAB-20260810-01", "Không lặp giữa các buổi"],
      ["start_time/end_time", "2026-08-10 08:00", "Dùng cùng timezone Asia/Bangkok hoặc +07:00"],
      ["operator", "Mã người thực hiện", "Có thể ẩn danh, không cần ghi thông tin nhạy cảm"],
      ["network_label", "lan_wifi5", "Giữ tên ổn định để so sánh"],
      ["loads", "Đèn 45 W; quạt 60 W", "Ghi đúng tải thực tế đang đấu"],
      ["sampling_interval", "60 s", "Ghi đúng cấu hình collector"],
      ["status", "COMPLETED", "ABORTED nếu dừng do lỗi/an toàn"],
    ],
    [2300, 2800, 4500],
  ),
  spacer(),
  heading("6. BƯỚC 3 — XÁC NHẬN DỮ LIỆU PLC THẬT", 1),
  paragraph("Trước khi thu dài hạn, mở App hoặc gọi API hiện tại một lần. Chỉ tiếp tục khi đồng thời thỏa các điều kiện sau:"),
  bullet("App hiển thị PLC thật."),
  bullet("Nguồn dữ liệu là PLC S7-1200."),
  bullet("API trả source = plc-s7-1200."),
  bullet("API trả effectiveMode = plc-real."),
  bullet("V, I, P và E thay đổi hợp lý khi trạng thái tải thay đổi."),
  paragraph("Endpoint đọc hiện tại:"),
  codeBlock(["GET http://DIA_CHI_SERVER:5001/api/power/current?homeId=home-demo-001"]),
  noteBox(
    "Dừng thu nếu",
    "API trả mock, mock-fallback, plcError, timestamp sai hoặc giá trị nằm ngoài phạm vi hợp lý. Giữ log lỗi nhưng không đưa các dòng đó vào kết quả bài báo.",
    RED,
  ),
);

children.push(
  heading("7. BƯỚC 4 — THU V, I, P VÀ E TỰ ĐỘNG", 1, true),
  heading("7.1. Bật bộ thu định kỳ", 2),
  paragraph("Trong cấu hình backend, dùng cấu hình tương đương sau và khởi động lại backend:"),
  codeBlock([
    '"powerCollector": {',
    '  "enabled": true,',
    '  "intervalSeconds": 60,',
    '  "homeIds": ["home-demo-001"]',
    "}",
  ]),
  paragraph("Kiểm tra trạng thái collector:"),
  codeBlock(["GET /api/power/collector/status"]),
  paragraph("Backend hiện tự thu bốn biến chính theo cấu hình:"),
  table(
    ["Đại lượng", "Tag PLC hiện tại", "Cột workbook", "Đơn vị"],
    [
      ["Điện áp", "MD200", "voltage_v", "V"],
      ["Dòng điện", "MD212", "current_a", "A"],
      ["Công suất tác dụng tổng", "MD224", "active_power_kw", "kW"],
      ["Điện năng tích lũy tổng", "MD228", "energy_kwh", "kWh"],
    ],
    [2600, 2200, 3000, 1800],
  ),
  spacer(),
  heading("7.2. Kế hoạch mức tải", 2),
  table(
    ["Mức", "Cách thực hiện", "Tối thiểu"],
    [
      ["Không tải/tải nền", "Tải thử tắt; giữ hệ thống đo hoạt động", "3 phiên"],
      ["Tải thấp", "Bật một tải nhỏ", "3 phiên"],
      ["Tải trung bình", "Bật tổ hợp tải trong định mức", "3 phiên"],
      ["Tải cao an toàn", "Tổ hợp tải cao hơn nhưng vẫn trong định mức và có giám sát", "3 phiên"],
    ],
    [2200, 5200, 2200],
  ),
  spacer(),
  paragraph("Thời gian khuyến nghị: 30 ngày. Nếu chỉ có 14 ngày, bài báo phải gọi đây là kiểm chứng tích hợp ban đầu, không phải đánh giá dự báo dài hạn."),
  heading("7.3. Xuất lịch sử JSON", 2),
  paragraph("Dùng token tài khoản thử nghiệm có quyền đọc. Không gửi token cho Codex hoặc đưa token vào ảnh."),
  codeBlock([
    "$token = Read-Host 'Nhap token doc'",
    '$headers = @{ Authorization = "Bearer $token" }',
    "$url = 'http://DIA_CHI_SERVER:5001/api/power/history?homeId=home-demo-001&limit=10000'",
    "$data = Invoke-RestMethod -Uri $url -Headers $headers -Method Get",
    "$data | ConvertTo-Json -Depth 10 | Set-Content -Encoding utf8 'LAB-YYYYMMDD-01_power-history.json'",
    "Remove-Variable token",
  ]),
  noteBox(
    "Không cần chép tay",
    "Gửi JSON/CSV gốc cùng workbook. Dữ liệu có thể được làm sạch và dán vào DU_LIEU_MFM384 sau, với đầy đủ dấu vết nguồn.",
    GREEN,
  ),
);

children.push(
  heading("8. BƯỚC 5 — ĐO ĐỘ TRỄ API", 1, true),
  paragraph("Dùng script có sẵn; script chỉ đọc dữ liệu và không điều khiển contactor."),
  codeBlock([
    "$env:SMART_HOME_EXPERIMENT_API_TOKEN='TOKEN_DOC_RIENG'",
    "python research/hardware/collect_hardware_trials.py `",
    "  --base-url http://DIA_CHI_SERVER:5001 `",
    "  --home-id home-demo-001 `",
    "  --network-label lan_wifi5 `",
    "  --trials 35",
  ]),
  paragraph("Kết quả tự động sinh vào research/data/raw gồm một file CSV và một file metadata JSON."),
  heading("8.1. Điều kiện chấp nhận", 2),
  bullet("Mỗi điều kiện mạng có ít nhất 30 mẫu hợp lệ sau 5 lượt warm-up."),
  bullet("HTTP status = 200 và không có lỗi."),
  bullet("source = plc-s7-1200 và effective_mode = plc-real."),
  bullet("Không dùng --allow-non-real cho dữ liệu bài báo."),
  bullet("Dán CSV vào sheet DO_TRE_API hoặc gửi file CSV để Codex xử lý."),
  noteBox(
    "Nếu bỏ bước này",
    "Bài báo vẫn có thể mô tả kiến trúc và chức năng, nhưng không được công bố mean, median, p95 hoặc độ trễ App/API–PLC đo được.",
    YELLOW,
  ),
);

children.push(
  heading("9. BƯỚC 6 — THỬ LỆNH VÀ PHẢN HỒI PLC", 1, true),
  paragraph("Chỉ dùng tải thử nghiệm an toàn và có người giám sát. Sheet sử dụng: LENH_PLC."),
  heading("9.1. Quy trình cho một lần bật hoặc tắt", 2),
  numbered("Ghi session_id, device_id, điều kiện mạng và trạng thái tải trước lệnh.", 0, "controlSteps"),
  numbered("Đọc và ghi công suất trước lệnh.", 0, "controlSteps"),
  numbered("Bấm ON hoặc OFF trên App.", 0, "controlSteps"),
  numbered("Chờ App/backend trả kết quả; không bấm lặp liên tục.", 0, "controlSteps"),
  numbered("Ghi feedback.verified, feedback.actualState và feedback.latencyMs.", 0, "controlSteps"),
  numbered("Kiểm tra tiếp điểm phản hồi/statusTag hoặc quan sát công suất thay đổi phù hợp.", 0, "controlSteps"),
  numbered("Ghi công suất sau lệnh, kết quả VERIFIED/ERROR/TIMEOUT và mã lỗi nếu có.", 0, "controlSteps"),
  numbered("Lưu audit log hoặc video liên tục của lần thử.", 0, "controlSteps"),
  paragraph("Phản hồi mong đợi có dạng:"),
  codeBlock([
    "{",
    '  "ok": true,',
    '  "device_id": "living_main_light",',
    '  "isOn": true,',
    '  "feedback": { "verified": true, "actualState": true, "latencyMs": 123 }',
    "}",
  ]),
  heading("9.2. Số lần thử", 2),
  bullet("Khuyến nghị 20–30 lần bật cho mỗi tải được công bố."),
  bullet("Khuyến nghị 20–30 lần tắt cho mỗi tải được công bố."),
  bullet("Nếu có nhiều điều kiện mạng, ghi rõ số lần theo từng điều kiện."),
  noteBox(
    "Phân biệt trạng thái",
    "App báo gửi lệnh thành công chưa đủ. Kết quả chỉ được ghi VERIFIED khi actualState hoặc phản hồi độc lập khớp trạng thái yêu cầu.",
    BLUE,
  ),
);

children.push(
  heading("10. BƯỚC 7 — THỬ QUOTA, CẢNH BÁO VÀ KHUYẾN NGHỊ", 1, true),
  paragraph("Thực hiện trên home/tài khoản thử nghiệm. Không cần kích hoạt sa thải tải tự động."),
  heading("10.1. Lấy trạng thái Quota", 2),
  codeBlock(["GET /api/homes/home-demo-001/quota"]),
  paragraph("Các trường chính cần ghi:"),
  bullet("energyLimitKwh → quota_kwh."),
  bullet("currentMonthEnergyKwh → energy_month_kwh."),
  bullet("quotaSource phải ưu tiên plc-s7-1200 khi có dữ liệu PLC thật."),
  bullet("usage_percent = energy_month_kwh / quota_kwh × 100%."),
  heading("10.2. Ba trường hợp tối thiểu", 2),
  table(
    ["Trường hợp", "Điều kiện", "Bằng chứng phải giữ"],
    [
      ["NORMAL", "Mức dùng còn xa Quota", "JSON Quota và ảnh giao diện"],
      ["NEAR", "Chạm ngưỡng cảnh báo cấu hình", "Thời điểm kích hoạt, kênh cảnh báo và nội dung khuyến nghị"],
      ["EXCEEDED", "Vượt Quota thử nghiệm", "Cảnh báo/chặn lệnh nếu có; không tự động cắt tải"],
    ],
    [2200, 3300, 4100],
  ),
  spacer(),
  noteBox(
    "Ranh giới tuyên bố",
    "Cảnh báo chỉ là thông báo; khuyến nghị là gợi ý hỗ trợ quyết định; tối ưu hóa cần hàm mục tiêu và thuật toán; sa thải tải là hành động vật lý có điều kiện an toàn. Không dùng bốn thuật ngữ này thay thế cho nhau.",
    YELLOW,
  ),
);

children.push(
  heading("11. BƯỚC 8 — SỰ CỐ VÀ AN TOÀN CÓ KIỂM SOÁT", 1, true),
  paragraph("Sheet SU_CO_AN_TOAN không bắt buộc cho bản dữ liệu tối thiểu. Chỉ điền khi có kịch bản được duyệt."),
  table(
    ["Kịch bản", "Có thể làm", "Không được làm tùy tiện"],
    [
      ["Timeout API", "Ngắt/dừng dịch vụ thử nghiệm và ghi lỗi App", "Không tác động mạch lực"],
      ["Mất mạng", "Ngắt mạng máy thử và ghi trạng thái fail-closed", "Không để tải nguy hiểm không giám sát"],
      ["Manual override", "Chỉ khi phần cứng đã có và người chuyên môn cho phép", "Không mô phỏng bằng lời hoặc ảnh giả"],
      ["Dừng khẩn", "Chỉ trong quy trình an toàn đã duyệt", "Không tự đấu nối hoặc thử ngẫu nhiên"],
      ["Sa thải tải", "Để CHƯA THỰC HIỆN ở giai đoạn này", "Không bật autoLoadSheddingEnabled để lấy số liệu"],
    ],
    [2100, 3900, 3600],
  ),
  spacer(),
  paragraph("Nếu thực hiện kịch bản hợp lệ, ghi thời điểm bắt đầu, thời điểm phát hiện, trạng thái tải trước/sau, trạng thái an toàn cuối cùng, thời gian phục hồi, người phê duyệt và file bằng chứng."),
);

children.push(
  heading("12. BƯỚC 9 — ẢNH, VIDEO VÀ NHẬT KÝ TỆP", 1, true),
  paragraph("Mở sheet NHAT_KY_TEP. Mỗi tệp bằng chứng ghi một dòng."),
  heading("12.1. Ảnh tối thiểu", 2),
  bullet("Ảnh toàn cảnh mô hình phụ tải nhỏ trong phòng thí nghiệm."),
  bullet("Ảnh MFM384 và đường RS-485."),
  bullet("Ảnh PLC S7-1200 và I/O."),
  bullet("Ảnh relay/contactor, bảo vệ và tải."),
  bullet("Ảnh App hiển thị V/I/P/E từ nguồn PLC thật."),
  bullet("Ảnh App sau khi nhận phản hồi bật/tắt từ PLC."),
  heading("12.2. Quy tắc đặt tên", 2),
  codeBlock([
    "LAB-20260810-01_testbed-overview.jpg",
    "LAB-20260810-01_mfm384-rs485.jpg",
    "LAB-20260810-01_plc-io.jpg",
    "LAB-20260810-01_app-power.png",
    "LAB-20260810-01_app-feedback.png",
    "LAB-20260810-01_control-log.json",
  ]),
  noteBox(
    "Ẩn danh",
    "Che mật khẩu, token, email, số điện thoại, IP công khai và thông tin định danh người dùng. Không chỉnh sửa các giá trị đo hoặc trạng thái kỹ thuật trong ảnh.",
    BLUE,
  ),
);

children.push(
  heading("13. BƯỚC 10 — ĐIỀN WORKBOOK VÀ GỬI LẠI", 1, true),
  heading("13.1. Thứ tự thực hiện", 2),
  numbered("Điền THIET_BI một lần.", 0, "finalSteps"),
  numbered("Tạo PHIEN_THU cho từng buổi.", 0, "finalSteps"),
  numbered("Dán hoặc liên kết dữ liệu thật vào DU_LIEU_MFM384.", 0, "finalSteps"),
  numbered("Dán CSV script vào DO_TRE_API nếu đã đo độ trễ.", 0, "finalSteps"),
  numbered("Nhập các lần bật/tắt có phản hồi vào LENH_PLC.", 0, "finalSteps"),
  numbered("Nhập ba trạng thái Quota vào QUOTA_CANH_BAO.", 0, "finalSteps"),
  numbered("Đánh dấu kết quả tương ứng trong BANG_KICH_BAN.", 0, "finalSteps"),
  numbered("Đăng ký toàn bộ file gốc trong NHAT_KY_TEP.", 0, "finalSteps"),
  numbered("Mở TONG_HOP và kiểm tra số dòng, tỷ lệ VERIFIED, số nguồn mock và dữ liệu thiếu.", 0, "finalSteps"),
  heading("13.2. Gói tệp gửi lại", 2),
  table(
    ["Bắt buộc", "Nên có", "Không gửi"],
    [
      ["Workbook đã điền", "Manual đúng model", "Token và mật khẩu"],
      ["CSV/JSON thô", "TIA/PLC tag export được phép", "Cơ sở dữ liệu chứa tài khoản cá nhân"],
      ["Ảnh testbed thật", "Video điều khiển", "Dữ liệu mock được ghi như dữ liệu thật"],
      ["Audit/control log", "Thông tin thiết bị tham chiếu", "Ảnh minh họa giả"],
    ],
    [3200, 3200, 3200],
  ),
  spacer(),
  paragraph("Khi gửi lại, kèm lời nhắn: “Hãy kiểm tra tính đầy đủ, loại mock/fallback, tính thống kê và chỉ cập nhật các tuyên bố được bằng chứng cho phép.”"),
);

children.push(
  heading("14. CHECKLIST TRƯỚC KHI KẾT THÚC", 1, true),
  table(
    ["Kiểm tra", "Đạt khi"],
    [
      ["Phạm vi", "Ghi rõ mô hình phụ tải quy mô nhỏ tại Phòng thí nghiệm Điện công nghiệp"],
      ["Nguồn thật", "source = plc-s7-1200 và effectiveMode = plc-real"],
      ["Dữ liệu điện", "Có timestamp, V, I, P, E và trạng thái tải"],
      ["Phiên thử", "Mọi dữ liệu có session_id và timezone"],
      ["Điều khiển", "Có requested state, actualState/phản hồi độc lập và kết quả"],
      ["Độ trễ", "Có tối thiểu 30 mẫu hợp lệ cho điều kiện mạng được báo cáo"],
      ["Quota", "Có NORMAL, NEAR, EXCEEDED và bằng chứng cảnh báo"],
      ["An toàn", "Không tuyên bố sa thải tải nếu chưa thử hợp lệ"],
      ["Tệp gốc", "Có CSV/JSON/ảnh/log và đường dẫn trong NHAT_KY_TEP"],
      ["Bảo mật", "Không có token, mật khẩu hoặc dữ liệu cá nhân chưa ẩn danh"],
    ],
    [3000, 6600],
  ),
  spacer(),
  noteBox(
    "Kết quả mong đợi",
    "Sau khi hoàn thành tài liệu này, dữ liệu đủ để tạo Bảng 2, Bảng 3 và Hình 2–3 của bài báo; kết quả dự báo UCI tiếp tục lấy từ canonical_results.json.",
    GREEN,
  ),
  heading("15. XỬ LÝ NHANH CÁC LỖI THƯỜNG GẶP", 1),
  table(
    ["Hiện tượng", "Xử lý"],
    [
      ["App có số nhưng source là mock", "Kiểm tra kết nối PLC và mode; không dùng dòng đó làm kết quả"],
      ["E không tăng", "Kiểm tra tag MD228, scale, đơn vị và việc MFM384 cập nhật PLC"],
      ["App báo thành công nhưng tải không đổi", "Kiểm tra statusTag/tiếp điểm; ghi ERROR hoặc TIMEOUT, không ghi VERIFIED"],
      ["Timestamp lệch", "Đồng bộ đồng hồ; không tự sửa im lặng, phải ghi cách hiệu chỉnh"],
      ["Thiếu PF hoặc Q", "Để trống/N/A; chỉ bổ sung sau khi có tag thật và manual xác minh"],
      ["Không có đồng hồ tham chiếu", "Không công bố sai số đo; chỉ đánh giá tích hợp và xu hướng"],
      ["Không đủ 30 mẫu latency", "Thu thêm hoặc bỏ tuyên bố định lượng độ trễ"],
    ],
    [3400, 6200],
  ),
  spacer(300),
  paragraph("— HẾT —", {
    alignment: AlignmentType.CENTER,
    run: { bold: true, color: NAVY },
  }),
);

const doc = new Document({
  creator: "Codex",
  title: "Hướng dẫn thu thập dữ liệu thực nghiệm HEMS",
  subject: "MFM384, PLC S7-1200, tải, Web/App, Quota và bằng chứng thực nghiệm",
  keywords: "HEMS; MFM384; PLC S7-1200; dữ liệu thực nghiệm; phòng thí nghiệm điện công nghiệp",
  description: "Hướng dẫn từng bước để thu, kiểm tra và bàn giao dữ liệu thực nghiệm cho bài báo HEMS.",
  styles: {
    default: {
      document: { run: { font: "Arial", size: 22, color: "1F1F1F" }, paragraph: { spacing: { line: 300 } } },
    },
    paragraphStyles: [
      {
        id: "Heading1",
        name: "Heading 1",
        basedOn: "Normal",
        next: "Normal",
        quickFormat: true,
        run: { font: "Arial", size: 30, bold: true, color: NAVY },
        paragraph: { spacing: { before: 240, after: 140 }, outlineLevel: 0, keepNext: true },
      },
      {
        id: "Heading2",
        name: "Heading 2",
        basedOn: "Normal",
        next: "Normal",
        quickFormat: true,
        run: { font: "Arial", size: 26, bold: true, color: "2F5597" },
        paragraph: { spacing: { before: 180, after: 100 }, outlineLevel: 1, keepNext: true },
      },
      {
        id: "Heading3",
        name: "Heading 3",
        basedOn: "Normal",
        next: "Normal",
        quickFormat: true,
        run: { font: "Arial", size: 23, bold: true, color: "365F91" },
        paragraph: { spacing: { before: 140, after: 80 }, outlineLevel: 2, keepNext: true },
      },
    ],
  },
  numbering: {
    config: [
      {
        reference: "bullets",
        levels: [
          {
            level: 0,
            format: LevelFormat.BULLET,
            text: "•",
            alignment: AlignmentType.LEFT,
            style: { paragraph: { indent: { left: 540, hanging: 280 } } },
          },
        ],
      },
      ...["steps", "controlSteps", "finalSteps"].map((reference) => ({
        reference,
        levels: [
          {
            level: 0,
            format: LevelFormat.DECIMAL,
            text: "%1.",
            alignment: AlignmentType.LEFT,
            style: { paragraph: { indent: { left: 620, hanging: 320 } } },
          },
        ],
      })),
    ],
  },
  sections: [
    {
      properties: {
        page: {
          size: { width: PAGE_WIDTH, height: PAGE_HEIGHT },
          margin: { top: MARGIN, right: MARGIN, bottom: MARGIN, left: MARGIN },
        },
      },
      headers: {
        default: new Header({
          children: [
            new Paragraph({
              border: { bottom: { style: BorderStyle.SINGLE, size: 6, color: "5B9BD5", space: 2 } },
              children: [run("HEMS  |  Hướng dẫn thu thập dữ liệu thực nghiệm", { size: 17, color: "5B6573" })],
            }),
          ],
        }),
      },
      footers: {
        default: new Footer({
          children: [
            new Paragraph({
              alignment: AlignmentType.RIGHT,
              children: [run("Trang ", { size: 17, color: "666666" }), new TextRun({ children: [PageNumber.CURRENT], font: "Arial", size: 17, color: "666666" })],
            }),
          ],
        }),
      },
      children,
    },
  ],
});

fs.mkdirSync(path.dirname(OUTPUT), { recursive: true });
Packer.toBuffer(doc).then((buffer) => {
  fs.writeFileSync(OUTPUT, buffer);
  process.stdout.write(`${OUTPUT}\n`);
});
