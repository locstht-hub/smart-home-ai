export type DashboardRole = 'system_admin' | 'owner' | 'member' | 'viewer' | undefined;

export interface DashboardPermissions {
    role: DashboardRole;
    canManageDevices?: boolean;
    canManageMembers?: boolean;
}

export function canControlDevices(user: DashboardPermissions): boolean {
    if (user.role === 'system_admin' || user.role === 'viewer') return false;
    return user.role === 'owner' || (user.role === 'member' && user.canManageDevices === true);
}

export function canManageMembers(user: DashboardPermissions): boolean {
    return user.role === 'owner' && user.canManageMembers === true;
}

export function describeDataSource(source?: string): string {
    if (source === 'plc-s7-1200') return 'PLC S7-1200';
    if (source === 'mock-fallback') return 'Mô phỏng dự phòng';
    if (source === 'mock') return 'Dữ liệu mô phỏng';
    return source?.trim() || 'Chưa xác định';
}

export function classifyControlFailure(message: string): string {
    if (/mismatch/i.test(message)) return 'Phản hồi PLC không khớp trạng thái yêu cầu.';
    if (/timeout|timed out|abort/i.test(message)) return 'Quá thời gian chờ phản hồi.';
    if (/forbidden|permission|không có quyền|device scope/i.test(message)) {
        return 'Bạn không có quyền điều khiển thiết bị này.';
    }
    if (/quota|hạn mức/i.test(message)) return 'Lệnh bị chặn do đã chạm hạn mức năng lượng.';
    if (/plc/i.test(message)) return 'Không thể kết nối hoặc nhận phản hồi từ PLC.';
    if (/network|fetch|server|api/i.test(message)) return 'Không thể kết nối API.';
    return message || 'Không thể điều khiển thiết bị.';
}

export function isProductionApiUrlAllowed(value: string): boolean {
    try {
        return new URL(value).protocol === 'https:';
    } catch {
        return false;
    }
}
