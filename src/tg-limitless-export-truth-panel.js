/**
 * Export Truth / Format Status — reads TG_TECH_EXPORT_TRUTH_DIAGNOSTICS (additive UI).
 */
import { detectBrowserLabel } from './tg-limitless-provenance.js';

const MIME_LABELS = [
  'audio/webm;codecs=opus',
  'audio/ogg;codecs=opus',
  'audio/mp4',
  'audio/mp4;codecs=mp4a.40.2',
];

function row(k, v) {
  const val = v == null || v === '' ? '—' : String(v);
  return `<tr><th scope="row">${k}</th><td>${val}</td></tr>`;
}

function probeMimeSupport() {
  const out = {};
  if (typeof MediaRecorder === 'undefined') {
    return { mediaRecorder: false, mime: out };
  }
  for (const m of MIME_LABELS) {
    try {
      out[m] = MediaRecorder.isTypeSupported(m);
    } catch {
      out[m] = false;
    }
  }
  return { mediaRecorder: true, mime: out };
}

function formatMimeSupport(probe) {
  if (!probe.mediaRecorder) return 'MediaRecorder unavailable';
  return MIME_LABELS.map((m) => `${m}: ${probe.mime[m] ? 'yes' : 'no'}`).join(' · ');
}

function renderFromPayload(payload) {
  const tbody = document.getElementById('tgLimitlessExportTruthBody');
  if (!tbody) return;
  const probe = probeMimeSupport();
  const last = payload || window.TG_TECH_EXPORT_TRUTH_DIAGNOSTICS?.lastResult || null;
  const effMime = last?.recorderMimeType || last?.blobType || last?.selectedMimeRequest || '—';
  const ext = last?.extensionChosen || '—';
  const ch0 = last?.channels?.[0];
  const html = `
    ${row('Browser (observed)', detectBrowserLabel())}
    ${row('Runtime MIME probe', formatMimeSupport(probe))}
    ${row('Selected / recorder MIME', effMime)}
    ${row('Blob type', last?.blobType ?? '—')}
    ${row('File extension (truth)', ext)}
    ${row('Last blob size (bytes)', last?.blobSizeBytes ?? '—')}
    ${row('Requested duration (s)', last?.requestedDurationSec ?? '—')}
    ${row('Wall duration (s)', last?.wallClockElapsedSec ?? '—')}
    ${row('Decode status', last?.decodeStatus ?? '—')}
    ${row('Decoded duration (s)', last?.decodedDurationSec ?? '—')}
    ${row('Sample rate', last?.decodedSampleRate ?? '—')}
    ${row('Channels', last?.decodedChannels ?? '—')}
    ${row('Peak (ch0)', ch0?.peak ?? '—')}
    ${row('RMS (ch0)', ch0?.rms ?? '—')}
    ${row('Silence flag', ch0?.silence ?? '—')}
    ${row('Clipping flag', ch0?.clipping ?? '—')}
    ${row('Last timestamp', last?.timestamp ?? '—')}
    ${row('Safari/iOS GREEN', 'not claimed — see WebKit matrix')}
  `;
  tbody.innerHTML = html;
  window.__tgLimitlessExportTruthPanel = { lastRendered: last, mimeProbe: probe };
}

export function initLimitlessExportTruthPanel() {
  renderFromPayload(null);
  window.addEventListener('tg-export-truth-updated', (ev) => {
    renderFromPayload(ev.detail);
  });
  let prev = null;
  setInterval(() => {
    const last = window.TG_TECH_EXPORT_TRUTH_DIAGNOSTICS?.lastResult;
    if (last && last !== prev) {
      prev = last;
      renderFromPayload(last);
    }
  }, 2000);
}
