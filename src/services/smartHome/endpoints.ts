const DEFAULT_LAN_API_URL = 'http://172.16.50.27:5001';

export function resolveDefaultLocalApiUrl(platform: string, override?: string): string {
    const explicitUrl = override?.trim();
    if (explicitUrl) return explicitUrl;
    return platform === 'web' ? 'http://127.0.0.1:5001' : DEFAULT_LAN_API_URL;
}

export function normalizeSavedLocalApiUrl(platform: string, savedUrl: string | undefined, fallbackUrl: string): string {
    const normalized = savedUrl?.trim();
    if (!normalized) return fallbackUrl;
    if (platform === 'web' && normalized === DEFAULT_LAN_API_URL) return fallbackUrl;
    return normalized;
}
