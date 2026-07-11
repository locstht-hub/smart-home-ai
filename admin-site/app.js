const API_BASE_URL = 'https://api.smarthomeai.id.vn';
const TOKEN_KEY = 'smartHomeAdminToken';
const USER_KEY = 'smartHomeAdminUser';

const state = {
  token: localStorage.getItem(TOKEN_KEY) || '',
  user: JSON.parse(localStorage.getItem(USER_KEY) || 'null'),
  homes: [],
  users: [],
  logs: [],
  selectedHomeId: '',
  homeDetail: null,
  editingRoomId: '',
  editingDeviceId: '',
};

const els = {
  loginPanel: document.getElementById('loginPanel'),
  loginForm: document.getElementById('loginForm'),
  loginMessage: document.getElementById('loginMessage'),
  usernameInput: document.getElementById('usernameInput'),
  passwordInput: document.getElementById('passwordInput'),
  workspace: document.getElementById('workspace'),
  sessionName: document.getElementById('sessionName'),
  logoutBtn: document.getElementById('logoutBtn'),
  refreshAllBtn: document.getElementById('refreshAllBtn'),
  createOwnerTopBtn: document.getElementById('createOwnerTopBtn'),
  createOwnerHomeBtn: document.getElementById('createOwnerHomeBtn'),
  apiStatus: document.getElementById('apiStatus'),
  pageTitle: document.getElementById('pageTitle'),
  navItems: Array.from(document.querySelectorAll('.nav-item')),
  views: {
    overview: document.getElementById('overviewView'),
    homes: document.getElementById('homesView'),
    users: document.getElementById('usersView'),
    homeDetail: document.getElementById('homeDetailView'),
    logs: document.getElementById('logsView'),
  },
  homeCount: document.getElementById('homeCount'),
  userCount: document.getElementById('userCount'),
  ownerCount: document.getElementById('ownerCount'),
  logCount: document.getElementById('logCount'),
  recentHomesBody: document.getElementById('recentHomesBody'),
  recentLogsList: document.getElementById('recentLogsList'),
  homesBody: document.getElementById('homesBody'),
  usersBody: document.getElementById('usersBody'),
  logsBody: document.getElementById('logsBody'),
  backToHomesBtn: document.getElementById('backToHomesBtn'),
  refreshHomeDetailBtn: document.getElementById('refreshHomeDetailBtn'),
  detailHomeName: document.getElementById('detailHomeName'),
  detailHomeId: document.getElementById('detailHomeId'),
  homeDetailSummary: document.getElementById('homeDetailSummary'),
  homeOverviewGrid: document.getElementById('homeOverviewGrid'),
  homeRoomsBody: document.getElementById('homeRoomsBody'),
  homeDevicesBody: document.getElementById('homeDevicesBody'),
  homeMembersBody: document.getElementById('homeMembersBody'),
  homeLogsBody: document.getElementById('homeLogsBody'),
  roomInventoryForm: document.getElementById('roomInventoryForm'),
  roomNameInput: document.getElementById('roomNameInput'),
  roomTypeInput: document.getElementById('roomTypeInput'),
  roomSortInput: document.getElementById('roomSortInput'),
  roomFormMessage: document.getElementById('roomFormMessage'),
  roomSubmitBtn: document.getElementById('roomSubmitBtn'),
  cancelRoomEditBtn: document.getElementById('cancelRoomEditBtn'),
  deviceInventoryForm: document.getElementById('deviceInventoryForm'),
  deviceNameInput: document.getElementById('deviceNameInput'),
  deviceRoomSelect: document.getElementById('deviceRoomSelect'),
  deviceTypeSelect: document.getElementById('deviceTypeSelect'),
  devicePowerInput: document.getElementById('devicePowerInput'),
  deviceStatusSelect: document.getElementById('deviceStatusSelect'),
  deviceControllableInput: document.getElementById('deviceControllableInput'),
  deviceFormMessage: document.getElementById('deviceFormMessage'),
  deviceSubmitBtn: document.getElementById('deviceSubmitBtn'),
  cancelDeviceEditBtn: document.getElementById('cancelDeviceEditBtn'),
  detailTabs: Array.from(document.querySelectorAll('.detail-tab')),
  detailTabPanels: Array.from(document.querySelectorAll('.detail-tab-panel')),
  ownerModal: document.getElementById('ownerModal'),
  ownerForm: document.getElementById('ownerForm'),
  ownerFormMessage: document.getElementById('ownerFormMessage'),
  ownerNameInput: document.getElementById('ownerNameInput'),
  ownerUsernameInput: document.getElementById('ownerUsernameInput'),
  ownerPhoneInput: document.getElementById('ownerPhoneInput'),
  ownerPasswordInput: document.getElementById('ownerPasswordInput'),
  homeNameInput: document.getElementById('homeNameInput'),
  closeOwnerModalBtn: document.getElementById('closeOwnerModalBtn'),
  cancelOwnerModalBtn: document.getElementById('cancelOwnerModalBtn'),
};

const titles = {
  overview: 'Tổng quan hệ thống',
  homes: 'Danh sách nhà',
  users: 'Danh sách tài khoản',
  homeDetail: 'Chi tiết nhà',
  logs: 'Lịch sử hoạt động',
};

const roleLabels = {
  system_admin: 'Quản trị hệ thống',
  owner: 'Tài khoản cha',
  member: 'Thành viên',
  viewer: 'Chỉ xem',
};

const statusLabels = {
  active: 'Hoạt động',
  suspended: 'Tạm khóa',
};

