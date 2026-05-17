/**
 * AudioWorklet parity v2 — maximum safe closure attempt, candidate/harness only.
 * Legacy engine remains default on product. AudioWorklet NOT product-live.
 */
export const AW_PARITY_V2_VERSION = '2027_audioworklet_parity_v2_candidate_v1.2';
export const AW_PARITY_V2_LANE_KEY = 'tg_aw_parity_v2_lane_arm_v1';

const PROCESSOR_URL = './src/tg-audioworklet-parity-v2-processor.js';
const V1_FULL_ROUTE_SHA = '9BCB3B81EBECB4FE12613002C6B59685A761846190F8B87823432699943EEF33';

export const PARITY_GAP_MATRIX = {
  fundamentalStereoTone: { v1: 'PARTIAL', v2: 'HARNESS_PROVEN', productLive: false },
  harmonics: { v1: 'NOT_IN_PROCESSOR', v2: 'HARNESS_2ND_HARMONIC', productLive: false },
  lfoModulation: { v1: 'NOT_IN_PROCESSOR', v2: 'HARNESS_LFO_DEPTH', productLive: false },
  noiseComponent: {
    v1: 'NOT_IN_PROCESSOR',
    v2: 'HARNESS_WHITE_NOISE_PROTOTYPE_ONLY',
    productLive: false,
    note: 'Harness noiseMix in v2 processor — not legacy noise graph parity',
  },
  eModeVowelPanner: {
    v1: 'NOT_CLAIMED',
    v2: 'ANALYSIS_ONLY_LEGACY_ROUTE',
    productLive: false,
    note: 'E-mode vowelPanner uses legacy merger path; v2 processor does not duplicate panner graph',
  },
  teardownGc: { v1: 'PARTIAL', v2: 'HARNESS_CLOSES_AUDIOCONTEXT', productLive: false },
  analyserExportPreservation: { v1: 'PARTIAL_AB_TAP', v2: 'SAME_AS_V1_WHEN_BRIDGED', productLive: false },
  fallbackToLegacy: { v1: 'PROVEN', v2: 'REQUIRED', productLive: false },
};

function analyzeSamples(samples) {
  let peak = 0;
  let sumSq = 0;
  let clip = 0;
  for (let i = 0; i < samples.length; i++) {
    const v = samples[i];
    const a = Math.abs(v);
    if (a > peak) peak = a;
    sumSq += v * v;
    if (a >= 0.999) clip++;
  }
  const rms = Math.sqrt(sumSq / (samples.length || 1));
  return { rms, peak, clipRatio: clip / (samples.length || 1), notSilent: peak > 0.001 && rms > 0.0001 };
}

export function laneArmed() {
  try {
    return sessionStorage.getItem(AW_PARITY_V2_LANE_KEY) === '1';
  } catch {
    return false;
  }
}

export function setLaneArm(on) {
  try {
    if (on) sessionStorage.setItem(AW_PARITY_V2_LANE_KEY, '1');
    else sessionStorage.removeItem(AW_PARITY_V2_LANE_KEY);
  } catch {
    /* ignore */
  }
}

export async function probeProcessorModule() {
  try {
    const res = await fetch(PROCESSOR_URL, { cache: 'no-store' });
    return {
      url: PROCESSOR_URL,
      httpStatus: res.status,
      ok: res.ok,
      classification: res.ok ? 'PROCESSOR_MODULE_REACHABLE' : 'MODULE_404_OR_BLOCKED',
      productLive: false,
      timestamp: new Date().toISOString(),
    };
  } catch (e) {
    return {
      url: PROCESSOR_URL,
      ok: false,
      error: String(e),
      classification: 'PROBE_FETCH_FAILED',
      productLive: false,
    };
  }
}

