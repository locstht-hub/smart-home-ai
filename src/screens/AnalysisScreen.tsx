import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { View, Text, ScrollView, StyleSheet, Dimensions, TouchableOpacity, Alert, Modal } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { LineChart, PieChart } from 'react-native-chart-kit';
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import { Colors } from '../constants/colors';
import { useForecast } from '../contexts/ForecastContext';
import { useData } from '../contexts/DataContext';
import { useSmartHomeServer } from '../contexts/SmartHomeServerContext';
import { AnomalyAlert } from '../types/forecast';
import { PowerReading } from '../types/smartHomeServer';

const screenWidth = Dimensions.get('window').width - 64;

const formatCurrency = (value: number) => value.toLocaleString('vi-VN');
const normalizeConfidence = (value?: number) => {
    if (typeof value !== 'number' || Number.isNaN(value)) return 0;
    return value <= 1 ? Math.round(value * 100) : Math.round(value);
};

const formatConfidence = (value?: number) => `${normalizeConfidence(value)}%`;
const formatKw = (value?: number | null) => `${(value ?? 0).toFixed(2)} kW`;
const formatEnergy = (value?: number | null) => value == null ? '-- kWh' : `${value.toFixed(2)} kWh`;
const getReadingPower = (reading: PowerReading) => typeof reading.power_kw === 'number' && Number.isFinite(reading.power_kw) ? reading.power_kw : 0;
const formatReadingTime = (timestamp: string) => {
    const date = new Date(timestamp);
    return Number.isNaN(date.getTime()) ? '--:--' : date.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });
};

const generateReportHTML = (
    rooms: Array<{ name: string; power: number; percent: number }>,
    anomalies: AnomalyAlert[],
    predictions: Array<{ time: string; predictedKw: number; confidence: number }>,
    modelName: string,
    sourceLabel: string,
) => {
    const now = new Date();
    const totalKwh = predictions.reduce((sum, item) => sum + item.predictedKw, 0);
    const estimatedCost = totalKwh * 3000;

    const anomalyRows = anomalies.map(a => `
        <tr>
            <td style="padding:8px;border-bottom:1px solid #e2e8f0;">${a.deviceName} - ${a.roomName}</td>
            <td style="padding:8px;border-bottom:1px solid #e2e8f0;">${a.severity}</td>
            <td style="padding:8px;border-bottom:1px solid #e2e8f0;">${a.message}</td>
            <td style="padding:8px;border-bottom:1px solid #e2e8f0;">${a.detectedAt}</td>
        </tr>
    `).join('');

    return `
    <!DOCTYPE html>
    <html>
    <head><meta charset="utf-8"><style>
        body { font-family: Arial, sans-serif; padding: 30px; color: #1e293b; }
        h1 { color: #1e40af; border-bottom: 3px solid #3b82f6; padding-bottom: 10px; }
        h2 { color: #334155; margin-top: 30px; }
        table { width: 100%; border-collapse: collapse; margin-top: 10px; }
        th { background: #f1f5f9; padding: 10px; text-align: left; border-bottom: 2px solid #cbd5e1; }
        td { padding: 10px; border-bottom: 1px solid #e2e8f0; }
        .summary-box { display: flex; gap: 20px; margin: 20px 0; }
        .summary-item { flex: 1; background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 15px; text-align: center; }
        .summary-value { font-size: 28px; font-weight: 700; color: #1e40af; }
        .summary-label { font-size: 13px; color: #64748b; margin-top: 4px; }
        .footer { margin-top: 40px; padding-top: 15px; border-top: 1px solid #e2e8f0; font-size: 12px; color: #94a3b8; text-align: center; }
    </style></head>
    <body>
        <h1>Báo cáo phụ tải điện demo</h1>
        <p><strong>Ngày xuất:</strong> ${now.toLocaleDateString('vi-VN')} &nbsp;&nbsp; <strong>Nguồn:</strong> ${modelName} (${sourceLabel})</p>

        <div class="summary-box">
            <div class="summary-item">
                <div class="summary-value">${totalKwh.toFixed(1)}</div>
                <div class="summary-label">Tổng kW dự báo</div>
            </div>
            <div class="summary-item">
                <div class="summary-value">${Math.round(estimatedCost / 1000)}K</div>
                <div class="summary-label">Chi phí ước tính</div>
            </div>
            <div class="summary-item">
                <div class="summary-value">${anomalies.length}</div>
                <div class="summary-label">Cảnh báo</div>
            </div>
        </div>

        <h2>Phân bổ theo phòng</h2>
        <table>
            <tr><th>Phòng</th><th>Công suất tức thời (W)</th><th>Tỷ lệ</th></tr>
            ${rooms.map(room => `
                <tr>
                    <td>${room.name}</td>
                    <td>${room.power}W</td>
                    <td>${room.percent}%</td>
                </tr>
            `).join('')}
        </table>

        <h2>Dự báo sắp tới</h2>
        <table>
            <tr><th>Mốc thời gian</th><th>Dự báo (kW)</th><th>Độ tin cậy</th></tr>
            ${predictions.map(item => `
                <tr>
                    <td>${item.time}</td>
                    <td>${item.predictedKw.toFixed(1)}</td>
                    <td>${formatConfidence(item.confidence)}</td>
                </tr>
            `).join('')}
        </table>

        <h2>Cảnh báo bất thường</h2>
        ${anomalies.length ? `<table>
            <tr><th>Thiết bị</th><th>Mức độ</th><th>Mô tả</th><th>Thời gian</th></tr>
            ${anomalyRows}
        </table>` : '<p>Không có cảnh báo bất thường.</p>'}

        <div class="footer">
            <p>Smart Home App + Server API Demo</p>
        </div>
    </body>
    </html>`;
};

