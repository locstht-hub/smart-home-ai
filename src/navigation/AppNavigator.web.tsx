import React, { useMemo, useState } from 'react';
import { Image, Linking, ScrollView, StyleSheet, Text, TouchableOpacity, useWindowDimensions, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

import { useAuth } from '../contexts/AuthContext';
import { useSmartHomeServer } from '../contexts/SmartHomeServerContext';
import { useData } from '../contexts/DataContext';
import DashboardScreen from '../screens/DashboardScreen';
import RoomsScreen from '../screens/RoomsScreen';
import AnalysisScreen from '../screens/AnalysisScreen';
import ChatScreen from '../screens/ChatScreen';
import SettingsScreen from '../screens/SettingsScreen';
import LoginScreen from '../screens/LoginScreen';
import RegisterScreen from '../screens/RegisterScreen';
import MemberManagementScreen from '../screens/MemberManagementScreen';
import { AppTheme } from '../constants/theme';
import { useConfirmDialog } from '../components/ConfirmDialog';

const Stack = createNativeStackNavigator();
const APP_LOGO = require('../../assets/icon.png');

type UserSection = 'Dashboard' | 'Rooms' | 'Analysis' | 'Chat' | 'Settings' | 'Members';
type NavItem = {
    key: UserSection;
    label: string;
    description: string;
    icon: React.ComponentProps<typeof Ionicons>['name'];
};

export const dashboardNavItems: NavItem[] = [
    { key: 'Dashboard', label: 'Tổng quan', description: 'Điện năng thời gian thực', icon: 'grid-outline' },
    { key: 'Rooms', label: 'Phòng & thiết bị', description: 'Điều khiển có phản hồi', icon: 'home-outline' },
    { key: 'Analysis', label: 'Phân tích & dự báo', description: 'Lịch sử, AI và khuyến nghị', icon: 'analytics-outline' },
    { key: 'Chat', label: 'Trợ lý năng lượng', description: 'Tra cứu và ra lệnh', icon: 'chatbubble-ellipses-outline' },
    { key: 'Settings', label: 'Tài khoản & cài đặt', description: 'Bảo mật và kết nối', icon: 'settings-outline' },
];

function LoadingView() {
    return (
        <View style={styles.centered} accessibilityRole="progressbar" accessibilityLabel="Đang tải Web Dashboard">
            <Image source={APP_LOGO} style={styles.loadingLogo} />
            <Text style={styles.loadingText}>Đang khởi tạo Web Dashboard...</Text>
        </View>
    );
}

function SystemAdminBoundary() {
    const { logout } = useAuth();
    const { confirm, confirmDialog } = useConfirmDialog();

    return (
        <View style={styles.centered}>
            <View style={styles.adminBoundaryCard}>
                <Image source={APP_LOGO} style={styles.boundaryLogo} />
                <Text style={styles.boundaryEyebrow}>SMART HOME AI</Text>
                <Text style={styles.boundaryTitle}>Tài khoản quản trị hệ thống</Text>
                <Text style={styles.boundaryText}>
                    Web Dashboard này dành cho chủ nhà và thành viên. Tài khoản system_admin tiếp tục sử dụng Admin Site tách biệt.
                </Text>
                <TouchableOpacity
                    style={styles.primaryButton}
                    accessibilityRole="link"
                    onPress={() => void Linking.openURL('https://admin.smarthomeai.id.vn')}
                >
                    <Text style={styles.primaryButtonText}>Mở Admin Site</Text>
                    <Ionicons name="open-outline" size={18} color="#ffffff" />
                </TouchableOpacity>
                <TouchableOpacity style={styles.secondaryButton} accessibilityRole="button" onPress={() => confirm({ title: 'Đăng xuất', message: 'Kết thúc phiên quản trị hệ thống hiện tại?', confirmLabel: 'Đăng xuất', destructive: true, onConfirm: async () => { await logout(); } })}>
                    <Text style={styles.secondaryButtonText}>Đăng xuất</Text>
                </TouchableOpacity>
            </View>
            {confirmDialog}
        </View>
    );
}

function WebDashboardShell({ navigation }: { navigation: any }) {
    const { width } = useWindowDimensions();
    const { user } = useAuth();
    const { status, systemStatus } = useSmartHomeServer();
    const { isEmergencyStopped, triggerEmergencyStop, triggerEmergencyReset, canControlDevices } = useData();
    const { confirm, confirmDialog } = useConfirmDialog();
    const [activeSection, setActiveSection] = useState<UserSection>('Dashboard');
    const [focusedControl, setFocusedControl] = useState<UserSection | 'Members' | null>(null);
    const isDesktop = width >= 980;

    const screenNavigation = useMemo(() => ({
        navigate: (target: string, params?: Record<string, unknown>) => {
            if (target === 'RoomList' || target === 'Rooms') setActiveSection('Rooms');
            else if (target === 'MemberManagement') setActiveSection('Members');
            else if (target === 'Dashboard' || target === 'Analysis' || target === 'Chat' || target === 'Settings') {
                setActiveSection(target as UserSection);
            } else {
                navigation.navigate(target, params);
            }
        },
        goBack: () => setActiveSection('Dashboard'),
    }), [navigation]);

    const activeScreen = (() => {
        if (activeSection === 'Rooms') return <RoomsScreen route={{ params: undefined }} />;
        if (activeSection === 'Analysis') return <AnalysisScreen />;
        if (activeSection === 'Chat') return <ChatScreen />;
        if (activeSection === 'Settings') return <SettingsScreen navigation={screenNavigation} />;
        if (activeSection === 'Members') return <MemberManagementScreen navigation={screenNavigation} embedded />;
        return <DashboardScreen navigation={screenNavigation} />;
    })();

    const sourceLabel = systemStatus?.powerSource === 'plc-s7-1200'
        ? 'PLC S7-1200'
        : systemStatus?.powerSource === 'mock-fallback'
            ? 'Mô phỏng dự phòng'
            : 'Chưa xác định nguồn';

    const roleLabel = user?.serverRole === 'owner'
        ? 'Chủ nhà'
        : user?.serverRole === 'viewer'
            ? 'Chỉ xem'
            : 'Thành viên';

    const selectSection = (key: UserSection) => setActiveSection(key);

    const navList = (
        <>
            {dashboardNavItems.map((item) => {
                const selected = activeSection === item.key;
                return (
                    <TouchableOpacity
                        key={item.key}
                        style={[styles.navItem, selected && styles.navItemActive, !isDesktop && styles.navItemCompact, focusedControl === item.key && styles.focusRing]}
                        accessibilityRole="tab"
                        accessibilityState={{ selected }}
                        accessibilityLabel={`${item.label}. ${item.description}`}
                        onPress={() => selectSection(item.key)}
                        onFocus={() => setFocusedControl(item.key)}
                        onBlur={() => setFocusedControl(null)}
                    >
                        <View style={[styles.navIcon, selected && styles.navIconActive]}>
                            <Ionicons name={item.icon} size={20} color={selected ? '#ffffff' : '#50645c'} />
                        </View>
                        {isDesktop ? (
                            <View style={styles.navCopy}>
                                <Text style={[styles.navLabel, selected && styles.navLabelActive]}>{item.label}</Text>
                                <Text style={[styles.navDescription, selected && styles.navDescriptionActive]}>{item.description}</Text>
                            </View>
                        ) : <Text style={[styles.mobileNavLabel, selected && styles.navLabelActive]}>{item.label}</Text>}
                    </TouchableOpacity>
                );
            })}
        </>
    );

    return (
        <View style={styles.shell}>
            {isDesktop ? (
                <View style={styles.sidebar}>
                    <View style={styles.brandRow}>
                        <Image source={APP_LOGO} style={styles.brandLogo} />
                        <View>
                            <Text style={styles.brandName}>Smart Home AI</Text>
                            <Text style={styles.brandCaption}>Energy Control Center</Text>
                        </View>
                    </View>
                    <View style={[styles.sidebarStatus, isEmergencyStopped && styles.sidebarStatusEmergency]}>
                        <View style={[styles.statusDot, isEmergencyStopped ? styles.statusDotEmergency : (status === 'connected' ? styles.statusDotOnline : undefined)]} />
                        <View>
                            <Text style={[styles.statusTitle, isEmergencyStopped && styles.statusTitleEmergency]}>
                                {isEmergencyStopped ? 'DỪNG KHẨN CẤP' : (status === 'connected' ? 'Hệ thống trực tuyến' : 'Đang chờ kết nối')}
                            </Text>
                            <Text style={styles.statusCaption}>
                                {isEmergencyStopped ? 'Toàn bộ phụ tải đã ngắt' : sourceLabel}
                            </Text>
                        </View>
                    </View>
                    <View style={styles.sidebarNav} accessibilityRole="tablist">{navList}</View>
                    {user?.serverRole === 'owner' && user?.canManageMembers ? (
                        <TouchableOpacity
                            style={[styles.memberButton, activeSection === 'Members' && styles.memberButtonActive, focusedControl === 'Members' && styles.focusRing]}
                            onPress={() => setActiveSection('Members')}
                            onFocus={() => setFocusedControl('Members')}
                            onBlur={() => setFocusedControl(null)}
                            accessibilityRole="button"
                        >
                            <Ionicons name="people-outline" size={19} color="#0f766e" />
                            <Text style={styles.memberButtonText}>Quản lý thành viên</Text>
                        </TouchableOpacity>
                    ) : null}
                    <View style={styles.sidebarFooter}>
                        <View style={styles.avatar}><Text style={styles.avatarText}>{user?.name?.trim().charAt(0).toUpperCase() || 'U'}</Text></View>
                        <View style={styles.userCopy}>
                            <Text style={styles.userName} numberOfLines={1}>{user?.name}</Text>
                            <Text style={styles.userRole}>{roleLabel}</Text>
                        </View>
                    </View>
                </View>
            ) : null}

            <View style={styles.workspace}>
                <View style={styles.topbar}>
                    <View>
                        <Text style={styles.topbarEyebrow}>WEB DASHBOARD</Text>
                        <Text style={styles.topbarTitle}>{activeSection === 'Members' ? 'Quản lý thành viên' : dashboardNavItems.find(item => item.key === activeSection)?.label}</Text>
                    </View>
                    <View style={styles.topbarRight}>
                        {isEmergencyStopped ? (
                            <TouchableOpacity
                                style={styles.topbarEstopActive}
                                accessibilityRole="button"
                                accessibilityLabel="Khôi phục hệ thống từ dừng khẩn cấp"
                                onPress={() => confirm({
                                    title: 'Khôi phục hệ thống',
                                    message: 'Xác nhận khôi phục hệ thống từ trạng thái Dừng Khẩn Cấp (E-Stop)? Các thiết bị sẽ có thể được điều khiển trở lại.',
                                    confirmLabel: 'Khôi phục hệ thống',
                                    onConfirm: async () => {
                                        const res = await triggerEmergencyReset();
                                        if (!res.success) window.alert(res.message || 'Không thể khôi phục hệ thống');
                                    }
                                })}
                            >
                                <Ionicons name="refresh-circle" size={18} color="#ffffff" />
                                <Text style={styles.topbarEstopActiveText}>E-STOP ĐANG BẬT (KHÔI PHỤC)</Text>
                            </TouchableOpacity>
                        ) : (
                            <TouchableOpacity
                                style={styles.topbarEstopNormal}
                                accessibilityRole="button"
                                accessibilityLabel="Dừng khẩn cấp toàn bộ hệ thống"
                                onPress={() => confirm({
                                    title: '🛑 DỪNG KHẨN CẤP (EMERGENCY STOP)',
                                    message: 'CẢNH BÁO: Gửi lệnh ưu tiên cao nhất ngắt TOÀN BỘ phụ tải và khóa hệ thống để xử lý sự cố? Hành động này sẽ được ghi vào nhật ký kiểm toán.',
                                    confirmLabel: 'DỪNG KHẨN CẤP',
                                    destructive: true,
                                    onConfirm: async () => {
                                        const res = await triggerEmergencyStop();
                                        if (!res.success) window.alert(res.message || 'Không thể dừng khẩn cấp');
                                    }
                                })}
                            >
                                <Ionicons name="alert-circle" size={16} color="#dc2626" />
                                <Text style={styles.topbarEstopNormalText}>Dừng khẩn cấp</Text>
                            </TouchableOpacity>
                        )}
                        <View style={styles.topbarStatus}>
                            <View style={[styles.statusDot, status === 'connected' && styles.statusDotOnline]} />
                            <Text style={styles.topbarStatusText}>{sourceLabel}</Text>
                        </View>
                    </View>
                </View>

                {!isDesktop ? (
                    <ScrollView style={styles.mobileNavScroller} horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.mobileNav} accessibilityRole="tablist">
                        {navList}
                    </ScrollView>
                ) : null}

                <View style={styles.screenViewport}>
                    <View style={styles.screenCanvas}>{activeScreen}</View>
                </View>
            </View>
            {confirmDialog}
        </View>
    );
}

