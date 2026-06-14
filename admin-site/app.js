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
  system_admin: 'System admin',
  owner: 'Tài khoản cha',
  member: 'Thành viên',
  viewer: 'Chỉ xem',
};

const statusLabels = {
  active: 'Hoạt động',
  suspended: 'Tạm khóa',
};

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
  els.sessionName.textContent = state.user
    ? `${state.user.name} (${roleLabels[state.user.role] || state.user.role})`
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
      <button class="copy-id-btn" data-copy-home-id="${safeHomeId}" type="button" title="Sao chép Home ID">
        Copy
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
      <td><strong>${escapeHtml(user.name)}</strong></td>
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
      <td><strong>${escapeHtml(log.action)}</strong></td>
      <td>${escapeHtml(log.targetName || log.targetId || log.targetType || '-')}</td>
      <td>${escapeHtml(log.ipAddress || '-')}</td>
    </tr>
  `).join('') || emptyRow(6, 'Chưa có audit log nào.');

  els.recentLogsList.innerHTML = state.logs.slice(0, 8).map((log) => `
    <div class="log-item">
      <strong>${escapeHtml(log.action)}</strong>
      <span>${escapeHtml(log.actorUsername || '-')} - ${formatDate(log.createdAt)}</span>
    </div>
  `).join('') || '<div class="log-item"><strong>Chưa có hoạt động</strong><span>Audit log sẽ xuất hiện khi có thao tác mới.</span></div>';
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
  if (status === 'offline') return '<span class="badge suspended">Offline</span>';
  return '<span class="badge off">Khai báo thủ công</span>';
}

function resetRoomForm() {
  state.editingRoomId = '';
  els.roomInventoryForm.reset();
  els.roomTypeInput.value = 'room';
  els.roomSortInput.value = '0';
  els.roomFormMessage.textContent = '';
  els.roomSubmitBtn.textContent = 'Them phong';
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
  els.deviceSubmitBtn.textContent = 'Them thiet bi';
  els.cancelDeviceEditBtn.classList.add('hidden');
}

function renderDeviceRoomOptions(rooms, selectedRoomId = '') {
  els.deviceRoomSelect.innerHTML = `
    <option value="">Khong gan phong</option>
    ${rooms.map((room) => `
      <option value="${escapeHtml(room.id)}">${escapeHtml(room.name)}</option>
    `).join('')}
  `;
  els.deviceRoomSelect.value = selectedRoomId || '';
}

function inventoryActions(kind, id) {
  return `
    <div class="row-actions">
      <button class="action-btn" data-${kind}-action="edit" data-${kind}-id="${escapeHtml(id)}" type="button">Sua</button>
      <button class="action-btn danger" data-${kind}-action="delete" data-${kind}-id="${escapeHtml(id)}" type="button">Xoa</button>
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
    ? 'PLC/API thiết bị chưa sẵn sàng, bấm làm mới khi backend đọc được PLC'
    : 'Ưu tiên inventory thủ công; fallback về thiết bị PLC nếu chưa khai báo';

  els.detailHomeName.textContent = home?.name || 'Chi tiết nhà';
  els.detailHomeId.innerHTML = homeIdCell(home?.id || state.selectedHomeId);
  els.homeDetailSummary.innerHTML = `
    ${detailCard('Chủ nhà', escapeHtml(home?.ownerName || '-'), home?.ownerUsername || '')}
    ${detailCard('Trạng thái nhà', statusBadge(home?.status || 'unknown'))}
    ${detailCard('Thành viên', escapeHtml(String(home?.memberCount ?? members.length ?? 0)), 'Tài khoản trong nhà')}
    ${detailCard('Ngày tạo', escapeHtml(formatDate(home?.createdAt)))}
  `;

  els.homeOverviewGrid.innerHTML = `
    ${detailCard('Home ID', homeIdCell(home?.id || state.selectedHomeId), 'Mã dùng để gán PLC, thiết bị, phòng và quota')}
    ${detailCard('Quota tháng', `${escapeHtml(`${formatNumber(used, ' kWh')} / ${formatNumber(limit, ' kWh')}`)} ${quotaStatusBadge(quotaPercent)}`, `${formatNumber(quotaPercent, '%')} đã dùng`)}
    ${detailCard('Phòng khai báo', roomCountValue, 'Số phòng trong inventory thủ công')}
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
      <td>${escapeHtml(room.type || 'room')}</td>
      <td>${escapeHtml(room.sortOrder ?? 0)}</td>
      <td>${inventoryActions('room', room.id)}</td>
    </tr>
  `).join('') || emptyRow(4, 'Chua co phong nao. Hay them phong dau tien cho nha nay.');

  els.homeDevicesBody.innerHTML = devices.map((device) => `
    <tr>
      <td><strong>${escapeHtml(device.name || device.id || '-')}</strong></td>
      <td>${escapeHtml(roomNameMap[device.roomId] || roomLabel(device.roomId))}</td>
      <td>${formatNumber(device.power ?? device.ratedPowerW ?? 0, ' W')}</td>
      <td>${device.status ? inventoryStatusBadge(device.status) : deviceStatusBadge(device.isOn)}</td>
      <td>${escapeHtml(device.source || '-')}</td>
      <td>${device.source === 'manual-inventory' ? inventoryActions('device', device.id) : '<span class="empty-row">Chi xem</span>'}</td>
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
      <td><strong>${escapeHtml(log.action || '-')}</strong></td>
      <td>${escapeHtml(log.targetName || log.targetId || log.targetType || '-')}</td>
      <td>${escapeHtml(log.ipAddress || '-')}</td>
    </tr>
  `).join('') || emptyRow(5, 'Chưa có nhật ký riêng cho nhà này.');
}

