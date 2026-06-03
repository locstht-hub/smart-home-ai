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
    mode?: 'mock' | 'plc-real' | 'auto' | string;
    effectiveMode?: 'mock' | 'plc-real' | string;
    plcError?: string | null;
    warnings?: string[];
    recorded?: boolean;
    readingId?: string | null;
}

export interface PowerReading {
    id: string;
    homeId: string;
    timestamp: string;
    voltage: number | null;
    current: number | null;
    power_kw: number | null;
    energy_kwh: number | null;
    source: string;
    metadata?: Record<string, unknown>;
    createdAt: string;
}

export interface PowerHistoryResponse {
    ok: boolean;
    homeId: string;
    readings: PowerReading[];
}

export interface SystemStatusResponse {
    ok: boolean;
    service: string;
    mode: 'mock' | 'plc-real' | 'auto' | string;
    effectiveMode?: 'mock' | 'plc-real' | string;
    powerSource: 'mock' | 'mock-fallback' | 'plc-s7-1200' | string;
    plcConfigured: boolean;
    plcHost?: string;
    plcRack?: number;
    plcSlot?: number;
    databasePath?: string;
    statePath?: string;
    serverTime: string;
    powerCollector?: {
        enabled: boolean;
        running: boolean;
        intervalSeconds: number;
        homeIds: string[];
        lastRunAt?: string | null;
        lastSuccessAt?: string | null;
        lastError?: string | null;
        lastReadingCount: number;
        totalReadings: number;
    };
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

export interface HomeMember {
    id: string;
    username: string;
    phone?: string | null;
    name: string;
    role: 'system_admin' | 'owner' | 'member' | 'viewer';
    status: 'active' | 'suspended';
    createdAt: string;
    lastActive?: string | null;
    roleInHome: 'owner' | 'member' | 'viewer';
    canManageMembers: boolean;
    canManageDevices: boolean;
    joinedAt: string;
}

export interface CreateMemberPayload {
    name: string;
    username: string;
    phone?: string;
    password: string;
    roleInHome: 'member' | 'viewer';
    canManageMembers?: boolean;
    canManageDevices?: boolean;
}

export interface HomeActivityLog {
    id: string;
    actorUserId?: string | null;
    actorUsername?: string | null;
    actorRole?: string | null;
    action: string;
    targetType?: string | null;
    targetId?: string | null;
    targetName?: string | null;
    homeId?: string | null;
    ipAddress?: string | null;
    userAgent?: string | null;
    metadata?: Record<string, unknown>;
    createdAt: string;
}

export interface HomeQuota {
    homeId: string;
    energyLimitKwh: number;
    currentMonthEnergyKwh: number;
    quotaSource?: string;
}
