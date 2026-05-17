/**
 * WAV live analyser-tap candidate — passive parallel tap only.
 * Does not create AudioContext, disconnect analyser, or replace destination routing.
 */
import { writeWavPcm16, measureBuffer } from '../harnesses/wav_pcm/wav_core.js';

export const WAV_LIVE_CANDIDATE_VERSION = '2027_wav_live_tap_candidate_v1';
export const WAV_LIVE_LANE_KEY = 'tg_wav_live_tap_lane_v1';

const DEFAULT_MAX_SEC = 10;
const ABSOLUTE_MAX_SEC = 30;
const MAX_WAV_BYTES = 48 * 1024 * 1024;
const PROCESSOR_BUFFER = 4096;

const laneState = {
  offlinePcm: { status: 'OFF_BY_DEFAULT', classification: 'CANDIDATE_OFFLINE_PCM' },
  liveTap: { status: 'OFF_BY_DEFAULT', classification: 'CANDIDATE_ANALYSER_PARALLEL_TAP' },
  webmDefault: { status: 'AVAILABLE', classification: 'PRODUCT_MEDIARECORDER' },
};

let session = null;
let lastQa = null;

function laneEnabled() {
  try {
    return localStorage.getItem(WAV_LIVE_LANE_KEY) === '1';
  } catch {
    return false;
  }
}

function setLane(on) {
  try {
    if (on) localStorage.setItem(WAV_LIVE_LANE_KEY, '1');
    else localStorage.removeItem(WAV_LIVE_LANE_KEY);
  } catch {
    /* ignore */
  }
}

function getBridge() {
  return window.__TG_WAV_LIVE_TAP_BRIDGE__;
}

function mergeInterleavedStereo(leftChunks, rightChunks) {
  let total = 0;
  for (let i = 0; i < leftChunks.length; i++) total += leftChunks[i].length;
  const out = new Float32Array(total * 2);
  let o = 0;
  for (let i = 0; i < leftChunks.length; i++) {
    const L = leftChunks[i];
    const R = rightChunks[i];
    for (let j = 0; j < L.length; j++) {
      out[o++] = L[j];
      out[o++] = R[j];
    }
  }
  return { samples: out, frames: total };
}

function analyzePcm(samples, channels, sampleRate) {
  const frames = samples.length / channels;
  let peak = 0;
  let sumSq = 0;
  let silence = 0;
  let clip = 0;
  for (let i = 0; i < samples.length; i++) {
    const v = samples[i];
    const a = Math.abs(v);
    if (a > peak) peak = a;
    sumSq += v * v;
    if (a < 0.0001) silence++;
    if (a >= 0.999) clip++;
  }
  const rms = Math.sqrt(sumSq / samples.length);
  return {
    frames,
    sampleRate,
    channels,
    rms,
    peak,
    silenceRatio: silence / samples.length,
    clipRatio: clip / samples.length,
    notSilent: peak > 0.001 && rms > 0.0001,
    notClipped: peak <= 1.0 && clip / samples.length < 0.0001,
  };
}

function validateWavHeader(buf, sampleRate, channels, interleavedLength) {
  const view = new DataView(buf);
  const riff = String.fromCharCode(view.getUint8(0), view.getUint8(1), view.getUint8(2), view.getUint8(3));
  const wave = String.fromCharCode(view.getUint8(8), view.getUint8(9), view.getUint8(10), view.getUint8(11));
  const sr = view.getUint32(24, true);
  const ch = view.getUint16(22, true);
  const dataSize = view.getUint32(40, true);
  const expectedData = interleavedLength * 2;
  return {
    riffOk: riff === 'RIFF',
    waveOk: wave === 'WAVE',
    sampleRateOk: sr === sampleRate,
    channelsOk: ch === channels,
    byteSizeOk: buf.byteLength === 44 + expectedData && dataSize === expectedData,
    byteLength: buf.byteLength,
    expectedBytes: 44 + expectedData,
  };
}

function teardownSession() {
  if (!session) return;
  const s = session;
  session = null;
  if (s.stopTimer) clearTimeout(s.stopTimer);
  if (s.processor) s.processor.onaudioprocess = null;
  try {
    if (s.analyser && s.wavDest) s.analyser.disconnect(s.wavDest);
  } catch {
    /* ignore */
  }
  try {
    s.src?.disconnect();
    s.processor?.disconnect();
    s.mute?.disconnect();
  } catch {
    /* ignore */
  }
  try {
    s.wavDest?.stream?.getTracks?.().forEach((t) => t.stop());
  } catch {
    /* ignore */
  }
}

export function isWavLiveRecording() {
  return !!(session && session.recording);
}