async function openHomeDetail(homeId, options = {}) {
  const home = state.homes.find((item) => item.id === homeId);
  if (!home) {
    setApiStatus('Không tìm thấy Home ID trong danh sách nhà', 'error');
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
    setApiStatus(`Đã tải chi tiết Home ID: ${homeId}, nhưng chưa lấy được inventory thiết bị`, 'error');
  } else {
    setApiStatus(`Đã tải chi tiết Home ID: ${homeId}`, 'ok');
  }
}

function renderAll() {
  renderHomes();
  renderUsers();
  renderLogs();
  renderOverview();
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
    const createdHomeId = result.home?.id ? ` - Home ID: ${result.home.id}` : '';
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
    setApiStatus(isEditing ? 'API: da sua phong' : 'API: da them phong', 'ok');
    await refreshCurrentHomeDetail();
  } catch (error) {
    els.roomFormMessage.textContent = error.message || 'Khong luu duoc phong';
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
    setApiStatus(isEditing ? 'API: da sua thiet bi' : 'API: da them thiet bi', 'ok');
    await refreshCurrentHomeDetail();
  } catch (error) {
    els.deviceFormMessage.textContent = error.message || 'Khong luu duoc thiet bi';
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
  els.roomSubmitBtn.textContent = 'Luu phong';
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
  els.deviceSubmitBtn.textContent = 'Luu thiet bi';
  els.cancelDeviceEditBtn.classList.remove('hidden');
  els.deviceNameInput.focus();
}

async function deleteRoom(roomId) {
  if (!state.selectedHomeId || !window.confirm('Xoa phong nay? Thiet bi trong phong se duoc bo gan phong.')) return;
  await apiFetch(`/api/homes/${encodeURIComponent(state.selectedHomeId)}/rooms/${encodeURIComponent(roomId)}`, {
    method: 'DELETE',
  });
  resetRoomForm();
  setApiStatus('API: da xoa phong', 'ok');
  await refreshCurrentHomeDetail();
}

async function deleteDevice(deviceId) {
  if (!state.selectedHomeId || !window.confirm('Xoa thiet bi nay khoi inventory?')) return;
  await apiFetch(`/api/homes/${encodeURIComponent(state.selectedHomeId)}/devices/${encodeURIComponent(deviceId)}`, {
    method: 'DELETE',
  });
  resetDeviceForm();
  setApiStatus('API: da xoa thiet bi', 'ok');
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

async function copyHomeId(homeId) {
  if (!homeId) return;

  try {
    await navigator.clipboard.writeText(homeId);
    setApiStatus(`Đã copy Home ID: ${homeId}`, 'ok');
  } catch {
    window.prompt('Copy Home ID này:', homeId);
  }
}

async function handleAdminTableAction(event) {
  const copyButton = event.target.closest('button[data-copy-home-id]');
  if (copyButton) {
    await copyHomeId(copyButton.dataset.copyHomeId);
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
