import { AnomalyAlert, Insight, ModelInfo, PredictionPoint } from '../../types/forecast';

export const mockPredictions: PredictionPoint[] = [
    { time: 'Hiện tại', predictedKw: 1.8, confidence: 78, source: 'mock_fallback' },
    { time: 'Trong 1 giờ', predictedKw: 2.4, confidence: 80, source: 'mock_fallback' },
    { time: 'Trong 2 giờ', predictedKw: 2.1, confidence: 76, source: 'mock_fallback' },
    { time: 'Tối nay 20:00', predictedKw: 3.0, confidence: 82, source: 'mock_fallback' },
];

export const mockAnomalies: AnomalyAlert[] = [
    {
        id: 'mock-warning-1',
        deviceName: 'Máy lạnh phòng ngủ',
        roomName: 'Phòng ngủ',
        severity: 'warning',
        message: 'Phụ tải tăng hơn mức thông thường vào giờ cao điểm.',
        detail: 'Đây là dữ liệu demo khi server riêng chưa trả dữ liệu dự báo thật.',
        currentPower: 1120,
        normalPower: 900,
        detectedAt: new Date().toISOString(),
        source: 'mock_fallback',
    },
];

export const mockInsights: Insight[] = [
    {
        id: 'mock-insight-1',
        title: 'Chế độ demo đang hoạt động',
        detail: 'App đang dùng dữ liệu dự báo dự phòng vì chưa đọc được Forecast API trên server riêng.',
        value: 'Mock fallback',
        source: 'mock_fallback',
    },
];

export const mockModelInfo: ModelInfo = {
    name: 'Mock fallback',
    lastUpdated: new Date().toISOString(),
    mode: 'demo_rule',
};
