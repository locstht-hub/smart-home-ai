const assert = require('node:assert/strict');
const { test } = require('node:test');
const fs = require('node:fs');
const path = require('node:path');

const root = path.resolve(__dirname, '..');
const read = (relativePath) => fs.readFileSync(path.join(root, relativePath), 'utf8');

test('authentication state uses server revocation and secure token storage', () => {
  const auth = read('src/contexts/AuthContext.tsx');
  const server = read('src/contexts/SmartHomeServerContext.tsx');
  const tokenStorage = read('src/services/auth/tokenStorage.ts');
  const client = read('src/services/smartHome/client.ts');
  assert.match(auth, /await client\.logout\(\)/);
  assert.match(server, /setSessionToken/);
  assert.match(tokenStorage, /SecureStore\.setItemAsync/);
  assert.doesNotMatch(client, /headers\['X-API-Token'\]\s*=/);
});

test('responsive sites retain explicit mobile overflow controls', () => {
  const adminCss = read('admin-site/styles.css');
  const projectCss = read('project-site/styles.css');
  assert.match(adminCss, /@media \(max-width: 680px\)/);
  assert.match(adminCss, /overflow-x: auto/);
  assert.match(projectCss, /@media \(max-width: (640|760)px\)/);
  assert.match(projectCss, /scroll-snap-type: x/);
});

test('room cards resolve server room visuals and expose accessible labels', () => {
  const rooms = read('src/screens/RoomsScreen.tsx');
  const dashboard = read('src/screens/DashboardScreen.tsx');
  assert.match(rooms, /getRoomPresentation\(room\)/);
  assert.match(dashboard, /getRoomPresentation\(room\)/);
  assert.match(rooms, /accessibilityLabel=\{visual\.accessibilityLabel\}/);
  assert.match(dashboard, /accessibilityLabel=\{visual\.accessibilityLabel\}/);
});