const getSourceLabel = (source: string) => {
    if (source === 'real_history') return 'Mô hình AI – sử dụng dữ liệu đo thực tế';
    if (source === 'sample') return 'Dữ liệu dự báo mẫu – chưa đủ dữ liệu thực tế';
    return 'Dữ liệu mô phỏng – Forecast API không khả dụng';
};

export default function AnalysisScreen() {
    const { predictions, anomalies, insights, modelInfo, isLoading, error, forecastSource, historyHourlyRows, refresh, triggerRetrain } = useForecast();
    const { rooms, getTotalPower, getActiveDeviceCount } = useData();
    const { client, isConfigured } = useSmartHomeServer();
    const [showAnomalyDetail, setShowAnomalyDetail] = useState<AnomalyAlert | null>(null);
    const [isExporting, setIsExporting] = useState(false);
    const [isRetraining, setIsRetraining] = useState(false);
    const [powerHistory, setPowerHistory] = useState<PowerReading[]>([]);
    const [isHistoryLoading, setIsHistoryLoading] = useState(false);
    const [historyError, setHistoryError] = useState<string | null>(null);

    const totalPowerKw = Number((getTotalPower() / 1000).toFixed(1));
    const activeCount = getActiveDeviceCount();

    const loadPowerHistory = useCallback(async () => {
        if (!isConfigured) {
            setPowerHistory([]);
            setHistoryError('Chưa cấu hình Server API.');
            return;
        }

        setIsHistoryLoading(true);
        setHistoryError(null);
        try {
            const readings = await client.getPowerHistory(288);
            setPowerHistory(readings);
        } catch (historyLoadError) {
            const message = historyLoadError instanceof Error ? historyLoadError.message : 'Không thể đọc lịch sử điện năng.';
            setHistoryError(message);
        } finally {
            setIsHistoryLoading(false);
        }
    }, [client, isConfigured]);

    useEffect(() => {
        void loadPowerHistory();
    }, [loadPowerHistory]);

    const handleRefreshAll = useCallback(() => {
        void refresh().catch(() => undefined);
        void loadPowerHistory();
    }, [loadPowerHistory, refresh]);

    const historySummary = useMemo(() => {
        const values = powerHistory.map(getReadingPower).filter(value => value > 0);
        const latest = powerHistory[0] || null;
        const averageKw = values.length ? values.reduce((sum, value) => sum + value, 0) / values.length : 0;
        const peakKw = values.length ? Math.max(...values) : 0;
        const firstEnergy = powerHistory[powerHistory.length - 1]?.energy_kwh;
        const lastEnergy = latest?.energy_kwh;
        const energyDelta = typeof firstEnergy === 'number' && typeof lastEnergy === 'number'
            ? Math.max(0, lastEnergy - firstEnergy)
            : null;

        return {
            latest,
            averageKw,
            peakKw,
            energyDelta,
            count: powerHistory.length,
        };
    }, [powerHistory]);

    const historyChartData = useMemo(() => {
        const sampled = powerHistory.slice(0, 12).reverse();
        const labels = sampled.map((reading, index) => index % 2 === 0 ? formatReadingTime(reading.timestamp) : '');
        const series = sampled.map(getReadingPower);

        return {
            labels: labels.length ? labels : ['--'],
            datasets: [{ data: series.length ? series : [0], color: () => Colors.green[500], strokeWidth: 2 }],
            legend: ['Lịch sử thật'],
        };
    }, [powerHistory]);

    const pieData = useMemo(() => {
        const total = rooms.reduce((sum, room) => sum + room.power, 0) || 1;
        const palette = ['#0f766e', '#16a34a', '#d97706', '#334155'];

        return rooms.map((room, index) => ({
            name: room.name,
            value: room.power || 1,
            color: palette[index % palette.length],
            legendFontColor: Colors.slate[600],
            legendFontSize: 12,
            percent: Math.round((room.power / total) * 100),
        }));
    }, [rooms]);

    const lineChartData = useMemo(() => {
        const labels = predictions.map(pred => pred.time.replace('Trong ', '+').replace(' giờ', 'h'));
        const forecastSeries = predictions.map(pred => pred.predictedKw);
        const actualSeries = predictions.map((pred, index) => index === 0 ? totalPowerKw : Number(((pred.predictedKw + totalPowerKw) / 2).toFixed(1)));

        return {
            labels,
            datasets: [
                { data: actualSeries, color: () => '#0f766e', strokeWidth: 2 },
                { data: forecastSeries, color: () => '#d97706', strokeWidth: 2 },
            ],
            legend: ['Hiện tại', 'Dự báo'],
        };
    }, [predictions, totalPowerKw]);

    const handleExportPDF = async () => {
        setIsExporting(true);
        try {
            const html = generateReportHTML(
                pieData.map(room => ({ name: room.name, power: Number(room.value), percent: room.percent })),
                anomalies,
                predictions,
                modelInfo.name,
                getSourceLabel(forecastSource),
            );
            const { uri } = await Print.printToFileAsync({ html, base64: false });
            await Sharing.shareAsync(uri, {
                UTI: '.pdf',
                mimeType: 'application/pdf',
                dialogTitle: 'Chia sẻ báo cáo phụ tải',
            });
        } catch (exportError: unknown) {
            const message = exportError instanceof Error ? exportError.message : '';
            if (!message.includes('cancel') && !message.includes('dismiss')) {
                Alert.alert('Lỗi', 'Không thể tạo báo cáo PDF. Vui lòng thử lại.');
            }
        } finally {
            setIsExporting(false);
        }
    };

    const handleRetrain = async () => {
        if (!triggerRetrain) {
            Alert.alert('Không hỗ trợ', 'Tính năng này chỉ khả dụng khi kết nối với máy chủ AI (Flask).');
            return;
        }

        Alert.alert(
            'Bắt đầu Tái huấn luyện',
            'Hệ thống sẽ tải dữ liệu 30 ngày gần nhất từ server riêng và chạy luồng Online Learning ngầm ở máy chủ biên (Edge Device). Vui lòng xác nhận?',
            [
                { text: 'Hủy', style: 'cancel' },
                {
                    text: 'Kích hoạt',
                    style: 'default',
                    onPress: async () => {
                        setIsRetraining(true);
                        const success = await triggerRetrain();
                        setIsRetraining(false);
                        if (success) {
                            Alert.alert('Thành công', 'Đã gửi tín hiệu Tái huấn luyện xuống máy chủ Edge thành công. Mô hình đang tự động cập nhật cấu trúc dưới nền!');
                        } else {
                            Alert.alert('Lỗi', 'Không thể kích hoạt luồng tái huấn luyện.');
                        }
                    },
                },
            ]
        );
    };

    const severityConfig = {
        critical: { icon: '🔴', label: 'Nghiêm trọng', bg: Colors.red[50], border: Colors.red[200], text: Colors.red[600] },
        warning: { icon: '🟡', label: 'Cảnh báo', bg: Colors.amber[50], border: Colors.amber[200], text: Colors.amber[700] },
        info: { icon: '🔵', label: 'Thông tin', bg: '#e0f2ef', border: '#b8ded7', text: '#0f766e' },
    };

    return (
        <ScrollView style={styles.container} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
            <Text style={styles.pageTitle}>Phân tích & Dự báo</Text>
            <Text style={styles.pageSubtitle}>
                {isLoading ? 'Đang cập nhật từ server riêng...' : getSourceLabel(forecastSource)}
            </Text>

            {error && (
                <View style={styles.errorBanner}>
                    <Text style={styles.errorBannerText}>{error}</Text>
                </View>
            )}

            <TouchableOpacity onPress={handleExportPDF} disabled={isExporting} activeOpacity={0.7}>
                <LinearGradient colors={['#0f766e', '#115e59']} style={styles.exportBtn}>
                    <Text style={{ fontSize: 18 }}>📄</Text>
                    <View style={{ flex: 1 }}>
                        <Text style={styles.exportBtnTitle}>{isExporting ? 'Đang tạo báo cáo...' : 'Xuất báo cáo PDF'}</Text>
                        <Text style={styles.exportBtnSub}>Lấy từ forecast provider đang hoạt động</Text>
                    </View>
                    <Text style={{ fontSize: 16, color: '#fff' }}>→</Text>
                </LinearGradient>
            </TouchableOpacity>

            <LinearGradient colors={['#10251f', '#173a31', '#0f172a']} style={styles.aiCard}>
                <View style={styles.aiCardCircle1} />
                <View style={styles.aiCardCircle2} />
                <View style={{ zIndex: 1 }}>
                    <View style={styles.aiStatusRow}>
                        <View style={styles.aiDot} />
                        <Text style={styles.aiStatusText}>Forecast provider đã sẵn sàng</Text>
                    </View>
                    <View style={styles.aiMetrics}>
                        <View>
                            <Text style={styles.aiMetricLabel}>Phụ tải hiện tại</Text>
                            <View style={styles.aiValueRow}>
                                <Text style={styles.aiValue}>{totalPowerKw.toFixed(1)}</Text>
                                <Text style={styles.aiUnit}>kW</Text>
                            </View>
                        </View>
                        <View style={{ alignItems: 'flex-end' }}>
                            <Text style={styles.aiMetricLabel}>Thiết bị hoạt động</Text>
                            <Text style={styles.aiMape}>{activeCount}</Text>
                        </View>
                    </View>
                </View>
            </LinearGradient>

            <View style={styles.metricsRow}>
                <View style={styles.metricCard}>
                    <Text style={{ fontSize: 14 }}>⚡</Text>
                    <Text style={styles.metricSub}>Dự báo gần nhất</Text>
                    <Text style={styles.metricValue}>
                        {predictions[0]?.predictedKw.toFixed(1) || '0.0'} <Text style={styles.metricUnit}>kW</Text>
                    </Text>
                    <Text style={styles.metricChange}>{formatConfidence(predictions[0]?.confidence)} tin cậy</Text>
                </View>
                <View style={styles.metricCard}>
                    <Text style={{ fontSize: 14 }}>💰</Text>
                    <Text style={styles.metricSub}>Chi phí ước tính</Text>
                    <Text style={styles.metricValue}>
                        {Math.round((predictions.reduce((sum, item) => sum + item.predictedKw, 0) * 3000) / 1000)}K <Text style={styles.metricUnit}>đ</Text>
                    </Text>
                    <Text style={styles.metricChange}>Cập nhật theo provider hiện tại</Text>
                </View>
            </View>

            <View style={styles.chartCard}>
                <View style={styles.predHeader}>
                    <Text style={styles.chartTitle}>Phụ tải điện năng</Text>
                    <TouchableOpacity onPress={handleRefreshAll}>
                        <Text style={styles.predUpdate}>Làm mới</Text>
                    </TouchableOpacity>
                </View>
                <LineChart
                    data={lineChartData}
                    width={screenWidth}
                    height={200}
                    yAxisSuffix=" kW"
                    chartConfig={{
                        backgroundColor: '#f8fbf9',
                        backgroundGradientFrom: '#f8fbf9',
                        backgroundGradientTo: '#f8fbf9',
                        color: (opacity = 1) => `rgba(15, 118, 110, ${opacity})`,
                        labelColor: () => '#61736c',
                        propsForDots: { r: '3' },
                    }}
                    bezier
                    style={{ borderRadius: 12 }}
                />
            </View>

            <View style={styles.chartCard}>
                <View style={styles.predHeader}>
                    <Text style={styles.chartTitle}>Lịch sử điện năng thật</Text>
                    <TouchableOpacity onPress={loadPowerHistory} disabled={isHistoryLoading}>
                        <Text style={styles.predUpdate}>{isHistoryLoading ? 'Đang tải...' : 'Đọc lại'}</Text>
                    </TouchableOpacity>
                </View>

                {historyError ? (
                    <View style={styles.historyEmptyBox}>
                        <Text style={styles.historyEmptyTitle}>Chưa đọc được lịch sử</Text>
                        <Text style={styles.historyEmptyText}>{historyError}</Text>
                    </View>
                ) : powerHistory.length === 0 ? (
                    <View style={styles.historyEmptyBox}>
                        <Text style={styles.historyEmptyTitle}>Chưa có dữ liệu lịch sử</Text>
                        <Text style={styles.historyEmptyText}>Mở Dashboard hoặc gọi /api/power/current để server ghi snapshot đầu tiên cho nhà này.</Text>
                    </View>
                ) : (
                    <>
                        <View style={styles.historyStatsGrid}>
                            <View style={styles.historyStatItem}>
                                <Text style={styles.historyStatLabel}>Mới nhất</Text>
                                <Text style={styles.historyStatValue}>{formatKw(historySummary.latest?.power_kw)}</Text>
                            </View>
                            <View style={styles.historyStatItem}>
                                <Text style={styles.historyStatLabel}>Trung bình</Text>
                                <Text style={styles.historyStatValue}>{formatKw(historySummary.averageKw)}</Text>
                            </View>
                            <View style={styles.historyStatItem}>
                                <Text style={styles.historyStatLabel}>Đỉnh tải</Text>
                                <Text style={styles.historyStatValue}>{formatKw(historySummary.peakKw)}</Text>
                            </View>
                            <View style={styles.historyStatItem}>
                                <Text style={styles.historyStatLabel}>kWh tăng</Text>
                                <Text style={styles.historyStatValue}>{formatEnergy(historySummary.energyDelta)}</Text>
                            </View>
                        </View>

                        <LineChart
                            data={historyChartData}
                            width={screenWidth}
                            height={190}
                            yAxisSuffix=" kW"
                            chartConfig={{
                                backgroundColor: '#f8fbf9',
                                backgroundGradientFrom: '#f8fbf9',
                                backgroundGradientTo: '#f8fbf9',
                                color: (opacity = 1) => `rgba(15, 118, 110, ${opacity})`,
                                labelColor: () => '#61736c',
                                propsForDots: { r: '3' },
                            }}
                            bezier
                            style={{ borderRadius: 12 }}
                        />

                        <View style={styles.historyList}>
                            {powerHistory.slice(0, 5).map((reading) => (
                                <View key={reading.id} style={styles.historyRow}>
                                    <View>
                                        <Text style={styles.historyRowTime}>{new Date(reading.timestamp).toLocaleString('vi-VN')}</Text>
                                        <Text style={styles.historyRowSource}>{reading.source}</Text>
                                    </View>
                                    <View style={styles.historyRowValues}>
                                        <Text style={styles.historyRowPower}>{formatKw(reading.power_kw)}</Text>
                                        <Text style={styles.historyRowMeta}>
                                            {reading.voltage?.toFixed(0) ?? '--'}V - {reading.current?.toFixed(2) ?? '--'}A
                                        </Text>
                                    </View>
                                </View>
                            ))}
                        </View>
                    </>
                )}
            </View>

            <View style={styles.chartCard}>
                <Text style={styles.chartTitle}>Phân bổ tiêu thụ theo phòng</Text>
                <PieChart
                    data={pieData}
                    width={screenWidth}
                    height={180}
                    chartConfig={{ color: () => '#000' }}
                    accessor="value"
                    backgroundColor="transparent"
                    paddingLeft="10"
                />
            </View>

            <View style={styles.anomalySection}>
                <Text style={styles.chartTitle}>Cảnh báo bất thường</Text>
                {anomalies.length === 0 ? (
                    <View style={styles.noAnomalyBox}>
                        <Text style={styles.noAnomalyText}>Không có cảnh báo bất thường từ provider hiện tại.</Text>
                    </View>
                ) : anomalies.map((alert) => {
                    const config = severityConfig[alert.severity];
                    const powerIncrease = alert.currentPower && alert.normalPower
                        ? Math.round(((alert.currentPower - alert.normalPower) / alert.normalPower) * 100)
                        : null;

                    return (
                        <TouchableOpacity
                            key={alert.id}
                            style={[styles.anomalyCard, { borderColor: config.border, backgroundColor: config.bg }]}
                            onPress={() => setShowAnomalyDetail(alert)}
                            activeOpacity={0.7}
                        >
                            <View style={styles.anomalyCardTop}>
                                <View style={styles.anomalyCardLeft}>
                                    <Text style={{ fontSize: 16 }}>{config.icon}</Text>
                                    <View>
                                        <Text style={styles.anomalyDevice}>{alert.deviceName} - {alert.roomName}</Text>
                                        <Text style={[styles.anomalySeverity, { color: config.text }]}>{config.label}</Text>
                                    </View>
                                </View>
                                {powerIncrease !== null && (
                                    <View style={styles.anomalyPowerBadge}>
                                        <Text style={[styles.anomalyPowerText, { color: Colors.red[600] }]}>+{powerIncrease}%</Text>
                                    </View>
                                )}
                            </View>
                            <Text style={styles.anomalyMessage}>{alert.message}</Text>
                            <View style={styles.anomalyFooter}>
                                <Text style={styles.anomalyPower}>
                                    {alert.currentPower && alert.normalPower ? `${alert.currentPower}W / ${alert.normalPower}W bình thường` : 'Không có số liệu công suất'}
                                </Text>
                                <Text style={styles.anomalyTime}>{new Date(alert.detectedAt).toLocaleString('vi-VN')}</Text>
                            </View>
                        </TouchableOpacity>
                    );
                })}
            </View>

            <View style={styles.chartCard}>
                <View style={styles.predHeader}>
                    <Text style={styles.chartTitle}>Dự báo sắp tới</Text>
                    <Text style={styles.predUpdate}>
                        {forecastSource === 'real_history' ? 'Mô hình AI' : forecastSource === 'sample' ? 'Dữ liệu mẫu' : 'Mô phỏng'}
                    </Text>
                </View>
                {predictions.map((pred, index) => (
                    <View key={`${pred.time}-${index}`} style={styles.predItem}>
                        <View style={styles.predLeft}>
                            <View style={styles.predIcon}><Text>🕐</Text></View>
                            <View>
                                <Text style={styles.predTime}>{pred.time}</Text>
                                <View style={styles.predConfRow}>
                                    <View style={styles.predBarBg}>
                                        <View style={[styles.predBarFill, { width: `${normalizeConfidence(pred.confidence)}%` }]} />
                                    </View>
                                    <Text style={styles.predConfText}>{formatConfidence(pred.confidence)} tin cậy</Text>
                                </View>
                            </View>
                        </View>
                        <View>
                            <Text style={styles.predValue}>{pred.predictedKw.toFixed(1)} <Text style={styles.predUnit}>kW</Text></Text>
                        </View>
                    </View>
                ))}
            </View>

            <Text style={[styles.chartTitle, { marginTop: 16 }]}>Gợi ý tiết kiệm</Text>
            {insights.map((insight) => (
                <View key={insight.id} style={[styles.insightCard, { borderColor: Colors.amber[200], backgroundColor: Colors.amber[50] }]}>
                    <Text style={{ fontSize: 16 }}>💡</Text>
                    <View style={{ flex: 1 }}>
                        <View style={styles.insightHeader}>
                            <Text style={styles.insightTitle}>{insight.title}</Text>
                            {insight.value ? <Text style={[styles.insightBadge, { color: Colors.amber[600] }]}>{insight.value}</Text> : null}
                        </View>
                        <Text style={styles.insightText}>{insight.detail}</Text>
                    </View>
                </View>
            ))}

            <View style={styles.modelCard}>
                <Text style={styles.modelTitle}>Thông tin mô hình dự báo</Text>
                <View style={styles.modelGrid}>
                    <View style={styles.modelItem}>
                        <Text style={styles.modelLabel}>Nguồn</Text>
                        <Text style={styles.modelValue2}>
                            {forecastSource === 'real_history' ? 'Dữ liệu đo thực tế' : forecastSource === 'sample' ? 'Dữ liệu dự báo mẫu' : 'Dữ liệu mô phỏng'}
                        </Text>
                    </View>
                    <View style={styles.modelItem}>
                        <Text style={styles.modelLabel}>Chế độ</Text>
                        <Text style={styles.modelValue2}>
                            {forecastSource === 'real_history' ? 'Mô hình AI – sử dụng dữ liệu đo thực tế' : forecastSource === 'sample' ? 'Dữ liệu mẫu' : 'Mô phỏng'}
                        </Text>
                    </View>
                    <View style={styles.modelItem}><Text style={styles.modelLabel}>Lần cập nhật cuối</Text><Text style={styles.modelValue2}>{new Date(modelInfo.lastUpdated).toLocaleString('vi-VN')}</Text></View>
                    <View style={styles.modelItem}>
                        <Text style={styles.modelLabel}>{forecastSource === 'real_history' ? 'Số giờ thực tế' : 'Mẫu huấn luyện'}</Text>
                        <Text style={styles.modelValue2}>
                            {forecastSource === 'real_history' ? `${historyHourlyRows} giờ` : (modelInfo.trainingSamples ?? 'Chưa có')}
                        </Text>
                    </View>
                </View>
                <TouchableOpacity
                    style={[styles.retrainBtn, isRetraining && { opacity: 0.7 }]}
                    onPress={() => { void handleRetrain(); }}
                    disabled={isRetraining}
                >
                    <Text style={styles.retrainBtnIcon}>🔄</Text>
                    <View style={{ flex: 1 }}>
                        <Text style={styles.retrainBtnText}>{isRetraining ? 'Đang gửi tín hiệu...' : 'Tái huấn luyện (Retrain)'}</Text>
                        <Text style={styles.retrainBtnSub}>Mô phỏng quy trình tái huấn luyện</Text>
                    </View>
                </TouchableOpacity>
            </View>

            <View style={{ height: 20 }} />

            <Modal visible={!!showAnomalyDetail} transparent animationType="slide" onRequestClose={() => setShowAnomalyDetail(null)}>
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContent}>
                        {showAnomalyDetail && (() => {
                            const config = severityConfig[showAnomalyDetail.severity];
                            const powerIncrease = showAnomalyDetail.currentPower && showAnomalyDetail.normalPower
                                ? Math.round(((showAnomalyDetail.currentPower - showAnomalyDetail.normalPower) / showAnomalyDetail.normalPower) * 100)
                                : null;
                            return (
                                <>
                                    <View style={styles.modalHeader}>
                                        <Text style={{ fontSize: 24 }}>{config.icon}</Text>
                                        <View style={{ flex: 1 }}>
                                            <Text style={styles.modalTitle}>{showAnomalyDetail.deviceName}</Text>
                                            <Text style={styles.modalSubtitle}>{showAnomalyDetail.roomName}</Text>
                                        </View>
                                        <TouchableOpacity onPress={() => setShowAnomalyDetail(null)}>
                                            <Text style={{ fontSize: 22, color: Colors.slate[400] }}>✕</Text>
                                        </TouchableOpacity>
                                    </View>

                                    <View style={[styles.modalSeverityBadge, { backgroundColor: config.bg, borderColor: config.border }]}>
                                        <Text style={[styles.modalSeverityText, { color: config.text }]}>{config.label}: {showAnomalyDetail.message}</Text>
                                    </View>

                                    <Text style={styles.modalDetail}>{showAnomalyDetail.detail || 'Cảnh báo này được sinh từ provider hiện tại.'}</Text>

                                    <View style={styles.modalStats}>
                                        <View style={styles.modalStatItem}>
                                            <Text style={styles.modalStatLabel}>Công suất hiện tại</Text>
                                            <Text style={[styles.modalStatValue, { color: Colors.red[600] }]}>{showAnomalyDetail.currentPower ?? '--'}W</Text>
                                        </View>
                                        <View style={styles.modalStatItem}>
                                            <Text style={styles.modalStatLabel}>Công suất bình thường</Text>
                                            <Text style={[styles.modalStatValue, { color: Colors.green[600] }]}>{showAnomalyDetail.normalPower ?? '--'}W</Text>
                                        </View>
                                        <View style={styles.modalStatItem}>
                                            <Text style={styles.modalStatLabel}>Mức tăng</Text>
                                            <Text style={[styles.modalStatValue, { color: Colors.red[600] }]}>{powerIncrease !== null ? `+${powerIncrease}%` : '--'}</Text>
                                        </View>
                                    </View>

                                    <Text style={styles.modalRecommendTitle}>Khuyến nghị xử lý:</Text>
                                    <Text style={styles.modalRecommendItem}>1. Kiểm tra lại trạng thái thiết bị trên server/PLC.</Text>
                                    <Text style={styles.modalRecommendItem}>2. So sánh phụ tải hiện tại với mức nền của cùng khung giờ.</Text>
                                    <Text style={styles.modalRecommendItem}>3. Khi có model thật, giữ nguyên UI này và chỉ thay forecast provider.</Text>

                                    <Text style={styles.modalTime}>Phát hiện: {new Date(showAnomalyDetail.detectedAt).toLocaleString('vi-VN')}</Text>
                                </>
                            );
                        })()}
                    </View>
                </View>
            </Modal>
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#edf3f0' },
    content: { padding: 16, paddingBottom: 30 },
    pageTitle: { fontSize: 28, fontWeight: '900', color: '#13251f', marginTop: 8, letterSpacing: -0.4 },
    pageSubtitle: { fontSize: 13, color: '#61736c', marginBottom: 14, fontWeight: '600' },
    errorBanner: { backgroundColor: '#fff4f2', borderWidth: 1, borderColor: '#fecaca', borderRadius: 16, padding: 12, marginBottom: 14 },
    errorBannerText: { fontSize: 13, color: Colors.red[600], lineHeight: 18, fontWeight: '600' },
    exportBtn: { flexDirection: 'row', alignItems: 'center', gap: 12, borderRadius: 18, padding: 16, marginBottom: 14, shadowColor: '#173a31', shadowOpacity: 0.14, shadowRadius: 18, shadowOffset: { width: 0, height: 10 }, elevation: 3 },
    exportBtnTitle: { fontSize: 15, fontWeight: '800', color: '#fff' },
    exportBtnSub: { fontSize: 12, color: 'rgba(255,255,255,0.8)', marginTop: 2 },
    anomalySection: { marginBottom: 14 },
    chartTitle: { fontSize: 17, fontWeight: '800', color: '#13251f', marginBottom: 12, letterSpacing: -0.1 },
    noAnomalyBox: { backgroundColor: '#f8fbf9', borderRadius: 16, borderWidth: 1, borderColor: '#dce7e1', padding: 14 },
    noAnomalyText: { fontSize: 13, color: '#61736c', fontWeight: '600' },
    anomalyCard: { borderWidth: 1, borderRadius: 14, padding: 14, marginBottom: 10 },
    anomalyCardTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 },
    anomalyCardLeft: { flexDirection: 'row', alignItems: 'center', gap: 10 },
    anomalyDevice: { fontSize: 14, fontWeight: '600', color: Colors.slate[800] },
    anomalySeverity: { fontSize: 11, fontWeight: '500', marginTop: 1 },
    anomalyPowerBadge: { backgroundColor: Colors.red[50], paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8 },
    anomalyPowerText: { fontSize: 12, fontWeight: '700' },
    anomalyMessage: { fontSize: 13, color: Colors.slate[600], marginBottom: 8 },
    anomalyFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    anomalyPower: { fontSize: 11, color: Colors.slate[500] },
    anomalyTime: { fontSize: 11, color: Colors.slate[400] },
    aiCard: { borderRadius: 24, padding: 22, marginBottom: 14, overflow: 'hidden', borderWidth: 1, borderColor: 'rgba(209, 250, 229, 0.16)', shadowColor: '#10251f', shadowOpacity: 0.22, shadowRadius: 24, shadowOffset: { width: 0, height: 14 }, elevation: 4 },
    aiCardCircle1: { position: 'absolute', top: -44, right: -36, width: 140, height: 140, borderRadius: 70, backgroundColor: 'rgba(52,211,153,0.13)' },
    aiCardCircle2: { position: 'absolute', bottom: -32, left: -28, width: 92, height: 92, borderRadius: 46, backgroundColor: 'rgba(125,211,252,0.08)' },
    aiStatusRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 12 },
    aiDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: Colors.green[400] },
    aiStatusText: { fontSize: 13, color: 'rgba(255,255,255,0.8)' },
    aiMetrics: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end' },
    aiMetricLabel: { fontSize: 13, color: 'rgba(255,255,255,0.7)', marginBottom: 4 },
    aiValueRow: { flexDirection: 'row', alignItems: 'baseline', gap: 2 },
    aiValue: { fontSize: 42, fontWeight: '900', color: '#fff', letterSpacing: -0.8, fontVariant: ['tabular-nums'] },
    aiUnit: { fontSize: 18, color: '#fff' },
    aiMape: { fontSize: 26, fontWeight: '900', color: '#fff', fontVariant: ['tabular-nums'] },
    metricsRow: { flexDirection: 'row', gap: 10, marginBottom: 14 },
    metricCard: { flex: 1, backgroundColor: '#f8fbf9', borderRadius: 18, padding: 14, shadowColor: '#173a31', shadowOpacity: 0.06, shadowRadius: 16, shadowOffset: { width: 0, height: 9 }, elevation: 2, borderWidth: 1, borderColor: '#dce7e1' },
    metricSub: { fontSize: 11, color: '#61736c', marginTop: 4, fontWeight: '700' },
    metricValue: { fontSize: 23, fontWeight: '900', color: '#13251f', marginTop: 4, fontVariant: ['tabular-nums'] },
    metricUnit: { fontSize: 14, fontWeight: '400', color: Colors.slate[500] },
    metricChange: { fontSize: 11, color: Colors.green[500], marginTop: 4 },
    chartCard: { backgroundColor: '#f8fbf9', borderRadius: 18, padding: 16, marginBottom: 14, shadowColor: '#173a31', shadowOpacity: 0.06, shadowRadius: 16, shadowOffset: { width: 0, height: 9 }, elevation: 2, borderWidth: 1, borderColor: '#dce7e1' },
    predHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
    predUpdate: { fontSize: 11, color: '#0f766e', fontWeight: '800' },
    historyEmptyBox: { backgroundColor: '#edf3f0', borderRadius: 14, borderWidth: 1, borderColor: '#dce7e1', padding: 14 },
    historyEmptyTitle: { fontSize: 14, fontWeight: '800', color: '#13251f', marginBottom: 4 },
    historyEmptyText: { fontSize: 12, color: '#61736c', lineHeight: 18 },
    historyStatsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 12 },
    historyStatItem: { width: '47%' as const, backgroundColor: '#edf3f0', borderRadius: 14, padding: 12, borderWidth: 1, borderColor: '#dce7e1' },
    historyStatLabel: { fontSize: 11, color: Colors.slate[500], marginBottom: 4 },
    historyStatValue: { fontSize: 16, fontWeight: '700', color: Colors.slate[800] },
    historyList: { marginTop: 12, gap: 8 },
    historyRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: '#edf3f0', borderRadius: 14, padding: 12 },
    historyRowTime: { fontSize: 12, fontWeight: '600', color: Colors.slate[700] },
    historyRowSource: { fontSize: 11, color: Colors.slate[400], marginTop: 2 },
    historyRowValues: { alignItems: 'flex-end' },
    historyRowPower: { fontSize: 13, fontWeight: '700', color: Colors.green[600] },
    historyRowMeta: { fontSize: 11, color: Colors.slate[500], marginTop: 2 },
    predItem: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 12, backgroundColor: '#edf3f0', borderRadius: 14, marginBottom: 8 },
    predLeft: { flexDirection: 'row', alignItems: 'center', gap: 10 },
    predIcon: { width: 38, height: 38, borderRadius: 12, backgroundColor: '#e0f2ef', alignItems: 'center', justifyContent: 'center' },
    predTime: { fontSize: 14, fontWeight: '500', color: Colors.slate[800] },
    predConfRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 4 },
    predBarBg: { width: 60, height: 6, borderRadius: 3, backgroundColor: Colors.slate[200], overflow: 'hidden' },
    predBarFill: { height: '100%', backgroundColor: '#0f766e', borderRadius: 3 },
    predConfText: { fontSize: 11, color: Colors.slate[500] },
    predValue: { fontSize: 18, fontWeight: '700', color: Colors.slate[800] },
    predUnit: { fontSize: 13, fontWeight: '400', color: Colors.slate[500] },
    insightCard: { flexDirection: 'row', alignItems: 'flex-start', gap: 10, padding: 14, borderRadius: 14, borderWidth: 1, marginBottom: 10 },
    insightHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 },
    insightTitle: { fontSize: 14, fontWeight: '500', color: Colors.slate[800] },
    insightBadge: { fontSize: 11, fontWeight: '600' },
    insightText: { fontSize: 13, color: Colors.slate[600], lineHeight: 18 },
    modelCard: { backgroundColor: '#13251f', borderRadius: 18, padding: 16, marginTop: 6, shadowColor: '#10251f', shadowOpacity: 0.18, shadowRadius: 20, shadowOffset: { width: 0, height: 12 }, elevation: 3 },
    modelTitle: { fontSize: 16, fontWeight: '600', color: '#fff', marginBottom: 12 },
    modelGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
    modelItem: { width: '46%' as const },
    modelLabel: { fontSize: 12, color: Colors.slate[400], marginBottom: 2 },
    modelValue2: { fontSize: 14, fontWeight: '500', color: '#fff' },
    retrainBtn: { flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: 'rgba(59, 130, 246, 0.2)', borderWidth: 1, borderColor: 'rgba(59, 130, 246, 0.4)', borderRadius: 12, padding: 12, marginTop: 16 },
    retrainBtnIcon: { fontSize: 18 },
    retrainBtnText: { fontSize: 13, fontWeight: '800', color: '#5eead4' },
    retrainBtnSub: { fontSize: 11, color: Colors.slate[400], marginTop: 2 },
    modalOverlay: { flex: 1, backgroundColor: 'rgba(15,23,42,0.56)', justifyContent: 'flex-end' },
    modalContent: { backgroundColor: '#f8fbf9', borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24, maxHeight: '80%', shadowColor: '#10251f', shadowOpacity: 0.18, shadowRadius: 24, shadowOffset: { width: 0, height: -10 }, elevation: 5 },
    modalHeader: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 16 },
    modalTitle: { fontSize: 18, fontWeight: '700', color: Colors.slate[800] },
    modalSubtitle: { fontSize: 13, color: Colors.slate[500] },
    modalSeverityBadge: { borderWidth: 1, borderRadius: 10, padding: 12, marginBottom: 14 },
    modalSeverityText: { fontSize: 13, fontWeight: '600' },
    modalDetail: { fontSize: 14, color: Colors.slate[600], lineHeight: 22, marginBottom: 16 },
    modalStats: { flexDirection: 'row', gap: 10, marginBottom: 16 },
    modalStatItem: { flex: 1, backgroundColor: Colors.slate[50], borderRadius: 10, padding: 12, alignItems: 'center' },
    modalStatLabel: { fontSize: 11, color: Colors.slate[500], marginBottom: 4, textAlign: 'center' },
    modalStatValue: { fontSize: 18, fontWeight: '700' },
    modalRecommendTitle: { fontSize: 14, fontWeight: '600', color: Colors.slate[800], marginBottom: 8 },
    modalRecommendItem: { fontSize: 13, color: Colors.slate[600], lineHeight: 22, paddingLeft: 4 },
    modalTime: { fontSize: 12, color: Colors.slate[400], marginTop: 16, textAlign: 'right' },
});
