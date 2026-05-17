/**
 * TG AudioWorklet processor — candidate-only stereo tone source.
 * Local module only · no network · controlled via port parameters.
 */
class TgFullRouteToneProcessor extends AudioWorkletProcessor {
  constructor() {
    super();
    this.phaseL = 0;
    this.phaseR = 0;
    this.freqL = 440;
    this.freqR = 440;
    this.gainL = 0.15;
    this.gainR = 0.15;
    this.port.onmessage = (ev) => {
      const d = ev.data || {};
      if (typeof d.freqL === 'number') this.freqL = d.freqL;
      if (typeof d.freqR === 'number') this.freqR = d.freqR;
      if (typeof d.gainL === 'number') this.gainL = d.gainL;
      if (typeof d.gainR === 'number') this.gainR = d.gainR;
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
    for (let i = 0; i < outL.length; i++) {
      outL[i] = Math.sin(this.phaseL) * this.gainL;
      outR[i] = Math.sin(this.phaseR) * this.gainR;
      this.phaseL += incL;
      this.phaseR += incR;
      if (this.phaseL > Math.PI * 2) this.phaseL -= Math.PI * 2;
      if (this.phaseR > Math.PI * 2) this.phaseR -= Math.PI * 2;
    }
    return true;
  }
}

registerProcessor('tg-full-route-tone', TgFullRouteToneProcessor);
