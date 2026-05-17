/**
 * AudioWorklet parity v2 processor — candidate-only stereo tone + optional 2nd harmonic + LFO depth.
 * OFF by default at product level; used in isolated harness / v2 candidate page only.
 */
class TgParityV2ToneProcessor extends AudioWorkletProcessor {
  constructor() {
    super();
    this.phaseL = 0;
    this.phaseR = 0;
    this.lfoPhase = 0;
    this.freqL = 440;
    this.freqR = 440;
    this.gainL = 0.12;
    this.gainR = 0.12;
    this.harmonic2Mix = 0;
    this.lfoRate = 0;
    this.lfoDepth = 0;
    this.port.onmessage = (ev) => {
      const d = ev.data || {};
      if (typeof d.freqL === 'number') this.freqL = d.freqL;
      if (typeof d.freqR === 'number') this.freqR = d.freqR;
      if (typeof d.gainL === 'number') this.gainL = d.gainL;
      if (typeof d.gainR === 'number') this.gainR = d.gainR;
      if (typeof d.harmonic2Mix === 'number') this.harmonic2Mix = Math.max(0, Math.min(1, d.harmonic2Mix));
      if (typeof d.lfoRate === 'number') this.lfoRate = d.lfoRate;
      if (typeof d.lfoDepth === 'number') this.lfoDepth = Math.max(0, Math.min(1, d.lfoDepth));
    };
  }

  process(inputs, outputs) {
    const output = outputs[0];
    if (!output?.length) return true;
    const outL = output[0];
    const outR = output[1] || output[0];
    const sr = sampleRate;
    const incL = (2 * Math.PI * this.freqL) / sr;
    const incR = (2 * Math.PI * this.freqR) / sr;
    const lfoInc = (2 * Math.PI * this.lfoRate) / sr;
    for (let i = 0; i < outL.length; i++) {
      const lfo = this.lfoDepth > 0 ? 1 - this.lfoDepth * 0.5 * (1 + Math.sin(this.lfoPhase)) : 1;
      const sL = Math.sin(this.phaseL);
      const sR = Math.sin(this.phaseR);
      const h2L = Math.sin(this.phaseL * 2) * this.harmonic2Mix;
      const h2R = Math.sin(this.phaseR * 2) * this.harmonic2Mix;
      outL[i] = (sL + h2L) * this.gainL * lfo;
      outR[i] = (sR + h2R) * this.gainR * lfo;
      this.phaseL += incL;
      this.phaseR += incR;
      this.lfoPhase += lfoInc;
      if (this.phaseL > Math.PI * 2) this.phaseL -= Math.PI * 2;
      if (this.phaseR > Math.PI * 2) this.phaseR -= Math.PI * 2;
      if (this.lfoPhase > Math.PI * 2) this.lfoPhase -= Math.PI * 2;
    }
    return true;
  }
}

registerProcessor('tg-parity-v2-tone', TgParityV2ToneProcessor);