const auditActionLabels = {
  'admin.view_homes': 'Xem danh sách nhà',
  'admin.view_users': 'Xem danh sách tài khoản',
  'admin.view_audit_logs': 'Xem lịch sử hoạt động',
  'admin.create_owner_home': 'Tạo chủ nhà',
  'admin.suspend_user': 'Khóa tài khoản',
  'admin.activate_user': 'Mở khóa tài khoản',
  'admin.reset_user_password': 'Đặt lại mật khẩu',
  'admin.suspend_home': 'Khóa nhà',
  'admin.activate_home': 'Mở nhà',
  'auth.login_success': 'Đăng nhập thành công',
  'auth.login_failed': 'Đăng nhập thất bại',
  'auth.change_password': 'Đổi mật khẩu',
  'home.view_members': 'Xem thành viên nhà',
  'home.view_activity': 'Xem nhật ký nhà',
  'home.view_quota': 'Xem hạn mức điện',
  'home.quota_updated': 'Cập nhật hạn mức điện',
  'room.created': 'Thêm phòng',
  'room.updated': 'Sửa phòng',
  'room.deleted': 'Xóa phòng',
  'device.inventory_created': 'Thêm thiết bị',
  'device.inventory_updated': 'Sửa thiết bị',
  'device.inventory_deleted': 'Xóa thiết bị',
};

const roomTypeLabels = {
  room: 'Phòng',
  area: 'Khu vực',
  floor: 'Tầng',
};

const sourceLabels = {
  'manual-inventory': 'Khai báo thủ công',
  server: 'Thiết bị PLC',
  mock: 'Mô phỏng',
  'plc-s7-1200': 'PLC S7-1200',
};

function displayUserName(user) {
  if (!user) return '';
  if (user.role === 'system_admin' && user.name === 'System Admin') {
    return 'Quản trị hệ thống';
  }
  return user.name || user.username || '';
}

function formatAuditAction(action) {
  return auditActionLabels[action] || action || '-';
}

function formatSource(source) {
  return sourceLabels[source] || source || '-';
}

function formatRoomType(type) {
  return roomTypeLabels[type] || type || '-';
}

function escapeHtml(value) {
  return String(value ?? '')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');
}

function formatDate(value) {
  if (!value) return '-';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '-';
  const day = String(date.getDate()).padStart(2, '0');
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const year = date.getFullYear();
  const hour = String(date.getHours()).padStart(2, '0');
  const minute = String(date.getMinutes()).padStart(2, '0');
  return `${day}/${month}/${year} ${hour}:${minute}`;
}

function formatNumber(value, suffix = '') {
  const number = Number(value);
  if (!Number.isFinite(number)) return '-';
  return `${number.toLocaleString('vi-VN', { maximumFractionDigits: 2 })}${suffix}`;
}

function roomLabel(roomId) {
  const labels = {
    living: 'Phòng khách',
    kitchen: 'Phòng bếp',
    bedroom: 'Phòng ngủ',
    bathroom: 'Nhà vệ sinh',
    garage: 'Nhà xe',
  };
  return labels[roomId] || roomId || '-';
}

async function apiFetch(path, options = {}) {
  const headers = {
    'Content-Type': 'application/json',
    ...(options.headers || {}),
  };

  if (state.token) {
    headers.Authorization = `Bearer ${state.token}`;
  }

  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...options,
    headers,
  });

  const text = await response.text();
  const data = text ? JSON.parse(text) : {};

  if (!response.ok) {
    throw new Error(data.error || `API trả về mã ${response.status}`);
  }

  return data;
}

function setApiStatus(text, mode = '') {
  els.apiStatus.textContent = text;
  els.apiStatus.className = `api-status ${mode}`.trim();
}

function setAuthenticated(isAuthenticated) {
  els.loginPanel.classList.toggle('hidden', isAuthenticated);
  els.workspace.classList.toggle('hidden', !isAuthenticated);
  els.refreshAllBtn.classList.toggle('hidden', !isAuthenticated);
  els.createOwnerTopBtn.classList.toggle('hidden', !isAuthenticated);
  els.logoutBtn.disabled = !isAuthenticated;
  els.logoutBtn.setAttribute('aria-disabled', String(!isAuthenticated));
  els.sessionName.textContent = state.user
    ? `${displayUserName(state.user)} (${roleLabels[state.user.role] || state.user.role})`
    : 'Chưa đăng nhập';
}

function statusBadge(status) {
  const safe = escapeHtml(status || 'unknown');
  const label = statusLabels[status] || safe;
  return `<span class="badge ${safe}">${escapeHtml(label)}</span>`;
}

function deviceStatusBadge(isOn) {
  return `<span class="badge ${isOn ? 'active' : 'off'}">${isOn ? 'Đang bật' : 'Đang tắt'}</span>`;
}

function quotaStatusBadge(percent) {
  if (!Number.isFinite(percent)) return '<span class="badge off">Chưa có quota</span>';
  if (percent >= 100) return '<span class="badge quota-danger">Đã vượt hạn mức</span>';
  if (percent >= 80) return '<span class="badge quota-warn">Sắp vượt</span>';
  return '<span class="badge quota-ok">Bình thường</span>';
}

function roleBadge(role) {
  const safe = escapeHtml(role || 'unknown');
  const label = roleLabels[role] || safe;
  return `<span class="role ${safe}">${escapeHtml(label)}</span>`;
}

function homeIdCell(homeId) {
  const safeHomeId = escapeHtml(homeId || '-');
  if (!homeId) return '<span class="empty-row">-</span>';

  return `
    <div class="home-id-cell">
      <code>${safeHomeId}</code>
      <button class="copy-id-btn" data-copy-home-id="${safeHomeId}" type="button" title="Sao chép mã nhà">
        Sao chép
      </button>
    </div>
  `;
}

