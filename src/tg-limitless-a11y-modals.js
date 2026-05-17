/**
 * Bounded modal accessibility — focus trap, Escape, focus return.
 * Does not alter prayer/read-along content.
 */

const FOCUSABLE =
  'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';

function getFocusables(root) {
  return Array.from(root.querySelectorAll(FOCUSABLE)).filter(
    (el) => el.offsetParent !== null || el === document.activeElement
  );
}

function trapFocus(backdrop, e) {
  if (e.key !== 'Tab' || !backdrop.classList.contains('visible')) return;
  const modal = backdrop.querySelector('.modal');
  if (!modal) return;
  const nodes = getFocusables(modal);
  if (!nodes.length) return;
  const first = nodes[0];
  const last = nodes[nodes.length - 1];
  if (e.shiftKey && document.activeElement === first) {
    e.preventDefault();
    last.focus();
  } else if (!e.shiftKey && document.activeElement === last) {
    e.preventDefault();
    first.focus();
  }
}

export function bindLimitlessModalA11y(backdropId, options = {}) {
  const backdrop = document.getElementById(backdropId);
  if (!backdrop) return;
  const modal = backdrop.querySelector('.modal');
  if (modal && !modal.getAttribute('role')) modal.setAttribute('role', 'dialog');
  if (!backdrop.getAttribute('aria-modal')) backdrop.setAttribute('aria-modal', 'true');
  const title = modal?.querySelector('h3');
  if (title && !backdrop.getAttribute('aria-labelledby')) {
    const id = `${backdropId}_title`;
    if (!title.id) title.id = id;
    backdrop.setAttribute('aria-labelledby', title.id);
  }

  let restoreFocus = null;

  const observer = new MutationObserver(() => {
    const open = backdrop.classList.contains('visible');
    if (open) {
      restoreFocus = document.activeElement;
      const nodes = modal ? getFocusables(modal) : [];
      const target = nodes[0] || modal;
      if (target && typeof target.focus === 'function') target.focus();
    } else if (restoreFocus && typeof restoreFocus.focus === 'function') {
      try {
        restoreFocus.focus();
      } catch {
        /* ignore stale nodes */
      }
      restoreFocus = null;
    }
  });
  observer.observe(backdrop, { attributes: true, attributeFilter: ['class'] });

  backdrop.addEventListener('keydown', (e) => trapFocus(backdrop, e));

  if (options.onEscape) {
    document.addEventListener('keydown', (e) => {
      if (e.key !== 'Escape' || !backdrop.classList.contains('visible')) return;
      options.onEscape();
    });
  }
}

export function initLimitlessModalA11y() {
  bindLimitlessModalA11y('wallpaperModal');
  bindLimitlessModalA11y('prayerEditModal');
}
