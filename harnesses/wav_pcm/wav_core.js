/** WAV/PCM proof helpers — harness only, not product export. */

export function writeWavPcm16(samples, sampleRate, numChannels = 1) {
  const numSamples = samples.length;
  const blockAlign = numChannels * 2;
  const byteRate = sampleRate * blockAlign;
  const dataSize = numSamples * 2;
  const buffer = new ArrayBuffer(44 + dataSize);
  const view = new DataView(buffer);
  const writeStr = (off, s) => {
    for (let i = 0; i < s.length; i++) view.setUint8(off + i, s.charCodeAt(i));
  };
  writeStr(0, 'RIFF');
  view.setUint32(4, 36 + dataSize, true);
  writeStr(8, 'WAVE');
  writeStr(12, 'fmt ');
  view.setUint32(16, 16, true);
  view.setUint16(20, 1, true);
  view.setUint16(22, numChannels, true);
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, byteRate, true);
  view.setUint16(32, blockAlign, true);
  view.setUint16(34, 16, true);
  writeStr(36, 'data');
  view.setUint32(40, dataSize, true);
  let o = 44;
  for (let i = 0; i < numSamples; i++) {
    const s = Math.max(-1, Math.min(1, samples[i]));
    view.setInt16(o, s < 0 ? s * 0x8000 : s * 0x7fff, true);
    o += 2;
  }
  return buffer;
}

export function synthSine(durationSec, freqHz, sampleRate) {
  const n = Math.floor(durationSec * sampleRate);
  const out = new Float32Array(n);
  for (let i = 0; i < n; i++) {
    out[i] = 0.5 * Math.sin((2 * Math.PI * freqHz * i) / sampleRate);
  }
  return out;
}

export function measureBuffer(audioBuffer) {
  const ch0 = audioBuffer.getChannelData(0);
  let sumSq = 0;
  let peak = 0;
  for (let i = 0; i < ch0.length; i++) {
    const v = ch0[i];
    sumSq += v * v;
    peak = Math.max(peak, Math.abs(v));
  }
  const rms = Math.sqrt(sumSq / ch0.length);
  return {
    duration: audioBuffer.duration,
    sampleRate: audioBuffer.sampleRate,
    channels: audioBuffer.numberOfChannels,
    rms,
    peak,
  };
}

export function estimateFrequency(audioBuffer, expectedHz) {
  const data = audioBuffer.getChannelData(0);
  const sr = audioBuffer.sampleRate;
  let bestLag = 0;
  let bestCorr = -Infinity;
  const minLag = Math.floor(sr / (expectedHz * 1.5));
  const maxLag = Math.floor(sr / (expectedHz * 0.5));
  for (let lag = minLag; lag <= maxLag; lag++) {
    let c = 0;
    const limit = Math.min(data.length - lag, 4096);
    for (let i = 0; i < limit; i++) c += data[i] * data[i + lag];
    if (c > bestCorr) {
      bestCorr = c;
      bestLag = lag;
    }
  }
  return bestLag > 0 ? sr / bestLag : null;
}