function homeIdsCell(homeIds) {
  const ids = Array.isArray(homeIds) ? homeIds.filter(Boolean) : [];
  if (ids.length === 0) return '<span class="empty-row">-</span>';

  return `
    <div class="home-id-list">
      ${ids.map((homeId) => homeIdCell(homeId)).join('')}
    </div>
  `;
}

function emptyRow(colspan, text) {
  return `<tr><td class="empty-row" colspan="${colspan}">${escapeHtml(text)}</td></tr>`;
}

function isSystemAdmin(user) {
  return user.role === 'system_admin';
}

function homeActions(home) {
  const action = home.status === 'suspended' ? 'activate' : 'suspend';
  const label = home.status === 'suspended' ? 'Mở nhà' : 'Khóa nhà';
  const mode = home.status === 'suspended' ? 'ok' : 'warn';
  return `
    <div class="row-actions">
      <button class="action-btn" data-home-detail-id="${escapeHtml(home.id)}" type="button">
        Chi tiết
      </button>
      <button class="action-btn ${mode}" data-home-action="${action}" data-home-id="${escapeHtml(home.id)}" type="button">
        ${label}
      </button>
    </div>
  `;
}

function userActions(user) {
  if (isSystemAdmin(user)) {
    return '<span class="empty-row">Không áp dụng</span>';
  }

  const statusAction = user.status === 'suspended' ? 'activate' : 'suspend';
  const statusLabel = user.status === 'suspended' ? 'Mở khóa' : 'Khóa';
  const statusMode = user.status === 'suspended' ? 'ok' : 'warn';
  return `
    <div class="row-actions">
      <button class="action-btn ${statusMode}" data-user-action="${statusAction}" data-user-id="${escapeHtml(user.id)}" type="button">
        ${statusLabel}
      </button>
      <button class="action-btn" data-user-action="reset-password" data-user-id="${escapeHtml(user.id)}" type="button">
        Reset mật khẩu
      </button>
    </div>
  `;
}

function renderHomes() {
  const rows = state.homes.map((home) => `
    <tr>
      <td><strong>${escapeHtml(home.name)}</strong></td>
      <td>${homeIdCell(home.id)}</td>
      <td>${escapeHtml(home.ownerName || '-')}</td>
      <td>${escapeHtml(home.ownerUsername || '-')}</td>
      <td>${escapeHtml(home.memberCount ?? 0)}</td>
      <td>${escapeHtml(home.roomCount ?? 0)}</td>
      <td>${escapeHtml(home.deviceCount ?? 0)}</td>
      <td>${formatNumber(home.totalRatedPowerW || 0, ' W')}</td>
      <td>${formatDate(home.createdAt)}</td>
      <td>${statusBadge(home.status)}</td>
      <td>${homeActions(home)}</td>
    </tr>
  `).join('');

  els.homesBody.innerHTML = rows || emptyRow(11, 'Chưa có nhà nào trong hệ thống.');
  els.recentHomesBody.innerHTML = state.homes.slice(0, 5).map((home) => `
    <tr>
      <td><strong>${escapeHtml(home.name)}</strong></td>
      <td>${homeIdCell(home.id)}</td>
      <td>${escapeHtml(home.ownerName || '-')}</td>
      <td>${escapeHtml(home.memberCount ?? 0)}</td>
      <td>${escapeHtml(home.deviceCount ?? 0)}</td>
      <td>${statusBadge(home.status)}</td>
    </tr>
  `).join('') || emptyRow(6, 'Chưa có dữ liệu nhà.');
}

function renderUsers() {
  els.usersBody.innerHTML = state.users.map((user) => `
    <tr>
      <td><strong>${escapeHtml(displayUserName(user))}</strong></td>
      <td>${escapeHtml(user.username)}</td>
      <td>${homeIdsCell(user.homeIds)}</td>
      <td>${escapeHtml(user.phone || '-')}</td>
      <td>${roleBadge(user.role)}</td>
      <td>${formatDate(user.lastActive)}</td>
      <td>${statusBadge(user.status)}</td>
      <td>${userActions(user)}</td>
    </tr>
  `).join('') || emptyRow(8, 'Chưa có tài khoản nào trong hệ thống.');
}

function renderLogs() {
  els.logsBody.innerHTML = state.logs.map((log) => `
    <tr>
      <td>${formatDate(log.createdAt)}</td>
      <td>${escapeHtml(log.actorUsername || '-')}</td>
      <td>${escapeHtml(roleLabels[log.actorRole] || log.actorRole || '-')}</td>
      <td><strong>${escapeHtml(formatAuditAction(log.action))}</strong></td>
      <td>${escapeHtml(log.targetName || log.targetId || log.targetType || '-')}</td>
      <td>${escapeHtml(log.ipAddress || '-')}</td>
    </tr>
  `).join('') || emptyRow(6, 'Chưa có nhật ký nào.');

  els.recentLogsList.innerHTML = state.logs.slice(0, 8).map((log) => `
    <div class="log-item">
      <strong>${escapeHtml(formatAuditAction(log.action))}</strong>
      <span>${escapeHtml(log.actorUsername || '-')} - ${formatDate(log.createdAt)}</span>
    </div>
  `).join('') || '<div class="log-item"><strong>Chưa có hoạt động</strong><span>Nhật ký sẽ xuất hiện khi có thao tác mới.</span></div>';
}

function renderOverview() {
  els.homeCount.textContent = state.homes.length;
  els.userCount.textContent = state.users.length;
  els.ownerCount.textContent = state.users.filter((user) => user.role === 'owner').length;
  els.logCount.textContent = state.logs.length;
}

