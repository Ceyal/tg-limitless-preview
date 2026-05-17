/**
 * TG Limitless 2027 Mega Tech Candidate v1.1 — candidate-only lanes.
 * OFF by default · opt-in · no telemetry · no product graph mutation unless lane enabled.
 */
import { writeWavPcm16, measureBuffer } from '../harnesses/wav_pcm/wav_core.js';

export const MEGA_CANDIDATE_VERSION = '2027_mega_tech_candidate_v1.1';
export const MEGA_BASELINE_SHA = '07262E21170F5208A866E3052CF38C025ECCDD4F39E5091AFA4E49A72379D42C';

const LANE_KEYS = {
  wav: 'tg_mega_lane_wav_v1',
  worklet: 'tg_mega_lane_worklet_v1',
  opfs: 'tg_mega_lane_opfs_v1',
  pwa: 'tg_mega_lane_pwa_v1',
  viz: 'tg_mega_lane_viz_v1',
  spatial: 'tg_mega_lane_spatial_v1',
};

const OPFS_PREFIX = 'tg_mega_candidate_opfs_';
const WAV_MAX_SEC = 30;
const WAV_MAX_BYTES = 48 * 1024 * 1024;

const localErrors = [];

function logError(msg) {
  localErrors.push({ t: new Date().toISOString(), msg: String(msg) });
  if (localErrors.length > 50) localErrors.shift();
  renderDiagnostics();
}

function laneEnabled(key) {
  try {
    return localStorage.getItem(key) === '1';
  } catch {
    return false;
  }
}

function setLane(key, on) {
  try {
    if (on) localStorage.setItem(key, '1');
    else localStorage.removeItem(key);
  } catch {
    /* ignore */
  }
}

function probeMime(mime) {
  try {
    return typeof MediaRecorder !== 'undefined' && MediaRecorder.isTypeSupported(mime);
  } catch {
    return false;
  }
}

