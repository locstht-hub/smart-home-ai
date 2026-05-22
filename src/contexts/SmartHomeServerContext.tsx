import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { SmartHomeApiClient } from '../services/smartHome/client';
import { SmartHomeServerConfig, SmartHomeServerStatus, SystemStatusResponse } from '../types/smartHomeServer';

interface SmartHomeServerContextType {
    config: SmartHomeServerConfig;
    status: SmartHomeServerStatus;
    error: string | null;
    systemStatus: SystemStatusResponse | null;
    isConfigured: boolean;
    client: SmartHomeApiClient;
    saveConfig: (nextConfig: SmartHomeServerConfig) => Promise<void>;
    testConnection: (overrideConfig?: SmartHomeServerConfig) => Promise<{ success: boolean; message: string }>;
    refreshSystemStatus: () => Promise<void>;
}

const SmartHomeServerContext = createContext<SmartHomeServerContextType>({} as SmartHomeServerContextType);

const STORAGE_KEY = 'smartHomeServerConfig';
export const CLOUD_API_URL = 'https://api.smarthomeai.id.vn';
export const DEFAULT_LOCAL_API_URL = 'http://172.16.5.180:5001';

const defaultConfig: SmartHomeServerConfig = {
    apiBaseUrl: CLOUD_API_URL,
    localApiBaseUrl: DEFAULT_LOCAL_API_URL,
    preferLocalApi: true,
    apiToken: '',
    forecastApiUrl: '',
    forecastModel: 'xgboost',
    timeout: 8000,
};

const normalizeConfig = (nextConfig: SmartHomeServerConfig): SmartHomeServerConfig => ({
    apiBaseUrl: nextConfig.apiBaseUrl?.trim() || CLOUD_API_URL,
    localApiBaseUrl: nextConfig.localApiBaseUrl?.trim() || DEFAULT_LOCAL_API_URL,
    preferLocalApi: nextConfig.preferLocalApi !== false,
    apiToken: nextConfig.apiToken?.trim() || '',
    homeId: nextConfig.homeId?.trim() || '',
    forecastApiUrl: nextConfig.forecastApiUrl?.trim() || '',
    forecastModel: nextConfig.forecastModel || 'xgboost',
    timeout: nextConfig.timeout || 8000,
});

export const useSmartHomeServer = () => useContext(SmartHomeServerContext);

export const SmartHomeServerProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [config, setConfig] = useState<SmartHomeServerConfig>(defaultConfig);
    const [status, setStatus] = useState<SmartHomeServerStatus>('idle');
    const [error, setError] = useState<string | null>(null);
    const [systemStatus, setSystemStatus] = useState<SystemStatusResponse | null>(null);

    useEffect(() => {
        const loadConfig = async () => {
            try {
                const saved = await AsyncStorage.getItem(STORAGE_KEY);
                if (saved) {
                    setConfig(normalizeConfig(JSON.parse(saved)));
                }
            } catch (storageError) {
                console.error('Error loading Smart Home server config', storageError);
            }
        };

        loadConfig();
    }, []);

    const client = useMemo(() => new SmartHomeApiClient(config), [config]);
    const isConfigured = Boolean(config.apiBaseUrl.trim() || config.localApiBaseUrl?.trim());

    const testConnection = useCallback(async (overrideConfig?: SmartHomeServerConfig) => {
        const effectiveConfig = normalizeConfig(overrideConfig || config);
        const effectiveClient = new SmartHomeApiClient(effectiveConfig);

        if (!effectiveConfig.apiBaseUrl.trim() && !effectiveConfig.localApiBaseUrl?.trim()) {
            const message = 'Chưa cấu hình Server API';
            setStatus('error');
            setError(message);
            setSystemStatus(null);
            return { success: false, message };
        }

        setStatus('connecting');
        setError(null);
        try {
            await effectiveClient.checkAuth();
            const nextSystemStatus = await effectiveClient.getSystemStatus();
            setSystemStatus(nextSystemStatus);
            setStatus('connected');
            return { success: true, message: 'Kết nối Server API thành công' };
        } catch (connectionError) {
            const message = connectionError instanceof Error ? connectionError.message : 'Không thể kết nối Server API';
            setStatus('error');
            setError(message);
            setSystemStatus(null);
            return { success: false, message };
        }
    }, [config]);

    const refreshSystemStatus = useCallback(async () => {
        if (!isConfigured) {
            setSystemStatus(null);
            return;
        }

        try {
            const nextSystemStatus = await client.getSystemStatus();
            setSystemStatus(nextSystemStatus);
            setStatus('connected');
            setError(null);
        } catch (connectionError) {
            const message = connectionError instanceof Error ? connectionError.message : 'Không thể đọc trạng thái hệ thống';
            setStatus('error');
            setError(message);
            setSystemStatus(null);
        }
    }, [client, isConfigured]);

    useEffect(() => {
        if (!isConfigured) return;
        refreshSystemStatus().catch(() => undefined);
    }, [isConfigured, refreshSystemStatus]);

    const saveConfig = useCallback(async (nextConfig: SmartHomeServerConfig) => {
        const normalized = normalizeConfig(nextConfig);
        setConfig(normalized);
        await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(normalized));
    }, []);

    return (
        <SmartHomeServerContext.Provider value={{
            config,
            status,
            error,
            systemStatus,
            isConfigured,
            client,
            saveConfig,
            testConnection,
            refreshSystemStatus,
        }}>
            {children}
        </SmartHomeServerContext.Provider>
    );
};
