const API_BASE_URL = 'https://api.smarthomeai.id.vn';
const TOKEN_KEY = 'smartHomeAdminToken';
const USER_KEY = 'smartHomeAdminUser';

const state = {
  token: localStorage.getItem(TOKEN_KEY) || '',
  user: JSON.parse(localStorage.getItem(USER_KEY) || 'null'),
  homes: [],
  users: [],
  logs: [],
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
  apiStatus: document.getElementById('apiStatus'),
  pageTitle: document.getElementById('pageTitle'),
  navItems: Array.from(document.querySelectorAll('.nav-item')),
  views: {
    overview: document.getElementById('overviewView'),
    homes: document.getElementById('homesView'),
    users: document.getElementById('usersView'),
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
};

const titles = {
  overview: 'Tổng quan hệ thống',
  homes: 'Danh sách nhà',
  users: 'Danh sách tài khoản',
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
  return date.toLocaleString('vi-VN', {
    hour: '2-digit',
    minute: '2-digit',
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });
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
  els.sessionName.textContent = state.user
    ? `${state.user.name} (${roleLabels[state.user.role] || state.user.role})`
    : 'Chưa đăng nhập';
}

function statusBadge(status) {
  const safe = escapeHtml(status || 'unknown');
  const label = statusLabels[status] || safe;
  return `<span class="badge ${safe}">${escapeHtml(label)}</span>`;
}

function roleBadge(role) {
  const safe = escapeHtml(role || 'unknown');
  const label = roleLabels[role] || safe;
  return `<span class="role ${safe}">${escapeHtml(label)}</span>`;
}

function emptyRow(colspan, text) {
  return `<tr><td class="empty-row" colspan="${colspan}">${escapeHtml(text)}</td></tr>`;
}

function renderHomes() {
  const rows = state.homes.map((home) => `
    <tr>
      <td><strong>${escapeHtml(home.name)}</strong></td>
      <td>${escapeHtml(home.ownerName || '-')}</td>
      <td>${escapeHtml(home.ownerUsername || '-')}</td>
      <td>${escapeHtml(home.memberCount ?? 0)}</td>
      <td>${formatDate(home.createdAt)}</td>
      <td>${statusBadge(home.status)}</td>
    </tr>
  `).join('');

  els.homesBody.innerHTML = rows || emptyRow(6, 'Chưa có nhà nào trong hệ thống.');
  els.recentHomesBody.innerHTML = state.homes.slice(0, 5).map((home) => `
    <tr>
      <td><strong>${escapeHtml(home.name)}</strong></td>
      <td>${escapeHtml(home.ownerName || '-')}</td>
      <td>${escapeHtml(home.memberCount ?? 0)}</td>
      <td>${statusBadge(home.status)}</td>
    </tr>
  `).join('') || emptyRow(4, 'Chưa có dữ liệu nhà.');
}

function renderUsers() {
  els.usersBody.innerHTML = state.users.map((user) => `
    <tr>
      <td><strong>${escapeHtml(user.name)}</strong></td>
      <td>${escapeHtml(user.username)}</td>
      <td>${escapeHtml(user.phone || '-')}</td>
      <td>${roleBadge(user.role)}</td>
      <td>${formatDate(user.lastActive)}</td>
      <td>${statusBadge(user.status)}</td>
    </tr>
  `).join('') || emptyRow(6, 'Chưa có tài khoản nào trong hệ thống.');
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
