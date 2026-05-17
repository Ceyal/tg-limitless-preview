/**
 * User-driven storage export/import — dry-run default, rollback, no network.
 */
import {
  analyzeImport,
  buildExportBundle,
  applyBundleToLocalStorage,
  restoreRollback,
  ROLLBACK_STORAGE_KEY,
} from '../harnesses/storage_migration/validator-core.mjs';
import {
  sha256CanonicalBundle,
  webCryptoAvailable,
  compareBundleIntegritySha,
} from './tg-limitless-webcrypto-sha.mjs';
import { appendIntegrityAudit } from './tg-limitless-integrity-audit.js';
import { TG_LIMITLESS_TAKE_BASELINE_SHA } from './tg-limitless-provenance.js';

function collectLocalSnapshot() {
  const snap = {};
  for (let i = 0; i < localStorage.length; i++) {
    const k = localStorage.key(i);
    if (k) snap[k] = localStorage.getItem(k);
  }
  return snap;
}

function renderReport(el, data) {
  el.textContent = JSON.stringify(data, null, 2);
}

function hasRtlOrNikud(str) {
  if (typeof str !== 'string') return false;
  return /[\u0590-\u05FF\uFB1D-\uFB4F]/.test(str) || /[\u0591-\u05C7]/.test(str);
}

function renderPreviewTable(previewEl, analysis, extras = {}) {
  if (!previewEl) return;
  const rows = [];
  const add = (label, value) => {
    rows.push(`<tr><th scope="row">${label}</th><td>${value}</td></tr>`);
  };

  const mode = extras.mode || analysis.mode || 'DRY_RUN';
  add('Mode', mode);
  add('Valid', analysis.valid === false || analysis.ok === false ? 'no' : analysis.ok || analysis.valid ? 'yes' : '—');
  add('Schema version', analysis.schema_version ?? '—');
  add('Source lane', analysis.source?.lane ?? extras.sourceLane ?? '—');
  add('Source SHA', analysis.sourceSha ?? extras.sourceSha ?? '—');
  add('Origin', extras.origin ?? '—');
  add('Integrity SHA status', extras.shaIntegrityStatus ?? analysis.shaIntegrity?.status ?? '—');
  if (extras.shaIntegrityProvided) add('Bundle SHA (provided)', extras.shaIntegrityProvided);
  if (extras.shaIntegrityComputed) add('Bundle SHA (computed)', extras.shaIntegrityComputed);
  add('Keys to import', (analysis.keysToImport || []).join(', ') || '(none)');
  add('Keys ignored', (analysis.keysIgnored || []).join(', ') || '(none)');
  add(
    'Destructive / overwrite',
    (analysis.destructiveChanges || []).length
      ? analysis.destructiveChanges.map((d) => `${d.key}: ${d.action}`).join('<br>')
      : '(none)'
  );
  add('Hebrew fields detected', String(analysis.hebrewFieldCount ?? (analysis.hebrewFields || []).length));
  const hebrewSamples = (analysis.hebrewFields || []).slice(0, 3);
  add(
    'Nikud / RTL presence',
    hebrewSamples.some((f) => hasRtlOrNikud(f.sample || '')) ? 'yes (Hebrew block detected)' : 'check prayer/nikud sections'
  );
  add('Rollback snapshot available', analysis.rollbackAvailable ? 'yes' : 'no');
  add('Will save rollback before apply', extras.willSaveRollbackBeforeApply !== false ? 'yes' : 'no');
  add('Bundle SHA (computed)', extras.computedBundleSha256 || analysis.computedBundleSha256 || '—');
  add('Web Crypto SHA', extras.webCryptoSha ?? '—');
  if (extras.webCryptoWarning) add('SHA warning', extras.webCryptoWarning);
  add(
    'Warnings',
    (analysis.warnings || []).length ? analysis.warnings.join('<br>') : '(none)'
  );
  add(
    'Errors',
    (analysis.errors || []).length ? analysis.errors.join('<br>') : extras.error ? String(extras.error) : '(none)'
  );

  previewEl.innerHTML = `<table class="tg-limitless-storage-preview-table"><tbody>${rows.join('')}</tbody></table>`;
}

let lastExportedBundle = null;

export function getLastExportBundle() {
  return lastExportedBundle;
}

