# Nguồn dữ liệu nghiên cứu chuẩn

Mọi con số đưa vào Excel, hình, bài báo và luận văn phải được sinh từ `research/results/canonical/canonical_results.json`. Không sao chép số liệu thủ công giữa các tài liệu.

Luồng chuẩn:

1. Thu log PLC thật bằng `hardware/collect_hardware_trials.py`.
2. Tính thống kê bằng `hardware/analyze_hardware_trials.py`.
3. Huấn luyện forecast và xuất `metrics.json` bằng script trong `ml-training/forecast-24h-colab`.
4. Chạy `build_canonical_results.py` để khóa nguồn, fingerprint và trạng thái bằng chứng.
5. Sinh workbook, bảng và hình từ canonical JSON.

Ví dụ:

```powershell
python research/build_canonical_results.py `
  --forecast-metrics research/results/benchmark_uci_20260711/metrics.json `
  --hardware-summary research/data/processed/hardware_latency_summary.json
```

Nếu chưa có dữ liệu phần cứng đủ mẫu, bỏ `--hardware-summary`. Canonical source sẽ ghi `pending_real_trials` và không cho phép bài báo tuyên bố latency đo được hoặc sa thải tải tự động đã được kiểm chứng.
