import React, { useEffect, useMemo, useState } from 'react';
import { Alert, KeyboardAvoidingView, Modal, Platform, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';
import { useAuth } from '../contexts/AuthContext';
import { useSmartHomeServer } from '../contexts/SmartHomeServerContext';
import { Colors } from '../constants/colors';
import { buildPlcMappingSummary } from '../constants/plcMapping';

export default function SettingsScreen() {
    const navigation = useNavigation<any>();
    const { user, logout, changePassword } = useAuth();
    const { config, status, error, systemStatus, saveConfig, testConnection, refreshSystemStatus } = useSmartHomeServer();
    const [notifEnabled, setNotifEnabled] = useState(true);
    const [showPasswordModal, setShowPasswordModal] = useState(false);
    const [showServerModal, setShowServerModal] = useState(false);
    const [showPlcModal, setShowPlcModal] = useState(false);
    const [currentPw, setCurrentPw] = useState('');
    const [newPw, setNewPw] = useState('');
    const [confirmPw, setConfirmPw] = useState('');
    const [apiBaseUrl, setApiBaseUrl] = useState(config.apiBaseUrl);
    const [localApiBaseUrl, setLocalApiBaseUrl] = useState(config.localApiBaseUrl || '');
    const [preferLocalApi, setPreferLocalApi] = useState(config.preferLocalApi !== false);
    const [apiToken, setApiToken] = useState(config.apiToken || '');
    const [forecastApiUrl, setForecastApiUrl] = useState(config.forecastApiUrl || '');
    const [forecastModel, setForecastModel] = useState<'xgboost' | 'lstm'>(config.forecastModel || 'xgboost');
    const accountRoleLabel = user?.serverRole === 'owner'
        ? 'Tài khoản cha'
        : user?.serverRole === 'member'
            ? 'Tài khoản con'
            : user?.serverRole === 'viewer'
                ? 'Chỉ xem'
                : user?.role === 'admin'
                    ? 'Admin'
                    : 'User';

    useEffect(() => {
        setApiBaseUrl(config.apiBaseUrl);
        setLocalApiBaseUrl(config.localApiBaseUrl || '');
        setPreferLocalApi(config.preferLocalApi !== false);
        setApiToken(config.apiToken || '');
        setForecastApiUrl(config.forecastApiUrl || '');
        setForecastModel(config.forecastModel || 'xgboost');
    }, [config.apiBaseUrl, config.localApiBaseUrl, config.preferLocalApi, config.apiToken, config.forecastApiUrl, config.forecastModel]);

    const connectionLabel = status === 'connected'
        ? 'Đã kết nối'
        : status === 'connecting'
            ? 'Đang kiểm tra'
            : config.apiBaseUrl || config.localApiBaseUrl ? 'Chưa kết nối' : 'Chưa cấu hình';

    const runtimeLabel = useMemo(() => {
        if (!systemStatus) return 'Chưa đọc được';
        if ((systemStatus.effectiveMode || systemStatus.mode) === 'plc-real') return 'PLC thật';
        if (systemStatus.mode === 'auto') return 'Auto fallback';
        return 'Mock demo';
    }, [systemStatus]);

    const sourceLabel = useMemo(() => {
        if (!systemStatus) return 'Chưa rõ';
        if (systemStatus.powerSource === 'plc-s7-1200') return 'PLC S7-1200';
        if (systemStatus.powerSource === 'mock-fallback') return 'Mô phỏng dự phòng';
        return 'Dữ liệu mô phỏng';
    }, [systemStatus]);

    const handleChangePassword = async () => {
        if (!currentPw || !newPw || !confirmPw) {
            Alert.alert('Lỗi', 'Vui lòng nhập đầy đủ thông tin');
            return;
        }
        if (newPw !== confirmPw) {
            Alert.alert('Lỗi', 'Mật khẩu mới không khớp');
            return;
        }
        const result = await changePassword(currentPw, newPw);
        Alert.alert(result.success ? 'Thành công' : 'Lỗi', result.message);
        if (result.success) {
            setShowPasswordModal(false);
            setCurrentPw('');
            setNewPw('');
            setConfirmPw('');
        }
    };

    const handleLogout = () => {
        Alert.alert('Đăng xuất', 'Bạn có chắc muốn đăng xuất?', [
            { text: 'Hủy', style: 'cancel' },
            { text: 'Đăng xuất', style: 'destructive', onPress: logout },
        ]);
    };

    const handleSaveServer = async () => {
        const nextConfig = {
            apiBaseUrl,
            localApiBaseUrl,
            preferLocalApi,
            apiToken,
            timeout: 8000,
            forecastApiUrl,
            forecastModel,
        };

        await saveConfig(nextConfig);
        const result = await testConnection(nextConfig);
        Alert.alert(
            result.success ? 'Kết nối thành công' : 'Không thể kết nối',
            result.success ? 'App đã lưu cấu hình Server API riêng.' : result.message,
        );
        if (result.success) setShowServerModal(false);
    };

    const handleShowPlcInfo = () => {
        setShowPlcModal(true);
    };

    const handleShowPlcMapping = () => {
        Alert.alert(
            'Mapping PLC -> Server -> App',
            `${buildPlcMappingSummary()}\n\nLuồng demo:\n1. PLC lưu trạng thái vào tag status.\n2. Server riêng đọc/ghi PLC qua Ethernet.\n3. App gọi REST API của server.\n4. Lệnh điều khiển được server ghi vào tag command để PLC xử lý.`,
        );
    };

    return (
        <ScrollView style={styles.container} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
            <LinearGradient colors={['#10251f', '#173a31', '#0f172a']} style={styles.profileCard}>
                <View style={styles.avatar}><Text style={styles.avatarText}>U</Text></View>
                <View style={{ flex: 1 }}>
                    <Text style={styles.profileName}>{user?.name}</Text>
                    <Text style={styles.profilePhone}>{user?.phone}</Text>
                    <View style={styles.badgeRow}>
                        <View style={styles.badge}>
                            <Text style={styles.badgeText}>{accountRoleLabel}</Text>
                        </View>
                    </View>
                </View>
            </LinearGradient>

            <Text style={styles.sectionLabel}>TÀI KHOẢN</Text>
            <View style={styles.menuCard}>
                <TouchableOpacity style={styles.menuItem} onPress={() => {
                    Alert.alert('Thông tin cá nhân', `Họ tên: ${user?.name}\nSĐT: ${user?.phone}\nVai trò: ${accountRoleLabel}\nTrạng thái: Đang hoạt động`);
                }}>
                    <View style={styles.menuLeft}>
                        <View style={styles.menuIcon}><Text>U</Text></View>
                        <Text style={styles.menuText}>Thông tin cá nhân</Text>
                    </View>
                    <Text style={styles.menuArrow}>{'>'}</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.menuItem} onPress={() => {
                    setNotifEnabled(!notifEnabled);
                    Alert.alert(notifEnabled ? 'Đã tắt thông báo' : 'Đã bật thông báo');
                }}>
                    <View style={styles.menuLeft}>
                        <View style={styles.menuIcon}><Text>!</Text></View>
                        <Text style={styles.menuText}>Thông báo</Text>
                    </View>
                    <View style={[styles.toggle, notifEnabled && styles.toggleActive]}>
                        <View style={[styles.toggleCircle, notifEnabled && styles.toggleCircleActive]} />
                    </View>
                </TouchableOpacity>
                {user?.serverRole === 'owner' && user?.canManageMembers ? (
                    <TouchableOpacity style={styles.menuItem} onPress={() => navigation.navigate('MemberManagement')}>
                        <View style={styles.menuLeft}>
                            <View style={[styles.menuIcon, { backgroundColor: '#e0f2ef' }]}><Text>👥</Text></View>
                            <View>
                                <Text style={styles.menuText}>Quan ly gia dinh</Text>
                                <Text style={styles.menuSubText}>{user?.homeName || 'Quan ly thanh vien trong nha'}</Text>
                            </View>
                        </View>
                        <Text style={styles.menuArrow}>{'>'}</Text>
                    </TouchableOpacity>
                ) : null}
                <TouchableOpacity style={[styles.menuItem, { borderBottomWidth: 0 }]} onPress={() => setShowPasswordModal(true)}>
                    <View style={styles.menuLeft}>
                        <View style={styles.menuIcon}><Text>*</Text></View>
                        <Text style={styles.menuText}>Bảo mật</Text>
                    </View>
                    <Text style={styles.menuArrow}>{'>'}</Text>
                </TouchableOpacity>
            </View>

            <Text style={styles.sectionLabel}>KẾT NỐI</Text>
            <View style={styles.menuCard}>
                <TouchableOpacity style={styles.menuItem} onPress={() => setShowServerModal(true)}>
                    <View style={styles.menuLeft}>
                        <View style={styles.menuIcon}><Text>API</Text></View>
                        <View>
                            <Text style={styles.menuText}>Server API riêng</Text>
                            <Text style={styles.menuSubText}>{preferLocalApi ? localApiBaseUrl : apiBaseUrl}</Text>
                        </View>
                    </View>
                    <Text style={styles.menuValue}>{connectionLabel}</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.menuItem} onPress={handleShowPlcInfo}>
                    <View style={styles.menuLeft}>
                        <View style={styles.menuIcon}><Text>PLC</Text></View>
                        <View>
                            <Text style={styles.menuText}>PLC S7-1200</Text>
                            <Text style={styles.menuSubText}>{systemStatus?.plcHost || 'Chưa cấu hình PLC thật'}</Text>
                        </View>
                    </View>
                    <Text style={styles.menuValue}>{sourceLabel}</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.menuItem} onPress={handleShowPlcMapping}>
                    <View style={styles.menuLeft}>
                        <View style={styles.menuIcon}><Text>MAP</Text></View>
                        <View>
                            <Text style={styles.menuText}>Bảng mapping PLC</Text>
                            <Text style={styles.menuSubText}>PLC tag {'->'} API device {'->'} tên trên app</Text>
                        </View>
                    </View>
                    <Text style={styles.menuArrow}>{'>'}</Text>
                </TouchableOpacity>
                <TouchableOpacity style={[styles.menuItem, { borderBottomWidth: 0 }]} onPress={() => { void refreshSystemStatus(); }}>
                    <View style={styles.menuLeft}>
                        <View style={styles.menuIcon}><Text>SYS</Text></View>
                        <View>
                            <Text style={styles.menuText}>Làm mới trạng thái</Text>
                            <Text style={styles.menuSubText}>Kiểm tra server đang mock hay PLC thật</Text>
                        </View>
                    </View>
                    <Text style={styles.menuArrow}>{'>'}</Text>
                </TouchableOpacity>
            </View>

            <Text style={styles.sectionLabel}>TRẠNG THÁI HỆ THỐNG</Text>
            <View style={styles.statusGrid}>
                <View style={[styles.statusCard, { backgroundColor: status === 'connected' ? Colors.green[50] : Colors.amber[50] }]}>
                    <View style={[styles.statusDot, { backgroundColor: status === 'connected' ? Colors.green[500] : Colors.amber[500] }]} />
                    <Text style={[styles.statusLabel, { color: status === 'connected' ? Colors.green[700] : Colors.amber[700] }]}>Server API</Text>
                    <Text style={[styles.statusSub, { color: status === 'connected' ? Colors.green[600] : Colors.amber[600] }]}>{connectionLabel}</Text>
                </View>
                <View style={[styles.statusCard, { backgroundColor: '#e0f2ef' }]}>
                    <View style={[styles.statusDot, { backgroundColor: '#0f766e' }]} />
                    <Text style={[styles.statusLabel, { color: '#0f766e' }]}>Nguồn API</Text>
                    <Text style={[styles.statusSub, { color: '#115e59' }]}>{preferLocalApi ? 'Ưu tiên local' : 'Ưu tiên domain'}</Text>
                </View>
                <View style={[styles.statusCard, { backgroundColor: '#eef4f1' }]}>
                    <View style={[styles.statusDot, { backgroundColor: '#334155' }]} />
                    <Text style={[styles.statusLabel, { color: '#334155' }]}>Chế độ server</Text>
                    <Text style={[styles.statusSub, { color: '#50645c' }]}>{runtimeLabel}</Text>
                </View>
                <View style={[styles.statusCard, { backgroundColor: Colors.amber[50] }]}>
                    <View style={[styles.statusDot, { backgroundColor: Colors.amber[500] }]} />
                    <Text style={[styles.statusLabel, { color: Colors.amber[700] }]}>Dữ liệu điện</Text>
                    <Text style={[styles.statusSub, { color: Colors.amber[600] }]}>{sourceLabel}</Text>
                </View>
            </View>
            {error ? <Text style={styles.errorText}>{error}</Text> : null}

            <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout}>
                <Text style={styles.logoutText}>Đăng xuất</Text>
            </TouchableOpacity>

            <Text style={styles.version}>Smart Home Control v3.0.0</Text>
            <Text style={styles.copyright}>Server riêng + PLC S7-1200 + MFM384</Text>
            <View style={{ height: 30 }} />

            <Modal visible={showPasswordModal} transparent animationType="slide">
                <KeyboardAvoidingView style={styles.modalOverlay} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
                    <View style={styles.modalContent}>
                        <Text style={styles.modalTitle}>Đổi mật khẩu</Text>
                        <TextInput style={styles.modalInput} placeholder="Mật khẩu hiện tại" value={currentPw} onChangeText={setCurrentPw} secureTextEntry placeholderTextColor={Colors.slate[400]} />
                        <TextInput style={styles.modalInput} placeholder="Mật khẩu mới" value={newPw} onChangeText={setNewPw} secureTextEntry placeholderTextColor={Colors.slate[400]} />
                        <TextInput style={styles.modalInput} placeholder="Xác nhận mật khẩu mới" value={confirmPw} onChangeText={setConfirmPw} secureTextEntry placeholderTextColor={Colors.slate[400]} />
                        <View style={styles.modalBtnRow}>
                            <TouchableOpacity style={styles.modalCancelBtn} onPress={() => setShowPasswordModal(false)}>
                                <Text style={styles.modalCancelText}>Hủy</Text>
                            </TouchableOpacity>
                            <TouchableOpacity style={styles.modalSaveBtn} onPress={() => { void handleChangePassword(); }}>
                                <Text style={styles.modalSaveText}>Lưu</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </KeyboardAvoidingView>
            </Modal>

            <Modal visible={showPlcModal} transparent animationType="slide">
                <KeyboardAvoidingView style={styles.modalOverlay} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
                    <View style={styles.modalContent}>
                        <Text style={styles.modalTitle}>Thông tin PLC</Text>
                        <Text style={styles.modalHint}>
                            App không đọc PLC trực tiếp. Backend sẽ đọc/ghi PLC qua snap7 khi config server chuyển sang mode plc-real.
                        </Text>
                        <Text style={styles.statusHint}>
                            Chế độ hiện tại: {runtimeLabel}{'\n'}
                            Nguồn dữ liệu: {sourceLabel}{'\n'}
                            PLC host: {systemStatus?.plcHost || 'chưa cấu hình'}
                        </Text>
                        <View style={styles.modalBtnRow}>
                            <TouchableOpacity style={styles.modalCancelBtn} onPress={() => setShowPlcModal(false)}>
                                <Text style={styles.modalCancelText}>Đóng</Text>
                            </TouchableOpacity>
                            <TouchableOpacity style={styles.modalSaveBtn} onPress={() => { void refreshSystemStatus(); }}>
                                <Text style={styles.modalSaveText}>Kiểm tra lại</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </KeyboardAvoidingView>
            </Modal>

            <Modal visible={showServerModal} transparent animationType="slide">
                <KeyboardAvoidingView style={styles.modalOverlay} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
                    <View style={styles.modalContent}>
                        <Text style={styles.modalTitle}>Cấu hình Server API</Text>
                        <Text style={styles.modalHint}>Khuyến nghị: https://api.smarthomeai.id.vn. Điện thoại thật local: http://IP-LAPTOP:5001.</Text>
                        <TextInput style={styles.modalInput} placeholder="Server API URL" value={apiBaseUrl} onChangeText={setApiBaseUrl} autoCorrect={false} autoCapitalize="none" placeholderTextColor={Colors.slate[400]} />
                        <TextInput style={styles.modalInput} placeholder="Local API URL" value={localApiBaseUrl} onChangeText={setLocalApiBaseUrl} autoCorrect={false} autoCapitalize="none" placeholderTextColor={Colors.slate[400]} />
                        <TouchableOpacity style={styles.localToggleRow} onPress={() => setPreferLocalApi(!preferLocalApi)}>
                            <View style={[styles.toggle, preferLocalApi && styles.toggleActive]}>
                                <View style={[styles.toggleCircle, preferLocalApi && styles.toggleCircleActive]} />
                            </View>
                            <Text style={styles.localToggleText}>Ưu tiên local API khi cùng WiFi</Text>
                        </TouchableOpacity>
                        <TextInput style={styles.modalInput} placeholder="API token nếu có" value={apiToken} onChangeText={setApiToken} autoCorrect={false} autoCapitalize="none" secureTextEntry placeholderTextColor={Colors.slate[400]} />
                        <TextInput style={styles.modalInput} placeholder="Forecast API URL" value={forecastApiUrl} onChangeText={setForecastApiUrl} autoCorrect={false} autoCapitalize="none" placeholderTextColor={Colors.slate[400]} />
                        <Text style={styles.modalLabel}>Mô hình dự báo AI</Text>
                        <View style={styles.modelRow}>
                            <TouchableOpacity style={[styles.modelOption, forecastModel === 'xgboost' && styles.modelOptionActive]} onPress={() => setForecastModel('xgboost')}>
                                <Text style={[styles.modelOptionText, forecastModel === 'xgboost' && styles.modelOptionTextActive]}>XGBoost</Text>
                            </TouchableOpacity>
                            <TouchableOpacity style={[styles.modelOption, forecastModel === 'lstm' && styles.modelOptionActive]} onPress={() => setForecastModel('lstm')}>
                                <Text style={[styles.modelOptionText, forecastModel === 'lstm' && styles.modelOptionTextActive]}>LSTM</Text>
                            </TouchableOpacity>
                        </View>
                        <Text style={styles.statusHint}>Trạng thái: {connectionLabel}{error ? `\n${error}` : ''}</Text>
                        <View style={styles.modalBtnRow}>
                            <TouchableOpacity style={styles.modalCancelBtn} onPress={() => setShowServerModal(false)}>
                                <Text style={styles.modalCancelText}>Hủy</Text>
                            </TouchableOpacity>
                            <TouchableOpacity style={styles.modalSaveBtn} onPress={() => { void handleSaveServer(); }}>
                                <Text style={styles.modalSaveText}>Lưu & kiểm tra</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </KeyboardAvoidingView>
            </Modal>
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#edf3f0' },
    content: { padding: 16, paddingBottom: 30 },
    profileCard: { borderRadius: 24, padding: 20, flexDirection: 'row', alignItems: 'center', gap: 14, marginTop: 8, marginBottom: 20, overflow: 'hidden', borderWidth: 1, borderColor: 'rgba(209, 250, 229, 0.16)', shadowColor: '#10251f', shadowOpacity: 0.22, shadowRadius: 24, shadowOffset: { width: 0, height: 14 }, elevation: 4 },
    avatar: { width: 60, height: 60, borderRadius: 18, backgroundColor: 'rgba(236,253,245,0.14)', borderWidth: 1, borderColor: 'rgba(236,253,245,0.2)', alignItems: 'center', justifyContent: 'center' },
    avatarText: { fontSize: 28, color: '#fff', fontWeight: '900' },
    profileName: { fontSize: 21, fontWeight: '900', color: '#fff', letterSpacing: -0.2 },
    profilePhone: { fontSize: 13, color: 'rgba(255,255,255,0.7)', marginTop: 2 },
    badgeRow: { flexDirection: 'row', gap: 6, marginTop: 8 },
    badge: { backgroundColor: 'rgba(236,253,245,0.14)', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8, borderWidth: 1, borderColor: 'rgba(236,253,245,0.16)' },
    badgeText: { fontSize: 11, color: '#ecfdf5', fontWeight: '800' },
    sectionLabel: { fontSize: 12, fontWeight: '900', color: '#50645c', letterSpacing: 1, marginBottom: 8, paddingHorizontal: 4 },
    menuCard: { backgroundColor: '#f8fbf9', borderRadius: 18, overflow: 'hidden', marginBottom: 20, shadowColor: '#173a31', shadowOpacity: 0.06, shadowRadius: 16, shadowOffset: { width: 0, height: 9 }, elevation: 2, borderWidth: 1, borderColor: '#dce7e1' },
    menuItem: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 14, borderBottomWidth: 1, borderBottomColor: '#e7eee9' },
    menuLeft: { flexDirection: 'row', alignItems: 'center', gap: 12, flex: 1 },
    menuIcon: { width: 36, height: 36, borderRadius: 12, backgroundColor: '#e7eee9', alignItems: 'center', justifyContent: 'center' },
    menuText: { fontSize: 15, fontWeight: '800', color: '#13251f' },
    menuSubText: { fontSize: 11, color: '#61736c', marginTop: 2, lineHeight: 15 },
    menuArrow: { fontSize: 18, color: '#94a3b8', fontWeight: '800' },
    menuValue: { fontSize: 12, color: '#50645c', maxWidth: 126, textAlign: 'right', fontWeight: '800' },
    toggle: { width: 50, height: 28, borderRadius: 14, backgroundColor: '#cddbd5', justifyContent: 'center', paddingHorizontal: 2 },
    toggleActive: { backgroundColor: '#16a34a' },
    toggleCircle: { width: 24, height: 24, borderRadius: 12, backgroundColor: '#fff', shadowColor: '#173a31', shadowOpacity: 0.18, shadowRadius: 4, shadowOffset: { width: 0, height: 2 }, elevation: 2 },
    toggleCircleActive: { alignSelf: 'flex-end' },
    statusGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 12 },
    statusCard: { width: '47%' as any, padding: 12, borderRadius: 16, borderWidth: 1, borderColor: '#dce7e1' },
    statusDot: { width: 8, height: 8, borderRadius: 4, marginBottom: 6 },
    statusLabel: { fontSize: 12, fontWeight: '600' },
    statusSub: { fontSize: 11, marginTop: 2 },
    errorText: { color: Colors.red[500], fontSize: 12, marginBottom: 16, paddingHorizontal: 4 },
    logoutBtn: { backgroundColor: '#fff4f2', borderRadius: 16, padding: 16, alignItems: 'center', borderWidth: 1, borderColor: '#fecaca', marginBottom: 20 },
    logoutText: { fontSize: 15, fontWeight: '800', color: Colors.red[600] },
    version: { textAlign: 'center', fontSize: 12, color: Colors.slate[400] },
    copyright: { textAlign: 'center', fontSize: 12, color: Colors.slate[400], marginTop: 4 },
    modalOverlay: { flex: 1, backgroundColor: 'rgba(15,23,42,0.56)', justifyContent: 'flex-end' },
    modalContent: { backgroundColor: '#f8fbf9', borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24, paddingBottom: 40, shadowColor: '#10251f', shadowOpacity: 0.18, shadowRadius: 24, shadowOffset: { width: 0, height: -10 }, elevation: 5 },
    modalTitle: { fontSize: 20, fontWeight: '900', color: '#13251f', marginBottom: 16, letterSpacing: -0.2 },
    modalHint: { fontSize: 12, color: '#61736c', marginBottom: 10, lineHeight: 18 },
    statusHint: { fontSize: 12, color: '#61736c', marginBottom: 10, lineHeight: 18 },
    modalLabel: { fontSize: 13, fontWeight: '800', color: '#50645c', marginBottom: 8, marginTop: 4 },
    modalInput: { backgroundColor: '#edf3f0', borderRadius: 14, padding: 14, fontSize: 16, color: '#13251f', borderWidth: 1, borderColor: '#cddbd5', marginBottom: 10, fontWeight: '700' },
    localToggleRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 10 },
    localToggleText: { fontSize: 13, color: '#50645c', fontWeight: '800' },
    modalBtnRow: { flexDirection: 'row', gap: 10, marginTop: 10 },
    modalCancelBtn: { flex: 1, padding: 14, borderRadius: 12, backgroundColor: '#e7eee9', alignItems: 'center' },
    modalCancelText: { color: '#50645c', fontWeight: '800' },
    modalSaveBtn: { flex: 1, padding: 14, borderRadius: 12, backgroundColor: '#0f766e', alignItems: 'center' },
    modalSaveText: { color: '#fff', fontWeight: '800' },
    modelRow: { flexDirection: 'row', gap: 10, marginBottom: 16 },
    modelOption: { flex: 1, padding: 12, borderRadius: 12, borderWidth: 1, borderColor: '#cddbd5', backgroundColor: '#edf3f0', alignItems: 'center' },
    modelOptionActive: { borderColor: '#0f766e', backgroundColor: '#e0f2ef' },
    modelOptionText: { color: '#50645c', fontWeight: '700' },
    modelOptionTextActive: { color: '#0f766e', fontWeight: '900' },
});

