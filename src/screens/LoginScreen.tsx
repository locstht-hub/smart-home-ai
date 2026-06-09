import React, { useState } from 'react';
import { Alert, Image, KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useAuth } from '../contexts/AuthContext';
import { Colors } from '../constants/colors';

const APP_LOGO = require('../../assets/icon.png');

export default function LoginScreen({ navigation }: any) {
    const [username, setUsername] = useState('owner');
    const [password, setPassword] = useState('owner123');
    const [loading, setLoading] = useState(false);
    const { login } = useAuth();

    const handleLogin = async () => {
        if (!username.trim() || !password.trim()) {
            Alert.alert('Lỗi', 'Vui lòng nhập username/SĐT và mật khẩu');
            return;
        }
        setLoading(true);
        const result = await login(username.trim(), password);
        setLoading(false);
        if (!result.success) {
            Alert.alert('Đăng nhập thất bại', result.message);
        }
    };

    return (
        <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
            <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
                <LinearGradient colors={['#10251f', '#173a31', '#0f172a']} style={styles.header}>
                    <View style={styles.logoContainer}>
                        <Image source={APP_LOGO} style={styles.logoImage} resizeMode="cover" />
                    </View>
                    <Text style={styles.appName}>Smart Home AI</Text>
                    <Text style={styles.subtitle}>Demo một nhà cho luận văn tốt nghiệp</Text>
                </LinearGradient>

                <View style={styles.formContainer}>
                    <Text style={styles.formTitle}>Đăng nhập demo</Text>

                    <View style={styles.inputGroup}>
                        <Text style={styles.label}>Username hoặc SĐT</Text>
                        <TextInput
                            style={styles.input}
                            placeholder="owner"
                            value={username}
                            onChangeText={setUsername}
                            keyboardType="default"
                            autoCapitalize="none"
                            placeholderTextColor={Colors.slate[400]}
                        />
                    </View>

                    <View style={styles.inputGroup}>
                        <Text style={styles.label}>Mật khẩu</Text>
                        <TextInput
                            style={styles.input}
                            placeholder="owner123"
                            value={password}
                            onChangeText={setPassword}
                            secureTextEntry
                            placeholderTextColor={Colors.slate[400]}
                        />
                    </View>

                    <TouchableOpacity
                        style={[styles.loginButton, loading && styles.loginButtonDisabled]}
                        onPress={handleLogin}
                        disabled={loading}
                    >
                        <LinearGradient colors={['#0f766e', '#115e59']} style={styles.loginButtonGradient}>
                            <Text style={styles.loginButtonText}>{loading ? 'Đang xử lý...' : 'Đăng nhập'}</Text>
                        </LinearGradient>
                    </TouchableOpacity>

                    <View style={styles.registerRow}>
                        <Text style={styles.registerText}>Cần tài khoản local? </Text>
                        <TouchableOpacity onPress={() => navigation.navigate('Register')}>
                            <Text style={styles.registerLink}>Đăng ký</Text>
                        </TouchableOpacity>
                    </View>

                    <View style={styles.demoBox}>
                        <Text style={styles.demoTitle}>Tài khoản demo luận văn:</Text>
                        <Text style={styles.demoText}>Chủ nhà: owner / owner123</Text>
                        <Text style={styles.demoText}>Thành viên: member / member123</Text>
                        <Text style={styles.demoText}>Admin web: admin / admin123</Text>
                    </View>
                </View>
            </ScrollView>
        </KeyboardAvoidingView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#edf3f0' },
    scrollContent: { flexGrow: 1 },
    header: { paddingTop: 82, paddingBottom: 44, alignItems: 'center', borderBottomWidth: 1, borderBottomColor: 'rgba(209, 250, 229, 0.14)' },
    logoContainer: {
        width: 74, height: 74, borderRadius: 20,
        backgroundColor: 'rgba(236,253,245,0.14)', borderWidth: 1, borderColor: 'rgba(236,253,245,0.2)', alignItems: 'center', justifyContent: 'center', marginBottom: 16,
        overflow: 'hidden',
    },
    logoImage: { width: 74, height: 74 },
    appName: { fontSize: 30, fontWeight: '900', color: '#fff', marginBottom: 4, letterSpacing: -0.4 },
    subtitle: { fontSize: 14, color: 'rgba(236,253,245,0.78)', fontWeight: '600' },
    formContainer: { flex: 1, backgroundColor: '#f8fbf9', borderTopLeftRadius: 26, borderTopRightRadius: 26, marginTop: -22, padding: 24, paddingTop: 32, borderWidth: 1, borderColor: '#dce7e1', shadowColor: '#173a31', shadowOpacity: 0.08, shadowRadius: 18, shadowOffset: { width: 0, height: -8 }, elevation: 3 },
    formTitle: { fontSize: 25, fontWeight: '900', color: '#13251f', marginBottom: 24, letterSpacing: -0.3 },
    inputGroup: { marginBottom: 16 },
    label: { fontSize: 13, fontWeight: '800', color: '#50645c', marginBottom: 6 },
    input: {
        backgroundColor: '#edf3f0', borderRadius: 14, padding: 14,
        fontSize: 16, color: '#13251f', borderWidth: 1, borderColor: '#cddbd5', fontWeight: '700',
    },
    loginButton: { borderRadius: 14, overflow: 'hidden', marginTop: 8, shadowColor: '#173a31', shadowOpacity: 0.14, shadowRadius: 14, shadowOffset: { width: 0, height: 8 }, elevation: 3 },
    loginButtonDisabled: { opacity: 0.6 },
    loginButtonGradient: { padding: 16, alignItems: 'center' },
    loginButtonText: { color: '#fff', fontSize: 16, fontWeight: '900' },
    registerRow: { flexDirection: 'row', justifyContent: 'center', marginTop: 20 },
    registerText: { fontSize: 14, color: '#61736c', fontWeight: '600' },
    registerLink: { fontSize: 14, fontWeight: '900', color: '#0f766e' },
    demoBox: {
        marginTop: 24, padding: 16, backgroundColor: '#e0f2ef',
        borderRadius: 16, borderWidth: 1, borderColor: '#b8ded7',
    },
    demoTitle: { fontSize: 13, fontWeight: '900', color: '#0f766e', marginBottom: 4 },
    demoText: { fontSize: 13, color: '#115e59', lineHeight: 19, fontWeight: '600' },
});
