import React, { useEffect, useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, Modal, TextInput, Alert, KeyboardAvoidingView, Platform, Image, useWindowDimensions } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useData } from '../contexts/DataContext';
import { useAuth } from '../contexts/AuthContext';
import { Colors } from '../constants/colors';
import { roomIconImages } from '../constants/roomAssets';
import { getRoomPresentation } from '../constants/roomPresentation';
import { AppTheme } from '../constants/theme';
import { useConfirmDialog } from '../components/ConfirmDialog';

const deviceIcons = {
    light: 'bulb-outline',
    fan: 'sync-outline',
    ac: 'snow-outline',
    outlet: 'power-outline',
} as const;

type DeviceControlUiState = {
    status: 'pending' | 'success' | 'error';
    message: string;
};

export default function RoomsScreen({ route }: any) {
    const { width } = useWindowDimensions();
    const isWideLayout = width >= 720;
    const { confirm, confirmDialog } = useConfirmDialog();
    const { user } = useAuth();
    const { rooms, getUserDevices, toggleDevice, addDevice, deleteDevice, addRoom, deleteRoom, turnAllOn, turnAllOffRoom, applyScene, isServerControlled, isHomeSuspended, serverError, canControlDevices, canManageInventory, isManualInventory } = useData();
    const [selectedRoom, setSelectedRoom] = useState<string | null>(route?.params?.roomId || null);
    const [showAddRoom, setShowAddRoom] = useState(false);
    const [showAddDevice, setShowAddDevice] = useState(false);
    const [newRoomName, setNewRoomName] = useState('');
    const [newDeviceName, setNewDeviceName] = useState('');
    const [newDeviceType, setNewDeviceType] = useState<'light' | 'fan' | 'ac' | 'outlet'>('light');
    const [newDevicePower, setNewDevicePower] = useState('');
    const [isSavingInventory, setIsSavingInventory] = useState(false);
    const [deviceControlStates, setDeviceControlStates] = useState<Record<string, DeviceControlUiState>>({});

    useEffect(() => {
        if (route?.params?.roomId) {
            setSelectedRoom(route.params.roomId);
        }
    }, [route?.params?.roomId, route?.params?.timestamp]);

    const handleDeviceToggle = async (roomId: string, deviceId: string) => {
        setDeviceControlStates(current => ({
            ...current,
            [deviceId]: {
                status: 'pending',
                message: 'Đang gửi lệnh; đang chờ server/PLC xác nhận...',
            },
        }));

        const result = await toggleDevice(roomId, deviceId);
        setDeviceControlStates(current => ({
            ...current,
            [deviceId]: {
                status: result.success ? 'success' : 'error',
                message: result.message,
            },
        }));
    };

    if (selectedRoom) {
        const room = rooms.find(item => item.id === selectedRoom);
        if (!room) return null;

        const roomDevices = getUserDevices(selectedRoom);
        const activeDevices = roomDevices.filter(device => device.isOn).length;
        const totalPower = roomDevices.filter(device => device.isOn).reduce((sum, device) => sum + device.power, 0);
        const visual = getRoomPresentation(room);
        const controlsDisabled = isHomeSuspended || isManualInventory || !canControlDevices;

        return (
            <ScrollView style={styles.container} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
                <View style={styles.roomHeader}>
                    <TouchableOpacity
                        onPress={() => setSelectedRoom(null)}
                        style={styles.backBtn}
                        accessibilityRole="button"
                        accessibilityLabel="Quay lại danh sách phòng"
                    >
                        <Ionicons name="arrow-back" size={22} color={AppTheme.colors.ink} />
                    </TouchableOpacity>
                    {visual.imageKey ? (
                        <Image
                            source={roomIconImages[visual.imageKey]}
                            style={styles.roomHeaderImage}
                            resizeMode="cover"
                            accessible
                            accessibilityLabel={visual.accessibilityLabel}
                        />
                    ) : (
                        <View style={styles.roomHeaderFallback} accessible accessibilityLabel={visual.accessibilityLabel}>
                            <Ionicons name={visual.icon as any} size={25} color={AppTheme.colors.brand} />
                        </View>
                    )}
                    <View style={{ flex: 1 }}>
                        <Text style={styles.roomTitle}>{room.name}</Text>
                        <Text style={styles.roomSubtitle}>{activeDevices}/{roomDevices.length} thiết bị hoạt động</Text>
                    </View>
                </View>

                <View style={styles.roomStats}>
                    <View style={styles.roomStatCard}>
                        <Ionicons name="flash-outline" size={18} color={AppTheme.colors.brand} />
                        <Text style={styles.roomStatLabel}>Công suất</Text>
                        <Text style={styles.roomStatValue}>{totalPower}W</Text>
                    </View>
                    <View style={styles.roomStatCard}>
                        <Ionicons name="hardware-chip-outline" size={18} color={AppTheme.colors.brand} />
                        <Text style={styles.roomStatLabel}>Thiết bị</Text>
                        <Text style={styles.roomStatValue}>{roomDevices.length}</Text>
                    </View>
                    <View style={styles.roomStatCard}>
                        <Ionicons name="checkmark-circle-outline" size={18} color={AppTheme.colors.brand} />
                        <Text style={styles.roomStatLabel}>Đang bật</Text>
                        <Text style={styles.roomStatValue}>{activeDevices}</Text>
                    </View>
                </View>

                {isHomeSuspended && (
                    <View style={styles.lockedBanner}>
                        <Text style={styles.lockedTitle}>Nhà đang bị tạm khóa</Text>
                        <Text style={styles.lockedText}>Bạn không thể bật/tắt thiết bị cho tới khi admin mở khóa nhà.</Text>
                    </View>
                )}

                {!isHomeSuspended && !canControlDevices && (
                    <View style={styles.permissionBanner} accessibilityRole="alert">
                        <Ionicons name="lock-closed-outline" size={18} color="#9a6700" />
                        <Text style={styles.permissionBannerText}>Tài khoản của bạn chỉ được xem trạng thái; lệnh điều khiển đã bị khóa.</Text>
                    </View>
                )}

                <View style={styles.allBtnRow}>
                    <TouchableOpacity
                        disabled={controlsDisabled}
                        style={[styles.allBtn, { backgroundColor: Colors.green[500] }, controlsDisabled && styles.disabledBtn]}
                        accessibilityRole="button"
                        accessibilityLabel="Bật tất cả thiết bị trong phòng"
                        accessibilityState={{ disabled: controlsDisabled }}
                        onPress={() => {
                            confirm({
                                title: 'Bật tất cả thiết bị',
                                message: `Gửi lệnh bật tất cả thiết bị có thể điều khiển trong ${room.name}?`,
                                confirmLabel: 'Bật tất cả',
                                onConfirm: async () => {
                                    const success = await turnAllOn(selectedRoom);
                                    if (!success) Alert.alert('Lỗi', 'Chưa thể bật tất cả thiết bị trong phòng. Kiểm tra PLC/server rồi thử lại.');
                                },
                            });
                        }}
                    >
                        <Ionicons name="flash-outline" size={18} color="#ffffff" />
                        <Text style={styles.allBtnText}>Bật tất cả</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                        disabled={controlsDisabled}
                        style={[styles.allBtn, { backgroundColor: Colors.slate[200] }, controlsDisabled && styles.disabledBtn]}
                        accessibilityRole="button"
                        accessibilityLabel="Tắt tất cả thiết bị trong phòng"
                        accessibilityState={{ disabled: controlsDisabled }}
                        onPress={() => {
                            confirm({
                                title: 'Tắt tất cả thiết bị',
                                message: `Gửi lệnh tắt tất cả thiết bị có thể điều khiển trong ${room.name}?`,
                                confirmLabel: 'Tắt tất cả',
                                destructive: true,
                                onConfirm: async () => {
                                    const success = await turnAllOffRoom(selectedRoom);
                                    if (!success) Alert.alert('Lỗi', 'Chưa thể tắt tất cả thiết bị trong phòng. Kiểm tra PLC/server rồi thử lại.');
                                },
                            });
                        }}
                    >
                        <Ionicons name="power-outline" size={18} color={Colors.slate[700]} />
                        <Text style={[styles.allBtnText, { color: Colors.slate[700] }]}>Tắt tất cả</Text>
                    </TouchableOpacity>
                </View>

                <Text style={styles.sectionTitle}>Thiết bị</Text>
                {roomDevices.length === 0 ? (
                    <View style={styles.emptyDevicesCard}>
                        <Ionicons name="cube-outline" size={30} color={AppTheme.colors.inkMuted} style={styles.emptyDevicesIcon} />
                        <Text style={styles.emptyDevicesTitle}>Phòng này chưa có thiết bị</Text>
                        <Text style={styles.emptyDevicesText}>Hãy thêm các thiết bị thực tế đang có trong nhà của bạn.</Text>
                    </View>
                ) : (
                    roomDevices.map(device => {
                        const controlState = deviceControlStates[device.id];
                        const isControlPending = controlState?.status === 'pending';
                        const isControlDisabled = isHomeSuspended || !canControlDevices || device.source === 'manual' || isControlPending;
                        return (
                        <View key={device.id} style={[styles.deviceCard, device.isOn && styles.deviceCardActive]}>
                            <View style={styles.deviceLeft}>
                                <View style={[styles.deviceIcon, { backgroundColor: device.isOn ? Colors.green[100] : Colors.slate[100] }]}>
                                    <Ionicons name={deviceIcons[device.type]} size={22} color={device.isOn ? Colors.green[700] : AppTheme.colors.inkMuted} />
                                </View>
                                <View style={styles.deviceInfo}>
                                    <Text style={styles.deviceName}>{device.name}</Text>
                                    <Text style={styles.deviceStatus}>{device.source === 'manual' ? `${device.power}W - Khai báo thủ công` : device.isOn ? `${device.power}W - Đang bật` : 'Đã tắt'}</Text>
                                    {controlState && (
                                        <Text
                                            style={[
                                                styles.controlFeedback,
                                                controlState.status === 'success' && styles.controlFeedbackSuccess,
                                                controlState.status === 'error' && styles.controlFeedbackError,
                                            ]}
                                            accessibilityLiveRegion="polite"
                                        >
                                            {controlState.message}
                                        </Text>
                                    )}
                                </View>
                            </View>
                            <View style={styles.deviceActions}>
                                <TouchableOpacity
                                    style={[styles.toggle, device.isOn && styles.toggleActive]}
                                    disabled={isControlDisabled}
                                    accessibilityRole="switch"
                                    accessibilityLabel={`${device.isOn ? 'Tắt' : 'Bật'} ${device.name}`}
                                    accessibilityState={{ checked: device.isOn, disabled: isControlDisabled, busy: isControlPending }}
                                    onPress={() => void handleDeviceToggle(selectedRoom, device.id)}
                                >
                                    <View style={[styles.toggleCircle, device.isOn && styles.toggleCircleActive]} />
                                </TouchableOpacity>
                                {canManageInventory && device.source !== 'server' && (
                                    <TouchableOpacity
                                        style={styles.deleteDeviceBtn}
                                        accessibilityRole="button"
                                        accessibilityLabel={`Xóa thiết bị ${device.name}`}
                                        onPress={() => {
                                            confirm({
                                                title: 'Xóa thiết bị',
                                                message: `Xóa "${device.name}" khỏi ${room.name}? Thiết bị sẽ bị gỡ khỏi danh mục thủ công.`,
                                                confirmLabel: 'Xóa thiết bị',
                                                destructive: true,
                                                onConfirm: async () => {
                                                    const result = await deleteDevice(selectedRoom, device.id);
                                                    if (!result.success) Alert.alert('Lỗi', result.error || 'Không thể xóa thiết bị');
                                                },
                                            });
                                        }}
                                    >
                                        <Text style={styles.deleteDeviceText}>Xóa</Text>
                                    </TouchableOpacity>
                                )}
                            </View>
                        </View>
                    )})
                )}

                {canManageInventory && (isManualInventory || !isServerControlled) && (
                    <TouchableOpacity style={styles.addDeviceBtn} onPress={() => setShowAddDevice(true)}>
                        <LinearGradient colors={[Colors.primary[500], Colors.primary[700]]} style={styles.addDeviceBtnGradient}>
                            <Text style={styles.addDeviceBtnText}>+ Thêm thiết bị mới</Text>
                        </LinearGradient>
                    </TouchableOpacity>
                )}

                {isServerControlled && !canManageInventory && (
                    <View style={styles.haHintCard}>
                        <Text style={styles.haHintTitle}>Thiết bị đang đồng bộ từ server riêng</Text>
                        <Text style={styles.haHintText}>Muốn thêm hoặc xóa thiết bị, hãy cập nhật trên server/PLC rồi để app đồng bộ lại.</Text>
                    </View>
                )}

                <Modal visible={showAddDevice} transparent animationType="slide">
                    <KeyboardAvoidingView
                        style={styles.modalOverlay}
                        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
                        keyboardVerticalOffset={Platform.OS === 'ios' ? 16 : 0}
                    >
                        <View style={styles.modalContent}>
                            <Text style={styles.modalTitle}>Thêm thiết bị mới</Text>
                            <TextInput style={styles.modalInput} placeholder="Tên thiết bị" value={newDeviceName} onChangeText={setNewDeviceName} placeholderTextColor={Colors.slate[400]} />

                            <Text style={styles.modalLabel}>Loại thiết bị</Text>
                            <View style={styles.typeRow}>
                                {[
                                    { type: 'light' as const, label: 'Đèn', icon: 'bulb-outline' as const },
                                    { type: 'fan' as const, label: 'Quạt', icon: 'sync-outline' as const },
                                    { type: 'ac' as const, label: 'Máy lạnh', icon: 'snow-outline' as const },
                                    { type: 'outlet' as const, label: 'Ổ cắm', icon: 'power-outline' as const },
                                ].map(item => (
                                    <TouchableOpacity key={item.type} style={[styles.typeBtn, newDeviceType === item.type && styles.typeBtnActive]} onPress={() => setNewDeviceType(item.type)} accessibilityRole="radio" accessibilityLabel={`Loại thiết bị ${item.label}`} accessibilityState={{ selected: newDeviceType === item.type }}>
                                        <Ionicons name={item.icon} size={18} color={newDeviceType === item.type ? AppTheme.colors.brand : AppTheme.colors.inkMuted} />
                                        <Text style={[styles.typeBtnText, newDeviceType === item.type && styles.typeBtnTextActive]}>{item.label}</Text>
                                    </TouchableOpacity>
                                ))}
                            </View>

                            <TextInput style={styles.modalInput} placeholder="Công suất (W)" value={newDevicePower} onChangeText={setNewDevicePower} keyboardType="numeric" placeholderTextColor={Colors.slate[400]} />

                            <View style={styles.modalBtnRow}>
                                <TouchableOpacity style={styles.modalCancelBtn} onPress={() => setShowAddDevice(false)} accessibilityRole="button" accessibilityLabel="Hủy thêm thiết bị">
                                    <Text style={styles.modalCancelText}>Hủy</Text>
                                </TouchableOpacity>
                                <TouchableOpacity
                                    style={[styles.modalSaveBtn, isSavingInventory && styles.disabledBtn]}
                                    disabled={isSavingInventory}
                                    accessibilityRole="button"
                                    accessibilityLabel="Lưu thiết bị mới"
                                    accessibilityState={{ disabled: isSavingInventory, busy: isSavingInventory }}
                                    onPress={async () => {
                                        if (isSavingInventory) return;
                                        if (!newDeviceName.trim() || !newDevicePower.trim()) {
                                            Alert.alert('Lỗi', 'Vui lòng nhập đầy đủ thông tin');
                                            return;
                                        }
                                        setIsSavingInventory(true);
                                        try {
                                            const result = await addDevice(selectedRoom, {
                                                name: newDeviceName.trim(),
                                                type: newDeviceType,
                                                isOn: false,
                                                power: parseInt(newDevicePower, 10) || 0,
                                            });
                                            if (!result.success) {
                                                Alert.alert('Lỗi', result.error || 'Không thể thêm thiết bị');
                                                return;
                                            }
                                            setNewDeviceName('');
                                            setNewDevicePower('');
                                            setShowAddDevice(false);
                                        } finally {
                                            setIsSavingInventory(false);
                                        }
                                    }}
                                >
                                    <Text style={styles.modalSaveText}>Thêm</Text>
                                </TouchableOpacity>
                            </View>
                        </View>
                    </KeyboardAvoidingView>
                </Modal>

                <View style={{ height: 30 }} />
                {confirmDialog}
            </ScrollView>
        );
    }

    return (
        <ScrollView style={styles.container} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
            <Text style={styles.pageTitle}>Quản lý phòng</Text>

            {canManageInventory && (
                <TouchableOpacity style={styles.addRoomBtn} onPress={() => setShowAddRoom(true)}>
                    <Text style={styles.addRoomBtnText}>+ Thêm phòng</Text>
                </TouchableOpacity>
            )}

            {isHomeSuspended && (
                <View style={styles.lockedBanner}>
                    <Text style={styles.lockedTitle}>Nhà đang bị tạm khóa</Text>
                    <Text style={styles.lockedText}>Demo phân quyền: admin web khóa nhà thì app mobile không được xem dữ liệu mới hoặc điều khiển thiết bị.</Text>
                </View>
            )}

            {!isHomeSuspended && serverError && isServerControlled && (
                <View style={styles.adminHintCard}>
                    <Text style={styles.adminHintTitle}>PLC/Server chưa sẵn sàng</Text>
                    <Text style={styles.adminHintText}>{serverError}</Text>
                </View>
            )}

            {!isServerControlled && (
                <View style={styles.localDataBanner}>
                    <Ionicons name="information-circle-outline" size={18} color={Colors.amber[700]} />
                    <Text style={styles.localDataText}>Dữ liệu cục bộ. Không phải phản hồi PLC.</Text>
                </View>
            )}

            {user?.role === 'admin' && (
                <View style={styles.adminHintCard}>
                    <Text style={styles.adminHintTitle}>Quản trị viên</Text>
                    <Text style={styles.adminHintText}>Hệ thống đang dùng server riêng làm trung tâm. Quản lý user vẫn nằm ở tab Quản lý.</Text>
                </View>
            )}

            <View style={styles.roomGrid}>
                {rooms.map(room => {
                    const isActive = room.active > 0;
                    const visual = getRoomPresentation(room);
                    return (
                        <TouchableOpacity
                            key={room.id}
                            style={[styles.roomCard, isWideLayout && styles.roomCardWide, isActive && styles.roomCardActive]}
                            onPress={() => setSelectedRoom(room.id)}
                            accessibilityRole="button"
                            accessibilityLabel={`Mở ${room.name}, ${room.active} trên ${room.devices} thiết bị đang hoạt động`}
                        >
                            {isActive && <View style={styles.roomActiveDot} />}
                            <View style={[styles.roomCardIcon, isWideLayout && styles.roomCardIconWide, isActive && styles.roomCardIconActive]}>
                                {visual.imageKey ? (
                                    <Image
                                        source={roomIconImages[visual.imageKey]}
                                        style={styles.roomCardIconImage}
                                        resizeMode="cover"
                                        accessible
                                        accessibilityLabel={visual.accessibilityLabel}
                                    />
                                ) : (
                                    <Ionicons
                                        name={visual.icon as any}
                                        size={24}
                                        color={isActive ? Colors.green[700] : AppTheme.colors.inkMuted}
                                        accessible
                                        accessibilityLabel={visual.accessibilityLabel}
                                    />
                                )}
                            </View>
                            <Text style={styles.roomCardName}>{room.name}</Text>
                            <Text style={styles.roomCardSub}>{room.active}/{room.devices} thiết bị</Text>
                            <View style={styles.roomCardStats}>
                                <View style={styles.inlineStat}>
                                    <Ionicons name="flash-outline" size={14} color={AppTheme.colors.inkMuted} />
                                    <Text style={styles.roomCardStat}>{room.power}W</Text>
                                </View>
                                <View style={styles.inlineStat}>
                                    <Ionicons name="hardware-chip-outline" size={14} color={AppTheme.colors.inkMuted} />
                                    <Text style={styles.roomCardStat}>{room.devices} thiết bị</Text>
                                </View>
                            </View>
                            {canManageInventory ? (
                                <TouchableOpacity
                                    style={[styles.deleteRoomBtn, room.devices > 0 && styles.deleteRoomBtnDisabled]}
                                    accessibilityRole="button"
                                    accessibilityLabel={`Xóa phòng ${room.name}`}
                                    accessibilityHint={room.devices > 0 ? 'Cần xóa hoặc chuyển hết thiết bị trước' : 'Mở hộp thoại xác nhận xóa phòng'}
                                    onPress={(event) => {
                                        event.stopPropagation();
                                        if (room.devices > 0) {
                                            Alert.alert('Chưa thể xóa phòng', 'Phòng vẫn còn thiết bị. Hãy xóa hoặc chuyển hết thiết bị trước.');
                                            return;
                                        }
                                        confirm({
                                            title: 'Xóa phòng',
                                            message: `Xóa phòng "${room.name}"? Hành động này không thể hoàn tác.`,
                                            confirmLabel: 'Xóa phòng',
                                            destructive: true,
                                            onConfirm: async () => {
                                                const result = await deleteRoom(room.id);
                                                if (!result.success) Alert.alert('Lỗi', result.error || 'Không thể xóa phòng.');
                                            },
                                        });
                                    }}
                                >
                                    <Ionicons name="trash-outline" size={14} color={room.devices > 0 ? '#94a3b8' : Colors.red[600]} />
                                    <Text style={[styles.deleteRoomText, room.devices > 0 && styles.deleteRoomTextDisabled]}>Xóa phòng</Text>
                                </TouchableOpacity>
                            ) : null}
                        </TouchableOpacity>
                    );
                })}
            </View>

            <Text style={[styles.sectionTitle, { marginTop: 20 }]}>Cảnh nhanh</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                {[
                    { label: 'Buổi sáng', icon: 'sunny-outline' as const, colors: ['#d97706', '#f59e0b'], scene: 'morning' as const },
                    { label: 'Đi làm', icon: 'briefcase-outline' as const, colors: ['#0f766e', '#115e59'], scene: 'work' as const },
                    { label: 'Cuối tuần', icon: 'people-outline' as const, colors: ['#256f5f', '#173a31'], scene: 'weekend' as const },
                    { label: 'Ngủ', icon: 'moon-outline' as const, colors: ['#334155', '#13251f'], scene: 'sleep' as const },
                ].map((item, index) => (
                    <TouchableOpacity
                        key={index}
                        accessibilityRole="button"
                        accessibilityLabel={`Kích hoạt cảnh ${item.label}`}
                        accessibilityState={{ disabled: isHomeSuspended || !canControlDevices }}
                        disabled={isHomeSuspended || !canControlDevices}
                        onPress={() => {
                            confirm({
                                title: 'Kích hoạt cảnh',
                                message: `Bật chế độ ${item.label}? Hệ thống sẽ gửi các lệnh điều khiển tương ứng đến backend.`,
                                confirmLabel: 'Kích hoạt',
                                onConfirm: async () => {
                                    const success = await applyScene(item.scene);
                                    if (!success) Alert.alert('Lỗi', `Chưa thể kích hoạt cảnh ${item.label}. Kiểm tra PLC/server rồi thử lại.`);
                                },
                            });
                        }}
                    >
                        <LinearGradient colors={item.colors as [string, string]} style={styles.sceneBtn}>
                            <Ionicons name={item.icon} size={18} color="#ffffff" />
                            <Text style={styles.sceneBtnText}>{item.label}</Text>
                        </LinearGradient>
                    </TouchableOpacity>
                ))}
            </ScrollView>

            <View style={styles.energyCard}>
                <Text style={[styles.sectionTitle, { marginBottom: 12 }]}>Tiêu thụ theo phòng</Text>
                {rooms.map(room => {
                    const maxPower = Math.max(...rooms.map(item => item.power), 1);
                    const pct = Math.round((room.power / maxPower) * 100);
                    return (
                        <View key={room.id} style={{ marginBottom: 12 }}>
                            <View style={styles.energyRow}>
                                <Text style={styles.energyLabel}>{room.name}</Text>
                                <Text style={styles.energyValue}>{room.power}W</Text>
                            </View>
                            <View style={styles.energyBarBg}>
                                {room.power > 0 && (
                                    <LinearGradient colors={[Colors.primary[400], Colors.primary[600]]} style={[styles.energyBarFill, { width: `${Math.max(pct, 3)}%` }]} />
                                )}
                            </View>
                        </View>
                    );
                })}
            </View>

            <Modal visible={showAddRoom} transparent animationType="slide">
                <KeyboardAvoidingView
                    style={styles.modalOverlay}
                    behavior={Platform.OS === 'ios' ? 'padding' : undefined}
                    keyboardVerticalOffset={Platform.OS === 'ios' ? 16 : 0}
                >
                    <View style={styles.modalContent}>
                        <Text style={styles.modalTitle}>Thêm phòng</Text>
                        <TextInput style={styles.modalInput} placeholder="Tên phòng" value={newRoomName} onChangeText={setNewRoomName} placeholderTextColor={Colors.slate[400]} />
                        <View style={styles.modalBtnRow}>
                            <TouchableOpacity style={styles.modalCancelBtn} onPress={() => setShowAddRoom(false)} accessibilityRole="button" accessibilityLabel="Hủy thêm phòng">
                                <Text style={styles.modalCancelText}>Hủy</Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                style={[styles.modalSaveBtn, isSavingInventory && styles.disabledBtn]}
                                disabled={isSavingInventory}
                                accessibilityRole="button"
                                accessibilityLabel="Lưu phòng mới"
                                accessibilityState={{ disabled: isSavingInventory, busy: isSavingInventory }}
                                onPress={async () => {
                                    if (isSavingInventory) return;
                                    setIsSavingInventory(true);
                                    try {
                                        const result = await addRoom(newRoomName);
                                        if (!result.success) {
                                            Alert.alert('Lỗi', result.error || 'Không thể thêm phòng');
                                            return;
                                        }
                                        setNewRoomName('');
                                        setShowAddRoom(false);
                                    } finally {
                                        setIsSavingInventory(false);
                                    }
                                }}
                            >
                                <Text style={styles.modalSaveText}>Thêm</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </KeyboardAvoidingView>
            </Modal>

            <View style={{ height: 20 }} />
            {confirmDialog}
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: AppTheme.colors.canvas },
    content: { padding: 16, paddingBottom: 30 },
    pageTitle: { fontSize: 28, fontWeight: '900', color: AppTheme.colors.ink, marginBottom: 16, marginTop: 8, letterSpacing: -0.4 },
    sectionTitle: { fontSize: 17, fontWeight: '800', color: AppTheme.colors.ink, marginBottom: 10, letterSpacing: -0.1 },
    addRoomBtn: { alignSelf: 'flex-start', paddingHorizontal: 14, paddingVertical: 10, borderRadius: 12, backgroundColor: AppTheme.colors.brand, marginBottom: 14 },
    addRoomBtnText: { color: '#fff', fontWeight: '800', fontSize: 13 },
    roomGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
    roomCard: { width: '100%' as any, minHeight: 168, backgroundColor: AppTheme.colors.surface, borderRadius: 18, padding: 14, shadowColor: '#173a31', shadowOpacity: 0.06, shadowRadius: 16, shadowOffset: { width: 0, height: 9 }, elevation: 2, position: 'relative', borderWidth: 1, borderColor: AppTheme.colors.border },
    roomCardWide: { width: '48%' as any, minHeight: 196, padding: 16 },
    roomCardActive: { borderColor: '#34d399', backgroundColor: '#f3fbf6', shadowOpacity: 0.1 },
    roomActiveDot: { position: 'absolute', top: 12, right: 12, width: 9, height: 9, borderRadius: 5, backgroundColor: Colors.green[500], borderWidth: 2, borderColor: '#f8fbf9' },
    roomCardIcon: { width: 58, height: 58, borderRadius: 15, alignItems: 'center', justifyContent: 'center', marginBottom: 12, overflow: 'hidden', backgroundColor: '#e7eee9' },
    roomCardIconWide: { width: 78, height: 78, borderRadius: 18 },
    roomCardIconActive: { borderWidth: 2, borderColor: '#34d399' },
    roomCardIconImage: { width: '100%', height: '100%', borderRadius: 14 },
    roomCardName: { fontSize: 15, fontWeight: '800', color: AppTheme.colors.ink },
    roomCardSub: { fontSize: 12, color: AppTheme.colors.inkMuted, marginTop: 3, marginBottom: 10, fontWeight: '600' },
    roomCardStats: { gap: 5, marginTop: 'auto' },
    deleteRoomBtn: { marginTop: 12, minHeight: 34, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, borderRadius: 10, borderWidth: 1, borderColor: '#fecaca', backgroundColor: '#fff7f5' },
    deleteRoomBtnDisabled: { borderColor: '#dce7e1', backgroundColor: '#edf3f0' },
    deleteRoomText: { color: Colors.red[600], fontSize: 11, fontWeight: '600' },
    deleteRoomTextDisabled: { color: '#94a3b8' },
    inlineStat: { flexDirection: 'row', alignItems: 'center', gap: 5 },
    roomCardStat: { fontSize: 11, color: AppTheme.colors.inkMuted, fontWeight: '700', fontVariant: ['tabular-nums'] },
    sceneBtn: { minWidth: 118, paddingHorizontal: 16, paddingVertical: 13, borderRadius: 14, marginRight: 10, shadowColor: '#173a31', shadowOpacity: 0.09, shadowRadius: 12, shadowOffset: { width: 0, height: 7 }, elevation: 2, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 7 },
    sceneBtnText: { color: '#fff', fontWeight: '800', fontSize: 13 },
    energyCard: { backgroundColor: AppTheme.colors.surface, borderRadius: 18, padding: 16, marginTop: 16, shadowColor: '#173a31', shadowOpacity: 0.06, shadowRadius: 16, shadowOffset: { width: 0, height: 9 }, elevation: 2, borderWidth: 1, borderColor: AppTheme.colors.border },
    energyRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 },
    energyLabel: { fontSize: 13, color: '#50645c', fontWeight: '700' },
    energyValue: { fontSize: 13, fontWeight: '900', color: AppTheme.colors.ink, fontVariant: ['tabular-nums'] },
    energyBarBg: { height: 9, backgroundColor: '#e7eee9', borderRadius: 999, overflow: 'hidden' },
    energyBarFill: { height: '100%', borderRadius: 999 },
    roomHeader: { flexDirection: 'row', alignItems: 'center', gap: 10, padding: 14, borderWidth: 1, borderColor: AppTheme.colors.border, marginBottom: 14, backgroundColor: AppTheme.colors.surface, borderRadius: 18, shadowColor: '#173a31', shadowOpacity: 0.06, shadowRadius: 16, shadowOffset: { width: 0, height: 9 }, elevation: 2 },
    roomHeaderImage: { width: 46, height: 46, borderRadius: 14 },
    roomHeaderFallback: { width: 46, height: 46, borderRadius: 14, alignItems: 'center', justifyContent: 'center', backgroundColor: AppTheme.colors.surfaceMuted },
    backBtn: { width: 36, height: 36, borderRadius: 12, alignItems: 'center', justifyContent: 'center', backgroundColor: AppTheme.colors.surfaceMuted },
    roomTitle: { fontSize: 20, fontWeight: '900', color: AppTheme.colors.ink, letterSpacing: -0.2 },
    roomSubtitle: { fontSize: 13, color: AppTheme.colors.inkMuted, fontWeight: '600' },
    roomStats: { flexDirection: 'row', gap: 10, marginBottom: 14 },
    roomStatCard: { flex: 1, backgroundColor: AppTheme.colors.surface, borderRadius: 16, padding: 12, alignItems: 'center', shadowColor: '#173a31', shadowOpacity: 0.05, shadowRadius: 14, shadowOffset: { width: 0, height: 8 }, elevation: 2, borderWidth: 1, borderColor: AppTheme.colors.border },
    roomStatLabel: { fontSize: 11, color: AppTheme.colors.inkMuted, marginTop: 4, fontWeight: '700' },
    roomStatValue: { fontSize: 19, fontWeight: '900', color: AppTheme.colors.ink, marginTop: 2, fontVariant: ['tabular-nums'] },
    allBtnRow: { flexDirection: 'row', gap: 10, marginBottom: 16 },
    allBtn: { flex: 1, paddingVertical: 13, borderRadius: 13, flexDirection: 'row', gap: 7, justifyContent: 'center', alignItems: 'center', shadowColor: '#173a31', shadowOpacity: 0.08, shadowRadius: 12, shadowOffset: { width: 0, height: 7 }, elevation: 2 },
    allBtnText: { color: '#fff', fontWeight: '800', fontSize: 14 },
    deviceCard: { backgroundColor: AppTheme.colors.surface, borderRadius: 18, padding: 14, marginBottom: 10, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', shadowColor: '#173a31', shadowOpacity: 0.05, shadowRadius: 14, shadowOffset: { width: 0, height: 8 }, elevation: 2, borderWidth: 1, borderColor: AppTheme.colors.border },
    deviceCardActive: { borderColor: '#34d399', backgroundColor: '#f3fbf6' },
    deviceLeft: { flexDirection: 'row', alignItems: 'center', gap: 12, flex: 1 },
    deviceInfo: { flex: 1 },
    deviceActions: { alignItems: 'flex-end', gap: 8, marginLeft: 12 },
    deviceIcon: { width: 46, height: 46, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
    deviceName: { fontSize: 15, fontWeight: '800', color: AppTheme.colors.ink },
    deviceStatus: { fontSize: 12, color: AppTheme.colors.inkMuted, marginTop: 3, fontWeight: '600', fontVariant: ['tabular-nums'] },
    controlFeedback: { fontSize: 11, lineHeight: 16, color: Colors.amber[700], fontWeight: '700', marginTop: 5, fontVariant: ['tabular-nums'] },
    controlFeedbackSuccess: { color: Colors.green[700] },
    controlFeedbackError: { color: AppTheme.colors.danger },
    toggle: { width: 50, height: 28, borderRadius: 14, backgroundColor: '#cddbd5', justifyContent: 'center', paddingHorizontal: 2 },
    toggleActive: { backgroundColor: '#16a34a' },
    toggleCircle: { width: 24, height: 24, borderRadius: 12, backgroundColor: '#fff', shadowColor: '#173a31', shadowOpacity: 0.18, shadowRadius: 4, shadowOffset: { width: 0, height: 2 }, elevation: 2 },
    toggleCircleActive: { alignSelf: 'flex-end' },
    deleteDeviceBtn: { paddingHorizontal: 10, paddingVertical: 6, borderRadius: 10, backgroundColor: Colors.red[50], borderWidth: 1, borderColor: Colors.red[200] },
    deleteDeviceText: { fontSize: 12, fontWeight: '600', color: Colors.red[600] },
    emptyDevicesCard: { backgroundColor: AppTheme.colors.surface, borderRadius: 18, padding: 24, alignItems: 'center', marginBottom: 12, shadowColor: '#173a31', shadowOpacity: 0.05, shadowRadius: 14, shadowOffset: { width: 0, height: 8 }, elevation: 2, borderWidth: 1, borderColor: AppTheme.colors.border },
    emptyDevicesIcon: { marginBottom: 10 },
    emptyDevicesTitle: { fontSize: 16, fontWeight: '800', color: AppTheme.colors.ink, marginBottom: 4 },
    emptyDevicesText: { fontSize: 13, color: AppTheme.colors.inkMuted, textAlign: 'center', lineHeight: 18 },
    addDeviceBtn: { borderRadius: 12, overflow: 'hidden', marginTop: 10 },
    addDeviceBtnGradient: { padding: 14, alignItems: 'center' },
    addDeviceBtnText: { color: '#fff', fontWeight: '600', fontSize: 15 },
    haHintCard: { backgroundColor: '#eaf5ff', borderRadius: 16, padding: 14, borderWidth: 1, borderColor: '#bfdbfe', marginTop: 10 },
    haHintTitle: { fontSize: 14, fontWeight: '800', color: Colors.blue[700], marginBottom: 4 },
    haHintText: { fontSize: 13, color: Colors.blue[700], lineHeight: 18 },
    adminHintCard: { backgroundColor: '#fff8e6', borderRadius: 16, padding: 14, borderWidth: 1, borderColor: '#f5d991', marginBottom: 14 },
    adminHintTitle: { fontSize: 14, fontWeight: '800', color: Colors.amber[700], marginBottom: 4 },
    adminHintText: { fontSize: 13, color: Colors.amber[700], lineHeight: 18 },
    localDataBanner: { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: Colors.amber[50], borderRadius: 14, padding: 12, borderWidth: 1, borderColor: Colors.amber[200], marginBottom: 14 },
    localDataText: { flex: 1, color: Colors.amber[700], fontSize: 12, fontWeight: '700', lineHeight: 17 },
    modalOverlay: { flex: 1, backgroundColor: 'rgba(15,23,42,0.56)', justifyContent: 'flex-end' },
    modalContent: { backgroundColor: AppTheme.colors.surface, borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24, paddingBottom: 40, shadowColor: '#10251f', shadowOpacity: 0.18, shadowRadius: 24, shadowOffset: { width: 0, height: -10 }, elevation: 5 },
    modalTitle: { fontSize: 20, fontWeight: '900', color: AppTheme.colors.ink, marginBottom: 16, letterSpacing: -0.2 },
    modalLabel: { fontSize: 13, fontWeight: '800', color: '#50645c', marginBottom: 8, marginTop: 8 },
    modalInput: { backgroundColor: '#edf3f0', borderRadius: 14, padding: 14, fontSize: 16, color: '#13251f', borderWidth: 1, borderColor: '#cddbd5', marginBottom: 8, fontWeight: '700' },
    typeRow: { flexDirection: 'row', gap: 8, marginBottom: 8 },
    typeBtn: { flex: 1, padding: 10, borderRadius: 12, borderWidth: 1, borderColor: '#cddbd5', alignItems: 'center', backgroundColor: '#edf3f0' },
    typeBtnActive: { borderColor: '#0f766e', backgroundColor: '#e0f2ef' },
    typeBtnText: { fontSize: 12, color: '#50645c', fontWeight: '700' },
    typeBtnTextActive: { color: '#0f766e', fontWeight: '900' },
    modalBtnRow: { flexDirection: 'row', gap: 10, marginTop: 16 },
    modalCancelBtn: { flex: 1, padding: 14, borderRadius: 12, backgroundColor: '#e7eee9', alignItems: 'center' },
    modalCancelText: { color: '#50645c', fontWeight: '800' },
    modalSaveBtn: { flex: 1, padding: 14, borderRadius: 12, backgroundColor: '#0f766e', alignItems: 'center' },
    modalSaveText: { color: '#fff', fontWeight: '800' },
    lockedBanner: { backgroundColor: '#fff4f2', borderRadius: 16, padding: 14, borderWidth: 1, borderColor: '#fecaca', marginBottom: 14 },
    lockedTitle: { fontSize: 14, fontWeight: '800', color: Colors.red[600], marginBottom: 4 },
    lockedText: { fontSize: 13, color: Colors.red[600], lineHeight: 18 },
    permissionBanner: { flexDirection: 'row', alignItems: 'center', gap: 8, padding: 12, marginBottom: 12, borderRadius: 14, borderWidth: 1, borderColor: '#f4d38a', backgroundColor: '#fffbeb' },
    permissionBannerText: { flex: 1, color: '#7a4f01', fontSize: 12, lineHeight: 18, fontWeight: '700' },
    disabledBtn: { opacity: 0.45 },
});
