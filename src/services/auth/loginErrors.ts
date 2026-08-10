export function describeLoginFailure(error: unknown): string {
    const message = error instanceof Error ? error.message : '';
    if (/failed to fetch|network request failed|abort|không thể kết nối/i.test(message)) {
        return 'Không thể kết nối Server API. Hãy kiểm tra backend cổng 5001 và tải lại trang.';
    }
    if (/signal is aborted|aborted without reason|timeout|quá thời gian/i.test(message)) {
        return 'Yêu cầu đăng nhập quá thời gian chờ. Vui lòng thử lại.';
    }
    return message || 'Không thể đăng nhập server';
}
