/**
 * E-mode / vowelPanner bounded spectral compare — candidate harness only.
 * Does not replace legacy graph or make AudioWorklet product-live.
 */
export const EMODE_COMPARE_VERSION = '2027_emode_spectral_compare_candidate_v1.0';

const AW_PROCESSOR_URL = './src/tg-audioworklet-parity-v2-processor.js';

function analyzeStereoBuffer(buf) {
  const L = buf.getChannelData(0);
  const R = buf.numberOfChannels > 1 ? buf.getChannelData(1) : L;
  let sumSqL = 0;
  let sumSqR = 0;
  let peakL = 0;
  let peakR = 0;
  const n = Math.min(L.length, R.length);
  for (let i = 0; i < n; i++) {
    const aL = Math.abs(L[i]);
    const aR = Math.abs(R[i]);
    sumSqL += L[i] * L[i];
    sumSqR += R[i] * R[i];
    if (aL > peakL) peakL = aL;
    if (aR > peakR) peakR = aR;
  }
  const rmsL = Math.sqrt(sumSqL / (n || 1));
  const rmsR = Math.sqrt(sumSqR / (n || 1));
  const panAsymmetry = Math.abs(rmsL - rmsR) / Math.max(rmsL + rmsR, 1e-9);
  return { rmsL, rmsR, peakL, peakR, panAsymmetry, frames: n, notSilent: peakL > 0.001 || peakR > 0.001 };
}

function analyzePanSwing(buf, windowSize = 2048) {
  const L = buf.getChannelData(0);
  const R = buf.numberOfChannels > 1 ? buf.getChannelData(1) : L;
  let maxAsym = 0;
  for (let o = 0; o + windowSize <= L.length; o += windowSize) {
    let sL = 0;
    let sR = 0;
    for (let i = o; i < o + windowSize; i++) {
      sL += L[i] * L[i];
      sR += R[i] * R[i];
    }
    const rL = Math.sqrt(sL / windowSize);
    const rR = Math.sqrt(sR / windowSize);
    const a = Math.abs(rL - rR) / Math.max(rL + rR, 1e-9);
    if (a > maxAsym) maxAsym = a;
  }
  return { maxPanAsymmetry: maxAsym, windowSize };
}

async function renderLegacyVowelOffline(vowel, durationSec = 0.6, sampleRate = 48000) {
  if (typeof OfflineAudioContext === 'undefined') {
    return { ok: false, classification: 'OFFLINE_CONTEXT_UNSUPPORTED' };
  }
  const frames = Math.ceil(durationSec * sampleRate);
  const offline = new OfflineAudioContext(2, frames, sampleRate);
  const osc = offline.createOscillator();
  osc.type = 'sine';
  osc.frequency.value = 220;
  const g = offline.createGain();
  g.gain.value = 0.18;
  const filter = offline.createBiquadFilter();

  switch (vowel) {
    case 'E':
      filter.type = 'allpass';
      break;
    case 'A':
      filter.type = 'lowshelf';
      filter.frequency.value = 400;
      filter.gain.value = 5;
      break;
    case 'OFF':
    default:
      filter.type = 'allpass';
      break;
  }

  osc.connect(g).connect(filter);
  let tail = filter;

  if (vowel === 'E') {
    const panner = offline.createStereoPanner();
    const lfo = offline.createOscillator();
    lfo.type = 'sine';
    lfo.frequency.value = 0.2;
    const lfoGain = offline.createGain();
    lfoGain.gain.value = 0.8;
    lfo.connect(lfoGain).connect(panner.pan);
    filter.connect(panner);
    tail = panner;
    lfo.start(0);
    lfo.stop(durationSec);
  }

  tail.connect(offline.destination);
  osc.start(0);
  osc.stop(durationSec);
  const buf = await offline.startRendering();
  const metrics = analyzeStereoBuffer(buf);
  const swing = vowel === 'E' ? analyzePanSwing(buf) : { maxPanAsymmetry: metrics.panAsymmetry };
  return { ok: true, vowel, metrics, swing, graphNote: 'Offline legacy vowel chain mirror' };
}

