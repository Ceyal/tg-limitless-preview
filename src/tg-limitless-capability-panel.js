/**
 * Runtime capability detection panel — detection only, no platform certification claims.
 */
import {
  TG_LIMITLESS_FROZEN_FALLBACK_SHA,
  TG_LIMITLESS_SHA_AUDIT_REL,
  detectRuntimeMode,
  detectBrowserLabel,
} from './tg-limitless-provenance.js';
import { installZeroNetworkGuard } from './tg-limitless-zero-network-guard.js';
import { probeWebCryptoBundleSha } from './tg-limitless-webcrypto-sha.mjs';
import { isOpfsOptedIn, probeOpfsCache } from './tg-limitless-opfs-cache.js';
import { getAuditLogCount } from './tg-limitless-integrity-audit.js';
import { getPwaInstallCapability } from './tg-limitless-pwa-install.js';
import { ROLLBACK_STORAGE_KEY } from '../harnesses/storage_migration/validator-core.mjs';
import { OPFS_META_KEY } from './tg-limitless-opfs-cache.js';

function readOpfsMeta() {
  try {
    const raw = localStorage.getItem(OPFS_META_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

function probeMediaRecorderMime(mime) {
  try {
    return typeof MediaRecorder !== 'undefined' && MediaRecorder.isTypeSupported(mime);
  } catch {
    return false;
  }
}

async function probeOpfs() {
  try {
    if (!navigator.storage?.getDirectory) return false;
    const root = await navigator.storage.getDirectory();
    const name = `tg_probe_${Date.now()}.txt`;
    const h = await root.getFileHandle(name, { create: true });
    const w = await h.createWritable();
    await w.write('probe');
    await w.close();
    await root.removeEntry(name);
    return true;
  } catch {
    return false;
  }
}

function probeWebCodecsAudioEncoder() {
  try {
    return typeof AudioEncoder !== 'undefined';
  } catch {
    return false;
  }
}

export async function collectCapabilities() {
  const mode = detectRuntimeMode();
  const guard = window.__tgLimitlessNetworkGuard?.getState?.() ?? null;
  const webCryptoSha = probeWebCryptoBundleSha();
  const opfsProbe = await probeOpfsCache();
  const opfsMeta = readOpfsMeta();
  const pwa = getPwaInstallCapability();
  const caps = {
    browserObserved: detectBrowserLabel(),
    isSecureContext: window.isSecureContext === true,
    crossOriginIsolated: self.crossOriginIsolated === true,
    sharedArrayBuffer: typeof SharedArrayBuffer !== 'undefined',
    audioWorkletNode: typeof AudioWorkletNode !== 'undefined',
    offlineAudioContext: typeof OfflineAudioContext !== 'undefined',
    mediaRecorder: typeof MediaRecorder !== 'undefined',
    mediaRecorderMime: {
      webmOpus: probeMediaRecorderMime('audio/webm;codecs=opus'),
      oggOpus: probeMediaRecorderMime('audio/ogg;codecs=opus'),
      mp4: probeMediaRecorderMime('audio/mp4'),
      mp4Aac: probeMediaRecorderMime('audio/mp4;codecs=mp4a.40.2'),
    },
    indexedDB: typeof indexedDB !== 'undefined',
    opfs: await probeOpfs(),
    opfsCachePrototype: opfsProbe,
    opfsOptedIn: isOpfsOptedIn(),
    opfsLastWriteStatus: opfsMeta.lastWriteStatus ?? '—',
    opfsLastReadStatus: opfsMeta.lastReadStatus ?? '—',
    webCodecsAudioEncoder: probeWebCodecsAudioEncoder(),
    serviceWorker: 'serviceWorker' in navigator,
    storagePersistenceApi: !!(navigator.storage && navigator.storage.persist),
    webCryptoSubtle: typeof crypto !== 'undefined' && !!crypto.subtle,
    webCryptoBundleSha: webCryptoSha,
    origin: location.origin || '(opaque)',
    runtimeMode: mode,
    zeroNetworkGuard: guard,
    frozenFallbackSha: TG_LIMITLESS_FROZEN_FALLBACK_SHA,
    activeForkSha: document.querySelector('[data-tg-active-fork-sha]')?.textContent?.trim() || '(see TAKE 1 SHA audit)',
    shaAuditPath: document.querySelector('[data-tg-sha-audit-path]')?.textContent?.trim() || TG_LIMITLESS_SHA_AUDIT_REL,
    serviceWorkerRegistered: !!(navigator.serviceWorker?.controller),
    storageBridgeDryRun: true,
    storageBridgeRollbackAvailable: !!localStorage.getItem(ROLLBACK_STORAGE_KEY),
    integrityAuditLogCount: getAuditLogCount(),
    pwaInstallPromptCaptured: pwa.beforeInstallPromptCaptured,
    pwaManifestLinked: pwa.manifestLinked,
  };
  return caps;
}

function row(key, value) {
  return `<tr><th scope="row">${key}</th><td>${value}</td></tr>`;
}

export async function renderCapabilityPanel() {
  const mount = document.getElementById('tgLimitlessCapabilityMount');
  if (!mount) return;
  const caps = await collectCapabilities();
  const guardState = caps.zeroNetworkGuard;
  const html = `
    <table class="tg-limitless-cap-table">
      <tbody>
        ${row('Browser (observed)', caps.browserObserved)}
        ${row('window.isSecureContext', caps.isSecureContext)}
        ${row('self.crossOriginIsolated', caps.crossOriginIsolated)}
        ${row('SharedArrayBuffer', caps.sharedArrayBuffer)}
        ${row('AudioWorkletNode', caps.audioWorkletNode)}
        ${row('OfflineAudioContext', caps.offlineAudioContext)}
        ${row('MediaRecorder', caps.mediaRecorder)}
        ${row('MIME audio/webm;codecs=opus', caps.mediaRecorderMime.webmOpus)}
        ${row('MIME audio/ogg;codecs=opus', caps.mediaRecorderMime.oggOpus)}
        ${row('MIME audio/mp4', caps.mediaRecorderMime.mp4)}
        ${row('MIME audio/mp4;codecs=mp4a.40.2', caps.mediaRecorderMime.mp4Aac)}
        ${row('IndexedDB', caps.indexedDB)}
        ${row('OPFS (navigator.storage.getDirectory)', caps.opfs)}
        ${row('OPFS cache prototype opted in', caps.opfsOptedIn)}
        ${row('OPFS bundle count', caps.opfsCachePrototype?.bundleCount ?? 0)}
        ${row('OPFS last write status', caps.opfsLastWriteStatus)}
        ${row('OPFS last read status', caps.opfsLastReadStatus)}
        ${row('Storage bridge dry-run', caps.storageBridgeDryRun)}
        ${row('Rollback snapshot available', caps.storageBridgeRollbackAvailable)}
        ${row('Integrity audit log entries', caps.integrityAuditLogCount)}
        ${row('WebCodecs AudioEncoder', caps.webCodecsAudioEncoder)}
        ${row('Service Worker API (not registered)', caps.serviceWorker)}
        ${row('Storage persistence API', caps.storagePersistenceApi)}
        ${row('Web Crypto subtle', caps.webCryptoSubtle)}
        ${row('Web Crypto bundle SHA', caps.webCryptoBundleSha.ok ? caps.webCryptoBundleSha.method : caps.webCryptoBundleSha.reason)}
        ${row('origin', caps.origin)}
        ${row('runtime mode', caps.runtimeMode)}
        ${row('zero-network guard', guardState ? `enabled · blocked=${guardState.blocked} allowed=${guardState.allowed}` : 'pending')}
        ${row('frozen fallback SHA', caps.frozenFallbackSha)}
        ${row('active fork SHA', caps.activeForkSha)}
        ${row('SHA audit path', caps.shaAuditPath)}
        ${row('Service Worker registered', caps.serviceWorkerRegistered)}
        ${row('PWA install prompt captured', caps.pwaInstallPromptCaptured)}
        ${row('PWA manifest linked (local)', caps.pwaManifestLinked)}
      </tbody>
    </table>
    <p class="tg-limitless-cap-note">Runtime detection only — not Safari/iOS GREEN · not 2027 certified · not production ready · no product Service Worker.</p>
  `;
  mount.innerHTML = html;
  window.__tgLimitlessCapabilities = caps;
}

export function initLimitlessHarnessUI() {
  installZeroNetworkGuard();
  void renderCapabilityPanel();
  document.addEventListener('tg-limitless-pwa-install-changed', () => {
    void renderCapabilityPanel();
  });
}
