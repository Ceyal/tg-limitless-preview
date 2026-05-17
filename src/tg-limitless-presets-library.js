/**
 * Local presets library — tone snapshots + metadata; import via dry-run.
 */
import { captureToneSnapshot, applyToneSnapshot, summarizeToneSnapshot } from './tg-limitless-app-snapshot.js';
import { TG_LIMITLESS_TAKE_BASELINE_SHA } from './tg-limitless-provenance.js';
import { isOpfsOptedIn } from './tg-limitless-opfs-cache.js';
import { savePresetsBackupToOpfs } from './tg-limitless-opfs-cache.js';

export const PRESETS_STORAGE_KEY = 'tg_limitless_presets_library_v1';

function readStore() {
  try {
    const raw = localStorage.getItem(PRESETS_STORAGE_KEY);
    const data = raw ? JSON.parse(raw) : { presets: [] };
    return Array.isArray(data.presets) ? data : { presets: [] };
  } catch {
    return { presets: [] };
  }
}

function writeStore(data) {
  localStorage.setItem(PRESETS_STORAGE_KEY, JSON.stringify(data));
}

function newId() {
  return `preset_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
}

export function listPresets() {
  return readStore().presets.slice().sort((a, b) => (b.updated_at || '').localeCompare(a.updated_at || ''));
}

export function getPreset(id) {
  return listPresets().find((p) => p.id === id) || null;
}

export function saveCurrentAsPreset({ label, notes, tags, favorite }) {
  const store = readStore();
  const now = new Date().toISOString();
  const preset = {
    id: newId(),
    label: label || `Preset ${store.presets.length + 1}`,
    notes: notes || '',
    tags: Array.isArray(tags) ? tags : [],
    favorite: !!favorite,
    created_at: now,
    updated_at: now,
    source: {
      lane: 'TG_WEB_APP_LIMITLESS',
      fork_sha: TG_LIMITLESS_TAKE_BASELINE_SHA,
      app_version_label: 'TG_WEB_APP_LIMITLESS v0.3 LONG TAKE 1',
    },
    tone: captureToneSnapshot(),
  };
  store.presets.push(preset);
  writeStore(store);
  return preset;
}

export function updatePreset(id, patch) {
  const store = readStore();
  const idx = store.presets.findIndex((p) => p.id === id);
  if (idx < 0) return { ok: false, error: 'Not found' };
  store.presets[idx] = {
    ...store.presets[idx],
    ...patch,
    updated_at: new Date().toISOString(),
  };
  writeStore(store);
  return { ok: true, preset: store.presets[idx] };
}

export function deletePreset(id) {
  const store = readStore();
  const before = store.presets.length;
  store.presets = store.presets.filter((p) => p.id !== id);
  writeStore(store);
  return { ok: store.presets.length < before };
}

export function duplicatePreset(id) {
  const src = getPreset(id);
  if (!src) return { ok: false, error: 'Not found' };
  const store = readStore();
  const now = new Date().toISOString();
  const copy = {
    ...JSON.parse(JSON.stringify(src)),
    id: newId(),
    label: `${src.label} (copy)`,
    created_at: now,
    updated_at: now,
  };
  store.presets.push(copy);
  writeStore(store);
  return { ok: true, preset: copy };
}

export function exportPresetsPack(ids = null) {
  const all = listPresets();
  const presets = ids ? all.filter((p) => ids.includes(p.id)) : all;
  return {
    kind: 'tg_limitless_presets_export_v1',
    exported_at: new Date().toISOString(),
    schema_version: 1,
    presets,
  };
}

export function analyzePresetsImport(pack) {
  const errors = [];
  if (!pack || pack.kind !== 'tg_limitless_presets_export_v1') {
    errors.push('Invalid presets pack kind');
  }
  if (!Array.isArray(pack?.presets)) errors.push('presets array required');
  const incoming = pack?.presets || [];
  const existing = listPresets();
  const overwrites = incoming.filter((p) => existing.some((e) => e.id === p.id));
  return {
    ok: errors.length === 0,
    errors,
    incomingCount: incoming.length,
    overwriteCount: overwrites.length,
    overwrites: overwrites.map((p) => p.id),
  };
}

export function applyPresetsImport(pack, { merge = true } = {}) {
  const analysis = analyzePresetsImport(pack);
  if (!analysis.ok) return { ok: false, errors: analysis.errors };
  const store = readStore();
  const byId = new Map(store.presets.map((p) => [p.id, p]));
  for (const p of pack.presets) {
    if (!p?.id || !p.tone) continue;
    byId.set(p.id, { ...p, updated_at: new Date().toISOString() });
  }
  store.presets = merge ? [...byId.values()] : pack.presets;
  writeStore(store);
  return { ok: true, count: store.presets.length };
}

function renderList(selectEl, reportEl) {
  const presets = listPresets();
  if (selectEl) {
    selectEl.innerHTML = presets.length
      ? presets
          .map(
            (p) =>
              `<option value="${p.id}">${p.favorite ? '★ ' : ''}${p.label} — ${summarizeToneSnapshot(p.tone)}</option>`
          )
          .join('')
      : '<option value="">(no presets)</option>';
  }
  if (reportEl) {
    reportEl.textContent = JSON.stringify({ count: presets.length, presets: presets.map((p) => ({
      id: p.id,
      label: p.label,
      favorite: p.favorite,
      tags: p.tags,
      updated_at: p.updated_at,
      summary: summarizeToneSnapshot(p.tone),
    })) }, null, 2);
  }
  return presets;
}

export function initLimitlessPresetsLibrary() {
  const panel = document.getElementById('tgLimitlessPresetsPanel');
  if (!panel) return;

  const labelEl = document.getElementById('tgLimitlessPresetLabel');
  const notesEl = document.getElementById('tgLimitlessPresetNotes');
  const tagsEl = document.getElementById('tgLimitlessPresetTags');
  const favEl = document.getElementById('tgLimitlessPresetFavorite');
  const selectEl = document.getElementById('tgLimitlessPresetSelect');
  const reportEl = document.getElementById('tgLimitlessPresetsReport');
  const filterEl = document.getElementById('tgLimitlessPresetFilter');
  const importPaste = document.getElementById('tgLimitlessPresetsImportPaste');
  const importConfirm = document.getElementById('tgLimitlessPresetsImportConfirm');

  let pendingImport = null;
  let lastDryRun = null;

  const refresh = () => {
    let presets = listPresets();
    const q = (filterEl?.value || '').trim().toLowerCase();
    if (q) {
      presets = presets.filter(
        (p) =>
          (p.label || '').toLowerCase().includes(q) ||
          (p.notes || '').toLowerCase().includes(q) ||
          (p.tags || []).some((t) => String(t).toLowerCase().includes(q))
      );
    }
    if (selectEl) {
      selectEl.innerHTML = presets.length
        ? presets.map((p) => `<option value="${p.id}">${p.favorite ? '★ ' : ''}${p.label}</option>`).join('')
        : '<option value="">(no presets)</option>';
    }
    if (reportEl) {
      reportEl.textContent = JSON.stringify(
        { count: presets.length, items: presets.map((p) => ({ id: p.id, label: p.label, summary: summarizeToneSnapshot(p.tone) })) },
        null,
        2
      );
    }
  };

  document.getElementById('tgLimitlessPresetSave')?.addEventListener('click', () => {
    saveCurrentAsPreset({
      label: labelEl?.value?.trim(),
      notes: notesEl?.value || '',
      tags: (tagsEl?.value || '').split(',').map((s) => s.trim()).filter(Boolean),
      favorite: !!favEl?.checked,
    });
    refresh();
  });

  document.getElementById('tgLimitlessPresetLoad')?.addEventListener('click', () => {
    const id = selectEl?.value;
    const p = getPreset(id);
    if (!p) return;
    applyToneSnapshot(p.tone);
    refresh();
  });

  document.getElementById('tgLimitlessPresetRename')?.addEventListener('click', () => {
    const id = selectEl?.value;
    const name = prompt('Rename preset', getPreset(id)?.label || '');
    if (!name || !id) return;
    updatePreset(id, { label: name });
    refresh();
  });

  document.getElementById('tgLimitlessPresetDelete')?.addEventListener('click', () => {
    const id = selectEl?.value;
    if (!id || !confirm('Delete this preset?')) return;
    deletePreset(id);
    refresh();
  });

  document.getElementById('tgLimitlessPresetDuplicate')?.addEventListener('click', () => {
    const id = selectEl?.value;
    if (!id) return;
    duplicatePreset(id);
    refresh();
  });

  document.getElementById('tgLimitlessPresetExportAll')?.addEventListener('click', () => {
    const pack = exportPresetsPack();
    const blob = new Blob([JSON.stringify(pack, null, 2)], { type: 'application/json' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `tg_limitless_presets_${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(a.href);
  });

  document.getElementById('tgLimitlessPresetExportSelected')?.addEventListener('click', () => {
    const id = selectEl?.value;
    if (!id) return;
    const pack = exportPresetsPack([id]);
    const blob = new Blob([JSON.stringify(pack, null, 2)], { type: 'application/json' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `tg_limitless_preset_${id}.json`;
    a.click();
    URL.revokeObjectURL(a.href);
  });

  document.getElementById('tgLimitlessPresetsDryRun')?.addEventListener('click', () => {
    lastDryRun = null;
    pendingImport = null;
    try {
      const pack = JSON.parse(importPaste?.value?.trim() || '');
      pendingImport = pack;
      lastDryRun = analyzePresetsImport(pack);
      if (reportEl) {
        reportEl.textContent = JSON.stringify({ mode: 'PRESETS_DRY_RUN', ...lastDryRun }, null, 2);
      }
    } catch (e) {
      if (reportEl) reportEl.textContent = JSON.stringify({ mode: 'PRESETS_DRY_RUN', ok: false, error: String(e) }, null, 2);
    }
  });

  document.getElementById('tgLimitlessPresetsApplyImport')?.addEventListener('click', () => {
    if (!lastDryRun?.ok || !pendingImport) return;
    if (!importConfirm?.checked) {
      if (reportEl) reportEl.textContent = JSON.stringify({ error: 'Import confirmation required' }, null, 2);
      return;
    }
    if (lastDryRun.overwriteCount > 0 && !confirm(`Overwrite ${lastDryRun.overwriteCount} preset(s)?`)) return;
    const r = applyPresetsImport(pendingImport);
    if (reportEl) reportEl.textContent = JSON.stringify({ mode: 'PRESETS_APPLIED', ...r }, null, 2);
    importConfirm.checked = false;
    pendingImport = null;
    lastDryRun = null;
    refresh();
  });

  document.getElementById('tgLimitlessPresetOpfsBackup')?.addEventListener('click', async () => {
    if (!isOpfsOptedIn()) {
      if (reportEl) reportEl.textContent = JSON.stringify({ error: 'OPFS opt-in required' }, null, 2);
      return;
    }
    const r = await savePresetsBackupToOpfs(exportPresetsPack());
    if (reportEl) reportEl.textContent = JSON.stringify({ opfsPresetsBackup: r }, null, 2);
  });

  filterEl?.addEventListener('input', refresh);
  refresh();
}
