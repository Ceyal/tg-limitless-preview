/**
 * WAV productization v2 — candidate/harness only. WebM remains default on product.
 * ScriptProcessor full replacement: BLOCKED pending graph safety audit.
 */
import { writeWavPcm16, synthSine, measureBuffer } from '../harnesses/wav_pcm/wav_core.js';

export const WAV_PROD_V2_VERSION = '2027_wav_productization_v2_candidate_v1.1';
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
  return {
    riffOk: riff === 'RIFF',
    waveOk: wave === 'WAVE',
    sampleRateOk: view.getUint32(24, true) === sampleRate,
    channelsOk: view.getUint16(22, true) === channels,
    dataSizeOk: view.getUint32(40, true) === pcmBytes,
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
  window.__TG_WAV_PRODUCTIZATION_V2_CANDIDATE__ = { version: WAV_PROD_V2_VERSION, runWavProductizationV2Harness };
}
