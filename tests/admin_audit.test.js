const assert = require('node:assert/strict');
const { test } = require('node:test');

const {
  countWarningsLast24Hours,
  filterAuditLogs,
  getHomeEvents,
  getOverviewEvents,
  maskIpAddress,
  paginateAuditLogs,
} = require('../admin-site/audit.js');

test('admin overview shows at most five high-signal events and omits routine reads', () => {
  const logs = [
    { id: 'read', action: 'admin.view_homes', createdAt: '2026-07-13T09:00:00Z' },
    { id: 'login', action: 'auth.login_failed', createdAt: '2026-07-13T08:59:00Z' },
    { id: 'user', action: 'admin.suspend_user', createdAt: '2026-07-13T08:58:00Z' },
    { id: 'home', action: 'admin.activate_home', createdAt: '2026-07-13T08:57:00Z' },
    { id: 'password', action: 'admin.reset_user_password', createdAt: '2026-07-13T08:56:00Z' },
    { id: 'permission', action: 'member.permission_updated', createdAt: '2026-07-13T08:55:00Z' },
    { id: 'plc', action: 'plc.command_failed', createdAt: '2026-07-13T08:54:00Z' },
  ];

  const overview = getOverviewEvents(logs);
  assert.equal(overview.length, 5);
  assert.ok(overview.every((log) => log.id !== 'read'));
  assert.ok(overview.some((log) => log.id === 'login'));
  assert.ok(overview.some((log) => log.id === 'plc'));
});

test('home detail keeps only recent relevant events for the selected home', () => {
  const relevant = Array.from({ length: 18 }, (_, index) => ({
    id: `event-${index}`,
    action: index % 2 ? 'device.command_failed' : 'member.permission_updated',
    homeId: 'home-01',
    createdAt: `2026-07-13T09:${String(index).padStart(2, '0')}:00Z`,
  }));
  const logs = [
    ...relevant,
    { id: 'routine', action: 'home.view_quota', homeId: 'home-01', createdAt: '2026-07-13T10:00:00Z' },
    { id: 'other-home', action: 'plc.command_failed', homeId: 'home-02', createdAt: '2026-07-13T10:00:00Z' },
  ];

  const result = getHomeEvents(logs, 'home-01');
  assert.equal(result.length, 15);
  assert.ok(result.every((log) => log.homeId === 'home-01'));
  assert.ok(result.every((log) => log.id !== 'routine'));
});

test('audit pagination defaults to 25 rows and masks IP only in presentation', () => {
  const logs = Array.from({ length: 61 }, (_, index) => ({ id: `log-${index + 1}` }));
  const page = paginateAuditLogs(logs, 2);

  assert.equal(page.page, 2);
  assert.equal(page.pageSize, 25);
  assert.equal(page.totalPages, 3);
  assert.equal(page.items.length, 25);
  assert.equal(page.items[0].id, 'log-26');
  assert.equal(maskIpAddress('192.168.10.42'), '192.168.x.x');
  assert.equal(maskIpAddress('2001:db8:abcd:0012::1'), '2001:db8:…');
});

test('audit filters combine time, severity, category, actor, home, status and keyword', () => {
  const now = new Date('2026-07-13T10:00:00Z');
  const logs = [
    {
      id: 'match',
      action: 'plc.command_failed',
      actorUsername: 'operator-a',
      homeId: 'home-01',
      targetName: 'Bơm nước',
      createdAt: '2026-07-13T09:00:00Z',
    },
    {
      id: 'routine',
      action: 'home.view_activity',
      actorUsername: 'operator-a',
      homeId: 'home-01',
      createdAt: '2026-07-13T09:30:00Z',
    },
    {
      id: 'old',
      action: 'plc.command_failed',
      actorUsername: 'operator-a',
      homeId: 'home-01',
      targetName: 'Bơm nước',
      createdAt: '2026-07-10T09:00:00Z',
    },
  ];

  const filtered = filterAuditLogs(logs, {
    timeRange: '24h',
    severity: 'error',
    category: 'plc',
    action: 'command_failed',
    actor: 'operator-a',
    home: 'home-01',
    status: 'failure',
    query: 'bơm',
  }, now);

  assert.deepEqual(filtered.map((log) => log.id), ['match']);
});

test('warning KPI counts only warning and error events from the last 24 hours', () => {
  const now = new Date('2026-07-13T10:00:00Z');
  const logs = [
    { action: 'auth.login_failed', createdAt: '2026-07-13T09:00:00Z' },
    { action: 'plc.command_failed', createdAt: '2026-07-12T11:00:00Z' },
    { action: 'admin.suspend_user', createdAt: '2026-07-13T08:00:00Z' },
    { action: 'auth.login_failed', createdAt: '2026-07-11T08:00:00Z' },
  ];

  assert.equal(countWarningsLast24Hours(logs, now), 2);
});