test('Android release configuration avoids legacy high-risk permissions and supports release signing', () => {
  const manifest = read('android/app/src/main/AndroidManifest.xml');
  const gradle = read('android/app/build.gradle');
  assert.match(manifest, /READ_EXTERNAL_STORAGE" tools:node="remove"/);
  assert.match(manifest, /WRITE_EXTERNAL_STORAGE" tools:node="remove"/);
  assert.match(manifest, /SYSTEM_ALERT_WINDOW" tools:node="remove"/);
  assert.match(manifest, /android:allowBackup="false"/);
  assert.match(gradle, /versionCode 3/);
  assert.match(gradle, /versionName "1\.0\.2"/);
  assert.match(gradle, /SMART_HOME_UPLOAD_STORE_FILE/);
  assert.match(gradle, /release \{[\s\S]*signingConfig hasReleaseSigning \? signingConfigs\.release : signingConfigs\.debug/);
});

test('user-facing room state is valid Vietnamese and critical controls are accessible', () => {
  const dataContext = read('src/contexts/DataContext.tsx');
  const client = read('src/services/smartHome/client.ts');
  const rooms = read('src/screens/RoomsScreen.tsx');
  assert.doesNotMatch(dataContext, /Ã|Ä|áº|á»|ChÆ|Æ°/);
  assert.match(rooms, /accessibilityLabel="Quay lại danh sách phòng"/);
  assert.match(rooms, /accessibilityLabel="Bật tất cả thiết bị trong phòng"/);
  assert.match(rooms, /accessibilityLabel="Tắt tất cả thiết bị trong phòng"/);
  assert.match(rooms, /accessibilityState=\{\{ disabled:/);
  assert.match(client, /Promise<DeviceControlResponse>/);
  assert.match(dataContext, /actualState\?: boolean/);
  assert.match(dataContext, /latencyMs\?: number/);
  assert.match(rooms, /Đang gửi lệnh/);
  assert.match(rooms, /Không phải phản hồi PLC/);
  assert.match(rooms, /accessibilityLiveRegion="polite"/);
});

test('release forecast does not default to an insecure LAN endpoint', () => {
  const serverContext = read('src/contexts/SmartHomeServerContext.tsx');
  assert.match(serverContext, /EXPO_PUBLIC_FORECAST_API_URL/);
  assert.match(serverContext, /__DEV__ \? DEFAULT_LOCAL_FORECAST_API_URL : ''/);
});

test('mobile icon-only controls use the installed icon family and accessible labels', () => {
  const settings = read('src/screens/SettingsScreen.tsx');
  const chat = read('src/screens/ChatScreen.tsx');
  const dashboard = read('src/screens/DashboardScreen.tsx');

  for (const source of [settings, chat, dashboard]) {
    assert.match(source, /from '@expo\/vector-icons'/);
  }

  assert.doesNotMatch(settings, /<Text>\s*(?:U|!|\*|API|PLC|MAP|SYS)\s*<\/Text>/);
  assert.match(settings, /accessibilityLabel="Mở cài đặt nâng cao"/);
  assert.match(chat, /accessibilityLabel=\{isListening \? 'Dừng ghi âm' : 'Nhập lệnh bằng giọng nói'\}/);
  assert.match(chat, /accessibilityLabel:\s*'Gửi tin nhắn'/);
  assert.match(chat, /accessibilityState:\s*\{ disabled: !props\.text\?\.trim\(\), busy: isSending \}/);
  assert.doesNotMatch(chat, /const ICONS: Record<string, string>/);
  assert.doesNotMatch(dashboard, /const ICONS: Record<string, string>/);
  assert.doesNotMatch(`${settings}\n${chat}\n${dashboard}`, /[⚡☁️💡📱🔌✅📦]/u);
});

test('bottom navigation uses one semantic icon family without emoji placeholders', () => {
  const navigator = read('src/navigation/AppNavigator.tsx');

  assert.match(navigator, /import \{ Ionicons \} from '@expo\/vector-icons'/);
  assert.match(navigator, /home-outline/);
  assert.match(navigator, /bed-outline/);
  assert.match(navigator, /analytics-outline/);
  assert.match(navigator, /chatbubble-ellipses-outline/);
  assert.match(navigator, /settings-outline/);
  assert.match(navigator, /shield-checkmark-outline/);
  assert.doesNotMatch(navigator, /[🏠🛋📊💬⚙🔧📱]/u);
});

test('authentication screens expose calm inline feedback and accessible password controls', () => {
  const login = read('src/screens/LoginScreen.tsx');
  const register = read('src/screens/RegisterScreen.tsx');
  const ambient = read('src/components/AmbientTechBackground.tsx');

  for (const source of [login, register]) {
    assert.match(source, /<AmbientTechBackground variant="auth"/);
    assert.match(source, /accessibilityLiveRegion="polite"/);
    assert.match(source, /accessibilityState=\{\{ disabled: loading, busy: loading \}\}/);
  }

  assert.match(login, /accessibilityLabel=\{showPassword \? 'Ẩn mật khẩu' : 'Hiện mật khẩu'\}/);
  assert.match(register, /accessibilityLabel=\{showPassword \? 'Ẩn mật khẩu' : 'Hiện mật khẩu'\}/);
  assert.match(login, /Kết nối được mã hóa/);
  assert.doesNotMatch(login, /Alert\.alert/);
  assert.doesNotMatch(register, /infoIcon[^\n]*ℹ/u);
  assert.match(ambient, /importantForAccessibility="no-hide-descendants"/);
});

test('authentication and chat inputs use one stable Android keyboard layout path', () => {
  const appConfig = JSON.parse(read('app.json'));
  const manifest = read('android/app/src/main/AndroidManifest.xml');
  const login = read('src/screens/LoginScreen.tsx');
  const register = read('src/screens/RegisterScreen.tsx');
  const chat = read('src/screens/ChatScreen.tsx');
  const navigator = read('src/navigation/AppNavigator.tsx');

  assert.equal(appConfig.expo.android.softwareKeyboardLayoutMode, 'resize');
  assert.match(manifest, /android:windowSoftInputMode="adjustResize"/);
  assert.match(login, /behavior=\{Platform\.OS === 'ios' \? 'padding' : undefined\}/);
  assert.match(register, /behavior=\{Platform\.OS === 'ios' \? 'padding' : undefined\}/);
  assert.match(chat, /behavior=\{Platform\.OS === 'ios' \? 'padding' : undefined\}/);
  assert.match(login, /keyboardShouldPersistTaps="handled"/);
  assert.match(login, /onFocus=\{\(\) => setFocusedField\('password'\)\}/);
  assert.doesNotMatch(login, /scrollToEnd|handlePasswordFocus/);
  assert.match(navigator, /tabBarHideOnKeyboard:\s*true/);
  assert.match(chat, /isKeyboardInternallyHandled=\{false\}/);
  assert.doesNotMatch(chat, /useBottomTabBarHeight|bottomOffset=/);
});

test('analysis, chat and administration screens use semantic icons and intentional empty states', () => {
  const analysis = read('src/screens/AnalysisScreen.tsx');
  const chat = read('src/screens/ChatScreen.tsx');
  const admin = read('src/screens/AdminScreen.tsx');
  const members = read('src/screens/MemberManagementScreen.tsx');

  for (const source of [analysis, admin, members]) {
    assert.match(source, /import \{ Ionicons \} from '@expo\/vector-icons'/);
  }

  assert.doesNotMatch(`${analysis}\n${admin}\n${members}`, /[📄⚡💰🕐💡🔄🔴🟡🔵⏳📱✅👥🗑📋]/u);
  assert.match(chat, /<AmbientTechBackground variant="chat"/);
  assert.doesNotMatch(analysis, /const actualSeries|predictedKw \+ totalPowerKw|legend:\s*\['Hiện tại',\s*'Dự báo'\]/);
  assert.match(analysis, /legend:\s*\['Dự báo'\]/);
  assert.match(analysis, /PLC\/MFM384 thực/);
  assert.match(analysis, /Dữ liệu mẫu/);
  assert.match(analysis, /Mô phỏng/);
  assert.match(admin, /Đang hoạt động/);
  assert.match(admin, /accessibilityLabel="Đóng chi tiết nhà"/);
  assert.match(members, /accessibilityLabel="Quay lại"/);
});

test('core mobile screens share design tokens and tabular numeric typography', () => {
  const theme = read('src/constants/theme.ts');
  const dashboard = read('src/screens/DashboardScreen.tsx');
  const rooms = read('src/screens/RoomsScreen.tsx');
  const settings = read('src/screens/SettingsScreen.tsx');

  assert.match(theme, /canvas: '#edf3f0'/);
  assert.match(theme, /surface: '#f8fbf9'/);
  for (const source of [dashboard, rooms, settings]) {
    assert.match(source, /import \{ AppTheme \} from '\.\.\/constants\/theme'/);
    assert.match(source, /AppTheme\.colors\.canvas/);
  }
  assert.match(dashboard, /fontVariant: \['tabular-nums'\]/);
  assert.match(rooms, /fontVariant: \['tabular-nums'\]/);
});

test('admin and project sites avoid placeholder UI and expose keyboard navigation', () => {
  const adminHtml = read('admin-site/index.html');
  const adminJs = read('admin-site/app.js');
  const adminCss = read('admin-site/styles.css');
  const projectHtml = read('project-site/index.html');
  const projectJs = read('project-site/app.js');

  assert.match(adminHtml, /class="skip-link" href="#main-content"/);
  assert.match(projectHtml, /class="skip-link" href="#main-content"/);
  assert.doesNotMatch(adminHtml, /<span class="nav-icon">(?:OV|HM|US|LG)<\/span>/);
  assert.doesNotMatch(adminHtml, /adminSparkline|Dữ liệu minh họa/);
  assert.doesNotMatch(adminJs, /renderSparklineChart|adminChartLine|adminChartArea/);
  assert.doesNotMatch(projectJs, /Simulated real-time sensor state|startLiveMetrics\(\)/);
  assert.match(projectHtml, /Chờ dữ liệu phần cứng/);
  assert.match(projectJs, /setAttribute\("aria-selected"/);
  assert.match(adminHtml, /minlength="12"/);
  assert.match(adminJs, /password\.length < 12/);
  assert.match(adminHtml, /id="apiOfflineBanner"/);
  assert.match(adminHtml, /id="apiRetryBtn"/);
  assert.match(adminJs, /Không thể kết nối API/);
  assert.match(adminJs, /setApiActionsDisabled/);
  assert.match(adminCss, /\.workspace\.data-unavailable/);
  assert.doesNotMatch(adminJs, /loadDashboard\(\)\.catch\(\(\) => logout\(\)\)/);
});

test('admin site uses an accessible Smart Home AI avatar instead of text initials', () => {
  const adminHtml = read('admin-site/index.html');
  assert.doesNotMatch(adminHtml, /class="brand-mark"[^>]*>\s*SH\s*</);
  assert.match(adminHtml, /<svg class="brand-avatar"[^>]*role="img"[^>]*aria-label="Logo Smart Home AI"/);
  assert.match(adminHtml, /<title>Logo Smart Home AI<\/title>/);
});

test('project site lists only models present in canonical benchmark results', () => {
  const projectHtml = read('project-site/index.html');
  const canonicalCsv = read('research/results/canonical/forecast_metrics.csv');
  const canonicalModels = new Set(
    canonicalCsv
      .trim()
      .split(/\r?\n/)
      .slice(1)
      .map((line) => line.split(',')[0]),
  );
  const visibleModels = [...projectHtml.matchAll(/<div class="model-chip">([^<]+)<\/div>/g)]
    .map((match) => match[1].trim().toLowerCase().replaceAll(' ', '_').replaceAll('-', '_'));

  assert.ok(visibleModels.length > 0);
  for (const model of visibleModels) {
    assert.ok(canonicalModels.has(model), `${model} is not in the canonical benchmark`);
  }
});

test('project homepage keeps one concise evidence-classified status summary', () => {
  const projectHtml = read('project-site/index.html');
  assert.doesNotMatch(projectHtml, /class="status-rail"/);
  assert.equal((projectHtml.match(/class="project-status-summary"/g) || []).length, 1);
  assert.match(projectHtml, /Đã triển khai trong phần mềm/);
  assert.match(projectHtml, /Đã đánh giá bằng benchmark offline/);
  assert.match(projectHtml, /Chờ xác minh bằng phần cứng/);
  assert.doesNotMatch(projectHtml, /Unsloth/);
});

test('project typography uses one consolidated theme with readable content widths', () => {
  const projectCss = read('project-site/styles.css');
  assert.equal((projectCss.match(/^:root\s*\{/gm) || []).length, 1);
  assert.doesNotMatch(projectCss, /theme-repair|Visual repair|Brand alignment refresh/i);
  assert.match(projectCss, /\.section-heading\s*\{[\s\S]*?max-width:\s*(?:65ch|70ch)/);
  assert.match(projectCss, /\.section-heading p[\s\S]*?text-wrap:\s*pretty/);
  assert.match(projectCss, /\.hero h1[\s\S]*?font-weight:\s*800/);
  assert.match(projectCss, /@media \(max-width: (?:640|760)px\)[\s\S]*?\.hero h1\s*\{[\s\S]*?font-size:\s*clamp\(2\.25rem,/);
});

test('admin audit page exposes accessible filtering, pagination and focused log navigation', () => {
  const adminHtml = read('admin-site/index.html');
  const adminJs = read('admin-site/app.js');
  assert.match(adminHtml, /<script src="\.\/audit\.js/);
  assert.match(adminHtml, /<form class="audit-filters" id="auditFilters"/);
  for (const id of ['auditTimeFilter', 'auditSeverityFilter', 'auditCategoryFilter', 'auditActionFilter', 'auditActorFilter', 'auditHomeFilter', 'auditStatusFilter', 'auditSearchInput']) {
    assert.match(adminHtml, new RegExp(`id="${id}"`));
  }
  assert.match(adminHtml, /id="clearAuditFiltersBtn"/);
  assert.match(adminHtml, /id="auditPreviousBtn"[^>]*aria-label=/);
  assert.match(adminHtml, /id="auditNextBtn"[^>]*aria-label=/);
  assert.match(adminHtml, /id="viewAllLogsBtn"/);
  assert.match(adminHtml, /id="viewHomeAuditBtn"/);
  assert.match(adminJs, /AdminAudit\.filterAuditLogs/);
  assert.match(adminJs, /AdminAudit\.paginateAuditLogs/);
  assert.match(adminJs, /AdminAudit\.maskIpAddress/);
});

test('project progress and assistant knowledge preserve evidence boundaries', () => {
  const progressHtml = read('project-site/progress.html');
  const knowledgeJs = read('project-site/knowledge.js');
  assert.match(progressHtml, /Triển khai phần mềm/);
  assert.match(progressHtml, /Benchmark offline/);
  assert.match(progressHtml, /Chưa xác minh phần cứng/);
  assert.match(knowledgeJs, /benchmark offline/i);
  assert.doesNotMatch(`${progressHtml}\n${knowledgeJs}`, /Pilot-ready|main \/ auto|LSTM|CNN-LSTM|Unsloth|auto load shedding/i);
});

test('project mobile hero keeps actions and component chips compact', () => {
  const projectCss = read('project-site/styles.css');
  assert.match(projectCss, /@media \(max-width: 640px\)[\s\S]*?\.hero-inner\s*\{[\s\S]*?padding:\s*36px 6vw 48px/);
  assert.match(projectCss, /@media \(max-width: 640px\)[\s\S]*?\.hero-actions\s*\{[\s\S]*?grid-template-columns:\s*repeat\(2, minmax\(0, 1fr\)\)/);
  assert.match(projectCss, /@media \(max-width: 640px\)[\s\S]*?\.hero-strip\s*\{[\s\S]*?flex-wrap:\s*nowrap/);
});
