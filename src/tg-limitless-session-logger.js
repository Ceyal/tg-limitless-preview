/**
 * Local-only session / practice log — personal notes, no medical claims.
 */
import { captureToneSnapshot, summarizeToneSnapshot } from './tg-limitless-app-snapshot.js';
import { TG_LIMITLESS_TAKE_BASELINE_SHA } from './tg-limitless-provenance.js';
import { isOpfsOptedIn } from './tg-limitless-opfs-cache.js';
import { saveSessionsBackupToOpfs } from './tg-limitless-opfs-cache.js';

export const SESSIONS_STORAGE_KEY = 'tg_limitless_session_history_v1';

function readStore() {
  try {
    const raw = localStorage.getItem(SESSIONS_STORAGE_KEY);
    const data = raw ? JSON.parse(raw) : { sessions: [] };
    return Array.isArray(data.sessions) ? data : { sessions: [] };
  } catch {
    return { sessions: [] };
  }
}

function writeStore(data) {
  localStorage.setItem(SESSIONS_STORAGE_KEY, JSON.stringify(data));
}

function newId() {
  return `session_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
}

export function listSessions() {
  return readStore().sessions.slice().sort((a, b) => (b.started_at || '').localeCompare(a.started_at || ''));
}

let activeSession = null;

export function startSessionLog({ presetId, note } = {}) {
  if (activeSession) return { ok: false, error: 'Session already active' };
  activeSession = {
    id: newId(),
    started_at: new Date().toISOString(),
    ended_at: null,
    duration_sec: null,
    notes: note ? [note] : [],
    preset_id: presetId || null,
    settings_snapshot: captureToneSnapshot(),
    frequencies_summary: summarizeToneSnapshot(captureToneSnapshot()),
    export_events: [],
    source: {
      lane: 'TG_WEB_APP_LIMITLESS',
      fork_sha: TG_LIMITLESS_TAKE_BASELINE_SHA,
      app_version_label: 'TG_WEB_APP_LIMITLESS v0.3 LONG TAKE 1',
    },
    no_claims: true,
  };
  return { ok: true, session: { ...activeSession } };
}

export function addSessionNote(text) {
  if (!activeSession) return { ok: false, error: 'No active session' };
  if (text?.trim()) activeSession.notes.push(text.trim());
  return { ok: true, notes: [...activeSession.notes] };
}

export function stopSessionLog() {
  if (!activeSession) return { ok: false, error: 'No active session' };
  const ended = new Date().toISOString();
  const startMs = Date.parse(activeSession.started_at);
  const endMs = Date.parse(ended);
  activeSession.ended_at = ended;
  activeSession.duration_sec = Math.max(0, Math.round((endMs - startMs) / 1000));
  const store = readStore();
  store.sessions.push(activeSession);
  writeStore(store);
  const saved = { ...activeSession };
  activeSession = null;
  return { ok: true, session: saved };
}

export function getActiveSession() {
  return activeSession ? { ...activeSession } : null;
}

export function deleteSession(id) {
  const store = readStore();
  const before = store.sessions.length;
  store.sessions = store.sessions.filter((s) => s.id !== id);
  writeStore(store);
  return { ok: store.sessions.length < before };
}

export function exportSessionsPack() {
  return {
    kind: 'tg_limitless_sessions_export_v1',
    exported_at: new Date().toISOString(),
    schema_version: 1,
    sessions: listSessions(),
    disclaimer: 'Personal local practice log only — not medical · not therapy · no outcome claims',
  };
}

export function analyzeSessionsImport(pack) {
  const errors = [];
  if (!pack || pack.kind !== 'tg_limitless_sessions_export_v1') errors.push('Invalid sessions pack kind');
  if (!Array.isArray(pack?.sessions)) errors.push('sessions array required');
  const incoming = pack?.sessions || [];
  const existing = listSessions();
  const overwrites = incoming.filter((s) => existing.some((e) => e.id === s.id));
  return {
    ok: errors.length === 0,
    errors,
    incomingCount: incoming.length,
    overwriteCount: overwrites.length,
  };
}

export function applySessionsImport(pack) {
  const analysis = analyzeSessionsImport(pack);
  if (!analysis.ok) return { ok: false, errors: analysis.errors };
  const store = readStore();
  const byId = new Map(store.sessions.map((s) => [s.id, s]));
  for (const s of pack.sessions) {
    if (s?.id) byId.set(s.id, s);
  }
  store.sessions = [...byId.values()];
  writeStore(store);
  return { ok: true, count: store.sessions.length };
}

export function initLimitlessSessionLogger() {
  const panel = document.getElementById('tgLimitlessSessionPanel');
  if (!panel) return;

  const noteEl = document.getElementById('tgLimitlessSessionNote');
  const reportEl = document.getElementById('tgLimitlessSessionReport');
  const selectEl = document.getElementById('tgLimitlessSessionSelect');
  const importPaste = document.getElementById('tgLimitlessSessionsImportPaste');
  const importConfirm = document.getElementById('tgLimitlessSessionsImportConfirm');

  let pendingImport = null;
  let lastDryRun = null;

  const refresh = () => {
    const sessions = listSessions();
    const active = getActiveSession();
    if (selectEl) {
      selectEl.innerHTML = sessions.length
        ? sessions.map((s) => `<option value="${s.id}">${s.started_at?.slice(0, 16)} · ${s.duration_sec ?? '?'}s</option>`).join('')
        : '<option value="">(no sessions)</option>';
    }
    if (reportEl) {
      reportEl.textContent = JSON.stringify(
        {
          active: active ? { id: active.id, started_at: active.started_at } : null,
          count: sessions.length,
          sessions: sessions.slice(0, 20).map((s) => ({
            id: s.id,
            started_at: s.started_at,
            duration_sec: s.duration_sec,
            notes: s.notes,
            summary: s.frequencies_summary,
          })),
        },
        null,
        2
      );
    }
  };

  document.getElementById('tgLimitlessSessionStart')?.addEventListener('click', () => {
    const r = startSessionLog({ note: noteEl?.value });
    if (reportEl) reportEl.textContent = JSON.stringify(r, null, 2);
    refresh();
  });

  document.getElementById('tgLimitlessSessionAddNote')?.addEventListener('click', () => {
    const r = addSessionNote(noteEl?.value);
    if (reportEl) reportEl.textContent = JSON.stringify(r, null, 2);
    refresh();
  });

  document.getElementById('tgLimitlessSessionStop')?.addEventListener('click', () => {
    const r = stopSessionLog();
    if (reportEl) reportEl.textContent = JSON.stringify(r, null, 2);
    refresh();
  });

  document.getElementById('tgLimitlessSessionDelete')?.addEventListener('click', () => {
    const id = selectEl?.value;
    if (!id || !confirm('Delete this session record?')) return;
    deleteSession(id);
    refresh();
  });

  document.getElementById('tgLimitlessSessionExport')?.addEventListener('click', () => {
    const pack = exportSessionsPack();
    const blob = new Blob([JSON.stringify(pack, null, 2)], { type: 'application/json' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `tg_limitless_sessions_${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(a.href);
  });

  document.getElementById('tgLimitlessSessionsDryRun')?.addEventListener('click', () => {
    try {
      pendingImport = JSON.parse(importPaste?.value?.trim() || '');
      lastDryRun = analyzeSessionsImport(pendingImport);
      if (reportEl) reportEl.textContent = JSON.stringify({ mode: 'SESSIONS_DRY_RUN', ...lastDryRun }, null, 2);
    } catch (e) {
      if (reportEl) reportEl.textContent = JSON.stringify({ ok: false, error: String(e) }, null, 2);
    }
  });

  document.getElementById('tgLimitlessSessionsApplyImport')?.addEventListener('click', () => {
    if (!lastDryRun?.ok || !pendingImport) return;
    if (!importConfirm?.checked) return;
    if (lastDryRun.overwriteCount > 0 && !confirm(`Merge ${lastDryRun.incomingCount} session(s)?`)) return;
    const r = applySessionsImport(pendingImport);
    if (reportEl) reportEl.textContent = JSON.stringify({ mode: 'SESSIONS_APPLIED', ...r }, null, 2);
    importConfirm.checked = false;
    pendingImport = null;
    lastDryRun = null;
    refresh();
  });

  document.getElementById('tgLimitlessSessionOpfsBackup')?.addEventListener('click', async () => {
    if (!isOpfsOptedIn()) {
      if (reportEl) reportEl.textContent = JSON.stringify({ error: 'OPFS opt-in required' }, null, 2);
      return;
    }
    const r = await saveSessionsBackupToOpfs(exportSessionsPack());
    if (reportEl) reportEl.textContent = JSON.stringify({ opfsSessionsBackup: r }, null, 2);
  });

  refresh();
}