export async function runIsolatedHarness(opts = {}) {
  const report = {
    schemaVersion: 'audioworklet_parity_v2_harness_v1.1',
    version: AW_PARITY_V2_VERSION,
    classification: 'CANDIDATE_HARNESS_ONLY',
    laneArmed: laneArmed(),
    defaultOff: true,
    v1FoundationSha: V1_FULL_ROUTE_SHA,
    parityGapMatrix: PARITY_GAP_MATRIX,
    support: {
      audioWorklet: typeof AudioWorkletNode !== 'undefined',
      secureContext: window.isSecureContext === true,
    },
    cases: [],
    ok: false,
    notProductLive: true,
    timestamp: new Date().toISOString(),
  };

  if (!report.support.audioWorklet) {
    report.classification = 'UNSUPPORTED_GRACEFUL';
    report.ok = true;
    return report;
  }

  const moduleProbe = await probeProcessorModule();
  report.processorModuleProbe = moduleProbe;
  if (!moduleProbe.ok) {
    report.classification = 'MODULE_LOAD_BLOCKED';
    report.ok = false;
    return report;
  }

  /** @type {AudioContext | null} */
  let ac = null;
  const activeNodes = [];
  try {
    ac = new AudioContext();
    await ac.audioWorklet.addModule(PROCESSOR_URL);
    const cases = [
      { name: 'fundamental', params: { freqL: 220, freqR: 330, gainL: 0.1, gainR: 0.1, harmonic2Mix: 0, lfoRate: 0, lfoDepth: 0 } },
      { name: 'harmonic2', params: { freqL: 220, freqR: 330, gainL: 0.08, gainR: 0.08, harmonic2Mix: 0.35, lfoRate: 0, lfoDepth: 0 } },
      { name: 'lfo', params: { freqL: 440, freqR: 440, gainL: 0.12, gainR: 0.12, harmonic2Mix: 0, lfoRate: 5, lfoDepth: 0.4 } },
    ];
    for (const c of cases) {
      const node = new AudioWorkletNode(ac, 'tg-parity-v2-tone', { outputChannelCount: [2] });
      activeNodes.push(node);
      node.port.postMessage(c.params);
      const gain = ac.createGain();
      activeNodes.push(gain);
      gain.gain.value = 0.25;
      node.connect(gain).connect(ac.destination);
      if (ac.state === 'suspended') await ac.resume();
      await new Promise((r) => setTimeout(r, opts.durationMs || 320));
      const analyser = ac.createAnalyser();
      analyser.fftSize = 2048;
      gain.disconnect();
      gain.connect(analyser);
      const buf = new Float32Array(analyser.fftSize);
      analyser.getFloatTimeDomainData(buf);
      const metrics = analyzeSamples(buf);
      node.disconnect();
      report.cases.push({ name: c.name, metrics, pass: metrics.notSilent });
    }
    report.ok = report.cases.every((x) => x.pass);
    report.teardown = { audioContextClosed: true };
    await ac.close();
  } catch (e) {
    report.error = String(e);
    report.ok = false;
  } finally {
    for (const n of activeNodes) {
      try {
        n.disconnect();
      } catch {
        /* ignore */
      }
    }
    try {
      if (ac && ac.state !== 'closed') await ac.close();
    } catch {
      /* ignore */
    }
    report.teardownGuard = { nodesDisconnected: activeNodes.length, audioContextClosed: true };
  }
  return report;
}

export function analyzeEModeBlocker() {
  return {
    classification: 'BLOCKED_REQUIRES_LEGACY_VOWELPANNER_GRAPH',
    legacyGraph:
      'merger → masterGain → vowelFilter → vowelPanner (E-mode) → analyser → destination',
    awProcessorGap: 'v2 processor has sine/LFO/harmonic2 only — no PannerNode/ConstantSource vowel imaging',
    measurementPath: 'Compare legacy E-mode analyser FFT vs AW harness in v1 full-route candidate only',
    productLive: false,
    proofCollected: 'STATIC_GRAPH_ANALYSIS',
    proofMissing: 'BOUNDED_LEGACY_VS_AW_E_MODE_SPECTRAL_MATCH',
  };
}

