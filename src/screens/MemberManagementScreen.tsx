import React, { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, Alert, FlatList, KeyboardAvoidingView, Modal, Platform, RefreshControl, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useAuth } from '../contexts/AuthContext';
import { useSmartHomeServer } from '../contexts/SmartHomeServerContext';
import { Colors } from '../constants/colors';
import { HomeMember } from '../types/smartHomeServer';

const ROLE_LABELS: Record<string, string> = {
    owner: 'Chủ nhà',
    member: 'Thành viên',
    viewer: 'Chỉ xem',
};

const ROLE_COLORS: Record<string, { bg: string; text: string }> = {
    owner: { bg: Colors.primary[100], text: Colors.primary[700] },
    member: { bg: Colors.purple[100], text: Colors.purple[600] },
    viewer: { bg: Colors.slate[200], text: Colors.slate[600] },
};

const STATUS_COLORS: Record<string, { bg: string; text: string }> = {
    active: { bg: Colors.green[100], text: Colors.green[700] },
    suspended: { bg: Colors.red[100], text: Colors.red[600] },
};

export default function MemberManagementScreen({ navigation }: { navigation: any }) {
    const { user } = useAuth();
    const { client } = useSmartHomeServer();
    const [members, setMembers] = useState<HomeMember[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [showAddModal, setShowAddModal] = useState(false);
    const [submitting, setSubmitting] = useState(false);

    // Add member form state
    const [newName, setNewName] = useState('');
    const [newUsername, setNewUsername] = useState('');
    const [newPhone, setNewPhone] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [newRole, setNewRole] = useState<'member' | 'viewer'>('member');
    const [newCanManageDevices, setNewCanManageDevices] = useState(true);

    const homeId = user?.homeId;
    const homeName = user?.homeName || 'Nhà của tôi';

    const fetchMembers = useCallback(async () => {
        if (!homeId) return;
        try {
            const list = await client.getHomeMembers(homeId);
            setMembers(list);
        } catch (error) {
            console.error('Error fetching members:', error);
            Alert.alert('Lỗi', 'Không thể tải danh sách thành viên.');
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
                <ActivityIndicator size="large" color={Colors.primary[500]} />
                <Text style={styles.loadingText}>Đang tải danh sách...</Text>
            </View>
        );
    }

    return (
        <View style={styles.container}>
            <LinearGradient colors={[Colors.primary[500], Colors.primary[700]]} style={styles.header}>
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
                refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} colors={[Colors.primary[500]]} />}
                ListEmptyComponent={
                    <View style={styles.emptyState}>
                        <Text style={styles.emptyIcon}>👥</Text>
                        <Text style={styles.emptyTitle}>Chưa có thành viên nào</Text>
                        <Text style={styles.emptySub}>Nhấn nút bên dưới để thêm thành viên vào nhà.</Text>
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
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: Colors.background },
    centered: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: Colors.background },
    loadingText: { marginTop: 12, color: Colors.slate[500], fontSize: 14 },

    // Header
    header: { paddingTop: 50, paddingBottom: 20, paddingHorizontal: 20 },
    backBtn: { marginBottom: 12 },
    backBtnText: { color: 'rgba(255,255,255,0.85)', fontSize: 14, fontWeight: '500' },
    headerTitle: { fontSize: 22, fontWeight: '700', color: '#fff' },
    headerSub: { fontSize: 13, color: 'rgba(255,255,255,0.7)', marginTop: 4 },

    // List
    listContent: { padding: 16, paddingBottom: 100 },

    // Member card
    memberCard: {
        backgroundColor: '#fff',
        borderRadius: 16,
        padding: 16,
        marginBottom: 12,
        shadowColor: '#000',
        shadowOpacity: 0.05,
        shadowRadius: 10,
        shadowOffset: { width: 0, height: 2 },
        elevation: 3,
    },
    memberHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
    memberAvatar: {
        width: 46,
        height: 46,
        borderRadius: 23,
        backgroundColor: Colors.primary[100],
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 12,
    },
    memberAvatarText: { fontSize: 20, fontWeight: '700', color: Colors.primary[600] },
    memberInfo: { flex: 1 },
    memberName: { fontSize: 16, fontWeight: '600', color: Colors.slate[800] },
    memberUsername: { fontSize: 12, color: Colors.slate[500], marginTop: 2 },
    memberPhone: { fontSize: 12, color: Colors.slate[400], marginTop: 1 },

    // Badges
    badgeRow: { flexDirection: 'row', gap: 6, marginBottom: 12 },
    badge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20 },
    badgeText: { fontSize: 11, fontWeight: '600' },

    // Actions
    actionRow: { flexDirection: 'row', gap: 8 },
    actionBtn: { flex: 1, paddingVertical: 10, borderRadius: 10, alignItems: 'center' },
    suspendBtn: { backgroundColor: Colors.amber[50], borderWidth: 1, borderColor: Colors.amber[200] },
    suspendBtnText: { color: Colors.amber[700], fontWeight: '600', fontSize: 13 },
    activateBtn: { backgroundColor: Colors.green[50], borderWidth: 1, borderColor: Colors.green[400] },
    activateBtnText: { color: Colors.green[700], fontWeight: '600', fontSize: 13 },
    deleteBtn: { backgroundColor: Colors.red[50], borderWidth: 1, borderColor: Colors.red[200] },
    deleteBtnText: { color: Colors.red[600], fontWeight: '600', fontSize: 13 },
    ownerNote: { paddingVertical: 8, alignItems: 'center' },
    ownerNoteText: { color: Colors.slate[400], fontSize: 12, fontStyle: 'italic' },

    // Empty
    emptyState: { alignItems: 'center', paddingVertical: 60 },
    emptyIcon: { fontSize: 48, marginBottom: 12 },
    emptyTitle: { fontSize: 18, fontWeight: '600', color: Colors.slate[600], marginBottom: 6 },
    emptySub: { fontSize: 13, color: Colors.slate[400], textAlign: 'center', paddingHorizontal: 40 },

    // FAB
    fab: {
        position: 'absolute',
        bottom: 24,
        right: 20,
        left: 20,
        backgroundColor: Colors.primary[600],
        borderRadius: 16,
        paddingVertical: 16,
        alignItems: 'center',
        shadowColor: Colors.primary[700],
        shadowOpacity: 0.3,
        shadowRadius: 12,
        shadowOffset: { width: 0, height: 4 },
        elevation: 6,
    },
    fabText: { color: '#fff', fontSize: 16, fontWeight: '700' },

    // Modal
    modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
    modalContent: { backgroundColor: '#fff', borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24, paddingBottom: 40 },
    modalTitle: { fontSize: 20, fontWeight: '600', color: Colors.slate[800], marginBottom: 8 },
    modalHint: { fontSize: 12, color: Colors.slate[500], marginBottom: 16, lineHeight: 18 },
    modalInput: { backgroundColor: Colors.slate[50], borderRadius: 12, padding: 14, fontSize: 16, color: Colors.slate[800], borderWidth: 1, borderColor: Colors.slate[200], marginBottom: 10 },
    modalLabel: { fontSize: 13, fontWeight: '600', color: Colors.slate[700], marginBottom: 8, marginTop: 4 },

    // Role selector
    roleRow: { flexDirection: 'row', gap: 10, marginBottom: 12 },
    roleOption: { flex: 1, padding: 14, borderRadius: 12, borderWidth: 1, borderColor: Colors.slate[200], backgroundColor: Colors.slate[50], alignItems: 'center' },
    roleOptionActive: { borderColor: Colors.primary[500], backgroundColor: Colors.primary[50] },
    roleOptionText: { color: Colors.slate[600], fontWeight: '600', fontSize: 14 },
    roleOptionTextActive: { color: Colors.primary[700] },
    roleOptionHint: { color: Colors.slate[400], fontSize: 11, marginTop: 4 },

    // Toggle
    toggleRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 12 },
    toggle: { width: 48, height: 26, borderRadius: 13, backgroundColor: Colors.slate[300], justifyContent: 'center', paddingHorizontal: 2 },
    toggleActive: { backgroundColor: Colors.green[500] },
    toggleCircle: { width: 22, height: 22, borderRadius: 11, backgroundColor: '#fff' },
    toggleCircleActive: { alignSelf: 'flex-end' },
    toggleLabel: { fontSize: 13, color: Colors.slate[700], fontWeight: '500' },

    // Modal buttons
    modalBtnRow: { flexDirection: 'row', gap: 10, marginTop: 10 },
    modalCancelBtn: { flex: 1, padding: 14, borderRadius: 12, backgroundColor: Colors.slate[100], alignItems: 'center' },
    modalCancelText: { color: Colors.slate[600], fontWeight: '500' },
    modalSaveBtn: { flex: 1, padding: 14, borderRadius: 12, backgroundColor: Colors.primary[600], alignItems: 'center' },
    modalSaveText: { color: '#fff', fontWeight: '600' },
});
