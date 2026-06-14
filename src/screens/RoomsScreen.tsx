import React, { useEffect, useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, Modal, TextInput, Alert, KeyboardAvoidingView, Platform, Image } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useData } from '../contexts/DataContext';
import { useAuth } from '../contexts/AuthContext';
import { Colors } from '../constants/colors';
import { roomIconImages } from '../constants/roomAssets';

export default function RoomsScreen({ route }: any) {
    const { user } = useAuth();
    const { rooms, getUserDevices, toggleDevice, addDevice, deleteDevice, addRoom, turnAllOn, turnAllOffRoom, applyScene, isServerControlled, isHomeSuspended, serverError, canManageInventory, isManualInventory } = useData();
    const [selectedRoom, setSelectedRoom] = useState<string | null>(route?.params?.roomId || null);
    const [showAddRoom, setShowAddRoom] = useState(false);
    const [showAddDevice, setShowAddDevice] = useState(false);
    const [newRoomName, setNewRoomName] = useState('');
    const [newDeviceName, setNewDeviceName] = useState('');
    const [newDeviceType, setNewDeviceType] = useState<'light' | 'fan' | 'ac' | 'outlet'>('light');
    const [newDevicePower, setNewDevicePower] = useState('');

    useEffect(() => {
        if (route?.params?.roomId) {
            setSelectedRoom(route.params.roomId);
        }
    }, [route?.params?.roomId, route?.params?.timestamp]);

    if (selectedRoom) {
        const room = rooms.find(item => item.id === selectedRoom);
        if (!room) return null;

        const roomDevices = getUserDevices(selectedRoom);
        const activeDevices = roomDevices.filter(device => device.isOn).length;
        const totalPower = roomDevices.filter(device => device.isOn).reduce((sum, device) => sum + device.power, 0);

        return (
            <ScrollView style={styles.container} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
                <View style={styles.roomHeader}>
                    <TouchableOpacity onPress={() => setSelectedRoom(null)} style={styles.backBtn}>
                        <Text style={{ fontSize: 22 }}>â†</Text>
                    </TouchableOpacity>
                    {roomIconImages[room.id] && (
                        <Image source={roomIconImages[room.id]} style={styles.roomHeaderImage} resizeMode="cover" />
                    )}
                    <View style={{ flex: 1 }}>
                        <Text style={styles.roomTitle}>{room.name}</Text>
                        <Text style={styles.roomSubtitle}>{activeDevices}/{roomDevices.length} thiáº¿t bá»‹ hoáº¡t Ä‘á»™ng</Text>
                    </View>
                </View>

                <View style={styles.roomStats}>
                    <View style={styles.roomStatCard}>
                        <Text style={{ fontSize: 14 }}>âš¡</Text>
                        <Text style={styles.roomStatLabel}>CÃ´ng suáº¥t</Text>
                        <Text style={styles.roomStatValue}>{totalPower}W</Text>
                    </View>
                    <View style={styles.roomStatCard}>
                        <Text style={{ fontSize: 14 }}>ðŸ“±</Text>
                        <Text style={styles.roomStatLabel}>Thiáº¿t bá»‹</Text>
                        <Text style={styles.roomStatValue}>{roomDevices.length}</Text>
                    </View>
                    <View style={styles.roomStatCard}>
                        <Text style={{ fontSize: 14 }}>âœ…</Text>
                        <Text style={styles.roomStatLabel}>Äang báº­t</Text>
                        <Text style={styles.roomStatValue}>{activeDevices}</Text>
                    </View>
                </View>

                {isHomeSuspended && (
                    <View style={styles.lockedBanner}>
                        <Text style={styles.lockedTitle}>NhÃ  Ä‘ang bá»‹ táº¡m khÃ³a</Text>
                        <Text style={styles.lockedText}>Báº¡n khÃ´ng thá»ƒ báº­t/táº¯t thiáº¿t bá»‹ cho tá»›i khi admin má»Ÿ khÃ³a nhÃ .</Text>
                    </View>
                )}

                <View style={styles.allBtnRow}>
                    <TouchableOpacity disabled={isHomeSuspended || isManualInventory} style={[styles.allBtn, { backgroundColor: Colors.green[500] }, (isHomeSuspended || isManualInventory) && styles.disabledBtn]} onPress={async () => {
                        const success = await turnAllOn(selectedRoom);
                        if (!success) Alert.alert('Lá»—i', 'ChÆ°a thá»ƒ báº­t táº¥t cáº£ thiáº¿t bá»‹ trong phÃ²ng. Kiá»ƒm tra PLC/server rá»“i thá»­ láº¡i.');
                    }}>
                        <Text style={styles.allBtnText}>âš¡ Báº­t táº¥t cáº£</Text>
                    </TouchableOpacity>
                    <TouchableOpacity disabled={isHomeSuspended || isManualInventory} style={[styles.allBtn, { backgroundColor: Colors.slate[200] }, (isHomeSuspended || isManualInventory) && styles.disabledBtn]} onPress={async () => {
                        const success = await turnAllOffRoom(selectedRoom);
                        if (!success) Alert.alert('Lá»—i', 'ChÆ°a thá»ƒ táº¯t táº¥t cáº£ thiáº¿t bá»‹ trong phÃ²ng. Kiá»ƒm tra PLC/server rá»“i thá»­ láº¡i.');
                    }}>
                        <Text style={[styles.allBtnText, { color: Colors.slate[700] }]}>ðŸ”Œ Táº¯t táº¥t cáº£</Text>
                    </TouchableOpacity>
                </View>

                <Text style={styles.sectionTitle}>Thiáº¿t bá»‹</Text>
                {roomDevices.length === 0 ? (
                    <View style={styles.emptyDevicesCard}>
                        <Text style={styles.emptyDevicesIcon}>ðŸ“¦</Text>
                        <Text style={styles.emptyDevicesTitle}>PhÃ²ng nÃ y chÆ°a cÃ³ thiáº¿t bá»‹</Text>
                        <Text style={styles.emptyDevicesText}>HÃ£y thÃªm cÃ¡c thiáº¿t bá»‹ thá»±c táº¿ Ä‘ang cÃ³ trong nhÃ  cá»§a báº¡n.</Text>
                    </View>
                ) : (
                    roomDevices.map(device => (
                        <View key={device.id} style={[styles.deviceCard, device.isOn && styles.deviceCardActive]}>
                            <View style={styles.deviceLeft}>
                                <View style={[styles.deviceIcon, { backgroundColor: device.isOn ? Colors.green[100] : Colors.slate[100] }]}>
                                    <Text style={{ fontSize: 20 }}>
                                        {device.type === 'light' ? 'ðŸ’¡' : device.type === 'fan' ? 'ðŸŒ€' : device.type === 'ac' ? 'â„ï¸' : 'ðŸ”Œ'}
                                    </Text>
                                </View>
                                <View>
                                    <Text style={styles.deviceName}>{device.name}</Text>
                                    <Text style={styles.deviceStatus}>{device.source === 'manual' ? `${device.power}W - Khai bao thu cong` : device.isOn ? `${device.power}W - Dang bat` : 'Da tat'}</Text>
                                </View>
                            </View>
                            <View style={styles.deviceActions}>
                                <TouchableOpacity
                                    style={[styles.toggle, device.isOn && styles.toggleActive]}
                                    disabled={isHomeSuspended || device.source === 'manual'}
                                    onPress={async () => {
                                        const result = await toggleDevice(selectedRoom, device.id);
                                        if (!result.success) {
                                            Alert.alert('Lá»—i', result.error || 'ChÆ°a thá»ƒ Ä‘iá»u khiá»ƒn thiáº¿t bá»‹. Kiá»ƒm tra PLC/server rá»“i thá»­ láº¡i.');
                                        }
                                    }}
                                >
                                    <View style={[styles.toggleCircle, device.isOn && styles.toggleCircleActive]} />
                                </TouchableOpacity>
                                {canManageInventory && device.source !== 'server' && (
                                    <TouchableOpacity
                                        style={styles.deleteDeviceBtn}
                                        onPress={() => {
                                            Alert.alert('XÃ³a thiáº¿t bá»‹', `XÃ³a "${device.name}" khá»i ${room.name}?`, [
                                                { text: 'Há»§y', style: 'cancel' },
                                                { text: 'Xoa', style: 'destructive', onPress: async () => { const result = await deleteDevice(selectedRoom, device.id); if (!result.success) Alert.alert('Loi', result.error || 'Khong the xoa thiet bi'); } },
                                            ]);
                                        }}
                                    >
                                        <Text style={styles.deleteDeviceText}>XÃ³a</Text>
                                    </TouchableOpacity>
                                )}
                            </View>
                        </View>
                    ))
                )}

                {canManageInventory && (isManualInventory || !isServerControlled) && (
                    <TouchableOpacity style={styles.addDeviceBtn} onPress={() => setShowAddDevice(true)}>
                        <LinearGradient colors={[Colors.primary[500], Colors.primary[700]]} style={styles.addDeviceBtnGradient}>
                            <Text style={styles.addDeviceBtnText}>+ ThÃªm thiáº¿t bá»‹ má»›i</Text>
                        </LinearGradient>
                    </TouchableOpacity>
                )}

                {isServerControlled && !canManageInventory && (
                    <View style={styles.haHintCard}>
                        <Text style={styles.haHintTitle}>Thiáº¿t bá»‹ Ä‘ang Ä‘á»“ng bá»™ tá»« server riÃªng</Text>
                        <Text style={styles.haHintText}>Muá»‘n thÃªm hoáº·c xÃ³a thiáº¿t bá»‹, hÃ£y cáº­p nháº­t trÃªn server/PLC rá»“i Ä‘á»ƒ app Ä‘á»“ng bá»™ láº¡i.</Text>
                    </View>
                )}

                <Modal visible={showAddDevice} transparent animationType="slide">
                    <KeyboardAvoidingView
                        style={styles.modalOverlay}
                        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
                        keyboardVerticalOffset={Platform.OS === 'ios' ? 16 : 0}
                    >
                        <View style={styles.modalContent}>
                            <Text style={styles.modalTitle}>ThÃªm thiáº¿t bá»‹ má»›i</Text>
                            <TextInput style={styles.modalInput} placeholder="TÃªn thiáº¿t bá»‹" value={newDeviceName} onChangeText={setNewDeviceName} placeholderTextColor={Colors.slate[400]} />

                            <Text style={styles.modalLabel}>Loáº¡i thiáº¿t bá»‹</Text>
                            <View style={styles.typeRow}>
                                {[
                                    { type: 'light' as const, label: 'ðŸ’¡ ÄÃ¨n' },
                                    { type: 'fan' as const, label: 'ðŸŒ€ Quáº¡t' },
                                    { type: 'ac' as const, label: 'â„ï¸ MÃ¡y láº¡nh' },
                                    { type: 'outlet' as const, label: 'ðŸ”Œ á»” cáº¯m' },
                                ].map(item => (
                                    <TouchableOpacity key={item.type} style={[styles.typeBtn, newDeviceType === item.type && styles.typeBtnActive]} onPress={() => setNewDeviceType(item.type)}>
                                        <Text style={[styles.typeBtnText, newDeviceType === item.type && styles.typeBtnTextActive]}>{item.label}</Text>
                                    </TouchableOpacity>
                                ))}
                            </View>

                            <TextInput style={styles.modalInput} placeholder="CÃ´ng suáº¥t (W)" value={newDevicePower} onChangeText={setNewDevicePower} keyboardType="numeric" placeholderTextColor={Colors.slate[400]} />

                            <View style={styles.modalBtnRow}>
                                <TouchableOpacity style={styles.modalCancelBtn} onPress={() => setShowAddDevice(false)}>
                                    <Text style={styles.modalCancelText}>Há»§y</Text>
                                </TouchableOpacity>
                                <TouchableOpacity
                                    style={styles.modalSaveBtn}
                                    onPress={async () => {
                                        if (!newDeviceName.trim() || !newDevicePower.trim()) {
                                            Alert.alert('Lá»—i', 'Vui lÃ²ng nháº­p Ä‘áº§y Ä‘á»§ thÃ´ng tin');
                                            return;
                                        }
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
                                        Alert.alert('ThÃ nh cÃ´ng', 'ÄÃ£ thÃªm thiáº¿t bá»‹ má»›i');
                                    }}
                                >
                                    <Text style={styles.modalSaveText}>ThÃªm</Text>
                                </TouchableOpacity>
                            </View>
                        </View>
                    </KeyboardAvoidingView>
                </Modal>

                <View style={{ height: 30 }} />
            </ScrollView>
        );
    }

    return (
        <ScrollView style={styles.container} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
            <Text style={styles.pageTitle}>Quáº£n lÃ½ phÃ²ng</Text>

            {canManageInventory && (
                <TouchableOpacity style={styles.addRoomBtn} onPress={() => setShowAddRoom(true)}>
                    <Text style={styles.addRoomBtnText}>+ Thêm phòng</Text>
                </TouchableOpacity>
            )}

            {isHomeSuspended && (
                <View style={styles.lockedBanner}>
                    <Text style={styles.lockedTitle}>NhÃ  Ä‘ang bá»‹ táº¡m khÃ³a</Text>
                    <Text style={styles.lockedText}>Demo phÃ¢n quyá»n: admin web khÃ³a nhÃ  thÃ¬ app mobile khÃ´ng Ä‘Æ°á»£c xem dá»¯ liá»‡u má»›i hoáº·c Ä‘iá»u khiá»ƒn thiáº¿t bá»‹.</Text>
                </View>
            )}

            {!isHomeSuspended && serverError && isServerControlled && (
                <View style={styles.adminHintCard}>
                    <Text style={styles.adminHintTitle}>PLC/Server chÆ°a sáºµn sÃ ng</Text>
                    <Text style={styles.adminHintText}>{serverError}</Text>
                </View>
            )}

            {user?.role === 'admin' && (
                <View style={styles.adminHintCard}>
                    <Text style={styles.adminHintTitle}>Quáº£n trá»‹ viÃªn</Text>
                    <Text style={styles.adminHintText}>Há»‡ thá»‘ng Ä‘ang dÃ¹ng server riÃªng lÃ m trung tÃ¢m. Quáº£n lÃ½ user váº«n náº±m á»Ÿ tab Quáº£n lÃ½.</Text>
                </View>
            )}

            <View style={styles.roomGrid}>
                {rooms.map(room => {
                    const isActive = room.active > 0;
                    return (
                        <TouchableOpacity key={room.id} style={[styles.roomCard, isActive && styles.roomCardActive]} onPress={() => setSelectedRoom(room.id)}>
                            {isActive && <View style={styles.roomActiveDot} />}
                            <View style={[styles.roomCardIcon, isActive && styles.roomCardIconActive]}>
                                {roomIconImages[room.id] ? (
                                    <Image source={roomIconImages[room.id]} style={styles.roomCardIconImage} resizeMode="cover" />
                                ) : (
                                    <Text style={{ fontSize: 22 }}>ðŸ </Text>
                                )}
                            </View>
                            <Text style={styles.roomCardName}>{room.name}</Text>
                            <Text style={styles.roomCardSub}>{room.active}/{room.devices} thiáº¿t bá»‹</Text>
                            <View style={styles.roomCardStats}>
                                <Text style={styles.roomCardStat}>âš¡ {room.power}W</Text>
                                <Text style={styles.roomCardStat}>ðŸ“± {room.devices} thiáº¿t bá»‹</Text>
                            </View>
                        </TouchableOpacity>
                    );
                })}
            </View>

            <Text style={[styles.sectionTitle, { marginTop: 20 }]}>Cáº£nh nhanh</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                {[
                    { label: 'â˜€ï¸ Buá»•i sÃ¡ng', colors: ['#d97706', '#f59e0b'], scene: 'morning' as const },
                    { label: 'âš¡ Äi lÃ m', colors: ['#0f766e', '#115e59'], scene: 'work' as const },
                    { label: 'ðŸŽ‰ Cuá»‘i tuáº§n', colors: ['#256f5f', '#173a31'], scene: 'weekend' as const },
                    { label: 'ðŸ˜´ Ngá»§', colors: ['#334155', '#13251f'], scene: 'sleep' as const },
                ].map((item, index) => (
                    <TouchableOpacity
                        key={index}
                        onPress={() => {
                            Alert.alert('KÃ­ch hoáº¡t cáº£nh', `Báº­t cháº¿ Ä‘á»™ ${item.label}?`, [
                                { text: 'Há»§y', style: 'cancel' },
                                {
                                    text: 'Báº­t',
                                    onPress: async () => {
                                        const success = await applyScene(item.scene);
                                        Alert.alert(
                                            success ? 'ThÃ nh cÃ´ng' : 'Lá»—i',
                                            success ? `ÄÃ£ kÃ­ch hoáº¡t cáº£nh ${item.label}` : `ChÆ°a thá»ƒ kÃ­ch hoáº¡t cáº£nh ${item.label}. Kiá»ƒm tra PLC/server rá»“i thá»­ láº¡i.`,
                                        );
                                    },
                                },
                            ]);
                        }}
                    >
                        <LinearGradient colors={item.colors as [string, string]} style={styles.sceneBtn}>
                            <Text style={styles.sceneBtnText}>{item.label}</Text>
                        </LinearGradient>
                    </TouchableOpacity>
                ))}
            </ScrollView>

            <View style={styles.energyCard}>
                <Text style={[styles.sectionTitle, { marginBottom: 12 }]}>TiÃªu thá»¥ theo phÃ²ng</Text>
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
                            <TouchableOpacity style={styles.modalCancelBtn} onPress={() => setShowAddRoom(false)}>
                                <Text style={styles.modalCancelText}>Hủy</Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                style={styles.modalSaveBtn}
                                onPress={async () => {
                                    const result = await addRoom(newRoomName);
                                    if (!result.success) {
                                        Alert.alert('Lỗi', result.error || 'Không thể thêm phòng');
                                        return;
                                    }
                                    setNewRoomName('');
                                    setShowAddRoom(false);
                                }}
                            >
                                <Text style={styles.modalSaveText}>Thêm</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </KeyboardAvoidingView>
            </Modal>

            <View style={{ height: 20 }} />
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#edf3f0' },
    content: { padding: 16, paddingBottom: 30 },
    pageTitle: { fontSize: 28, fontWeight: '900', color: '#13251f', marginBottom: 16, marginTop: 8, letterSpacing: -0.4 },
    sectionTitle: { fontSize: 17, fontWeight: '800', color: '#13251f', marginBottom: 10, letterSpacing: -0.1 },
    addRoomBtn: { alignSelf: 'flex-start', paddingHorizontal: 14, paddingVertical: 10, borderRadius: 12, backgroundColor: '#0f766e', marginBottom: 14 },
    addRoomBtnText: { color: '#fff', fontWeight: '800', fontSize: 13 },
    roomGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
    roomCard: { width: '48%' as any, minHeight: 178, backgroundColor: '#f8fbf9', borderRadius: 18, padding: 14, shadowColor: '#173a31', shadowOpacity: 0.06, shadowRadius: 16, shadowOffset: { width: 0, height: 9 }, elevation: 2, position: 'relative', borderWidth: 1, borderColor: '#dce7e1' },
    roomCardActive: { borderColor: '#34d399', backgroundColor: '#f3fbf6', shadowOpacity: 0.1 },
    roomActiveDot: { position: 'absolute', top: 12, right: 12, width: 9, height: 9, borderRadius: 5, backgroundColor: Colors.green[500], borderWidth: 2, borderColor: '#f8fbf9' },
    roomCardIcon: { width: 58, height: 58, borderRadius: 15, alignItems: 'center', justifyContent: 'center', marginBottom: 12, overflow: 'hidden', backgroundColor: '#e7eee9' },
    roomCardIconActive: { borderWidth: 2, borderColor: '#34d399' },
    roomCardIconImage: { width: '100%', height: '100%', borderRadius: 14 },
    roomCardName: { fontSize: 15, fontWeight: '800', color: '#13251f' },
    roomCardSub: { fontSize: 12, color: '#61736c', marginTop: 3, marginBottom: 10, fontWeight: '600' },
    roomCardStats: { gap: 5, marginTop: 'auto' },
    roomCardStat: { fontSize: 11, color: '#50645c', fontWeight: '700', fontVariant: ['tabular-nums'] },
    sceneBtn: { minWidth: 118, paddingHorizontal: 16, paddingVertical: 13, borderRadius: 14, marginRight: 10, shadowColor: '#173a31', shadowOpacity: 0.09, shadowRadius: 12, shadowOffset: { width: 0, height: 7 }, elevation: 2 },
    sceneBtnText: { color: '#fff', fontWeight: '800', fontSize: 13 },
    energyCard: { backgroundColor: '#f8fbf9', borderRadius: 18, padding: 16, marginTop: 16, shadowColor: '#173a31', shadowOpacity: 0.06, shadowRadius: 16, shadowOffset: { width: 0, height: 9 }, elevation: 2, borderWidth: 1, borderColor: '#dce7e1' },
    energyRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 },
    energyLabel: { fontSize: 13, color: '#50645c', fontWeight: '700' },
    energyValue: { fontSize: 13, fontWeight: '900', color: '#13251f', fontVariant: ['tabular-nums'] },
    energyBarBg: { height: 9, backgroundColor: '#e7eee9', borderRadius: 999, overflow: 'hidden' },
    energyBarFill: { height: '100%', borderRadius: 999 },
    roomHeader: { flexDirection: 'row', alignItems: 'center', gap: 10, padding: 14, borderWidth: 1, borderColor: '#dce7e1', marginBottom: 14, backgroundColor: '#f8fbf9', borderRadius: 18, shadowColor: '#173a31', shadowOpacity: 0.06, shadowRadius: 16, shadowOffset: { width: 0, height: 9 }, elevation: 2 },
    roomHeaderImage: { width: 46, height: 46, borderRadius: 14 },
    backBtn: { width: 36, height: 36, borderRadius: 12, alignItems: 'center', justifyContent: 'center', backgroundColor: '#e7eee9' },
    roomTitle: { fontSize: 20, fontWeight: '900', color: '#13251f', letterSpacing: -0.2 },
    roomSubtitle: { fontSize: 13, color: '#61736c', fontWeight: '600' },
    roomStats: { flexDirection: 'row', gap: 10, marginBottom: 14 },
    roomStatCard: { flex: 1, backgroundColor: '#f8fbf9', borderRadius: 16, padding: 12, alignItems: 'center', shadowColor: '#173a31', shadowOpacity: 0.05, shadowRadius: 14, shadowOffset: { width: 0, height: 8 }, elevation: 2, borderWidth: 1, borderColor: '#dce7e1' },
    roomStatLabel: { fontSize: 11, color: '#61736c', marginTop: 4, fontWeight: '700' },
    roomStatValue: { fontSize: 19, fontWeight: '900', color: '#13251f', marginTop: 2, fontVariant: ['tabular-nums'] },
    allBtnRow: { flexDirection: 'row', gap: 10, marginBottom: 16 },
    allBtn: { flex: 1, paddingVertical: 13, borderRadius: 13, alignItems: 'center', shadowColor: '#173a31', shadowOpacity: 0.08, shadowRadius: 12, shadowOffset: { width: 0, height: 7 }, elevation: 2 },
    allBtnText: { color: '#fff', fontWeight: '800', fontSize: 14 },
    deviceCard: { backgroundColor: '#f8fbf9', borderRadius: 18, padding: 14, marginBottom: 10, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', shadowColor: '#173a31', shadowOpacity: 0.05, shadowRadius: 14, shadowOffset: { width: 0, height: 8 }, elevation: 2, borderWidth: 1, borderColor: '#dce7e1' },
    deviceCardActive: { borderColor: '#34d399', backgroundColor: '#f3fbf6' },
    deviceLeft: { flexDirection: 'row', alignItems: 'center', gap: 12, flex: 1 },
    deviceActions: { alignItems: 'flex-end', gap: 8, marginLeft: 12 },
    deviceIcon: { width: 46, height: 46, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
    deviceName: { fontSize: 15, fontWeight: '800', color: '#13251f' },
    deviceStatus: { fontSize: 12, color: '#61736c', marginTop: 3, fontWeight: '600', fontVariant: ['tabular-nums'] },
    toggle: { width: 50, height: 28, borderRadius: 14, backgroundColor: '#cddbd5', justifyContent: 'center', paddingHorizontal: 2 },
    toggleActive: { backgroundColor: '#16a34a' },
    toggleCircle: { width: 24, height: 24, borderRadius: 12, backgroundColor: '#fff', shadowColor: '#173a31', shadowOpacity: 0.18, shadowRadius: 4, shadowOffset: { width: 0, height: 2 }, elevation: 2 },
    toggleCircleActive: { alignSelf: 'flex-end' },
    deleteDeviceBtn: { paddingHorizontal: 10, paddingVertical: 6, borderRadius: 10, backgroundColor: Colors.red[50], borderWidth: 1, borderColor: Colors.red[200] },
    deleteDeviceText: { fontSize: 12, fontWeight: '600', color: Colors.red[600] },
    emptyDevicesCard: { backgroundColor: '#f8fbf9', borderRadius: 18, padding: 24, alignItems: 'center', marginBottom: 12, shadowColor: '#173a31', shadowOpacity: 0.05, shadowRadius: 14, shadowOffset: { width: 0, height: 8 }, elevation: 2, borderWidth: 1, borderColor: '#dce7e1' },
    emptyDevicesIcon: { fontSize: 28, marginBottom: 10 },
    emptyDevicesTitle: { fontSize: 16, fontWeight: '800', color: '#13251f', marginBottom: 4 },
    emptyDevicesText: { fontSize: 13, color: '#61736c', textAlign: 'center', lineHeight: 18 },
    addDeviceBtn: { borderRadius: 12, overflow: 'hidden', marginTop: 10 },
    addDeviceBtnGradient: { padding: 14, alignItems: 'center' },
    addDeviceBtnText: { color: '#fff', fontWeight: '600', fontSize: 15 },
    haHintCard: { backgroundColor: '#eaf5ff', borderRadius: 16, padding: 14, borderWidth: 1, borderColor: '#bfdbfe', marginTop: 10 },
    haHintTitle: { fontSize: 14, fontWeight: '800', color: Colors.blue[700], marginBottom: 4 },
    haHintText: { fontSize: 13, color: Colors.blue[700], lineHeight: 18 },
    adminHintCard: { backgroundColor: '#fff8e6', borderRadius: 16, padding: 14, borderWidth: 1, borderColor: '#f5d991', marginBottom: 14 },
    adminHintTitle: { fontSize: 14, fontWeight: '800', color: Colors.amber[700], marginBottom: 4 },
    adminHintText: { fontSize: 13, color: Colors.amber[700], lineHeight: 18 },
    modalOverlay: { flex: 1, backgroundColor: 'rgba(15,23,42,0.56)', justifyContent: 'flex-end' },
    modalContent: { backgroundColor: '#f8fbf9', borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24, paddingBottom: 40, shadowColor: '#10251f', shadowOpacity: 0.18, shadowRadius: 24, shadowOffset: { width: 0, height: -10 }, elevation: 5 },
    modalTitle: { fontSize: 20, fontWeight: '900', color: '#13251f', marginBottom: 16, letterSpacing: -0.2 },
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
    disabledBtn: { opacity: 0.45 },
});
