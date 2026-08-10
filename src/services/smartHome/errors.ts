const CONNECTION_MESSAGE = 'Không thể kết nối Server API. Vui lòng kiểm tra backend và đường truyền.';
const TIMEOUT_MESSAGE = 'Yêu cầu quá thời gian chờ. Vui lòng kiểm tra kết nối và thử lại.';

export function describeHttpFailure(status: number, serverMessage: string, path: string): string {
    const message = serverMessage.trim();
    if (status === 401 && path === '/api/auth/login') {
        return 'Tên đăng nhập hoặc mật khẩu không đúng.';
    }
    if (status === 401) {
        return 'Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.';
    }
    if (status === 403 && /home is suspended/i.test(message)) {
        return 'Nhà đang bị tạm khóa.';
    }
    if (status === 403 && /device permission denied|permission denied|forbidden/i.test(message)) {
        return 'Bạn không có quyền điều khiển thiết bị.';
    }
    if (status === 403) {
        return 'Bạn không có quyền thực hiện thao tác này.';
    }
    if (status === 409) {
        return message || 'Dữ liệu đã tồn tại hoặc vừa được cập nhật.';
    }
    return message || `Server API trả về mã ${status}.`;
}

export function describeApiFailure(error: unknown): string {
    const message = error instanceof Error ? error.message.trim() : '';
    const name = error instanceof Error ? error.name : '';
    if (name === 'AbortError' || /signal is aborted|aborted without reason|timeout|quá thời gian/i.test(message)) {
        return TIMEOUT_MESSAGE;
    }
    if (/failed to fetch|network request failed|load failed|không thể kết nối/i.test(message)) {
        return CONNECTION_MESSAGE;
    }
    if (/device permission denied/i.test(message)) {
        return 'Bạn không có quyền điều khiển thiết bị.';
    }
    return message || 'Không thể hoàn tất yêu cầu. Vui lòng thử lại.';
}

export function isAmbiguousMutationFailure(error: unknown): boolean {
    const message = error instanceof Error ? error.message : '';
    const name = error instanceof Error ? error.name : '';
    return name === 'AbortError'
        || /failed to fetch|network request failed|load failed|signal is aborted|aborted without reason|timeout|quá thời gian|không thể kết nối/i.test(message);
}