function detailCard(label, value, hint = '') {
  return `
    <article class="detail-card">
      <span>${escapeHtml(label)}</span>
      <div class="detail-card-value">${value}</div>
      ${hint ? `<small>${escapeHtml(hint)}</small>` : ''}
    </article>
  `;
}

function flattenDevices(devicesByRoom) {
  if (!devicesByRoom || typeof devicesByRoom !== 'object') return [];
  return Object.entries(devicesByRoom).flatMap(([roomId, devices]) =>
    (Array.isArray(devices) ? devices : []).map((device) => ({ ...device, roomId: device.roomId || roomId })),
  );
}

function normalizeManualDevices(devices) {
  return (Array.isArray(devices) ? devices : []).map((device) => ({
    id: device.id,
    name: device.name,
    roomId: device.roomId || '',
    power: Number(device.ratedPowerW || 0),
    ratedPowerW: Number(device.ratedPowerW || 0),
    type: device.type || 'other',
    status: device.status || 'unknown',
    isControllable: Boolean(device.isControllable ?? true),
    source: 'manual-inventory',
  }));
}

function inventoryStatusBadge(status) {
  if (status === 'on') return '<span class="badge active">Đang bật</span>';
  if (status === 'off') return '<span class="badge off">Đang tắt</span>';
  if (status === 'offline') return '<span class="badge suspended">Mất kết nối</span>';
  return '<span class="badge off">Khai báo thủ công</span>';
}

function resetRoomForm() {
  state.editingRoomId = '';
  els.roomInventoryForm.reset();
  els.roomTypeInput.value = 'room';
  els.roomSortInput.value = '0';
  els.roomFormMessage.textContent = '';
  els.roomSubmitBtn.textContent = 'Thêm phòng';
  els.cancelRoomEditBtn.classList.add('hidden');
}

function resetDeviceForm() {
  state.editingDeviceId = '';
  els.deviceInventoryForm.reset();
  els.devicePowerInput.value = '0';
  els.deviceStatusSelect.value = 'unknown';
  els.deviceTypeSelect.value = 'light';
  els.deviceControllableInput.checked = true;
  els.deviceFormMessage.textContent = '';
  els.deviceSubmitBtn.textContent = 'Thêm thiết bị';
  els.cancelDeviceEditBtn.classList.add('hidden');
}

function renderDeviceRoomOptions(rooms, selectedRoomId = '') {
  els.deviceRoomSelect.innerHTML = `
    <option value="">Không gán phòng</option>
    ${rooms.map((room) => `
      <option value="${escapeHtml(room.id)}">${escapeHtml(room.name)}</option>
    `).join('')}
  `;
  els.deviceRoomSelect.value = selectedRoomId || '';
}

function inventoryActions(kind, id) {
  return `
    <div class="row-actions">
      <button class="action-btn" data-${kind}-action="edit" data-${kind}-id="${escapeHtml(id)}" type="button">Sửa</button>
      <button class="action-btn danger" data-${kind}-action="delete" data-${kind}-id="${escapeHtml(id)}" type="button">Xóa</button>
    </div>
  `;
}

