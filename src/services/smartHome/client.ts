import { Device } from '../../constants/data';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { LoginResponse, PowerCurrentResponse, SmartHomeServerConfig } from '../../types/smartHomeServer';

interface DevicesResponse {
    devices: Record<string, Device[]>;
}

interface ChatResponse {
    reply?: string;
    text?: string;
    message?: string;
}

const DEFAULT_TIMEOUT = 8000;
const USER_KEY = 'currentUser';
const SERVER_CONFIG_KEY = 'smartHomeServerConfig';

export class SmartHomeApiClient {
    private readonly config: SmartHomeServerConfig;

    constructor(config: SmartHomeServerConfig) {
        this.config = config;
    }

    isReady(): boolean {
        return Boolean(this.config.apiBaseUrl.trim());
    }

    async health(): Promise<{ ok: boolean; service?: string }> {
        return this.request('/health');
    }

    async checkAuth(): Promise<{ ok: boolean; service?: string; auth?: string }> {
        return this.request('/api/auth/check');
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
        const response = await this.request<ChatResponse>('/api/assistant/chat', {
            method: 'POST',
            body: JSON.stringify({ text, ...(this.config.homeId ? { homeId: this.config.homeId } : {}) }),
        });
        return response.reply || response.text || response.message || 'Server đã nhận lệnh của bạn.';
    }

    private withHomeId(path: string): string {
        if (!this.config.homeId?.trim()) return path;
        const separator = path.includes('?') ? '&' : '?';
        return `${path}${separator}homeId=${encodeURIComponent(this.config.homeId.trim())}`;
    }

    private async request<T>(path: string, init: RequestInit = {}): Promise<T> {
        const baseUrl = this.config.apiBaseUrl.trim().replace(/\/+$/, '');
        if (!baseUrl) {
            throw new Error('Server API chưa được cấu hình');
        }

        const controller = new AbortController();
        const timer = setTimeout(() => controller.abort(), this.config.timeout || DEFAULT_TIMEOUT);

        try {
            const headers: Record<string, string> = {
                'Content-Type': 'application/json',
                ...((init.headers as Record<string, string>) || {}),
            };
            const savedConfig = await this.readSavedServerConfig();
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
                throw new Error(parsedError || `Server API trả về mã ${response.status}`);
            }

            return response.json() as Promise<T>;
        } finally {
            clearTimeout(timer);
        }
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
