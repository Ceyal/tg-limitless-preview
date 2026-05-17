/**
 * AudioWorklet full-route candidate — experimental opt-in route only.
 * OFF by default · session-arm only · route enable is in-memory (no reload auto-enable).
 * Does not replace legacy graph unless explicitly enabled; fail-closed fallback.
 */
export const AW_FULL_ROUTE_VERSION = '2027_audioworklet_full_route_candidate_v1.1';
export const AW_FOUNDATION_WAV_SHA = '982AC64307B3DAB2A3E4E7D0173743F16FAECD91C23E44379BFAB171F3240ACF';
export const AW_LANE_ARM_KEY = 'tg_aw_full_route_lane_arm_v1';

const PROCESSOR_URL = './src/tg-audioworklet-processor.js';

const routeState = {
  status: 'OFF_BY_DEFAULT',
  classification: 'CANDIDATE_EXPERIMENTAL_ROUTE',
  processorLoaded: false,
  routeActive: false,
  fallback: { status: 'LEGACY_DEFAULT', lastReason: null },
  ab: { status: 'NOT_RUN', last: null },
};

let workletNode = null;
let moduleLoaded = false;
let legacyMuted = false;
let savedGainL = 0;
let savedGainR = 0;
let lastAb = null;
let lastDiag = null;

function getBridge() {
  return window.__TG_AUDIOWORKLET_FULL_ROUTE_BRIDGE__;
}

function laneArmed() {
  try {
    return sessionStorage.getItem(AW_LANE_ARM_KEY) === '1';
  } catch {
    return false;
  }
}

function setLaneArm(on) {
  try {
    if (on) sessionStorage.setItem(AW_LANE_ARM_KEY, '1');
    else sessionStorage.removeItem(AW_LANE_ARM_KEY);
  } catch {
    /* ignore */
  }
}

function detectSupport() {
  return {
    audioWorklet: typeof AudioWorkletNode !== 'undefined',
    secureContext: window.isSecureContext === true,
    audioContext: typeof AudioContext !== 'undefined',
  };
}

async function loadProcessorModule(ac) {
  if (moduleLoaded) return { ok: true };
  await ac.audioWorklet.addModule(PROCESSOR_URL);
  moduleLoaded = true;
  routeState.processorLoaded = true;
  return { ok: true };
}

function muteLegacy(bridge) {
  const gL = bridge.getGainL?.();
  const gR = bridge.getGainR?.();
  if (!gL || !gR) return false;
  savedGainL = gL.gain.value;
  savedGainR = gR.gain.value;
  const now = bridge.getAudioCtx().currentTime;
  gL.gain.setValueAtTime(0, now);
  gR.gain.setValueAtTime(0, now);
  legacyMuted = true;
  return true;
}

function unmuteLegacy(bridge) {
  if (!legacyMuted) return;
  const gL = bridge.getGainL?.();
  const gR = bridge.getGainR?.();
  if (gL && gR) {
    const now = bridge.getAudioCtx().currentTime;
    gL.gain.setValueAtTime(savedGainL, now);
    gR.gain.setValueAtTime(savedGainR, now);
  }
  legacyMuted = false;
}

function pushWorkletParams(bridge) {
  if (!workletNode) return;
  workletNode.port.postMessage({
    freqL: bridge.getFreqL?.() ?? 440,
    freqR: bridge.getFreqR?.() ?? 440,
    gainL: bridge.getVolL?.() ?? 0.15,
    gainR: bridge.getVolR?.() ?? 0.15,
  });
}

export async function enableWorkletRoute() {
  if (!laneArmed()) {
    return { ok: false, reason: 'lane_not_armed', classification: 'FAIL_CLOSED' };
  }
  const sup = detectSupport();
  if (!sup.audioWorklet) {
    routeState.status = 'UNSUPPORTED';
    return { ok: false, reason: 'audioworklet_unavailable', support: sup };
  }
  const bridge = getBridge();
  if (!bridge?.getAudioCtx || !bridge.getMasterGain || !bridge.getMerger) {
    routeState.status = 'FAIL_DISABLED';
    return { ok: false, reason: 'bridge_missing' };
  }
  if (!bridge.isPlaying?.()) {
    return {
      ok: false,
      reason: 'not_playing',
      note: 'Start legacy Play first — worklet replaces merger→masterGain feed only while playing',
    };
  }
  if (routeState.routeActive) {
    return { ok: true, status: 'already_active' };
  }

  const ac = bridge.getAudioCtx();
  const masterGain = bridge.getMasterGain();
  const merger = bridge.getMerger();

  try {
    await loadProcessorModule(ac);
    workletNode = new AudioWorkletNode(ac, 'tg-full-route-tone', {
      outputChannelCount: [2],
    });
    pushWorkletParams(bridge);
    try {
      merger.disconnect(masterGain);
    } catch {
      /* may already be disconnected */
    }
    workletNode.connect(masterGain);
    muteLegacy(bridge);
    routeState.routeActive = true;
    routeState.status = 'ENABLED_BY_USER';
    routeState.fallback = { status: 'WORKLET_ACTIVE', lastReason: null };
    return {
      ok: true,
      status: routeState.status,
      graphNote: 'merger→masterGain disconnected; worklet→masterGain; legacy gains muted',
      partialParity: true,
      notClaimed: ['E-mode vowelPanner', 'harmonics', 'LFO', 'noise', 'full legacy modulation'],
    };
  } catch (e) {
    await disableWorkletRoute({ reason: 'enable_failed', error: String(e) });
    routeState.status = 'FAIL_DISABLED';
    return { ok: false, reason: 'enable_failed', error: String(e) };
  }
}

