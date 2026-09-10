export interface Room {
    id: string;
    name: string;
    devices: number;
    active: number;
    power: number;
    temp: number;
    humidity: number;
}

export interface Device {
    id: string;
    name: string;
    type: 'light' | 'fan' | 'ac' | 'outlet';
    isOn: boolean;
    power: number;
    ownerId?: string; // user-specific device
    entityId?: string;
    domain?: string;
    roomId?: string;
    source?: 'server' | 'local' | 'manual';
    available?: boolean;
}

export interface User {
    id: string;
    name: string;
    phone: string;
    password: string;
    role: 'admin' | 'user';
    status: 'pending' | 'approved' | 'rejected';
    createdAt: string;
    lastActive?: string;
    username?: string;
    serverRole?: 'system_admin' | 'owner' | 'member' | 'viewer';
    serverToken?: string;
    homeId?: string;
    homeName?: string;
    homeStatus?: 'active' | 'suspended';
    canManageMembers?: boolean;
    canManageDevices?: boolean;
}

export interface ActivityLog {
    id: string;
    userId: string;
    userName: string;
    houseOwnerName?: string;
    action: string;
    device?: string;
    room?: string;
    timestamp: string;
}

export const defaultRooms: Room[] = [
    { id: 'bedroom', name: 'Phòng ngủ', devices: 2, active: 0, power: 800, temp: 24, humidity: 55 },
    { id: 'living', name: 'Phòng khách', devices: 2, active: 1, power: 800, temp: 26, humidity: 60 },
    { id: 'kitchen', name: 'Phòng bếp', devices: 1, active: 0, power: 200, temp: 28, humidity: 70 },
    { id: 'bathroom', name: 'Nhà vệ sinh', devices: 1, active: 0, power: 200, temp: 27, humidity: 80 },
];

export const defaultDevices: Record<string, Device[]> = {
    bedroom: [
        { id: 'bedroom_lamp1', name: 'Đèn phòng ngủ', type: 'light', isOn: false, power: 200 },
        { id: 'bedroom_ac2', name: 'Máy lạnh phòng ngủ', type: 'ac', isOn: false, power: 600 },
    ],
    living: [
        { id: 'living_lamp2', name: 'Đèn phòng khách', type: 'light', isOn: true, power: 200 },
        { id: 'living_ac1', name: 'Máy lạnh phòng khách', type: 'ac', isOn: false, power: 600 },
    ],
    kitchen: [
        { id: 'kitchen_lamp3', name: 'Đèn phòng bếp', type: 'light', isOn: false, power: 200 },
    ],
    bathroom: [
        { id: 'bathroom_lamp4', name: 'Đèn nhà vệ sinh', type: 'light', isOn: false, power: 200 },
    ],
};

export const buildEmptyHouseDevices = (): Record<string, Device[]> => ({
    bedroom: [],
    living: [],
    kitchen: [],
    bathroom: [],
});

export const defaultAdmin: User = {
    id: 'admin-001',
    name: 'Admin',
    phone: '0123456789',
    password: process.env.EXPO_PUBLIC_DEMO_ADMIN_PASSWORD || '',
    role: 'admin',
    status: 'approved',
    createdAt: new Date().toISOString(),
};

export const defaultApprovedUser: User = {
    id: 'user-demo-001',
    name: 'Người dùng mẫu',
    phone: '0987654321',
    password: process.env.EXPO_PUBLIC_DEMO_USER_PASSWORD || '',
    role: 'user',
    status: 'approved',
    createdAt: new Date().toISOString(),
};