async function renderAwStereoOffline(durationSec = 0.6, sampleRate = 48000) {
  if (typeof OfflineAudioContext === 'undefined' || typeof AudioWorkletNode === 'undefined') {
    return { ok: false, classification: 'AW_OR_OFFLINE_UNSUPPORTED' };
  }
  const frames = Math.ceil(durationSec * sampleRate);
  const offline = new OfflineAudioContext(2, frames, sampleRate);
  try {
    await offline.audioWorklet.addModule(AW_PROCESSOR_URL);
    const node = new AudioWorkletNode(offline, 'tg-parity-v2-tone', { outputChannelCount: [2] });
    node.port.postMessage({
      freqL: 220,
      freqR: 220,
      gainL: 0.18,
      gainR: 0.18,
      harmonic2Mix: 0,
      lfoRate: 0,
      lfoDepth: 0,
      noiseMix: 0,
    });
    node.connect(offline.destination);
    const buf = await offline.startRendering();
    const metrics = analyzeStereoBuffer(buf);
    const swing = analyzePanSwing(buf);
    return {
      ok: true,
      metrics,
      swing,
      graphNote: 'AW v2 processor — no StereoPanner / vowel LFO pan path',
    };
  } catch (e) {
    return { ok: false, error: String(e) };
  }
}

async function captureLiveAnalyserStereo(durationMs = 450) {
  const bridge = window.__TG_AUDIOWORKLET_FULL_ROUTE_BRIDGE__ || window.__TG_WAV_LIVE_TAP_BRIDGE__;
  const analyser = bridge?.getAnalyser?.();
  const ac = bridge?.getAudioCtx?.();
  if (!analyser || !ac || !bridge?.isPlaying?.()) {
    return { ok: false, reason: 'not_playing_or_missing_analyser' };
  }
  const buf = new Float32Array(analyser.fftSize);
  const rmsSeries = [];
  const t0 = performance.now();
  while (performance.now() - t0 < durationMs) {
    analyser.getFloatTimeDomainData(buf);
    let sumSq = 0;
    for (let i = 0; i < buf.length; i++) sumSq += buf[i] * buf[i];
    rmsSeries.push(Math.sqrt(sumSq / buf.length));
    await new Promise((r) => setTimeout(r, 32));
  }
  const minRms = Math.min(...rmsSeries);
  const maxRms = Math.max(...rmsSeries);
  const meanRms = rmsSeries.reduce((a, b) => a + b, 0) / (rmsSeries.length || 1);
  const rmsSwing = (maxRms - minRms) / Math.max(meanRms, 1e-9);
  return {
    ok: true,
    maxPanAsymmetry: rmsSwing,
    meanAsymmetry: meanRms,
    rmsSwing,
    minRms,
    maxRms,
    samples: rmsSeries.length,
    classification: 'LIVE_ANALYSER_RMS_SWING_PROXY',
    note: 'Mono analyser post-panner — RMS swing proxies E-mode motion',
  };
}

function setVowelHarness(vowel) {
  const sel = document.getElementById('vowelFilter');
  if (!sel) return { ok: false, reason: 'vowelFilter_missing' };
  const prev = sel.value;
  sel.value = vowel;
  sel.dispatchEvent(new Event('change', { bubbles: true }));
  return { ok: true, previous: prev, set: vowel };
}

export async function runOfflineEmodeSpectralCompare(opts = {}) {
  const dur = opts.durationSec || 0.6;
  const sr = opts.sampleRate || 48000;
  const legacyE = await renderLegacyVowelOffline('E', dur, sr);
  const legacyA = await renderLegacyVowelOffline('A', dur, sr);
  const legacyOff = await renderLegacyVowelOffline('OFF', dur, sr);
  const aw = await renderAwStereoOffline(dur, sr);

  const eSwing = legacyE.ok ? legacyE.swing.maxPanAsymmetry : 0;
  const aSwing = legacyA.ok ? legacyA.swing.maxPanAsymmetry : 0;
  const awSwing = aw.ok ? aw.swing.maxPanAsymmetry : 0;

  const eExceedsAw =
    legacyE.ok && aw.ok && eSwing > awSwing * 1.35 && eSwing > aSwing * 1.15;
  const nonEquivalenceProven = eExceedsAw;

  return {
    schemaVersion: 'emode_offline_spectral_compare_v1.0',
    version: EMODE_COMPARE_VERSION,
    classification: nonEquivalenceProven
      ? 'NON_EQUIVALENCE_PROVEN_OFFLINE'
      : 'YELLOW_COMPARE_INCONCLUSIVE',
    legacyE,
    legacyA,
    legacyOff,
    awApproximation: aw,
    delta: {
      ePanSwing: eSwing,
      aPanSwing: aSwing,
      awPanSwing: awSwing,
      eExceedsAw,
    },
    verdict: nonEquivalenceProven ? 'PARTIALLY_REDUCED' : 'BLOCKED_WITH_REASON',
    parityClaim: false,
    productLive: false,
    architectureNote:
      'AW v2 cannot represent legacy E-mode StereoPanner+LFO without duplicating full vowel graph',
    proofStillMissing: ['live_playing_E_mode_vs_AW_route_spectral_AB'],
    timestamp: new Date().toISOString(),
  };
}

