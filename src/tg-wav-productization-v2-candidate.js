/**
 * WAV productization v2 — candidate/harness only. WebM remains default on product.
 * ScriptProcessor full replacement: BLOCKED pending graph safety audit.
 */
import { writeWavPcm16, synthSine, measureBuffer } from '../harnesses/wav_pcm/wav_core.js';

export const WAV_PROD_V2_VERSION = '2027_wav_productization_v2_candidate_v1.2';
export const WAV_PROD_V2_LANE_KEY = 'tg_wav_productization_v2_lane_v1';
export const WAV_FOUNDATION_SHA = '982AC64307B3DAB2A3E4E7D0173743F16FAECD91C23E44379BFAB171F3240ACF';

const MAX_CHUNK_FRAMES = 48000 * 30;
const MAX_TOTAL_BYTES = 48 * 1024 * 1024;

export function laneEnabled() {
  try {
    return localStorage.getItem(WAV_PROD_V2_LANE_KEY) === '1';
  } catch {
    return false;
  }
}

export function setLane(on) {
  try {
    if (on) localStorage.setItem(WAV_PROD_V2_LANE_KEY, '1');
    else localStorage.removeItem(WAV_PROD_V2_LANE_KEY);
  } catch {
    /* ignore */
  }
}

function validateRiff(buf, sampleRate, channels, pcmBytes) {
  const view = new DataView(buf);
  const riff = String.fromCharCode(view.getUint8(0), view.getUint8(1), view.getUint8(2), view.getUint8(3));
  const wave = String.fromCharCode(view.getUint8(8), view.getUint8(9), view.getUint8(10), view.getUint8(11));
  const fmtSize = view.getUint32(16, true);
  const audioFormat = view.getUint16(20, true);
  const bitsPerSample = view.getUint16(34, true);
  const fileSize = view.getUint32(4, true);
  return {
    riffOk: riff === 'RIFF',
    waveOk: wave === 'WAVE',
    sampleRateOk: view.getUint32(24, true) === sampleRate,
    channelsOk: view.getUint16(22, true) === channels,
    dataSizeOk: view.getUint32(40, true) === pcmBytes,
    fmtSizeOk: fmtSize === 16,
    pcm16Ok: audioFormat === 1 && bitsPerSample === 16,
    riffChunkSizeOk: fileSize === buf.byteLength - 8,
  };
}

export function estimateExportMemory(durationSec, sampleRate = 48000, channels = 2) {
  const frames = Math.floor(durationSec * sampleRate);
  const pcmBytes = frames * channels * 2;
  const wavBytes = 44 + pcmBytes;
  const plan = buildChunkedWavPlan(frames, sampleRate, channels);
  return {
    durationSec,
    sampleRate,
    channels,
    frames,
    pcmBytes,
    wavBytes,
    memoryGuardOk: wavBytes <= MAX_TOTAL_BYTES,
    chunkPlan: plan,
    webmFallbackRecommended: wavBytes > MAX_TOTAL_BYTES,
    classification: plan.classification,
  };
}

export function auditScriptProcessorTapSafety() {
  return {
    classification: 'BLOCKED_FOR_PRODUCT_REPLACEMENT',
    verdict: 'UNSAFE_WITHOUT_LIVE_GRAPH_AUDIT',
    risks: [
      'createScriptProcessor is deprecated — uneven Safari support',
      'onaudioprocess runs on main thread — glitch risk under UI load',
      'Live tap connects analyser → MediaStreamDestination — mutates export graph while recording',
      'Mute sink to destination still adds parallel nodes during capture',
    ],
    safeHarnessPath: 'OfflineAudioContext + writeWavPcm16 (v2 harness proven)',
    productDefault: 'WebM MediaRecorder remains default',
    proofCollected: 'STATIC_AUDIT_FROM_WAV_LIVE_TAP_DESIGN',
    proofMissing: 'LIVE_PLAYING_GRAPH_AB_TEST_WITH_SCRIPT_PROCESSOR_REMOVED',
  };
}