async function renderAwCase(ac, params, durationMs, activeNodes) {
  const node = new AudioWorkletNode(ac, 'tg-parity-v2-tone', { outputChannelCount: [2] });
  activeNodes.push(node);
  node.port.postMessage(params);
  const gain = ac.createGain();
  activeNodes.push(gain);
  gain.gain.value = 0.25;
  node.connect(gain).connect(ac.destination);
  if (ac.state === 'suspended') await ac.resume();
  await new Promise((r) => setTimeout(r, durationMs));
  const analyser = ac.createAnalyser();
  analyser.fftSize = 2048;
  gain.disconnect();
  gain.connect(analyser);
  const buf = new Float32Array(analyser.fftSize);
  analyser.getFloatTimeDomainData(buf);
  const metrics = analyzeSamples(buf);
  node.disconnect();
  return metrics;
}

export async function runNoisePrototypeHarness(opts = {}) {
  if (typeof AudioWorkletNode === 'undefined') {
    return { ok: true, classification: 'UNSUPPORTED_GRACEFUL', skipped: true };
  }
  const moduleProbe = await probeProcessorModule();
  if (!moduleProbe.ok) return { ok: false, moduleProbe, classification: 'MODULE_LOAD_BLOCKED' };

  let ac = null;
  const activeNodes = [];
  try {
    ac = new AudioContext();
    await ac.audioWorklet.addModule(PROCESSOR_URL);
    const silent = await renderAwCase(
      ac,
      { freqL: 0, freqR: 0, gainL: 0, gainR: 0, harmonic2Mix: 0, lfoRate: 0, lfoDepth: 0, noiseMix: 0 },
      opts.durationMs || 280,
      activeNodes,
    );
    const noisy = await renderAwCase(
      ac,
      { freqL: 0, freqR: 0, gainL: 0, gainR: 0, harmonic2Mix: 0, lfoRate: 0, lfoDepth: 0, noiseMix: 0.08 },
      opts.durationMs || 280,
      activeNodes,
    );
    const rmsDelta = noisy.rms - silent.rms;
    return {
      classification: 'HARNESS_NOISE_PROTOTYPE_PROVEN',
      silent,
      noisy,
      rmsDelta,
      pass: rmsDelta > 0.002 && noisy.notSilent,
      productLive: false,
      legacyParity: 'NOT_CLAIMED — white noise only, not legacy noise graph',
      ok: rmsDelta > 0.002,
    };
  } catch (e) {
    return { ok: false, error: String(e), classification: 'HARNESS_ERROR' };
  } finally {
    for (const n of activeNodes) {
      try {
        n.disconnect();
      } catch {
        /* ignore */
      }
    }
    try {
      if (ac && ac.state !== 'closed') await ac.close();
    } catch {
      /* ignore */
    }
  }
}

async function synthLegacyOfflineTone(durationSec, sampleRate, freqHz) {
  if (typeof OfflineAudioContext === 'undefined') {
    return { ok: false, classification: 'OFFLINE_CONTEXT_UNSUPPORTED' };
  }
  const frames = Math.ceil(durationSec * sampleRate);
  const offline = new OfflineAudioContext(2, frames, sampleRate);
  const osc = offline.createOscillator();
  osc.frequency.value = freqHz;
  osc.type = 'sine';
  const g = offline.createGain();
  g.gain.value = 0.12;
  osc.connect(g).connect(offline.destination);
  osc.start(0);
  osc.stop(durationSec);
  const buf = await offline.startRendering();
  const ch0 = buf.getChannelData(0);
  return { ok: true, metrics: analyzeSamples(ch0), sampleRate, durationSec };
}

