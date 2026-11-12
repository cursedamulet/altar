'use strict';
/* All sound is synthesised in the browser: no audio files needed. */
const LAYERS_UI = [['waves', 'Waves'], ['wind', 'Wind'], ['rain', 'Rain'], ['stream', 'Stream'], ['birds', 'Birds'], ['crickets', 'Crickets'], ['drone', 'Drone'], ['bowl', 'Singing bowl'], ['fire', 'Flames']];
const Snd = {
  ctx: null, L: {}, mix: {}, fireW: 0, burnBoost: 0, lastHit: 0,
  init() {
    if (this.ctx) { if (this.ctx.state === 'suspended') this.ctx.resume(); return; }
    const C = window.AudioContext || window.webkitAudioContext; if (!C) return;
    const c = this.ctx = new C(); this.master = c.createGain(); this.master.gain.value = .7;
    const comp = c.createDynamicsCompressor(); this.master.connect(comp); comp.connect(c.destination);
    const mkBuf = brown => { const len = c.sampleRate * 4, b = c.createBuffer(1, len, c.sampleRate), d = b.getChannelData(0); let last = 0; for (let i = 0; i < len; i++) { const w = Math.random() * 2 - 1; if (brown) { last = (last + .02 * w) / 1.02; d[i] = last * 3.5; } else d[i] = w; } return b; };
    this.white = mkBuf(false); this.brown = mkBuf(true);
    const loop = buf => { const s = c.createBufferSource(); s.buffer = buf; s.loop = true; s.start(0, Math.random() * 3); return s; };
    const layer = n => { const g = c.createGain(); g.gain.value = 0; g.connect(this.master); this.L[n] = g; return g; };
    const filt = (type, f, q = 1) => { const x = c.createBiquadFilter(); x.type = type; x.frequency.value = f; x.Q.value = q; return x; };
    const lfo = (f, amt, target) => { const o = c.createOscillator(), g = c.createGain(); o.frequency.value = f; g.gain.value = amt; o.connect(g); g.connect(target); o.start(); return o; };
    const gain = v => { const g = c.createGain(); g.gain.value = v; return g; };
    // waves
    { const out = layer('waves'), sw = gain(.5), lp = filt('lowpass', 900); loop(this.brown).connect(lp); lp.connect(sw); sw.connect(out); lfo(.11, .4, sw.gain);
      const sw2 = gain(.05), hp = filt('highpass', 3000); loop(this.white).connect(hp); hp.connect(sw2); sw2.connect(out); lfo(.11, .05, sw2.gain); }
    // wind
    { const out = layer('wind'), bp = filt('bandpass', 420, .9), g = gain(1.3); loop(this.brown).connect(bp); bp.connect(g); g.connect(out); lfo(.07, 220, bp.frequency); lfo(.05, .5, g.gain); }
    // rain
    { const out = layer('rain'), hp = filt('highpass', 1300), lp = filt('lowpass', 8500), g = gain(.3); loop(this.white).connect(hp); hp.connect(lp); lp.connect(g); g.connect(out);
      const lp2 = filt('lowpass', 420), g2 = gain(.5); loop(this.brown).connect(lp2); lp2.connect(g2); g2.connect(out); }
    // stream
    { const out = layer('stream'), bp = filt('bandpass', 1700, 1.5), g = gain(.3); loop(this.white).connect(bp); bp.connect(g); g.connect(out); lfo(5.5, 500, bp.frequency);
      const bp2 = filt('bandpass', 3300, 2), g2 = gain(.13); loop(this.white).connect(bp2); bp2.connect(g2); g2.connect(out); lfo(8.3, 800, bp2.frequency); }
    // crickets
    { const out = layer('crickets'), o = c.createOscillator(), am = gain(.012), gate = gain(.5); o.frequency.value = 4300; o.connect(am); am.connect(gate); gate.connect(out); o.start(); lfo(38, .012, am.gain); lfo(.55, .5, gate.gain);
      const o2 = c.createOscillator(), am2 = gain(.01), gate2 = gain(.5); o2.frequency.value = 3700; o2.connect(am2); am2.connect(gate2); gate2.connect(out); o2.start(); lfo(31, .01, am2.gain); lfo(.43, .5, gate2.gain); }
    // drone
    { const out = layer('drone'), lp = filt('lowpass', 800), trem = gain(.8); lp.connect(trem); trem.connect(out); lfo(.06, .2, trem.gain);
      [82.4, 123.5, 164.8, 247, 330].forEach((f, i) => { ['sine', 'triangle'].forEach((ty, j) => { const o = c.createOscillator(), g = gain(.07 / (i + 1)); o.type = ty; o.frequency.value = f; o.detune.value = (j ? 1 : -1) * (4 + i); o.connect(g); g.connect(lp); o.start(); }); }); }
    // bowl and birds are scheduled
    layer('bowl'); layer('birds');
    // fire
    this.fireOut = layer('fire'); { const lp = filt('lowpass', 230), g = gain(1); loop(this.brown).connect(lp); lp.connect(g); g.connect(this.fireOut); this.rumble = g; g.gain.value = 0; lfo(.4, .15, g.gain); }
    this.sched(); this.setMaster(this.masterVal ?? .7);
    Object.keys(this.mix).forEach(k => this.set(k, this.mix[k]));
  },
  setMaster(v) { this.masterVal = v; if (this.ctx) this.master.gain.setTargetAtTime(v, this.ctx.currentTime, .1); },
  set(name, v) { this.mix[name] = v; if (!this.ctx || !this.L[name]) return; const base = { waves: 1, wind: 1, rain: 1, stream: 1, birds: 1, crickets: 1, drone: 1, bowl: 1, fire: 1 }[name]; this.L[name].gain.setTargetAtTime(v * base, this.ctx.currentTime, .3); },
  /* flames: weight is roughly "how much fire is lit" */
  setFire(w) { this.fireW = w; if (this.ctx && this.rumble) this.rumble.gain.setTargetAtTime(Math.min(.6, w * .06), this.ctx.currentTime, .4); },
  sched() {
    const c = this.ctx;
    const chirp = () => {
      const lv = this.mix.birds || 0; if (lv > .02) {
        const n = 2 + (Math.random() * 4 | 0), f0 = 2000 + Math.random() * 2500; let t0 = c.currentTime + .02;
        for (let i = 0; i < n; i++) { const o = c.createOscillator(), g = c.createGain(); o.type = 'sine'; o.frequency.setValueAtTime(f0, t0); o.frequency.exponentialRampToValueAtTime(f0 * (1.3 + Math.random() * .5), t0 + .07); o.frequency.exponentialRampToValueAtTime(f0 * .9, t0 + .13); g.gain.setValueAtTime(0, t0); g.gain.linearRampToValueAtTime(.05, t0 + .02); g.gain.exponentialRampToValueAtTime(.0008, t0 + .14); o.connect(g); g.connect(this.L.birds); o.start(t0); o.stop(t0 + .16); t0 += .12 + Math.random() * .05; }
      }
      setTimeout(chirp, 600 + Math.random() * 3200);
    };
    const strike = () => {
      const lv = this.mix.bowl || 0; if (lv > .02) {
        const f = [220, 262, 294, 330, 392][Math.random() * 5 | 0], t0 = c.currentTime + .02;
        [1, 2.76, 5.4].forEach((m, i) => { const o = c.createOscillator(), g = c.createGain(); o.frequency.value = f * m; g.gain.setValueAtTime(0, t0); g.gain.linearRampToValueAtTime(.16 / (i + 1), t0 + .01); g.gain.exponentialRampToValueAtTime(.0005, t0 + 7 / (i + 1)); o.connect(g); g.connect(this.L.bowl); o.start(t0); o.stop(t0 + 8); });
      }
      setTimeout(strike, 9000 + Math.random() * 9000);
    };
    const crackle = () => {
      const w = this.fireW + this.burnBoost, lv = this.mix.fire || 0;
      if (w > 0 && lv > .01 && Math.random() < Math.min(.9, w * .14)) {
        const s = c.createBufferSource(), g = c.createGain(), hp = c.createBiquadFilter(); s.buffer = this.white; hp.type = 'highpass'; hp.frequency.value = 1500 + Math.random() * 3000;
        const t0 = c.currentTime, d = .01 + Math.random() * .05; g.gain.setValueAtTime(.05 + Math.random() * .3, t0); g.gain.exponentialRampToValueAtTime(.001, t0 + d); s.connect(hp); hp.connect(g); g.connect(this.fireOut); s.start(t0, Math.random() * 3); s.stop(t0 + d + .01);
      }
      setTimeout(crackle, 50 + Math.random() * 80);
    };
    setTimeout(chirp, 1000); setTimeout(strike, 1500); crackle();
  },
  /* one-shots */
  hit(type, v) {
    const c = this.ctx; if (!c || c.state !== 'running') return; const now = performance.now(); if (now - this.lastHit < 35) return; this.lastHit = now;
    const vol = clamp(v / 9, .03, .5) * .55, t0 = c.currentTime;
    const ping = (f, d) => { const o = c.createOscillator(), g = c.createGain(); o.frequency.value = f; g.gain.setValueAtTime(vol * .6, t0); g.gain.exponentialRampToValueAtTime(.0005, t0 + d); o.connect(g); g.connect(this.master); o.start(t0); o.stop(t0 + d + .02); };
    const thud = (lp, d, a = 1) => { const s = c.createBufferSource(), g = c.createGain(), f = c.createBiquadFilter(); s.buffer = this.white; f.type = 'lowpass'; f.frequency.value = lp; g.gain.setValueAtTime(vol * a, t0); g.gain.exponentialRampToValueAtTime(.0005, t0 + d); s.connect(f); f.connect(g); g.connect(this.master); s.start(t0, Math.random() * 3); s.stop(t0 + d + .02); };
    if (type === 'glass') { ping(2300 + Math.random() * 600, .3); ping(3700, .15); thud(2500, .03, .5); }
    else if (type === 'metal') { ping(900 + Math.random() * 300, .6); ping(2250, .35); }
    else if (type === 'stone') { thud(700, .07); ping(160, .08); }
    else if (type === 'wood' || type === 'wax') thud(900, .06);
    else thud(350, .05, .6);
  },
  flare() { const c = this.ctx; if (!c) return; const s = c.createBufferSource(), g = c.createGain(), f = c.createBiquadFilter(); s.buffer = this.white; f.type = 'bandpass'; f.frequency.value = 1800; const t0 = c.currentTime; g.gain.setValueAtTime(0, t0); g.gain.linearRampToValueAtTime(.18, t0 + .05); g.gain.exponentialRampToValueAtTime(.001, t0 + .5); s.connect(f); f.connect(g); g.connect(this.master); s.start(t0); s.stop(t0 + .6); },
};
