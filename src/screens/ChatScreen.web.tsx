import React, { useEffect, useMemo, useRef, useState } from 'react';
import { ActivityIndicator, Image, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { useAuth } from '../contexts/AuthContext';
import { useData } from '../contexts/DataContext';
import { useSmartHomeServer } from '../contexts/SmartHomeServerContext';
import { AppTheme } from '../constants/theme';
import { describeApiFailure } from '../services/smartHome/errors';

const APP_AVATAR = require('../../assets/icon.png');
const QUICK_REPLIES = [
    'Mức tiêu thụ điện hôm nay',
    'Thiết bị nào đang bật?',
    'Gợi ý tiết kiệm năng lượng',
    'Tắt tất cả thiết bị',
];

type WebChatMessage = {
    id: string;
    role: 'assistant' | 'user';
    text: string;
    meta?: string;
};

function describeAssistantReplySource(source: 'ai' | 'fallback' | 'rule', provider?: string) {
    if (source === 'ai') return `Phản hồi AI${provider ? ` · ${provider}` : ''}`;
    if (source === 'fallback') return 'Phản hồi dự phòng';
    return 'Lệnh hệ thống';
}

export default function ChatScreen() {
    const { user } = useAuth();
    const { client, isConfigured, status } = useSmartHomeServer();
    const { refresh } = useData();
    const scrollRef = useRef<ScrollView>(null);
    const initialMessages = useMemo<WebChatMessage[]>(() => [{
        id: 'welcome',
        role: 'assistant',
        text: `Xin chào ${user?.name || 'bạn'}. Tôi có thể tra cứu điện năng, trạng thái thiết bị và gửi lệnh qua cùng API với ứng dụng di động.`,
    }], [user?.name]);
    const [messages, setMessages] = useState<WebChatMessage[]>(initialMessages);
    const [text, setText] = useState('');
    const [isSending, setIsSending] = useState(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (!isConfigured) return;
        client.warmUpChatConnection().catch(() => undefined);
    }, [client, isConfigured]);

    useEffect(() => {
        const timer = setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 20);
        return () => clearTimeout(timer);
    }, [messages, isSending]);

    const sendMessage = async (value = text) => {
        const cleanText = value.trim();
        if (!cleanText || isSending) return;

        const userMessage: WebChatMessage = {
            id: `user-${Date.now()}`,
            role: 'user',
            text: cleanText,
        };
        setMessages(current => [...current, userMessage]);
        setText('');
        setError(null);
        setIsSending(true);

        try {
            const result = await client.chatWithTiming(cleanText);
            setMessages(current => [...current, {
                id: `assistant-${Date.now()}`,
                role: 'assistant',
                text: result.reply,
                meta: `${describeAssistantReplySource(result.assistantSource, result.assistantProvider)} · ${result.endpoint === 'local' ? 'API nội bộ' : 'API đám mây'} · ${result.elapsedMs} ms`,
            }]);
            await refresh();
        } catch (sendError) {
            setError(describeApiFailure(sendError));
        } finally {
            setIsSending(false);
        }
    };

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <View style={styles.assistantIdentity}>
                    <Image source={APP_AVATAR} style={styles.avatar} />
                    <View>
                        <Text style={styles.title}>Trợ lý năng lượng</Text>
                        <View style={styles.statusRow}>
                            <View style={[styles.statusDot, status === 'connected' && styles.statusDotOnline]} />
                            <Text style={styles.statusText}>{status === 'connected' ? 'Đã kết nối Server API' : 'Chưa kết nối Server API'}</Text>
                        </View>
                    </View>
                </View>
                <View style={styles.webBadge}><Ionicons name="desktop-outline" size={15} color="#0f766e" /><Text style={styles.webBadgeText}>Web</Text></View>
            </View>

            <View style={styles.chatPanel}>
                <ScrollView ref={scrollRef} style={styles.messages} contentContainerStyle={styles.messagesContent}>
                    {messages.map(message => (
                        <View key={message.id} style={[styles.messageRow, message.role === 'user' && styles.messageRowUser]}>
                            {message.role === 'assistant' ? <Image source={APP_AVATAR} style={styles.messageAvatar} /> : null}
                            <View style={[styles.bubble, message.role === 'user' ? styles.userBubble : styles.assistantBubble]}>
                                <Text style={[styles.messageText, message.role === 'user' && styles.userMessageText]}>{message.text}</Text>
                                {message.meta ? <Text style={styles.messageMeta}>{message.meta}</Text> : null}
                            </View>
                        </View>
                    ))}
                    {isSending ? (
                        <View style={styles.thinkingRow} accessibilityLiveRegion="polite">
                            <ActivityIndicator size="small" color="#0f766e" />
                            <Text style={styles.thinkingText}>Đang chờ phản hồi từ server...</Text>
                        </View>
                    ) : null}
                </ScrollView>

                <View style={styles.composerArea}>
                    {error ? <Text style={styles.errorText} accessibilityLiveRegion="polite">{error}</Text> : null}
                    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.quickReplies}>
                        {QUICK_REPLIES.map(reply => (
                            <TouchableOpacity key={reply} style={styles.quickReply} onPress={() => void sendMessage(reply)} disabled={isSending}>
                                <Text style={styles.quickReplyText}>{reply}</Text>
                            </TouchableOpacity>
                        ))}
                    </ScrollView>
                    <View style={styles.composerRow}>
                        <TextInput
                            style={styles.input}
                            value={text}
                            onChangeText={setText}
                            placeholder="Hỏi về điện năng hoặc nhập lệnh điều khiển..."
                            placeholderTextColor="#80918a"
                            editable={!isSending}
                            multiline
                            accessibilityLabel="Nội dung gửi trợ lý năng lượng"
                            onKeyPress={({ nativeEvent }) => {
                                const keyboardEvent = nativeEvent as typeof nativeEvent & { shiftKey?: boolean };
                                if (keyboardEvent.key === 'Enter' && !keyboardEvent.shiftKey) {
                                    void sendMessage();
                                }
                            }}
                        />
                        <TouchableOpacity
                            style={[styles.sendButton, (!text.trim() || isSending) && styles.sendButtonDisabled]}
                            disabled={!text.trim() || isSending}
                            onPress={() => void sendMessage()}
                            accessibilityRole="button"
                            accessibilityLabel="Gửi tin nhắn"
                            accessibilityState={{ disabled: !text.trim() || isSending, busy: isSending }}
                        >
                            <Ionicons name="send" size={19} color="#ffffff" />
                        </TouchableOpacity>
                    </View>
                    <Text style={styles.helperText}>Enter để gửi · Shift + Enter để xuống dòng. Lệnh được kiểm tra quyền ở server.</Text>
                </View>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, padding: 18, backgroundColor: AppTheme.colors.canvas },
    header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 },
    assistantIdentity: { flexDirection: 'row', alignItems: 'center', gap: 12 },
    avatar: { width: 48, height: 48, borderRadius: 15 },
    title: { color: AppTheme.colors.ink, fontSize: 20, fontWeight: '900' },
    statusRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 4 },
    statusDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: '#f59e0b' },
    statusDotOnline: { backgroundColor: '#10b981' },
    statusText: { color: AppTheme.colors.inkMuted, fontSize: 11, fontWeight: '700' },
    webBadge: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 10, paddingVertical: 7, borderRadius: 999, backgroundColor: '#e0f2ef' },
    webBadgeText: { color: '#0f766e', fontSize: 11, fontWeight: '900' },
    chatPanel: { flex: 1, minHeight: 440, borderRadius: 22, overflow: 'hidden', borderWidth: 1, borderColor: AppTheme.colors.border, backgroundColor: AppTheme.colors.surface },
    messages: { flex: 1 },
    messagesContent: { padding: 20, gap: 14 },
    messageRow: { flexDirection: 'row', alignItems: 'flex-end', gap: 8, maxWidth: '78%' },
    messageRowUser: { alignSelf: 'flex-end', justifyContent: 'flex-end' },
    messageAvatar: { width: 30, height: 30, borderRadius: 10 },
    bubble: { paddingHorizontal: 14, paddingVertical: 11, borderRadius: 16 },
    assistantBubble: { backgroundColor: '#edf3f0', borderBottomLeftRadius: 5 },
    userBubble: { backgroundColor: '#0f766e', borderBottomRightRadius: 5 },
    messageText: { color: AppTheme.colors.ink, fontSize: 14, lineHeight: 21 },
    userMessageText: { color: '#ffffff' },
    messageMeta: { color: '#61736c', fontSize: 9, fontWeight: '700', marginTop: 6 },
    thinkingRow: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingLeft: 38 },
    thinkingText: { color: AppTheme.colors.inkMuted, fontSize: 12 },
    composerArea: { padding: 14, borderTopWidth: 1, borderTopColor: AppTheme.colors.border, backgroundColor: '#f8fbf9' },
    errorText: { color: AppTheme.colors.danger, fontSize: 12, fontWeight: '700', marginBottom: 8 },
    quickReplies: { gap: 8, paddingBottom: 10 },
    quickReply: { paddingHorizontal: 11, paddingVertical: 7, borderRadius: 999, borderWidth: 1, borderColor: '#b8ded7', backgroundColor: '#f0fdfa' },
    quickReplyText: { color: '#0f766e', fontSize: 11, fontWeight: '800' },
    composerRow: { flexDirection: 'row', alignItems: 'flex-end', gap: 10 },
    input: { flex: 1, minHeight: 46, maxHeight: 110, paddingHorizontal: 14, paddingVertical: 12, borderRadius: 14, borderWidth: 1, borderColor: AppTheme.colors.border, backgroundColor: '#ffffff', color: AppTheme.colors.ink, fontSize: 14, outlineStyle: 'none' } as any,
    sendButton: { width: 46, height: 46, borderRadius: 14, alignItems: 'center', justifyContent: 'center', backgroundColor: '#0f766e' },
    sendButtonDisabled: { opacity: 0.42 },
    helperText: { color: '#80918a', fontSize: 9, marginTop: 7 },
});
