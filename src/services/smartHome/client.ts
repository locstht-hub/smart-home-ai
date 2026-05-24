import AsyncStorage from '@react-native-async-storage/async-storage';
import { Device } from '../../constants/data';
import { LoginResponse, PowerCurrentResponse, SmartHomeServerConfig, SystemStatusResponse } from '../../types/smartHomeServer';

interface DevicesResponse {
    devices: Record<string, Device[]>;
}

interface ChatResponse {
    reply?: string;
    text?: string;
    message?: string;
}

export interface ChatResult {
    reply: string;
    elapsedMs: number;
    endpoint: 'local' | 'cloud';
    baseUrl: string;
}

interface RequestResult<T> {
    data: T;
    baseUrl: string;
}

const DEFAULT_TIMEOUT = 8000;
const DEFAULT_LOCAL_TIMEOUT = 800;
const CLOUD_API_URL = 'https://api.smarthomeai.id.vn';
const DEFAULT_LOCAL_API_URL = 'http://172.16.50.47:5001';
const USER_KEY = 'currentUser';
const SERVER_CONFIG_KEY = 'smartHomeServerConfig';

export class SmartHomeApiClient {
    private readonly config: SmartHomeServerConfig;

    constructor(config: SmartHomeServerConfig) {
        this.config = config;
    }

    isReady(): boolean {
        return Boolean(this.config.apiBaseUrl.trim() || this.config.localApiBaseUrl?.trim());
    }

    async health(): Promise<{ ok: boolean; service?: string }> {
        return this.request('/health');
    }

    async checkAuth(): Promise<{ ok: boolean; service?: string; auth?: string }> {
        return this.request('/api/auth/check');
    }

    async getSystemStatus(): Promise<SystemStatusResponse> {
        return this.request('/api/system/status');
    }

    async login(username: string, password: string): Promise<LoginResponse> {
        return this.request('/api/auth/login', {
            method: 'POST',
            body: JSON.stringify({ username, password }),
        });
    }

    async getPowerCurrent(): Promise<PowerCurrentResponse> {
        return this.request(this.withHomeId('/api/power/current'));
    }

    async getDevices(): Promise<Record<string, Device[]>> {
        const response = await this.request<DevicesResponse>(this.withHomeId('/api/devices'));
        return response.devices;
    }

    async setDeviceState(deviceId: string, isOn: boolean): Promise<void> {
        await this.request(this.withHomeId(`/api/devices/${encodeURIComponent(deviceId)}/${isOn ? 'turn-on' : 'turn-off'}`), {
            method: 'POST',
            body: JSON.stringify(this.config.homeId ? { homeId: this.config.homeId } : {}),
        });
    }

    async applyScene(scene: string): Promise<void> {
        await this.request(this.withHomeId(`/api/scenes/${encodeURIComponent(scene)}`), {
            method: 'POST',
            body: JSON.stringify(this.config.homeId ? { homeId: this.config.homeId } : {}),
        });
    }

    async chat(text: string): Promise<string> {
        const result = await this.chatWithTiming(text);
        return result.reply;
    }

    async chatWithTiming(text: string): Promise<ChatResult> {
        const startedAt = Date.now();
        const result = await this.requestWithEndpoint<ChatResponse>('/api/assistant/chat', {
            method: 'POST',
            body: JSON.stringify({ text, ...(this.config.homeId ? { homeId: this.config.homeId } : {}) }),
        }, { preferCloudFirst: this.config.preferLocalApi !== true });
        const response = result.data;
        return {
            reply: response.reply || response.text || response.message || 'Server đã nhận lệnh của bạn.',
            elapsedMs: Date.now() - startedAt,
            endpoint: this.isLocalBaseUrl(result.baseUrl) ? 'local' : 'cloud',
            baseUrl: result.baseUrl,
        };
    }

    async warmUpChatConnection(): Promise<void> {
        await this.request('/health', {}, { preferCloudFirst: this.config.preferLocalApi !== true, singleBaseUrl: true });
    }

    private withHomeId(path: string): string {
        if (!this.config.homeId?.trim()) return path;
        const separator = path.includes('?') ? '&' : '?';
        return `${path}${separator}homeId=${encodeURIComponent(this.config.homeId.trim())}`;
    }

    private async request<T>(
        path: string,
        init: RequestInit = {},
        options: { preferCloudFirst?: boolean; singleBaseUrl?: boolean } = {},
    ): Promise<T> {
        const result = await this.requestWithEndpoint<T>(path, init, options);
        return result.data;
    }

    private async requestWithEndpoint<T>(
        path: string,
        init: RequestInit = {},
        options: { preferCloudFirst?: boolean; singleBaseUrl?: boolean } = {},
    ): Promise<RequestResult<T>> {
        const savedConfig = await this.readSavedServerConfig();
        const baseUrls = this.resolveBaseUrls(savedConfig, options);

        if (!baseUrls.length) {
            throw new Error('Server API chưa được cấu hình.');
        }

        let lastError: unknown = null;
        for (const [index, baseUrl] of baseUrls.entries()) {
            try {
                const data = await this.requestFromBaseUrl<T>(
                    baseUrl,
                    path,
                    init,
                    savedConfig,
                    this.getTimeoutForBaseUrl(baseUrl, index),
                );
                return { data, baseUrl };
            } catch (error) {
                lastError = error;
                if (!this.canRetryWithNextBaseUrl(error)) {
                    throw error;
                }
            }
        }

        throw lastError instanceof Error ? lastError : new Error('Không thể kết nối Server API.');
    }

