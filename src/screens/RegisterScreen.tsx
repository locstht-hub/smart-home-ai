import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useAuth } from '../contexts/AuthContext';
import { Colors } from '../constants/colors';

export default function RegisterScreen({ navigation }: any) {
    const [name, setName] = useState('');
    const [phone, setPhone] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const { register } = useAuth();

    const handleRegister = async () => {
        if (!name.trim() || !phone.trim() || !password.trim()) {
            Alert.alert('Lỗi', 'Vui lòng điền đầy đủ thông tin');
            return;
        }
        if (password !== confirmPassword) {
            Alert.alert('Lỗi', 'Mật khẩu xác nhận không khớp');
            return;
        }
        if (password.length < 6) {
            Alert.alert('Lỗi', 'Mật khẩu phải có ít nhất 6 ký tự');
            return;
        }
        setLoading(true);
        const result = await register(name.trim(), phone.trim(), password);
        setLoading(false);
        if (result.success) {
            Alert.alert('Thành công', result.message, [
                { text: 'OK', onPress: () => navigation.goBack() }
            ]);
        } else {
            Alert.alert('Lỗi', result.message);
        }
    };

    return (
        <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
            <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
                <LinearGradient colors={['#10251f', '#173a31', '#0f172a']} style={styles.header}>
                    <Text style={styles.appName}>Đăng ký tài khoản</Text>
                    <Text style={styles.subtitle}>Tạo tài khoản để điều khiển nhà thông minh</Text>
                </LinearGradient>

                <View style={styles.formContainer}>
                    <View style={styles.inputGroup}>
                        <Text style={styles.label}>Họ và tên</Text>
                        <TextInput style={styles.input} placeholder="Nhập họ và tên" value={name} onChangeText={setName} placeholderTextColor={Colors.slate[400]} />
                    </View>

                    <View style={styles.inputGroup}>
                        <Text style={styles.label}>Số điện thoại</Text>
                        <TextInput style={styles.input} placeholder="Nhập số điện thoại" value={phone} onChangeText={setPhone} keyboardType="phone-pad" placeholderTextColor={Colors.slate[400]} />
                    </View>

                    <View style={styles.inputGroup}>
                        <Text style={styles.label}>Mật khẩu</Text>
                        <TextInput style={styles.input} placeholder="Nhập mật khẩu (ít nhất 6 ký tự)" value={password} onChangeText={setPassword} secureTextEntry placeholderTextColor={Colors.slate[400]} />
                    </View>

                    <View style={styles.inputGroup}>
                        <Text style={styles.label}>Xác nhận mật khẩu</Text>
                        <TextInput style={styles.input} placeholder="Nhập lại mật khẩu" value={confirmPassword} onChangeText={setConfirmPassword} secureTextEntry placeholderTextColor={Colors.slate[400]} />
                    </View>

                    {/* Info box */}
                    <View style={styles.infoBox}>
                        <Text style={styles.infoIcon}>ℹ️</Text>
                        <Text style={styles.infoText}>Sau khi đăng ký, tài khoản sẽ cần Admin duyệt trước khi sử dụng được.</Text>
                    </View>

                    <TouchableOpacity style={[styles.registerButton, loading && { opacity: 0.6 }]} onPress={handleRegister} disabled={loading}>
                        <LinearGradient colors={['#0f766e', '#115e59']} style={styles.registerButtonGradient}>
                            <Text style={styles.registerButtonText}>{loading ? 'Đang xử lý...' : 'Đăng ký'}</Text>
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
    container: { flex: 1, backgroundColor: '#edf3f0' },
    scrollContent: { flexGrow: 1 },
    header: { paddingTop: 66, paddingBottom: 34, alignItems: 'center', borderBottomWidth: 1, borderBottomColor: 'rgba(209, 250, 229, 0.14)' },
    appName: { fontSize: 27, fontWeight: '900', color: '#fff', marginBottom: 4, letterSpacing: -0.3 },
    subtitle: { fontSize: 13, color: 'rgba(236,253,245,0.78)', fontWeight: '600' },
    formContainer: { flex: 1, backgroundColor: '#f8fbf9', borderTopLeftRadius: 26, borderTopRightRadius: 26, marginTop: -22, padding: 24, paddingTop: 30, borderWidth: 1, borderColor: '#dce7e1', shadowColor: '#173a31', shadowOpacity: 0.08, shadowRadius: 18, shadowOffset: { width: 0, height: -8 }, elevation: 3 },
    inputGroup: { marginBottom: 14 },
    label: { fontSize: 13, fontWeight: '800', color: '#50645c', marginBottom: 6 },
    input: { backgroundColor: '#edf3f0', borderRadius: 14, padding: 14, fontSize: 16, color: '#13251f', borderWidth: 1, borderColor: '#cddbd5', fontWeight: '700' },
    infoBox: { flexDirection: 'row', alignItems: 'flex-start', padding: 14, backgroundColor: '#fff8e6', borderRadius: 16, borderWidth: 1, borderColor: '#f5d991', marginBottom: 16, gap: 8 },
    infoIcon: { fontSize: 16 },
    infoText: { flex: 1, fontSize: 13, color: Colors.amber[800], lineHeight: 18, fontWeight: '600' },
    registerButton: { borderRadius: 14, overflow: 'hidden', marginTop: 4, shadowColor: '#173a31', shadowOpacity: 0.14, shadowRadius: 14, shadowOffset: { width: 0, height: 8 }, elevation: 3 },
    registerButtonGradient: { padding: 16, alignItems: 'center' },
    registerButtonText: { color: '#fff', fontSize: 16, fontWeight: '900' },
    loginRow: { flexDirection: 'row', justifyContent: 'center', marginTop: 20, marginBottom: 40 },
    loginText: { fontSize: 14, color: '#61736c', fontWeight: '600' },
    loginLink: { fontSize: 14, fontWeight: '900', color: '#0f766e' },
});
