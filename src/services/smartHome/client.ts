import { Device } from '../../constants/data';
import { SmartHomeServerConfig, PowerCurrentResponse } from '../../types/smartHomeServer';

interface DevicesResponse {
    devices: Record<string, Device[]>;
}

interface ChatResponse {
    reply?: string;
    text?: string;
    message?: string;
}

const DEFAULT_TIMEOUT = 8000;

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

    async getPowerCurrent(): Promise<PowerCurrentResponse> {
        return this.request('/api/power/current');
    }

    async getDevices(): Promise<Record<string, Device[]>> {
        const response = await this.request<DevicesResponse>('/api/devices');
        return response.devices;
    }

    async setDeviceState(deviceId: string, isOn: boolean): Promise<void> {
        await this.request(`/api/devices/${encodeURIComponent(deviceId)}/${isOn ? 'turn-on' : 'turn-off'}`, {
            method: 'POST',
        });
    }

    async applyScene(scene: string): Promise<void> {
        await this.request(`/api/scenes/${encodeURIComponent(scene)}`, {
            method: 'POST',
        });
    }

    async chat(text: string): Promise<string> {
        const response = await this.request<ChatResponse>('/api/assistant/chat', {
            method: 'POST',
            body: JSON.stringify({ text }),
        });
        return response.reply || response.text || response.message || 'Server đã nhận lệnh của bạn.';
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

            if (this.config.apiToken?.trim()) {
                headers.Authorization = `Bearer ${this.config.apiToken.trim()}`;
                headers['X-API-Token'] = this.config.apiToken.trim();
            }

            const response = await fetch(`${baseUrl}${path}`, {
                ...init,
                headers,
                signal: controller.signal,
            });

            if (!response.ok) {
                const body = await response.text();
                if (response.status === 401) {
                    throw new Error('API token không đúng hoặc chưa được nhập.');
                }
                throw new Error(body || `Server API trả về mã ${response.status}`);
            }

            return response.json() as Promise<T>;
        } finally {
            clearTimeout(timer);
        }
    }
}