function renderHomeDetail(home, detail) {
  const quota = detail.quota || {};
  const members = detail.members || [];
  const logs = detail.logs || [];
  const rooms = detail.rooms || [];
  const devices = detail.devices || [];
  const devicesError = detail.devicesError || '';
  const used = Number(quota.currentMonthEnergyKwh || 0);
  const limit = Number(quota.energyLimitKwh || 0);
  const quotaPercent = limit > 0 ? Math.min((used / limit) * 100, 999) : 0;
  const deviceCountValue = devicesError ? '<span class="muted-value">Chưa lấy được</span>' : escapeHtml(String(devices.length));
  const roomCountValue = devicesError ? '<span class="muted-value">-</span>' : escapeHtml(String(rooms.length));
  const totalRatedPowerW = devices.reduce((sum, device) => sum + Number(device.power || device.ratedPowerW || 0), 0);
  const roomNameMap = Object.fromEntries(rooms.map((room) => [room.id, room.name]));
  const deviceHint = devicesError
    ? 'Thiết bị PLC/API chưa sẵn sàng, bấm làm mới khi máy chủ đọc được PLC'
    : 'Ưu tiên danh mục thủ công; nếu chưa khai báo thì hiển thị thiết bị PLC';

  els.detailHomeName.textContent = home?.name || 'Chi tiết nhà';
  els.detailHomeId.innerHTML = homeIdCell(home?.id || state.selectedHomeId);
  els.homeDetailSummary.innerHTML = `
    ${detailCard('Chủ nhà', escapeHtml(home?.ownerName || '-'), home?.ownerUsername || '')}
    ${detailCard('Trạng thái nhà', statusBadge(home?.status || 'unknown'))}
    ${detailCard('Thành viên', escapeHtml(String(home?.memberCount ?? members.length ?? 0)), 'Tài khoản trong nhà')}
    ${detailCard('Ngày tạo', escapeHtml(formatDate(home?.createdAt)))}
  `;

  els.homeOverviewGrid.innerHTML = `
    ${detailCard('Mã nhà', homeIdCell(home?.id || state.selectedHomeId), 'Mã dùng để gán PLC, thiết bị, phòng và hạn mức')}
    ${detailCard('Quota tháng', `${escapeHtml(`${formatNumber(used, ' kWh')} / ${formatNumber(limit, ' kWh')}`)} ${quotaStatusBadge(quotaPercent)}`, `${formatNumber(quotaPercent, '%')} đã dùng`)}
    ${detailCard('Phòng khai báo', roomCountValue, 'Số phòng trong danh mục thủ công')}
    ${detailCard('Thiết bị khai báo', deviceCountValue, deviceHint)}
    ${detailCard('Công suất định mức', escapeHtml(formatNumber(totalRatedPowerW, ' W')), 'Tổng ratedPowerW của thiết bị')}
    ${detailCard('Log của nhà', escapeHtml(String(logs.length)), 'Hoạt động gần nhất')}
  `;

  if (!state.editingDeviceId) {
    renderDeviceRoomOptions(rooms);
  } else {
    renderDeviceRoomOptions(rooms, els.deviceRoomSelect.value);
  }

  els.homeRoomsBody.innerHTML = rooms.map((room) => `
    <tr>
      <td><strong>${escapeHtml(room.name || '-')}</strong></td>
      <td>${escapeHtml(formatRoomType(room.type || 'room'))}</td>
      <td>${escapeHtml(room.sortOrder ?? 0)}</td>
      <td>${inventoryActions('room', room.id)}</td>
    </tr>
  `).join('') || emptyRow(4, 'Chưa có phòng nào. Hãy thêm phòng đầu tiên cho nhà này.');

  els.homeDevicesBody.innerHTML = devices.map((device) => `
    <tr>
      <td><strong>${escapeHtml(device.name || device.id || '-')}</strong></td>
      <td>${escapeHtml(roomNameMap[device.roomId] || roomLabel(device.roomId))}</td>
      <td>${formatNumber(device.power ?? device.ratedPowerW ?? 0, ' W')}</td>
      <td>${device.status ? inventoryStatusBadge(device.status) : deviceStatusBadge(device.isOn)}</td>
      <td>${escapeHtml(formatSource(device.source))}</td>
      <td>${device.source === 'manual-inventory' ? inventoryActions('device', device.id) : '<span class="empty-row">Chỉ xem</span>'}</td>
    </tr>
  `).join('') || emptyRow(6, devicesError ? 'Chưa lấy được thiết bị. Kiểm tra PLC/API rồi bấm làm mới chi tiết.' : 'Chưa có cấu hình thiết bị riêng cho nhà này.');

  els.homeMembersBody.innerHTML = members.map((member) => `
    <tr>
      <td><strong>${escapeHtml(member.name || '-')}</strong></td>
      <td>${escapeHtml(member.username || '-')}</td>
      <td>${escapeHtml(roleLabels[member.roleInHome] || member.roleInHome || member.role || '-')}</td>
      <td>${member.canManageDevices ? 'Có' : 'Không'}</td>
      <td>${statusBadge(member.status)}</td>
    </tr>
  `).join('') || emptyRow(5, 'Chưa có thành viên nào trong nhà này.');

  els.homeLogsBody.innerHTML = logs.map((log) => `
    <tr>
      <td>${formatDate(log.createdAt)}</td>
      <td>${escapeHtml(log.actorUsername || '-')}</td>
      <td><strong>${escapeHtml(formatAuditAction(log.action))}</strong></td>
      <td>${escapeHtml(log.targetName || log.targetId || log.targetType || '-')}</td>
      <td>${escapeHtml(log.ipAddress || '-')}</td>
    </tr>
  `).join('') || emptyRow(5, 'Chưa có nhật ký riêng cho nhà này.');
}

async function openHomeDetail(homeId, options = {}) {
  const home = state.homes.find((item) => item.id === homeId);
  if (!home) {
    setApiStatus('Không tìm thấy mã nhà trong danh sách nhà', 'error');
    return;
  }

  if (!options.keepFormState) {
    resetRoomForm();
    resetDeviceForm();
  }

  state.selectedHomeId = homeId;
  switchView('homeDetail');
  setApiStatus(`Đang tải chi tiết ${homeId}...`, '');

  const [quotaResult, membersResult, logsResult, roomsResult, manualDevicesResult, plcDevicesResult] = await Promise.allSettled([
    apiFetch(`/api/homes/${encodeURIComponent(homeId)}/quota`),
    apiFetch(`/api/homes/${encodeURIComponent(homeId)}/members`),
    apiFetch(`/api/homes/${encodeURIComponent(homeId)}/activity?limit=80`),
    apiFetch(`/api/homes/${encodeURIComponent(homeId)}/rooms`),
    apiFetch(`/api/homes/${encodeURIComponent(homeId)}/devices`),
    apiFetch(`/api/devices?homeId=${encodeURIComponent(homeId)}`),
  ]);

  const manualDevices = manualDevicesResult.status === 'fulfilled'
    ? normalizeManualDevices(manualDevicesResult.value.devices)
    : [];
  const plcDevices = plcDevicesResult.status === 'fulfilled'
    ? flattenDevices(plcDevicesResult.value.devices)
    : [];
  const devices = manualDevices.length ? manualDevices : plcDevices;
  const devicesError = manualDevicesResult.status === 'rejected' && plcDevicesResult.status === 'rejected'
    ? manualDevicesResult.reason?.message || plcDevicesResult.reason?.message || 'Không lấy được thiết bị'
    : '';

  const detail = {
    quota: quotaResult.status === 'fulfilled' ? quotaResult.value.quota : null,
    members: membersResult.status === 'fulfilled' ? membersResult.value.members || [] : [],
    logs: logsResult.status === 'fulfilled' ? logsResult.value.logs || [] : [],
    rooms: roomsResult.status === 'fulfilled' ? roomsResult.value.rooms || [] : [],
    devices,
    devicesError,
  };

  state.homeDetail = { home, ...detail };
  renderHomeDetail(home, detail);
  if (detail.devicesError) {
    setApiStatus(`Đã tải chi tiết mã nhà: ${homeId}, nhưng chưa lấy được danh mục thiết bị`, 'error');
  } else {
    setApiStatus(`Đã tải chi tiết mã nhà: ${homeId}`, 'ok');
  }
}

