import React, { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, Alert, FlatList, KeyboardAvoidingView, Modal, Platform, RefreshControl, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useAuth } from '../contexts/AuthContext';
import { useSmartHomeServer } from '../contexts/SmartHomeServerContext';
import { Colors } from '../constants/colors';
import { HomeActivityLog, HomeMember } from '../types/smartHomeServer';

const ROLE_LABELS: Record<string, string> = {
    owner: 'Chủ nhà',
    member: 'Thành viên',
    viewer: 'Chỉ xem',
};

const ROLE_COLORS: Record<string, { bg: string; text: string }> = {
    owner: { bg: '#e0f2ef', text: '#0f766e' },
    member: { bg: '#fff0cf', text: Colors.amber[700] },
    viewer: { bg: '#e7eee9', text: '#50645c' },
};

const STATUS_COLORS: Record<string, { bg: string; text: string }> = {
    active: { bg: Colors.green[100], text: Colors.green[700] },
    suspended: { bg: Colors.red[100], text: Colors.red[600] },
};

export default function MemberManagementScreen({ navigation }: { navigation: any }) {
    const { user } = useAuth();
    const { client } = useSmartHomeServer();
    const [members, setMembers] = useState<HomeMember[]>([]);
    const [activityLogs, setActivityLogs] = useState<HomeActivityLog[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [showAddModal, setShowAddModal] = useState(false);
    const [resetPasswordMember, setResetPasswordMember] = useState<HomeMember | null>(null);
    const [submitting, setSubmitting] = useState(false);

    // Add member form state
    const [newName, setNewName] = useState('');
    const [newUsername, setNewUsername] = useState('');
    const [newPhone, setNewPhone] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [newRole, setNewRole] = useState<'member' | 'viewer'>('member');
    const [newCanManageDevices, setNewCanManageDevices] = useState(true);
    const [resetPassword, setResetPassword] = useState('');

    const homeId = user?.homeId;
    const homeName = user?.homeName || 'Nhà của tôi';

    const fetchMembers = useCallback(async () => {
        if (!homeId) return;
        try {
            const [list, logs] = await Promise.all([
                client.getHomeMembers(homeId),
                client.getHomeActivity(homeId, 80),
            ]);
            setMembers(list);
            setActivityLogs(logs);
        } catch (error) {
            console.error('Error fetching members:', error);
            Alert.alert('Lỗi', 'Không thể tải danh sách thành viên hoặc nhật ký hoạt động.');
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    }, [client, homeId]);

    useEffect(() => {
        void fetchMembers();
    }, [fetchMembers]);

    const handleRefresh = useCallback(() => {
        setRefreshing(true);
        void fetchMembers();
    }, [fetchMembers]);

    const resetForm = () => {
        setNewName('');
        setNewUsername('');
        setNewPhone('');
        setNewPassword('');
        setNewRole('member');
        setNewCanManageDevices(true);
    };

    const handleAddMember = async () => {
        if (!homeId) return;
        if (!newName.trim() || !newUsername.trim() || !newPassword.trim()) {
            Alert.alert('Lỗi', 'Vui lòng nhập họ tên, tên đăng nhập và mật khẩu.');
            return;
        }
        if (newPassword.length < 6) {
            Alert.alert('Lỗi', 'Mật khẩu phải có ít nhất 6 ký tự.');
            return;
        }

        setSubmitting(true);
        try {
            await client.createHomeMember(homeId, {
                name: newName.trim(),
                username: newUsername.trim(),
                phone: newPhone.trim() || undefined,
                password: newPassword,
                roleInHome: newRole,
                canManageDevices: newCanManageDevices,
                canManageMembers: false,
            });
            Alert.alert('Thành công', `Đã thêm thành viên "${newName.trim()}" vào nhà.`);
            setShowAddModal(false);
            resetForm();
            void fetchMembers();
        } catch (error) {
            const message = error instanceof Error ? error.message : 'Không thể thêm thành viên.';
            Alert.alert('Lỗi', message);
        } finally {
            setSubmitting(false);
        }
    };

    const handleSuspend = (member: HomeMember) => {
        Alert.alert(
            'Tạm khóa thành viên',
            `Bạn có chắc muốn tạm khóa "${member.name}"? Thành viên sẽ không thể đăng nhập và điều khiển thiết bị.`,
            [
                { text: 'Hủy', style: 'cancel' },
                {
                    text: 'Tạm khóa',
                    style: 'destructive',
                    onPress: async () => {
                        try {
                            await client.suspendHomeMember(homeId!, member.id);
                            Alert.alert('Thành công', `Đã tạm khóa "${member.name}".`);
                            void fetchMembers();
                        } catch (error) {
                            Alert.alert('Lỗi', 'Không thể tạm khóa thành viên.');
                        }
                    },
                },
            ],
        );
    };

    const handleActivate = async (member: HomeMember) => {
        try {
            await client.activateHomeMember(homeId!, member.id);
            Alert.alert('Thành công', `Đã kích hoạt lại "${member.name}".`);
            void fetchMembers();
        } catch (error) {
            Alert.alert('Lỗi', 'Không thể kích hoạt thành viên.');
        }
    };

    const handleDelete = (member: HomeMember) => {
        Alert.alert(
            'Xóa thành viên',
            `Bạn có chắc muốn xóa "${member.name}" khỏi nhà? Hành động này không thể hoàn tác.`,
            [
                { text: 'Hủy', style: 'cancel' },
                {
                    text: 'Xóa',
                    style: 'destructive',
                    onPress: async () => {
                        try {
                            await client.deleteHomeMember(homeId!, member.id);
                            Alert.alert('Thành công', `Đã xóa "${member.name}" khỏi nhà.`);
                            void fetchMembers();
                        } catch (error) {
                            Alert.alert('Lỗi', 'Không thể xóa thành viên.');
                        }
                    },
                },
            ],
        );
    };

    const handleResetPassword = async () => {
        if (!homeId || !resetPasswordMember) return;
        if (resetPassword.length < 6) {
            Alert.alert('Lỗi', 'Mật khẩu mới phải có ít nhất 6 ký tự.');
            return;
        }

        setSubmitting(true);
        try {
            await client.resetHomeMemberPassword(homeId, resetPasswordMember.id, resetPassword);
            Alert.alert('Thành công', `Đã đổi mật khẩu cho "${resetPasswordMember.name}". Tài khoản này cần đăng nhập lại bằng mật khẩu mới.`);
            setResetPasswordMember(null);
            setResetPassword('');
            void fetchMembers();
        } catch (error) {
            const message = error instanceof Error ? error.message : 'Không thể đổi mật khẩu thành viên.';
            Alert.alert('Lỗi', message);
        } finally {
            setSubmitting(false);
        }
    };

    const formatDateTime = (iso: string) => {
        const date = new Date(iso);
        return date.toLocaleString('vi-VN', { hour12: false });
    };

    const getActivityText = (log: HomeActivityLog) => {
        const actor = log.actorUsername || 'Hệ thống';
        const target = log.targetName ? ` "${log.targetName}"` : '';
        const state = typeof log.metadata?.isOn === 'boolean'
            ? (log.metadata.isOn ? 'bật' : 'tắt')
            : '';

        switch (log.action) {
            case 'auth.login_success':
                return `${actor} đăng nhập vào app`;
            case 'auth.login_failed':
                return `Đăng nhập thất bại cho tài khoản${target}`;
            case 'device.turn_on':
                return `${actor} bật thiết bị${target}`;
            case 'device.turn_off':
                return `${actor} tắt thiết bị${target}`;
            case 'scene.apply':
                return `${actor} kích hoạt cảnh${target}`;
            case 'home.quota_updated':
                if (typeof log.metadata?.oldLimit === 'number' && typeof log.metadata?.newLimit === 'number') {
                    return `${actor} cập nhật hạn mức HEMS từ ${log.metadata.oldLimit} kWh lên ${log.metadata.newLimit} kWh`;
                }
                return `${actor} cập nhật hạn mức HEMS`;
            case 'device.control_blocked_quota':
                return `${actor} bị chặn điều khiển thiết bị${target} vì vượt hạn mức HEMS`;
            case 'scene.blocked_quota':
                return `${actor} bị chặn kích hoạt cảnh${target} vì vượt hạn mức HEMS`;
            case 'assistant.chat':
                return `${actor} gửi câu hỏi/lệnh cho Chat AI`;
            case 'assistant.provider_reply':
                return `Chat AI phản hồi qua ${log.metadata?.provider || 'provider'}`;
            case 'home.create_member':
                return `${actor} tạo tài khoản thành viên${target}`;
            case 'home.suspend_member':
                return `${actor} tạm khóa thành viên${target}`;
            case 'home.activate_member':
                return `${actor} kích hoạt thành viên${target}`;
            case 'home.delete_member':
                return `${actor} xóa thành viên${target}`;
            case 'home.reset_member_password':
                return `${actor} đổi mật khẩu thành viên${target}`;
            default:
                return `${actor} ${state ? `${state} ` : ''}${log.action}${target}`;
        }
    };

    const renderMemberCard = ({ item }: { item: HomeMember }) => {
        const isOwner = item.roleInHome === 'owner';
        const roleStyle = ROLE_COLORS[item.roleInHome] || ROLE_COLORS.viewer;
        const statusStyle = STATUS_COLORS[item.status] || STATUS_COLORS.active;

        return (
            <View style={styles.memberCard}>
                <View style={styles.memberHeader}>
                    <View style={styles.memberAvatar}>
                        <Text style={styles.memberAvatarText}>
                            {item.name.charAt(0).toUpperCase()}
                        </Text>
                    </View>
                    <View style={styles.memberInfo}>
                        <Text style={styles.memberName}>{item.name}</Text>
                        <Text style={styles.memberUsername}>@{item.username}</Text>
                        {item.phone ? <Text style={styles.memberPhone}>{item.phone}</Text> : null}
                    </View>
                </View>

                <View style={styles.badgeRow}>
                    <View style={[styles.badge, { backgroundColor: roleStyle.bg }]}>
                        <Text style={[styles.badgeText, { color: roleStyle.text }]}>
                            {ROLE_LABELS[item.roleInHome] || item.roleInHome}
                        </Text>
                    </View>
                    <View style={[styles.badge, { backgroundColor: statusStyle.bg }]}>
                        <Text style={[styles.badgeText, { color: statusStyle.text }]}>
                            {item.status === 'active' ? 'Hoạt động' : 'Đã khóa'}
                        </Text>
                    </View>
                    {item.canManageDevices && !isOwner ? (
                        <View style={[styles.badge, { backgroundColor: Colors.amber[100] }]}>
                            <Text style={[styles.badgeText, { color: Colors.amber[700] }]}>Điều khiển TB</Text>
                        </View>
                    ) : null}
                </View>

                {!isOwner ? (
                    <View style={styles.actionRow}>
                        {item.status === 'active' ? (
                            <TouchableOpacity style={[styles.actionBtn, styles.suspendBtn]} onPress={() => handleSuspend(item)}>
                                <Text style={styles.suspendBtnText}>Tạm khóa</Text>
                            </TouchableOpacity>
                        ) : (
                            <TouchableOpacity style={[styles.actionBtn, styles.activateBtn]} onPress={() => { void handleActivate(item); }}>
                                <Text style={styles.activateBtnText}>Kích hoạt</Text>
                            </TouchableOpacity>
                        )}
                        <TouchableOpacity style={[styles.actionBtn, styles.passwordBtn]} onPress={() => {
                            setResetPasswordMember(item);
                            setResetPassword('');
                        }}>
                            <Text style={styles.passwordBtnText}>Mật khẩu</Text>
                        </TouchableOpacity>
                        <TouchableOpacity style={[styles.actionBtn, styles.deleteBtn]} onPress={() => handleDelete(item)}>
                            <Text style={styles.deleteBtnText}>Xóa</Text>
                        </TouchableOpacity>
                    </View>
                ) : (
                    <View style={styles.ownerNote}>
                        <Text style={styles.ownerNoteText}>Chủ sở hữu không thể chỉnh sửa</Text>
                    </View>
                )}
            </View>
        );
    };

    const memberCount = members.length;
    const nonOwnerCount = members.filter(m => m.roleInHome !== 'owner').length;

    if (loading) {
        return (
            <View style={styles.centered}>
                <ActivityIndicator size="large" color="#0f766e" />
                <Text style={styles.loadingText}>Đang tải danh sách...</Text>
            </View>
        );
    }

    return (
        <View style={styles.container}>
            <LinearGradient colors={['#10251f', '#173a31', '#0f172a']} style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
                    <Text style={styles.backBtnText}>{'<'} Quay lại</Text>
                </TouchableOpacity>
                <Text style={styles.headerTitle}>{homeName}</Text>
                <Text style={styles.headerSub}>{memberCount} thành viên ({nonOwnerCount} thành viên con)</Text>
            </LinearGradient>

            <FlatList
                data={members}
                keyExtractor={item => item.id}
                renderItem={renderMemberCard}
                contentContainerStyle={styles.listContent}
                refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} colors={['#0f766e']} />}
                ListEmptyComponent={
                    <View style={styles.emptyState}>
                        <Text style={styles.emptyIcon}>👥</Text>
                        <Text style={styles.emptyTitle}>Chưa có thành viên nào</Text>
                        <Text style={styles.emptySub}>Nhấn nút bên dưới để thêm thành viên vào nhà.</Text>
                    </View>
                }
                ListFooterComponent={
                    <View style={styles.activitySection}>
                        <View style={styles.activityHeader}>
                            <Text style={styles.activityTitle}>Nhật ký hoạt động</Text>
                            <TouchableOpacity onPress={handleRefresh}>
                                <Text style={styles.activityRefresh}>Đọc lại</Text>
                            </TouchableOpacity>
                        </View>
                        {activityLogs.length === 0 ? (
                            <View style={styles.activityEmpty}>
                                <Text style={styles.activityEmptyText}>Chưa có hoạt động nào trong nhà.</Text>
                            </View>
                        ) : activityLogs.slice(0, 20).map((log) => (
                            <View key={log.id} style={styles.activityItem}>
                                <View style={styles.activityDot} />
                                <View style={{ flex: 1 }}>
                                    <Text style={styles.activityText}>{getActivityText(log)}</Text>
                                    <Text style={styles.activityTime}>{formatDateTime(log.createdAt)}</Text>
                                </View>
                            </View>
                        ))}
                    </View>
                }
            />

            <TouchableOpacity style={styles.fab} onPress={() => setShowAddModal(true)}>
                <Text style={styles.fabText}>+ Thêm thành viên</Text>
            </TouchableOpacity>

            <Modal visible={showAddModal} transparent animationType="slide">
                <KeyboardAvoidingView style={styles.modalOverlay} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
                    <View style={styles.modalContent}>
                        <Text style={styles.modalTitle}>Thêm thành viên mới</Text>
                        <Text style={styles.modalHint}>Tạo tài khoản con trong nhà để thành viên đăng nhập và sử dụng app.</Text>

                        <TextInput
                            style={styles.modalInput}
                            placeholder="Họ tên"
                            value={newName}
                            onChangeText={setNewName}
                            autoCorrect={false}
                            placeholderTextColor={Colors.slate[400]}
                        />
                        <TextInput
                            style={styles.modalInput}
                            placeholder="Tên đăng nhập"
                            value={newUsername}
                            onChangeText={setNewUsername}
                            autoCorrect={false}
                            autoCapitalize="none"
                            placeholderTextColor={Colors.slate[400]}
                        />
                        <TextInput
                            style={styles.modalInput}
                            placeholder="Số điện thoại (tùy chọn)"
                            value={newPhone}
                            onChangeText={setNewPhone}
                            keyboardType="phone-pad"
                            placeholderTextColor={Colors.slate[400]}
                        />
                        <TextInput
                            style={styles.modalInput}
                            placeholder="Mật khẩu (ít nhất 6 ký tự)"
                            value={newPassword}
                            onChangeText={setNewPassword}
                            secureTextEntry
                            placeholderTextColor={Colors.slate[400]}
                        />

                        <Text style={styles.modalLabel}>Vai trò trong nhà</Text>
                        <View style={styles.roleRow}>
                            <TouchableOpacity
                                style={[styles.roleOption, newRole === 'member' && styles.roleOptionActive]}
                                onPress={() => { setNewRole('member'); setNewCanManageDevices(true); }}
                            >
                                <Text style={[styles.roleOptionText, newRole === 'member' && styles.roleOptionTextActive]}>Thành viên</Text>
                                <Text style={styles.roleOptionHint}>Điều khiển thiết bị</Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                style={[styles.roleOption, newRole === 'viewer' && styles.roleOptionActive]}
                                onPress={() => { setNewRole('viewer'); setNewCanManageDevices(false); }}
                            >
                                <Text style={[styles.roleOptionText, newRole === 'viewer' && styles.roleOptionTextActive]}>Chỉ xem</Text>
                                <Text style={styles.roleOptionHint}>Không điều khiển</Text>
                            </TouchableOpacity>
                        </View>

                        {newRole === 'member' ? (
                            <TouchableOpacity style={styles.toggleRow} onPress={() => setNewCanManageDevices(!newCanManageDevices)}>
                                <View style={[styles.toggle, newCanManageDevices && styles.toggleActive]}>
                                    <View style={[styles.toggleCircle, newCanManageDevices && styles.toggleCircleActive]} />
                                </View>
                                <Text style={styles.toggleLabel}>Quyền điều khiển thiết bị</Text>
                            </TouchableOpacity>
                        ) : null}

                        <View style={styles.modalBtnRow}>
                            <TouchableOpacity style={styles.modalCancelBtn} onPress={() => { setShowAddModal(false); resetForm(); }}>
                                <Text style={styles.modalCancelText}>Hủy</Text>
                            </TouchableOpacity>
                            <TouchableOpacity style={styles.modalSaveBtn} onPress={() => { void handleAddMember(); }} disabled={submitting}>
                                {submitting ? (
                                    <ActivityIndicator size="small" color="#fff" />
                                ) : (
                                    <Text style={styles.modalSaveText}>Thêm</Text>
                                )}
                            </TouchableOpacity>
                        </View>
                    </View>
                </KeyboardAvoidingView>
            </Modal>

            <Modal visible={!!resetPasswordMember} transparent animationType="slide">
                <KeyboardAvoidingView style={styles.modalOverlay} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
                    <View style={styles.modalContent}>
                        <Text style={styles.modalTitle}>Đổi mật khẩu thành viên</Text>
                        <Text style={styles.modalHint}>
                            Mật khẩu mới sẽ áp dụng cho tài khoản {resetPasswordMember?.username}. Phiên đăng nhập cũ của thành viên sẽ bị đăng xuất.
                        </Text>
                        <TextInput
                            style={styles.modalInput}
                            placeholder="Mật khẩu mới (ít nhất 6 ký tự)"
                            value={resetPassword}
                            onChangeText={setResetPassword}
                            secureTextEntry
                            placeholderTextColor={Colors.slate[400]}
                        />
                        <View style={styles.modalBtnRow}>
                            <TouchableOpacity style={styles.modalCancelBtn} onPress={() => {
                                setResetPasswordMember(null);
                                setResetPassword('');
                            }} disabled={submitting}>
                                <Text style={styles.modalCancelText}>Hủy</Text>
                            </TouchableOpacity>
                            <TouchableOpacity style={styles.modalSaveBtn} onPress={() => { void handleResetPassword(); }} disabled={submitting}>
                                {submitting ? (
                                    <ActivityIndicator size="small" color="#fff" />
                                ) : (
                                    <Text style={styles.modalSaveText}>Lưu mật khẩu</Text>
                                )}
                            </TouchableOpacity>
                        </View>
                    </View>
                </KeyboardAvoidingView>
            </Modal>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#edf3f0' },
    centered: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#edf3f0' },
    loadingText: { marginTop: 12, color: '#61736c', fontSize: 14, fontWeight: '700' },

    // Header
    header: { paddingTop: 50, paddingBottom: 22, paddingHorizontal: 20, borderBottomWidth: 1, borderBottomColor: 'rgba(209, 250, 229, 0.14)', shadowColor: '#10251f', shadowOpacity: 0.2, shadowRadius: 20, shadowOffset: { width: 0, height: 10 }, elevation: 4 },
    backBtn: { marginBottom: 12 },
    backBtnText: { color: 'rgba(236,253,245,0.86)', fontSize: 14, fontWeight: '800' },
    headerTitle: { fontSize: 24, fontWeight: '900', color: '#fff', letterSpacing: -0.3 },
    headerSub: { fontSize: 13, color: 'rgba(236,253,245,0.72)', marginTop: 4, fontWeight: '600' },

    // List
    listContent: { padding: 16, paddingBottom: 100 },

    // Member card
    memberCard: {
        backgroundColor: '#f8fbf9',
        borderRadius: 18,
        padding: 16,
        marginBottom: 12,
        shadowColor: '#173a31',
        shadowOpacity: 0.06,
        shadowRadius: 16,
        shadowOffset: { width: 0, height: 9 },
        elevation: 2,
        borderWidth: 1,
        borderColor: '#dce7e1',
    },
    memberHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
    memberAvatar: {
        width: 46,
        height: 46,
        borderRadius: 14,
        backgroundColor: '#e0f2ef',
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 12,
    },
    memberAvatarText: { fontSize: 20, fontWeight: '900', color: '#0f766e' },
    memberInfo: { flex: 1 },
    memberName: { fontSize: 16, fontWeight: '900', color: '#13251f' },
    memberUsername: { fontSize: 12, color: '#61736c', marginTop: 2, fontWeight: '700' },
    memberPhone: { fontSize: 12, color: '#7c8c86', marginTop: 1 },

    // Badges
    badgeRow: { flexDirection: 'row', gap: 6, marginBottom: 12 },
    badge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 9 },
    badgeText: { fontSize: 11, fontWeight: '800' },

    // Actions
    actionRow: { flexDirection: 'row', gap: 8 },
    actionBtn: { flex: 1, paddingVertical: 10, borderRadius: 12, alignItems: 'center' },
    suspendBtn: { backgroundColor: '#fff8e6', borderWidth: 1, borderColor: '#f5d991' },
    suspendBtnText: { color: Colors.amber[700], fontWeight: '800', fontSize: 13 },
    activateBtn: { backgroundColor: '#d9f3df', borderWidth: 1, borderColor: '#86efac' },
    activateBtnText: { color: Colors.green[700], fontWeight: '800', fontSize: 13 },
    passwordBtn: { backgroundColor: '#e0f2ef', borderWidth: 1, borderColor: '#b8ded7' },
    passwordBtnText: { color: '#0f766e', fontWeight: '800', fontSize: 13 },
    deleteBtn: { backgroundColor: '#fff4f2', borderWidth: 1, borderColor: '#fecaca' },
    deleteBtnText: { color: Colors.red[600], fontWeight: '800', fontSize: 13 },
    ownerNote: { paddingVertical: 8, alignItems: 'center' },
    ownerNoteText: { color: '#7c8c86', fontSize: 12, fontStyle: 'italic', fontWeight: '600' },

    // Empty
    emptyState: { alignItems: 'center', paddingVertical: 60 },
    emptyIcon: { fontSize: 48, marginBottom: 12 },
    emptyTitle: { fontSize: 18, fontWeight: '800', color: '#50645c', marginBottom: 6 },
    emptySub: { fontSize: 13, color: '#7c8c86', textAlign: 'center', paddingHorizontal: 40 },

    // Activity log
    activitySection: {
        backgroundColor: '#f8fbf9',
        borderRadius: 18,
        padding: 16,
        marginTop: 8,
        marginBottom: 96,
        borderWidth: 1,
        borderColor: '#dce7e1',
        shadowColor: '#173a31',
        shadowOpacity: 0.06,
        shadowRadius: 16,
        shadowOffset: { width: 0, height: 9 },
        elevation: 2,
    },
    activityHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
    activityTitle: { fontSize: 16, fontWeight: '900', color: '#13251f' },
    activityRefresh: { fontSize: 13, fontWeight: '800', color: '#0f766e' },
    activityEmpty: { paddingVertical: 14, alignItems: 'center' },
    activityEmptyText: { color: '#7c8c86', fontSize: 13 },
    activityItem: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        paddingVertical: 10,
        borderTopWidth: 1,
        borderTopColor: '#dce7e1',
    },
    activityDot: {
        width: 8,
        height: 8,
        borderRadius: 4,
        backgroundColor: '#0f766e',
        marginTop: 5,
        marginRight: 10,
    },
    activityText: { color: '#50645c', fontSize: 13, lineHeight: 18 },
    activityTime: { color: '#7c8c86', fontSize: 11, marginTop: 3 },

    // FAB
    fab: {
        position: 'absolute',
        bottom: 24,
        right: 20,
        left: 20,
        backgroundColor: '#0f766e',
        borderRadius: 16,
        paddingVertical: 16,
        alignItems: 'center',
        shadowColor: '#173a31',
        shadowOpacity: 0.3,
        shadowRadius: 12,
        shadowOffset: { width: 0, height: 4 },
        elevation: 6,
    },
    fabText: { color: '#fff', fontSize: 16, fontWeight: '700' },

    // Modal
    modalOverlay: { flex: 1, backgroundColor: 'rgba(15,23,42,0.56)', justifyContent: 'flex-end' },
    modalContent: { backgroundColor: '#f8fbf9', borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24, paddingBottom: 40, shadowColor: '#10251f', shadowOpacity: 0.18, shadowRadius: 24, shadowOffset: { width: 0, height: -10 }, elevation: 5 },
    modalTitle: { fontSize: 20, fontWeight: '900', color: '#13251f', marginBottom: 8, letterSpacing: -0.2 },
    modalHint: { fontSize: 12, color: '#61736c', marginBottom: 16, lineHeight: 18 },
    modalInput: { backgroundColor: '#edf3f0', borderRadius: 14, padding: 14, fontSize: 16, color: '#13251f', borderWidth: 1, borderColor: '#cddbd5', marginBottom: 10, fontWeight: '700' },
    modalLabel: { fontSize: 13, fontWeight: '800', color: '#50645c', marginBottom: 8, marginTop: 4 },

    // Role selector
    roleRow: { flexDirection: 'row', gap: 10, marginBottom: 12 },
    roleOption: { flex: 1, padding: 14, borderRadius: 14, borderWidth: 1, borderColor: '#cddbd5', backgroundColor: '#edf3f0', alignItems: 'center' },
    roleOptionActive: { borderColor: '#0f766e', backgroundColor: '#e0f2ef' },
    roleOptionText: { color: '#50645c', fontWeight: '800', fontSize: 14 },
    roleOptionTextActive: { color: '#0f766e' },
    roleOptionHint: { color: '#7c8c86', fontSize: 11, marginTop: 4 },

    // Toggle
    toggleRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 12 },
    toggle: { width: 50, height: 28, borderRadius: 14, backgroundColor: '#cddbd5', justifyContent: 'center', paddingHorizontal: 2 },
    toggleActive: { backgroundColor: '#16a34a' },
    toggleCircle: { width: 24, height: 24, borderRadius: 12, backgroundColor: '#fff', shadowColor: '#173a31', shadowOpacity: 0.18, shadowRadius: 4, shadowOffset: { width: 0, height: 2 }, elevation: 2 },
    toggleCircleActive: { alignSelf: 'flex-end' },
    toggleLabel: { fontSize: 13, color: '#50645c', fontWeight: '800' },

    // Modal buttons
    modalBtnRow: { flexDirection: 'row', gap: 10, marginTop: 10 },
    modalCancelBtn: { flex: 1, padding: 14, borderRadius: 12, backgroundColor: '#e7eee9', alignItems: 'center' },
    modalCancelText: { color: '#50645c', fontWeight: '800' },
    modalSaveBtn: { flex: 1, padding: 14, borderRadius: 12, backgroundColor: '#0f766e', alignItems: 'center' },
    modalSaveText: { color: '#fff', fontWeight: '800' },
});