export async function startWavLiveRecording(maxSecInput) {
  if (!laneEnabled()) {
    return { ok: false, reason: 'lane_disabled' };
  }
  const bridge = getBridge();
  if (!bridge?.getAudioCtx || !bridge?.getAnalyser) {
    return { ok: false, reason: 'bridge_missing' };
  }
  const ac = bridge.getAudioCtx();
  const analyser = bridge.getAnalyser();
  if (!ac || !analyser) {
    return { ok: false, reason: 'audio_graph_not_ready' };
  }
  if (!bridge.isPlaying?.()) {
    return {
      ok: false,
      reason: 'not_playing',
      note: 'Start Play/Stop audio before WAV live tap — tap is passive on analyser output',
    };
  }
  if (session?.recording) {
    return { ok: false, reason: 'already_recording' };
  }

  const durationSec = Math.min(
    ABSOLUTE_MAX_SEC,
    Math.max(1, parseFloat(maxSecInput) || DEFAULT_MAX_SEC),
  );
  const sampleRate = ac.sampleRate;
  const channels = 2;
  const maxFrames = Math.floor(durationSec * sampleRate);
  const estBytes = 44 + maxFrames * channels * 2;
  if (estBytes > MAX_WAV_BYTES) {
    laneState.liveTap.status = 'FAIL_DISABLED';
    setLane(false);
    return { ok: false, reason: 'memory_guard', estBytes, maxBytes: MAX_WAV_BYTES };
  }

  if (typeof ac.createScriptProcessor !== 'function') {
    laneState.liveTap.status = 'UNAVAILABLE';
    return { ok: false, reason: 'script_processor_unavailable', classification: 'YELLOW_TOOLING_LIMITATION' };
  }

  const wavDest = ac.createMediaStreamDestination();
  try {
    analyser.connect(wavDest);
  } catch (e) {
    return { ok: false, reason: 'tap_connect_failed', error: String(e) };
  }

  const src = ac.createMediaStreamSource(wavDest.stream);
  const processor = ac.createScriptProcessor(PROCESSOR_BUFFER, channels, channels);
  const mute = ac.createGain();
  mute.gain.value = 0;
  src.connect(processor);
  processor.connect(mute);
  mute.connect(ac.destination);

  const leftChunks = [];
  const rightChunks = [];
  let totalFrames = 0;

  session = {
    recording: true,
    startedAt: performance.now(),
    ac,
    analyser,
    wavDest,
    src,
    processor,
    mute,
    leftChunks,
    rightChunks,
    maxFrames,
    durationSec,
    sampleRate,
    channels,
    stopTimer: null,
  };

  processor.onaudioprocess = (ev) => {
    if (!session?.recording) return;
    const L = ev.inputBuffer.getChannelData(0);
    const R = ev.inputBuffer.numberOfChannels > 1 ? ev.inputBuffer.getChannelData(1) : L;
    session.leftChunks.push(new Float32Array(L));
    session.rightChunks.push(new Float32Array(R));
    totalFrames += L.length;
    if (totalFrames >= session.maxFrames) {
      stopWavLiveRecording({ autoStop: true }).catch(() => {});
    }
  };

  session.stopTimer = setTimeout(() => {
    stopWavLiveRecording({ autoStop: true }).catch(() => {});
  }, durationSec * 1000 + 250);

  laneState.liveTap.status = 'ENABLED_BY_USER';
  return {
    ok: true,
    status: 'recording',
    durationSec,
    sampleRate,
    channels,
    classification: 'WAV live tap candidate — experimental/off-by-default',
  };
}