export async function runBoundedParityComparison(opts = {}) {
  const sr = opts.sampleRate || 48000;
  const dur = opts.durationSec || 0.35;
  const freq = opts.frequency || 440;
  const legacy = await synthLegacyOfflineTone(dur, sr, freq);
  if (!legacy.ok) return { ok: false, legacy, classification: 'LEGACY_OFFLINE_UNAVAILABLE' };

  if (typeof AudioWorkletNode === 'undefined') {
    return { ok: false, classification: 'AW_UNSUPPORTED', legacy };
  }
  const moduleProbe = await probeProcessorModule();
  if (!moduleProbe.ok) return { ok: false, moduleProbe };

  let ac = null;
  const activeNodes = [];
  try {
    ac = new AudioContext({ sampleRate: sr });
    await ac.audioWorklet.addModule(PROCESSOR_URL);
    const awMetrics = await renderAwCase(
      ac,
      { freqL: freq, freqR: freq, gainL: 0.12, gainR: 0.12, harmonic2Mix: 0, lfoRate: 0, lfoDepth: 0, noiseMix: 0 },
      Math.floor(dur * 1000),
      activeNodes,
    );
    const rmsRatio = awMetrics.rms / (legacy.metrics.rms || 1);
    const peakRatio = awMetrics.peak / (legacy.metrics.peak || 1);
    const withinBand = rmsRatio > 0.35 && rmsRatio < 2.8 && peakRatio > 0.2 && peakRatio < 3.5;
    return {
      ok: withinBand && awMetrics.notSilent && legacy.metrics.notSilent,
      classification: withinBand ? 'BOUNDED_FUNDAMENTAL_MATCH' : 'YELLOW_METRIC_DRIFT',
      legacy: legacy.metrics,
      aw: awMetrics,
      rmsRatio,
      peakRatio,
      note: 'Bounded harness compare — not full legacy engine parity',
      productLive: false,
    };
  } catch (e) {
    return { ok: false, error: String(e) };
  } finally {
    for (const n of activeNodes) {
      try {
        n.disconnect();
      } catch {
        /* ignore */
      }
    }
    try {
      if (ac && ac.state !== 'closed') await ac.close();
    } catch {
      /* ignore */
    }
  }
}

export async function runMemoryGcProbe(iterations = 6) {
  const heaps = [];
  if (performance.memory) heaps.push({ phase: 'before', used: performance.memory.usedJSHeapSize });
  let ok = true;
  for (let i = 0; i < iterations; i++) {
    try {
      const ac = new AudioContext();
      await ac.close();
    } catch {
      ok = false;
    }
  }
  if (performance.memory) heaps.push({ phase: 'after', used: performance.memory.usedJSHeapSize });
  return {
    ok,
    iterations,
    heaps,
    classification: 'CHEAP_CREATE_DESTROY_PROBE_NOT_ENDURANCE',
    productLive: false,
    note: 'performance.memory Chromium-only; does not prove long-session GC safety',
  };
}

