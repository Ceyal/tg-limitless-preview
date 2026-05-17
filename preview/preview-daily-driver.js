/**
 * Preview-only daily driver chrome — collapses diagnostics; does not alter engine defaults.
 */
(function () {
  const COLLAPSE_IDS = [
    'tgIntegratedTechHub',
    'tgFinalMarathonPanel',
    'tgMegaTechCandidatePanel',
    'tgWavLiveTapPanel',
    'tgAwFullRoutePanel',
    'tgLimitlessCapabilityPanel',
    'tgLimitlessWebkitPanel',
    'tgLimitlessPerfPanel',
    'tgLimitlessStoragePanel',
    'tgLimitlessOpfsPanel',
    'tgLimitlessPresetsPanel',
    'tgLimitlessSessionPanel',
    'tgLimitlessAuditPanel',
    'tgLimitlessExportTruthPanel',
  ];

  function wrapInDetails(el, summaryText) {
    if (!el || el.closest('details.tg-preview-diag-fold')) return;
    const details = document.createElement('details');
    details.className = 'tg-preview-diag-fold';
    const summary = document.createElement('summary');
    const h2 = el.querySelector(':scope > h2');
    summary.textContent =
      summaryText || (h2 ? h2.textContent.trim() : el.getAttribute('aria-label')) || 'Diagnostics section';
    el.parentNode.insertBefore(details, el);
    details.appendChild(summary);
    details.appendChild(el);
  }

  function init() {
    document.body.classList.add('tg-preview-daily-driver');

    const banner = document.querySelector('.tg-limitless-prototype-banner');
    if (banner) wrapInDetails(banner, 'Candidate identification banner');

    COLLAPSE_IDS.forEach((id) => {
      const el = document.getElementById(id);
      if (el) wrapInDetails(el);
    });

    const firstRun = document.querySelector('.tg-limitless-first-run-wrap');
    if (firstRun) wrapInDetails(firstRun, 'First-run checklist');

    const studio = document.getElementById('tgStudioPrimary');
    if (studio) {
      studio.scrollIntoView({ block: 'start', behavior: 'instant' });
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
