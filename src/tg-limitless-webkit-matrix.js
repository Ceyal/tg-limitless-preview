/**
 * WebKit / Safari runtime matrix — detection only; no Safari/iOS GREEN claim.
 */
import { detectBrowserLabel, detectRuntimeMode } from './tg-limitless-provenance.js';

const MIME_CANDIDATES = [
  'audio/webm;codecs=opus',
  'audio/ogg;codecs=opus',
  'audio/mp4',
  'audio/mp4;codecs=mp4a.40.2',
];

async function probeDecodeSmoke() {
  if (typeof AudioContext === 'undefined') {
    return { status: 'unsupported', reason: 'AudioContext missing' };
  }
  const ctx = new AudioContext();
  try {
    await ctx.decodeAudioData(new ArrayBuffer(0));
    return { status: 'unexpected_ok', reason: 'empty buffer decoded' };
  } catch (e) {
    return { status: 'api_present', reason: 'decodeAudioData callable', detail: String(e) };
  } finally {
    await ctx.close().catch(() => {});
  }
}

export async function collectWebkitSafariMatrix() {
  const mime = {};
  const mr = typeof MediaRecorder !== 'undefined';
  for (const m of MIME_CANDIDATES) {
    try {
      mime[m] = mr && MediaRecorder.isTypeSupported(m);
    } catch {
      mime[m] = false;
    }
  }
  let opfs = false;
  try {
    opfs = !!(navigator.storage && navigator.storage.getDirectory);
    if (opfs) {
      const root = await navigator.storage.getDirectory();
      const name = `tg_wk_probe_${Date.now()}.txt`;
      const h = await root.getFileHandle(name, { create: true });
      const w = await h.createWritable();
      await w.write('p');
      await w.close();
      await root.removeEntry(name);
    }
  } catch {
    opfs = false;
  }

  const matrix = {
    matrixVersion: 'TAKE_3_1',
    testedAt: new Date().toISOString(),
    browserObserved: detectBrowserLabel(),
    userAgent: navigator.userAgent || '',
    runtimeMode: detectRuntimeMode(),
    isPlaywrightWebKit: /HeadlessWebKit|WebKit/i.test(navigator.userAgent || ''),
    iosSafariTested: false,
    safariIosGreenClaimed: false,
    pageLoad: document.readyState === 'complete' || document.readyState === 'interactive',
    isSecureContext: window.isSecureContext === true,
    crossOriginIsolated: self.crossOriginIsolated === true,
    mediaRecorder: mr,
    mediaRecorderMime: mime,
    decodeAudioDataSmoke: await probeDecodeSmoke(),
    opfs,
    indexedDB: typeof indexedDB !== 'undefined',
    webCryptoSubtle: typeof crypto !== 'undefined' && !!crypto.subtle,
    pwaBeforeInstallPrompt: !!window.__tgLimitlessPwaInstallAvailable,
    serviceWorkerApi: 'serviceWorker' in navigator,
    serviceWorkerProductRegistered: !!(navigator.serviceWorker?.controller),
    storageBridgePanel: !!document.getElementById('tgLimitlessStoragePanel'),
    playStopPresent: !!(document.getElementById('playBtn') || document.getElementById('seqPlayProfile')),
    exportControlsPresent: !!document.getElementById('rec_record_btn'),
    prayerPanelPresent: !!document.getElementById('prayerViewerPanel'),
    verdict:
      'Playwright WebKit smoke only — not iOS Safari — not Safari/iOS GREEN — not production certification',
  };
  window.__tgWebkitSafariMatrix = matrix;
  return matrix;
}

function row(k, v) {
  return `<tr><th scope="row">${k}</th><td>${typeof v === 'object' ? JSON.stringify(v) : v}</td></tr>`;
}

export async function renderWebkitSafariMatrixPanel() {
  const mount = document.getElementById('tgLimitlessWebkitMatrixMount');
  if (!mount) return;
  const m = await collectWebkitSafariMatrix();
  mount.innerHTML = `
    <table class="tg-limitless-cap-table"><tbody>
      ${row('Verdict', m.verdict)}
      ${row('Browser (observed)', m.browserObserved)}
      ${row('Playwright WebKit UA', m.isPlaywrightWebKit)}
      ${row('iOS Safari tested', m.iosSafariTested)}
      ${row('Runtime mode', m.runtimeMode)}
      ${row('Secure context', m.isSecureContext)}
      ${row('crossOriginIsolated', m.crossOriginIsolated)}
      ${row('MediaRecorder', m.mediaRecorder)}
      ${row('MIME support', m.mediaRecorderMime)}
      ${row('decodeAudioData smoke', m.decodeAudioDataSmoke)}
      ${row('OPFS', m.opfs)}
      ${row('IndexedDB', m.indexedDB)}
      ${row('Web Crypto', m.webCryptoSubtle)}
      ${row('SW product registered', m.serviceWorkerProductRegistered)}
    </tbody></table>
    <p class="tg-limitless-cap-note">Matrix is runtime detection — Playwright WebKit ≠ iOS Safari — no Safari/iOS GREEN unless separately proven on device.</p>
  `;
}

export function initLimitlessWebkitMatrix() {
  void renderWebkitSafariMatrixPanel();
}
