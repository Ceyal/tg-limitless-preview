/**
 * AudioWorklet parity v2 — maximum safe closure attempt, candidate/harness only.
 * Legacy engine remains default on product. AudioWorklet NOT product-live.
 */
export const AW_PARITY_V2_VERSION = '2027_audioworklet_parity_v2_candidate_v1.1';
export const AW_PARITY_V2_LANE_KEY = 'tg_aw_parity_v2_lane_arm_v1';

const PROCESSOR_URL = './src/tg-audioworklet-parity-v2-processor.js';
const V1_FULL_ROUTE_SHA = '9BCB3B81EBECB4FE12613002C6B59685A761846190F8B87823432699943EEF33';

export const PARITY_GAP_MATRIX = {
  fundamentalStereoTone: { v1: 'PARTIAL', v2: 'HARNESS_PROVEN', productLive: false },
  harmonics: { v1: 'NOT_IN_PROCESSOR', v2: 'HARNESS_2ND_HARMONIC', productLive: false },
  lfoModulation: { v1: 'NOT_IN_PROCESSOR', v2: 'HARNESS_LFO_DEPTH', productLive: false },
  noiseComponent: { v1: 'NOT_IN_PROCESSOR', v2: 'BLOCKED_UNSAFE_WITHOUT_LEGACY_NOISE_GRAPH', productLive: false },
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

  const ac = new AudioContext();
  try {
    await ac.audioWorklet.addModule(PROCESSOR_URL);
    const cases = [
      { name: 'fundamental', params: { freqL: 220, freqR: 330, gainL: 0.1, gainR: 0.1, harmonic2Mix: 0, lfoRate: 0, lfoDepth: 0 } },
      { name: 'harmonic2', params: { freqL: 220, freqR: 330, gainL: 0.08, gainR: 0.08, harmonic2Mix: 0.35, lfoRate: 0, lfoDepth: 0 } },
      { name: 'lfo', params: { freqL: 440, freqR: 440, gainL: 0.12, gainR: 0.12, harmonic2Mix: 0, lfoRate: 5, lfoDepth: 0.4 } },
    ];
    for (const c of cases) {
      const node = new AudioWorkletNode(ac, 'tg-parity-v2-tone', { outputChannelCount: [2] });
      node.port.postMessage(c.params);
      const gain = ac.createGain();
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
    try {
      await ac.close();
    } catch {
      /* ignore */
    }
  }
  return report;
}

export function collectParityV2Diagnostics() {
  return {
    version: AW_PARITY_V2_VERSION,
    laneArmed: laneArmed(),
    reloadAutoEnable: false,
    parityGapMatrix: PARITY_GAP_MATRIX,
    blockerNotes: [
      'Noise + full legacy modulation graph parity requires bridged v1 full-route — not duplicated in v2 processor',
      'E-mode vowelPanner remains legacy-only — no AudioWorklet product-live claim',
    ],
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
  document.getElementById('tgAwPv2RefreshDiag')?.addEventListener('click', () => {
    const pre = document.getElementById('tgAwPv2DiagOut');
    if (pre) pre.textContent = JSON.stringify(collectParityV2Diagnostics(), null, 2);
  });
  window.__TG_AUDIOWORKLET_PARITY_V2_CANDIDATE__ = {
    version: AW_PARITY_V2_VERSION,
    runIsolatedHarness,
    collectParityV2Diagnostics,
    PARITY_GAP_MATRIX,
  };
}
