/**
 * User-controlled PWA install prompt — no Service Worker registration.
 */
let deferredPrompt = null;

function setStatus(text) {
  const el = document.getElementById('tgPwaInstallStatus');
  if (el) el.textContent = text;
}

function updateButton() {
  const btn = document.getElementById('tgPwaInstallBtn');
  if (!btn) return;
  const canInstall = !!deferredPrompt;
  btn.disabled = !canInstall;
  if (!canInstall) {
    setStatus(
      'Install prompt not available in this browser/context (needs HTTPS or localhost, manifest, and beforeinstallprompt). No product Service Worker is registered.',
    );
  } else {
    setStatus('Install may be available — tap only when you choose to add a shortcut. Not an offline production PWA claim.');
  }
}

export function initLimitlessPwaInstall() {
  const btn = document.getElementById('tgPwaInstallBtn');
  if (!btn) return;

  window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault();
    deferredPrompt = e;
    updateButton();
    window.__tgLimitlessPwaInstallAvailable = true;
    document.dispatchEvent(new CustomEvent('tg-limitless-pwa-install-changed'));
  });

  window.addEventListener('appinstalled', () => {
    deferredPrompt = null;
    setStatus('App installed to home screen (browser-dependent). Still local prototype — not production.');
    updateButton();
    document.dispatchEvent(new CustomEvent('tg-limitless-pwa-install-changed'));
  });

  btn.addEventListener('click', async () => {
    if (!deferredPrompt) {
      updateButton();
      return;
    }
    deferredPrompt.prompt();
    try {
      await deferredPrompt.userChoice;
    } catch {
      /* user dismissed */
    }
    deferredPrompt = null;
    updateButton();
    document.dispatchEvent(new CustomEvent('tg-limitless-pwa-install-changed'));
  });

  updateButton();
}

export function getPwaInstallCapability() {
  return {
    beforeInstallPromptCaptured: !!deferredPrompt,
    serviceWorkerRegistered: !!(navigator.serviceWorker?.controller),
    manifestLinked: !!document.querySelector('link[rel="manifest"]'),
  };
}