export async function stopWavLiveRecording(opts = {}) {
  if (!session) {
    return lastQa || { ok: false, reason: 'no_active_session' };
  }
  session.recording = false;
  const s = session;
  const wallSec = (performance.now() - (s.startedAt || performance.now())) / 1000;

  teardownSession();

  const { samples, frames } = mergeInterleavedStereo(s.leftChunks, s.rightChunks);
  if (!frames) {
    laneState.liveTap.status = 'FAIL_DISABLED';
    setLane(false);
    lastQa = { ok: false, reason: 'no_samples', wallSec };
    return lastQa;
  }

  const wavBuf = writeWavPcm16(samples, s.sampleRate, s.channels);
  const header = validateWavHeader(wavBuf, s.sampleRate, s.channels, samples.length);
  const metrics = analyzePcm(samples, s.channels, s.sampleRate);

  let decodeOk = false;
  try {
    const dec = new AudioContext();
    const ab = await dec.decodeAudioData(wavBuf.slice(0));
    const m = measureBuffer(ab);
    decodeOk =
      Math.abs(m.duration - frames / s.sampleRate) < 0.08 &&
      m.sampleRate === s.sampleRate &&
      m.channels === s.channels;
    await dec.close();
  } catch (e) {
    metrics.decodeError = String(e);
  }

  const ok =
    header.riffOk &&
    header.waveOk &&
    header.sampleRateOk &&
    header.channelsOk &&
    header.byteSizeOk &&
    decodeOk &&
    metrics.notSilent;

  if (!ok && !opts.autoStop) {
    laneState.liveTap.status = 'FAIL_DISABLED';
    setLane(false);
  } else if (ok) {
    laneState.liveTap.status = 'PASS';
  } else {
    laneState.liveTap.status = 'FAIL_DISABLED';
  }

  lastQa = {
    ok,
    autoStop: !!opts.autoStop,
    wallSec,
    durationSec: frames / s.sampleRate,
    header,
    metrics,
    decodeOk,
    fallbackWebM: 'WebM MediaRecorder remains default — unchanged',
    byteLength: wavBuf.byteLength,
    expectedBytes: header.expectedBytes,
  };

  if (ok && typeof document !== 'undefined') {
    const blob = new Blob([wavBuf], { type: 'audio/wav' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `tg_wav_live_tap_${Date.now()}.wav`;
    a.click();
    setTimeout(() => URL.revokeObjectURL(url), 5000);
  }

  if (typeof document !== 'undefined') {
    const out = document.getElementById('tgWavLiveReport');
    if (out) out.textContent = JSON.stringify(lastQa, null, 2);
    renderWavDiagnostics();
  }

  return lastQa;
}

export function disableWavLiveLane() {
  if (session?.recording) {
    session.recording = false;
    teardownSession();
  }
  setLane(false);
  laneState.liveTap.status = 'OFF_BY_DEFAULT';
  renderWavDiagnostics();
}

export async function collectWavDiagnostics(candidateSha) {
  const bridge = getBridge();
  return {
    schemaVersion: 'wav_live_tap_diagnostics_v1',
    candidateVersion: WAV_LIVE_CANDIDATE_VERSION,
    candidateSha: candidateSha || '(pending)',
    baselineSha: '07262E21170F5208A866E3052CF38C025ECCDD4F39E5091AFA4E49A72379D42C',
    foundationSha: '7AC5389A4CCA12436C1A2A2189F3469DD927BC401FDA1EFBC357631FD936B125',
    webmDefault: { status: 'AVAILABLE', note: 'MediaRecorder session export unchanged' },
    wavOfflinePcm: laneState.offlinePcm,
    wavLiveTap: {
      ...laneState.liveTap,
      laneEnabled: laneEnabled(),
      recording: isWavLiveRecording(),
      scriptProcessor:
        typeof AudioContext !== 'undefined' &&
        typeof AudioContext.prototype.createScriptProcessor === 'function',
      bridgePresent: !!bridge,
      graphSafety: {
        passiveParallelTap: true,
        noNewAudioContext: true,
        noAnalyserDisconnectAll: true,
        noDestinationReplace: true,
      },
    },
    lastWavQa: lastQa,
    timestamp: new Date().toISOString(),
  };
}

function renderWavDiagnostics() {
  const pre = document.getElementById('tgWavLiveDiagOut');
  if (!pre) return;
  collectWavDiagnostics(window.__TG_WAV_LIVE_CANDIDATE_SHA__).then((d) => {
    pre.textContent = JSON.stringify(d, null, 2);
  });
}

export function initWavLiveTapCandidate() {
  const panel = document.getElementById('tgWavLiveTapPanel');
  if (!panel) return;

  const toggle = document.getElementById('tgWavLiveLaneEnable');
  if (toggle) {
    toggle.checked = laneEnabled();
    toggle.addEventListener('change', () => {
      setLane(toggle.checked);
      laneState.liveTap.status = toggle.checked ? 'OFF_BY_DEFAULT' : 'OFF_BY_DEFAULT';
      if (!toggle.checked) disableWavLiveLane();
      renderWavDiagnostics();
    });
  }

  document.getElementById('tgWavLiveStart')?.addEventListener('click', async () => {
    const dur = document.getElementById('tgWavLiveDuration')?.value;
    const r = await startWavLiveRecording(dur);
    const out = document.getElementById('tgWavLiveReport');
    if (out) out.textContent = JSON.stringify(r, null, 2);
    renderWavDiagnostics();
  });

  document.getElementById('tgWavLiveStop')?.addEventListener('click', async () => {
    await stopWavLiveRecording();
  });

  document.getElementById('tgWavLiveDisable')?.addEventListener('click', () => {
    disableWavLiveLane();
    const t = document.getElementById('tgWavLiveLaneEnable');
    if (t) t.checked = false;
  });

  document.getElementById('tgWavLiveCopyDiag')?.addEventListener('click', async () => {
    const d = await collectWavDiagnostics(window.__TG_WAV_LIVE_CANDIDATE_SHA__);
    try {
      await navigator.clipboard.writeText(JSON.stringify(d, null, 2));
    } catch {
      /* ignore */
    }
  });

  (async () => {
    try {
      const res = await fetch('./index_2027_wav_live_tap_candidate.html', { cache: 'no-store' });
      const buf = await res.arrayBuffer();
      const hash = await crypto.subtle.digest('SHA-256', buf);
      const h = [...new Uint8Array(hash)].map((b) => b.toString(16).padStart(2, '0')).join('').toUpperCase();
      window.__TG_WAV_LIVE_CANDIDATE_SHA__ = h;
      const el = document.getElementById('tgWavLiveCandidateSha');
      if (el) el.textContent = h;
    } catch {
      /* ignore */
    }
    renderWavDiagnostics();
  })();

  window.__TG_WAV_LIVE_TAP_CANDIDATE__ = {
    version: WAV_LIVE_CANDIDATE_VERSION,
    startWavLiveRecording,
    stopWavLiveRecording,
    disableWavLiveLane,
    collectWavDiagnostics,
    laneState,
    isWavLiveRecording,
  };
}