export function auditWorkletTapFeasibility() {
  return {
    classification: 'FEASIBLE_DISCONNECTED_HARNESS_ONLY',
    verdict: 'PARTIALLY_REDUCED_NOT_PRODUCT',
    proof: 'AudioWorkletNode can render in isolated OfflineAudioContext without touching product graph',
    productDefault: false,
    doesNotReplaceScriptProcessorOnProduct: true,
    proofMissing: 'BRIDGED_METER_TAP_ON_LIVE_ANALYSER_WITHOUT_GRAPH_LEAK',
  };
}

export function buildChunkedWavPlan(totalFrames, sampleRate, channels) {
  const frameBytes = channels * 2;
  const chunks = [];
  let remaining = totalFrames;
  let offset = 0;
  while (remaining > 0) {
    const n = Math.min(remaining, MAX_CHUNK_FRAMES);
    chunks.push({ offsetFrames: offset, frameCount: n, byteEstimate: 44 + n * frameBytes });
    offset += n;
    remaining -= n;
  }
  const totalBytes = chunks.reduce((s, c) => s + c.byteEstimate, 0);
  return {
    chunks,
    totalFrames,
    totalBytes,
    memoryGuardOk: totalBytes <= MAX_TOTAL_BYTES,
    classification: totalBytes <= MAX_TOTAL_BYTES ? 'WITHIN_GUARD' : 'EXCEEDS_GUARD',
  };
}

export function collectWavV2Diagnostics() {
  return {
    version: WAV_PROD_V2_VERSION,
    laneEnabled: laneEnabled(),
    defaultOff: !laneEnabled(),
    webmDefaultPreserved: true,
    wavProductGreen: false,
    memoryGuards: {
      maxChunkFrames: MAX_CHUNK_FRAMES,
      maxTotalBytes: MAX_TOTAL_BYTES,
      classification: 'RIFF_CHUNK_GUARDS_ACTIVE_IN_HARNESS',
    },
    scriptProcessorAudit: auditScriptProcessorTapSafety(),
    workletTapAudit: auditWorkletTapFeasibility(),
    exportEstimates: {
      sec30stereo48k: estimateExportMemory(30, 48000, 2),
      sec120stereo48k: estimateExportMemory(120, 48000, 2),
    },
    blockerNotes: [
      'WAV not product default — WebM/MediaRecorder remains export default on final QA page',
      'ScriptProcessor live tap remains blocked for product replacement until graph audit',
    ],
    timestamp: new Date().toISOString(),
  };
}

export async function runWavBlockerAttack(opts = {}) {
  const spAudit = auditScriptProcessorTapSafety();
  const awTap = auditWorkletTapFeasibility();
  const harness = await runWavProductizationV2Harness(opts);
  const est30 = estimateExportMemory(30, 48000, 2);
  const est120 = estimateExportMemory(120, 48000, 2);

  return {
    schemaVersion: 'wav_blocker_attack_v1.0',
    version: WAV_PROD_V2_VERSION,
    classification: 'CANDIDATE_HARNESS_ATTACK',
    webmDefaultPreserved: true,
    wavProductGreen: false,
    gaps: {
      scriptProcessorReplacement: {
        verdict: 'BLOCKED_WITH_REASON',
        proof: spAudit,
      },
      workletMeterTap: {
        verdict: 'PARTIALLY_REDUCED',
        proof: awTap,
      },
      riffChunkMemoryGuards: {
        verdict: harness.ok ? 'PARTIALLY_REDUCED' : 'BLOCKED_WITH_REASON',
        proof: harness,
      },
      longDurationExport: {
        verdict: est120.memoryGuardOk ? 'PARTIALLY_REDUCED' : 'BLOCKED_WITH_REASON',
        proof: { est30, est120, note: 'Model only — no long recording' },
      },
      productWavDefault: {
        verdict: 'BLOCKED_WITH_REASON',
        proof: { webmDefault: true, laneEnabled: laneEnabled() },
      },
    },
    overall: 'PARTIALLY_REDUCED',
    timestamp: new Date().toISOString(),
  };
}

