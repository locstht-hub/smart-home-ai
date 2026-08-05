import React, { useState } from 'react';
import { ActivityIndicator, View, Text, TextInput, TouchableOpacity, StyleSheet, Alert, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../contexts/AuthContext';
import { Colors } from '../constants/colors';
import { AppTheme } from '../constants/theme';
import AmbientTechBackground from '../components/AmbientTechBackground';

export default function RegisterScreen({ navigation }: any) {
    const [name, setName] = useState('');
    const [phone, setPhone] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const [focusedField, setFocusedField] = useState<string | null>(null);
    const [error, setError] = useState('');
    const { register } = useAuth();

    const handleRegister = async () => {
        if (!name.trim() || !phone.trim() || !password.trim()) {
            setError('Vui lòng điền đầy đủ họ tên, số điện thoại và mật khẩu.');
            return;
        }
        if (password !== confirmPassword) {
            setError('Mật khẩu xác nhận không khớp.');
            return;
        }
        if (password.length < 12) {
            setError('Mật khẩu phải có ít nhất 12 ký tự.');
            return;
        }
        setError('');
        setLoading(true);
        const result = await register(name.trim(), phone.trim(), password);
        setLoading(false);
        if (result.success) {
            Alert.alert('Thành công', result.message, [
                { text: 'OK', onPress: () => navigation.goBack() }
            ]);
        } else {
            setError(result.message || 'Không thể tạo tài khoản. Vui lòng thử lại.');
        }
    };

    return (
        <KeyboardAvoidingView
            style={styles.container}
            behavior={Platform.OS === 'ios' ? 'padding' : undefined}
            keyboardVerticalOffset={0}
        >
            <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
                <LinearGradient colors={['#10251f', '#173a31', '#0f172a']} style={styles.header}>
                    <AmbientTechBackground variant="auth" />
                    <Text style={styles.appName}>Đăng ký tài khoản</Text>
                    <Text style={styles.subtitle}>Tạo tài khoản để điều khiển nhà thông minh</Text>
                </LinearGradient>

                <View style={styles.formContainer}>
                    <View style={styles.inputGroup}>
                        <Text style={styles.label}>Họ và tên</Text>
                        <TextInput style={[styles.input, focusedField === 'name' && styles.inputFocused]} placeholder="Nhập họ và tên" value={name} onChangeText={(value) => { setName(value); setError(''); }} onFocus={() => setFocusedField('name')} onBlur={() => setFocusedField(null)} accessibilityLabel="Họ và tên" placeholderTextColor={Colors.slate[400]} />
                    </View>

                    <View style={styles.inputGroup}>
                        <Text style={styles.label}>Số điện thoại</Text>
                        <TextInput style={[styles.input, focusedField === 'phone' && styles.inputFocused]} placeholder="Nhập số điện thoại" value={phone} onChangeText={(value) => { setPhone(value); setError(''); }} onFocus={() => setFocusedField('phone')} onBlur={() => setFocusedField(null)} keyboardType="phone-pad" autoComplete="tel" accessibilityLabel="Số điện thoại" placeholderTextColor={Colors.slate[400]} />
                    </View>

                    <View style={styles.inputGroup}>
                        <Text style={styles.label}>Mật khẩu</Text>
                        <View style={[styles.passwordField, focusedField === 'password' && styles.inputFocused]}>
                            <TextInput style={styles.passwordInput} placeholder="Nhập mật khẩu (ít nhất 12 ký tự)" value={password} onChangeText={(value) => { setPassword(value); setError(''); }} onFocus={() => setFocusedField('password')} onBlur={() => setFocusedField(null)} secureTextEntry={!showPassword} autoComplete="new-password" accessibilityLabel="Mật khẩu mới" placeholderTextColor={Colors.slate[400]} />
                            <TouchableOpacity style={styles.visibilityButton} onPress={() => setShowPassword((visible) => !visible)} accessibilityRole="button" accessibilityLabel={showPassword ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'} accessibilityState={{ expanded: showPassword }}>
                                <Ionicons name={showPassword ? 'eye-off-outline' : 'eye-outline'} size={21} color={AppTheme.colors.inkMuted} />
                            </TouchableOpacity>
                        </View>
                    </View>

                    <View style={styles.inputGroup}>
                        <Text style={styles.label}>Xác nhận mật khẩu</Text>
                        <TextInput style={[styles.input, focusedField === 'confirm' && styles.inputFocused]} placeholder="Nhập lại mật khẩu" value={confirmPassword} onChangeText={(value) => { setConfirmPassword(value); setError(''); }} onFocus={() => setFocusedField('confirm')} onBlur={() => setFocusedField(null)} secureTextEntry={!showPassword} autoComplete="new-password" accessibilityLabel="Xác nhận mật khẩu" placeholderTextColor={Colors.slate[400]} />
                    </View>

                    {!!error && (
                        <View style={styles.errorBox} accessibilityRole="alert" accessibilityLiveRegion="polite">
                            <Ionicons name="alert-circle-outline" size={18} color={AppTheme.colors.danger} />
                            <Text style={styles.errorText}>{error}</Text>
                        </View>
                    )}

                    <View style={styles.infoBox}>
                        <Ionicons name="information-circle-outline" size={19} color={Colors.amber[800]} />
                        <Text style={styles.infoText}>Sau khi đăng ký, tài khoản sẽ cần Admin duyệt trước khi sử dụng được.</Text>
                    </View>

                    <TouchableOpacity style={[styles.registerButton, loading && styles.registerButtonDisabled]} onPress={handleRegister} disabled={loading} activeOpacity={0.86} accessibilityRole="button" accessibilityLabel={loading ? 'Đang đăng ký' : 'Đăng ký'} accessibilityState={{ disabled: loading, busy: loading }}>
                        <LinearGradient colors={['#0f766e', '#115e59']} style={styles.registerButtonGradient}>
                            {loading && <ActivityIndicator size="small" color="#fff" />}
                            <Text style={styles.registerButtonText}>{loading ? 'Đang đăng ký...' : 'Đăng ký'}</Text>
                        </LinearGradient>
                    </TouchableOpacity>

                    <View style={styles.loginRow}>
                        <Text style={styles.loginText}>Đã có tài khoản? </Text>
                        <TouchableOpacity onPress={() => navigation.goBack()}>
                            <Text style={styles.loginLink}>Đăng nhập</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </ScrollView>
        </KeyboardAvoidingView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: AppTheme.colors.canvas },
    scrollContent: { flexGrow: 1, alignItems: 'center', paddingBottom: 40 },
    header: { width: '100%', paddingTop: 66, paddingBottom: 34, alignItems: 'center', borderBottomWidth: 1, borderBottomColor: 'rgba(209, 250, 229, 0.14)', overflow: 'hidden' },
    appName: { fontSize: 27, fontWeight: '900', color: '#fff', marginBottom: 4, letterSpacing: -0.3, zIndex: 1 },
    subtitle: { fontSize: 13, color: 'rgba(236,253,245,0.78)', fontWeight: '600' },
    formContainer: { width: '100%', maxWidth: 560, backgroundColor: AppTheme.colors.surface, borderTopLeftRadius: 26, borderTopRightRadius: 26, marginTop: -22, padding: 24, paddingTop: 30, borderWidth: 1, borderColor: AppTheme.colors.border, shadowColor: '#173a31', shadowOpacity: 0.08, shadowRadius: 18, shadowOffset: { width: 0, height: -8 }, elevation: 3 },
    inputGroup: { marginBottom: 14 },
    label: { fontSize: 13, fontWeight: '800', color: '#50645c', marginBottom: 6 },
    input: { backgroundColor: '#edf3f0', borderRadius: 14, padding: 14, fontSize: 16, color: '#13251f', borderWidth: 1, borderColor: '#cddbd5', fontWeight: '700' },
    inputFocused: { borderColor: AppTheme.colors.brand, backgroundColor: '#f7fbf9' },
    passwordField: { minHeight: 52, flexDirection: 'row', alignItems: 'center', backgroundColor: AppTheme.colors.canvas, borderRadius: 14, borderWidth: 1, borderColor: '#cddbd5' },
    passwordInput: { flex: 1, paddingHorizontal: 14, paddingVertical: 13, fontSize: 16, color: AppTheme.colors.ink, fontWeight: '700' },
    visibilityButton: { width: 48, height: 48, alignItems: 'center', justifyContent: 'center', borderRadius: 14 },
    errorBox: { flexDirection: 'row', alignItems: 'flex-start', gap: 8, padding: 12, borderRadius: 12, backgroundColor: AppTheme.colors.dangerSurface, borderWidth: 1, borderColor: '#f2c7c2', marginBottom: 12 },
    errorText: { flex: 1, color: AppTheme.colors.danger, fontSize: 13, fontWeight: '700', lineHeight: 18 },
    infoBox: { flexDirection: 'row', alignItems: 'flex-start', padding: 14, backgroundColor: '#fff8e6', borderRadius: 16, borderWidth: 1, borderColor: '#f5d991', marginBottom: 16, gap: 8 },
    infoText: { flex: 1, fontSize: 13, color: Colors.amber[800], lineHeight: 18, fontWeight: '600' },
    registerButton: { borderRadius: 14, overflow: 'hidden', marginTop: 4, shadowColor: '#173a31', shadowOpacity: 0.14, shadowRadius: 14, shadowOffset: { width: 0, height: 8 }, elevation: 3 },
    registerButtonDisabled: { opacity: 0.6 },
    registerButtonGradient: { minHeight: 52, paddingHorizontal: 16, flexDirection: 'row', gap: 9, alignItems: 'center', justifyContent: 'center' },
    registerButtonText: { color: '#fff', fontSize: 16, fontWeight: '900' },
    loginRow: { flexDirection: 'row', justifyContent: 'center', marginTop: 20, marginBottom: 40 },
    loginText: { fontSize: 14, color: '#61736c', fontWeight: '600' },
    loginLink: { fontSize: 14, fontWeight: '900', color: '#0f766e' },
});
