/**
 * Local-only SHA / import integrity audit log — metadata only, no network.
 */
export const INTEGRITY_AUDIT_KEY = 'tg_limitless_integrity_audit_v1';
const MAX_ENTRIES = 500;

export function readAuditLog() {
  try {
    const raw = localStorage.getItem(INTEGRITY_AUDIT_KEY);
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function writeAuditLog(entries) {
  localStorage.setItem(INTEGRITY_AUDIT_KEY, JSON.stringify(entries.slice(-MAX_ENTRIES)));
}

/**
 * @param {object} entry
 */
export function appendIntegrityAudit(entry) {
  const row = {
    id: `audit_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
    at: new Date().toISOString(),
    ...entry,
  };
  const next = [...readAuditLog(), row];
  writeAuditLog(next);
  try {
    window.dispatchEvent(new CustomEvent('tg-integrity-audit-changed'));
  } catch {
    /* non-browser */
  }
  return row;
}

export function clearIntegrityAudit() {
  localStorage.removeItem(INTEGRITY_AUDIT_KEY);
  return { ok: true, cleared: true };
}

export function exportIntegrityAuditJson() {
  return {
    kind: 'tg_limitless_integrity_audit_export_v1',
    exported_at: new Date().toISOString(),
    entries: readAuditLog(),
    note: 'Metadata only — no full bundle payloads',
  };
}

export function getAuditLogCount() {
  return readAuditLog().length;
}

export function initLimitlessIntegrityAuditPanel() {
  const panel = document.getElementById('tgLimitlessAuditPanel');
  if (!panel) return;

  const reportEl = document.getElementById('tgLimitlessAuditReport');

  const refresh = () => {
    if (reportEl) {
      reportEl.textContent = JSON.stringify(
        { count: getAuditLogCount(), recent: readAuditLog().slice(-15).reverse() },
        null,
        2
      );
    }
  };

  document.getElementById('tgLimitlessAuditExport')?.addEventListener('click', () => {
    const pack = exportIntegrityAuditJson();
    const blob = new Blob([JSON.stringify(pack, null, 2)], { type: 'application/json' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `tg_limitless_integrity_audit_${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(a.href);
    refresh();
  });

  document.getElementById('tgLimitlessAuditClear')?.addEventListener('click', () => {
    if (!confirm('Clear integrity audit log?')) return;
    clearIntegrityAudit();
    refresh();
  });

  window.addEventListener('tg-integrity-audit-changed', refresh);
  refresh();
}