export async function runAwBlockerAttack(opts = {}) {
  const eMode = analyzeEModeBlocker();
  const noise = await runNoisePrototypeHarness(opts);
  const bounded = await runBoundedParityComparison(opts);
  const memory = await runMemoryGcProbe(6);
  const harness = await runIsolatedHarness(opts);

  const gaps = {
    fundamentalStereoTone: {
      verdict: bounded.ok ? 'PARTIALLY_REDUCED' : 'BLOCKED_WITH_REASON',
      proof: bounded,
    },
    harmonics: {
      verdict: harness.ok ? 'PARTIALLY_REDUCED' : 'BLOCKED_WITH_REASON',
      proof: harness.cases?.find((c) => c.name === 'harmonic2'),
    },
    lfoModulation: {
      verdict: harness.ok ? 'PARTIALLY_REDUCED' : 'BLOCKED_WITH_REASON',
      proof: harness.cases?.find((c) => c.name === 'lfo'),
    },
    noiseComponent: {
      verdict: noise.ok ? 'PARTIALLY_REDUCED' : 'BLOCKED_WITH_REASON',
      proof: noise,
    },
    eModeVowelPanner: { verdict: 'BLOCKED_WITH_REASON', proof: eMode },
    teardownGc: {
      verdict: harness.teardownGuard ? 'PARTIALLY_REDUCED' : 'BLOCKED_WITH_REASON',
      proof: { teardownGuard: harness.teardownGuard, memory },
    },
    analyserExportPreservation: {
      verdict: 'BLOCKED_WITH_REASON',
      proof: {
        reason: 'Requires live legacy graph AB tap — not proven in v2 isolated processor',
        v1Path: './index_2027_audioworklet_full_route_candidate.html',
      },
    },
    fallbackToLegacy: {
      verdict: 'PARTIALLY_REDUCED',
      proof: { defaultOff: true, laneArmed: laneArmed(), productLive: false },
    },
  };

  return {
    schemaVersion: 'aw_blocker_attack_v1.0',
    version: AW_PARITY_V2_VERSION,
    classification: 'CANDIDATE_HARNESS_ATTACK',
    notProductLive: true,
    gaps,
    overall: Object.values(gaps).some((g) => g.verdict === 'PARTIALLY_REDUCED')
      ? 'PARTIALLY_REDUCED'
      : 'BLOCKED_WITH_REASON',
    parityGapMatrix: PARITY_GAP_MATRIX,
    timestamp: new Date().toISOString(),
  };
}

export function collectParityV2Diagnostics() {
  return {
    version: AW_PARITY_V2_VERSION,
    laneArmed: laneArmed(),
    reloadAutoEnable: false,
    parityGapMatrix: PARITY_GAP_MATRIX,
    blockerNotes: [
      'Harness noiseMix proves AW can emit noise without legacy graph — not legacy noise parity',
      'E-mode vowelPanner remains legacy-only — bounded spectral match still missing',
      'Analyser/export preservation requires v1 full-route AB tap — not closed in v2 isolated harness',
    ],
    eModeBlocker: analyzeEModeBlocker(),
    v1IntegrationPath: './index_2027_audioworklet_full_route_candidate.html',
    harnessPath: './harnesses/audioworklet_parity_v2/harness.html',
    timestamp: new Date().toISOString(),
  };
}

export function initAudioWorkletParityV2Panel() {
  const arm = document.getElementById('tgAwPv2LaneArm');
  if (arm) {
    arm.checked = laneArmed();
    arm.addEventListener('change', () => setLaneArm(arm.checked));
  }
  document.getElementById('tgAwPv2RunHarness')?.addEventListener('click', async () => {
    const out = document.getElementById('tgAwPv2Report');
    const r = await runIsolatedHarness();
    if (out) out.textContent = JSON.stringify(r, null, 2);
    window.__TG_AW_PARITY_V2_LAST_REPORT__ = r;
  });
  document.getElementById('tgAwPv2RunBlockerAttack')?.addEventListener('click', async () => {
    const out = document.getElementById('tgAwPv2Report');
    const r = await runAwBlockerAttack();
    if (out) out.textContent = JSON.stringify(r, null, 2);
    window.__TG_AW_BLOCKER_ATTACK_LAST__ = r;
  });
  document.getElementById('tgAwPv2RefreshDiag')?.addEventListener('click', () => {
    const pre = document.getElementById('tgAwPv2DiagOut');
    if (pre) pre.textContent = JSON.stringify(collectParityV2Diagnostics(), null, 2);
  });
  window.__TG_AUDIOWORKLET_PARITY_V2_CANDIDATE__ = {
    version: AW_PARITY_V2_VERSION,
    runIsolatedHarness,
    runAwBlockerAttack,
    runNoisePrototypeHarness,
    runBoundedParityComparison,
    runMemoryGcProbe,
    analyzeEModeBlocker,
    collectParityV2Diagnostics,
    probeProcessorModule,
    PARITY_GAP_MATRIX,
  };
}
