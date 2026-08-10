import React, { useCallback, useState } from 'react';
import { ActivityIndicator, Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import { AppTheme } from '../constants/theme';

export type ConfirmationOptions = {
    title: string;
    message: string;
    confirmLabel?: string;
    cancelLabel?: string;
    destructive?: boolean;
    onConfirm: () => void | Promise<void>;
};

type ConfirmDialogProps = ConfirmationOptions & {
    visible: boolean;
    isProcessing: boolean;
    onCancel: () => void;
};

export function ConfirmDialog({
    visible,
    title,
    message,
    confirmLabel = 'Xác nhận',
    cancelLabel = 'Hủy',
    destructive = false,
    isProcessing,
    onCancel,
    onConfirm,
}: ConfirmDialogProps) {
    return (
        <Modal visible={visible} transparent animationType="fade" onRequestClose={onCancel}>
            <View style={styles.overlay} accessibilityViewIsModal>
                <View style={styles.dialog} accessibilityRole="alert">
                    <Text style={styles.title}>{title}</Text>
                    <Text style={styles.message}>{message}</Text>
                    <View style={styles.actions}>
                        <Pressable
                            accessibilityRole="button"
                            accessibilityLabel={cancelLabel}
                            accessibilityState={{ disabled: isProcessing }}
                            disabled={isProcessing}
                            onPress={onCancel}
                            style={({ pressed, focused }: any) => [styles.button, styles.cancelButton, pressed && styles.pressed, focused && styles.focused]}
                        >
                            <Text style={styles.cancelText}>{cancelLabel}</Text>
                        </Pressable>
                        <Pressable
                            accessibilityRole="button"
                            accessibilityLabel={confirmLabel}
                            accessibilityState={{ disabled: isProcessing, busy: isProcessing }}
                            disabled={isProcessing}
                            onPress={() => void onConfirm()}
                            style={({ pressed, focused }: any) => [
                                styles.button,
                                destructive ? styles.destructiveButton : styles.confirmButton,
                                pressed && styles.pressed,
                                focused && styles.focused,
                            ]}
                        >
                            {isProcessing ? <ActivityIndicator color="#ffffff" size="small" /> : <Text style={styles.confirmText}>{confirmLabel}</Text>}
                        </Pressable>
                    </View>
                </View>
            </View>
        </Modal>
    );
}

export function useConfirmDialog() {
    const [request, setRequest] = useState<ConfirmationOptions | null>(null);
    const [isProcessing, setIsProcessing] = useState(false);

    const confirm = useCallback((options: ConfirmationOptions) => {
        setRequest(options);
    }, []);

    const cancel = useCallback(() => {
        if (!isProcessing) setRequest(null);
    }, [isProcessing]);

    const accept = useCallback(async () => {
        if (!request || isProcessing) return;
        setIsProcessing(true);
        try {
            await request.onConfirm();
            setRequest(null);
        } finally {
            setIsProcessing(false);
        }
    }, [isProcessing, request]);

    const confirmDialog = request ? (
        <ConfirmDialog
            {...request}
            visible
            isProcessing={isProcessing}
            onCancel={cancel}
            onConfirm={accept}
        />
    ) : null;

    return { confirm, confirmDialog, isConfirming: isProcessing };
}

const styles = StyleSheet.create({
    overlay: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 20, backgroundColor: 'rgba(15, 35, 29, 0.58)' },
    dialog: { width: '100%', maxWidth: 440, padding: 24, borderRadius: 22, backgroundColor: AppTheme.colors.surface, borderWidth: 1, borderColor: AppTheme.colors.border, shadowColor: '#10251f', shadowOpacity: 0.22, shadowRadius: 28, shadowOffset: { width: 0, height: 16 }, elevation: 8 },
    title: { color: AppTheme.colors.ink, fontSize: 20, lineHeight: 26, fontWeight: '700', letterSpacing: -0.3 },
    message: { marginTop: 10, color: AppTheme.colors.inkMuted, fontSize: 14, lineHeight: 21 },
    actions: { marginTop: 22, flexDirection: 'row', justifyContent: 'flex-end', gap: 10 },
    button: { minWidth: 112, minHeight: 46, paddingHorizontal: 16, borderRadius: 13, alignItems: 'center', justifyContent: 'center', borderWidth: 1 },
    cancelButton: { backgroundColor: AppTheme.colors.surfaceMuted, borderColor: AppTheme.colors.border },
    confirmButton: { backgroundColor: AppTheme.colors.brand, borderColor: AppTheme.colors.brand },
    destructiveButton: { backgroundColor: '#b42318', borderColor: '#b42318' },
    cancelText: { color: AppTheme.colors.inkMuted, fontWeight: '600' },
    confirmText: { color: '#ffffff', fontWeight: '700' },
    pressed: { opacity: 0.86, transform: [{ translateY: 1 }] },
    focused: { borderColor: '#2dd4bf', shadowColor: '#0f766e', shadowOpacity: 0.3, shadowRadius: 0, shadowOffset: { width: 0, height: 0 } },
});
