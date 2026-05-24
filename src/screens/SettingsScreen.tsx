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
        return systemStatus.mode === 'plc-real' ? 'PLC thật' : 'Mock demo';
    }, [systemStatus]);

    const sourceLabel = useMemo(() => {
        if (!systemStatus) return 'Chưa rõ';
        return systemStatus.powerSource === 'plc-s7-1200' ? 'PLC S7-1200' : 'Dữ liệu mô phỏng';
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
        <ScrollView style={styles.container} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
            <LinearGradient colors={[Colors.primary[500], Colors.primary[700]]} style={styles.profileCard}>
                <View style={styles.avatar}><Text style={styles.avatarText}>U</Text></View>
                <View style={{ flex: 1 }}>
                    <Text style={styles.profileName}>{user?.name}</Text>
                    <Text style={styles.profilePhone}>{user?.phone}</Text>
                    <View style={styles.badgeRow}>
                        <View style={styles.badge}>
                            <Text style={styles.badgeText}>{user?.role === 'admin' ? 'Admin' : 'User'}</Text>
                        </View>
                    </View>
                </View>
            </LinearGradient>

            <Text style={styles.sectionLabel}>TÀI KHOẢN</Text>
            <View style={styles.menuCard}>
                <TouchableOpacity style={styles.menuItem} onPress={() => {
                    Alert.alert('Thông tin cá nhân', `Họ tên: ${user?.name}\nSĐT: ${user?.phone}\nVai trò: ${user?.role === 'admin' ? 'Quản trị viên' : 'Người dùng'}\nTrạng thái: Đang hoạt động`);
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
                            <View style={[styles.menuIcon, { backgroundColor: Colors.purple[100] }]}><Text>👥</Text></View>
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
                <View style={[styles.statusCard, { backgroundColor: Colors.blue[50] }]}>
                    <View style={[styles.statusDot, { backgroundColor: Colors.blue[500] }]} />
                    <Text style={[styles.statusLabel, { color: Colors.blue[700] }]}>Nguồn API</Text>
                    <Text style={[styles.statusSub, { color: Colors.blue[600] }]}>{preferLocalApi ? 'Ưu tiên local' : 'Ưu tiên domain'}</Text>
                </View>
                <View style={[styles.statusCard, { backgroundColor: Colors.purple[50] }]}>
                    <View style={[styles.statusDot, { backgroundColor: Colors.purple[500] }]} />
                    <Text style={[styles.statusLabel, { color: Colors.purple[600] }]}>Chế độ server</Text>
                    <Text style={[styles.statusSub, { color: Colors.purple[600] }]}>{runtimeLabel}</Text>
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
    container: { flex: 1, backgroundColor: Colors.background, padding: 16 },
    profileCard: { borderRadius: 20, padding: 20, flexDirection: 'row', alignItems: 'center', gap: 14, marginTop: 8, marginBottom: 20 },
    avatar: { width: 60, height: 60, borderRadius: 30, backgroundColor: 'rgba(255,255,255,0.2)', alignItems: 'center', justifyContent: 'center' },
    avatarText: { fontSize: 28, color: '#fff' },
    profileName: { fontSize: 20, fontWeight: '600', color: '#fff' },
    profilePhone: { fontSize: 13, color: 'rgba(255,255,255,0.7)', marginTop: 2 },
    badgeRow: { flexDirection: 'row', gap: 6, marginTop: 8 },
    badge: { backgroundColor: 'rgba(255,255,255,0.2)', paddingHorizontal: 10, paddingVertical: 3, borderRadius: 20 },
    badgeText: { fontSize: 11, color: '#fff' },
    sectionLabel: { fontSize: 12, fontWeight: '600', color: Colors.slate[400], letterSpacing: 1, marginBottom: 8, paddingHorizontal: 4 },
    menuCard: { backgroundColor: '#fff', borderRadius: 14, overflow: 'hidden', marginBottom: 20, shadowColor: '#000', shadowOpacity: 0.04, shadowRadius: 8, elevation: 2 },
    menuItem: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 14, borderBottomWidth: 1, borderBottomColor: Colors.slate[100] },
    menuLeft: { flexDirection: 'row', alignItems: 'center', gap: 12, flex: 1 },
    menuIcon: { width: 36, height: 36, borderRadius: 10, backgroundColor: Colors.slate[100], alignItems: 'center', justifyContent: 'center' },
    menuText: { fontSize: 15, fontWeight: '500', color: Colors.slate[800] },
    menuSubText: { fontSize: 11, color: Colors.slate[500], marginTop: 2 },
    menuArrow: { fontSize: 18, color: Colors.slate[400] },
    menuValue: { fontSize: 13, color: Colors.slate[500], maxWidth: 120, textAlign: 'right' },
    toggle: { width: 48, height: 26, borderRadius: 13, backgroundColor: Colors.slate[300], justifyContent: 'center', paddingHorizontal: 2 },
    toggleActive: { backgroundColor: Colors.green[500] },
    toggleCircle: { width: 22, height: 22, borderRadius: 11, backgroundColor: '#fff' },
    toggleCircleActive: { alignSelf: 'flex-end' },
    statusGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 12 },
    statusCard: { width: '47%' as any, padding: 12, borderRadius: 14 },
    statusDot: { width: 8, height: 8, borderRadius: 4, marginBottom: 6 },
    statusLabel: { fontSize: 12, fontWeight: '600' },
    statusSub: { fontSize: 11, marginTop: 2 },
    errorText: { color: Colors.red[500], fontSize: 12, marginBottom: 16, paddingHorizontal: 4 },
    logoutBtn: { backgroundColor: '#fff', borderRadius: 14, padding: 16, alignItems: 'center', borderWidth: 1, borderColor: Colors.red[200], marginBottom: 20 },
    logoutText: { fontSize: 15, fontWeight: '600', color: Colors.red[500] },
    version: { textAlign: 'center', fontSize: 12, color: Colors.slate[400] },
    copyright: { textAlign: 'center', fontSize: 12, color: Colors.slate[400], marginTop: 4 },
    modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
    modalContent: { backgroundColor: '#fff', borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24, paddingBottom: 40 },
    modalTitle: { fontSize: 20, fontWeight: '600', color: Colors.slate[800], marginBottom: 16 },
    modalHint: { fontSize: 12, color: Colors.slate[500], marginBottom: 10, lineHeight: 18 },
    statusHint: { fontSize: 12, color: Colors.slate[500], marginBottom: 10, lineHeight: 18 },
    modalLabel: { fontSize: 13, fontWeight: '600', color: Colors.slate[700], marginBottom: 8, marginTop: 4 },
    modalInput: { backgroundColor: Colors.slate[50], borderRadius: 12, padding: 14, fontSize: 16, color: Colors.slate[800], borderWidth: 1, borderColor: Colors.slate[200], marginBottom: 10 },
    localToggleRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 10 },
    localToggleText: { fontSize: 13, color: Colors.slate[700], fontWeight: '500' },
    modalBtnRow: { flexDirection: 'row', gap: 10, marginTop: 10 },
    modalCancelBtn: { flex: 1, padding: 14, borderRadius: 12, backgroundColor: Colors.slate[100], alignItems: 'center' },
    modalCancelText: { color: Colors.slate[600], fontWeight: '500' },
    modalSaveBtn: { flex: 1, padding: 14, borderRadius: 12, backgroundColor: Colors.primary[600], alignItems: 'center' },
    modalSaveText: { color: '#fff', fontWeight: '600' },
    modelRow: { flexDirection: 'row', gap: 10, marginBottom: 16 },
    modelOption: { flex: 1, padding: 12, borderRadius: 10, borderWidth: 1, borderColor: Colors.slate[200], backgroundColor: Colors.slate[50], alignItems: 'center' },
    modelOptionActive: { borderColor: Colors.primary[500], backgroundColor: Colors.primary[50] },
    modelOptionText: { color: Colors.slate[600], fontWeight: '500' },
    modelOptionTextActive: { color: Colors.primary[700], fontWeight: '600' },
});
