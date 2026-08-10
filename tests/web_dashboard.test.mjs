import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { test } from 'node:test';
import { fileURLToPath } from 'node:url';

import {
  canControlDevices,
  canManageMembers,
  classifyControlFailure,
  describeDataSource,
  isProductionApiUrlAllowed,
} from '../src/web/dashboardPolicy.ts';
import { normalizeSavedLocalApiUrl, resolveDefaultLocalApiUrl } from '../src/services/smartHome/endpoints.ts';
import { describeLoginFailure } from '../src/services/auth/loginErrors.ts';
import { shouldRestoreStoredUser } from '../src/services/auth/sessionPolicy.ts';
import { resolveRequestTimeout } from '../src/services/smartHome/requestPolicy.ts';
import { describeApiFailure, describeHttpFailure, isAmbiguousMutationFailure } from '../src/services/smartHome/errors.ts';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const read = (relativePath) => fs.readFileSync(path.join(root, relativePath), 'utf8');

test('web restores a server user only while a session token still exists', () => {
  const owner = { id: 'owner-1', serverRole: 'owner' };
  assert.equal(shouldRestoreStoredUser(owner, 'session-token', 'web'), true);
  assert.equal(shouldRestoreStoredUser(owner, '', 'web'), false);
  assert.equal(shouldRestoreStoredUser({ id: 'local-user' }, '', 'web'), true);
});

test('API timeout policy gives mutations enough time without slowing health checks', () => {
  assert.equal(resolveRequestTimeout('/health', 'GET', 8_000), 2_000);
  assert.equal(resolveRequestTimeout('/api/power/current', 'GET', 8_000), 8_000);
  assert.equal(resolveRequestTimeout('/api/homes/home-1/rooms', 'POST', 8_000), 12_000);
  assert.equal(resolveRequestTimeout('/api/assistant/chat', 'POST', 8_000), 25_000);
});

test('API failures are classified into Vietnamese user-facing messages', () => {
  assert.equal(describeHttpFailure(401, '', '/api/auth/login'), 'Tên đăng nhập hoặc mật khẩu không đúng.');
  assert.equal(describeHttpFailure(401, '', '/api/power/current'), 'Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.');
  assert.equal(describeHttpFailure(403, 'Device permission denied', '/api/devices/1/turn-off'), 'Bạn không có quyền điều khiển thiết bị.');
  assert.equal(describeApiFailure(Object.assign(new Error('signal is aborted without reason'), { name: 'AbortError' })), 'Yêu cầu quá thời gian chờ. Vui lòng kiểm tra kết nối và thử lại.');
});

test('only timeout and connection failures trigger CRUD reconciliation', () => {
  assert.equal(isAmbiguousMutationFailure(new Error('Yêu cầu quá thời gian chờ.')), true);
  assert.equal(isAmbiguousMutationFailure(new TypeError('Failed to fetch')), true);
  assert.equal(isAmbiguousMutationFailure(new Error('Bạn không có quyền thực hiện thao tác này.')), false);
});

test('dangerous actions use the shared cross-platform confirmation dialog', () => {
  const dialog = read('src/components/ConfirmDialog.tsx');
  assert.match(dialog, /accessibilityViewIsModal/);
  assert.match(dialog, /isProcessing/);
  for (const screen of ['DashboardScreen.tsx', 'RoomsScreen.tsx', 'MemberManagementScreen.tsx', 'AnalysisScreen.tsx', 'SettingsScreen.tsx']) {
    assert.match(read(`src/screens/${screen}`), /useConfirmDialog/);
  }
});

test('mobile dashboard navigation is height-bounded and never flex-stretches', () => {
  const navigator = read('src/navigation/AppNavigator.web.tsx');
  assert.match(navigator, /mobileNavScroller/);
  assert.match(navigator, /maxHeight:\s*68/);
  assert.match(navigator, /flexGrow:\s*0/);
  assert.match(navigator, /height:\s*48/);
});

test('web keyboard focus uses the teal design-system ring', () => {
  const navigator = read('src/navigation/AppNavigator.web.tsx');
  assert.match(navigator, /styles\.focusRing/);
  assert.match(navigator, /outlineColor:\s*'#0f766e'/);
  assert.match(navigator, /outlineStyle:\s*'solid'/);
});

