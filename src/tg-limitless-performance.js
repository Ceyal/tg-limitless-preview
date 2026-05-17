/**
 * Lightweight performance notes — local display only, no upload.
 */
export function initLimitlessPerformancePanel() {
  const mount = document.getElementById('tgLimitlessPerfMount');
  if (!mount) return;

  const nav = performance.getEntriesByType('navigation')[0];
  const loadMs = nav ? Math.round(nav.loadEventEnd - nav.startTime) : null;
  let visHidden = false;
  const visWrap = document.getElementById('visWrap');
  const obs = visWrap
    ? new IntersectionObserver((entries) => {
        visHidden = !entries[0]?.isIntersecting;
      }, { threshold: 0.05 })
    : null;
  if (visWrap && obs) obs.observe(visWrap);

  const paint = () => {
    const heap =
      performance.memory && typeof performance.memory.usedJSHeapSize === 'number'
        ? `${Math.round(performance.memory.usedJSHeapSize / 1048576)} MB used (Chromium only)`
        : '—';
    mount.textContent = [
      `Navigation load (approx): ${loadMs != null ? `${loadMs} ms` : '—'}`,
      `JS heap: ${heap}`,
      `Visualizer in view: ${visHidden ? 'no (decorative work may idle)' : 'yes'}`,
      `Reduced motion: ${window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'yes' : 'no'}`,
    ].join(' · ');
  };
  paint();
  setInterval(paint, 5000);
}
