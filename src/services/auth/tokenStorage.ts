import { Platform } from 'react-native';
import * as SecureStore from 'expo-secure-store';


const TOKEN_KEY = 'smart-home-session-token';

export async function getSessionToken(): Promise<string> {
    if (Platform.OS === 'web') {
        return typeof window !== 'undefined' ? window.sessionStorage.getItem(TOKEN_KEY) || '' : '';
    }
    return (await SecureStore.getItemAsync(TOKEN_KEY)) || '';
}

export async function setSessionToken(token: string): Promise<void> {
    if (Platform.OS === 'web') {
        if (typeof window !== 'undefined') {
            if (token) window.sessionStorage.setItem(TOKEN_KEY, token);
            else window.sessionStorage.removeItem(TOKEN_KEY);
        }
        return;
    }
    if (token) {
        await SecureStore.setItemAsync(TOKEN_KEY, token, {
            keychainAccessible: SecureStore.WHEN_UNLOCKED_THIS_DEVICE_ONLY,
        });
    } else {
        await SecureStore.deleteItemAsync(TOKEN_KEY);
    }
}