function detectBrowser() {
  const ua = navigator.userAgent || '';
  if (/Edg\//.test(ua)) return `Edge ${ua.match(/Edg\/([\d.]+)/)?.[1] || '?'}`;
  if (/Firefox\//.test(ua)) return `Firefox ${ua.match(/Firefox\/([\d.]+)/)?.[1] || '?'}`;
  if (/Chrome\//.test(ua) && !/Edg\//.test(ua)) return `Chromium ${ua.match(/Chrome\/([\d.]+)/)?.[1] || '?'}`;
  if (/Safari\//.test(ua) && !/Chrome/.test(ua)) return `WebKit/Safari ${ua.match(/Version\/([\d.]+)/)?.[1] || '?'}`;
  return ua.slice(0, 80) || 'unknown';
}

function probeWebGL() {
  const c = document.createElement('canvas');
  return !!(c.getContext('webgl') || c.getContext('experimental-webgl'));
}

async function sha256Hex(buffer) {
  const hash = await crypto.subtle.digest('SHA-256', buffer);
  return [...new Uint8Array(hash)].map((b) => b.toString(16).padStart(2, '0')).join('').toUpperCase();
}

function validateWavBuffer(buf, expectedSamples, sampleRate, channels) {
  const view = new DataView(buf);
  const riff = String.fromCharCode(view.getUint8(0), view.getUint8(1), view.getUint8(2), view.getUint8(3));
  const wave = String.fromCharCode(view.getUint8(8), view.getUint8(9), view.getUint8(10), view.getUint8(11));
  const sr = view.getUint32(24, true);
  const ch = view.getUint16(22, true);
  const dataSize = view.getUint32(40, true);
  const expectedBytes = 44 + expectedSamples * 2 * channels;
  return {
    riffOk: riff === 'RIFF',
    waveOk: wave === 'WAVE',
    sampleRateOk: sr === sampleRate,
    channelsOk: ch === channels,
    byteSizeOk: buf.byteLength === expectedBytes && dataSize === expectedSamples * 2 * channels,
    riff,
    wave,
    sampleRate: sr,
    channels: ch,
    byteLength: buf.byteLength,
  };
}

/** @type {import('./tg-mega-tech-candidate.js').LaneState} */
const laneState = {
  wav: { status: 'OFF_BY_DEFAULT', classification: 'CANDIDATE_OPT_IN' },
  worklet: { status: 'OFF_BY_DEFAULT', classification: 'HARNESS_READY_NOT_PRODUCT_ROUTE' },
  opfs: { status: 'OFF_BY_DEFAULT', classification: 'CANDIDATE_OPT_IN' },
  pwa: { status: 'OFF_BY_DEFAULT', classification: 'CANDIDATE_USER_CLICK_SW' },
  viz: { status: 'OFF_BY_DEFAULT', classification: 'CANDIDATE_OVERLAY' },
  spatial: { status: 'OFF_BY_DEFAULT', classification: 'CANDIDATE_OPT_IN' },
};

let spatialNodes = null;
let vizOverlayRaf = null;
let workletAdapterLoaded = false;

async function exportWavCandidate() {
  if (!laneEnabled(LANE_KEYS.wav)) {
    return { ok: false, reason: 'lane_disabled' };
  }
  const durInput = document.getElementById('tgMegaWavDuration');
  const dur = Math.min(WAV_MAX_SEC, Math.max(0.5, parseFloat(durInput?.value || '2') || 2));
  const sr = 48000;
  const n = Math.floor(dur * sr);
  if (n * 2 + 44 > WAV_MAX_BYTES) {
    laneState.wav.status = 'FAIL_DISABLED';
    setLane(LANE_KEYS.wav, false);
    return { ok: false, reason: 'max_bytes_exceeded' };
  }
  const samples = new Float32Array(n);
  const freq = 440;
  for (let i = 0; i < n; i++) {
    samples[i] = 0.35 * Math.sin((2 * Math.PI * freq * i) / sr);
  }
  const wavBuf = writeWavPcm16(samples, sr, 1);
  const header = validateWavBuffer(wavBuf, n, sr, 1);
  let rms = 0;
  let peak = 0;
  for (let i = 0; i < samples.length; i++) {
    const v = samples[i];
    rms += v * v;
    peak = Math.max(peak, Math.abs(v));
  }
  rms = Math.sqrt(rms / n);
  let decodeOk = false;
  try {
    const ac = new AudioContext();
    const ab = await ac.decodeAudioData(wavBuf.slice(0));
    const m = measureBuffer(ab);
    decodeOk = Math.abs(m.duration - dur) < 0.05 && m.sampleRate === sr;
    await ac.close();
  } catch (e) {
    logError(`WAV decode: ${e}`);
  }
  const ok = header.riffOk && header.waveOk && header.sampleRateOk && header.byteSizeOk && decodeOk && rms > 0.001;
  if (!ok) {
    laneState.wav.status = 'FAIL_DISABLED';
    setLane(LANE_KEYS.wav, false);
    return { ok: false, header, rms, peak, decodeOk };
  }
  laneState.wav.status = 'PASS';
  const blob = new Blob([wavBuf], { type: 'audio/wav' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `tg_mega_candidate_${Date.now()}.wav`;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 5000);
  return {
    ok: true,
    classification: 'CANDIDATE_OFFLINE_PCM_WAV',
    note: 'WebM MediaRecorder remains default product export; this WAV is experimental offline PCM only.',
    header,
    rms,
    peak,
    decodeOk,
    sha256: await sha256Hex(wavBuf),
  };
}

async function loadWorkletAdapter() {
  if (workletAdapterLoaded) return;
  await new Promise((resolve, reject) => {
    const s = document.createElement('script');
    s.src = './src/tg-engine-audioworklet-disabled-adapter.js';
    s.onload = resolve;
    s.onerror = reject;
    document.head.appendChild(s);
  });
  workletAdapterLoaded = true;
}

async function probeWorkletLane() {
  if (!laneEnabled(LANE_KEYS.worklet)) return { enabled: false };
  await loadWorkletAdapter();
  const adapter = window.TG_ENGINE_AUDIOWORKLET_DISABLED_ADAPTER;
  const route = adapter?.routePlayStop?.();
  const hasWorklet = typeof AudioWorkletNode !== 'undefined';
  if (!hasWorklet) {
    laneState.worklet.status = 'UNAVAILABLE';
    return { ok: false, unavailable: true };
  }
  window.__TG_ENGINE_LAB_ENABLE_WORKLET_ADAPTER__ = true;
  const probe = await adapter.init();
  window.__TG_ENGINE_LAB_ENABLE_WORKLET_ADAPTER__ = false;
  await adapter.init();
  const pass = probe?.productAffected === false && route?.routed === false;
  laneState.worklet.status = pass ? 'PASS' : 'TOOLING_LIMITATION';
  return {
    ok: pass,
    classification: 'HARNESS_READY_NOT_PRODUCT_ROUTE',
    probe,
    route,
    note: 'Play/Stop never routes through AudioWorklet on candidate path.',
  };
}

async function opfsCandidateTest() {
  if (!navigator.storage?.getDirectory) {
    laneState.opfs.status = 'UNAVAILABLE';
    return { ok: false, unavailable: true };
  }
  const name = `${OPFS_PREFIX}probe_${Date.now()}.txt`;
  try {
    const root = await navigator.storage.getDirectory();
    const h = await root.getFileHandle(name, { create: true });
    const w = await h.createWritable();
    await w.write(JSON.stringify({ candidate: MEGA_CANDIDATE_VERSION, t: Date.now() }));
    await w.close();
    const f = await h.getFile();
    const text = await f.text();
    await root.removeEntry(name);
    const parsed = JSON.parse(text);
    laneState.opfs.status = parsed.candidate === MEGA_CANDIDATE_VERSION ? 'PASS' : 'FAIL_DISABLED';
    return { ok: laneState.opfs.status === 'PASS', read: parsed };
  } catch (e) {
    laneState.opfs.status = 'FAIL_DISABLED';
    setLane(LANE_KEYS.opfs, false);
    logError(`OPFS: ${e}`);
    return { ok: false, error: String(e) };
  }
}

async function registerCandidateSw() {
  if (!('serviceWorker' in navigator)) {
    laneState.pwa.status = 'UNAVAILABLE';
    return { ok: false };
  }
  try {
    const reg = await navigator.serviceWorker.register('./tg-mega-candidate-sw.js', {
      scope: './',
      updateViaCache: 'none',
    });
    laneState.pwa.status = 'ENABLED_BY_USER';
    return { ok: true, scope: reg.scope, state: reg.installing?.state || reg.active?.state };
  } catch (e) {
    laneState.pwa.status = 'FAIL_DISABLED';
    logError(`SW register: ${e}`);
    return { ok: false, error: String(e) };
  }
}

async function unregisterCandidateSw() {
  if (!('serviceWorker' in navigator)) return { ok: true };
  const regs = await navigator.serviceWorker.getRegistrations();
  let n = 0;
  for (const r of regs) {
    if (r.active?.scriptURL?.includes('tg-mega-candidate-sw')) {
      await r.unregister();
      n++;
    }
  }
  laneState.pwa.status = n ? 'OFF_BY_DEFAULT' : laneState.pwa.status;
  return { ok: true, unregistered: n };
}

function stopVizOverlay() {
  if (vizOverlayRaf) cancelAnimationFrame(vizOverlayRaf);
  vizOverlayRaf = null;
  const layer = document.getElementById('tgMegaVizOverlay');
  if (layer) layer.hidden = true;
  laneState.viz.status = laneEnabled(LANE_KEYS.viz) ? 'OFF_BY_DEFAULT' : laneState.viz.status;
}

function startVizOverlay() {
  const layer = document.getElementById('tgMegaVizOverlay');
  const canvas = document.getElementById('tgMegaVizCanvas');
  if (!layer || !canvas) return;
  layer.hidden = false;
  const ctx = canvas.getContext('2d');
  if (!ctx) {
    laneState.viz.status = 'FAIL_DISABLED';
    return;
  }
  let frames = 0;
  const t0 = performance.now();
  function frame() {
    ctx.fillStyle = 'rgba(6,8,7,0.35)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.strokeStyle = '#c9a068';
    ctx.beginPath();
    for (let x = 0; x < canvas.width; x++) {
      const y = canvas.height / 2 + (canvas.height / 4) * Math.sin((x + frames * 4) * 0.06);
      if (x === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }
    ctx.stroke();
    frames++;
    if (frames < 300 && laneEnabled(LANE_KEYS.viz)) {
      vizOverlayRaf = requestAnimationFrame(frame);
    } else {
      laneState.viz.status = frames >= 5 ? 'PASS' : 'FAIL_DISABLED';
      stopVizOverlay();
    }
  }
  laneState.viz.status = 'ENABLED_BY_USER';
  frame();
}

async function probeWebGpu() {
  try {
    if (!navigator.gpu) return false;
    const adapter = await navigator.gpu.requestAdapter();
    return !!adapter;
  } catch {
    return false;
  }
}

let spatialTeardown = null;

async function enableSpatialLane() {
  if (typeof PannerNode === 'undefined') {
    laneState.spatial.status = 'UNAVAILABLE';
    return { ok: false };
  }
  try {
    const ac = window.audioCtx || new AudioContext();
    if (!window.audioCtx) await ac.resume();
    const panner = ac.createPanner();
    panner.panningModel = 'HRTF';
    panner.distanceModel = 'inverse';
    spatialNodes = { ac, panner, inserted: false };
    laneState.spatial.status = 'ENABLED_BY_USER';
    return {
      ok: true,
      note: 'Harness-style probe only — does not rewire product master chain unless future charter merges.',
      panningModel: panner.panningModel,
    };
  } catch (e) {
    laneState.spatial.status = 'FAIL_DISABLED';
    setLane(LANE_KEYS.spatial, false);
    logError(`Spatial: ${e}`);
    return { ok: false, error: String(e) };
  }
}

function disableSpatialLane() {
  if (spatialTeardown) spatialTeardown();
  spatialNodes = null;
  spatialTeardown = null;
  laneState.spatial.status = 'OFF_BY_DEFAULT';
}

export async function collectMegaDiagnostics(candidateSha) {
  const mimeCandidates = [
    'audio/webm;codecs=opus',
    'audio/webm',
    'audio/wav',
    'audio/ogg;codecs=opus',
  ].map((m) => ({ mime: m, supported: probeMime(m) }));
  const webgpu = await probeWebGpu();
  return {
    schemaVersion: 'mega_tech_candidate_diagnostics_v1.1',
    candidateVersion: MEGA_CANDIDATE_VERSION,
    baselineSha: MEGA_BASELINE_SHA,
    candidateSha: candidateSha || '(pending)',
    browser: detectBrowser(),
    secureContext: window.isSecureContext === true,
    webAudio: typeof AudioContext !== 'undefined',
    mediaRecorder: typeof MediaRecorder !== 'undefined',
    mediaRecorderMimeCandidates: mimeCandidates,
    exportTruth: {
      default: 'WebM MediaRecorder',
      wav: 'candidate opt-in offline PCM only — not product-live',
    },
    audioWorklet: typeof AudioWorkletNode !== 'undefined',
    offlineAudioContext: typeof OfflineAudioContext !== 'undefined',
    opfs: !!navigator.storage?.getDirectory,
    indexedDb: typeof indexedDB !== 'undefined',
    localStorage: typeof localStorage !== 'undefined',
    serviceWorkerApi: 'serviceWorker' in navigator,
    serviceWorkerController: !!navigator.serviceWorker?.controller,
    webgl: probeWebGL(),
    webgpu,
    pannerNode: typeof PannerNode !== 'undefined',
    hrtfSupported: typeof PannerNode !== 'undefined',
    safariIos: 'REQUIRES_DEVICE',
    accessibility: 'REQUIRES_MANUAL',
    lanes: { ...laneState },
    laneFlags: Object.fromEntries(Object.entries(LANE_KEYS).map(([k, v]) => [k, laneEnabled(v)])),
    localErrors: [...localErrors],
    timestamp: new Date().toISOString(),
  };
}

function renderDiagnostics() {
  const pre = document.getElementById('tgMegaDiagOut');
  if (!pre) return;
  collectMegaDiagnostics(window.__TG_MEGA_CANDIDATE_SHA__).then((d) => {
    pre.textContent = JSON.stringify(d, null, 2);
  });
}

function bindLaneToggles() {
  const map = [
    ['tgMegaLaneWav', LANE_KEYS.wav, 'wav'],
    ['tgMegaLaneWorklet', LANE_KEYS.worklet, 'worklet'],
    ['tgMegaLaneOpfs', LANE_KEYS.opfs, 'opfs'],
    ['tgMegaLanePwa', LANE_KEYS.pwa, 'pwa'],
    ['tgMegaLaneViz', LANE_KEYS.viz, 'viz'],
    ['tgMegaLaneSpatial', LANE_KEYS.spatial, 'spatial'],
  ];
  for (const [id, key, lane] of map) {
    const el = document.getElementById(id);
    if (!el) continue;
    el.checked = laneEnabled(key);
    el.addEventListener('change', () => {
      setLane(key, el.checked);
      laneState[lane].status = el.checked ? 'ENABLED_BY_USER' : 'OFF_BY_DEFAULT';
      if (!el.checked && lane === 'viz') stopVizOverlay();
      if (!el.checked && lane === 'spatial') disableSpatialLane();
      renderDiagnostics();
    });
  }
}

export function initMegaTechCandidate() {
  const panel = document.getElementById('tgMegaTechCandidatePanel');
  if (!panel) return;

  bindLaneToggles();

  document.getElementById('tgMegaRefreshDiag')?.addEventListener('click', () => renderDiagnostics());
  document.getElementById('tgMegaCopyDiag')?.addEventListener('click', async () => {
    const d = await collectMegaDiagnostics(window.__TG_MEGA_CANDIDATE_SHA__);
    try {
      await navigator.clipboard.writeText(JSON.stringify(d, null, 2));
    } catch {
      /* fallback */
    }
  });

  document.getElementById('tgMegaWavExport')?.addEventListener('click', async () => {
    const r = await exportWavCandidate();
    const out = document.getElementById('tgMegaWavReport');
    if (out) out.textContent = JSON.stringify(r, null, 2);
    renderDiagnostics();
  });

  document.getElementById('tgMegaWorkletProbe')?.addEventListener('click', async () => {
    const r = await probeWorkletLane();
    const out = document.getElementById('tgMegaWorkletReport');
    if (out) out.textContent = JSON.stringify(r, null, 2);
    renderDiagnostics();
  });

  document.getElementById('tgMegaOpfsTest')?.addEventListener('click', async () => {
    if (!laneEnabled(LANE_KEYS.opfs)) {
      logError('Enable OPFS candidate lane first');
      return;
    }
    const r = await opfsCandidateTest();
    const out = document.getElementById('tgMegaOpfsReport');
    if (out) out.textContent = JSON.stringify(r, null, 2);
    renderDiagnostics();
  });

  document.getElementById('tgMegaOpfsClear')?.addEventListener('click', async () => {
    if (!navigator.storage?.getDirectory) return;
    try {
      const root = await navigator.storage.getDirectory();
      for await (const [name] of root.entries()) {
        if (name.startsWith(OPFS_PREFIX)) await root.removeEntry(name);
      }
    } catch (e) {
      logError(e);
    }
    renderDiagnostics();
  });

  document.getElementById('tgMegaPwaRegister')?.addEventListener('click', async () => {
    if (!laneEnabled(LANE_KEYS.pwa)) {
      logError('Enable PWA candidate lane first');
      return;
    }
    const r = await registerCandidateSw();
    document.getElementById('tgMegaPwaReport').textContent = JSON.stringify(r, null, 2);
    renderDiagnostics();
  });

  document.getElementById('tgMegaPwaUnregister')?.addEventListener('click', async () => {
    const r = await unregisterCandidateSw();
    document.getElementById('tgMegaPwaReport').textContent = JSON.stringify(r, null, 2);
    renderDiagnostics();
  });

  document.getElementById('tgMegaVizStart')?.addEventListener('click', () => {
    if (!laneEnabled(LANE_KEYS.viz)) return;
    startVizOverlay();
    renderDiagnostics();
  });

  document.getElementById('tgMegaSpatialProbe')?.addEventListener('click', async () => {
    if (!laneEnabled(LANE_KEYS.spatial)) return;
    const r = await enableSpatialLane();
    document.getElementById('tgMegaSpatialReport').textContent = JSON.stringify(r, null, 2);
    renderDiagnostics();
  });

  document.getElementById('tgMegaSpatialOff')?.addEventListener('click', () => {
    disableSpatialLane();
    renderDiagnostics();
  });

  (async () => {
    try {
      const res = await fetch('./index_2027_mega_tech_candidate.html', { cache: 'no-store' });
      const buf = await res.arrayBuffer();
      const h = await sha256Hex(buf);
      window.__TG_MEGA_CANDIDATE_SHA__ = h;
      const el = document.getElementById('tgMegaCandidateSha');
      if (el) el.textContent = h;
    } catch (e) {
      logError(`candidate SHA: ${e}`);
    }
    renderDiagnostics();
  })();

  window.__TG_MEGA_TECH_CANDIDATE__ = {
    version: MEGA_CANDIDATE_VERSION,
    collectMegaDiagnostics,
    laneState,
    exportWavCandidate,
    probeWorkletLane,
    opfsCandidateTest,
  };

  renderDiagnostics();
}
