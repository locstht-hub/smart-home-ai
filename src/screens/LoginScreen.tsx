import React, { useRef, useState } from 'react';
import { ActivityIndicator, Image, KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../contexts/AuthContext';
import { Colors } from '../constants/colors';
import { AppTheme } from '../constants/theme';
import AmbientTechBackground from '../components/AmbientTechBackground';

const APP_LOGO = require('../../assets/icon.png');
const ALLOW_LOCAL_DEMO_AUTH = __DEV__ && process.env.EXPO_PUBLIC_ALLOW_LOCAL_DEMO_AUTH === 'true';

export default function LoginScreen({ navigation }: any) {
    const passwordInputRef = useRef<TextInput>(null);
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const [focusedField, setFocusedField] = useState<'username' | 'password' | null>(null);
    const [error, setError] = useState('');
    const { login } = useAuth();

    const handleLogin = async () => {
        if (!username.trim() || !password.trim()) {
            setError('Vui lòng nhập tên đăng nhập hoặc số điện thoại và mật khẩu.');
            return;
        }

        setError('');
        setLoading(true);
        const result = await login(username.trim(), password);
        setLoading(false);

        if (!result.success) {
            setError(result.message || 'Không thể đăng nhập. Vui lòng kiểm tra lại thông tin.');
        }
    };

    return (
        <KeyboardAvoidingView
            style={styles.container}
            behavior={Platform.OS === 'ios' ? 'padding' : undefined}
            keyboardVerticalOffset={0}
        >
            <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled" keyboardDismissMode="on-drag">
                <LinearGradient colors={['#10251f', '#173a31', '#0f172a']} style={styles.header}>
                    <AmbientTechBackground variant="auth" />
                    <View style={styles.logoContainer}>
                        <Image source={APP_LOGO} style={styles.logoImage} resizeMode="cover" accessible accessibilityLabel="Logo Smart Home AI" />
                    </View>
                    <Text style={styles.appName}>Smart Home AI</Text>
                    <Text style={styles.subtitle}>Quản lý nhà thông minh an toàn và tập trung</Text>
                </LinearGradient>

                <View style={styles.formContainer}>
                    <Text style={styles.formTitle}>Đăng nhập</Text>

                    <View style={styles.inputGroup}>
                        <Text style={styles.label}>Username hoặc SĐT</Text>
                        <TextInput
                            style={[styles.input, focusedField === 'username' && styles.inputFocused]}
                            placeholder="Nhập username hoặc số điện thoại"
                            value={username}
                            onChangeText={(value) => { setUsername(value); setError(''); }}
                            onFocus={() => setFocusedField('username')}
                            onBlur={() => setFocusedField(null)}
                            keyboardType="default"
                            autoCapitalize="none"
                            autoCorrect={false}
                            autoComplete="username"
                            textContentType="username"
                            returnKeyType="next"
                            onSubmitEditing={() => passwordInputRef.current?.focus()}
                            blurOnSubmit={false}
                            accessibilityLabel="Tên đăng nhập hoặc số điện thoại"
                            placeholderTextColor={Colors.slate[400]}
                        />
                    </View>

                    <View style={styles.inputGroup}>
                        <Text style={styles.label}>Mật khẩu</Text>
                        <View style={[styles.passwordField, focusedField === 'password' && styles.inputFocused]}>
                            <TextInput
                                ref={passwordInputRef}
                                style={styles.passwordInput}
                                placeholder="Nhập mật khẩu"
                                value={password}
                                onChangeText={(value) => { setPassword(value); setError(''); }}
                                onFocus={() => setFocusedField('password')}
                                onBlur={() => setFocusedField(null)}
                                secureTextEntry={!showPassword}
                                autoComplete="current-password"
                                textContentType="password"
                                returnKeyType="done"
                                onSubmitEditing={() => void handleLogin()}
                                accessibilityLabel="Mật khẩu"
                                placeholderTextColor={Colors.slate[400]}
                            />
                            <TouchableOpacity
                                style={styles.visibilityButton}
                                onPress={() => setShowPassword((visible) => !visible)}
                                accessibilityRole="button"
                                accessibilityLabel={showPassword ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'}
                                accessibilityState={{ expanded: showPassword }}
                            >
                                <Ionicons name={showPassword ? 'eye-off-outline' : 'eye-outline'} size={21} color={AppTheme.colors.inkMuted} />
                            </TouchableOpacity>
                        </View>
                    </View>

                    {!!error && (
                        <View style={styles.errorBox} accessibilityRole="alert" accessibilityLiveRegion="polite">
                            <Ionicons name="alert-circle-outline" size={18} color={AppTheme.colors.danger} />
                            <Text style={styles.errorText}>{error}</Text>
                        </View>
                    )}

                    <TouchableOpacity
                        style={[styles.loginButton, loading && styles.loginButtonDisabled]}
                        onPress={handleLogin}
                        disabled={loading}
                        accessibilityRole="button"
                        accessibilityLabel={loading ? 'Đang đăng nhập' : 'Đăng nhập'}
                        accessibilityState={{ disabled: loading, busy: loading }}
                        activeOpacity={0.86}
                    >
                        <LinearGradient colors={['#0f766e', '#115e59']} style={styles.loginButtonGradient}>
                            {loading && <ActivityIndicator size="small" color="#fff" />}
                            <Text style={styles.loginButtonText}>{loading ? 'Đang đăng nhập...' : 'Đăng nhập'}</Text>
                        </LinearGradient>
                    </TouchableOpacity>

                    <View style={styles.trustRow} accessible accessibilityLabel="Kết nối được mã hóa và phiên đăng nhập được bảo vệ">
                        <Ionicons name="shield-checkmark-outline" size={17} color={AppTheme.colors.brand} />
                        <Text style={styles.trustText}>Kết nối được mã hóa · Phiên đăng nhập được bảo vệ</Text>
                    </View>

                    {ALLOW_LOCAL_DEMO_AUTH && (
                        <View style={styles.registerRow}>
                            <Text style={styles.registerText}>Chế độ demo local: </Text>
                            <TouchableOpacity
                                onPress={() => navigation.navigate('Register')}
                                accessibilityRole="link"
                                accessibilityLabel="Đăng ký tài khoản demo local"
                            >
                                <Text style={styles.registerLink}>Đăng ký</Text>
                            </TouchableOpacity>
                        </View>
                    )}
                </View>
            </ScrollView>
        </KeyboardAvoidingView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: AppTheme.colors.canvas },
    scrollContent: { flexGrow: 1, alignItems: 'center', paddingBottom: 40 },
    header: { width: '100%', paddingTop: 82, paddingBottom: 44, alignItems: 'center', borderBottomWidth: 1, borderBottomColor: 'rgba(209, 250, 229, 0.14)', overflow: 'hidden' },
    logoContainer: {
        width: 74,
        height: 74,
        borderRadius: 20,
        backgroundColor: 'rgba(236,253,245,0.14)',
        borderWidth: 1,
        borderColor: 'rgba(236,253,245,0.2)',
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 16,
        overflow: 'hidden',
    },
    logoImage: { width: 74, height: 74 },
    appName: { ...AppTheme.typography.display, color: '#fff', marginBottom: 4 },
    subtitle: { fontSize: 14, color: 'rgba(236,253,245,0.78)', fontWeight: '600', textAlign: 'center' },
    formContainer: { width: '100%', maxWidth: 560, minHeight: 490, backgroundColor: AppTheme.colors.surface, borderTopLeftRadius: 26, borderTopRightRadius: 26, marginTop: -22, padding: 24, paddingTop: 32, paddingBottom: 38, borderWidth: 1, borderColor: AppTheme.colors.border, shadowColor: '#173a31', shadowOpacity: 0.08, shadowRadius: 18, shadowOffset: { width: 0, height: -8 }, elevation: 3 },
    formTitle: { ...AppTheme.typography.title, color: AppTheme.colors.ink, marginBottom: 24 },
    inputGroup: { marginBottom: 16 },
    label: { ...AppTheme.typography.label, color: '#50645c', marginBottom: 6 },
    input: {
        backgroundColor: '#edf3f0',
        borderRadius: 14,
        padding: 14,
        fontSize: 16,
        color: '#13251f',
        borderWidth: 1,
        borderColor: '#cddbd5',
        fontWeight: '700',
    },
    inputFocused: { borderColor: AppTheme.colors.brand, backgroundColor: '#f7fbf9' },
    passwordField: { minHeight: 52, flexDirection: 'row', alignItems: 'center', backgroundColor: AppTheme.colors.canvas, borderRadius: 14, borderWidth: 1, borderColor: '#cddbd5' },
    passwordInput: { flex: 1, paddingHorizontal: 14, paddingVertical: 13, fontSize: 16, color: AppTheme.colors.ink, fontWeight: '700' },
    visibilityButton: { width: 48, height: 48, alignItems: 'center', justifyContent: 'center', borderRadius: 14 },
    errorBox: { flexDirection: 'row', alignItems: 'flex-start', gap: 8, padding: 12, borderRadius: 12, backgroundColor: AppTheme.colors.dangerSurface, borderWidth: 1, borderColor: '#f2c7c2', marginBottom: 8 },
    errorText: { flex: 1, color: AppTheme.colors.danger, fontSize: 13, fontWeight: '700', lineHeight: 18 },
    loginButton: { borderRadius: 14, overflow: 'hidden', marginTop: 8, shadowColor: '#173a31', shadowOpacity: 0.14, shadowRadius: 14, shadowOffset: { width: 0, height: 8 }, elevation: 3 },
    loginButtonDisabled: { opacity: 0.6 },
    loginButtonGradient: { minHeight: 52, paddingHorizontal: 16, flexDirection: 'row', gap: 9, alignItems: 'center', justifyContent: 'center' },
    loginButtonText: { color: '#fff', fontSize: 16, fontWeight: '900' },
    registerRow: { flexDirection: 'row', justifyContent: 'center', marginTop: 20 },
    registerText: { fontSize: 14, color: '#61736c', fontWeight: '600' },
    registerLink: { fontSize: 14, fontWeight: '900', color: '#0f766e' },
    trustRow: { minHeight: 44, flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 7, marginTop: 14, paddingHorizontal: 8 },
    trustText: { color: AppTheme.colors.inkMuted, fontSize: 12, fontWeight: '700', textAlign: 'center' },
});
