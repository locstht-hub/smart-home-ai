import React, { useEffect, useState, useRef } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, Alert, Modal, TextInput, Animated, Image } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useAuth } from '../contexts/AuthContext';
import { useData } from '../contexts/DataContext';
import { useSmartHomeServer } from '../contexts/SmartHomeServerContext';
import { PowerCurrentResponse, HomeQuota } from '../types/smartHomeServer';
import { Colors } from '../constants/colors';
import { roomIconImages } from '../constants/roomAssets';

const POWER_REFRESH_MS = 30000;
const ICONS: Record<string, string> = {
    bell: '!',
    flash: '⚡',
    'trending-up': '↗',
    'stats-chart': '▥',
    'sine-wave': '~',
    'current-ac': 'I',
    clock: '◷',
    'edit-3': '✎',
    power: '⏻',
    moon: '☾',
    home: '⌂',
    'home-lightning-bolt': '⌂',
};

function IconText({ name, size = 16, color = '#000', style }: { name: string; size?: number; color?: string; style?: any }) {
    return (
        <Text
            style={[
                {
                    color,
                    fontSize: size,
                    lineHeight: Math.ceil(size * 1.15),
                    fontWeight: '800',
                    textAlign: 'center',
                    includeFontPadding: false,
                },
                style,
            ]}
        >
            {ICONS[name] || name}
        </Text>
    );
}

const Feather = IconText;
const Ionicons = IconText;
const MaterialCommunityIcons = IconText;

