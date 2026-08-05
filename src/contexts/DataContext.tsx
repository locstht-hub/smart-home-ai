import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { defaultRooms, Device, ActivityLog } from '../constants/data';
import { useAuth } from './AuthContext';
import { useSmartHomeServer } from './SmartHomeServerContext';
import { buildFallbackHouseDevices, HouseDevices, normalizeServerDevices } from '../services/smartHome/mappers';
import { ManualDevice } from '../types/smartHomeServer';

interface ComputedRoom {
    id: string;
    name: string;
    type?: string;
    devices: number;
    active: number;
    power: number;
    source?: 'default' | 'manual';
}

type RoomDefinition = { id: string; name: string; type?: string; source: 'default' | 'manual' };

export interface DeviceControlResult {
    success: boolean;
    error?: string;
    message: string;
    source: 'plc-feedback' | 'server-acknowledged' | 'local-demo';
    actualState?: boolean;
    latencyMs?: number;
}

interface DataContextType {
    rooms: ComputedRoom[];
    devices: HouseDevices;
    activityLogs: ActivityLog[];
    isServerControlled: boolean;
    serverError: string | null;
    isHomeSuspended: boolean;
    canManageInventory: boolean;
    isManualInventory: boolean;
    refresh: () => Promise<void>;
    addRoom: (name: string) => Promise<{ success: boolean; error?: string }>;
    toggleDevice: (roomId: string, deviceId: string, targetUserId?: string) => Promise<DeviceControlResult>;
    addDevice: (roomId: string, device: Omit<Device, 'id' | 'ownerId'>, targetUserId?: string) => Promise<{ success: boolean; error?: string }>;
    deleteDevice: (roomId: string, deviceId: string, targetUserId?: string) => Promise<{ success: boolean; error?: string }>;
    turnAllOff: (targetUserId?: string) => Promise<boolean>;
    turnAllOn: (roomId: string, targetUserId?: string) => Promise<boolean>;
    turnAllOffRoom: (roomId: string, targetUserId?: string) => Promise<boolean>;
    getTotalPower: (targetUserId?: string) => number;
    getActiveDeviceCount: (targetUserId?: string) => number;
    getUserDevices: (roomId: string, targetUserId?: string) => Device[];
    getRoomsForUser: (targetUserId?: string) => ComputedRoom[];
    getHouseDeviceCount: (targetUserId?: string) => number;
    applyScene: (scene: 'morning' | 'work' | 'weekend' | 'sleep', targetUserId?: string) => Promise<boolean>;
}

const DataContext = createContext<DataContextType>({} as DataContextType);

const DEVICES_STORAGE_KEY = 'sharedHouseDevices';
const ACTIVITY_LOGS_STORAGE_KEY = 'activityLogs';
const SERVER_DEVICES_REFRESH_MS = 30000;

export const useData = () => useContext(DataContext);

const describeControlFailure = (message: string): string => {
    if (/quota|hạn mức|han muc/i.test(message)) return 'Bị chặn do Quota.';
    if (/permission|forbidden|không có quyền|khong co quyen|device scope/i.test(message)) return 'Bị từ chối do quyền truy cập.';
    if (/timeout|timed out|abort/i.test(message)) return 'Quá thời gian chờ phản hồi.';
    if (/plc/i.test(message)) return 'Không thể kết nối PLC.';
    if (/network|server api|không thể kết nối|khong the ket noi|fetch/i.test(message)) return 'Không thể kết nối API.';
    return message || 'Không thể điều khiển thiết bị.';
};

const getRoomsForHouse = (house: HouseDevices, roomDefs: RoomDefinition[] = defaultRooms.map(room => ({ id: room.id, name: room.name, source: 'default' as const }))): ComputedRoom[] => {
    return roomDefs.map(baseRoom => {
        const roomDevices = house[baseRoom.id] || [];
        const activeDevices = roomDevices.filter(device => device.isOn);
        return {
            id: baseRoom.id,
            name: baseRoom.name,
            type: baseRoom.type,
            devices: roomDevices.length,
            active: activeDevices.length,
            power: activeDevices.reduce((sum, device) => sum + device.power, 0),
            source: baseRoom.source,
        };
    });
};

const serverToLocalDeviceType = (type: ManualDevice['type']): Device['type'] => {
    if (type === 'aircon') return 'ac';
    if (type === 'socket' || type === 'sensor' || type === 'appliance' || type === 'other') return 'outlet';
    return type;
};

const localToServerDeviceType = (type: Device['type']) => {
    if (type === 'ac') return 'aircon';
    if (type === 'outlet') return 'socket';
    return type;
};