function AuthenticatedNavigator() {
    return (
        <Stack.Navigator screenOptions={{ headerShown: false }}>
            <Stack.Screen name="WebDashboard" component={WebDashboardShell} />
            <Stack.Screen name="MemberManagement" component={MemberManagementScreen} />
        </Stack.Navigator>
    );
}

export default function AppNavigator() {
    const { user, isLoading } = useAuth();
    if (isLoading) return <LoadingView />;

    return (
        <NavigationContainer>
            {!user ? (
                <Stack.Navigator screenOptions={{ headerShown: false }}>
                    <Stack.Screen name="Login" component={LoginScreen} />
                    <Stack.Screen name="Register" component={RegisterScreen} />
                </Stack.Navigator>
            ) : user.serverRole === 'system_admin' ? (
                <SystemAdminBoundary />
            ) : (
                <AuthenticatedNavigator />
            )}
        </NavigationContainer>
    );
}

const styles = StyleSheet.create({
    shell: { flex: 1, flexDirection: 'row', backgroundColor: AppTheme.colors.canvas, minHeight: '100vh' as any },
    centered: { flex: 1, minHeight: '100vh' as any, alignItems: 'center', justifyContent: 'center', padding: 24, backgroundColor: AppTheme.colors.canvas },
    loadingLogo: { width: 54, height: 54, borderRadius: 16 },
    loadingText: { marginTop: 14, color: AppTheme.colors.inkMuted, fontWeight: '700' },
    sidebar: { width: 284, paddingHorizontal: 18, paddingTop: 22, paddingBottom: 18, backgroundColor: '#f8fbf9', borderRightWidth: 1, borderRightColor: AppTheme.colors.border },
    brandRow: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 8, marginBottom: 24 },
    brandLogo: { width: 42, height: 42, borderRadius: 13 },
    brandName: { color: AppTheme.colors.ink, fontSize: 17, fontWeight: '900', letterSpacing: -0.3 },
    brandCaption: { color: AppTheme.colors.inkMuted, fontSize: 10, fontWeight: '700', marginTop: 2, letterSpacing: 0.4 },
    sidebarStatus: { flexDirection: 'row', alignItems: 'center', gap: 10, padding: 12, marginBottom: 18, borderRadius: 15, backgroundColor: AppTheme.colors.surfaceMuted, borderWidth: 1, borderColor: AppTheme.colors.border },
    sidebarStatusEmergency: { backgroundColor: '#fef2f2', borderColor: '#fca5a5' },
    statusDot: { width: 9, height: 9, borderRadius: 5, backgroundColor: '#f59e0b' },
    statusDotOnline: { backgroundColor: '#10b981' },
    statusDotEmergency: { backgroundColor: '#ef4444' },
    statusTitle: { color: AppTheme.colors.ink, fontSize: 12, fontWeight: '800' },
    statusTitleEmergency: { color: '#b91c1c' },
    statusCaption: { color: AppTheme.colors.inkMuted, fontSize: 10, marginTop: 2 },
    sidebarNav: { gap: 7 },
    navItem: { minHeight: 62, flexDirection: 'row', alignItems: 'center', padding: 9, borderRadius: 16, borderWidth: 1, borderColor: 'transparent' },
    navItemActive: { backgroundColor: '#e0f2ef', borderColor: '#b8ded7' },
    focusRing: { outlineWidth: 2, outlineStyle: 'solid', outlineColor: '#0f766e', outlineOffset: 2 } as any,
    navItemCompact: { height: 48, minHeight: 48, maxHeight: 48, flexGrow: 0, flexShrink: 0, paddingVertical: 4, paddingHorizontal: 10, marginRight: 8, gap: 7, backgroundColor: '#f8fbf9', borderColor: AppTheme.colors.border },
    navIcon: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center', borderRadius: 13, backgroundColor: '#edf3f0' },
    navIconActive: { backgroundColor: '#0f766e' },
    navCopy: { flex: 1, marginLeft: 10 },
    navLabel: { color: '#33463f', fontSize: 13, fontWeight: '800' },
    navLabelActive: { color: '#0f766e' },
    navDescription: { color: '#80918a', fontSize: 10, marginTop: 3 },
    navDescriptionActive: { color: '#4f8178' },
    mobileNavLabel: { color: '#50645c', fontSize: 12, fontWeight: '800' },
    memberButton: { marginTop: 16, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, borderRadius: 14, padding: 12, borderWidth: 1, borderColor: '#b8ded7', backgroundColor: '#f0fdfa' },
    memberButtonActive: { backgroundColor: '#d8eee9', borderColor: '#6fc3b5' },
    memberButtonText: { color: '#0f766e', fontSize: 12, fontWeight: '800' },
    sidebarFooter: { marginTop: 'auto', flexDirection: 'row', alignItems: 'center', padding: 10, borderTopWidth: 1, borderTopColor: AppTheme.colors.border },
    avatar: { width: 38, height: 38, borderRadius: 12, backgroundColor: '#173a31', alignItems: 'center', justifyContent: 'center' },
    avatarText: { color: '#ffffff', fontWeight: '900' },
    userCopy: { flex: 1, marginLeft: 10 },
    userName: { color: AppTheme.colors.ink, fontSize: 12, fontWeight: '800' },
    userRole: { color: AppTheme.colors.inkMuted, fontSize: 10, marginTop: 2 },
    workspace: { flex: 1, minWidth: 0 },
    topbar: { minHeight: 78, paddingHorizontal: 24, paddingVertical: 14, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: 'rgba(248,251,249,0.96)', borderBottomWidth: 1, borderBottomColor: AppTheme.colors.border },
    topbarEyebrow: { color: '#0f766e', fontSize: 9, fontWeight: '900', letterSpacing: 1.4 },
    topbarTitle: { color: AppTheme.colors.ink, fontSize: 22, fontWeight: '900', marginTop: 3, letterSpacing: -0.4 },
    topbarRight: { flexDirection: 'row', alignItems: 'center', gap: 12 },
    topbarEstopNormal: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingVertical: 8, paddingHorizontal: 14, borderRadius: 10, backgroundColor: '#fef2f2', borderWidth: 1, borderColor: '#fecaca', cursor: 'pointer' as any },
    topbarEstopNormalText: { color: '#dc2626', fontSize: 12, fontWeight: '800' },
    topbarEstopActive: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingVertical: 8, paddingHorizontal: 14, borderRadius: 10, backgroundColor: '#dc2626', borderWidth: 1, borderColor: '#b91c1c', cursor: 'pointer' as any },
    topbarEstopActiveText: { color: '#ffffff', fontSize: 12, fontWeight: '900', letterSpacing: 0.3 },
    topbarStatus: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingVertical: 8, paddingHorizontal: 12, borderRadius: 999, backgroundColor: '#edf3f0' },
    topbarStatusText: { color: '#50645c', fontSize: 11, fontWeight: '800' },
    mobileNavScroller: { flexGrow: 0, flexShrink: 0, height: 68, maxHeight: 68, minHeight: 68, backgroundColor: AppTheme.colors.canvas },
    mobileNav: { height: 68, alignItems: 'center', paddingHorizontal: 14, paddingVertical: 10, backgroundColor: AppTheme.colors.canvas },
    screenViewport: { flex: 1, alignItems: 'center', minHeight: 0 },
    screenCanvas: { width: '100%', maxWidth: 1180, flex: 1, minHeight: 0 },
    adminBoundaryCard: { width: '100%', maxWidth: 520, alignItems: 'center', padding: 34, borderRadius: 26, borderWidth: 1, borderColor: AppTheme.colors.border, backgroundColor: AppTheme.colors.surface },
    boundaryLogo: { width: 64, height: 64, borderRadius: 18, marginBottom: 18 },
    boundaryEyebrow: { color: '#0f766e', fontSize: 10, fontWeight: '900', letterSpacing: 1.8 },
    boundaryTitle: { marginTop: 8, color: AppTheme.colors.ink, fontSize: 26, fontWeight: '900', textAlign: 'center' },
    boundaryText: { marginTop: 12, color: AppTheme.colors.inkMuted, fontSize: 14, lineHeight: 22, textAlign: 'center' },
    primaryButton: { width: '100%', marginTop: 24, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, padding: 14, borderRadius: 14, backgroundColor: '#0f766e' },
    primaryButtonText: { color: '#ffffff', fontSize: 14, fontWeight: '900' },
    secondaryButton: { marginTop: 10, padding: 12 },
    secondaryButtonText: { color: '#50645c', fontSize: 13, fontWeight: '800' },
});
