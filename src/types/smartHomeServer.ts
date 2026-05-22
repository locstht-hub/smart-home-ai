export interface SmartHomeServerConfig {
    apiBaseUrl: string;
    localApiBaseUrl?: string;
    preferLocalApi?: boolean;
    apiToken?: string;
    homeId?: string;
    forecastApiUrl?: string;
    forecastModel?: 'xgboost' | 'lstm';
    timeout?: number;
}

export type SmartHomeServerStatus = 'idle' | 'connecting' | 'connected' | 'error';

export interface PowerCurrentResponse {
    voltage: number | null;
    current: number | null;
    power_kw: number | null;
    energy_kwh: number | null;
    timestamp: string;
    source?: string;
}

export interface SystemStatusResponse {
    ok: boolean;
    service: string;
    mode: 'mock' | 'plc-real' | string;
    powerSource: 'mock' | 'plc-s7-1200' | string;
    plcConfigured: boolean;
    plcHost?: string;
    plcRack?: number;
    plcSlot?: number;
    databasePath?: string;
    statePath?: string;
    serverTime: string;
}

export interface ServerHome {
    id: string;
    name: string;
    ownerId: string;
    status: 'active' | 'suspended';
    createdAt: string;
    roleInHome: 'owner' | 'member' | 'viewer';
    canManageMembers: boolean;
    canManageDevices: boolean;
}

export interface ServerUser {
    id: string;
    username: string;
    phone?: string | null;
    name: string;
    role: 'system_admin' | 'owner' | 'member' | 'viewer';
    status: 'active' | 'suspended';
    createdAt: string;
    lastActive?: string | null;
}

export interface LoginResponse {
    ok: boolean;
    token: string;
    user: ServerUser;
    homes: ServerHome[];
    expiresAt: string;
}
