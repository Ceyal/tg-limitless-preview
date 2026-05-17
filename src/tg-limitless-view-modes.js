/**
 * UI view modes only — layout emphasis; does not change audio engine or storage semantics.
 */
import { ensureSequencePanelVisibleForTarget, scrollToAppTarget } from './tg-limitless-ux-layout.js';

const STORAGE_KEY = 'tg_limitless_view_mode_v1';

export const VIEW_MODES = [
  { id: 'studio', label: 'Studio View' },
  { id: 'focus', label: 'Focus View' },
  { id: 'body-journey', label: 'Body Journey View' },
  { id: 'breath-sync', label: 'Breath Sync View' },
  { id: 'read-along', label: 'Read-Along View' },
  { id: 'session', label: 'Session View' },
  { id: 'minimal', label: 'Minimal View' },
];

const BODY_CLASS_PREFIX = 'tg-view-';

function readStoredMode() {
  try {
    const v = localStorage.getItem(STORAGE_KEY);
    if (v && VIEW_MODES.some((m) => m.id === v)) return v;
  } catch {
    /* local-only preference */
  }
  return 'studio';
}

function applyMode(modeId) {
  const body = document.body;
  VIEW_MODES.forEach((m) => body.classList.remove(`${BODY_CLASS_PREFIX}${m.id}`));
  body.classList.add(`${BODY_CLASS_PREFIX}${modeId}`);
  body.dataset.tgViewMode = modeId;

  const seg = document.getElementById('tgViewModeSegment');
  if (seg) {
    seg.querySelectorAll('button[data-tg-view-mode]').forEach((btn) => {
      const on = btn.dataset.tgViewMode === modeId;
      btn.setAttribute('aria-pressed', on ? 'true' : 'false');
    });
  }

  const state = document.getElementById('tgViewModeState');
  if (state) {
    const label = VIEW_MODES.find((m) => m.id === modeId)?.label ?? modeId;
    state.textContent = `Active: ${label} · UI view only`;
  }

  if (modeId === 'read-along') {
    ensureSequencePanelVisibleForTarget('prayerViewerPanel');
    requestAnimationFrame(() => {
      scrollToAppTarget('prayerViewerPanel', { behavior: 'auto', block: 'start' });
    });
  }
}

function persistMode(modeId) {
  try {
    localStorage.setItem(STORAGE_KEY, modeId);
  } catch {
    /* ignore quota / file:// */
  }
}

function bindQuickNav() {
  document.querySelectorAll('[data-tg-scroll]').forEach((btn) => {
    btn.addEventListener('click', () => {
      const id = btn.getAttribute('data-tg-scroll');
      scrollToAppTarget(id, { behavior: 'smooth', block: 'start' });
    });
  });
}

/** Visual-only: mirror #visStatus ACTIVE/IDLE to body class for chrome animations. */
function bindVisualizerSignalChrome() {
  const status = document.getElementById('visStatus');
  if (!status) return;
  const sync = () => {
    const t = (status.textContent || '').toUpperCase();
    document.body.classList.toggle('tg-vis-signal-active', t.includes('ACTIVE'));
  };
  sync();
  const obs = new MutationObserver(sync);
  obs.observe(status, { childList: true, characterData: true, subtree: true });
}

/** Decorative bar heights from readout text — visual only, no audio graph access. */
function bindResonanceStripDecor() {
  const strip = document.getElementById('tgVisResonanceStrip');
  if (!strip) return;
  const bars = [...strip.querySelectorAll('span')];
  let tick = 0;
  setInterval(() => {
    if (!document.body.classList.contains('tg-vis-signal-active')) return;
    tick += 1;
    bars.forEach((bar, i) => {
      const h = 22 + ((Math.sin(tick * 0.15 + i) + 1) * 0.5) * 68;
      bar.style.height = `${h}%`;
    });
  }, 120);
}

export function initLimitlessViewModes() {
  const seg = document.getElementById('tgViewModeSegment');
  if (!seg) return;

  seg.querySelectorAll('button[data-tg-view-mode]').forEach((btn) => {
    btn.addEventListener('click', () => {
      const modeId = btn.dataset.tgViewMode;
      if (!modeId) return;
      applyMode(modeId);
      persistMode(modeId);
    });
  });

  applyMode(readStoredMode());
  bindQuickNav();
  bindVisualizerSignalChrome();
  bindResonanceStripDecor();
}