export async function disableWorkletRoute(opts = {}) {
  const bridge = getBridge();
  const reason = opts.reason || 'user_disable';
  if (workletNode) {
    try {
      workletNode.disconnect();
    } catch {
      /* ignore */
    }
    workletNode = null;
  }
  if (bridge?.getMerger && bridge.getMasterGain) {
    try {
      bridge.reconnectLegacyMerger?.();
    } catch {
      /* ignore */
    }
  }
  if (bridge) unmuteLegacy(bridge);
  routeState.routeActive = false;
  routeState.status = 'OFF_BY_DEFAULT';
  routeState.fallback = { status: 'LEGACY_RESTORED', lastReason: reason };
  return { ok: true, fallback: routeState.fallback };
}

function analyzeTimeDomain(samples) {
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
  const rms = Math.sqrt(sumSq / (samples.length || 1));
  return {
    rms,
    peak,
    silenceRatio: silence / (samples.length || 1),
    clipRatio: clip / (samples.length || 1),
    notSilent: peak > 0.001 && rms > 0.0001,
  };
}

async function captureAnalyserSnapshot(durationMs = 400) {
  const bridge = getBridge();
  const analyser = bridge?.getAnalyser?.();
  const ac = bridge?.getAudioCtx?.();
  if (!analyser || !ac) return null;
  const buf = new Float32Array(analyser.fftSize);
  const samples = [];
  const t0 = performance.now();
  while (performance.now() - t0 < durationMs) {
    analyser.getFloatTimeDomainData(buf);
    samples.push(new Float32Array(buf));
    await new Promise((r) => setTimeout(r, 16));
  }
  const merged = new Float32Array(samples.length * buf.length);
  let o = 0;
  for (const s of samples) {
    merged.set(s, o);
    o += s.length;
  }
  return {
    sampleRate: ac.sampleRate,
    metrics: analyzeTimeDomain(merged),
    frames: merged.length,
  };
}

export async function runAbComparison() {
  const bridge = getBridge();
  if (!bridge?.isPlaying?.()) {
    return { ok: false, reason: 'not_playing' };
  }
  const legacySnap = await captureAnalyserSnapshot(350);
  const en = await enableWorkletRoute();
  if (!en.ok) {
    return { ok: false, reason: 'worklet_enable_failed', enable: en };
  }
  await new Promise((r) => setTimeout(r, 200));
  pushWorkletParams(bridge);
  const workletSnap = await captureAnalyserSnapshot(350);
  await disableWorkletRoute({ reason: 'ab_complete' });
  await new Promise((r) => setTimeout(r, 150));
  const legacyAfter = await captureAnalyserSnapshot(250);

  const tol = {
    rmsRatioMax: 4,
    peakMin: 0.0005,
  };
  const legacyOk = legacySnap?.metrics?.notSilent;
  const workletOk = workletSnap?.metrics?.notSilent;
  const restoreOk = legacyAfter?.metrics?.notSilent;
  const rmsRatio =
    legacySnap?.metrics?.rms && workletSnap?.metrics?.rms
      ? workletSnap.metrics.rms / Math.max(legacySnap.metrics.rms, 1e-9)
      : null;

  const pass =
    legacyOk &&
    workletOk &&
    restoreOk &&
    rmsRatio !== null &&
    rmsRatio > 1 / tol.rmsRatioMax &&
    rmsRatio < tol.rmsRatioMax;

  lastAb = {
    ok: pass,
    classification: pass ? 'AB_WITHIN_TOLERANCE' : 'AB_PARTIAL_TOOLING',
    legacy: legacySnap,
    worklet: workletSnap,
    legacyAfterDisable: legacyAfter,
    rmsRatio,
    tolerances: tol,
    limitation: 'Not sample-identical — analyser tap comparison only',
    timestamp: new Date().toISOString(),
  };
  routeState.ab = { status: pass ? 'PASS' : 'PARTIAL', last: lastAb };
  return lastAb;
}