export async function runLiveEmodeSpectralCompare(opts = {}) {
  const bridge = window.__TG_AUDIOWORKLET_FULL_ROUTE_BRIDGE__;
  if (!bridge?.isPlaying?.()) {
    return {
      ok: false,
      reason: 'not_playing',
      note: 'Start Play/Stop on final QA page first — harness uses live analyser only',
      offlineFallback: await runOfflineEmodeSpectralCompare(opts),
    };
  }

  const sel = document.getElementById('vowelFilter');
  const restoreVowel = sel?.value || 'OFF';

  const snapOff = setVowelHarness('OFF');
  await new Promise((r) => setTimeout(r, opts.settleMs || 180));
  const offMetrics = await captureLiveAnalyserStereo(opts.durationMs || 400);

  const snapE = setVowelHarness('E');
  await new Promise((r) => setTimeout(r, opts.settleMs || 280));
  const eMetrics = await captureLiveAnalyserStereo(opts.durationMs || 500);

  const snapA = setVowelHarness('A');
  await new Promise((r) => setTimeout(r, opts.settleMs || 200));
  const aMetrics = await captureLiveAnalyserStereo(opts.durationMs || 400);

  setVowelHarness(restoreVowel);

  const eVsOff =
    eMetrics.ok && offMetrics.ok
      ? eMetrics.rmsSwing > offMetrics.rmsSwing * 1.25 && eMetrics.rmsSwing > 0.08
      : false;

  return {
    schemaVersion: 'emode_live_spectral_compare_v1.0',
    version: EMODE_COMPARE_VERSION,
    classification: eVsOff ? 'LIVE_E_MODE_PAN_ASYMMETRY_DETECTED' : 'LIVE_COMPARE_INCONCLUSIVE',
    vowelSnapshots: { snapOff, snapE, snapA, restored: restoreVowel },
    live: { off: offMetrics, E: eMetrics, A: aMetrics },
    eVsOff,
    verdict: eVsOff ? 'PARTIALLY_REDUCED' : 'BLOCKED_WITH_REASON',
    awRouteNote: 'AW full-route still lacks vowelPanner — use offline compare for AW gap proof',
    productLive: false,
    timestamp: new Date().toISOString(),
  };
}

export async function runEmodeBlockerAttack(opts = {}) {
  const offline = await runOfflineEmodeSpectralCompare(opts);
  const live = await runLiveEmodeSpectralCompare(opts);
  const overall =
    offline.verdict === 'PARTIALLY_REDUCED' || live.verdict === 'PARTIALLY_REDUCED'
      ? 'PARTIALLY_REDUCED'
      : 'BLOCKED_WITH_REASON';

  return {
    schemaVersion: 'emode_blocker_attack_v1.0',
    version: EMODE_COMPARE_VERSION,
    overall,
    closedWithProof: false,
    offline,
    live,
    blockerReason:
      'Full E-mode parity requires StereoPanner+LFO in product graph — not in AW v2 isolated processor',
    nextProofPath: 'Bridged AW route with explicit panner stage OR v1 full-route E-mode AB',
    timestamp: new Date().toISOString(),
  };
}

export function initEmodeSpectralCompareCandidate() {
  document.getElementById('tgEmodeRunOffline')?.addEventListener('click', async () => {
    const r = await runOfflineEmodeSpectralCompare();
    const out = document.getElementById('tgEmodeReport');
    if (out) out.textContent = JSON.stringify(r, null, 2);
    window.__TG_EMODE_COMPARE_LAST__ = r;
  });
  document.getElementById('tgEmodeRunLive')?.addEventListener('click', async () => {
    const r = await runLiveEmodeSpectralCompare();
    const out = document.getElementById('tgEmodeReport');
    if (out) out.textContent = JSON.stringify(r, null, 2);
    window.__TG_EMODE_COMPARE_LAST__ = r;
  });
  window.__TG_EMODE_SPECTRAL_COMPARE_CANDIDATE__ = {
    version: EMODE_COMPARE_VERSION,
    runOfflineEmodeSpectralCompare,
    runLiveEmodeSpectralCompare,
    runEmodeBlockerAttack,
  };
}
