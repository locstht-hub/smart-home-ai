import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { ActivityIndicator, Image, PermissionsAndroid, Platform, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import {
    Actions,
    Bubble,
    Composer,
    GiftedChat,
    IMessage,
    InputToolbar,
    MessageText,
    Send,
} from 'react-native-gifted-chat';
import { useBottomTabBarHeight } from '@react-navigation/bottom-tabs';
import { LinearGradient } from 'expo-linear-gradient';
import { useVoice, VoiceEvent, VoiceKit, VoiceMode } from 'react-native-voicekit';
import * as Speech from 'expo-speech';
import type { Voice } from 'expo-speech';
import { useAuth } from '../contexts/AuthContext';
import { useSmartHomeServer } from '../contexts/SmartHomeServerContext';
import { useData } from '../contexts/DataContext';
import { Colors } from '../constants/colors';

const APP_AVATAR = require('../../assets/icon.png');

const ICONS: Record<string, string> = {
    'volume-mute': 'Mute',
    'volume-high': 'Vol',
    mic: 'Mic',
    'mic-outline': 'Mic',
    stop: 'Stop',
    send: 'Send',
};

function Ionicons({ name, size = 16, color = '#000', style }: { name: string; size?: number; color?: string; style?: any }) {
    return <Text style={[{ color, fontSize: Math.max(10, Math.round(size * 0.62)), fontWeight: '700' }, style]}>{ICONS[name] || name}</Text>;
}

const QUICK_REPLIES = [
    'bật đèn phòng khách',
    'tắt tất cả thiết bị',
    'mức tiêu thụ điện hôm nay',
    'bật chế độ ngủ',
];

const VIETNAMESE_LANGUAGE = 'vi-VN';

function getVoiceScore(voice: Voice) {
    const language = voice.language.toLowerCase();
    const name = voice.name.toLowerCase();
    let score = 0;

    if (language === 'vi-vn') score += 50;
    else if (language.startsWith('vi')) score += 35;
    if (voice.quality === Speech.VoiceQuality.Enhanced) score += 30;
    if (name.includes('google')) score += 8;
    if (name.includes('vietnam') || name.includes('viet')) score += 8;
    if (name.includes('female') || name.includes('woman') || name.includes('nu')) score += 3;

    return score;
}

function pickVietnameseVoice(voices: Voice[]) {
    return voices
        .filter(voice => voice.language.toLowerCase().startsWith('vi'))
        .sort((a, b) => getVoiceScore(b) - getVoiceScore(a))[0]?.identifier;
}

function prepareTextForSpeech(text: string) {
    return text
        .replace(/https?:\/\/\S+/g, 'đường dẫn')
        .replace(/[`*_#>|[\]{}]/g, '')
        .replace(/\s+/g, ' ')
        .trim();
}

export default function ChatScreen() {
    const { user } = useAuth();
    const { client, isConfigured, status } = useSmartHomeServer();
    const { refresh: refreshDevices } = useData();
    const tabBarHeight = useBottomTabBarHeight();
    const lastHandledTranscriptRef = useRef('');
    const initialMessages = useMemo<IMessage[]>(() => [
        {
            _id: 'welcome-1',
            text: `Xin chào ${user?.name || 'bạn'}! Mình là trợ lý Smart Home. Bạn cần hỗ trợ điều khiển gì hôm nay?`,
            createdAt: new Date(),
            user: {
                _id: 'assistant',
                name: 'Smart Home AI',
                avatar: APP_AVATAR,
            },
        },
    ], [user?.name]);

    const [messages, setMessages] = useState<IMessage[]>(initialMessages);
    const [voiceError, setVoiceError] = useState<string | null>(null);
    const [isVoiceStarting, setIsVoiceStarting] = useState(false);
    const [isMuted, setIsMuted] = useState(false);
    const [speechVoice, setSpeechVoice] = useState<string | undefined>(undefined);
    const {
        available: isVoiceAvailable,
        listening: isListening,
        transcript,
        startListening,
        stopListening,
        resetTranscript,
    } = useVoice({
        locale: 'vi-VN',
        mode: VoiceMode.ContinuousAndStop,
        enablePartialResults: true,
        silenceTimeoutMs: 1400,
        muteAndroidBeep: true,
    });

    useEffect(() => {
        if (!isConfigured) return;

        client.warmUpChatConnection().catch(() => undefined);
        const keepWarmInterval = setInterval(() => {
            client.warmUpChatConnection().catch(() => undefined);
        }, 25000);

        return () => clearInterval(keepWarmInterval);
    }, [client, isConfigured]);

    useEffect(() => {
        let isMounted = true;

        Speech.getAvailableVoicesAsync()
            .then(voices => {
                if (!isMounted) return;
                setSpeechVoice(pickVietnameseVoice(voices));
            })
            .catch(() => undefined);

        return () => {
            isMounted = false;
        };
    }, []);

    // Cleanup speech on unmount
    useEffect(() => {
        return () => {
            Speech.stop();
        };
    }, []);

    const pushBotReply = useCallback((text: string, metadata?: { endpoint: string; elapsedMs: number }) => {
        const botReply: any = {
            _id: `bot-${Date.now()}`,
            text,
            createdAt: new Date(),
            user: {
                _id: 'assistant',
                name: 'Smart Home AI',
                avatar: APP_AVATAR,
            },
            metadata,
        };

        setMessages(previous => GiftedChat.append(previous, [botReply]));

        if (!isMuted) {
            const speechText = prepareTextForSpeech(text);
            Speech.stop();
            if (speechText) {
                Speech.speak(speechText, {
                    language: VIETNAMESE_LANGUAGE,
                    voice: speechVoice,
                    rate: Platform.OS === 'android' ? 0.9 : 0.88,
                    pitch: 1.02,
                    volume: 1,
                });
            }
        }
    }, [isMuted, speechVoice]);

    const buildUserMessage = useCallback((text: string): IMessage => ({
        _id: `user-${Date.now()}`,
        text,
        createdAt: new Date(),
        user: {
            _id: user?.id || 'guest',
            name: user?.name || 'Bạn',
            avatar: APP_AVATAR,
        },
    }), [user?.id, user?.name]);

    const processUserText = useCallback(async (userMessage: string) => {
        if (!userMessage) return;

        if (!isConfigured) {
            pushBotReply(`Server API chưa được cấu hình. Mình đã ghi nhận "${userMessage}" và hiện đang dùng phản hồi dự phòng.`);
            return;
        }

        try {
            const result = await client.chatWithTiming(userMessage);
            await refreshDevices();
            const replyText = result.reply || `Mình đã chuyển câu lệnh "${userMessage}" tới server riêng.`;

            pushBotReply(replyText, {
                endpoint: result.endpoint,
                elapsedMs: result.elapsedMs,
            });
        } catch (error) {
            console.error('Error processing Smart Home server chat:', error);
            if (error instanceof Error && (error.message === 'Nhà đang bị tạm khóa' || error.message === 'Nha dang bi tam khoa')) {
                pushBotReply('Nhà đang bị tạm khóa. Admin cần mở khóa nhà trước khi bạn dùng Chat AI để điều khiển thiết bị.');
                return;
            }
            pushBotReply('Không thể gọi Server API lúc này. Bạn hãy thử lại khi kết nối ổn định hơn.');
        }
    }, [client, isConfigured, pushBotReply, refreshDevices]);

    const onSend = useCallback(async (newMessages: IMessage[] = [], options?: { skipAppend?: boolean }) => {
        Speech.stop(); // Stop any bot speaking immediately upon user sending message
        if (!options?.skipAppend) {
            setMessages(previous => GiftedChat.append(previous, newMessages));
        }

        const userMessage = newMessages[0]?.text?.trim();
        if (!userMessage) return;

        await processUserText(userMessage);
    }, [processUserText]);

    useEffect(() => {
        const transcriptToSend = transcript.trim();
        if (isListening || !transcriptToSend) return;
        if (lastHandledTranscriptRef.current === transcriptToSend) return;

        lastHandledTranscriptRef.current = transcriptToSend;
        resetTranscript();
        void onSend([buildUserMessage(transcriptToSend)]);
    }, [buildUserMessage, isListening, onSend, resetTranscript, transcript]);

    useEffect(() => {
        const handleVoiceError = (error: { message?: string }) => {
            const message = error?.message || 'Không thể nhận diện giọng nói lúc này.';
            setVoiceError(message);
            setIsVoiceStarting(false);
            pushBotReply(`Mic gặp sự cố: ${message}`);
        };

        VoiceKit.addListener(VoiceEvent.Error, handleVoiceError);

        return () => {
            VoiceKit.removeListener(VoiceEvent.Error, handleVoiceError);
        };
    }, [pushBotReply]);

    useEffect(() => {
        if (!isListening) setIsVoiceStarting(false);
    }, [isListening]);

    const handleQuickReply = useCallback((replyText: string) => {
        void onSend([buildUserMessage(replyText)]);
    }, [buildUserMessage, onSend]);

    const handleVoicePress = useCallback(async () => {
        setVoiceError(null);
        Speech.stop(); // Stop speech when starting recording

        if (!isVoiceAvailable) {
            pushBotReply('Thiết bị này chưa sẵn sàng cho speech-to-text. Bạn cần dùng APK build mới và cấp quyền microphone.');
            return;
        }

        try {
            if (isListening) {
                await stopListening();
                return;
            }

            if (Platform.OS === 'android') {
                const hasPermission = await PermissionsAndroid.check(PermissionsAndroid.PERMISSIONS.RECORD_AUDIO);
                if (!hasPermission) {
                    const granted = await PermissionsAndroid.request(
                        PermissionsAndroid.PERMISSIONS.RECORD_AUDIO,
                        {
                            title: 'Cho phép microphone',
                            message: 'Ứng dụng cần microphone để nghe lệnh giọng nói và gửi sang server riêng.',
                            buttonPositive: 'Cho phép',
                            buttonNegative: 'Từ chối',
                        },
                    );

                    if (granted !== PermissionsAndroid.RESULTS.GRANTED) {
                        pushBotReply('Bạn chưa cấp quyền microphone, nên mình chưa thể nghe lệnh giọng nói.');
                        return;
                    }
                }
            }

            lastHandledTranscriptRef.current = '';
            resetTranscript();
            setIsVoiceStarting(true);
            await startListening();
        } catch (error) {
            setIsVoiceStarting(false);
            const message = error instanceof Error ? error.message : 'Không thể bật microphone lúc này.';
            setVoiceError(message);
            pushBotReply(`Không thể bật mic: ${message}`);
        }
    }, [isListening, isVoiceAvailable, pushBotReply, resetTranscript, startListening, stopListening]);

    const voiceHint = useMemo(() => {
        if (!isVoiceAvailable) return 'Mic chưa sẵn sàng trên bản build hiện tại.';
        if (isListening) return transcript.trim() || 'Đang nghe... hãy nói lệnh của bạn';
        if (voiceError) return voiceError;
        return 'Nhấn mic, nói lệnh, app sẽ gửi transcript sang Server API.';
    }, [isListening, isVoiceAvailable, transcript, voiceError]);

    return (
        <View style={styles.container}>
            <LinearGradient colors={['#10251f', '#173a31', '#0f172a']} style={styles.header}>
                <Image source={APP_AVATAR} style={styles.headerIcon} />
                <View style={styles.headerTextWrap}>
                    <Text style={styles.headerTitle}>Smart Home AI</Text>
                    <View style={styles.statusRow}>
                        <View style={styles.statusDot} />
                        <Text style={styles.headerSubtitle}>
                            {isConfigured
                                ? (status === 'connected' ? 'Đang nối với Server API' : 'Đã cấu hình Server API')
                                : 'Cần cấu hình Server API để điều khiển thiết bị thật'}
                        </Text>
                    </View>
                </View>
                <TouchableOpacity
                    style={styles.muteButton}
                    onPress={() => setIsMuted(prev => !prev)}
                    activeOpacity={0.7}
                >
                    <Ionicons
                        name={isMuted ? 'volume-mute' : 'volume-high'}
                        size={22}
                        color="#ffffff"
                    />
                </TouchableOpacity>
            </LinearGradient>

            <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                style={styles.quickReplyRow}
                contentContainerStyle={styles.quickReplyContent}
            >
                {QUICK_REPLIES.map((reply) => (
                    <TouchableOpacity key={reply} style={styles.quickReplyBtn} onPress={() => handleQuickReply(reply)}>
                        <Text style={styles.quickReplyText}>{reply}</Text>
                    </TouchableOpacity>
                ))}
            </ScrollView>

            {isListening && (
                <View style={styles.voiceBanner}>
                    <Ionicons name="mic" size={20} color={Colors.red[500]} style={styles.voiceBannerIcon} />
                    <View style={styles.voiceBannerTextWrap}>
                        <Text style={styles.voiceBannerTitle}>Đang nhận diện giọng nói...</Text>
                        <Text style={styles.voiceBannerSubtitle}>{voiceHint}</Text>
                    </View>
                    <TouchableOpacity
                        style={styles.voiceStopButton}
                        onPress={() => void stopListening()}
                        activeOpacity={0.7}
                    >
                        <Ionicons name="stop" size={16} color="#ffffff" />
                    </TouchableOpacity>
                </View>
            )}

            <GiftedChat
                messages={messages}
                onSend={onSend}
                user={{
                    _id: user?.id || 'guest',
                    name: user?.name || 'Bạn',
                    avatar: APP_AVATAR,
                }}
                placeholder="Nhập nội dung chat ở đây..."
                alwaysShowSend
                minInputToolbarHeight={54}
                keyboardShouldPersistTaps="handled"
                bottomOffset={tabBarHeight}
                textInputProps={{
                    placeholderTextColor: Colors.slate[400],
                    autoCorrect: false,
                    spellCheck: false,
                    autoCapitalize: 'sentences',
                    keyboardType: 'default',
                    multiline: true,
                    textAlignVertical: 'center',
                }}
                renderBubble={(props) => (
                    <Bubble
                        {...props}
                        wrapperStyle={{
                            right: {
                                backgroundColor: '#0f766e',
                                borderRadius: 18,
                                paddingVertical: 4,
                                paddingHorizontal: 4,
                            },
                            left: {
                                backgroundColor: '#f8fbf9',
                                borderWidth: 0,
                                borderRadius: 18,
                                paddingVertical: 4,
                                paddingHorizontal: 4,
                            },
                        }}
                        textStyle={{
                            right: { color: '#ffffff', fontSize: 15, lineHeight: 22 },
                            left: { color: Colors.slate[800], fontSize: 15, lineHeight: 22 },
                        }}
                    />
                )}
                renderInputToolbar={(props) => (
                    <InputToolbar
                        {...props}
                        containerStyle={styles.toolbar}
                        primaryStyle={styles.toolbarPrimary}
                    />
                )}
                renderActions={(props) => (
                    <Actions
                        {...props}
                        icon={() => (
                            <View style={[
                                styles.micAccessory,
                                isListening && styles.micAccessoryActive,
                            ]}>
                                <Ionicons
                                    name={isListening ? 'mic' : 'mic-outline'}
                                    size={22}
                                    color={isListening ? '#ffffff' : Colors.slate[600]}
                                />
                            </View>
                        )}
                        containerStyle={styles.micAccessoryContainer}
                        onPressActionButton={() => void handleVoicePress()}
                    />
                )}
                renderComposer={(props) => (
                    <Composer
                        {...props}
                        textInputStyle={styles.textInput}
                        placeholderTextColor={Colors.slate[400]}
                    />
                )}
                renderCustomView={(props) => {
                    const message = props.currentMessage as any;
                    if (message && message.metadata) {
                        const { endpoint, elapsedMs } = message.metadata;
                        const isLocal = endpoint === 'local';
                        const icon = isLocal ? '⚡' : '☁️';
                        const label = isLocal ? 'Local API' : 'Cloud API';
                        const time = (elapsedMs / 1000).toFixed(1);
                        return (
                            <View style={styles.metadataContainer}>
                                <View style={[
                                    styles.metadataBadge,
                                    isLocal ? styles.metadataBadgeLocal : styles.metadataBadgeCloud
                                ]}>
                                    <Text style={[
                                        styles.metadataBadgeText,
                                        isLocal ? styles.metadataBadgeTextLocal : styles.metadataBadgeTextCloud
                                    ]}>
                                        {icon} {label} • {time}s
                                    </Text>
                                </View>
                            </View>
                        );
                    }
                    return null;
                }}
                renderMessageText={(props) => (
                    <MessageText
                        {...props}
                        textStyle={{
                            right: { color: '#ffffff', fontSize: 15, lineHeight: 22 },
                            left: { color: Colors.slate[800], fontSize: 15, lineHeight: 22 },
                        }}
                        textProps={{ selectable: true }}
                    />
                )}
                renderSend={(props) => (
                    <Send {...props} containerStyle={styles.sendContainer}>
                        <LinearGradient
                            colors={['#0f766e', '#115e59']}
                            style={styles.sendCircle}
                        >
                            <Ionicons name="send" size={18} color="#ffffff" />
                        </LinearGradient>
                    </Send>
                )}
                listViewProps={{
                    contentContainerStyle: { paddingBottom: 10, paddingHorizontal: 4 },
                    keyboardShouldPersistTaps: 'handled',
                }}
            />
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#edf3f0' },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
        paddingHorizontal: 16,
        paddingTop: Platform.OS === 'ios' ? 54 : 18,
        paddingBottom: 14,
        borderBottomWidth: 1,
        borderBottomColor: 'rgba(209, 250, 229, 0.14)',
        shadowColor: '#10251f',
        shadowOpacity: 0.2,
        shadowRadius: 20,
        shadowOffset: { width: 0, height: 10 },
        elevation: 4,
    },
    headerTextWrap: { flex: 1 },
    headerIcon: {
        width: 46,
        height: 46,
        borderRadius: 14,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.4)',
    },
    headerTitle: { fontSize: 18, fontWeight: '900', color: '#fff', letterSpacing: -0.2 },
    statusRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 3 },
    statusDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: '#34d399' },
    headerSubtitle: { fontSize: 12, color: 'rgba(255,255,255,0.88)' },
    muteButton: {
        width: 40,
        height: 40,
        borderRadius: 14,
        backgroundColor: 'rgba(236,253,245,0.12)',
        borderWidth: 1,
        borderColor: 'rgba(236,253,245,0.16)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    quickReplyRow: {
        maxHeight: 58,
        backgroundColor: '#f8fbf9',
        borderBottomWidth: 1,
        borderBottomColor: '#dce7e1',
    },
    quickReplyContent: { paddingHorizontal: 12, paddingVertical: 10, gap: 8 },
    quickReplyBtn: {
        backgroundColor: '#e0f2ef',
        borderWidth: 1,
        borderColor: '#b8ded7',
        paddingVertical: 7,
        paddingHorizontal: 10,
        borderRadius: 999,
    },
    quickReplyText: {
        fontSize: 12,
        color: '#0f766e',
        fontWeight: '800',
    },
    voiceBanner: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
        backgroundColor: '#f8fbf9',
        borderBottomWidth: 1,
        borderBottomColor: '#dce7e1',
        paddingHorizontal: 14,
        paddingVertical: 12,
    },
    voiceBannerTextWrap: { flex: 1, gap: 2 },
    voiceBannerTitle: {
        fontSize: 13,
        fontWeight: '700',
        color: '#13251f',
    },
    voiceBannerSubtitle: {
        fontSize: 12,
        lineHeight: 18,
        color: '#61736c',
    },
    voiceBannerIcon: {
        marginRight: 4,
    },
    voiceStopButton: {
        width: 32,
        height: 32,
        borderRadius: 16,
        backgroundColor: Colors.red[500],
        justifyContent: 'center',
        alignItems: 'center',
    },
    metadataContainer: {
        paddingHorizontal: 12,
        paddingBottom: 8,
        paddingTop: 2,
        flexDirection: 'row',
    },
    metadataBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 3,
        paddingHorizontal: 8,
        borderRadius: 999,
    },
    metadataBadgeLocal: {
        backgroundColor: Colors.amber[50],
    },
    metadataBadgeCloud: {
        backgroundColor: '#e0f2ef',
    },
    metadataBadgeText: {
        fontSize: 10,
        fontWeight: '600',
    },
    metadataBadgeTextLocal: {
        color: Colors.amber[800],
    },
    metadataBadgeTextCloud: {
        color: '#0f766e',
    },
    toolbar: {
        borderTopWidth: 1,
        borderTopColor: '#dce7e1',
        backgroundColor: '#f8fbf9',
        paddingHorizontal: 10,
        paddingTop: 8,
        paddingBottom: Platform.OS === 'ios' ? 24 : 8,
    },
    toolbarPrimary: { alignItems: 'center', minHeight: 52 },
    micAccessoryContainer: {
        justifyContent: 'center',
        alignItems: 'center',
        marginLeft: 0,
        marginRight: 6,
        marginBottom: 0,
        width: 40,
        height: 40,
    },
    micAccessory: {
        width: 40,
        height: 40,
        alignItems: 'center',
        justifyContent: 'center',
        borderRadius: 20,
        backgroundColor: Colors.slate[100],
    },
    micAccessoryActive: {
        backgroundColor: Colors.red[500],
    },
    textInput: {
        flex: 1,
        color: '#13251f',
        backgroundColor: '#edf3f0',
        borderRadius: 20,
        borderWidth: 1,
        borderColor: '#cddbd5',
        paddingHorizontal: 16,
        paddingTop: 8,
        paddingBottom: 8,
        minHeight: 40,
        fontSize: 16,
        lineHeight: 20,
        marginTop: 0,
        marginLeft: 0,
        marginRight: 8,
        maxHeight: 120,
    },
    sendContainer: {
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 0,
        width: 40,
        height: 40,
    },
    sendCircle: {
        width: 40,
        height: 40,
        borderRadius: 14,
        justifyContent: 'center',
        alignItems: 'center',
        shadowColor: '#173a31',
        shadowOpacity: 0.16,
        shadowRadius: 10,
        shadowOffset: { width: 0, height: 5 },
        elevation: 2,
    },
});