const buildManualHouseDevices = (manualDevices: ManualDevice[]): HouseDevices => {
    return manualDevices.reduce((house, item) => {
        const roomId = item.roomId || 'unassigned';
        const device: Device = {
            id: item.id,
            name: item.name,
            type: serverToLocalDeviceType(item.type),
            isOn: item.status === 'on',
            power: Number(item.ratedPowerW || 0),
            roomId,
            source: 'manual',
            available: item.status !== 'offline',
        };
        house[roomId] = [...(house[roomId] || []), device];
        return house;
    }, {} as HouseDevices);
};

export const DataProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const { user } = useAuth();
    const { client, isConfigured } = useSmartHomeServer();
    const [devices, setDevices] = useState<HouseDevices>(buildFallbackHouseDevices());
    const [roomDefinitions, setRoomDefinitions] = useState<RoomDefinition[]>(
        defaultRooms.map(room => ({ id: room.id, name: room.name, source: 'default' })),
    );
    const [activityLogs, setActivityLogs] = useState<ActivityLog[]>([]);
    const [hasLoadedStorage, setHasLoadedStorage] = useState(false);
    const [isServerControlled, setIsServerControlled] = useState(false);
    const [isManualInventory, setIsManualInventory] = useState(false);
    const [serverError, setServerError] = useState<string | null>(null);
    const canManageInventory = Boolean(user?.role === 'admin' || user?.canManageDevices);

    useEffect(() => {
        const loadPersistedData = async () => {
            try {
                const [savedDevices, savedLogs] = await Promise.all([
                    AsyncStorage.getItem(DEVICES_STORAGE_KEY),
                    AsyncStorage.getItem(ACTIVITY_LOGS_STORAGE_KEY),
                ]);

                if (savedDevices) setDevices(JSON.parse(savedDevices));
                if (savedLogs) setActivityLogs(JSON.parse(savedLogs));
            } catch (error) {
                console.error('Error loading device cache:', error);
            } finally {
                setHasLoadedStorage(true);
            }
        };

        loadPersistedData();
    }, []);

    useEffect(() => {
        if (!hasLoadedStorage || isServerControlled) return;
        AsyncStorage.setItem(DEVICES_STORAGE_KEY, JSON.stringify(devices)).catch(error => {
            console.error('Error saving device cache:', error);
        });
    }, [devices, hasLoadedStorage, isServerControlled]);

    useEffect(() => {
        if (!hasLoadedStorage) return;
        AsyncStorage.setItem(ACTIVITY_LOGS_STORAGE_KEY, JSON.stringify(activityLogs)).catch(error => {
            console.error('Error saving activity logs:', error);
        });
    }, [activityLogs, hasLoadedStorage]);

    const addLog = useCallback((action: string, deviceName?: string, roomName?: string) => {
        const log: ActivityLog = {
            id: `log-${Date.now()}`,
            userId: user?.id || 'guest',
            userName: user?.name || 'Hệ thống',
            action,
            device: deviceName,
            room: roomName,
            timestamp: new Date().toISOString(),
        };
        setActivityLogs(prev => [log, ...prev].slice(0, 100));
    }, [user?.id, user?.name]);

    const refresh = useCallback(async () => {
        if (!isConfigured) {
            setIsServerControlled(false);
            setIsManualInventory(false);
            setServerError(null);
            return;
        }

        try {
            if (user?.homeId) {
                const [manualRooms, manualDevices] = await Promise.all([
                    client.getManualRooms(user.homeId),
                    client.getManualDevices(user.homeId),
                ]);

                if (manualRooms.length || manualDevices.length) {
                    const nextRoomDefs: RoomDefinition[] = manualRooms.map(room => ({
                        id: room.id,
                        name: room.name,
                        type: room.type,
                        source: 'manual' as const,
                    }));
                    const roomIds = new Set(nextRoomDefs.map(room => room.id));
                    manualDevices.forEach(device => {
                        const roomId = device.roomId || 'unassigned';
                        if (!roomIds.has(roomId)) {
                            nextRoomDefs.push({ id: roomId, name: roomId === 'unassigned' ? 'Chưa phân phòng' : 'Phòng khác', source: 'manual' });
                            roomIds.add(roomId);
                        }
                    });

                    setRoomDefinitions(nextRoomDefs);
                    setDevices(buildManualHouseDevices(manualDevices));
                    setIsServerControlled(true);
                    setIsManualInventory(true);
                    setServerError(null);
                    return;
                }
            }

            const nextDevices = await client.getDevices();
            setRoomDefinitions(defaultRooms.map(room => ({ id: room.id, name: room.name, source: 'default' })));
            setDevices(normalizeServerDevices(nextDevices));
            setIsServerControlled(true);
            setIsManualInventory(false);
            setServerError(null);
        } catch (error) {
            console.error('Error refreshing Smart Home server devices:', error);
            setIsServerControlled(true);
            setServerError(error instanceof Error ? error.message : 'Không thể tải dữ liệu server');
        }
    }, [client, isConfigured, user?.homeId]);

    useEffect(() => {
        if (!hasLoadedStorage) return;
        refresh().catch(() => undefined);

        const interval = setInterval(() => {
            refresh().catch(() => undefined);
        }, SERVER_DEVICES_REFRESH_MS);

        return () => clearInterval(interval);
    }, [hasLoadedStorage, refresh]);

    const rooms = useMemo(() => getRoomsForHouse(devices, roomDefinitions), [devices, roomDefinitions]);

    const updateLocalHouse = useCallback((updater: (house: HouseDevices) => HouseDevices) => {
        setDevices(prev => updater(prev));
    }, []);

    const getRoomName = useCallback((roomId: string) => {
        return roomDefinitions.find(room => room.id === roomId)?.name || defaultRooms.find(room => room.id === roomId)?.name;
    }, [roomDefinitions]);

    const addRoom = useCallback(async (name: string): Promise<{ success: boolean; error?: string }> => {
        const cleanName = name.trim();
        if (!cleanName) return { success: false, error: 'Vui lòng nhập tên phòng' };

        try {
            if (isConfigured && user?.homeId) {
                await client.createManualRoom(user.homeId, {
                    name: cleanName,
                    type: 'room',
                    sortOrder: rooms.length,
                });
                await refresh();
            } else {
                const roomId = `room-${Date.now()}`;
                setRoomDefinitions(prev => [...prev, { id: roomId, name: cleanName, source: 'manual' }]);
                updateLocalHouse(house => ({ ...house, [roomId]: [] }));
            }
            addLog('Thêm phòng mới', undefined, cleanName);
            return { success: true };
        } catch (error) {
            const message = error instanceof Error ? error.message : 'Không thể thêm phòng';
            setServerError(message);
            return { success: false, error: message };
        }
    }, [addLog, client, isConfigured, refresh, rooms.length, updateLocalHouse, user?.homeId]);

    const toggleDevice = useCallback(async (roomId: string, deviceId: string): Promise<DeviceControlResult> => {
        const currentDevice = (devices[roomId] || []).find(device => device.id === deviceId);
        if (!currentDevice) {
            return {
                success: false,
                error: 'Không tìm thấy thiết bị',
                message: 'Không tìm thấy thiết bị.',
                source: 'local-demo',
            };
        }

        if (currentDevice.source === 'manual') {
            return {
                success: false,
                error: 'Thiết bị này đang là khai báo thủ công, chưa gắn lệnh điều khiển PLC.',
                message: 'Thiết bị khai báo thủ công chưa có lệnh điều khiển.',
                source: 'local-demo',
            };
        }

        const nextState = !currentDevice.isOn;

        try {
            if (isConfigured && isServerControlled) {
                const response = await client.setDeviceState(currentDevice.id, nextState);
                const feedback = response.feedback;
                const actualState = typeof feedback?.actualState === 'boolean' ? feedback.actualState : response.isOn;

                if (feedback?.verified && actualState !== nextState) {
                    throw new Error(`PLC feedback mismatch: expected ${nextState}, got ${actualState}`);
                }

                await refresh();
                addLog(currentDevice.isOn ? 'Tắt thiết bị' : 'Bật thiết bị', currentDevice.name, getRoomName(roomId));
                return {
                    success: true,
                    message: feedback?.verified
                        ? `PLC đã xác nhận ${actualState ? 'bật' : 'tắt'}${typeof feedback.latencyMs === 'number' ? ` sau ${feedback.latencyMs.toFixed(0)} ms` : ''}.`
                        : `Server đã xác nhận ${actualState ? 'bật' : 'tắt'}; chưa có phản hồi PLC độc lập.`,
                    source: feedback?.verified ? 'plc-feedback' : 'server-acknowledged',
                    actualState,
                    latencyMs: feedback?.verified && typeof feedback.latencyMs === 'number' ? feedback.latencyMs : undefined,
                };
            } else {
                updateLocalHouse(house => ({
                    ...house,
                    [roomId]: house[roomId].map(device =>
                        device.id === deviceId ? { ...device, isOn: nextState } : device,
                    ),
                }));
                addLog(currentDevice.isOn ? 'Tắt thiết bị cục bộ' : 'Bật thiết bị cục bộ', currentDevice.name, getRoomName(roomId));
                return {
                    success: true,
                    message: `Đã cập nhật dữ liệu cục bộ: ${nextState ? 'bật' : 'tắt'}. Không phải phản hồi PLC.`,
                    source: 'local-demo',
                    actualState: nextState,
                };
            }
        } catch (error) {
            console.error('Error toggling device:', error);
            const message = error instanceof Error ? error.message : 'Không thể điều khiển thiết bị';
            const userMessage = describeControlFailure(message);
            setServerError(message);
            addLog('Lỗi điều khiển thiết bị', currentDevice.name, getRoomName(roomId));
            return {
                success: false,
                error: message,
                message: userMessage,
                source: isConfigured && isServerControlled ? 'server-acknowledged' : 'local-demo',
            };
        }
    }, [addLog, client, devices, getRoomName, isConfigured, isServerControlled, refresh, updateLocalHouse]);

    const addDevice = useCallback(async (roomId: string, device: Omit<Device, 'id' | 'ownerId'>): Promise<{ success: boolean; error?: string }> => {
        if (isConfigured && user?.homeId && (isManualInventory || isServerControlled)) {
            try {
                await client.createManualDevice(user.homeId, {
                    roomId,
                    name: device.name,
                    type: localToServerDeviceType(device.type),
                    status: device.isOn ? 'on' : 'off',
                    ratedPowerW: device.power,
                    isControllable: false,
                });
                await refresh();
                addLog('Thêm thiết bị thủ công', device.name, getRoomName(roomId));
                return { success: true };
            } catch (error) {
                const message = error instanceof Error ? error.message : 'Không thể thêm thiết bị';
                setServerError(message);
                return { success: false, error: message };
            }
        }

        if (isServerControlled) {
            addLog('Yêu cầu thêm thiết bị trên server', device.name, getRoomName(roomId));
            return { success: false, error: 'Thiết bị server cần được thêm qua danh mục thủ công.' };
        }

        const newDevice: Device = {
            ...device,
            id: `dev-${Date.now()}`,
            source: 'local',
            roomId,
        };

        updateLocalHouse(house => ({
            ...house,
            [roomId]: [...(house[roomId] || []), newDevice],
        }));

        addLog('Thêm thiết bị mới', newDevice.name, getRoomName(roomId));
        return { success: true };
    }, [addLog, client, getRoomName, isConfigured, isManualInventory, isServerControlled, refresh, updateLocalHouse, user?.homeId]);

    const deleteDevice = useCallback(async (roomId: string, deviceId: string): Promise<{ success: boolean; error?: string }> => {
        const currentDevice = (devices[roomId] || []).find(device => device.id === deviceId);
        if (!currentDevice) return { success: false, error: 'Không tìm thấy thiết bị' };

        if (isConfigured && user?.homeId && currentDevice.source === 'manual') {
            try {
                await client.deleteManualDevice(user.homeId, currentDevice.id);
                await refresh();
                addLog('Xóa thiết bị thủ công', currentDevice.name, getRoomName(roomId));
                return { success: true };
            } catch (error) {
                const message = error instanceof Error ? error.message : 'Không thể xóa thiết bị';
                setServerError(message);
                return { success: false, error: message };
            }
        }

        if (isServerControlled && currentDevice.source === 'server') {
            addLog('Yêu cầu xóa thiết bị trên server', currentDevice.name, getRoomName(roomId));
            return { success: false, error: 'Thiết bị PLC phải được quản lý trên server/PLC.' };
        }

        updateLocalHouse(house => ({
            ...house,
            [roomId]: house[roomId].filter(device => device.id !== deviceId),
        }));

        addLog('Xóa thiết bị', currentDevice.name, getRoomName(roomId));
        return { success: true };
    }, [addLog, client, devices, getRoomName, isConfigured, isServerControlled, refresh, updateLocalHouse, user?.homeId]);

    const setAllDevicesState = useCallback(async (roomId: string | null, nextState: boolean): Promise<boolean> => {
        const targetDevices = roomId ? devices[roomId] || [] : Object.values(devices).flat();

        try {
            if (isManualInventory) {
                return false;
            }
            if (isConfigured && isServerControlled) {
                // Keep PLC commands ordered. The backend also serializes S7 writes,
                // but avoiding a client-side burst makes feedback failures explicit.
                for (const device of targetDevices) {
                    await client.setDeviceState(device.id, nextState);
                }
                await refresh();
            } else {
                updateLocalHouse(house => {
                    if (roomId) {
                        return {
                            ...house,
                            [roomId]: house[roomId].map(device => ({ ...device, isOn: nextState })),
                        };
                    }

                    return Object.keys(house).reduce((acc, currentRoomId) => {
                        acc[currentRoomId] = house[currentRoomId].map(device => ({ ...device, isOn: nextState }));
                        return acc;
                    }, {} as HouseDevices);
                });
            }

            return true;
        } catch (error) {
            console.error('Error setting all devices state:', error);
            setServerError(error instanceof Error ? error.message : 'Không thể điều khiển thiết bị');
            return false;
        }
    }, [client, devices, isConfigured, isManualInventory, isServerControlled, refresh, updateLocalHouse]);

    const turnAllOff = useCallback(async () => {
        const success = await setAllDevicesState(null, false);
        addLog(success ? 'Tắt tất cả thiết bị' : 'Lỗi tắt tất cả thiết bị');
        return success;
    }, [addLog, setAllDevicesState]);

    const turnAllOn = useCallback(async (roomId: string) => {
        const success = await setAllDevicesState(roomId, true);
        addLog(success ? 'Bật tất cả thiết bị' : 'Lỗi bật tất cả thiết bị', undefined, getRoomName(roomId));
        return success;
    }, [addLog, getRoomName, setAllDevicesState]);

    const turnAllOffRoom = useCallback(async (roomId: string) => {
        const success = await setAllDevicesState(roomId, false);
        addLog(success ? 'Tắt tất cả thiết bị' : 'Lỗi tắt tất cả thiết bị', undefined, getRoomName(roomId));
        return success;
    }, [addLog, getRoomName, setAllDevicesState]);

    const applyScene = useCallback(async (scene: 'morning' | 'work' | 'weekend' | 'sleep') => {
        let success = false;

        try {
            if (isConfigured && isServerControlled) {
                await client.applyScene(scene);
                await refresh();
                success = true;
            } else if (scene === 'sleep') {
                updateLocalHouse(house => {
                    return Object.keys(house).reduce((acc, currentRoomId) => {
                        acc[currentRoomId] = house[currentRoomId].map(device => {
                            if (device.type === 'light' || device.type === 'fan') {
                                return { ...device, isOn: false };
                            }
                            return device;
                        });
                        return acc;
                    }, {} as HouseDevices);
                });
                success = true;
            } else {
                const sceneMap: Record<'morning' | 'work' | 'weekend', boolean> = {
                    morning: true,
                    work: false,
                    weekend: true,
                };
                success = await setAllDevicesState(null, sceneMap[scene]);
            }
        } catch (error) {
            console.error('Error applying scene:', error);
            setServerError(error instanceof Error ? error.message : 'Không thể kích hoạt cảnh');
        }

        const sceneNames: Record<'morning' | 'work' | 'weekend' | 'sleep', string> = {
            morning: 'Buổi sáng',
            work: 'Đi làm',
            weekend: 'Cuối tuần',
            sleep: 'Chế độ ngủ',
        };
        addLog(`${success ? 'Kích hoạt cảnh' : 'Lỗi kích hoạt cảnh'}: ${sceneNames[scene]}`);
        return success;
    }, [addLog, client, isConfigured, isServerControlled, refresh, setAllDevicesState, updateLocalHouse]);

    const getTotalPower = useCallback(() => {
        return Object.values(devices).reduce((total, roomDevices) => {
            return total + roomDevices.reduce((roomTotal, device) => roomTotal + (device.isOn ? device.power : 0), 0);
        }, 0);
    }, [devices]);

    const getActiveDeviceCount = useCallback(() => {
        return Object.values(devices).reduce((count, roomDevices) => {
            return count + roomDevices.filter(device => device.isOn).length;
        }, 0);
    }, [devices]);

    const getHouseDeviceCount = useCallback(() => {
        return Object.values(devices).reduce((count, roomDevices) => count + roomDevices.length, 0);
    }, [devices]);

    const getUserDevices = useCallback((roomId: string): Device[] => {
        return devices[roomId] || [];
    }, [devices]);

    const getRoomsForUser = useCallback((): ComputedRoom[] => {
        return rooms;
    }, [rooms]);

    return (
        <DataContext.Provider value={{
            rooms,
            devices,
            activityLogs,
            isServerControlled,
            serverError,
            isHomeSuspended: serverError === 'Nhà đang bị tạm khóa',
            canManageInventory,
            isManualInventory,
            refresh,
            addRoom,
            toggleDevice,
            addDevice,
            deleteDevice,
            turnAllOff,
            turnAllOn,
            turnAllOffRoom,
            getTotalPower,
            getActiveDeviceCount,
            getUserDevices,
            getRoomsForUser,
            getHouseDeviceCount,
            applyScene,
        }}>
            {children}
        </DataContext.Provider>
    );
};