export function initLimitlessStorageBridge() {
  const panel = document.getElementById('tgLimitlessStoragePanel');
  if (!panel) return null;

  const reportEl = document.getElementById('tgLimitlessStorageReport');
  const previewEl = document.getElementById('tgLimitlessStoragePreview');
  const pasteEl = document.getElementById('tgLimitlessStoragePaste');
  const fileEl = document.getElementById('tgLimitlessStorageFile');
  const btnExport = document.getElementById('tgLimitlessStorageExport');
  const btnDryRun = document.getElementById('tgLimitlessStorageDryRun');
  const btnApply = document.getElementById('tgLimitlessStorageApply');
  const btnRestore = document.getElementById('tgLimitlessStorageRestore');
  const confirmEl = document.getElementById('tgLimitlessStorageConfirm');
  const shaMismatchWrap = document.getElementById('tgLimitlessStorageShaMismatchWrap');
  const shaMismatchAck = document.getElementById('tgLimitlessStorageShaMismatchAck');

  let lastDryRun = null;
  let pendingBundle = null;
  let lastShaIntegrity = null;
  let lastImportSource = 'paste';

  function hasRollback() {
    return !!localStorage.getItem(ROLLBACK_STORAGE_KEY);
  }

  function updateRollbackUi() {
    if (btnRestore) btnRestore.disabled = !hasRollback();
  }

  function updateApplyButton() {
    if (!lastDryRun?.ok) {
      btnApply.disabled = true;
      return;
    }
    const needsConfirm = !confirmEl?.checked;
    const mismatchBlock =
      lastShaIntegrity?.status === 'MISMATCH' && !shaMismatchAck?.checked;
    btnApply.disabled = needsConfirm || mismatchBlock;
  }

  function logIntegrity(event, extra = {}) {
    appendIntegrityAudit({
      event,
      source_type: extra.source_type || lastImportSource,
      sha_status: lastShaIntegrity?.status || extra.sha_status,
      bundle_sha_declared: lastShaIntegrity?.provided ?? extra.bundle_sha_declared ?? null,
      bundle_sha_computed: lastShaIntegrity?.computed ?? extra.bundle_sha_computed ?? null,
      schema_version: extra.schema_version ?? pendingBundle?.schema_version ?? null,
      warning_level: extra.warning_level ?? 'info',
      override_used: !!extra.override_used,
      apply_blocked: !!extra.apply_blocked,
      ...extra,
    });
  }

  async function runDryRun(bundle, sourceMeta = {}) {
    btnApply.disabled = true;
    lastDryRun = null;
    pendingBundle = bundle;
    lastShaIntegrity = null;
    if (shaMismatchWrap) shaMismatchWrap.hidden = true;
    if (shaMismatchAck) shaMismatchAck.checked = false;
    lastImportSource = sourceMeta.source || 'paste';

    const snap = collectLocalSnapshot();
    const analysis = analyzeImport(bundle, {
      currentLocalKeys: snap,
      hasRollbackSnapshot: hasRollback(),
    });
    let webCryptoSha = '';
    let webCryptoWarning = null;
    let shaIntegrity = { status: 'UNAVAILABLE', provided: null, computed: null };

    if (analysis.ok) {
      if (webCryptoAvailable()) {
        webCryptoSha = await sha256CanonicalBundle(bundle);
        analysis.computedBundleSha256 = webCryptoSha;
        shaIntegrity = compareBundleIntegritySha(bundle, webCryptoSha);
      } else {
        webCryptoWarning = 'Web Crypto unavailable — integrity compare omitted';
        shaIntegrity = compareBundleIntegritySha(bundle, '');
      }
      if (shaIntegrity.status === 'MISSING') {
        analysis.warnings = [...(analysis.warnings || []), 'integrity.bundle_sha256 missing (warning only)'];
      }
      if (shaIntegrity.status === 'MISMATCH') {
        analysis.warnings = [
          ...(analysis.warnings || []),
          'integrity.bundle_sha256 MISMATCH — apply blocked until explicit override checkbox',
        ];
      }
    }

    analysis.shaIntegrity = shaIntegrity;
    lastShaIntegrity = shaIntegrity;
    lastDryRun = analysis;

    if (shaIntegrity.status === 'MISMATCH' && shaMismatchWrap) {
      shaMismatchWrap.hidden = false;
    }

    const auditEvent =
      shaIntegrity.status === 'MATCH'
        ? 'INTEGRITY_MATCH'
        : shaIntegrity.status === 'MISSING'
          ? 'INTEGRITY_MISSING'
          : shaIntegrity.status === 'MISMATCH'
            ? 'INTEGRITY_MISMATCH'
            : 'INTEGRITY_UNAVAILABLE';
    logIntegrity(auditEvent, {
      source_type: lastImportSource,
      sha_status: shaIntegrity.status,
      warning_level: shaIntegrity.status === 'MISMATCH' ? 'block' : shaIntegrity.status === 'MISSING' ? 'warn' : 'ok',
      apply_blocked: shaIntegrity.status === 'MISMATCH',
      bundle_sha_declared: shaIntegrity.provided,
      bundle_sha_computed: shaIntegrity.computed,
      schema_version: bundle.schema_version,
    });

    const report = {
      mode: 'DRY_RUN',
      valid: analysis.ok && analysis.valid !== false,
      schema_version: analysis.schema_version,
      keysToImport: analysis.keysToImport,
      keysIgnored: analysis.keysIgnored,
      destructiveChanges: analysis.destructiveChanges,
      hebrewFields: analysis.hebrewFields,
      hebrewFieldCount: analysis.hebrewFieldCount,
      errors: analysis.errors,
      warnings: analysis.warnings,
      rollbackAvailable: analysis.rollbackAvailable,
      willSaveRollbackBeforeApply: true,
      computedBundleSha256: analysis.computedBundleSha256,
      webCryptoSha,
      shaIntegrity,
      importBlockedByShaMismatch: shaIntegrity.status === 'MISMATCH',
      importSource: lastImportSource,
    };
    renderReport(reportEl, report);
    renderPreviewTable(previewEl, analysis, {
      mode: 'DRY_RUN',
      origin: bundle.source?.origin,
      sourceLane: bundle.source?.lane,
      sourceSha: analysis.sourceSha,
      webCryptoSha: webCryptoSha || '—',
      webCryptoWarning,
      willSaveRollbackBeforeApply: true,
      shaIntegrityStatus: shaIntegrity.status,
      shaIntegrityProvided: shaIntegrity.provided ?? '—',
      shaIntegrityComputed: shaIntegrity.computed ?? '—',
    });
    updateApplyButton();
    return report;
  }

  const hooks = {
    getLastExportBundle: () => lastExportedBundle,
    getActiveForkSha: () => TG_LIMITLESS_TAKE_BASELINE_SHA,
    loadBundleForDryRun: async (bundle, meta = {}) => {
      if (pasteEl) pasteEl.value = JSON.stringify(bundle, null, 2);
      if (fileEl) fileEl.value = '';
      await runDryRun(bundle, { source: meta.source || 'OPFS', bundleId: meta.bundleId });
    },
  };

  btnExport?.addEventListener('click', async () => {
    const bundle = buildExportBundle(collectLocalSnapshot(), {
      origin: location.origin,
      app_version_label: 'TG_WEB_APP_LIMITLESS v0.3 LONG TAKE 1',
    });
    let webCryptoSha = '';
    let webCryptoWarning = null;
    if (webCryptoAvailable()) {
      webCryptoSha = await sha256CanonicalBundle(bundle);
      bundle.integrity.bundle_sha256 = webCryptoSha;
    } else {
      webCryptoWarning = 'Web Crypto unavailable — bundle_sha256 left empty';
    }
    lastExportedBundle = bundle;
    window.__tgLimitlessLastExportBundle = bundle;

    const blob = new Blob([JSON.stringify(bundle, null, 2)], { type: 'application/json' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `tg_limitless_export_${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(a.href);
    renderReport(reportEl, {
      action: 'exported',
      bundle_sha256: bundle.integrity?.bundle_sha256,
      webCryptoSha,
      webCryptoWarning,
      readyForOpfsHandoff: true,
    });
    renderPreviewTable(
      previewEl,
      { ok: true, valid: true, schema_version: bundle.schema_version },
      {
        mode: 'EXPORT',
        origin: bundle.source?.origin,
        sourceLane: bundle.source?.lane,
        sourceSha: bundle.source?.source_sha,
        webCryptoSha: webCryptoSha || '—',
        webCryptoWarning,
        computedBundleSha256: webCryptoSha,
        shaIntegrityStatus: 'N/A (export)',
      }
    );
    updateRollbackUi();
  });

  async function loadBundleFromInputs() {
    if (fileEl?.files?.[0]) {
      lastImportSource = 'file';
      const text = await fileEl.files[0].text();
      return JSON.parse(text);
    }
    if (pasteEl?.value?.trim()) {
      lastImportSource = 'paste';
      return JSON.parse(pasteEl.value.trim());
    }
    throw new Error('Choose a file or paste JSON');
  }

  btnDryRun?.addEventListener('click', async () => {
    try {
      const bundle = await loadBundleFromInputs();
      await runDryRun(bundle);
    } catch (e) {
      const errReport = { mode: 'DRY_RUN', valid: false, error: String(e), shaIntegrity: { status: 'UNAVAILABLE' } };
      renderReport(reportEl, errReport);
      renderPreviewTable(previewEl, { ok: false, valid: false, errors: [String(e)] }, {
        mode: 'DRY_RUN',
        error: String(e),
        shaIntegrityStatus: 'UNAVAILABLE',
      });
      logIntegrity('DRY_RUN_FAILED', { source_type: lastImportSource, warning_level: 'error', error: String(e) });
    }
  });

  confirmEl?.addEventListener('change', updateApplyButton);
  shaMismatchAck?.addEventListener('change', () => {
    if (shaMismatchAck?.checked && lastShaIntegrity?.status === 'MISMATCH') {
      logIntegrity('OVERRIDE_ACKNOWLEDGED', {
        source_type: lastImportSource,
        sha_status: 'MISMATCH',
        override_used: false,
        warning_level: 'override_pending',
      });
    }
    updateApplyButton();
  });

  btnApply?.addEventListener('click', () => {
    if (!pendingBundle || !lastDryRun?.ok) {
      renderReport(reportEl, { error: 'Run successful dry-run first' });
      return;
    }
    if (!confirmEl?.checked) {
      renderReport(reportEl, { error: 'Confirmation checkbox required' });
      logIntegrity('APPLY_BLOCKED', { reason: 'no_confirm', apply_blocked: true, source_type: lastImportSource });
      return;
    }
    if (lastShaIntegrity?.status === 'MISMATCH' && !shaMismatchAck?.checked) {
      renderReport(reportEl, {
        error: 'Bundle SHA mismatch — apply blocked',
        shaIntegrity: lastShaIntegrity,
        importBlockedByShaMismatch: true,
      });
      logIntegrity('APPLY_BLOCKED', {
        sha_status: 'MISMATCH',
        apply_blocked: true,
        override_used: false,
        source_type: lastImportSource,
        warning_level: 'block',
      });
      return;
    }
    const overrideUsed = lastShaIntegrity?.status === 'MISMATCH' && shaMismatchAck?.checked;
    if (overrideUsed) {
      logIntegrity('OVERRIDE_APPLY', {
        sha_status: 'MISMATCH',
        override_used: true,
        source_type: lastImportSource,
        warning_level: 'override',
      });
    }
    const result = applyBundleToLocalStorage(pendingBundle, localStorage, { saveRollbackFirst: true });
    logIntegrity('APPLY_COMPLETED', {
      sha_status: lastShaIntegrity?.status,
      override_used: overrideUsed,
      source_type: lastImportSource,
      schema_version: pendingBundle.schema_version,
    });
    renderReport(reportEl, {
      mode: 'APPLIED',
      ...result,
      shaMismatchOverride: overrideUsed,
      reloadRecommended: true,
    });
    renderPreviewTable(
      previewEl,
      { ok: true, valid: true, keysToImport: lastDryRun.keysToImport },
      { mode: 'APPLIED', willSaveRollbackBeforeApply: true, shaIntegrityStatus: lastShaIntegrity?.status }
    );
    updateRollbackUi();
    btnApply.disabled = true;
    confirmEl.checked = false;
    if (shaMismatchAck) shaMismatchAck.checked = false;
    if (shaMismatchWrap) shaMismatchWrap.hidden = true;
  });

  btnRestore?.addEventListener('click', () => {
    if (!confirm('Restore previous snapshot? Current data will be overwritten.')) return;
    const result = restoreRollback(localStorage);
    logIntegrity('ROLLBACK_RESTORE', { source_type: 'local', warning_level: 'info' });
    renderReport(reportEl, { mode: 'RESTORE', ...result, reloadRecommended: true });
    renderPreviewTable(previewEl, { ok: result.ok }, { mode: 'RESTORE' });
    updateRollbackUi();
  });

  updateRollbackUi();
  return hooks;
}
