type StoredUserLike = {
    serverRole?: string;
    serverToken?: string;
} | null | undefined;

export function shouldRestoreStoredUser(
    user: StoredUserLike,
    sessionToken: string,
    platform: string,
): boolean {
    if (!user?.serverRole && !user?.serverToken) return true;
    if (platform === 'web') return Boolean(sessionToken.trim());
    return Boolean(sessionToken.trim() || user.serverToken?.trim());
}
