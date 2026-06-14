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
    devices: number;
    active: number;
    power: number;
    source?: 'default' | 'manual';
}

type RoomDefinition = { id: string; name: string; source: 'default' | 'manual' };

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
    toggleDevice: (roomId: string, deviceId: string, targetUserId?: string) => Promise<{ success: boolean; error?: string }>;
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

const getRoomsForHouse = (house: HouseDevices, roomDefs: RoomDefinition[] = defaultRooms.map(room => ({ id: room.id, name: room.name, source: 'default' as const }))): ComputedRoom[] => {
    return roomDefs.map(baseRoom => {
        const roomDevices = house[baseRoom.id] || [];
        const activeDevices = roomDevices.filter(device => device.isOn);
        return {
            id: baseRoom.id,
            name: baseRoom.name,
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
            userName: user?.name || 'Há»‡ thá»‘ng',
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
                    const nextRoomDefs = manualRooms.map(room => ({
                        id: room.id,
                        name: room.name,
                        source: 'manual' as const,
                    }));
                    const roomIds = new Set(nextRoomDefs.map(room => room.id));
                    manualDevices.forEach(device => {
                        const roomId = device.roomId || 'unassigned';
                        if (!roomIds.has(roomId)) {
                            nextRoomDefs.push({ id: roomId, name: roomId === 'unassigned' ? 'ChÆ°a phÃ¢n phÃ²ng' : 'PhÃ²ng khÃ¡c', source: 'manual' });
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
            setServerError(error instanceof Error ? error.message : 'KhÃ´ng thá»ƒ táº£i dá»¯ liá»‡u server');
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
        if (!cleanName) return { success: false, error: 'Vui lÃ²ng nháº­p tÃªn phÃ²ng' };

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
            addLog('ThÃªm phÃ²ng má»›i', undefined, cleanName);
            return { success: true };
        } catch (error) {
            const message = error instanceof Error ? error.message : 'KhÃ´ng thá»ƒ thÃªm phÃ²ng';
            setServerError(message);
            return { success: false, error: message };
        }
    }, [addLog, client, isConfigured, refresh, rooms.length, updateLocalHouse, user?.homeId]);

    const toggleDevice = useCallback(async (roomId: string, deviceId: string): Promise<{ success: boolean; error?: string }> => {
        const currentDevice = (devices[roomId] || []).find(device => device.id === deviceId);
        if (!currentDevice) return { success: false, error: 'KhÃ´ng tÃ¬m tháº¥y thiáº¿t bá»‹' };

        if (currentDevice.source === 'manual') {
            return { success: false, error: 'Thiáº¿t bá»‹ nÃ y Ä‘ang lÃ  khai bÃ¡o thá»§ cÃ´ng, chÆ°a gáº¯n lá»‡nh Ä‘iá»u khiá»ƒn PLC.' };
        }

        const nextState = !currentDevice.isOn;

        try {
            if (isConfigured && isServerControlled) {
                await client.setDeviceState(currentDevice.id, nextState);
                await refresh();
            } else {
                updateLocalHouse(house => ({
                    ...house,
                    [roomId]: house[roomId].map(device =>
                        device.id === deviceId ? { ...device, isOn: nextState } : device,
                    ),
                }));
            }

            addLog(currentDevice.isOn ? 'Táº¯t thiáº¿t bá»‹' : 'Báº­t thiáº¿t bá»‹', currentDevice.name, getRoomName(roomId));
            return { success: true };
        } catch (error) {
            console.error('Error toggling device:', error);
            const message = error instanceof Error ? error.message : 'KhÃ´ng thá»ƒ Ä‘iá»u khiá»ƒn thiáº¿t bá»‹';
            setServerError(message);
            addLog('Lá»—i Ä‘iá»u khiá»ƒn thiáº¿t bá»‹', currentDevice.name, getRoomName(roomId));
            return { success: false, error: message };
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
                addLog('ThÃªm thiáº¿t bá»‹ thá»§ cÃ´ng', device.name, getRoomName(roomId));
                return { success: true };
            } catch (error) {
                const message = error instanceof Error ? error.message : 'KhÃ´ng thá»ƒ thÃªm thiáº¿t bá»‹';
                setServerError(message);
                return { success: false, error: message };
            }
        }

        if (isServerControlled) {
            addLog('YÃªu cáº§u thÃªm thiáº¿t bá»‹ trÃªn server', device.name, getRoomName(roomId));
            return { success: false, error: 'Thiet bi server can duoc them qua inventory thu cong.' };
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

        addLog('ThÃªm thiáº¿t bá»‹ má»›i', newDevice.name, getRoomName(roomId));
        return { success: true };
    }, [addLog, client, getRoomName, isConfigured, isManualInventory, isServerControlled, refresh, updateLocalHouse, user?.homeId]);

    const deleteDevice = useCallback(async (roomId: string, deviceId: string): Promise<{ success: boolean; error?: string }> => {
        const currentDevice = (devices[roomId] || []).find(device => device.id === deviceId);
        if (!currentDevice) return { success: false, error: 'Khong tim thay thiet bi' };

        if (isConfigured && user?.homeId && currentDevice.source === 'manual') {
            try {
                await client.deleteManualDevice(user.homeId, currentDevice.id);
                await refresh();
                addLog('Xoa thiet bi thu cong', currentDevice.name, getRoomName(roomId));
                return { success: true };
            } catch (error) {
                const message = error instanceof Error ? error.message : 'Khong the xoa thiet bi';
                setServerError(message);
                return { success: false, error: message };
            }
        }

        if (isServerControlled && currentDevice.source === 'server') {
            addLog('YÃªu cáº§u xÃ³a thiáº¿t bá»‹ trÃªn server', currentDevice.name, getRoomName(roomId));
            return { success: false, error: 'Thiet bi PLC phai duoc quan ly tren server/PLC.' };
        }

        updateLocalHouse(house => ({
            ...house,
            [roomId]: house[roomId].filter(device => device.id !== deviceId),
        }));

        addLog('XÃ³a thiáº¿t bá»‹', currentDevice.name, getRoomName(roomId));
        return { success: true };
    }, [addLog, client, devices, getRoomName, isConfigured, isServerControlled, refresh, updateLocalHouse, user?.homeId]);

    const setAllDevicesState = useCallback(async (roomId: string | null, nextState: boolean): Promise<boolean> => {
        const targetDevices = roomId ? devices[roomId] || [] : Object.values(devices).flat();

        try {
            if (isManualInventory) {
                return false;
            }
            if (isConfigured && isServerControlled) {
                await Promise.all(targetDevices.map(device => client.setDeviceState(device.id, nextState)));
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
            setServerError(error instanceof Error ? error.message : 'KhÃ´ng thá»ƒ Ä‘iá»u khiá»ƒn thiáº¿t bá»‹');
            return false;
        }
    }, [client, devices, isConfigured, isManualInventory, isServerControlled, refresh, updateLocalHouse]);

    const turnAllOff = useCallback(async () => {
        const success = await setAllDevicesState(null, false);
        addLog(success ? 'Táº¯t táº¥t cáº£ thiáº¿t bá»‹' : 'Lá»—i táº¯t táº¥t cáº£ thiáº¿t bá»‹');
        return success;
    }, [addLog, setAllDevicesState]);

    const turnAllOn = useCallback(async (roomId: string) => {
        const success = await setAllDevicesState(roomId, true);
        addLog(success ? 'Báº­t táº¥t cáº£ thiáº¿t bá»‹' : 'Lá»—i báº­t táº¥t cáº£ thiáº¿t bá»‹', undefined, getRoomName(roomId));
        return success;
    }, [addLog, getRoomName, setAllDevicesState]);

    const turnAllOffRoom = useCallback(async (roomId: string) => {
        const success = await setAllDevicesState(roomId, false);
        addLog(success ? 'Táº¯t táº¥t cáº£ thiáº¿t bá»‹' : 'Lá»—i táº¯t táº¥t cáº£ thiáº¿t bá»‹', undefined, getRoomName(roomId));
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
            setServerError(error instanceof Error ? error.message : 'KhÃ´ng thá»ƒ kÃ­ch hoáº¡t cáº£nh');
        }

        const sceneNames: Record<'morning' | 'work' | 'weekend' | 'sleep', string> = {
            morning: 'Buá»•i sÃ¡ng',
            work: 'Äi lÃ m',
            weekend: 'Cuá»‘i tuáº§n',
            sleep: 'Cháº¿ Ä‘á»™ ngá»§',
        };
        addLog(`${success ? 'KÃ­ch hoáº¡t cáº£nh' : 'Lá»—i kÃ­ch hoáº¡t cáº£nh'}: ${sceneNames[scene]}`);
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
            isHomeSuspended: serverError === 'NhÃ  Ä‘ang bá»‹ táº¡m khÃ³a' || serverError === 'Nha dang bi tam khoa',
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
