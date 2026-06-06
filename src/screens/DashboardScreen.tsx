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
        <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
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

            <LinearGradient colors={[Colors.primary[500], Colors.primary[700]]} style={styles.powerCard}>
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
                <View style={styles.statCard}>
                    <View style={[styles.statIcon, { backgroundColor: Colors.blue[100] }]}>
                        <Ionicons name="stats-chart" size={16} color={Colors.blue[600]} />
                    </View>
                    <Text style={styles.statValue}>{energyStatValue}</Text>
                    <Text style={styles.statLabel}>{energyStatLabel}</Text>
                </View>
                <View style={styles.statCard}>
                    <View style={[styles.statIcon, { backgroundColor: Colors.green[100] }]}>
                        <MaterialCommunityIcons name="sine-wave" size={16} color={Colors.green[600]} />
                    </View>
                    <Text style={styles.statValueSmall}>{voltageValue}</Text>
                    <Text style={styles.statLabel}>Điện áp (V)</Text>
                </View>
                <View style={styles.statCard}>
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
    container: { flex: 1, backgroundColor: Colors.background, padding: 16 },
    welcomeRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16, marginTop: 8 },
    welcomeLabel: { fontSize: 14, color: Colors.slate[500] },
    welcomeTitle: { fontSize: 20, fontWeight: '600', color: Colors.slate[800] },
    notifBadge: { padding: 8, backgroundColor: '#fff', borderRadius: 12, position: 'relative' },
    notifIcon: { fontSize: 18 },
    notifDot: { position: 'absolute', top: 2, right: 2, width: 16, height: 16, borderRadius: 8, backgroundColor: Colors.red[500], alignItems: 'center', justifyContent: 'center' },
    notifDotText: { color: '#fff', fontSize: 9, fontWeight: '700' },
    systemSummaryCard: { backgroundColor: '#fff', borderRadius: 14, padding: 12, marginBottom: 14, borderWidth: 1, borderColor: Colors.slate[100], shadowColor: '#000', shadowOpacity: 0.04, shadowRadius: 8, elevation: 2 },
    systemSummaryRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 8 },
    systemPill: { backgroundColor: Colors.slate[100], paddingHorizontal: 10, paddingVertical: 5, borderRadius: 999 },
    systemPillOk: { backgroundColor: Colors.green[100] },
    systemPillWarn: { backgroundColor: Colors.amber[100] },
    systemPillText: { fontSize: 11, fontWeight: '700', color: Colors.slate[600] },
    systemPillTextOk: { color: Colors.green[700] },
    systemPillTextWarn: { color: Colors.amber[700] },
    systemSummaryText: { fontSize: 12, color: Colors.slate[500], lineHeight: 17 },
    powerCard: { borderRadius: 20, padding: 20, marginBottom: 16, overflow: 'hidden' },
    powerCardCircle1: { position: 'absolute', top: -40, right: -40, width: 120, height: 120, borderRadius: 60, backgroundColor: 'rgba(255,255,255,0.1)' },
    powerCardCircle2: { position: 'absolute', bottom: -30, left: -30, width: 90, height: 90, borderRadius: 45, backgroundColor: 'rgba(255,255,255,0.05)' },
    powerHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
    powerLabelRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
    powerLabel: { fontSize: 13, color: 'rgba(255,255,255,0.8)' },
    realtimeBadge: { backgroundColor: 'rgba(255,255,255,0.2)', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20, flexDirection: 'row', alignItems: 'center', gap: 6 },
    realtimeDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: '#34d399' },
    realtimeText: { fontSize: 11, color: '#fff' },
    powerValueRow: { flexDirection: 'row', alignItems: 'baseline', gap: 4, marginBottom: 4 },
    powerValue: { fontSize: 44, fontWeight: '700', color: '#fff' },
    powerUnit: { fontSize: 18, color: 'rgba(255,255,255,0.8)' },
    powerSubtext: { fontSize: 13, color: 'rgba(255,255,255,0.7)' },
    statsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 20 },
    statCard: { width: '48%', backgroundColor: '#fff', borderRadius: 14, padding: 12, shadowColor: '#000', shadowOpacity: 0.04, shadowRadius: 8, elevation: 2 },
    statIcon: { width: 32, height: 32, borderRadius: 10, alignItems: 'center', justifyContent: 'center', marginBottom: 8 },
    statValue: { fontSize: 22, fontWeight: '700', color: Colors.slate[800] },
    statValueSmall: { fontSize: 16, fontWeight: '700', color: Colors.slate[800] },
    statLabel: { fontSize: 11, color: Colors.slate[500], marginTop: 2 },
    sectionTitle: { fontSize: 16, fontWeight: '600', color: Colors.slate[800], marginBottom: 10 },
    sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
    seeAll: { fontSize: 13, fontWeight: '500', color: Colors.primary[600] },
    quickActions: { marginBottom: 20 },
    actionBtn: { paddingHorizontal: 16, paddingVertical: 12, borderRadius: 12, borderWidth: 1, marginRight: 10 },
    roomCard: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#fff', borderRadius: 14, padding: 14, marginBottom: 10, shadowColor: '#000', shadowOpacity: 0.04, shadowRadius: 8, elevation: 2 },
    roomCardLeft: { flexDirection: 'row', alignItems: 'center', gap: 12 },
    roomIcon: { width: 48, height: 48, borderRadius: 14, alignItems: 'center', justifyContent: 'center', overflow: 'hidden', backgroundColor: Colors.slate[100] },
    roomIconActive: { borderWidth: 2, borderColor: Colors.green[400] },
    roomIconImage: { width: '100%', height: '100%', borderRadius: 12 },
    roomName: { fontSize: 15, fontWeight: '500', color: Colors.slate[800] },
    roomSub: { fontSize: 12, color: Colors.slate[500], marginTop: 2 },
    roomPower: { fontSize: 15, fontWeight: '600', color: Colors.slate[800] },
    roomTemp: { fontSize: 12, color: Colors.slate[500], marginTop: 2 },
    tipCard: { flexDirection: 'row', alignItems: 'flex-start', gap: 12, padding: 16, borderRadius: 14, borderWidth: 1, borderColor: Colors.amber[200], marginTop: 6 },
    tipTitle: { fontSize: 14, fontWeight: '500', color: Colors.amber[800], marginBottom: 4 },
    tipText: { fontSize: 13, color: Colors.amber[700], lineHeight: 18 },
    lockedBanner: { backgroundColor: Colors.red[50], borderWidth: 1, borderColor: Colors.red[200], borderRadius: 14, padding: 14, marginBottom: 14 },
    lockedTitle: { fontSize: 15, fontWeight: '700', color: Colors.red[600], marginBottom: 4 },
    lockedText: { fontSize: 13, color: Colors.red[600], lineHeight: 18 },
    errorBanner: { backgroundColor: Colors.amber[50], borderWidth: 1, borderColor: Colors.amber[200], borderRadius: 14, padding: 14, marginBottom: 14 },
    errorTitle: { fontSize: 15, fontWeight: '700', color: Colors.amber[700], marginBottom: 4 },
    errorText: { fontSize: 13, color: Colors.amber[700], lineHeight: 18 },

    // HEMS Quota styles
    quotaCard: { backgroundColor: '#fff', borderRadius: 16, padding: 16, marginBottom: 20, shadowColor: '#000', shadowOpacity: 0.04, shadowRadius: 8, elevation: 2, borderWidth: 1, borderColor: Colors.slate[100] },
    quotaHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
    quotaTitle: { fontSize: 14, fontWeight: '600', color: Colors.slate[800] },
    quotaEditBtn: { paddingVertical: 4, paddingHorizontal: 8, backgroundColor: Colors.primary[50], borderRadius: 8 },
    quotaEditBtnText: { fontSize: 12, fontWeight: '500', color: Colors.primary[600] },
    quotaInfoRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 10 },
    quotaInfoText: { fontSize: 13, color: Colors.slate[500] },
    progressContainer: { height: 10, backgroundColor: Colors.slate[100], borderRadius: 5, overflow: 'hidden', marginBottom: 10 },
    progressBar: { height: '100%', borderRadius: 5 },
    quotaStatusRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    quotaPercentage: { fontSize: 12, fontWeight: '600' },
    quotaTips: { fontSize: 12, color: Colors.slate[500], fontStyle: 'italic' },
    quotaEmptyContainer: { paddingVertical: 10, alignItems: 'center' },
    quotaEmptyText: { fontSize: 13, color: Colors.slate[500], textAlign: 'center', lineHeight: 18, marginBottom: 12 },
    quotaSetBtn: { paddingVertical: 10, paddingHorizontal: 20, backgroundColor: Colors.primary[500], borderRadius: 10 },
    quotaSetBtnText: { color: '#fff', fontSize: 13, fontWeight: '600' },

    // Modal styles
    modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center', padding: 20 },
    modalContent: { backgroundColor: '#fff', borderRadius: 20, padding: 22, width: '100%', shadowColor: '#000', shadowOpacity: 0.1, shadowRadius: 10, elevation: 5 },
    modalTitle: { fontSize: 18, fontWeight: '700', color: Colors.slate[800], marginBottom: 8, textAlign: 'center' },
    modalSubtitle: { fontSize: 13, color: Colors.slate[500], lineHeight: 18, marginBottom: 16, textAlign: 'center' },
    modalInput: { borderWidth: 1, borderColor: Colors.slate[200], borderRadius: 12, paddingHorizontal: 16, paddingVertical: 12, fontSize: 16, color: Colors.slate[800], marginBottom: 20, textAlign: 'center', backgroundColor: Colors.slate[50] },
    modalBtnRow: { flexDirection: 'row', gap: 12 },
    modalBtn: { flex: 1, paddingVertical: 12, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
    modalBtnCancel: { backgroundColor: Colors.slate[100] },
    modalBtnCancelText: { color: Colors.slate[600], fontSize: 14, fontWeight: '600' },
    modalBtnSave: { backgroundColor: Colors.primary[500] },
    modalBtnSaveText: { color: '#fff', fontSize: 14, fontWeight: '600' },
});