function renderSparklineChart() {
  const svgLine = document.getElementById('adminChartLine');
  const svgArea = document.getElementById('adminChartArea');
  const statusEl = document.getElementById('adminChartStatus');
  if (!svgLine || !svgArea) return;

  const totalCapacityW = state.homes.reduce((sum, h) => sum + (h.totalRatedPowerW || 0), 0) || 3500;
  const totalCapacityKw = totalCapacityW / 1000;

  const hourlyLoadFactors = [
    0.15, 0.12, 0.10, 0.09, 0.11, 0.18,
    0.35, 0.42, 0.45, 0.38, 0.48, 0.55,
    0.62, 0.58, 0.50, 0.42, 0.52, 0.78,
    0.92, 0.95, 0.88, 0.70, 0.45, 0.25
  ];

  const currentHour = new Date().getHours();
  const rotatedFactors = [];
  for (let i = 0; i < 24; i++) {
    const hr = (currentHour - 23 + i + 24) % 24;
    rotatedFactors.push(hourlyLoadFactors[hr]);
  }

  const width = 1000;
  const height = 160;
  const paddingY = 15;
  const chartHeight = height - paddingY * 2;
  
  const points = rotatedFactors.map((factor, index) => {
    const x = (index / 23) * width;
    const y = height - paddingY - (factor * chartHeight);
    return { x, y };
  });

  const lineD = points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x.toFixed(1)} ${p.y.toFixed(1)}`).join(' ');
  const areaD = `${lineD} L ${width} ${height} L 0 ${height} Z`;

  svgLine.setAttribute('d', lineD);
  svgArea.setAttribute('d', areaD);

  const currentLoadKw = (totalCapacityKw * rotatedFactors[23]).toFixed(2);
  if (statusEl) {
    statusEl.textContent = `Minh họa: ${currentLoadKw} kW / ${totalCapacityKw.toFixed(1)} kW định mức`;
    statusEl.className = 'badge quota-warn';
  }
}

function renderAll() {
  renderHomes();
  renderUsers();
  renderLogs();
  renderOverview();
  renderSparklineChart();
}

async function loadDashboard() {
  setApiStatus('API: đang tải...', '');
  const [homes, users, logs] = await Promise.all([
    apiFetch('/api/admin/homes'),
    apiFetch('/api/admin/users'),
    apiFetch('/api/admin/audit-logs?limit=100'),
  ]);

  state.homes = homes.homes || [];
  state.users = users.users || [];
  state.logs = logs.logs || [];
  renderAll();
  setApiStatus('API: online', 'ok');
}

async function login(username, password) {
  const data = await apiFetch('/api/auth/login', {
    method: 'POST',
    body: JSON.stringify({ username, password }),
  });

  if (data.user.role !== 'system_admin') {
    throw new Error('Tài khoản này không có quyền system_admin.');
  }

  state.token = data.token;
  state.user = data.user;
  localStorage.setItem(TOKEN_KEY, state.token);
  localStorage.setItem(USER_KEY, JSON.stringify(state.user));
  setAuthenticated(true);
  await loadDashboard();
}

function logout() {
  state.token = '';
  state.user = null;
  state.homes = [];
  state.users = [];
  state.logs = [];
  state.selectedHomeId = '';
  state.homeDetail = null;
  state.editingRoomId = '';
  state.editingDeviceId = '';
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(USER_KEY);
  setAuthenticated(false);
  setApiStatus('API: chưa kiểm tra', '');
}

function switchView(name) {
  els.pageTitle.textContent = titles[name] || titles.overview;
  Object.entries(els.views).forEach(([key, view]) => {
    view.classList.toggle('hidden', key !== name);
  });
  els.navItems.forEach((item) => {
    item.classList.toggle('active', item.dataset.view === name);
  });
}

function refreshDashboard() {
  loadDashboard().catch((error) => {
    setApiStatus(`API: ${error.message}`, 'error');
  });
}

function openOwnerModal() {
  els.ownerForm.reset();
  els.ownerFormMessage.textContent = '';
  els.ownerModal.classList.remove('hidden');
  els.ownerNameInput.focus();
}

function closeOwnerModal() {
  els.ownerModal.classList.add('hidden');
}

async function createOwnerHome(event) {
  event.preventDefault();
  els.ownerFormMessage.textContent = '';

  try {
    const result = await apiFetch('/api/admin/owners', {
      method: 'POST',
      body: JSON.stringify({
        ownerName: els.ownerNameInput.value.trim(),
        username: els.ownerUsernameInput.value.trim(),
        phone: els.ownerPhoneInput.value.trim(),
        password: els.ownerPasswordInput.value,
        homeName: els.homeNameInput.value.trim(),
      }),
    });
    closeOwnerModal();
    await loadDashboard();
    switchView('homes');
    const createdHomeId = result.home?.id ? ` - Mã nhà: ${result.home.id}` : '';
    setApiStatus(`API: đã tạo chủ nhà mới${createdHomeId}`, 'ok');
  } catch (error) {
    els.ownerFormMessage.textContent = error.message || 'Không thể tạo chủ nhà';
    setApiStatus(`API: ${error.message}`, 'error');
  }
}

async function updateUserAction(userId, action) {
  if (action === 'reset-password') {
    const password = window.prompt('Nhập mật khẩu mới cho tài khoản này:');
    if (!password) return;
    if (password.length < 6) {
      setApiStatus('API: mật khẩu cần ít nhất 6 ký tự', 'error');
      return;
    }
    await apiFetch(`/api/admin/users/${encodeURIComponent(userId)}/reset-password`, {
      method: 'PATCH',
      body: JSON.stringify({ password }),
    });
    setApiStatus('API: đã reset mật khẩu', 'ok');
    return;
  }

  await apiFetch(`/api/admin/users/${encodeURIComponent(userId)}/${action}`, {
    method: 'PATCH',
  });
  setApiStatus(action === 'suspend' ? 'API: đã khóa tài khoản' : 'API: đã mở khóa tài khoản', 'ok');
}

async function updateHomeAction(homeId, action) {
  await apiFetch(`/api/admin/homes/${encodeURIComponent(homeId)}/${action}`, {
    method: 'PATCH',
  });
  setApiStatus(action === 'suspend' ? 'API: đã khóa nhà' : 'API: đã mở nhà', 'ok');
}

async function refreshCurrentHomeDetail() {
  const homeId = state.selectedHomeId;
  await loadDashboard();
  if (homeId) {
    await openHomeDetail(homeId);
    switchHomeTab('devices');
  }
}

async function submitRoomInventory(event) {
  event.preventDefault();
  if (!state.selectedHomeId) return;

  els.roomFormMessage.textContent = '';
  const payload = {
    name: els.roomNameInput.value.trim(),
    type: els.roomTypeInput.value.trim() || 'room',
    sortOrder: Number(els.roomSortInput.value || 0),
  };

  try {
    const isEditing = Boolean(state.editingRoomId);
    await apiFetch(
      isEditing
        ? `/api/homes/${encodeURIComponent(state.selectedHomeId)}/rooms/${encodeURIComponent(state.editingRoomId)}`
        : `/api/homes/${encodeURIComponent(state.selectedHomeId)}/rooms`,
      {
        method: isEditing ? 'PATCH' : 'POST',
        body: JSON.stringify(payload),
      },
    );
    resetRoomForm();
    setApiStatus(isEditing ? 'API: đã sửa phòng' : 'API: đã thêm phòng', 'ok');
    await refreshCurrentHomeDetail();
  } catch (error) {
    els.roomFormMessage.textContent = error.message || 'Không lưu được phòng';
    setApiStatus(`API: ${error.message}`, 'error');
  }
}

async function submitDeviceInventory(event) {
  event.preventDefault();
  if (!state.selectedHomeId) return;

  els.deviceFormMessage.textContent = '';
  const payload = {
    name: els.deviceNameInput.value.trim(),
    roomId: els.deviceRoomSelect.value || null,
    type: els.deviceTypeSelect.value || 'other',
    status: els.deviceStatusSelect.value || 'unknown',
    ratedPowerW: Number(els.devicePowerInput.value || 0),
    isControllable: els.deviceControllableInput.checked,
  };

  try {
    const isEditing = Boolean(state.editingDeviceId);
    await apiFetch(
      isEditing
        ? `/api/homes/${encodeURIComponent(state.selectedHomeId)}/devices/${encodeURIComponent(state.editingDeviceId)}`
        : `/api/homes/${encodeURIComponent(state.selectedHomeId)}/devices`,
      {
        method: isEditing ? 'PATCH' : 'POST',
        body: JSON.stringify(payload),
      },
    );
    resetDeviceForm();
    setApiStatus(isEditing ? 'API: đã sửa thiết bị' : 'API: đã thêm thiết bị', 'ok');
    await refreshCurrentHomeDetail();
  } catch (error) {
    els.deviceFormMessage.textContent = error.message || 'Không lưu được thiết bị';
    setApiStatus(`API: ${error.message}`, 'error');
  }
}

function startRoomEdit(roomId) {
  const room = (state.homeDetail?.rooms || []).find((item) => item.id === roomId);
  if (!room) return;

  state.editingRoomId = room.id;
  els.roomNameInput.value = room.name || '';
  els.roomTypeInput.value = room.type || 'room';
  els.roomSortInput.value = room.sortOrder ?? 0;
  els.roomFormMessage.textContent = '';
  els.roomSubmitBtn.textContent = 'Lưu phòng';
  els.cancelRoomEditBtn.classList.remove('hidden');
  els.roomNameInput.focus();
}

function startDeviceEdit(deviceId) {
  const device = (state.homeDetail?.devices || []).find((item) => item.id === deviceId);
  if (!device || device.source !== 'manual-inventory') return;

  state.editingDeviceId = device.id;
  els.deviceNameInput.value = device.name || '';
  els.deviceRoomSelect.value = device.roomId || '';
  els.deviceTypeSelect.value = device.type || 'other';
  els.devicePowerInput.value = device.ratedPowerW ?? device.power ?? 0;
  els.deviceStatusSelect.value = device.status || 'unknown';
  els.deviceControllableInput.checked = Boolean(device.isControllable);
  els.deviceFormMessage.textContent = '';
  els.deviceSubmitBtn.textContent = 'Lưu thiết bị';
  els.cancelDeviceEditBtn.classList.remove('hidden');
  els.deviceNameInput.focus();
}

async function deleteRoom(roomId) {
  if (!state.selectedHomeId || !window.confirm('Xóa phòng này? Thiết bị trong phòng sẽ được bỏ gán phòng.')) return;
  await apiFetch(`/api/homes/${encodeURIComponent(state.selectedHomeId)}/rooms/${encodeURIComponent(roomId)}`, {
    method: 'DELETE',
  });
  resetRoomForm();
  setApiStatus('API: đã xóa phòng', 'ok');
  await refreshCurrentHomeDetail();
}

async function deleteDevice(deviceId) {
  if (!state.selectedHomeId || !window.confirm('Xóa thiết bị này khỏi danh mục thiết bị?')) return;
  await apiFetch(`/api/homes/${encodeURIComponent(state.selectedHomeId)}/devices/${encodeURIComponent(deviceId)}`, {
    method: 'DELETE',
  });
  resetDeviceForm();
  setApiStatus('API: đã xóa thiết bị', 'ok');
  await refreshCurrentHomeDetail();
}

async function handleInventoryAction(event) {
  const roomButton = event.target.closest('button[data-room-action]');
  const deviceButton = event.target.closest('button[data-device-action]');

  try {
    if (roomButton) {
      if (roomButton.dataset.roomAction === 'edit') startRoomEdit(roomButton.dataset.roomId);
      if (roomButton.dataset.roomAction === 'delete') await deleteRoom(roomButton.dataset.roomId);
      return;
    }
    if (deviceButton) {
      if (deviceButton.dataset.deviceAction === 'edit') startDeviceEdit(deviceButton.dataset.deviceId);
      if (deviceButton.dataset.deviceAction === 'delete') await deleteDevice(deviceButton.dataset.deviceId);
    }
  } catch (error) {
    setApiStatus(`API: ${error.message}`, 'error');
  }
}

async function copyHomeId(homeId, buttonEl) {
  if (!homeId) return;

  try {
    await navigator.clipboard.writeText(homeId);
    setApiStatus(`Đã sao chép mã nhà: ${homeId}`, 'ok');
    if (buttonEl) {
      const originalText = buttonEl.textContent;
      buttonEl.textContent = '✓ Đã copy';
      buttonEl.style.backgroundColor = '#d9f3df';
      buttonEl.style.color = 'var(--ok)';
      setTimeout(() => {
        buttonEl.textContent = originalText;
        buttonEl.style.backgroundColor = '';
        buttonEl.style.color = '';
      }, 1500);
    }
  } catch {
    window.prompt('Sao chép mã nhà này:', homeId);
  }
}

async function handleAdminTableAction(event) {
  const copyButton = event.target.closest('button[data-copy-home-id]');
  if (copyButton) {
    await copyHomeId(copyButton.dataset.copyHomeId, copyButton);
    return;
  }

  const detailButton = event.target.closest('button[data-home-detail-id]');
  if (detailButton) {
    await openHomeDetail(detailButton.dataset.homeDetailId);
    return;
  }

  const button = event.target.closest('button[data-user-action], button[data-home-action]');
  if (!button) return;

  try {
    const userAction = button.dataset.userAction;
    const homeAction = button.dataset.homeAction;
    if (userAction) {
      await updateUserAction(button.dataset.userId, userAction);
    }
    if (homeAction) {
      await updateHomeAction(button.dataset.homeId, homeAction);
    }
    await loadDashboard();
  } catch (error) {
    setApiStatus(`API: ${error.message}`, 'error');
  }
}

function switchHomeTab(tabName) {
  els.detailTabs.forEach((tab) => {
    tab.classList.toggle('active', tab.dataset.homeTab === tabName);
  });
  els.detailTabPanels.forEach((panel) => {
    panel.classList.toggle('hidden', panel.dataset.homeTabPanel !== tabName);
  });
}

els.loginForm.addEventListener('submit', async (event) => {
  event.preventDefault();
  els.loginMessage.textContent = '';
  try {
    await login(els.usernameInput.value.trim(), els.passwordInput.value);
  } catch (error) {
    els.loginMessage.textContent = error.message || 'Không thể đăng nhập';
    setApiStatus('API: lỗi đăng nhập', 'error');
  }
});

els.logoutBtn.addEventListener('click', logout);
els.refreshAllBtn.addEventListener('click', refreshDashboard);
els.backToHomesBtn.addEventListener('click', () => switchView('homes'));
els.refreshHomeDetailBtn.addEventListener('click', () => {
  if (state.selectedHomeId) {
    openHomeDetail(state.selectedHomeId).catch((error) => setApiStatus(`API: ${error.message}`, 'error'));
  }
});
els.createOwnerTopBtn.addEventListener('click', openOwnerModal);
els.createOwnerHomeBtn.addEventListener('click', openOwnerModal);
els.closeOwnerModalBtn.addEventListener('click', closeOwnerModal);
els.cancelOwnerModalBtn.addEventListener('click', closeOwnerModal);
els.ownerForm.addEventListener('submit', createOwnerHome);
els.roomInventoryForm.addEventListener('submit', submitRoomInventory);
els.deviceInventoryForm.addEventListener('submit', submitDeviceInventory);
els.cancelRoomEditBtn.addEventListener('click', resetRoomForm);
els.cancelDeviceEditBtn.addEventListener('click', resetDeviceForm);
els.recentHomesBody.addEventListener('click', handleAdminTableAction);
els.homesBody.addEventListener('click', handleAdminTableAction);
els.usersBody.addEventListener('click', handleAdminTableAction);
els.detailHomeId.addEventListener('click', handleAdminTableAction);
els.homeRoomsBody.addEventListener('click', handleInventoryAction);
els.homeDevicesBody.addEventListener('click', handleInventoryAction);
els.detailTabs.forEach((tab) => {
  tab.addEventListener('click', () => switchHomeTab(tab.dataset.homeTab));
});
els.ownerModal.addEventListener('click', (event) => {
  if (event.target === els.ownerModal) closeOwnerModal();
});

els.navItems.forEach((item) => {
  item.addEventListener('click', () => switchView(item.dataset.view));
});

document.querySelectorAll('.refresh-btn').forEach((button) => {
  button.addEventListener('click', refreshDashboard);
});

if (state.token && state.user) {
  setAuthenticated(true);
  loadDashboard().catch(() => logout());
} else {
  setAuthenticated(false);
}
