/**
 * OPFS export-bundle cache — explicit opt-in only, no auto-write, not primary storage.
 */
import { TG_LIMITLESS_TAKE_BASELINE_SHA } from './tg-limitless-provenance.js';

export const OPFS_OPT_IN_KEY = 'tg_limitless_opfs_cache_opt_in_v1';
export const OPFS_META_KEY = 'tg_limitless_opfs_cache_meta_v1';
export const OPFS_INDEX_FILE = 'tg_limitless_opfs_bundle_index_v1.json';
export const OPFS_BUNDLES_DIR = 'tg_limitless_opfs_bundles';
export const OPFS_AUX_PRESETS_FILE = 'tg_limitless_opfs_presets_backup_v1.json';
export const OPFS_AUX_SESSIONS_FILE = 'tg_limitless_opfs_sessions_backup_v1.json';

/** @deprecated legacy single-file test cache — cleared with full clear */
export const OPFS_CACHE_FILE = 'tg_limitless_preset_cache_v1.json';

export function opfsApiAvailable() {
  return !!(navigator.storage && navigator.storage.getDirectory);
}

export function isOpfsOptedIn() {
  try {
    return localStorage.getItem(OPFS_OPT_IN_KEY) === '1';
  } catch {
    return false;
  }
}

function setOptIn(val) {
  if (val) localStorage.setItem(OPFS_OPT_IN_KEY, '1');
  else localStorage.removeItem(OPFS_OPT_IN_KEY);
}

