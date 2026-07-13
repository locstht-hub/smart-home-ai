(function exposeAuditHelpers(root, factory) {
  const helpers = factory();
  if (typeof module === 'object' && module.exports) module.exports = helpers;
  if (root) root.AdminAudit = helpers;
}(typeof globalThis !== 'undefined' ? globalThis : this, () => {
  const routineReadPattern = /(?:^|\.)(?:view|list|read)(?:_|\.|$)/;
  const failurePattern = /(?:failed|failure|rejected|blocked|error|denied|timeout)/;
  const importantChangePattern = /(?:suspend|activate|reset_user_password|permission|member\.(?:created|deleted)|quota_updated)/;
  const infrastructurePattern = /(?:plc|telemetry|service_account|device\.command)/;

  function getEventPriority(log) {
    const action = String(log?.action || '').toLowerCase();
    if (failurePattern.test(action)) return 100;
    if (importantChangePattern.test(action)) return 80;
    if (infrastructurePattern.test(action)) return 70;
    if (routineReadPattern.test(action) || action === 'auth.login_success') return 0;
    return 20;
  }

  function getEventSeverity(log) {
    const action = String(log?.action || '').toLowerCase();
    if (failurePattern.test(action) && infrastructurePattern.test(action)) return 'error';
    if (failurePattern.test(action)) return 'warning';
    if (importantChangePattern.test(action)) return 'notice';
    return 'info';
  }

  function getEventStatus(log) {
    return failurePattern.test(String(log?.action || '').toLowerCase()) ? 'failure' : 'success';
  }

  function getEventCategory(log) {
    return String(log?.action || 'other').split('.')[0] || 'other';
  }

  function normalize(value) {
    return String(value ?? '').trim().toLocaleLowerCase('vi');
  }

  function filterAuditLogs(logs, filters = {}, now = new Date()) {
    const ranges = { '24h': 1, '7d': 7, '30d': 30 };
    const end = new Date(now).getTime();
    const rangeDays = ranges[filters.timeRange];
    const start = rangeDays ? end - (rangeDays * 24 * 60 * 60 * 1000) : Number.NEGATIVE_INFINITY;

    return (Array.isArray(logs) ? logs : []).filter((log) => {
      const timestamp = new Date(log?.createdAt || 0).getTime();
      if (rangeDays && (!Number.isFinite(timestamp) || timestamp < start || timestamp > end)) return false;
      if (filters.severity && filters.severity !== 'all' && getEventSeverity(log) !== filters.severity) return false;
      if (filters.category && filters.category !== 'all' && getEventCategory(log) !== filters.category) return false;
      if (filters.status && filters.status !== 'all' && getEventStatus(log) !== filters.status) return false;
      if (filters.action && !normalize(log?.action).includes(normalize(filters.action))) return false;
      if (filters.actor && !normalize(log?.actorUsername).includes(normalize(filters.actor))) return false;
      if (filters.home && !normalize(log?.homeId).includes(normalize(filters.home))) return false;

      const query = normalize(filters.query);
      if (!query) return true;
      const searchable = normalize([
        log?.action,
        log?.actorUsername,
        log?.actorRole,
        log?.homeId,
        log?.targetType,
        log?.targetId,
        log?.targetName,
        JSON.stringify(log?.metadata || {}),
      ].join(' '));
      return searchable.includes(query);
    });
  }

  function getOverviewEvents(logs, limit = 5) {
    return [...(Array.isArray(logs) ? logs : [])]
      .filter((log) => getEventPriority(log) >= 70)
      .sort((left, right) => {
        const priorityDifference = getEventPriority(right) - getEventPriority(left);
        if (priorityDifference) return priorityDifference;
        return new Date(right.createdAt || 0) - new Date(left.createdAt || 0);
      })
      .slice(0, Math.max(0, limit));
  }

  function countWarningsLast24Hours(logs, now = new Date()) {
    const end = new Date(now).getTime();
    const start = end - (24 * 60 * 60 * 1000);
    return (Array.isArray(logs) ? logs : []).filter((log) => {
      const timestamp = new Date(log?.createdAt || 0).getTime();
      return getEventPriority(log) === 100 && timestamp >= start && timestamp <= end;
    }).length;
  }

  function paginateAuditLogs(logs, requestedPage = 1, pageSize = 25) {
    const items = Array.isArray(logs) ? logs : [];
    const safePageSize = Math.max(1, Number(pageSize) || 25);
    const totalPages = Math.max(1, Math.ceil(items.length / safePageSize));
    const page = Math.min(Math.max(1, Number(requestedPage) || 1), totalPages);
    const start = (page - 1) * safePageSize;
    return {
      items: items.slice(start, start + safePageSize),
      page,
      pageSize: safePageSize,
      totalItems: items.length,
      totalPages,
    };
  }

  function maskIpAddress(value) {
    const address = String(value || '').trim();
    if (!address) return '-';
    const ipv4 = address.match(/^(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})$/);
    if (ipv4) return `${ipv4[1]}.${ipv4[2]}.x.x`;
    const ipv6 = address.split(':').filter(Boolean);
    if (ipv6.length >= 2) return `${ipv6[0]}:${ipv6[1]}:…`;
    return 'Đã ẩn';
  }

  function getHomeEvents(logs, homeId, limit = 15) {
    return (Array.isArray(logs) ? logs : [])
      .filter((log) => (!log?.homeId || log.homeId === homeId) && getEventPriority(log) >= 70)
      .sort((left, right) => new Date(right.createdAt || 0) - new Date(left.createdAt || 0))
      .slice(0, Math.min(20, Math.max(10, Number(limit) || 15)));
  }

  return {
    countWarningsLast24Hours,
    filterAuditLogs,
    getEventCategory,
    getEventPriority,
    getEventSeverity,
    getEventStatus,
    getHomeEvents,
    getOverviewEvents,
    maskIpAddress,
    paginateAuditLogs,
  };
}));
