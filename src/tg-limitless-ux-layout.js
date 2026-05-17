/**
 * UX acceptance layout — reorder DOM for studio-first hierarchy (display only).
 */
const DIAG_KEY = 'tg_limitless_diagnostics_open_v1';

/** Targets inside #sequencePanel — panel is display:none until Sequence mode. */
const SEQUENCE_MODE_TARGETS = new Set([
  'sequencePanel',
  'profileTargetRail',
  'seqPlayProfile',
  'seqStopBtn',
  'seqAddPrayerBtn',
  'seqExportPrayerBtn',
  'seqLibraryList',
  'readAlongTextHeading',
  'prayerViewerPanel',
  'prayerTextViewer',
  'seqStatus',
]);

const HARNESS_SELECTORS = [
  '#tgLimitlessCapabilityPanel',
  '#tgLimitlessWebkitPanel',
  '.tg-limitless-first-run-wrap',
  '#tgLimitlessPerfPanel',
  '#tgLimitlessStoragePanel',
  '#tgLimitlessOpfsPanel',
  '#tgLimitlessPresetsPanel',
  '#tgLimitlessSessionPanel',
  '#tgLimitlessAuditPanel',
  '#tgLimitlessExportTruthPanel',
];

function readDiagnosticsOpen() {
  try {
    return localStorage.getItem(DIAG_KEY) === '1';
  } catch {
    return false;
  }
}

function persistDiagnosticsOpen(open) {
  try {
    localStorage.setItem(DIAG_KEY, open ? '1' : '0');
  } catch {
    /* local-only */
  }
}

function ensureDiagnosticsRegion() {
  let region = document.getElementById('tgDiagnosticsRegion');
  if (region) return document.getElementById('tgDiagnosticsInner');

  region = document.createElement('section');
  region.id = 'tgDiagnosticsRegion';
  region.className = 'tg-diagnostics-region';
  region.setAttribute('aria-label', 'Diagnostics trust and storage harness');

  const details = document.createElement('details');
  details.id = 'tgDiagnosticsDetails';
  details.className = 'tg-diagnostics-details';

  const summary = document.createElement('summary');
  summary.textContent = 'Diagnostics · trust · storage harness';

  const inner = document.createElement('div');
  inner.id = 'tgDiagnosticsInner';
  inner.className = 'tg-diagnostics-inner';

  details.appendChild(summary);
  details.appendChild(inner);
  region.appendChild(details);

  const footer = document.getElementById('tg-trust-footer-anchor');
  if (footer?.parentNode) {
    footer.parentNode.insertBefore(region, footer);
  } else {
    document.querySelector('.container')?.appendChild(region);
  }

  return inner;
}

function relocateHarnessPanels(diagInner) {
  HARNESS_SELECTORS.forEach((sel) => {
    const el = document.querySelector(sel);
    if (el && diagInner && el.parentNode !== diagInner) {
      el.removeAttribute('hidden');
      diagInner.appendChild(el);
    }
  });
}

function relocateStudioPrimary(studio) {
  if (!studio) return;

  const moves = [
    document.getElementById('dailyDriverHome'),
    document.querySelector('.mode-bar'),
    document.querySelector('.seq-actions'),
    document.querySelector('.hero-visualizer'),
  ];

  moves.forEach((el) => {
    if (el && el.parentNode !== studio) {
      studio.appendChild(el);
    }
  });

  const exportUi = document.getElementById('tg-export-ui');
  if (exportUi) {
    let wrap = document.getElementById('tgStudioExportWrap');
    if (!wrap) {
      wrap = document.createElement('div');
      wrap.id = 'tgStudioExportWrap';
      wrap.className = 'tg-studio-export-compact';
      studio.appendChild(wrap);
    }
    if (exportUi.parentNode !== wrap) {
      wrap.appendChild(exportUi);
    }
  }
}

/** Restore Sequence mode visibility (prayer/library live inside #sequencePanel). */
export function ensureSequencePanelVisibleForTarget(targetId) {
  if (!targetId || !SEQUENCE_MODE_TARGETS.has(targetId)) return;
  const modeSeq = document.getElementById('modeSequence');
  if (modeSeq && !modeSeq.classList.contains('active')) {
    modeSeq.click();
    return;
  }
  const panel = document.getElementById('sequencePanel');
  if (panel) panel.classList.add('visible');
}

export function scrollToAppTarget(targetId, options = {}) {
  if (!targetId) return;
  ensureSequencePanelVisibleForTarget(targetId);
  const el = document.getElementById(targetId);
  if (!el) return;
  el.scrollIntoView({
    behavior: options.behavior ?? 'smooth',
    block: options.block ?? 'start',
  });
  if (options.focus && typeof el.focus === 'function') {
    try {
      el.focus({ preventScroll: true });
    } catch {
      el.focus();
    }
  }
}

function removeDuplicateTitlebars() {
  const bars = document.querySelectorAll('header.tg-titlebar');
  if (bars.length > 1) {
    bars[bars.length - 1].remove();
  }
}

export function initLimitlessUxLayout() {
  removeDuplicateTitlebars();

  const diagInner = ensureDiagnosticsRegion();
  relocateHarnessPanels(diagInner);

  const studio = document.getElementById('tgStudioPrimary');
  relocateStudioPrimary(studio);

  const details = document.getElementById('tgDiagnosticsDetails');
  if (details) {
    const params = new URLSearchParams(window.location.search);
    const forceOpen = params.get('diag') === 'open' || navigator.webdriver === true;
    details.open = forceOpen || readDiagnosticsOpen();
    details.addEventListener('toggle', () => {
      persistDiagnosticsOpen(details.open);
    });
  }

  document.querySelectorAll('[data-tg-studio-action]').forEach((btn) => {
    btn.addEventListener('click', () => {
      const id = btn.getAttribute('data-tg-studio-action');
      scrollToAppTarget(id, { behavior: 'smooth', block: 'center', focus: true });
    });
  });
}
