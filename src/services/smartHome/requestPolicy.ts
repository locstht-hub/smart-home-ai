export function resolveRequestTimeout(path: string, method = 'GET', configuredTimeout = 8_000): number {
    const safeConfigured = Number.isFinite(configuredTimeout) && configuredTimeout > 0
        ? configuredTimeout
        : 8_000;
    const normalizedMethod = method.toUpperCase();

    if (path === '/health' || path === '/api/auth/check') {
        return Math.min(safeConfigured, 2_000);
    }
    if (path.startsWith('/api/assistant/chat')) {
        return Math.max(safeConfigured, 25_000);
    }
    if (normalizedMethod !== 'GET' && normalizedMethod !== 'HEAD') {
        return Math.max(safeConfigured, 12_000);
    }
    return Math.max(safeConfigured, 8_000);
}