test('web PDF export uses the browser print workflow while native keeps Expo print and sharing', () => {
  const analysis = read('src/screens/AnalysisScreen.tsx');
  assert.match(analysis, /Platform\.OS === 'web'/);
  assert.match(analysis, /window\.open\('', '_blank'/);
  assert.match(analysis, /reportWindow\.print\(\)/);
  assert.match(analysis, /Print\.printToFileAsync/);
  assert.match(analysis, /Sharing\.shareAsync/);
});

test('web roles keep user and system administration separated', () => {
  assert.equal(canControlDevices({ role: 'owner', canManageDevices: true }), true);
  assert.equal(canControlDevices({ role: 'member', canManageDevices: true }), true);
  assert.equal(canControlDevices({ role: 'viewer', canManageDevices: false }), false);
  assert.equal(canManageMembers({ role: 'owner', canManageMembers: true }), true);
  assert.equal(canManageMembers({ role: 'member', canManageMembers: true }), false);
  assert.equal(canManageMembers({ role: 'system_admin', canManageMembers: true }), false);
});

test('web UI labels evidence sources and actionable control failures', () => {
  assert.equal(describeDataSource('plc-s7-1200'), 'PLC S7-1200');
  assert.equal(describeDataSource('mock-fallback'), 'Mô phỏng dự phòng');
  assert.equal(classifyControlFailure('PLC feedback mismatch'), 'Phản hồi PLC không khớp trạng thái yêu cầu.');
  assert.equal(classifyControlFailure('request timeout'), 'Quá thời gian chờ phản hồi.');
  assert.equal(classifyControlFailure('forbidden'), 'Bạn không có quyền điều khiển thiết bị này.');
});

test('production web accepts HTTPS API endpoints only', () => {
  assert.equal(isProductionApiUrlAllowed('https://api.smarthomeai.id.vn'), true);
  assert.equal(isProductionApiUrlAllowed('http://api.smarthomeai.id.vn'), false);
  assert.equal(isProductionApiUrlAllowed('http://172.16.50.47:5001'), false);
  assert.equal(isProductionApiUrlAllowed('not-a-url'), false);
});

test('local web testing can explicitly select the loopback API without weakening production transport', () => {
  const serverContext = read('src/contexts/SmartHomeServerContext.tsx');
  const client = read('src/services/smartHome/client.ts');
  assert.match(serverContext, /EXPO_PUBLIC_LOCAL_API_URL/);
  assert.match(client, /EXPO_PUBLIC_LOCAL_API_URL/);
  assert.match(client, /ALLOW_INSECURE_LAN_HTTP = __DEV__/);
});

test('local web defaults to the loopback backend while native keeps the configured LAN endpoint', () => {
  assert.equal(resolveDefaultLocalApiUrl('web', undefined), 'http://127.0.0.1:5001');
  assert.equal(resolveDefaultLocalApiUrl('android', undefined), 'http://172.16.50.47:5001');
  assert.equal(resolveDefaultLocalApiUrl('web', ' http://10.0.0.8:5001 '), 'http://10.0.0.8:5001');
});

test('web migrates the obsolete project LAN address saved by earlier builds', () => {
  assert.equal(
    normalizeSavedLocalApiUrl('web', 'http://172.16.50.47:5001', 'http://127.0.0.1:5001'),
    'http://127.0.0.1:5001',
  );
  assert.equal(
    normalizeSavedLocalApiUrl('android', 'http://172.16.50.47:5001', 'http://127.0.0.1:5001'),
    'http://172.16.50.47:5001',
  );
});

test('backend runtime CORS permits the standard local web origins', () => {
  const runtimeConfig = JSON.parse(read('backend/smart_home_server/config.json'));
  const allowedOrigins = runtimeConfig.security?.allowedOrigins ?? [];
  assert.ok(allowedOrigins.includes('http://localhost:8081'));
  assert.ok(allowedOrigins.includes('http://127.0.0.1:8081'));
});

test('login shows an actionable connection error instead of the browser fetch message', () => {
  assert.equal(
    describeLoginFailure(new TypeError('Failed to fetch')),
    'Không thể kết nối Server API. Hãy kiểm tra backend cổng 5001 và tải lại trang.',
  );
});

test('unauthenticated login screen does not poll protected energy APIs', () => {
  const dataContext = read('src/contexts/DataContext.tsx');
  const forecastContext = read('src/contexts/ForecastContext.tsx');
  assert.match(dataContext, /if \(!user \|\| !config\.apiToken\)/);
  assert.match(forecastContext, /if \(!config\.apiToken\)/);
});

test('forecast fallback presents an actionable message instead of a raw browser error', () => {
  const forecastContext = read('src/contexts/ForecastContext.tsx');
  assert.match(forecastContext, /Không thể kết nối Forecast API; đang dùng dữ liệu mô phỏng dự phòng\./);
});

test('chat requests have enough time for the configured AI provider', () => {
  const client = read('src/services/smartHome/client.ts');
  assert.match(client, /timeoutMs:\s*25_000/);
  assert.match(client, /options\.timeoutMs\s*\?\?/);
});

test('Expo web dashboard has a desktop shell, web chatbot and Pages fallback', () => {
  const navigator = read('src/navigation/AppNavigator.web.tsx');
  const chat = read('src/screens/ChatScreen.web.tsx');
  const packageJson = JSON.parse(read('package.json'));
  const appJson = JSON.parse(read('app.json'));
  const redirects = read('public/_redirects');

  assert.match(navigator, /dashboardNavItems/);
  assert.match(navigator, /system_admin/);
  assert.match(navigator, /MemberManagement/);
  assert.match(chat, /client\.chatWithTiming/);
  assert.equal(packageJson.scripts.web, 'expo start --web --port 8090');
  assert.equal(packageJson.scripts['build:web'], 'expo export --platform web');
  assert.equal(appJson.expo.web.output, 'single');
  assert.match(redirects, /^\/\* \/index\.html 200/m);
});