function readMeta() {
  try {
    const raw = localStorage.getItem(OPFS_META_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

function writeMeta(patch) {
  const next = { ...readMeta(), ...patch };
  localStorage.setItem(OPFS_META_KEY, JSON.stringify(next));
}

async function getBundlesDir(create) {
  const root = await navigator.storage.getDirectory();
  return root.getDirectoryHandle(OPFS_BUNDLES_DIR, { create: !!create });
}

async function readIndex() {
  if (!opfsApiAvailable()) return { bundles: [] };
  try {
    const root = await navigator.storage.getDirectory();
    const h = await root.getFileHandle(OPFS_INDEX_FILE, { create: false });
    const text = await (await h.getFile()).text();
    const parsed = JSON.parse(text);
    return Array.isArray(parsed.bundles) ? parsed : { bundles: [] };
  } catch {
    return { bundles: [] };
  }
}

async function writeIndex(index) {
  const root = await navigator.storage.getDirectory();
  const h = await root.getFileHandle(OPFS_INDEX_FILE, { create: true });
  const body = JSON.stringify(index, null, 2);
  const w = await h.createWritable();
  await w.write(new TextEncoder().encode(body));
  await w.close();
}

function bundleFileName(id) {
  return `bundle_${id}.json`;
}

export async function probeOpfsCache() {
  if (!opfsApiAvailable()) {
    return { available: false, optedIn: isOpfsOptedIn(), reason: 'navigator.storage.getDirectory unavailable' };
  }
  const index = await readIndex();
  return {
    available: true,
    optedIn: isOpfsOptedIn(),
    bundleCount: index.bundles.length,
    indexPath: OPFS_INDEX_FILE,
    bundlesDir: OPFS_BUNDLES_DIR,
  };
}

export async function enableOpfsPrototype() {
  if (!opfsApiAvailable()) return { ok: false, error: 'OPFS unavailable' };
  setOptIn(true);
  return { ok: true, optedIn: true };
}

export function disableOpfsPrototype() {
  setOptIn(false);
  return { ok: true, optedIn: false };
}

/**
 * Save storage export bundle to OPFS (explicit user action, opt-in required).
 */
export async function saveExportBundleToOpfs(bundle, meta = {}) {
  if (!isOpfsOptedIn()) return { ok: false, error: 'Opt-in required before write' };
  if (!opfsApiAvailable()) return { ok: false, error: 'OPFS unavailable' };
  if (!bundle || bundle.export_kind !== 'tg_limitless_bundle') {
    return { ok: false, error: 'Invalid export bundle' };
  }

  const id = meta.id || `b_${Date.now()}`;
  const text = JSON.stringify(bundle, null, 2);
  const bytes = new TextEncoder().encode(text);
  const bundleSha =
    bundle.integrity?.bundle_sha256?.trim?.() ||
    meta.bundle_sha256 ||
    '';
  const entry = {
    id,
    created_at: new Date().toISOString(),
    source_lane: bundle.source?.lane || 'TG_WEB_APP_LIMITLESS',
    source_fork_sha: bundle.source?.source_sha || TG_LIMITLESS_TAKE_BASELINE_SHA,
    active_fork_sha: meta.active_fork_sha || TG_LIMITLESS_TAKE_BASELINE_SHA,
    schema_version: bundle.schema_version,
    bundle_sha256: bundleSha,
    size_bytes: bytes.length,
    warning_flags: meta.warning_flags || [],
    label: meta.label || `Export ${id}`,
    user_note: meta.user_note || '',
    experimental: true,
  };

  const dir = await getBundlesDir(true);
  const fh = await dir.getFileHandle(bundleFileName(id), { create: true });
  const w = await fh.createWritable();
  await w.write(bytes);
  await w.close();

  const index = await readIndex();
  index.bundles = (index.bundles || []).filter((b) => b.id !== id);
  index.bundles.unshift(entry);
  await writeIndex(index);

  writeMeta({
    lastWriteAt: entry.created_at,
    lastBundleId: id,
    bytesWritten: bytes.length,
    lastWriteStatus: 'ok',
  });
  return { ok: true, entry };
}

export async function listOpfsBundles() {
  if (!isOpfsOptedIn()) return { ok: false, error: 'Opt-in required', bundles: [] };
  const index = await readIndex();
  writeMeta({ lastReadAt: new Date().toISOString(), lastReadStatus: 'listed' });
  return { ok: true, bundles: index.bundles || [] };
}

export async function readOpfsBundleById(id) {
  if (!isOpfsOptedIn()) return { ok: false, error: 'Opt-in required' };
  if (!opfsApiAvailable()) return { ok: false, error: 'OPFS unavailable' };
  try {
    const dir = await getBundlesDir(false);
    const fh = await dir.getFileHandle(bundleFileName(id), { create: false });
    const text = await (await fh.getFile()).text();
    const bundle = JSON.parse(text);
    writeMeta({ lastReadAt: new Date().toISOString(), lastReadStatus: 'read', lastReadBundleId: id });
    return { ok: true, bundle, text, bytesRead: new TextEncoder().encode(text).length, meta: (await readIndex()).bundles?.find((b) => b.id === id) };
  } catch (e) {
    return { ok: false, error: String(e) };
  }
}

export async function deleteOpfsBundle(id) {
  if (!opfsApiAvailable()) return { ok: false, error: 'OPFS unavailable' };
  try {
    const dir = await getBundlesDir(false);
    await dir.removeEntry(bundleFileName(id));
    const index = await readIndex();
    index.bundles = (index.bundles || []).filter((b) => b.id !== id);
    await writeIndex(index);
    writeMeta({ lastDeleteAt: new Date().toISOString(), lastDeletedId: id });
    return { ok: true, deleted: id };
  } catch (e) {
    return { ok: false, error: String(e) };
  }
}

export async function clearOpfsCache() {
  if (!opfsApiAvailable()) return { ok: false, error: 'OPFS unavailable' };
  try {
    const root = await navigator.storage.getDirectory();
    try {
      await root.removeEntry(OPFS_BUNDLES_DIR, { recursive: true });
    } catch {
      /* may not exist */
    }
    try {
      await root.removeEntry(OPFS_INDEX_FILE);
    } catch {
      /* */
    }
    try {
      await root.removeEntry(OPFS_CACHE_FILE);
    } catch {
      /* legacy */
    }
    try {
      await root.removeEntry(OPFS_AUX_PRESETS_FILE);
    } catch {
      /* */
    }
    try {
      await root.removeEntry(OPFS_AUX_SESSIONS_FILE);
    } catch {
      /* */
    }
    writeMeta({ clearedAt: new Date().toISOString(), bytesWritten: 0, lastWriteStatus: 'cleared' });
    return { ok: true, cleared: true };
  } catch (e) {
    return { ok: false, error: String(e) };
  }
}

export async function savePresetsBackupToOpfs(pack) {
  if (!isOpfsOptedIn()) return { ok: false, error: 'Opt-in required' };
  const root = await navigator.storage.getDirectory();
  const h = await root.getFileHandle(OPFS_AUX_PRESETS_FILE, { create: true });
  const body = JSON.stringify({ kind: 'opfs_aux_presets', written_at: new Date().toISOString(), pack }, null, 2);
  const w = await h.createWritable();
  await w.write(new TextEncoder().encode(body));
  await w.close();
  return { ok: true, path: OPFS_AUX_PRESETS_FILE };
}

export async function saveSessionsBackupToOpfs(pack) {
  if (!isOpfsOptedIn()) return { ok: false, error: 'Opt-in required' };
  const root = await navigator.storage.getDirectory();
  const h = await root.getFileHandle(OPFS_AUX_SESSIONS_FILE, { create: true });
  const body = JSON.stringify({ kind: 'opfs_aux_sessions', written_at: new Date().toISOString(), pack }, null, 2);
  const w = await h.createWritable();
  await w.write(new TextEncoder().encode(body));
  await w.close();
  return { ok: true, path: OPFS_AUX_SESSIONS_FILE };
}

export function initLimitlessOpfsPanel(storageBridgeHooks = {}) {
  const panel = document.getElementById('tgLimitlessOpfsPanel');
  if (!panel) return;

  const reportEl = document.getElementById('tgLimitlessOpfsReport');
  const btnEnable = document.getElementById('tgLimitlessOpfsEnable');
  const btnSaveBundle = document.getElementById('tgLimitlessOpfsSaveBundle');
  const btnList = document.getElementById('tgLimitlessOpfsList');
  const btnLoadDryRun = document.getElementById('tgLimitlessOpfsLoadDryRun');
  const btnDelete = document.getElementById('tgLimitlessOpfsDeleteBundle');
  const btnClear = document.getElementById('tgLimitlessOpfsClear');
  const btnDisable = document.getElementById('tgLimitlessOpfsDisable');
  const selectEl = document.getElementById('tgLimitlessOpfsBundleSelect');
  const labelEl = document.getElementById('tgLimitlessOpfsBundleLabel');
  const noteEl = document.getElementById('tgLimitlessOpfsBundleNote');

  let autoWriteCount = 0;
  let cachedList = [];

  function render(state) {
    reportEl.textContent = JSON.stringify(
      {
        ...state,
        autoWriteOnLoadCount: autoWriteCount,
        meta: readMeta(),
        experimental: true,
        prototype: true,
      },
      null,
      2
    );
  }

  function syncButtons(optedIn, available) {
    btnEnable.disabled = optedIn || !available;
    btnSaveBundle.disabled = !optedIn || !available;
    btnList.disabled = !optedIn || !available;
    btnLoadDryRun.disabled = !optedIn || !available;
    btnDelete.disabled = !optedIn || !available;
    btnClear.disabled = !available;
    btnDisable.disabled = !optedIn;
    if (selectEl) selectEl.disabled = !optedIn || !available;
  }

  async function refresh() {
    const probe = await probeOpfsCache();
    syncButtons(probe.optedIn, probe.available);
    render(probe);
    window.__tgLimitlessOpfs = probe;
  }

  async function refreshSelect() {
    const listed = await listOpfsBundles();
    cachedList = listed.bundles || [];
    if (selectEl) {
      selectEl.innerHTML = cachedList.length
        ? cachedList.map((b) => `<option value="${b.id}">${b.label} · ${b.bundle_sha256?.slice(0, 8) || 'no-sha'}…</option>`).join('')
        : '<option value="">(no cached bundles)</option>';
    }
    render({ ...(await probeOpfsCache()), listed: cachedList });
  }

  btnEnable?.addEventListener('click', async () => {
    await enableOpfsPrototype();
    await refresh();
  });

  btnSaveBundle?.addEventListener('click', async () => {
    const bundle = storageBridgeHooks.getLastExportBundle?.();
    if (!bundle) {
      await refresh();
      return;
    }
    await saveExportBundleToOpfs(bundle, {
      label: labelEl?.value?.trim() || undefined,
      user_note: noteEl?.value || '',
      active_fork_sha: storageBridgeHooks.getActiveForkSha?.(),
    });
    await refreshSelect();
  });

  btnList?.addEventListener('click', async () => {
    await refreshSelect();
  });

  btnLoadDryRun?.addEventListener('click', async () => {
    const id = selectEl?.value;
    if (!id) return;
    const r = await readOpfsBundleById(id);
    if (!r.ok) {
      await refresh();
      return;
    }
    await storageBridgeHooks.loadBundleForDryRun?.(r.bundle, { source: 'OPFS', bundleId: id, meta: r.meta });
    await refresh();
  });

  btnDelete?.addEventListener('click', async () => {
    const id = selectEl?.value;
    if (!id || !confirm('Delete selected OPFS bundle?')) return;
    await deleteOpfsBundle(id);
    await refreshSelect();
  });

  btnClear?.addEventListener('click', async () => {
    if (!confirm('Clear all OPFS cached bundles?')) return;
    await clearOpfsCache();
    await refreshSelect();
  });

  btnDisable?.addEventListener('click', async () => {
    disableOpfsPrototype();
    await refresh();
  });

  void refresh();
}