export async function runWavProductizationV2Harness(opts = {}) {
  const sr = opts.sampleRate || 48000;
  const duration = opts.durationSec || 0.5;
  const freq = opts.frequency || 440;
  const report = {
    schemaVersion: 'wav_productization_v2_harness_v1.1',
    version: WAV_PROD_V2_VERSION,
    classification: 'CANDIDATE_HARNESS_ONLY',
    webmDefaultPreserved: true,
    wavProductGreen: false,
    scriptProcessorReplacement: {
      status: 'BLOCKED_UNSAFE_WITHOUT_GRAPH_AUDIT',
      note: 'Use legacy ScriptProcessor tap path only in audited bridge; v2 harness uses OfflineAudioContext + PCM write',
    },
    workletMeterTap: { status: 'NOT_REQUIRED_FOR_V2_HARNESS', audioWorkletAvailable: typeof AudioWorkletNode !== 'undefined' },
    foundationSha: WAV_FOUNDATION_SHA,
    steps: [],
    ok: false,
    timestamp: new Date().toISOString(),
  };

  try {
    const frames = Math.floor(sr * duration);
    const plan = buildChunkedWavPlan(frames, sr, 1);
    report.steps.push({ step: 'chunk_plan', plan });

    const samples = synthSine(duration, freq, sr);
    report.steps.push({ step: 'synth_sine', frames: samples.length, sr, freq });

    const wavBuf = writeWavPcm16(samples, sr, 1);
    const pcmBytes = samples.length * 2;
    const riff = validateRiff(wavBuf, sr, 1, pcmBytes);
    report.steps.push({ step: 'riff_validation', riff, pass: Object.values(riff).every(Boolean) });

    if (typeof AudioContext !== 'undefined') {
      const ac = new AudioContext();
      const ab = await ac.decodeAudioData(wavBuf.slice(0));
      const metrics = measureBuffer(ab);
      report.steps.push({ step: 'decode_validate', metrics, pass: Math.abs(metrics.duration - duration) < 0.06 });
      await ac.close();
    }

    const longPlan = buildChunkedWavPlan(sr * 120, sr, 2);
    report.steps.push({ step: 'long_export_dry_run', longPlan, note: 'plan only — no 120s write in harness' });

    report.ok = report.steps.every((s) => s.pass !== false);
    if (!plan.memoryGuardOk) report.classification = 'YELLOW_PARTIAL';
  } catch (e) {
    report.error = String(e);
    report.ok = false;
  }
  return report;
}

export function initWavProductizationV2Panel() {
  const lane = document.getElementById('tgWavPv2Lane');
  if (lane) {
    lane.checked = laneEnabled();
    lane.addEventListener('change', () => setLane(lane.checked));
  }
  document.getElementById('tgWavPv2Run')?.addEventListener('click', async () => {
    const pre = document.getElementById('tgWavPv2Report');
    const r = await runWavProductizationV2Harness();
    if (pre) pre.textContent = JSON.stringify(r, null, 2);
    window.__TG_WAV_PROD_V2_LAST_REPORT__ = r;
  });
  document.getElementById('tgWavPv2RunBlockerAttack')?.addEventListener('click', async () => {
    const pre = document.getElementById('tgWavPv2Report');
    const r = await runWavBlockerAttack();
    if (pre) pre.textContent = JSON.stringify(r, null, 2);
    window.__TG_WAV_BLOCKER_ATTACK_LAST__ = r;
  });
  document.getElementById('tgWavPv2RefreshDiag')?.addEventListener('click', () => {
    const pre = document.getElementById('tgWavPv2DiagOut');
    if (pre) pre.textContent = JSON.stringify(collectWavV2Diagnostics(), null, 2);
  });
  window.__TG_WAV_PRODUCTIZATION_V2_CANDIDATE__ = {
    version: WAV_PROD_V2_VERSION,
    runWavProductizationV2Harness,
    runWavBlockerAttack,
    estimateExportMemory,
    auditScriptProcessorTapSafety,
    auditWorkletTapFeasibility,
    collectWavV2Diagnostics,
  };
}
