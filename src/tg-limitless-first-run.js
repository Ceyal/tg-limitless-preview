/**
 * First-run checklist — local-only, dismissible, claim-safe.
 */
const STORAGE_KEY = 'tg_limitless_first_run_dismissed_v1';

const COPY = {
  title: 'First run — local prototype checklist',
  bullets: [
    'This is a local-only prototype — not production · not perfect · not 2027/2032 achieved.',
    'No cloud, accounts, or hidden telemetry.',
    'Storage import: dry-run first, then explicit confirm; rollback saved before apply.',
    'OPFS is experimental opt-in — no auto-write on load.',
    'Export format is runtime-detected — see Export Truth panel; no Safari/iOS GREEN unless matrix proves.',
    'PWA install may appear on some browsers — user choice only; no product Service Worker.',
    'UI view modes do not change the audio engine.',
  ],
};

export function initLimitlessFirstRun() {
  const panel = document.getElementById('tgLimitlessFirstRunPanel');
  const showBtn = document.getElementById('tgFirstRunShowHelp');
  if (!panel) return;

  let dismissed = false;
  try {
    dismissed = localStorage.getItem(STORAGE_KEY) === '1';
  } catch {
    /* file:// quota */
  }

  const show = () => {
    panel.hidden = false;
    panel.setAttribute('aria-hidden', 'false');
  };
  const hide = () => {
    panel.hidden = true;
    panel.setAttribute('aria-hidden', 'true');
    try {
      localStorage.setItem(STORAGE_KEY, '1');
    } catch {
      /* ignore */
    }
  };

  const list = panel.querySelector('.tg-first-run-list');
  if (list) {
    list.innerHTML = COPY.bullets.map((b) => `<li>${b}</li>`).join('');
  }

  panel.querySelector('#tgFirstRunDismiss')?.addEventListener('click', hide);
  showBtn?.addEventListener('click', show);

  if (!dismissed) show();
  else hide();

  window.__tgLimitlessFirstRun = { show, hide, reset: () => {
    try { localStorage.removeItem(STORAGE_KEY); } catch { /* */ }
    show();
  }};
}