export default function DashboardScreen({ navigation }: any) {
    const { user } = useAuth();
    const { rooms, getTotalPower, getActiveDeviceCount, turnAllOff, applyScene, serverError, isHomeSuspended, isServerControlled } = useData();
    const { client, isConfigured, config, systemStatus } = useSmartHomeServer();
    const [now, setNow] = useState(new Date());
    const [powerCurrent, setPowerCurrent] = useState<PowerCurrentResponse | null>(null);
    const [quota, setQuota] = useState<HomeQuota | null>(null);
    const [isQuotaModalVisible, setIsQuotaModalVisible] = useState(false);
    const [quotaInput, setQuotaInput] = useState('');
    const [isSubmittingQuota, setIsSubmittingQuota] = useState(false);

    const isOwner = user?.serverRole === 'owner';

    const pulseAnim = useRef(new Animated.Value(0.4)).current;

    useEffect(() => {
        const pulse = Animated.loop(
            Animated.sequence([
                Animated.timing(pulseAnim, {
                    toValue: 1,
                    duration: 1000,
                    useNativeDriver: true,
                }),
                Animated.timing(pulseAnim, {
                    toValue: 0.4,
                    duration: 1000,
                    useNativeDriver: true,
                }),
            ])
        );
        pulse.start();
        return () => pulse.stop();
    }, [pulseAnim]);

    useEffect(() => {
        const timer = setInterval(() => setNow(new Date()), 1000);
        return () => clearInterval(timer);
    }, []);

    useEffect(() => {
        if (!isConfigured) return;

        const loadPowerAndQuota = async () => {
            try {
                setPowerCurrent(await client.getPowerCurrent());
                const targetHomeId = config.homeId || user?.homeId;
                if (targetHomeId) {
                    const quotaData = await client.getHomeQuota(targetHomeId);
                    setQuota(quotaData);
                }
            } catch (error) {
                console.error('Error loading server power/quota:', error);
                setPowerCurrent(null);
            }
        };

        loadPowerAndQuota();
        const timer = setInterval(loadPowerAndQuota, POWER_REFRESH_MS);
        return () => clearInterval(timer);
    }, [client, isConfigured, config.homeId, user]);

    const totalPower = getTotalPower();
    const measuredPowerKw = typeof powerCurrent?.power_kw === 'number' ? powerCurrent.power_kw : null;
    const totalPowerKW = (measuredPowerKw ?? (totalPower / 1000)).toFixed(2);
    const voltageValue = typeof powerCurrent?.voltage === 'number' ? `${powerCurrent.voltage.toFixed(1)} V` : '-- V';
    const currentValue = typeof powerCurrent?.current === 'number' ? `${powerCurrent.current.toFixed(2)} A` : '-- A';
    const activeCount = getActiveDeviceCount();
    const elapsedHours = Math.max(1, now.getHours() + (now.getMinutes() / 60));
    const monthlyEnergyKwh = typeof quota?.currentMonthEnergyKwh === 'number' ? quota.currentMonthEnergyKwh : null;
    const meterEnergyKwh = typeof powerCurrent?.energy_kwh === 'number' ? powerCurrent.energy_kwh : null;
    const estimatedEnergyKwh = (totalPower / 1000) * elapsedHours * 0.22;
    const energyStatValue = monthlyEnergyKwh !== null
        ? monthlyEnergyKwh.toFixed(2)
        : meterEnergyKwh !== null
            ? meterEnergyKwh.toFixed(1)
            : estimatedEnergyKwh.toFixed(1);
    const energyStatLabel = monthlyEnergyKwh !== null
        ? 'Đã dùng tháng (kWh)'
        : meterEnergyKwh !== null
            ? 'Chỉ số công tơ (kWh)'
            : 'Ước tính hôm nay (kWh)';

    const effectiveMode = systemStatus?.effectiveMode || systemStatus?.mode;
    const isPlcConfigured = systemStatus?.mode === 'plc-real' || systemStatus?.mode === 'auto';
    const isPlcEffective = effectiveMode === 'plc-real';
    const serverIssueTitle = isPlcConfigured ? 'PLC chưa sẵn sàng' : 'Server API chưa sẵn sàng';
    const runtimeLabel = isPlcEffective
        ? 'PLC thật'
        : systemStatus?.mode === 'auto'
            ? 'Auto fallback'
            : systemStatus
                ? 'Mock demo'
                : 'Chưa đọc';
    const powerSourceLabel = systemStatus?.powerSource === 'plc-s7-1200'
        ? 'PLC S7-1200'
        : systemStatus?.powerSource === 'mock-fallback'
            ? 'Mô phỏng dự phòng'
            : systemStatus
                ? 'Mô phỏng'
                : 'Chưa rõ';
    const accountRoleLabel = user?.serverRole === 'owner'
        ? 'Tài khoản cha'
        : user?.serverRole === 'member'
            ? 'Tài khoản con'
            : user?.serverRole === 'viewer'
                ? 'Chỉ xem'
                : user?.role === 'admin'
                    ? 'Admin'
                    : 'User';
    const permissionLabel = isOwner
        ? 'Được quản lý hạn mức và thành viên'
        : user?.canManageDevices
            ? 'Được điều khiển thiết bị'
            : 'Không có quyền điều khiển';

    const getProgressBarColor = (ratio: number) => {
        if (ratio >= 0.9) return Colors.red[500];
        if (ratio >= 0.75) return Colors.orange[500];
        return Colors.green[500];
    };

    const getQuotaWarningText = (ratio: number) => {
        if (ratio >= 1.0) return '⚠️ ĐÃ VƯỢT QUÁ HẠN MỨC THÁNG NÀY!';
        if (ratio >= 0.9) return '⚠️ Nguy cơ vượt hạn mức (>90%)!';
        if (ratio >= 0.75) return '⚠️ Đã tiêu thụ hơn 75% hạn mức';
        return '⚡ Mức tiêu thụ nằm trong tầm kiểm soát';
    };

    const handleSaveQuota = async () => {
        if (!quotaInput.trim()) {
            Alert.alert('Lỗi', 'Vui lòng nhập hạn mức');
            return;
        }
        const val = parseFloat(quotaInput);
        if (isNaN(val) || val <= 0) {
            Alert.alert('Lỗi', 'Hạn mức phải là số lớn hơn 0');
            return;
        }

        const targetHomeId = config.homeId || user?.homeId;
        if (!targetHomeId) {
            Alert.alert('Lỗi', 'Không xác định được hộ gia đình');
            return;
        }

        setIsSubmittingQuota(true);
        try {
            const updated = await client.updateHomeQuota(targetHomeId, val);
            setQuota(updated);
            setIsQuotaModalVisible(false);
            Alert.alert('Thành công', `Đã cập nhật hạn mức thành ${val} kWh`);
        } catch (error: any) {
            console.error('Error saving quota:', error);
            Alert.alert('Lỗi', error?.message || 'Không thể cập nhật hạn mức');
        } finally {
            setIsSubmittingQuota(false);
        }
    };

    const getGreeting = () => {
        const h = new Date().getHours();
        if (h < 12) return 'Chào buổi sáng!';
        if (h < 18) return 'Chào buổi chiều!';
        return 'Chào buổi tối!';
    };

    return (
        <ScrollView style={styles.container} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
            <View style={styles.welcomeRow}>
                <View>
                    <Text style={styles.welcomeLabel}>Xin chào, {user?.name}</Text>
                    <Text style={styles.welcomeTitle}>{getGreeting()}</Text>
                </View>
                <TouchableOpacity style={styles.notifBadge} onPress={() => navigation.navigate('Analysis')}>
                    <Feather name="bell" size={20} color={Colors.slate[600]} />
                </TouchableOpacity>
            </View>

            <View style={styles.systemSummaryCard}>
                <View style={styles.systemSummaryRow}>
                    <View style={[styles.systemPill, isPlcEffective ? styles.systemPillOk : styles.systemPillWarn]}>
                        <Text style={[styles.systemPillText, isPlcEffective ? styles.systemPillTextOk : styles.systemPillTextWarn]}>
                            {runtimeLabel}
                        </Text>
                    </View>
                    <View style={styles.systemPill}>
                        <Text style={styles.systemPillText}>{powerSourceLabel}</Text>
                    </View>
                    <View style={styles.systemPill}>
                        <Text style={styles.systemPillText}>{accountRoleLabel}</Text>
                    </View>
                </View>
                <Text style={styles.systemSummaryText}>{permissionLabel}</Text>
            </View>

            {isHomeSuspended && (
                <View style={styles.lockedBanner}>
                    <Text style={styles.lockedTitle}>Nhà đang bị tạm khóa</Text>
                    <Text style={styles.lockedText}>Admin web đã khóa nhà này. App sẽ chặn xem dữ liệu mới và điều khiển thiết bị để minh họa phân quyền server.</Text>
                </View>
            )}

            {!isHomeSuspended && serverError && isServerControlled && (
                <View style={styles.errorBanner}>
                    <Text style={styles.errorTitle}>{serverIssueTitle}</Text>
                    <Text style={styles.errorText}>{serverError}</Text>
                </View>
            )}

            <LinearGradient colors={['#10251f', '#173a31', '#0f172a']} style={styles.powerCard}>
                <View style={styles.powerCardCircle1} />
                <View style={styles.powerCardCircle2} />
                <View style={{ zIndex: 1 }}>
                    <View style={styles.powerHeader}>
                        <View style={styles.powerLabelRow}>
                            <Ionicons name="flash" size={15} color="rgba(255,255,255,0.9)" />
                            <Text style={styles.powerLabel}>Công suất hiện tại (kW)</Text>
                        </View>
                        <View style={styles.realtimeBadge}>
                            <Animated.View style={[styles.realtimeDot, { opacity: pulseAnim }]} />
                            <Text style={styles.realtimeText}>Real-time</Text>
                        </View>
                    </View>
                    <View style={styles.powerValueRow}>
                        <Text style={styles.powerValue}>{totalPowerKW}</Text>
                        <Text style={styles.powerUnit}>kW</Text>
                    </View>
                    <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 2 }}>
                        <Ionicons name="trending-up" size={14} color="rgba(255,255,255,0.8)" />
                        <Text style={styles.powerSubtext}> {activeCount} thiết bị đang hoạt động</Text>
                    </View>
                </View>
            </LinearGradient>

            <View style={styles.statsGrid}>
                <View style={[styles.statCard, styles.statCardWide]}>
                    <View style={[styles.statIcon, { backgroundColor: Colors.blue[100] }]}>
                        <Ionicons name="stats-chart" size={16} color={Colors.blue[600]} />
                    </View>
                    <Text style={styles.statValue}>{energyStatValue}</Text>
                    <Text style={styles.statLabel}>{energyStatLabel}</Text>
                </View>
                <View style={[styles.statCard, styles.statCardHalf]}>
                    <View style={[styles.statIcon, { backgroundColor: Colors.green[100] }]}>
                        <MaterialCommunityIcons name="sine-wave" size={16} color={Colors.green[600]} />
                    </View>
                    <Text style={styles.statValueSmall}>{voltageValue}</Text>
                    <Text style={styles.statLabel}>Điện áp (V)</Text>
                </View>
                <View style={[styles.statCard, styles.statCardHalf]}>
                    <View style={[styles.statIcon, { backgroundColor: Colors.orange[100] }]}>
                        <MaterialCommunityIcons name="current-ac" size={16} color={Colors.orange[600]} />
                    </View>
                    <Text style={styles.statValueSmall}>{currentValue}</Text>
                    <Text style={styles.statLabel}>Dòng điện (I)</Text>
                </View>
            </View>

            {/* Hạn mức điện năng HEMS */}
            {!isHomeSuspended && (
                <View style={styles.quotaCard}>
                    <View style={styles.quotaHeader}>
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                            <Feather name="trending-up" size={18} color={Colors.slate[700]} />
                            <Text style={styles.quotaTitle}>Hạn mức điện năng HEMS</Text>
                        </View>
                        {isOwner && (
                            <TouchableOpacity onPress={() => {
                                setQuotaInput(quota?.energyLimitKwh ? String(quota.energyLimitKwh) : '');
                                setIsQuotaModalVisible(true);
                            }} style={styles.quotaEditBtn}>
                                <Text style={styles.quotaEditBtnText}>
                                    <Feather name="edit-3" size={12} color={Colors.primary[600]} /> Thiết lập
                                </Text>
                            </TouchableOpacity>
                        )}
                    </View>

                    {quota && quota.energyLimitKwh > 0 ? (
                        <View>
                            <View style={styles.quotaInfoRow}>
                                <Text style={styles.quotaInfoText}>
                                    Đã dùng:{' '}
                                    <Text style={{ fontWeight: '700', color: Colors.slate[800] }}>
                                        {quota.currentMonthEnergyKwh} kWh
                                    </Text>
                                </Text>
                                <Text style={styles.quotaInfoText}>
                                    Hạn mức:{' '}
                                    <Text style={{ fontWeight: '700', color: Colors.slate[800] }}>
                                        {quota.energyLimitKwh} kWh
                                    </Text>
                                </Text>
                            </View>

                            {/* Progress bar */}
                            <View style={styles.progressContainer}>
                                <View
                                    style={[
                                        styles.progressBar,
                                        {
                                            width: `${Math.min(100, (quota.currentMonthEnergyKwh / quota.energyLimitKwh) * 100)}%`,
                                            backgroundColor: getProgressBarColor(quota.currentMonthEnergyKwh / quota.energyLimitKwh),
                                        },
                                    ]}
                                />
                            </View>

                            <View style={styles.quotaStatusRow}>
                                <Text style={[styles.quotaPercentage, { color: getProgressBarColor(quota.currentMonthEnergyKwh / quota.energyLimitKwh) }]}>
                                    Đạt: {((quota.currentMonthEnergyKwh / quota.energyLimitKwh) * 100).toFixed(1)}%
                                </Text>
                                <Text style={styles.quotaTips}>
                                    {getQuotaWarningText(quota.currentMonthEnergyKwh / quota.energyLimitKwh)}
                                </Text>
                            </View>
                        </View>
                    ) : (
                        <View style={styles.quotaEmptyContainer}>
                            <Text style={styles.quotaEmptyText}>
                                {isOwner
                                    ? 'Cài đặt hạn mức kWh tiêu thụ tháng này để kiểm soát hóa đơn điện và nhận cảnh báo sớm.'
                                    : 'Chưa thiết lập hạn mức điện năng cho tháng này.'}
                            </Text>
                            {isOwner && (
                                <TouchableOpacity
                                    style={styles.quotaSetBtn}
                                    onPress={() => {
                                        setQuotaInput('');
                                        setIsQuotaModalVisible(true);
                                    }}
                                >
                                    <Text style={styles.quotaSetBtnText}>Cài đặt hạn mức ngay</Text>
                                </TouchableOpacity>
                            )}
                        </View>
                    )}
                </View>
            )}

            {/* Quota Input Modal */}
            <Modal
                visible={isQuotaModalVisible}
                transparent={true}
                animationType="slide"
                onRequestClose={() => setIsQuotaModalVisible(false)}
            >
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContent}>
                        <Text style={styles.modalTitle}>Cài Đặt Hạn Mức Điện Năng</Text>
                        <Text style={styles.modalSubtitle}>Nhập hạn mức điện năng cho nhà trong tháng này (kWh/tháng):</Text>

                        <TextInput
                            style={styles.modalInput}
                            placeholder="Ví dụ: 2500"
                            placeholderTextColor={Colors.slate[400]}
                            keyboardType="numeric"
                            value={quotaInput}
                            onChangeText={setQuotaInput}
                            autoFocus
                        />

                        <View style={styles.modalBtnRow}>
                            <TouchableOpacity
                                style={[styles.modalBtn, styles.modalBtnCancel]}
                                onPress={() => setIsQuotaModalVisible(false)}
                                disabled={isSubmittingQuota}
                            >
                                <Text style={styles.modalBtnCancelText}>Hủy</Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                style={[styles.modalBtn, styles.modalBtnSave, isSubmittingQuota && { opacity: 0.7 }]}
                                onPress={handleSaveQuota}
                                disabled={isSubmittingQuota}
                            >
                                <Text style={styles.modalBtnSaveText}>
                                    {isSubmittingQuota ? 'Đang lưu...' : 'Lưu hạn mức'}
                                </Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </Modal>

            <Text style={styles.sectionTitle}>Thao tác nhanh</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.quickActions}>
                <TouchableOpacity style={[styles.actionBtn, { borderColor: Colors.red[200], backgroundColor: Colors.red[50], flexDirection: 'row', alignItems: 'center', gap: 6 }]} onPress={async () => {
                    const success = await turnAllOff();
                    if (!success) Alert.alert('Lỗi', 'Chưa thể tắt tất cả thiết bị. Kiểm tra PLC/server rồi thử lại.');
                }}>
                    <MaterialCommunityIcons name="power" size={14} color={Colors.red[600]} />
                    <Text style={{ color: Colors.red[600], fontWeight: '500', fontSize: 13 }}>Tắt tất cả</Text>
                </TouchableOpacity>
                <TouchableOpacity style={[styles.actionBtn, { borderColor: Colors.blue[200], backgroundColor: Colors.blue[50], flexDirection: 'row', alignItems: 'center', gap: 6 }]} onPress={() => {
                    Alert.alert('Chế độ đêm', 'Tắt các thiết bị đèn/quạt trong hệ thống?', [
                        { text: 'Hủy', style: 'cancel' },
                        {
                            text: 'Bật',
                            onPress: async () => {
                                const success = await applyScene('sleep');
                                Alert.alert(success ? 'Thành công' : 'Lỗi', success ? 'Đã bật chế độ đêm' : 'Chưa thể bật chế độ đêm. Kiểm tra PLC/server rồi thử lại.');
                            },
                        },
                    ]);
                }}>
                    <Feather name="moon" size={14} color={Colors.blue[600]} />
                    <Text style={{ color: Colors.blue[600], fontWeight: '500', fontSize: 13 }}>Chế độ đêm</Text>
                </TouchableOpacity>
                <TouchableOpacity style={[styles.actionBtn, { borderColor: Colors.amber[200], backgroundColor: Colors.amber[50], flexDirection: 'row', alignItems: 'center', gap: 6 }]} onPress={() => {
                    Alert.alert('Chế độ vắng nhà', 'Tắt tất cả thiết bị trong nhà?', [
                        { text: 'Hủy', style: 'cancel' },
                        {
                            text: 'Tắt tất cả',
                            style: 'destructive',
                            onPress: async () => {
                                const success = await turnAllOff();
                                Alert.alert(success ? 'Thành công' : 'Lỗi', success ? 'Đã tắt tất cả thiết bị' : 'Chưa thể tắt tất cả thiết bị. Kiểm tra PLC/server rồi thử lại.');
                            },
                        },
                    ]);
                }}>
                    <Feather name="home" size={14} color={Colors.amber[600]} />
                    <Text style={{ color: Colors.amber[600], fontWeight: '500', fontSize: 13 }}>Vắng nhà</Text>
                </TouchableOpacity>
            </ScrollView>

            <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitle}>Các phòng</Text>
                <TouchableOpacity onPress={() => navigation.navigate('RoomList')}>
                    <Text style={styles.seeAll}>Xem tất cả →</Text>
                </TouchableOpacity>
            </View>

            {rooms.slice(0, 3).map(room => (
                <TouchableOpacity key={room.id} style={styles.roomCard} onPress={() => navigation.navigate('RoomList', { roomId: room.id, timestamp: Date.now() })}>
                    <View style={styles.roomCardLeft}>
                        <View style={[styles.roomIcon, room.active > 0 && styles.roomIconActive]}>
                            {roomIconImages[room.id] ? (
                                <Image source={roomIconImages[room.id]} style={styles.roomIconImage} resizeMode="cover" />
                            ) : (
                                <MaterialCommunityIcons name="home-lightning-bolt" size={22} color={room.active > 0 ? Colors.green[600] : Colors.slate[400]} />
                            )}
                        </View>
                        <View>
                            <Text style={styles.roomName}>{room.name}</Text>
                            <Text style={styles.roomSub}>{room.active}/{room.devices} thiết bị đang bật</Text>
                        </View>
                    </View>
                    <View style={{ alignItems: 'flex-end' }}>
                        <Text style={styles.roomPower}>{room.power}W</Text>
                    </View>
                </TouchableOpacity>
            ))}

            <LinearGradient colors={[Colors.amber[50], Colors.orange[50]]} style={styles.tipCard}>
                <Text style={{ fontSize: 20 }}>💡</Text>
                <View style={{ flex: 1 }}>
                    <Text style={styles.tipTitle}>Mẹo tiết kiệm điện</Text>
                    <Text style={styles.tipText}>Tắt các thiết bị không cần thiết khi ra khỏi phòng để tiết kiệm điện năng.</Text>
                </View>
            </LinearGradient>

            <View style={{ height: 20 }} />
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#edf3f0' },
    content: { padding: 16, paddingBottom: 28 },
    welcomeRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14, marginTop: 8 },
    welcomeLabel: { fontSize: 13, color: '#61736c', fontWeight: '600' },
    welcomeTitle: { fontSize: 26, fontWeight: '800', color: '#13251f', letterSpacing: -0.3 },
    notifBadge: { padding: 10, backgroundColor: '#f8fbf9', borderRadius: 14, position: 'relative', borderWidth: 1, borderColor: '#dce7e1', shadowColor: '#173a31', shadowOpacity: 0.08, shadowRadius: 14, shadowOffset: { width: 0, height: 8 }, elevation: 2 },
    notifIcon: { fontSize: 18 },
    notifDot: { position: 'absolute', top: 2, right: 2, width: 16, height: 16, borderRadius: 8, backgroundColor: Colors.red[500], alignItems: 'center', justifyContent: 'center' },
    notifDotText: { color: '#fff', fontSize: 9, fontWeight: '700' },
    systemSummaryCard: { backgroundColor: '#f8fbf9', borderRadius: 18, padding: 14, marginBottom: 14, borderWidth: 1, borderColor: '#d8e5df', shadowColor: '#173a31', shadowOpacity: 0.07, shadowRadius: 18, shadowOffset: { width: 0, height: 10 }, elevation: 2 },
    systemSummaryRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 8 },
    systemPill: { backgroundColor: '#e7eee9', paddingHorizontal: 10, paddingVertical: 5, borderRadius: 8 },
    systemPillOk: { backgroundColor: '#d9f3df' },
    systemPillWarn: { backgroundColor: '#fff0cf' },
    systemPillText: { fontSize: 11, fontWeight: '800', color: '#50645c' },
    systemPillTextOk: { color: Colors.green[700] },
    systemPillTextWarn: { color: Colors.amber[700] },
    systemSummaryText: { fontSize: 12, color: '#61736c', lineHeight: 18 },
    powerCard: { borderRadius: 24, padding: 22, marginBottom: 14, overflow: 'hidden', borderWidth: 1, borderColor: 'rgba(209, 250, 229, 0.16)', shadowColor: '#10251f', shadowOpacity: 0.26, shadowRadius: 26, shadowOffset: { width: 0, height: 16 }, elevation: 4 },
    powerCardCircle1: { position: 'absolute', top: -54, right: -36, width: 150, height: 150, borderRadius: 75, backgroundColor: 'rgba(52,211,153,0.13)' },
    powerCardCircle2: { position: 'absolute', bottom: -44, left: -28, width: 110, height: 110, borderRadius: 55, backgroundColor: 'rgba(125,211,252,0.08)' },
    powerHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
    powerLabelRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
    powerLabel: { fontSize: 12, color: 'rgba(236,253,245,0.8)', fontWeight: '700' },
    realtimeBadge: { backgroundColor: 'rgba(236,253,245,0.12)', paddingHorizontal: 10, paddingVertical: 5, borderRadius: 9, flexDirection: 'row', alignItems: 'center', gap: 6, borderWidth: 1, borderColor: 'rgba(236,253,245,0.16)' },
    realtimeDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: '#34d399' },
    realtimeText: { fontSize: 11, color: '#ecfdf5', fontWeight: '700' },
    powerValueRow: { flexDirection: 'row', alignItems: 'baseline', gap: 4, marginBottom: 4 },
    powerValue: { fontSize: 52, fontWeight: '900', color: '#ffffff', letterSpacing: -1.4, fontVariant: ['tabular-nums'] },
    powerUnit: { fontSize: 18, color: 'rgba(236,253,245,0.78)', fontWeight: '800' },
    powerSubtext: { fontSize: 13, color: 'rgba(236,253,245,0.72)', fontWeight: '600' },
    statsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 20 },
    statCard: { backgroundColor: '#f8fbf9', borderRadius: 18, padding: 14, borderWidth: 1, borderColor: '#dce7e1', shadowColor: '#173a31', shadowOpacity: 0.06, shadowRadius: 16, shadowOffset: { width: 0, height: 9 }, elevation: 2 },
    statCardWide: { width: '100%' },
    statCardHalf: { flex: 1, minWidth: 0 },
    statIcon: { width: 34, height: 34, borderRadius: 11, alignItems: 'center', justifyContent: 'center', marginBottom: 10 },
    statValue: { fontSize: 26, fontWeight: '900', color: '#13251f', letterSpacing: -0.4, fontVariant: ['tabular-nums'] },
    statValueSmall: { fontSize: 19, fontWeight: '900', color: '#13251f', letterSpacing: -0.2, fontVariant: ['tabular-nums'] },
    statLabel: { fontSize: 11, color: '#61736c', marginTop: 4, lineHeight: 15, fontWeight: '600' },
    sectionTitle: { fontSize: 17, fontWeight: '800', color: '#13251f', marginBottom: 10, letterSpacing: -0.1 },
    sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
    seeAll: { fontSize: 13, fontWeight: '800', color: '#0f766e' },
    quickActions: { marginBottom: 20 },
    actionBtn: { paddingHorizontal: 16, paddingVertical: 12, borderRadius: 12, borderWidth: 1, marginRight: 10, shadowColor: '#173a31', shadowOpacity: 0.05, shadowRadius: 10, shadowOffset: { width: 0, height: 5 }, elevation: 1 },
    roomCard: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#f8fbf9', borderRadius: 18, padding: 14, marginBottom: 10, borderWidth: 1, borderColor: '#dce7e1', shadowColor: '#173a31', shadowOpacity: 0.05, shadowRadius: 14, shadowOffset: { width: 0, height: 8 }, elevation: 2 },
    roomCardLeft: { flexDirection: 'row', alignItems: 'center', gap: 12 },
    roomIcon: { width: 48, height: 48, borderRadius: 13, alignItems: 'center', justifyContent: 'center', overflow: 'hidden', backgroundColor: '#e7eee9' },
    roomIconActive: { borderWidth: 2, borderColor: '#34d399' },
    roomIconImage: { width: '100%', height: '100%', borderRadius: 12 },
    roomName: { fontSize: 15, fontWeight: '800', color: '#13251f' },
    roomSub: { fontSize: 12, color: '#61736c', marginTop: 3 },
    roomPower: { fontSize: 16, fontWeight: '900', color: '#173a31', fontVariant: ['tabular-nums'] },
    roomTemp: { fontSize: 12, color: Colors.slate[500], marginTop: 2 },
    tipCard: { flexDirection: 'row', alignItems: 'flex-start', gap: 12, padding: 16, borderRadius: 18, borderWidth: 1, borderColor: '#f5d991', marginTop: 6 },
    tipTitle: { fontSize: 14, fontWeight: '500', color: Colors.amber[800], marginBottom: 4 },
    tipText: { fontSize: 13, color: Colors.amber[700], lineHeight: 18 },
    lockedBanner: { backgroundColor: '#fff4f2', borderWidth: 1, borderColor: '#fecaca', borderRadius: 18, padding: 14, marginBottom: 14 },
    lockedTitle: { fontSize: 15, fontWeight: '800', color: Colors.red[600], marginBottom: 4 },
    lockedText: { fontSize: 13, color: Colors.red[600], lineHeight: 18 },
    errorBanner: { backgroundColor: '#fff8e6', borderWidth: 1, borderColor: '#f5d991', borderRadius: 18, padding: 14, marginBottom: 14 },
    errorTitle: { fontSize: 15, fontWeight: '800', color: Colors.amber[700], marginBottom: 4 },
    errorText: { fontSize: 13, color: Colors.amber[700], lineHeight: 18 },

    // HEMS Quota styles
    quotaCard: { backgroundColor: '#f8fbf9', borderRadius: 20, padding: 16, marginBottom: 20, shadowColor: '#173a31', shadowOpacity: 0.07, shadowRadius: 18, shadowOffset: { width: 0, height: 10 }, elevation: 2, borderWidth: 1, borderColor: '#dce7e1' },
    quotaHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
    quotaTitle: { fontSize: 14, fontWeight: '800', color: '#13251f' },
    quotaEditBtn: { paddingVertical: 6, paddingHorizontal: 10, backgroundColor: '#e0f2ef', borderRadius: 10 },
    quotaEditBtnText: { fontSize: 12, fontWeight: '800', color: '#0f766e' },
    quotaInfoRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 10 },
    quotaInfoText: { fontSize: 13, color: '#61736c' },
    progressContainer: { height: 12, backgroundColor: '#e7eee9', borderRadius: 999, overflow: 'hidden', marginBottom: 10 },
    progressBar: { height: '100%', borderRadius: 5 },
    quotaStatusRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    quotaPercentage: { fontSize: 12, fontWeight: '600' },
    quotaTips: { flex: 1, marginLeft: 10, fontSize: 12, color: '#61736c', fontStyle: 'italic', textAlign: 'right' },
    quotaEmptyContainer: { paddingVertical: 10, alignItems: 'center' },
    quotaEmptyText: { fontSize: 13, color: '#61736c', textAlign: 'center', lineHeight: 18, marginBottom: 12 },
    quotaSetBtn: { paddingVertical: 11, paddingHorizontal: 20, backgroundColor: '#0f766e', borderRadius: 12 },
    quotaSetBtnText: { color: '#fff', fontSize: 13, fontWeight: '800' },

    // Modal styles
    modalOverlay: { flex: 1, backgroundColor: 'rgba(15,23,42,0.56)', justifyContent: 'center', alignItems: 'center', padding: 20 },
    modalContent: { backgroundColor: '#f8fbf9', borderRadius: 22, padding: 22, width: '100%', shadowColor: '#10251f', shadowOpacity: 0.18, shadowRadius: 24, shadowOffset: { width: 0, height: 16 }, elevation: 5 },
    modalTitle: { fontSize: 19, fontWeight: '900', color: '#13251f', marginBottom: 8, textAlign: 'center', letterSpacing: -0.2 },
    modalSubtitle: { fontSize: 13, color: '#61736c', lineHeight: 18, marginBottom: 16, textAlign: 'center' },
    modalInput: { borderWidth: 1, borderColor: '#cddbd5', borderRadius: 14, paddingHorizontal: 16, paddingVertical: 13, fontSize: 18, fontWeight: '800', color: '#13251f', marginBottom: 20, textAlign: 'center', backgroundColor: '#edf3f0', fontVariant: ['tabular-nums'] },
    modalBtnRow: { flexDirection: 'row', gap: 12 },
    modalBtn: { flex: 1, paddingVertical: 12, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
    modalBtnCancel: { backgroundColor: '#e7eee9' },
    modalBtnCancelText: { color: '#50645c', fontSize: 14, fontWeight: '800' },
    modalBtnSave: { backgroundColor: '#0f766e' },
    modalBtnSaveText: { color: '#fff', fontSize: 14, fontWeight: '800' },
});