export async function collectAwDiagnostics(candidateSha) {
  const bridge = getBridge();
  const sup = detectSupport();
  lastDiag = {
    schemaVersion: 'audioworklet_full_route_diagnostics_v1.1',
    candidateVersion: AW_FULL_ROUTE_VERSION,
    candidateSha: candidateSha || '(pending)',
    baselineSha: '07262E21170F5208A866E3052CF38C025ECCDD4F39E5091AFA4E49A72379D42C',
    wavFoundationSha: AW_FOUNDATION_WAV_SHA,
    megaFoundationSha: '7AC5389A4CCA12436C1A2A2189F3469DD927BC401FDA1EFBC357631FD936B125',
    support: sup,
    route: { ...routeState, laneArmed: laneArmed(), reloadAutoEnable: false },
    webmDefault: { status: 'AVAILABLE', note: 'MediaRecorder unchanged' },
    wavLiveTap: {
      status: window.__TG_WAV_LIVE_TAP_CANDIDATE__ ? 'AVAILABLE' : 'MISSING',
      note: 'Passive analyser parallel tap preserved from WAV foundation',
    },
    analyser: { present: !!bridge?.getAnalyser?.(), routeActive: routeState.routeActive },
    fallback: routeState.fallback,
    ab: routeState.ab,
    graphLaw: {
      legacyDefault: 'merger → masterGain → vowelFilter → [vowelPanner if E] → analyser → destination',
      workletInsert: 'worklet → masterGain (merger disconnected while active); legacy muted',
      noSecondProductContext: true,
      noDestinationReplace: true,
    },
    lastAb,
    timestamp: new Date().toISOString(),
  };
  return lastDiag;
}

function renderDiagnostics() {
  const pre = document.getElementById('tgAwFrDiagOut');
  if (!pre) return;
  collectAwDiagnostics(window.__TG_AW_FULL_ROUTE_CANDIDATE_SHA__).then((d) => {
    pre.textContent = JSON.stringify(d, null, 2);
  });
}

export function initAudioWorkletFullRouteCandidate() {
  const panel = document.getElementById('tgAwFullRoutePanel');
  if (!panel) return;

  const arm = document.getElementById('tgAwFrLaneArm');
  if (arm) {
    arm.checked = laneArmed();
    arm.addEventListener('change', () => {
      setLaneArm(arm.checked);
      if (!arm.checked && routeState.routeActive) disableWorkletRoute({ reason: 'lane_disarmed' });
      renderDiagnostics();
    });
  }

  document.getElementById('tgAwFrRouteEnable')?.addEventListener('click', async () => {
    const r = await enableWorkletRoute();
    const out = document.getElementById('tgAwFrRouteReport');
    if (out) out.textContent = JSON.stringify(r, null, 2);
    renderDiagnostics();
  });

  document.getElementById('tgAwFrRouteDisable')?.addEventListener('click', async () => {
    const r = await disableWorkletRoute({ reason: 'user_disable' });
    const out = document.getElementById('tgAwFrRouteReport');
    if (out) out.textContent = JSON.stringify(r, null, 2);
    renderDiagnostics();
  });

  document.getElementById('tgAwFrRunAb')?.addEventListener('click', async () => {
    const r = await runAbComparison();
    const out = document.getElementById('tgAwFrAbReport');
    if (out) out.textContent = JSON.stringify(r, null, 2);
    renderDiagnostics();
  });

  document.getElementById('tgAwFrCopyDiag')?.addEventListener('click', async () => {
    const d = await collectAwDiagnostics(window.__TG_AW_FULL_ROUTE_CANDIDATE_SHA__);
    try {
      await navigator.clipboard.writeText(JSON.stringify(d, null, 2));
    } catch {
      /* ignore */
    }
  });

  document.getElementById('tgAwFrRefreshDiag')?.addEventListener('click', () => renderDiagnostics());

  window.addEventListener('beforeunload', () => {
    if (routeState.routeActive) disableWorkletRoute({ reason: 'page_unload' });
  });

  (async () => {
    try {
      const res = await fetch('./index_2027_audioworklet_full_route_candidate.html', { cache: 'no-store' });
      const buf = await res.arrayBuffer();
      const hash = await crypto.subtle.digest('SHA-256', buf);
      const h = [...new Uint8Array(hash)]
        .map((b) => b.toString(16).padStart(2, '0'))
        .join('')
        .toUpperCase();
      window.__TG_AW_FULL_ROUTE_CANDIDATE_SHA__ = h;
      const el = document.getElementById('tgAwFrCandidateSha');
      if (el) el.textContent = h;
    } catch {
      /* ignore */
    }
    renderDiagnostics();
  })();

  window.__TG_AUDIOWORKLET_FULL_ROUTE_CANDIDATE__ = {
    version: AW_FULL_ROUTE_VERSION,
    enableWorkletRoute,
    disableWorkletRoute,
    runAbComparison,
    collectAwDiagnostics,
    routeState,
  };
}