    private async requestFromBaseUrl<T>(
        baseUrl: string,
        path: string,
        init: RequestInit,
        savedConfig: SmartHomeServerConfig | null,
        timeout: number,
    ): Promise<T> {
        const controller = new AbortController();
        const timer = setTimeout(() => controller.abort(), timeout);

        try {
            const headers: Record<string, string> = {
                'Content-Type': 'application/json',
                ...((init.headers as Record<string, string>) || {}),
            };
            const savedUser = await this.readSavedUser();
            const token = this.config.apiToken?.trim() || savedConfig?.apiToken?.trim() || savedUser?.serverToken?.trim();
            const homeId = this.config.homeId?.trim() || savedConfig?.homeId?.trim() || savedUser?.homeId?.trim();
            const effectivePath = this.appendHomeIdForDemo(path, homeId);

            if (token) {
                headers.Authorization = `Bearer ${token}`;
                headers['X-API-Token'] = token;
            }

            const response = await fetch(`${baseUrl}${effectivePath}`, {
                ...init,
                headers,
                signal: controller.signal,
            });

            if (!response.ok) {
                const body = await response.text();
                let parsedError = '';
                try {
                    parsedError = JSON.parse(body)?.error || '';
                } catch {
                    parsedError = body;
                }
                if (response.status === 401) {
                    throw new Error('Phiên đăng nhập hoặc API token không hợp lệ.');
                }
                if (response.status === 403 && parsedError === 'Home is suspended') {
                    throw new Error('Nhà đang bị tạm khóa');
                }
                throw new Error(parsedError || `Server API tra ve ma ${response.status}`);
            }

            return response.json() as Promise<T>;
        } finally {
            clearTimeout(timer);
        }
    }

    private resolveBaseUrls(
        savedConfig: SmartHomeServerConfig | null,
        options: { preferCloudFirst?: boolean; singleBaseUrl?: boolean } = {},
    ): string[] {
        const cloudUrl = this.config.apiBaseUrl?.trim() || savedConfig?.apiBaseUrl?.trim() || CLOUD_API_URL;
        const localUrl = this.config.localApiBaseUrl?.trim() || savedConfig?.localApiBaseUrl?.trim() || DEFAULT_LOCAL_API_URL;
        const preferLocal = options.preferCloudFirst ? false : this.config.preferLocalApi ?? savedConfig?.preferLocalApi ?? true;
        const ordered = preferLocal ? [localUrl, cloudUrl] : [cloudUrl, localUrl];

        const baseUrls = ordered
            .map((url) => url.trim().replace(/\/+$/, ''))
            .filter(Boolean)
            .filter((url, index, list) => list.indexOf(url) === index);
        return options.singleBaseUrl ? baseUrls.slice(0, 1) : baseUrls;
    }

    private getTimeoutForBaseUrl(baseUrl: string, index: number): number {
        const configuredTimeout = this.config.timeout || DEFAULT_TIMEOUT;
        if (index === 0 && this.isLocalBaseUrl(baseUrl)) {
            return Math.min(configuredTimeout, DEFAULT_LOCAL_TIMEOUT);
        }
        return configuredTimeout;
    }

    private isLocalBaseUrl(baseUrl: string): boolean {
        return /^http:\/\/(10\.|172\.|192\.168\.|127\.0\.0\.1|localhost)/i.test(baseUrl);
    }

    private canRetryWithNextBaseUrl(error: unknown): boolean {
        if (!(error instanceof Error)) return true;
        return error.name === 'AbortError'
            || /network request failed/i.test(error.message)
            || /khong the ket noi|không thể kết nối/i.test(error.message);
    }

    private async readSavedServerConfig(): Promise<SmartHomeServerConfig | null> {
        try {
            const saved = await AsyncStorage.getItem(SERVER_CONFIG_KEY);
            return saved ? JSON.parse(saved) : null;
        } catch {
            return null;
        }
    }

    private appendHomeIdForDemo(path: string, homeId?: string): string {
        if (!homeId || path.includes('homeId=')) return path;
        const needsHomeId = path.startsWith('/api/devices') || path.startsWith('/api/power/current');
        if (!needsHomeId) return path;
        const separator = path.includes('?') ? '&' : '?';
        return `${path}${separator}homeId=${encodeURIComponent(homeId)}`;
    }

    private async readSavedUser(): Promise<{ serverToken?: string; homeId?: string } | null> {
        try {
            const saved = await AsyncStorage.getItem(USER_KEY);
            return saved ? JSON.parse(saved) : null;
        } catch {
            return null;
        }
    }
}
