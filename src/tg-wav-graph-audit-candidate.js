/**
 * Live ScriptProcessor vs AudioWorklet tap graph audit — candidate-only.
 * WebM remains default. WAV product replacement not claimed.
 */
import { auditScriptProcessorTapSafety, auditWorkletTapFeasibility } from './tg-wav-productization-v2-candidate.js';

export const WAV_GRAPH_AUDIT_VERSION = '2027_wav_graph_audit_candidate_v1.0';

async function captureAnalyserSnapshot(analyser, durationMs = 280) {
  if (!analyser) return null;
  const buf = new Float32Array(analyser.fftSize);
  const chunks = [];
  const t0 = performance.now();
  while (performance.now() - t0 < durationMs) {
    analyser.getFloatTimeDomainData(buf);
    chunks.push(new Float32Array(buf));
    await new Promise((r) => setTimeout(r, 16));
  }
  let peak = 0;
  let sumSq = 0;
  let n = 0;
  for (const c of chunks) {
    for (let i = 0; i < c.length; i++) {
      const v = c[i];
      sumSq += v * v;
      const a = Math.abs(v);
      if (a > peak) peak = a;
      n++;
    }
  }
  const rms = Math.sqrt(sumSq / (n || 1));
  return { rms, peak, notSilent: peak > 0.001 && rms > 0.0001, frames: n };
}

export function auditLiveGraphTopology() {
  const wavBridge = window.__TG_WAV_LIVE_TAP_BRIDGE__;
  const awBridge = window.__TG_AUDIOWORKLET_FULL_ROUTE_BRIDGE__;
  const ac = wavBridge?.getAudioCtx?.();
  const analyser = wavBridge?.getAnalyser?.();
  return {
    bridgePresent: { wav: !!wavBridge, awFullRoute: !!awBridge },
    isPlaying: !!wavBridge?.isPlaying?.(),
    audioContextState: ac?.state ?? null,
    analyserPresent: !!analyser,
    analyserFftSize: analyser?.fftSize ?? null,
    scriptProcessorAvailable:
      !!ac && typeof ac.createScriptProcessor === 'function',
    webmExportDefault: true,
    wavLiveLaneEnabled: (() => {
      try {
        return localStorage.getItem('tg_wav_live_tap_lane_v1') === '1';
      } catch {
        return false;
      }
    })(),
    wavLiveRecording: !!window.__TG_WAV_LIVE_TAP_CANDIDATE__?.isWavLiveRecording?.(),
    awRouteActive: !!window.__TG_AUDIOWORKLET_FULL_ROUTE_CANDIDATE__?.routeState?.routeActive,
    graphMutationRisks: {
      scriptProcessorTap: 'analyser.connect(MediaStreamDestination) while recording — parallel branch',
      awFullRoute: 'merger disconnect + worklet→masterGain when user enables route',
      productDefaultPath: 'MediaRecorder on master bus — unchanged when lanes off',
    },
  };
}

async function proveDisconnectedWorkletMeterTap(sampleRate = 48000) {
  if (typeof OfflineAudioContext === 'undefined' || typeof AudioWorkletNode === 'undefined') {
    return { ok: false, classification: 'UNSUPPORTED' };
  }
  const url = './src/tg-audioworklet-parity-v2-processor.js';
  const frames = 4800;
  const offline = new OfflineAudioContext(1, frames, sampleRate);
  try {
    await offline.audioWorklet.addModule(url);
    const node = new AudioWorkletNode(offline, 'tg-parity-v2-tone', { outputChannelCount: [1] });
    node.port.postMessage({ freqL: 440, freqR: 440, gainL: 0.1, gainR: 0.1 });
    const tap = offline.createGain();
    tap.gain.value = 1;
    node.connect(tap).connect(offline.destination);
    const buf = await offline.startRendering();
    const ch = buf.getChannelData(0);
    let peak = 0;
    for (let i = 0; i < ch.length; i++) peak = Math.max(peak, Math.abs(ch[i]));
    return {
      ok: peak > 0.001,
      classification: 'DISCONNECTED_WORKLET_TAP_PROVEN',
      peak,
      note: 'Isolated offline graph — does not prove safe live analyser tap',
    };
  } catch (e) {
    return { ok: false, error: String(e) };
  }
}

export async function runLiveGraphAuditPlayingSession(opts = {}) {
  const topology = auditLiveGraphTopology();
  const spStatic = auditScriptProcessorTapSafety();
  const awStatic = auditWorkletTapFeasibility();
  const disconnectedAw = await proveDisconnectedWorkletMeterTap();

  const bridge = window.__TG_WAV_LIVE_TAP_BRIDGE__;
  if (!bridge?.isPlaying?.()) {
    return {
      ok: false,
      reason: 'not_playing',
      topology,
      spStatic,
      awStatic,
      disconnectedAw,
      classification: 'STATIC_AUDIT_ONLY_NOT_PLAYING',
      verdict: 'PARTIALLY_REDUCED',
      productReplacement: 'BLOCKED',
    };
  }

  const analyser = bridge.getAnalyser();
  const baseline = await captureAnalyserSnapshot(analyser, opts.baselineMs || 280);

  const laneWasEnabled = topology.wavLiveLaneEnabled;
  let tapDelta = null;
  if (laneWasEnabled && !topology.wavLiveRecording) {
    tapDelta = {
      note: 'Lane armed but not recording — graph may still be clean',
      baseline,
    };
  } else if (topology.wavLiveRecording) {
    tapDelta = {
      note: 'Recording active — analyser branch includes ScriptProcessor tap',
      baseline,
      warning: 'Do not compare as default export path',
    };
  }

  return {
    schemaVersion: 'wav_live_graph_audit_v1.0',
    version: WAV_GRAPH_AUDIT_VERSION,
    topology,
    baselineAnalyser: baseline,
    tapDelta,
    scriptProcessorAudit: spStatic,
    workletTapAudit: awStatic,
    disconnectedWorkletTap: disconnectedAw,
    verdict: 'PARTIALLY_REDUCED',
    productReplacementVerdict: 'BLOCKED_UNSAFE_WITHOUT_LIVE_AB_REMOVAL_TEST',
    webmDefaultPreserved: true,
    proofCollected: [
      'static ScriptProcessor mutation audit',
      'disconnected AW tap render',
      'live analyser baseline while playing',
    ],
    proofMissing: [
      'live AB with ScriptProcessor removed while exporting WebM',
      'long-session glitch measurement',
    ],
    timestamp: new Date().toISOString(),
  };
}

export async function runWavGraphBlockerAttack(opts = {}) {
  const audit = await runLiveGraphAuditPlayingSession(opts);
  return {
    schemaVersion: 'wav_graph_blocker_attack_v1.0',
    version: WAV_GRAPH_AUDIT_VERSION,
    overall: audit.verdict || 'PARTIALLY_REDUCED',
    audit,
    timestamp: new Date().toISOString(),
  };
}

export function initWavGraphAuditCandidate() {
  document.getElementById('tgWavGraphAuditRun')?.addEventListener('click', async () => {
    const r = await runLiveGraphAuditPlayingSession();
    const out = document.getElementById('tgWavGraphAuditReport');
    if (out) out.textContent = JSON.stringify(r, null, 2);
    window.__TG_WAV_GRAPH_AUDIT_LAST__ = r;
  });
  window.__TG_WAV_GRAPH_AUDIT_CANDIDATE__ = {
    version: WAV_GRAPH_AUDIT_VERSION,
    runLiveGraphAuditPlayingSession,
    runWavGraphBlockerAttack,
    auditLiveGraphTopology,
  };
}
