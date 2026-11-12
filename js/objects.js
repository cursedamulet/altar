'use strict';
/* Everything here is generic: no deity, saint, spirit or sacred figure is ever drawn.
   Statues, frames, tapestries, mirrors and sigils are filled by the user's own images. */
const POST = [];
function post(g, fn) { const m = g.getTransform(); POST.push(G => { G.save(); G.setTransform(m); fn(G); G.restore(); }); }
const OBJ = {};
function def(kind, o) { o.kind = kind; OBJ[kind] = o; return o; }
function fitText(g, text, cx, cy, maxW, size, style, color) {
  let s = size; g.font = `${style} ${s}px "Cormorant Garamond", Georgia, serif`;
  while (g.measureText(text).width > maxW && s > 4) { s -= .5; g.font = `${style} ${s}px "Cormorant Garamond", Georgia, serif`; }
  g.fillStyle = color; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText(text, cx, cy);
}

/* ---------- flames, smoke ---------- */
function flame(g, x, y, s, t, seed) {
  const f1 = Math.sin(t * 9 + seed) * .5 + Math.sin(t * 14.3 + seed * 2) * .5, sway = Math.sin(t * 5 + seed) * 1.6 * s, hh = (1 + .12 * f1) * s * 20, ww = s * 6.5;
  g.save(); g.globalCompositeOperation = 'lighter';
  g.fillStyle = rg(g, x, y - hh * .4, 0, hh * 1.7, [[0, 'rgba(255,200,110,.5)'], [1, 'rgba(255,140,40,0)']]); g.beginPath(); g.arc(x, y - hh * .4, hh * 1.7, 0, 6.3); g.fill();
  g.restore();
  g.save(); g.translate(x, y);
  const path = () => { g.beginPath(); g.moveTo(0, 0); g.bezierCurveTo(-ww, -hh * .25, -ww * .8, -hh * .7, sway, -hh); g.bezierCurveTo(ww * .8, -hh * .7, ww, -hh * .25, 0, 0); g.closePath(); };
  path(); g.fillStyle = lg(g, 0, 0, 0, -hh, [[0, '#3a5ec0'], [.16, '#ffd27a'], [.6, '#ff9a2a'], [1, 'rgba(255,90,10,.85)']]); g.fill();
  g.scale(.5, .62); path(); g.fillStyle = '#fff6d0'; g.fill();
  g.restore();
}
const SMOKE = [];
const puff = (() => { const c = mk(64, 64), g = c.getContext('2d'); g.fillStyle = rg(g, 32, 32, 0, 32, [[0, 'rgba(255,255,255,.9)'], [.5, 'rgba(255,255,255,.35)'], [1, 'rgba(255,255,255,0)']]); g.fillRect(0, 0, 64, 64); return c; })();
function emitSmoke(x, y, col, big) { if (SMOKE.length < 700) SMOKE.push({ x, y, vx: (Math.random() - .5) * 4, vy: -(18 + Math.random() * 10) * (big ? 1.3 : 1), age: 0, life: 4 + Math.random() * 2.5, s: big ? 14 : 7, col, ph: Math.random() * 6.28, big }); }
function updateSmoke(dt, t) {
  for (let i = SMOKE.length - 1; i >= 0; i--) {
    const p = SMOKE[i]; p.age += dt; if (p.age > p.life) { SMOKE.splice(i, 1); continue; }
    const u = p.age / p.life; p.vx += (Math.sin(t * .9 + p.ph + p.y * .02) * 14 - p.vx) * dt * 1.2; p.x += p.vx * dt; p.y += p.vy * dt; p.vy *= (1 - .08 * dt);
  }
}
const _tinted = {};
function tintedPuff(col) { if (_tinted[col]) return _tinted[col]; const c = mk(64, 64), g = c.getContext('2d'); g.drawImage(puff, 0, 0); g.globalCompositeOperation = 'source-in'; g.fillStyle = col; g.fillRect(0, 0, 64, 64); return _tinted[col] = c; }
function drawSmoke(g) {
  for (const p of SMOKE) {
    const u = p.age / p.life, a = Math.sin(Math.min(1, u * 5) * Math.PI / 2) * (1 - u) * (p.big ? .22 : .3), sz = p.s * (1 + u * 5);
    g.globalAlpha = a; g.drawImage(tintedPuff(p.col), p.x - sz, p.y - sz, sz * 2, sz * 2);
  }
  g.globalAlpha = 1;
}

/* ---------- flowers ---------- */
const FLOWERS = [['none', 'None'], ['rose', 'Rose'], ['peony', 'Peony'], ['poppy', 'Poppy'], ['lily', 'Lily'], ['iris', 'Iris'], ['daisy', 'Daisy'], ['sunflower', 'Sunflower'], ['lavender', 'Lavender'], ['forgetmenot', 'Forget-me-not'], ['wild', 'Wildflowers']];
const BLOOM = { rose: '#c2203f', peony: '#f3a6c0', poppy: '#e0371f', lily: '#fffaf0', iris: '#6a4cc0', daisy: '#ffffff', sunflower: '#f6c516', lavender: '#8f6fd0', forgetmenot: '#6aa0f0', wild: '#e6578a' };
function petalRing(g, n, len, wid, col, rot, off = 0) {
  for (let i = 0; i < n; i++) { g.save(); g.rotate(rot + i * 6.283 / n); g.translate(0, -off); g.beginPath(); g.ellipse(0, -len / 2, wid, len / 2, 0, 0, 6.283); g.fillStyle = col; g.fill(); g.strokeStyle = 'rgba(0,0,0,.2)'; g.lineWidth = .7; g.stroke(); g.restore(); }
}
const HEAD = {
  rose(g, s, c, r) { for (let k = 0; k < 3; k++) petalRing(g, 5 + k, s * (1 - k * .24), s * .6 * (1 - k * .2), shade(c, k === 0 ? -.12 : k === 1 ? 0 : .08), r + k * .6); g.fillStyle = shade(c, -.4); g.beginPath(); g.arc(0, 0, s * .16, 0, 6.3); g.fill(); g.strokeStyle = shade(c, -.45); g.lineWidth = .9; g.beginPath(); for (let a = 0; a < 9; a += .3) g.lineTo(Math.cos(a + r) * a * s * .05, Math.sin(a + r) * a * s * .05); g.stroke(); },
  peony(g, s, c, r) { for (let k = 0; k < 4; k++) petalRing(g, 8 - k, s * (1.15 - k * .24), s * .5 * (1 - k * .16), shade(c, -.1 + k * .09), r + k * .5); g.fillStyle = '#f2d36a'; g.beginPath(); g.arc(0, 0, s * .1, 0, 6.3); g.fill(); },
  poppy(g, s, c, r) { petalRing(g, 4, s * 1.1, s * .58, c, r + .4, s * .1); petalRing(g, 4, s * .85, s * .5, shade(c, .08), r + 1.2, s * .05); g.fillStyle = '#1a1010'; g.beginPath(); g.arc(0, 0, s * .17, 0, 6.3); g.fill(); g.strokeStyle = '#1a1010'; g.lineWidth = 1; for (let i = 0; i < 10; i++) { const a = i * .628; g.beginPath(); g.moveTo(Math.cos(a) * s * .17, Math.sin(a) * s * .17); g.lineTo(Math.cos(a) * s * .3, Math.sin(a) * s * .3); g.stroke(); } },
  lily(g, s, c, r) { for (let i = 0; i < 6; i++) { g.save(); g.rotate(r + i * 1.047); g.beginPath(); g.moveTo(0, 0); g.quadraticCurveTo(s * .55, -s * .4, 0, -s * 1.25); g.quadraticCurveTo(-s * .55, -s * .4, 0, 0); g.fillStyle = shade(c, i % 2 ? -.04 : -.12); g.fill(); g.strokeStyle = 'rgba(120,90,70,.4)'; g.lineWidth = .7; g.stroke(); g.beginPath(); g.moveTo(0, -s * .1); g.lineTo(0, -s); g.strokeStyle = 'rgba(190,150,110,.5)'; g.stroke(); g.restore(); } g.strokeStyle = '#b8863a'; g.lineWidth = 1; for (let i = 0; i < 6; i++) { const a = r + i * 1.047 + .5; g.beginPath(); g.moveTo(0, 0); g.lineTo(Math.cos(a) * s * .6, Math.sin(a) * s * .6); g.stroke(); g.fillStyle = '#d96a1a'; g.beginPath(); g.arc(Math.cos(a) * s * .6, Math.sin(a) * s * .6, 1.5, 0, 6.3); g.fill(); } },
  iris(g, s, c, r) { for (const k of [-1, 0, 1]) { g.save(); g.rotate(r + k * .7); g.beginPath(); g.ellipse(0, -s * .6, s * .35, s * .75, 0, 0, 6.3); g.fillStyle = shade(c, .12); g.fill(); g.strokeStyle = 'rgba(0,0,0,.25)'; g.stroke(); g.restore(); } for (const k of [-1, 0, 1]) { g.save(); g.rotate(r + Math.PI + k * .85); g.beginPath(); g.ellipse(0, -s * .55, s * .38, s * .65, 0, 0, 6.3); g.fillStyle = shade(c, -.12); g.fill(); g.strokeStyle = 'rgba(0,0,0,.25)'; g.stroke(); g.fillStyle = '#f2c230'; g.fillRect(-1.2, -s * .7, 2.4, s * .5); g.restore(); } },
  daisy(g, s, c, r) { petalRing(g, 16, s * 1.05, s * .14, c, r); g.fillStyle = '#f2c230'; g.beginPath(); g.arc(0, 0, s * .26, 0, 6.3); g.fill(); g.fillStyle = 'rgba(120,70,0,.4)'; g.beginPath(); g.arc(s * .05, s * .05, s * .14, 0, 6.3); g.fill(); },
  sunflower(g, s, c, r) { petalRing(g, 22, s * 1.25, s * .17, shade(c, -.12), r); petalRing(g, 22, s * 1.15, s * .17, c, r + .14); g.fillStyle = rg(g, 0, 0, 0, s * .5, [[0, '#2a1608'], [1, '#6a4018']]); g.beginPath(); g.arc(0, 0, s * .48, 0, 6.3); g.fill(); g.fillStyle = 'rgba(210,170,80,.5)'; for (let i = 0; i < 24; i++) { const a = i * 2.4, d = Math.sqrt(i / 24) * s * .42; g.fillRect(Math.cos(a) * d, Math.sin(a) * d, 1.4, 1.4); } },
  lavender(g, s, c, r) { for (let i = 0; i < 10; i++) { g.fillStyle = shade(c, (i % 3 - 1) * .1); g.beginPath(); g.ellipse((i % 2 ? 1 : -1) * 1.8, -i * s * .26, 2.6, 3.6, 0, 0, 6.3); g.fill(); } },
  forgetmenot(g, s, c, r) { [[-s * .5, s * .15], [s * .45, 0], [0, -s * .45], [s * .2, s * .5], [-s * .2, -s * .1]].forEach(([x, y], i) => { g.save(); g.translate(x, y); petalRing(g, 5, s * .6, s * .22, shade(c, (i % 2) * .15), r + i); g.fillStyle = '#f6e27a'; g.beginPath(); g.arc(0, 0, s * .1, 0, 6.3); g.fill(); g.restore(); }); },
  wild(g, s, c, r, sd) { const k = ['poppy', 'daisy', 'forgetmenot', 'rose'][sd % 4]; HEAD[k](g, s * .9, k === 'poppy' ? '#e0371f' : k === 'daisy' ? '#fff' : k === 'rose' ? c : '#6aa0f0', r); },
};

/* ---------- candle ---------- */
/* hand-drawn candle art (art/ folder): the body and its flame are separate pictures so the flame can be lit and put out */
const ART = { candleBody: 'art/candle-body.png', candleFlame: 'art/candle-flame.png' };
Object.values(ART).forEach(src => { getImage(src); IMG.get(src).im.addEventListener('load', () => { if (typeof buildShelf === 'function') buildShelf(); }); });
def('candle', {
  label: 'Candle', snd: 'wax', data: { style: 'taper', color: '#f3ead2', lit: true }, toggle: 'lit', ext: { t: 30 },
  dims: d => d.style === 'drawn' ? { w: 46, h: 103 } : d.style === 'pillar' ? { w: 46, h: 84 } : d.style === 'tea' ? { w: 38, h: 16 } : { w: 16, h: 122 },
  light: d => d.lit ? { r: d.style === 'tea' ? 95 : d.style === 'pillar' || d.style === 'drawn' ? 160 : 125, w: 1 } : null,
  fields: [{ k: 'style', t: 'select', l: 'Style', o: [['drawn', 'My drawing'], ['taper', 'Taper'], ['pillar', 'Pillar'], ['tea', 'Tealight']] }, { k: 'color', t: 'color', l: 'Wax' }],
  burn: d => d.style === 'tea' ? 1500 : d.style === 'pillar' || d.style === 'drawn' ? 3000 : 1800,
  update(b, o, dt) { if (o.d.lit && S.burn) { o.st.burn = Math.min(1, (o.st.burn || 0) + dt / this.burn(o.d)); if (o.st.burn >= 1) o.d.lit = false; } },
  draw(g, d, t, st, sd) {
    const { w, h } = this.dims(d), burn = st.burn || 0, hh = h * (1 - .8 * burn), top = h / 2 - hh, bot = h / 2;
    if (d.style === 'drawn') {
      const im = getImage(ART.candleBody), fl = getImage(ART.candleFlame);
      if (im) {
        const cut = (1 - hh / h) * im.height, rim = im.height * .05;
        g.drawImage(im, 0, cut, im.width, im.height - cut, -w / 2, top, w, hh);
        if (burn > 0) g.drawImage(im, 0, 0, im.width, rim, -w / 2, top, w, rim * w / im.width);
      }
      if (d.lit && fl) post(g, G => {
        const fh = w * fl.height / fl.width, f1 = Math.sin(t * 9 + sd) * .5 + Math.sin(t * 14.3 + sd * 2) * .5;
        G.save(); G.globalCompositeOperation = 'lighter'; G.fillStyle = rg(G, 0, top - fh * .45, 0, fh * 1.4, [[0, 'rgba(255,200,110,.5)'], [1, 'rgba(255,140,40,0)']]); G.beginPath(); G.arc(0, top - fh * .45, fh * 1.4, 0, 6.3); G.fill(); G.restore();
        G.save(); G.translate(0, top + 1); G.transform(1, 0, Math.sin(t * 5 + sd) * .06, 1, 0, 0); G.scale(1 + .03 * f1, 1 + .07 * f1); G.drawImage(fl, -w / 2, -fh, w, fh); G.restore();
      });
      return;
    }
    if (d.style === 'tea') {
      g.fillStyle = lg(g, -w / 2, 0, w / 2, 0, [[0, '#9ca0a8'], [.5, '#f4f6fa'], [1, '#7e838c']]); g.beginPath(); g.moveTo(-w / 2, bot); g.lineTo(-w / 2 + 3, top); g.lineTo(w / 2 - 3, top); g.lineTo(w / 2, bot); g.closePath(); g.fill();
      g.fillStyle = shade(d.color, .05); g.beginPath(); g.ellipse(0, top + 1, w / 2 - 4, 2.6, 0, 0, 6.3); g.fill();
      g.strokeStyle = '#2a1a10'; g.lineWidth = 1.2; g.beginPath(); g.moveTo(0, top); g.lineTo(.5, top - 4); g.stroke();
      if (d.lit) post(g, G => flame(G, .5, top - 3, .8, t, sd)); return;
    }
    g.fillStyle = lg(g, -w / 2, 0, w / 2, 0, [[0, shade(d.color, -.22)], [.3, shade(d.color, .1)], [.65, d.color], [1, shade(d.color, -.3)]]);
    g.beginPath(); g.moveTo(-w / 2, bot - 3); g.lineTo(-w / 2, top + 2); g.quadraticCurveTo(0, top - 3, w / 2, top + 2); g.lineTo(w / 2, bot - 3); g.quadraticCurveTo(0, bot + 3, -w / 2, bot - 3); g.fill();
    const r = rng(sd * 13 + 7); g.fillStyle = shade(d.color, .14);
    for (let i = 0; i < 3; i++) { const x = (r() - .5) * (w - 6), l = 6 + r() * hh * .3; g.fillRect(x - 1.2, top + 2, 2.4, l); g.beginPath(); g.arc(x, top + 2 + l, 1.4, 0, 6.3); g.fill(); }
    if (d.lit) { g.fillStyle = 'rgba(255,230,160,.4)'; g.beginPath(); g.ellipse(0, top + 1, w / 2 - 2, 2.6, 0, 0, 6.3); g.fill(); }
    g.strokeStyle = '#2a1a10'; g.lineWidth = 1.3; g.beginPath(); g.moveTo(0, top); g.quadraticCurveTo(1.5, top - 4, .5, top - 7); g.stroke();
    if (d.lit) post(g, G => flame(G, .5, top - 6, w > 30 ? 1.25 : .95, t, sd));
  }
});

/* ---------- vase with flowers ---------- */
const VASE = {
  amphora: { w: 76, h: 118, fl: 100, p: [[0, .5], [.05, .4], [.13, .28], [.3, .34], [.5, .9], [.7, 1], [.88, .7], [.96, .44], [1, .5]] },
  bottle: { w: 46, h: 98, fl: 92, p: [[0, .32], [.05, .26], [.4, .28], [.55, .95], [.75, 1], [.97, .92], [1, .8]] },
  urn: { w: 100, h: 100, fl: 92, p: [[0, .7], [.05, .55], [.12, .6], [.3, .9], [.6, 1], [.85, .6], [.92, .42], [1, .55]] },
  bowl: { w: 124, h: 56, fl: 42, p: [[0, 1], [.12, .98], [.55, .7], [.85, .44], [1, .42]] },
};
function profile(p, u) { for (let i = 1; i < p.length; i++) if (u <= p[i][0]) { const a = p[i - 1], b = p[i], k = (u - a[0]) / (b[0] - a[0] || 1); return lerp(a[1], b[1], k * k * (3 - 2 * k)); } return p[p.length - 1][1]; }
function vaseOutline(v) { const L = [], R = []; for (let i = 0; i <= 24; i++) { const u = i / 24, hw = profile(v.p, u) * v.w / 2, y = -v.h / 2 + u * v.h; L.push([-hw, y]); R.push([hw, y]); } return { L, R }; }
def('vase', {
  label: 'Vase', snd: 'glass', ext: { t: 110 },
  data: { shape: 'amphora', color: '#27498f', flower: 'rose', bloom: '#c2203f', count: 7 },
  dims: d => ({ w: VASE[d.shape].w, h: VASE[d.shape].h }),
  shape: (w, h, d) => { const o = vaseOutline(VASE[d.shape]); return o.L.concat(o.R); },
  fields: [
    { k: 'shape', t: 'select', l: 'Vase', o: [['amphora', 'Amphora'], ['bottle', 'Bottle'], ['urn', 'Urn'], ['bowl', 'Low bowl']] }, { k: 'color', t: 'color', l: 'Glaze' },
    { k: 'flower', t: 'select', l: 'Flowers', o: FLOWERS, on: (d, v) => { if (BLOOM[v]) d.bloom = BLOOM[v]; } }, { k: 'bloom', t: 'color', l: 'Bloom colour' }, { k: 'count', t: 'range', l: 'Stems', min: 1, max: 14, step: 1 }],
  draw(g, d, t, st, sd) {
    const v = VASE[d.shape], r = rng(sd * 31 + 3), n = d.count, bowl = d.shape === 'bowl', my = -v.h / 2 + 4;
    if (d.flower !== 'none') {
      const items = [];
      for (let i = 0; i < n; i++) {
        const a = ((n === 1 ? .5 : i / (n - 1)) - .5) * (bowl ? 2.5 : 1.2) + (r() - .5) * .25, L = v.fl * (.68 + r() * .6), sway = Math.sin(t * .9 + i * 1.7 + sd) * 2.2;
        items.push({ a, hx: Math.sin(a) * L * (bowl ? 1.1 : .9) + sway, hy: my - Math.cos(a) * L * (bowl ? .8 : 1), rot: r() * 6.283, s: 9 + r() * 4, lf: r() });
      }
      g.lineCap = 'round';
      items.forEach(it => { g.strokeStyle = '#3d6b34'; g.lineWidth = 2.2; g.beginPath(); g.moveTo(0, my + 8); g.quadraticCurveTo(it.hx * .2, (it.hy + my) / 2, it.hx, it.hy); g.stroke();
        g.fillStyle = '#4f8a40'; for (const u of [.4, .66]) { const lx = it.hx * u * (u > .5 ? 1 : .6), ly = my + (it.hy - my) * u; g.save(); g.translate(lx, ly); g.rotate(it.a * .5 + (u > .5 ? 1 : -1) * 1.0); g.beginPath(); g.ellipse(5, 0, 6.5, 2.4, 0, 0, 6.3); g.fill(); g.restore(); } });
      items.slice().sort((a, b) => a.hy - b.hy).forEach(it => { g.save(); g.translate(it.hx, it.hy); g.rotate(it.a * .5); (HEAD[d.flower])(g, it.s * (d.flower === 'sunflower' ? 1.3 : d.flower === 'lavender' ? 1 : 1.05), d.bloom, it.rot, (sd + (it.lf * 100 | 0))); g.restore(); });
    }
    const o = vaseOutline(v), pts = o.L.concat(o.R.slice().reverse());
    g.beginPath(); pts.forEach(([x, y], i) => i ? g.lineTo(x, y) : g.moveTo(x, y)); g.closePath();
    g.fillStyle = lg(g, -v.w / 2, 0, v.w / 2, 0, [[0, shade(d.color, -.35)], [.25, shade(d.color, .05)], [.45, shade(d.color, .35)], [.7, d.color], [1, shade(d.color, -.45)]]); g.fill();
    g.save(); g.clip(); g.strokeStyle = 'rgba(232,194,90,.9)'; g.lineWidth = 2; for (const u of [.12, .62, .8]) { const y = -v.h / 2 + u * v.h; g.beginPath(); g.moveTo(-v.w, y); g.lineTo(v.w, y); g.stroke(); }
    g.fillStyle = 'rgba(232,194,90,.8)'; for (let i = -4; i <= 4; i++) { g.beginPath(); g.arc(i * v.w * .09, -v.h / 2 + v.h * .7, 1.6, 0, 6.3); g.fill(); } g.restore();
    g.strokeStyle = 'rgba(0,0,0,.4)'; g.lineWidth = 1; g.stroke();
    g.fillStyle = 'rgba(255,255,255,.28)'; g.beginPath(); g.ellipse(-v.w * .18, -v.h * .05, 3, v.h * .22, .1, 0, 6.3); g.fill();
    g.fillStyle = 'rgba(10,10,10,.6)'; g.beginPath(); g.ellipse(0, -v.h / 2 + 1, profile(v.p, 0) * v.w / 2 - 1, 3, 0, 0, 6.3); g.fill();
  }
});

/* ---------- bowls and vessels ---------- */
const BM = { brass: ['#e6c15a', '#7a5518'], copper: ['#d58a58', '#6a3418'], silver: ['#e6e9f0', '#6c7280'], ceramic: ['#f6f2e8', '#9c9482'], blue: ['#4a78cc', '#17306a'], black: ['#55555e', '#121216'] };
const CONT = { empty: { n: 'Empty' }, water: { n: 'Water', c: '#5aa7c8', liq: 1 }, milk: { n: 'Milk', c: '#f4efe6', liq: 1 }, honey: { n: 'Honey', c: '#d9951c', liq: 1 }, wine: { n: 'Wine', c: '#7a1236', liq: 1 }, oil: { n: 'Oil', c: '#c9a227', liq: 1 }, salt: { n: 'Salt', c: '#eceae4', mound: 1 }, earth: { n: 'Earth', c: '#4b3626', mound: 1 }, ash: { n: 'Ash', c: '#6a6a70', mound: 1 }, herbs: { n: 'Dried herbs', c: '#6a8a4a', mound: 1, spk: '#3f5a2a' }, petals: { n: 'Petals', c: '#e07a98', mound: 1, spk: '#f4b4c8' }, gold: { n: 'Gold coins', c: '#d4a838', mound: 1, spk: '#fff1a8' } };
const contOpts = Object.entries(CONT).map(([k, v]) => [k, v.n]);
def('bowl', {
  label: 'Bowl', snd: 'metal', data: { mat: 'brass', content: 'water' },
  dims: () => ({ w: 118, h: 46 }),
  shape: (w, h) => [[-w / 2, -h / 2], [w / 2, -h / 2], [w * .34, h / 2], [-w * .34, h / 2]],
  fields: [{ k: 'mat', t: 'select', l: 'Material', o: [['brass', 'Brass'], ['copper', 'Copper'], ['silver', 'Silver'], ['ceramic', 'White ceramic'], ['blue', 'Blue glaze'], ['black', 'Black stone']] }, { k: 'content', t: 'select', l: 'Contents', o: contOpts }],
  update(b, o) { o.st.rip = Math.max((o.st.rip || 0) * .97, Math.min(1.5, b.speed * .12)); },
  draw(g, d, t, st, sd) {
    const w = 118, h = 46, hw = w / 2, hh = h / 2, m = BM[d.mat], c = CONT[d.content], r = rng(sd + 5);
    g.fillStyle = lg(g, -hw, 0, hw, 0, [[0, m[1]], [.25, m[0]], [.55, shade(m[0], .35)], [1, m[1]]]);
    g.beginPath(); g.moveTo(-hw, -hh); g.bezierCurveTo(-hw, hh * .4, -hw * .55, hh, -w * .34, hh); g.lineTo(w * .34, hh); g.bezierCurveTo(hw * .55, hh, hw, hh * .4, hw, -hh); g.closePath(); g.fill();
    g.fillRect(-w * .3, hh - 3, w * .6, 4);
    g.strokeStyle = 'rgba(0,0,0,.35)'; g.lineWidth = 1; g.stroke();
    g.fillStyle = shade(m[1], -.2); g.beginPath(); g.ellipse(0, -hh, hw, 9, 0, 0, 6.3); g.fill();
    g.fillStyle = shade(m[0], .15); g.beginPath(); g.ellipse(0, -hh, hw, 9, 0, Math.PI, 6.283); g.fill();
    g.fillStyle = shade(m[1], -.35); g.beginPath(); g.ellipse(0, -hh + 1.5, hw - 4, 7, 0, 0, 6.3); g.fill();
    if (c.liq) {
      g.fillStyle = c.c; g.beginPath(); g.ellipse(0, -hh + 3, hw - 6, 6, 0, 0, 6.3); g.fill();
      g.fillStyle = lg(g, -hw, 0, hw, 0, [[0, 'rgba(0,0,0,.25)'], [.5, 'rgba(255,255,255,.2)'], [1, 'rgba(0,0,0,.25)']]); g.beginPath(); g.ellipse(0, -hh + 3, hw - 6, 6, 0, 0, 6.3); g.fill();
      const rp = st.rip || 0; g.lineWidth = 1; for (let k = 0; k < 3; k++) { const u = ((t * .6 + k / 3) % 1); g.strokeStyle = `rgba(255,255,255,${(1 - u) * Math.min(.7, .08 + rp * .5)})`; g.beginPath(); g.ellipse(0, -hh + 3, (hw - 8) * u, 5 * u, 0, 0, 6.3); g.stroke(); }
      g.fillStyle = 'rgba(255,255,255,.45)'; g.beginPath(); g.ellipse(-hw * .3, -hh + 2, 10, 1.5, 0, 0, 6.3); g.fill();
    } else if (c.mound) {
      g.beginPath(); g.moveTo(-hw + 6, -hh + 3); g.quadraticCurveTo(-hw * .4, -hh - 18, 0, -hh - 15); g.quadraticCurveTo(hw * .4, -hh - 18, hw - 6, -hh + 3); g.quadraticCurveTo(0, -hh + 10, -hw + 6, -hh + 3); g.closePath();
      g.fillStyle = lg(g, 0, -hh - 16, 0, -hh + 6, [[0, shade(c.c, .25)], [1, shade(c.c, -.25)]]); g.fill(); g.save(); g.clip();
      for (let i = 0; i < 90; i++) { g.fillStyle = r() < .5 ? shade(c.c, .3) : shade(c.c, -.3); if (c.spk && r() < .4) g.fillStyle = c.spk; g.fillRect(-hw + 6 + r() * (w - 12), -hh - 16 + r() * 22, 1.6, 1.4); }
      if (d.content === 'gold') for (let i = 0; i < 10; i++) { g.fillStyle = '#e6c25a'; g.beginPath(); g.arc(-30 + r() * 60, -hh - 8 + r() * 8, 3.3, 0, 6.3); g.fill(); g.strokeStyle = '#8a6420'; g.stroke(); }
      g.restore();
    }
    g.strokeStyle = 'rgba(255,255,255,.35)'; g.lineWidth = 1.4; g.beginPath(); g.ellipse(0, -hh, hw - 1, 8.5, 0, Math.PI * 1.05, Math.PI * 1.4); g.stroke();
  }
});
def('chalice', {
  label: 'Chalice', snd: 'metal', data: { mat: 'brass', content: 'wine' },
  dims: () => ({ w: 44, h: 76 }),
  parts: (w, h) => [{ type: 'poly', v: [[-w / 2, -h / 2], [w / 2, -h / 2], [w * .4, -h * .05], [-w * .4, -h * .05]] }, { type: 'rect', x: 0, y: h * .15, w: 7, h: h * .4 }, { type: 'poly', v: [[-w * .45, h / 2], [w * .45, h / 2], [w * .2, h * .35], [-w * .2, h * .35]] }],
  fields: [{ k: 'mat', t: 'select', l: 'Metal', o: [['brass', 'Gold'], ['silver', 'Silver'], ['copper', 'Copper'], ['black', 'Pewter']] }, { k: 'content', t: 'select', l: 'Contents', o: [['wine', 'Wine'], ['water', 'Water'], ['milk', 'Milk'], ['honey', 'Mead'], ['empty', 'Empty']] }],
  draw(g, d, t) {
    const w = 44, h = 76, m = BM[d.mat], c = CONT[d.content];
    g.fillStyle = lg(g, -w / 2, 0, w / 2, 0, [[0, m[1]], [.3, m[0]], [.55, shade(m[0], .4)], [1, m[1]]]);
    g.beginPath(); g.moveTo(-w * .45, h / 2); g.quadraticCurveTo(-w * .15, h * .42, -3.5, h * .3); g.lineTo(-3.5, h * .02); g.quadraticCurveTo(-w * .5, -h * .02, -w / 2, -h / 2); g.lineTo(w / 2, -h / 2); g.quadraticCurveTo(w * .5, -h * .02, 3.5, h * .02); g.lineTo(3.5, h * .3); g.quadraticCurveTo(w * .15, h * .42, w * .45, h / 2); g.closePath(); g.fill();
    g.strokeStyle = 'rgba(0,0,0,.35)'; g.lineWidth = 1; g.stroke();
    g.fillStyle = shade(m[0], .5); g.beginPath(); g.arc(0, h * .17, 5, 0, 6.3); g.fill(); g.strokeStyle = 'rgba(0,0,0,.4)'; g.stroke();
    g.fillStyle = shade(m[1], -.3); g.beginPath(); g.ellipse(0, -h / 2, w / 2, 5, 0, 0, 6.3); g.fill();
    if (c.c) { g.fillStyle = c.c; g.beginPath(); g.ellipse(0, -h / 2 + 3, w / 2 - 3, 3.6, 0, 0, 6.3); g.fill(); g.fillStyle = 'rgba(255,255,255,.4)'; g.beginPath(); g.ellipse(-8, -h / 2 + 2, 5, 1, 0, 0, 6.3); g.fill(); }
  }
});
const LAYERS = [['none', 'Nothing'], ['salt', 'Salt'], ['herbs', 'Dried herbs'], ['rosemary', 'Rosemary'], ['lavender', 'Lavender'], ['petals', 'Rose petals'], ['earth', 'Earth'], ['honey', 'Honey'], ['coins', 'Gold coins'], ['crystal', 'Crystal chips'], ['sand', 'Sand'], ['glitter', 'Silver glitter'], ['water', 'Water'], ['ash', 'Ash']];
const LAYBASE = { salt: '#e6e3dc', herbs: '#50703a', rosemary: '#33502a', lavender: '#6d4f9c', petals: '#c25a78', earth: '#46301f', honey: '#d99a1c', coins: '#3a2b10', crystal: '#2a2a3a', sand: '#d8c08a', glitter: '#1d1d2c', water: '#5f9cc0', ash: '#55555a' };
def('jar', {
  label: 'Spell jar', snd: 'glass', data: { l1: 'salt', l2: 'rosemary', l3: 'petals', label: 'protection', seal: 'cork', wax: '#8e1f2e' },
  dims: () => ({ w: 58, h: 86 }),
  fields: [{ k: 'l1', t: 'select', l: 'Bottom layer', o: LAYERS }, { k: 'l2', t: 'select', l: 'Middle layer', o: LAYERS }, { k: 'l3', t: 'select', l: 'Top layer', o: LAYERS }, { k: 'label', t: 'text', l: 'Label' }, { k: 'seal', t: 'select', l: 'Seal', o: [['cork', 'Cork'], ['wax', 'Wax']] }, { k: 'wax', t: 'color', l: 'Wax colour' }],
  draw(g, d, t, st, sd) {
    const w = 58, h = 86, ix = -w / 2 + 4, iw = w - 8, iy = -h / 2 + 22, ih = h - 22 - 5, r = rng(sd + 17);
    const ls = [d.l1, d.l2, d.l3].filter(x => x !== 'none');
    g.save(); rr(g, ix, iy, iw, ih, 9); g.clip(); g.fillStyle = 'rgba(20,20,26,.35)'; g.fillRect(ix, iy, iw, ih);
    ls.forEach((L, i) => {
      const lh = ih / ls.length, y0 = iy + ih - lh * (i + 1) - (i === ls.length - 1 ? 8 : 0), hh = lh + (i === ls.length - 1 ? 8 : 0);
      g.fillStyle = LAYBASE[L]; g.fillRect(ix, y0, iw, hh);
      if (L === 'honey') { g.fillStyle = lg(g, ix, 0, ix + iw, 0, [[0, 'rgba(120,60,0,.4)'], [.35, 'rgba(255,230,150,.4)'], [1, 'rgba(120,60,0,.4)']]); g.fillRect(ix, y0, iw, hh); return; }
      if (L === 'water') { g.fillStyle = 'rgba(255,255,255,.2)'; g.fillRect(ix, y0, 6, hh); return; }
      for (let k = 0; k < 70; k++) {
        const x = ix + r() * iw, y = y0 + r() * hh;
        if (L === 'salt') { g.fillStyle = r() < .5 ? '#fff' : '#bdb8ae'; g.fillRect(x, y, 1.8, 1.8); }
        else if (L === 'herbs') { g.strokeStyle = r() < .5 ? '#7a9a52' : '#3a5a2a'; g.beginPath(); g.moveTo(x, y); g.lineTo(x + 3, y + 1.5); g.stroke(); }
        else if (L === 'rosemary') { g.strokeStyle = r() < .5 ? '#5a7a3a' : '#223a1c'; g.lineWidth = 1; g.beginPath(); g.moveTo(x, y); g.lineTo(x + 5 * (r() - .3), y + 5 * r()); g.stroke(); }
        else if (L === 'lavender') { g.fillStyle = r() < .5 ? '#9a7ad0' : '#523a82'; g.beginPath(); g.ellipse(x, y, 1.6, 1, r() * 3, 0, 6.3); g.fill(); }
        else if (L === 'petals') { g.fillStyle = r() < .5 ? '#f0a0b8' : '#9a3050'; g.beginPath(); g.ellipse(x, y, 3, 1.7, r() * 3, 0, 6.3); g.fill(); }
        else if (L === 'earth') { g.fillStyle = r() < .5 ? '#6a4a30' : '#2a1a10'; g.fillRect(x, y, 2.4, 2); }
        else if (L === 'coins') { g.fillStyle = '#e6c25a'; g.beginPath(); g.arc(x, y, 2.4, 0, 6.3); g.fill(); g.strokeStyle = '#8a6420'; g.lineWidth = .5; g.stroke(); }
        else if (L === 'crystal') { g.fillStyle = r() < .5 ? '#b08af0' : '#d8c8ff'; g.beginPath(); g.moveTo(x, y); g.lineTo(x + 3, y + 1); g.lineTo(x + 1, y + 3.5); g.fill(); }
        else if (L === 'sand') { g.fillStyle = r() < .5 ? '#ecd8a0' : '#b89c62'; g.fillRect(x, y, 1.6, 1.6); }
        else if (L === 'glitter') { g.fillStyle = r() < .5 ? '#e8ecff' : '#7a7a9a'; g.fillRect(x, y, 1.4, 1.4); }
        else if (L === 'ash') { g.fillStyle = r() < .5 ? '#8a8a90' : '#303034'; g.fillRect(x, y, 2.2, 1.6); }
      }
    });
    g.restore();
    g.strokeStyle = 'rgba(210,235,245,.75)'; g.lineWidth = 1.6; rr(g, ix - 1, iy - 1, iw + 2, ih + 2, 10); g.stroke();
    g.fillStyle = 'rgba(210,235,245,.25)'; rr(g, ix - 1, -h / 2 + 12, iw + 2, 12, 3); g.fill();
    g.fillStyle = lg(g, 0, iy, iw, iy + ih, [[0, 'rgba(255,255,255,.35)'], [.3, 'rgba(255,255,255,0)'], [1, 'rgba(255,255,255,0)']]); rr(g, ix, iy, iw, ih, 9); g.fill();
    g.fillStyle = 'rgba(255,255,255,.55)'; rr(g, ix + 4, iy + 8, 3, ih - 22, 1.5); g.fill();
    if (d.seal === 'wax') { g.fillStyle = d.wax; rr(g, -w / 2 + 7, -h / 2 + 3, w - 14, 20, 5); g.fill(); g.fillStyle = lg(g, -w / 2, 0, w / 2, 0, [[0, 'rgba(0,0,0,.3)'], [.4, 'rgba(255,255,255,.3)'], [1, 'rgba(0,0,0,.3)']]); rr(g, -w / 2 + 7, -h / 2 + 3, w - 14, 20, 5); g.fill(); for (const x of [-10, 4, 14]) { g.fillStyle = d.wax; g.beginPath(); g.ellipse(x, -h / 2 + 22, 3, 6 + Math.abs(x % 5), 0, 0, 6.3); g.fill(); } }
    else { g.fillStyle = lg(g, -w / 2, 0, w / 2, 0, [[0, '#8a6a3a'], [.5, '#c9a266'], [1, '#7a5a2e']]); rr(g, -w / 2 + 11, -h / 2 + 2, w - 22, 22, 3); g.fill(); g.fillStyle = 'rgba(60,35,10,.4)'; for (let i = 0; i < 12; i++) g.fillRect(-w / 2 + 12 + r() * (w - 24), -h / 2 + 3 + r() * 20, 1.5, 1.2); }
    if (d.label) { g.fillStyle = '#efe3c4'; g.strokeStyle = 'rgba(80,50,20,.6)'; g.lineWidth = .8; rr(g, -w / 2 + 6, -2, w - 12, 20, 2); g.fill(); g.stroke(); fitText(g, d.label, 0, 8, w - 18, 10, 'italic', '#3a2412'); }
  }
});
def('honey', {
  label: 'Honey jar', snd: 'glass', data: { label: 'honey' },
  dims: () => ({ w: 54, h: 60 }), shape: (w, h) => [[-w / 2 + 3, -h / 2], [w / 2 - 3, -h / 2], [w / 2, -h / 2 + 8], [w / 2, h / 2], [-w / 2, h / 2], [-w / 2, -h / 2 + 8]],
  fields: [{ k: 'label', t: 'text', l: 'Label' }],
  draw(g, d) {
    const w = 54, h = 60; rr(g, -w / 2, -h / 2 + 8, w, h - 8, 10); g.fillStyle = lg(g, -w / 2, 0, w / 2, 0, [[0, '#a8620c'], [.3, '#f2b43a'], [.55, '#ffd472'], [1, '#9a5808']]); g.fill(); g.strokeStyle = 'rgba(255,240,200,.6)'; g.lineWidth = 1.4; g.stroke();
    g.fillStyle = '#b8924a'; rr(g, -w / 2 + 3, -h / 2, w - 6, 12, 3); g.fill(); g.strokeStyle = 'rgba(60,35,5,.5)'; for (let i = 0; i < 6; i++) { g.beginPath(); g.moveTo(-w / 2 + 6 + i * 8, -h / 2 + 1); g.lineTo(-w / 2 + 6 + i * 8, -h / 2 + 11); g.stroke(); }
    g.fillStyle = '#f0e2bc'; rr(g, -w / 2 + 6, -4, w - 12, 24, 2); g.fill(); g.strokeStyle = 'rgba(80,50,20,.5)'; g.lineWidth = .8; g.stroke(); if (d.label) fitText(g, d.label, 0, 8, w - 20, 11, 'italic', '#3a2412');
    g.fillStyle = 'rgba(255,255,255,.5)'; rr(g, -w / 2 + 5, -h / 2 + 16, 3, h - 30, 1.5); g.fill();
  }
});
def('chocolate', {
  label: 'Chocolate', snd: 'soft', data: { kind: 'dark' }, dims: () => ({ w: 62, h: 16 }), fields: [{ k: 'kind', t: 'select', l: 'Kind', o: [['dark', 'Dark'], ['milk', 'Milk'], ['white', 'White']] }],
  draw(g, d) { const c = { dark: '#3a2014', milk: '#7a4a2c', white: '#efe3c4' }[d.kind]; for (let i = 0; i < 5; i++) { const x = -31 + i * 12.4; g.fillStyle = lg(g, 0, -8, 0, 8, [[0, shade(c, .2)], [.5, c], [1, shade(c, -.25)]]); rr(g, x, -8, 12, 16, 1.5); g.fill(); g.strokeStyle = 'rgba(0,0,0,.3)'; g.lineWidth = .7; g.stroke(); g.fillStyle = 'rgba(255,255,255,.18)'; g.fillRect(x + 1.5, -6.5, 9, 2); } }
});
def('fruit', {
  label: 'Fruit', snd: 'soft', data: { type: 'pomegranate' }, shape: 'circle', dims: () => ({ w: 34, h: 34 }),
  fields: [{ k: 'type', t: 'select', l: 'Fruit', o: [['pomegranate', 'Pomegranate'], ['apple', 'Apple'], ['fig', 'Fig'], ['orange', 'Orange'], ['grapes', 'Grapes']] }],
  draw(g, d, t, st, sd) {
    const base = { pomegranate: '#b01e32', apple: '#c62a2a', fig: '#5a2a5e', orange: '#f08a1a', grapes: '#5a2a7a' }[d.type], r = 17;
    if (d.type === 'grapes') { const q = rng(sd); for (let i = 0; i < 16; i++) { const a = q() * 6.283, dd = q() * 11, x = Math.cos(a) * dd * .9, y = Math.sin(a) * dd * .9 + 2; g.fillStyle = rg(g, x - 2, y - 2, 1, 6, [[0, '#b58ad0'], [1, base]]); g.beginPath(); g.arc(x, y, 5.5, 0, 6.3); g.fill(); } g.strokeStyle = '#3d6b34'; g.lineWidth = 2; g.beginPath(); g.moveTo(0, -12); g.lineTo(3, -18); g.stroke(); return; }
    g.fillStyle = rg(g, -5, -6, 2, r * 1.2, [[0, shade(base, .4)], [.5, base], [1, shade(base, -.5)]]); g.beginPath(); g.arc(0, 0, r, 0, 6.3); g.fill();
    if (d.type === 'pomegranate') { g.fillStyle = shade(base, -.2); g.beginPath(); for (let i = 0; i < 6; i++) { const a = i * 1.047; g.lineTo(Math.cos(a) * 6, -r + 2 + Math.sin(a) * 3); } g.fill(); }
    if (d.type === 'apple') { g.strokeStyle = '#4a2c14'; g.lineWidth = 2; g.beginPath(); g.moveTo(0, -r + 3); g.lineTo(2, -r - 3); g.stroke(); g.fillStyle = '#4f8a40'; g.beginPath(); g.ellipse(7, -r + 1, 6, 2.5, -.5, 0, 6.3); g.fill(); }
    if (d.type === 'fig') { g.strokeStyle = '#2a102e'; g.lineWidth = 1; for (let i = -2; i <= 2; i++) { g.beginPath(); g.moveTo(i * 5, -r + 4); g.lineTo(i * 6, r - 4); g.stroke(); } }
    g.fillStyle = 'rgba(255,255,255,.35)'; g.beginPath(); g.ellipse(-6, -7, 4, 2.4, -.7, 0, 6.3); g.fill();
  }
});

/* ---------- stones, crystals, shells ---------- */
const CRYS = { quartz: ['#dcf0f6', 1], amethyst: ['#8d5bd1', 1], rose: ['#f0b3c6', 1], citrine: ['#f2b630', 1], smoky: ['#7a6458', 1], obsidian: ['#1a1722', 0], fluorite: ['#4ec1a0', 1], lapis: ['#27449b', 0], malachite: ['#1f8a52', 0], selenite: ['#f4f2ea', 1], moonstone: ['#cfd9f0', 1] };
const crysOpts = [['quartz', 'Clear quartz'], ['amethyst', 'Amethyst'], ['rose', 'Rose quartz'], ['citrine', 'Citrine'], ['smoky', 'Smoky quartz'], ['obsidian', 'Obsidian'], ['fluorite', 'Fluorite'], ['lapis', 'Lapis lazuli'], ['malachite', 'Malachite'], ['selenite', 'Selenite'], ['moonstone', 'Moonstone']];
function prism(g, x, y, pw, ph, tilt, c, tr) {
  g.save(); g.translate(x, y); g.rotate(tilt); const a = tr ? .9 : 1, tip = ph * .24;
  const face = (x0, x1, col) => { g.fillStyle = col; g.globalAlpha = a; g.fillRect(x0, -ph + tip, x1 - x0, ph - tip); };
  face(-pw / 2, -pw / 6, shade(c, -.28)); face(-pw / 6, pw / 6, c); face(pw / 6, pw / 2, shade(c, .3));
  const tp = (x0, x1, col) => { g.fillStyle = col; g.beginPath(); g.moveTo(x0, -ph + tip); g.lineTo(x1, -ph + tip); g.lineTo(0, -ph); g.closePath(); g.fill(); };
  tp(-pw / 2, -pw / 6, shade(c, -.1)); tp(-pw / 6, pw / 6, shade(c, .2)); tp(pw / 6, pw / 2, shade(c, .45));
  g.strokeStyle = 'rgba(255,255,255,.35)'; g.lineWidth = .8; g.globalAlpha = 1; g.beginPath(); g.moveTo(-pw / 6, -ph + tip); g.lineTo(-pw / 6, 0); g.moveTo(pw / 6, -ph + tip); g.lineTo(pw / 6, 0); g.moveTo(-pw / 2, -ph + tip); g.lineTo(pw / 2, -ph + tip); g.stroke();
  g.fillStyle = 'rgba(255,255,255,.4)'; g.fillRect(-pw / 6 + 1.5, -ph + tip + 3, 1.6, ph * .5);
  g.restore();
}
def('crystal', {
  label: 'Crystal', snd: 'glass', data: { form: 'cluster', type: 'amethyst' },
  dims: d => d.form === 'cluster' ? { w: 72, h: 70 } : d.form === 'point' ? { w: 28, h: 66 } : d.form === 'sphere' ? { w: 52, h: 68 } : { w: 34, h: 26 },
  shape: (w, h, d) => d.form === 'cluster' ? [[-w / 2, h / 2], [w / 2, h / 2], [w * .32, -h * .1], [w * .08, -h / 2], [-w * .12, -h / 2], [-w * .4, -h * .1]] : d.form === 'point' ? [[-w / 2, h / 2], [w / 2, h / 2], [w / 2, -h * .2], [0, -h / 2], [-w / 2, -h * .2]] : [[-w * .5, 0], [-w * .3, -h * .4], [w * .3, -h * .5], [w * .5, -h * .1], [w * .35, h * .45], [-w * .3, h * .5]],
  parts: null,
  fields: [{ k: 'form', t: 'select', l: 'Form', o: [['cluster', 'Cluster'], ['point', 'Single point'], ['sphere', 'Sphere on stand'], ['tumbled', 'Tumbled stone']] }, { k: 'type', t: 'select', l: 'Crystal', o: crysOpts }],
  draw(g, d, t, st, sd) {
    const [c, tr] = CRYS[d.type], { w, h } = this.dims(d);
    if (d.form === 'cluster') {
      g.fillStyle = '#4a4440'; g.beginPath(); g.moveTo(-w / 2, h / 2); g.quadraticCurveTo(-w * .4, h * .3, -w * .2, h * .32); g.quadraticCurveTo(0, h * .25, w * .25, h * .3); g.quadraticCurveTo(w * .45, h * .3, w / 2, h / 2); g.fill();
      [[-26, 12, 32, -.5], [24, 14, 40, .45], [-12, 17, 52, -.2], [10, 18, 60, .12], [-1, 20, 66, 0]].forEach(p => prism(g, p[0], h / 2 - 8, p[1], p[2], p[3], c, tr));
    } else if (d.form === 'point') prism(g, 0, h / 2, w * .9, h, 0, c, tr);
    else if (d.form === 'sphere') {
      g.fillStyle = lg(g, -18, 0, 18, 0, [[0, '#4a3220'], [.5, '#8a6440'], [1, '#2a1a10']]); g.beginPath(); g.moveTo(-20, h / 2); g.lineTo(20, h / 2); g.lineTo(12, h / 2 - 12); g.lineTo(-12, h / 2 - 12); g.closePath(); g.fill();
      const cy = -h / 2 + 26; g.fillStyle = rg(g, -8, cy - 9, 2, 28, [[0, shade(c, .6)], [.4, c], [1, shade(c, -.55)]]); g.globalAlpha = tr ? .92 : 1; g.beginPath(); g.arc(0, cy, 26, 0, 6.3); g.fill(); g.globalAlpha = 1;
      g.fillStyle = 'rgba(255,255,255,.55)'; g.beginPath(); g.ellipse(-9, cy - 10, 7, 4, -.6, 0, 6.3); g.fill(); g.strokeStyle = 'rgba(255,255,255,.2)'; g.beginPath(); g.arc(0, cy, 24, .3, 1.2); g.stroke();
    } else { g.fillStyle = rg(g, -5, -5, 1, 22, [[0, shade(c, .5)], [.6, c], [1, shade(c, -.45)]]); g.beginPath(); g.moveTo(-w * .5, 0); g.bezierCurveTo(-w * .5, -h * .6, w * .35, -h * .7, w * .5, -h * .1); g.bezierCurveTo(w * .55, h * .5, -w * .3, h * .6, -w * .5, 0); g.fill(); g.fillStyle = 'rgba(255,255,255,.4)'; g.beginPath(); g.ellipse(-5, -6, 5, 2.4, -.4, 0, 6.3); g.fill(); }
    if (tr) post(g, G => { const p = (t * .5 + sd * .37) % 5; if (p < .5) { const k = Math.sin(p / .5 * Math.PI); G.globalCompositeOperation = 'lighter'; G.strokeStyle = `rgba(255,255,255,${k})`; G.lineWidth = 1.2; const x = -4 + (sd % 7) - 3, y = -h * .3; G.beginPath(); G.moveTo(x - 7 * k, y); G.lineTo(x + 7 * k, y); G.moveTo(x, y - 7 * k); G.lineTo(x, y + 7 * k); G.stroke(); } });
  }
});
def('stone', {
  label: 'Stone', snd: 'stone', data: { type: 'river' }, dims: () => ({ w: 44, h: 28 }),
  shape: (w, h) => [[-w * .5, h * .5], [-w * .5, h * .1], [-w * .3, -h * .4], [w * .1, -h * .5], [w * .45, -h * .2], [w * .5, h * .5]],
  fields: [{ k: 'type', t: 'select', l: 'Stone', o: [['river', 'River stone'], ['basalt', 'Black basalt'], ['white', 'White quartzite'], ['jasper', 'Red jasper'], ['aventurine', 'Green aventurine'], ['seaglass', 'Sea glass']] }],
  draw(g, d, t, st, sd) {
    const c = { river: '#8d8a84', basalt: '#25252b', white: '#e6e2da', jasper: '#a8352a', aventurine: '#4f8a5a', seaglass: '#7ac8b8' }[d.type], w = 44, h = 28, r = rng(sd + 3);
    g.beginPath(); g.moveTo(-w * .5, h * .5); g.bezierCurveTo(-w * .56, -h * .2, -w * .25, -h * .6, w * .08, -h * .52); g.bezierCurveTo(w * .45, -h * .5, w * .55, h * .1, w * .5, h * .5); g.closePath();
    g.fillStyle = rg(g, -8, -8, 2, 34, [[0, shade(c, .35)], [.5, c], [1, shade(c, -.5)]]); g.fill(); g.save(); g.clip();
    for (let i = 0; i < 24; i++) { g.fillStyle = r() < .5 ? 'rgba(255,255,255,.18)' : 'rgba(0,0,0,.18)'; g.fillRect(-w / 2 + r() * w, -h / 2 + r() * h, 1.6, 1.4); }
    if (d.type === 'river' || d.type === 'white') { g.strokeStyle = 'rgba(255,255,255,.5)'; g.lineWidth = 1.2; g.beginPath(); g.moveTo(-w * .4, h * .1); g.lineTo(w * .4, -h * .1); g.stroke(); }
    g.restore(); g.fillStyle = 'rgba(255,255,255,.35)'; g.beginPath(); g.ellipse(-8, -9, 6, 2.6, -.5, 0, 6.3); g.fill();
  }
});
def('shell', {
  label: 'Shell', snd: 'stone', data: { type: 'scallop' }, dims: d => d.type === 'scallop' ? { w: 46, h: 38 } : { w: 40, h: 30 },
  shape: (w, h, d) => d.type === 'scallop' ? [[-w / 2, h / 2], [w / 2, h / 2], [w * .42, -h * .1], [0, -h / 2], [-w * .42, -h * .1]] : [[-w / 2, h / 2], [w / 2, h / 2], [w * .5, -h * .1], [w * .1, -h / 2], [-w * .4, -h * .25]],
  fields: [{ k: 'type', t: 'select', l: 'Shell', o: [['scallop', 'Scallop'], ['spiral', 'Spiral conch'], ['cowrie', 'Cowrie']] }],
  draw(g, d) {
    const { w, h } = this.dims(d);
    if (d.type === 'scallop') {
      g.beginPath(); g.moveTo(-6, h / 2); g.lineTo(-w * .5, h * .1); g.quadraticCurveTo(-w * .5, -h * .45, 0, -h / 2); g.quadraticCurveTo(w * .5, -h * .45, w * .5, h * .1); g.lineTo(6, h / 2); g.closePath();
      g.fillStyle = lg(g, -w / 2, 0, w / 2, 0, [[0, '#f0c9b4'], [.5, '#fbe8da'], [1, '#d99c80']]); g.fill(); g.strokeStyle = 'rgba(150,80,60,.5)'; g.lineWidth = 1;
      for (let i = -5; i <= 5; i++) { g.beginPath(); g.moveTo(i * .8, h / 2 - 3); g.lineTo(i * w * .085, -h * .42 + Math.abs(i) * 1.6); g.stroke(); }
      g.fillStyle = '#d99c80'; rr(g, -9, h / 2 - 7, 18, 7, 2); g.fill();
    } else if (d.type === 'spiral') {
      g.fillStyle = lg(g, 0, -h / 2, 0, h / 2, [[0, '#fbe8da'], [1, '#d99c80']]); g.beginPath(); g.moveTo(-w / 2, h / 2); g.bezierCurveTo(-w * .5, -h * .1, -w * .1, -h / 2, w * .2, -h * .45); g.bezierCurveTo(w * .55, -h * .3, w * .55, h * .3, w * .25, h / 2); g.closePath(); g.fill(); g.strokeStyle = 'rgba(150,80,60,.5)'; g.beginPath(); for (let a = 0; a < 12; a += .2) g.lineTo(w * .1 + Math.cos(a) * a * 1.5, -h * .05 + Math.sin(a) * a * 1.2); g.stroke();
    } else { g.fillStyle = rg(g, -5, -4, 1, 22, [[0, '#fff6e4'], [1, '#c89a60']]); g.beginPath(); g.ellipse(0, 0, w / 2, h / 2 - 1, 0, 0, 6.3); g.fill(); g.strokeStyle = '#6a4a2a'; g.lineWidth = 1.4; g.beginPath(); g.moveTo(-w * .4, 2); g.quadraticCurveTo(0, -3, w * .4, 2); g.stroke(); g.lineWidth = .8; for (let i = -6; i <= 6; i++) { g.beginPath(); g.moveTo(i * 2.8, -2); g.lineTo(i * 2.8, 6); g.stroke(); } }
  }
});
def('pile', {
  label: 'Pile', snd: 'soft', data: { mat: 'salt' }, dims: () => ({ w: 80, h: 38 }),
  shape: (w, h) => [[-w / 2, h / 2], [w / 2, h / 2], [w * .3, -h * .1], [w * .05, -h / 2], [-w * .2, -h * .3]],
  fields: [{ k: 'mat', t: 'select', l: 'Material', o: [['salt', 'Salt'], ['earth', 'Earth'], ['sand', 'Sand'], ['ash', 'Ash'], ['herbs', 'Dried herbs'], ['petals', 'Rose petals']] }],
  draw(g, d, t, st, sd) {
    const c = { salt: '#eceae4', earth: '#4b3626', sand: '#d8c08a', ash: '#6a6a70', herbs: '#6a8a4a', petals: '#e07a98' }[d.mat], w = 80, h = 38, r = rng(sd + 9);
    g.beginPath(); g.moveTo(-w / 2, h / 2); g.bezierCurveTo(-w * .35, h * .3, -w * .2, -h * .5, 0, -h / 2); g.bezierCurveTo(w * .2, -h * .45, w * .35, h * .3, w / 2, h / 2); g.closePath();
    g.fillStyle = lg(g, -w / 2, -h / 2, w / 2, h / 2, [[0, shade(c, .35)], [.5, c], [1, shade(c, -.4)]]); g.fill(); g.save(); g.clip();
    for (let i = 0; i < 160; i++) { g.fillStyle = r() < .5 ? shade(c, .3) : shade(c, -.3); if (d.mat === 'petals') { g.beginPath(); g.ellipse(-w / 2 + r() * w, -h / 2 + r() * h, 3, 1.7, r() * 3, 0, 6.3); g.fill(); } else g.fillRect(-w / 2 + r() * w, -h / 2 + r() * h, 1.6, 1.4); }
    g.restore();
  }
});
def('coin', {
  label: 'Coin', snd: 'metal', data: { mat: 'gold' }, dims: () => ({ w: 28, h: 8 }),
  fields: [{ k: 'mat', t: 'select', l: 'Metal', o: [['gold', 'Gold'], ['silver', 'Silver'], ['copper', 'Copper']] }],
  draw(g, d) {
    const c = { gold: ['#f2d36a', '#8a6420'], silver: ['#eef0f6', '#6c7280'], copper: ['#d58a58', '#6a3418'] }[d.mat];
    g.fillStyle = c[1]; g.beginPath(); g.ellipse(0, 1.5, 14, 3.2, 0, 0, 6.3); g.fill(); g.fillRect(-14, -.5, 28, 2.5);
    g.fillStyle = lg(g, -14, 0, 14, 0, [[0, c[1]], [.35, c[0]], [.7, shade(c[0], .4)], [1, c[1]]]); g.beginPath(); g.ellipse(0, -.5, 14, 3.4, 0, 0, 6.3); g.fill(); g.strokeStyle = shade(c[1], -.2); g.lineWidth = .6; g.beginPath(); g.ellipse(0, -.5, 10, 2.2, 0, 0, 6.3); g.stroke();
  }
});
def('ingot', {
  label: 'Ingot', snd: 'metal', data: { mat: 'gold' }, dims: () => ({ w: 58, h: 24 }), shape: (w, h) => [[-w * .36, -h / 2], [w * .36, -h / 2], [w / 2, h / 2], [-w / 2, h / 2]],
  fields: [{ k: 'mat', t: 'select', l: 'Metal', o: [['gold', 'Gold'], ['silver', 'Silver'], ['copper', 'Copper']] }],
  draw(g, d) { const c = { gold: ['#f2d36a', '#8a6420'], silver: ['#eef0f6', '#6c7280'], copper: ['#d58a58', '#6a3418'] }[d.mat], w = 58, h = 24; g.beginPath(); g.moveTo(-w * .36, -h / 2); g.lineTo(w * .36, -h / 2); g.lineTo(w / 2, h / 2); g.lineTo(-w / 2, h / 2); g.closePath(); g.fillStyle = lg(g, -w / 2, -h / 2, w / 2, h / 2, [[0, shade(c[0], .5)], [.4, c[0]], [1, c[1]]]); g.fill(); g.strokeStyle = shade(c[1], -.3); g.lineWidth = 1; g.stroke(); g.fillStyle = 'rgba(255,255,255,.35)'; g.fillRect(-w * .3, -h / 2 + 3, w * .5, 3); g.strokeStyle = 'rgba(0,0,0,.2)'; g.strokeRect(-w * .26, -h / 2 + 6, w * .52, h - 12); }
});
def('herbs', {
  label: 'Herb bundle', snd: 'soft', data: { type: 'sage' }, dims: () => ({ w: 112, h: 24 }),
  fields: [{ k: 'type', t: 'select', l: 'Herb', o: [['sage', 'Sage'], ['rosemary', 'Rosemary'], ['lavender', 'Lavender'], ['bay', 'Bay laurel'], ['mugwort', 'Mugwort']] }],
  draw(g, d, t, st, sd) {
    const r = rng(sd + 21), w = 112, T = d.type;
    for (let s = 0; s < 6; s++) {
      const y0 = -6 + s * 2.2, ang = (r() - .5) * .08; g.save(); g.translate(0, y0); g.rotate(ang);
      g.strokeStyle = '#5a4a2a'; g.lineWidth = 1.5; g.beginPath(); g.moveTo(-w / 2, 0); g.lineTo(w / 2, 0); g.stroke();
      for (let x = -w / 2 + 14; x < w / 2 - 4; x += T === 'rosemary' ? 3 : 8) {
        const up = r() < .5 ? -1 : 1;
        if (T === 'sage') { g.fillStyle = r() < .5 ? '#8fa088' : '#a5b59c'; g.beginPath(); g.ellipse(x, up * 5, 7, 2.8, up * .5, 0, 6.3); g.fill(); }
        else if (T === 'rosemary') { g.strokeStyle = r() < .5 ? '#3f5a2e' : '#5a7a40'; g.lineWidth = 1; g.beginPath(); g.moveTo(x, 0); g.lineTo(x + 3, up * 8); g.stroke(); }
        else if (T === 'lavender') { g.fillStyle = r() < .5 ? '#8a6ac8' : '#5e429a'; g.beginPath(); g.ellipse(x, up * 3, 3.2, 1.8, 0, 0, 6.3); g.fill(); g.beginPath(); g.ellipse(x + 3, up * 2, 2.6, 1.6, 0, 0, 6.3); g.fill(); }
        else if (T === 'bay') { g.fillStyle = r() < .5 ? '#3f6a3a' : '#2a4a28'; g.beginPath(); g.ellipse(x, up * 5, 8, 2.8, up * .4, 0, 6.3); g.fill(); }
        else { g.fillStyle = r() < .5 ? '#7a9a7a' : '#a8c0a4'; g.beginPath(); g.moveTo(x, 0); g.lineTo(x + 4, up * 7); g.lineTo(x - 2, up * 4); g.fill(); }
      }
      g.restore();
    }
    g.strokeStyle = '#c9a266'; g.lineWidth = 2.2; g.beginPath(); g.moveTo(-24, -9); g.lineTo(-24, 9); g.moveTo(-18, -9); g.lineTo(-18, 9); g.stroke(); g.fillStyle = '#c9a266'; g.beginPath(); g.ellipse(-21, 0, 4, 2, 0, 0, 6.3); g.fill();
  }
});

/* ---------- incense and fire ---------- */
function ember(g, x, y, t, sd) { post(g, G => { G.globalCompositeOperation = 'lighter'; G.fillStyle = rg(G, x, y, 0, 8, [[0, `rgba(255,${150 + Math.sin(t * 6 + sd) * 40 | 0},50,.9)`], [1, 'rgba(255,90,10,0)']]); G.beginPath(); G.arc(x, y, 8, 0, 6.3); G.fill(); }); }
def('incense', {
  label: 'Incense', snd: 'wood', data: { form: 'stick', lit: true, smoke: '#e9e4dc' }, toggle: 'lit', ext: { t: 60 },
  dims: d => d.form === 'stick' ? { w: 72, h: 18 } : d.form === 'cone' ? { w: 52, h: 46 } : { w: 66, h: 30 },
  shape: (w, h, d) => d.form === 'cone' ? [[-w / 2, h / 2], [w / 2, h / 2], [w * .4, h * .2], [w * .12, -h / 2 + 6], [-w * .12, -h / 2 + 6], [-w * .4, h * .2]] : [[-w / 2, -h * .1], [w / 2, -h * .1], [w * .34, h / 2], [-w * .34, h / 2]],
  light: d => d.lit ? { r: 40, w: .5 } : null,
  emit: d => d.form === 'stick' ? { x: 23, y: -9 - 60 } : d.form === 'cone' ? { x: 0, y: -23 + 6 } : { x: 0, y: -6 }, big: d => d.form === 'resin',
  fields: [{ k: 'form', t: 'select', l: 'Kind', o: [['stick', 'Stick'], ['cone', 'Cone'], ['resin', 'Resin on charcoal']] }, { k: 'smoke', t: 'color', l: 'Smoke tint' }],
  draw(g, d, t, st, sd) {
    const { w, h } = this.dims(d);
    if (d.form === 'stick') {
      g.strokeStyle = '#5a3c20'; g.lineWidth = 2.2; g.lineCap = 'round'; g.beginPath(); g.moveTo(-6, -4); g.lineTo(23, -69); g.stroke(); g.strokeStyle = d.lit ? '#2a2420' : '#5a3c20'; g.lineWidth = 2.4; g.beginPath(); g.moveTo(17, -56); g.lineTo(23, -69); g.stroke();
      if (d.lit) ember(g, 23, -69, t, sd);
      g.fillStyle = lg(g, -w / 2, 0, w / 2, 0, [[0, '#7a5518'], [.3, '#e6c15a'], [.6, '#f6e08a'], [1, '#6a4510']]); g.beginPath(); g.moveTo(-w / 2, -h * .1); g.lineTo(w / 2, -h * .1); g.quadraticCurveTo(w * .4, h / 2, w * .2, h / 2); g.lineTo(-w * .2, h / 2); g.quadraticCurveTo(-w * .4, h / 2, -w / 2, -h * .1); g.fill();
      g.fillStyle = 'rgba(0,0,0,.4)'; g.beginPath(); g.ellipse(0, -h * .1, w / 2, 2.4, 0, 0, 6.3); g.fill(); g.fillStyle = '#d9d2c0'; g.beginPath(); g.ellipse(-6, -4, 5, 2, 0, 0, 6.3); g.fill();
    } else if (d.form === 'cone') {
      g.fillStyle = lg(g, -w / 2, 0, w / 2, 0, [[0, '#7a5518'], [.4, '#e6c15a'], [1, '#6a4510']]); g.beginPath(); g.moveTo(-w / 2, h / 2); g.lineTo(w / 2, h / 2); g.quadraticCurveTo(w * .46, h * .2, w * .36, h * .2); g.lineTo(-w * .36, h * .2); g.quadraticCurveTo(-w * .46, h * .2, -w / 2, h / 2); g.fill();
      g.fillStyle = lg(g, -12, 0, 12, 0, [[0, '#2a1c14'], [.5, '#4a362a'], [1, '#1a100a']]); g.beginPath(); g.moveTo(-11, h * .22); g.lineTo(11, h * .22); g.lineTo(2, -h / 2 + 4); g.lineTo(-2, -h / 2 + 4); g.closePath(); g.fill();
      if (d.lit) ember(g, 0, -h / 2 + 4, t, sd);
    } else {
      g.fillStyle = lg(g, -w / 2, 0, w / 2, 0, [[0, '#7a5518'], [.4, '#e6c15a'], [1, '#6a4510']]); g.beginPath(); g.moveTo(-w / 2, -h * .1); g.lineTo(w / 2, -h * .1); g.quadraticCurveTo(w * .4, h / 2, w * .2, h / 2); g.lineTo(-w * .2, h / 2); g.quadraticCurveTo(-w * .4, h / 2, -w / 2, -h * .1); g.fill();
      g.fillStyle = '#1c1612'; g.beginPath(); g.ellipse(0, -h * .1, w * .38, 5, 0, 0, 6.3); g.fill(); g.fillStyle = '#c9893a'; for (let i = 0; i < 4; i++) { g.beginPath(); g.arc(-8 + i * 5, -h * .1 - 3, 3, 0, 6.3); g.fill(); }
      if (d.lit) ember(g, 0, -h * .1 - 3, t, sd);
    }
  }
});
def('brazier', {
  label: 'Fire bowl', snd: 'metal', data: { lit: true }, toggle: 'lit', ext: { t: 70 }, dims: () => ({ w: 104, h: 84 }),
  shape: (w, h) => [[-w / 2, -h / 2 + 10], [w / 2, -h / 2 + 10], [w * .36, h / 2], [-w * .36, h / 2]],
  light: d => d.lit ? { r: 260, w: 1.6 } : null, emit: () => ({ x: 0, y: -50 }), big: () => true, fields: [],
  draw(g, d, t, st, sd) {
    const w = 104, h = 84;
    g.strokeStyle = '#4a3418'; g.lineWidth = 5; g.lineCap = 'round'; g.beginPath(); g.moveTo(-w * .3, 0); g.lineTo(-w * .36, h / 2); g.moveTo(w * .3, 0); g.lineTo(w * .36, h / 2); g.moveTo(0, 10); g.lineTo(0, h / 2); g.stroke();
    g.fillStyle = lg(g, -w / 2, 0, w / 2, 0, [[0, '#4a2c10'], [.3, '#b8803a'], [.55, '#e6b25a'], [1, '#3a2008']]); g.beginPath(); g.moveTo(-w / 2, -h / 2 + 10); g.bezierCurveTo(-w / 2, 6, -w * .3, 24, -w * .22, 24); g.lineTo(w * .22, 24); g.bezierCurveTo(w * .3, 24, w / 2, 6, w / 2, -h / 2 + 10); g.closePath(); g.fill();
    g.strokeStyle = 'rgba(30,15,0,.5)'; g.lineWidth = 1; g.stroke();
    g.strokeStyle = '#e6c25a'; g.lineWidth = 2; g.beginPath(); g.moveTo(-w * .46, -4); g.quadraticCurveTo(0, 12, w * .46, -4); g.stroke();
    g.fillStyle = '#1a0e08'; g.beginPath(); g.ellipse(0, -h / 2 + 10, w / 2, 8, 0, 0, 6.3); g.fill();
    if (d.lit) { g.fillStyle = '#c8421a'; for (let i = 0; i < 9; i++) { g.beginPath(); g.arc(-34 + i * 8.5, -h / 2 + 11 + (i % 2) * 2, 5, 0, 6.3); g.fill(); } post(g, G => { flame(G, -16, -h / 2 + 12, 1.6, t, sd); flame(G, 14, -h / 2 + 12, 1.9, t + 1.3, sd + 3); flame(G, 0, -h / 2 + 12, 2.3, t + .7, sd + 7); }); }
  }
});

/* ---------- keepsakes: the user supplies the images ---------- */
const FRAMES = { gold: ['#f6dc84', '#8a6420'], wood: ['#9a6a3c', '#3a2210'], silver: ['#eceff5', '#767c88'], oval: ['#f6dc84', '#8a6420'] };
function framePhoto(g, img, x, y, w, h, oval, placeholder) {
  g.save(); if (oval) { g.beginPath(); g.ellipse(x + w / 2, y + h / 2, w / 2, h / 2, 0, 0, 6.3); g.clip(); } else { g.beginPath(); g.rect(x, y, w, h); g.clip(); }
  if (img) { const k = Math.max(w / img.width, h / img.height); g.drawImage(img, x + (w - img.width * k) / 2, y + (h - img.height * k) / 2, img.width * k, img.height * k); g.fillStyle = 'rgba(80,40,0,.08)'; g.fillRect(x, y, w, h); }
  else { g.fillStyle = lg(g, x, y, x + w, y + h, [[0, '#e6dcc4'], [1, '#bfae8c']]); g.fillRect(x, y, w, h); if (placeholder && !S.exporting) { g.fillStyle = 'rgba(90,60,30,.55)'; g.font = 'italic 10px Georgia'; g.textAlign = 'center'; g.fillText('your photo', x + w / 2, y + h / 2 + 3); } }
  g.fillStyle = rg(g, x + w / 2, y + h / 2, Math.min(w, h) * .3, Math.max(w, h) * .75, [[0, 'rgba(0,0,0,0)'], [1, 'rgba(30,10,0,.35)']]); g.fillRect(x, y, w, h);
  g.fillStyle = lg(g, x, y, x + w, y + h, [[0, 'rgba(255,255,255,.2)'], [.4, 'rgba(255,255,255,0)']]); g.fillRect(x, y, w, h);
  g.restore();
}
def('frame', {
  label: 'Photo frame', snd: 'wood', data: { style: 'gold', fw: 104, ratio: .8, src: '' },
  dims: d => ({ w: d.fw, h: d.fw / d.ratio }),
  fields: [{ k: 'src', t: 'file', l: 'Your photo', accept: 'image/*', max: 700, set: (d, url, w, h) => { d.src = url; d.ratio = clamp(w / h, .55, 1.7); } }, { k: 'src', t: 'clear', l: 'Remove photo' }, { k: 'style', t: 'select', l: 'Frame', o: [['gold', 'Gilded baroque'], ['wood', 'Dark wood'], ['silver', 'Silver filigree'], ['oval', 'Oval gilded']] }, { k: 'fw', t: 'range', l: 'Width', min: 64, max: 220, step: 2 }],
  draw(g, d, t, st, sd) {
    const { w, h } = this.dims(d), f = FRAMES[d.style], oval = d.style === 'oval', m = Math.max(8, w * .12), hw = w / 2, hh = h / 2;
    g.save(); g.shadowColor = 'rgba(0,0,0,.4)'; g.shadowBlur = 6; g.shadowOffsetY = 2;
    g.fillStyle = lg(g, -hw, -hh, hw, hh, [[0, f[0]], [.3, f[1]], [.55, f[0]], [.8, f[1]], [1, shade(f[0], -.1)]]);
    if (oval) { g.beginPath(); g.ellipse(0, 0, hw, hh, 0, 0, 6.3); g.fill(); } else { rr(g, -hw, -hh, w, h, 3); g.fill(); } g.restore();
    g.strokeStyle = 'rgba(40,20,0,.5)'; g.lineWidth = 1; if (oval) { g.beginPath(); g.ellipse(0, 0, hw - 2, hh - 2, 0, 0, 6.3); g.stroke(); g.beginPath(); g.ellipse(0, 0, hw - m + 2, hh - m + 2, 0, 0, 6.3); g.stroke(); } else { g.strokeRect(-hw + 2, -hh + 2, w - 4, h - 4); g.strokeRect(-hw + m - 2, -hh + m - 2, w - 2 * m + 4, h - 2 * m + 4); }
    if (!oval && d.style !== 'wood') { g.fillStyle = f[0]; g.strokeStyle = 'rgba(40,20,0,.6)'; for (const [cx, cy] of [[-hw + m / 2 + 1, -hh + m / 2 + 1], [hw - m / 2 - 1, -hh + m / 2 + 1], [-hw + m / 2 + 1, hh - m / 2 - 1], [hw - m / 2 - 1, hh - m / 2 - 1]]) { for (let i = 0; i < 8; i++) { g.beginPath(); g.ellipse(cx + Math.cos(i * .785) * m * .22, cy + Math.sin(i * .785) * m * .22, m * .17, m * .1, i * .785, 0, 6.3); g.fill(); g.stroke(); } g.beginPath(); g.arc(cx, cy, m * .12, 0, 6.3); g.fillStyle = f[1]; g.fill(); g.fillStyle = f[0]; } }
    if (oval) { g.fillStyle = '#efe3c4'; g.beginPath(); g.ellipse(0, 0, hw - m + 1, hh - m + 1, 0, 0, 6.3); g.fill(); } else { g.fillStyle = '#efe3c4'; g.fillRect(-hw + m - 1, -hh + m - 1, w - 2 * m + 2, h - 2 * m + 2); }
    framePhoto(g, getImage(d.src), -hw + m + 3, -hh + m + 3, w - 2 * m - 6, h - 2 * m - 6, oval, true);
  }
});
def('statue', {
  label: 'Statue', snd: 'stone', data: { src: '', clear: true, tol: 40, sh: 150 },
  dims: d => { const im = d.src ? getImage(d.src) : null; if (!im) return { w: d.src ? d.sh * .5 : 66, h: d.src ? d.sh : 130 }; const ih = d.sh - 14; return { w: clamp(ih * im.width / im.height, 40, 260), h: d.sh }; },
  fields: [{ k: 'src', t: 'file', l: 'Your statue image', accept: 'image/*', max: 520, png: 1, set: (d, url) => { d.src = url; } }, { k: 'src', t: 'clear', l: 'Remove image' }, { k: 'clear', t: 'check', l: 'Clear plain background' }, { k: 'tol', t: 'range', l: 'Background tolerance', min: 8, max: 120, step: 1 }, { k: 'sh', t: 'range', l: 'Height', min: 70, max: 300, step: 2 }],
  draw(g, d, t, st, sd) {
    const { w, h } = this.dims(d), im = d.src ? keyedImage(d.src, d.clear ? d.tol : 0) : null, bh = 14;
    if (im) { const ih = h - bh, k = Math.min(w / im.width, ih / im.height); const dw = im.width * k, dh = im.height * k; g.drawImage(im, -dw / 2, h / 2 - bh - dh + 2, dw, dh); }
    else if (!S.exporting) { g.strokeStyle = 'rgba(232,210,160,.55)'; g.setLineDash([4, 4]); g.lineWidth = 1.2; rr(g, -w * .36, -h / 2 + 4, w * .72, h - bh - 8, 14); g.stroke(); g.setLineDash([]); g.fillStyle = 'rgba(232,210,160,.6)'; g.font = 'italic 10px Georgia'; g.textAlign = 'center'; g.fillText('your statue', 0, -4); }
    const bw = w * .96; g.fillStyle = lg(g, -bw / 2, 0, bw / 2, 0, [[0, '#d9d0bc'], [.5, '#f1e9d6'], [1, '#9c927c']]); rr(g, -bw / 2, h / 2 - bh, bw, bh, 2); g.fill(); g.strokeStyle = 'rgba(60,45,25,.5)'; g.lineWidth = 1; g.stroke(); g.fillStyle = 'rgba(0,0,0,.18)'; g.fillRect(-bw / 2 + 1, h / 2 - bh + bh * .6, bw - 2, bh * .4 - 1);
  }
});
def('mirror', {
  label: 'Mirror', snd: 'glass', data: { style: 'gold', mw: 118, cam: false },
  dims: d => ({ w: d.mw, h: d.mw * 1.3 }),
  fields: [{ k: 'cam', t: 'camera', l: 'Camera' }, { k: 'style', t: 'select', l: 'Frame', o: [['gold', 'Gilded'], ['silver', 'Silver'], ['wood', 'Dark wood']] }, { k: 'mw', t: 'range', l: 'Width', min: 70, max: 220, step: 2 }],
  draw(g, d, t) {
    const { w, h } = this.dims(d), f = FRAMES[d.style], hw = w / 2, hh = h / 2, m = Math.max(8, w * .1);
    g.save(); g.shadowColor = 'rgba(0,0,0,.45)'; g.shadowBlur = 8; g.shadowOffsetY = 3; g.fillStyle = lg(g, -hw, -hh, hw, hh, [[0, f[0]], [.3, f[1]], [.55, f[0]], [.8, f[1]], [1, shade(f[0], -.1)]]); g.beginPath(); g.ellipse(0, 0, hw, hh, 0, 0, 6.3); g.fill(); g.restore();
    g.fillStyle = f[0]; for (let i = 0; i < 16; i++) { const a = i * 6.283 / 16; g.beginPath(); g.arc(Math.cos(a) * (hw - m * .5), Math.sin(a) * (hh - m * .5), m * .28, 0, 6.3); g.fill(); g.strokeStyle = 'rgba(40,20,0,.5)'; g.lineWidth = .7; g.stroke(); }
    g.save(); g.beginPath(); g.ellipse(0, 0, hw - m, hh - m, 0, 0, 6.3); g.clip();
    if (d.cam && Cam.ready()) { const v = Cam.vid, k = Math.max((w - 2 * m) / v.videoWidth, (h - 2 * m) / v.videoHeight); g.save(); g.scale(-1, 1); g.drawImage(v, -v.videoWidth * k / 2, -v.videoHeight * k / 2, v.videoWidth * k, v.videoHeight * k); g.restore(); g.fillStyle = 'rgba(255,200,120,.12)'; g.fillRect(-hw, -hh, w, h); }
    else { g.fillStyle = rg(g, -hw * .3, -hh * .3, 4, hh, [[0, '#f2f6f8'], [.6, '#aab6c0'], [1, '#6e7a86']]); g.fillRect(-hw, -hh, w, h); }
    g.fillStyle = rg(g, 0, 0, hh * .4, hh, [[0, 'rgba(0,0,0,0)'], [1, 'rgba(10,0,0,.45)']]); g.fillRect(-hw, -hh, w, h);
    g.fillStyle = lg(g, -hw, -hh, hw, hh, [[0, 'rgba(255,255,255,.4)'], [.35, 'rgba(255,255,255,0)'], [.6, 'rgba(255,255,255,0)'], [.75, 'rgba(255,255,255,.14)'], [.8, 'rgba(255,255,255,0)']]); g.fillRect(-hw, -hh, w, h);
    g.restore(); g.strokeStyle = 'rgba(40,20,0,.55)'; g.lineWidth = 1; g.beginPath(); g.ellipse(0, 0, hw - m, hh - m, 0, 0, 6.3); g.stroke();
  }
});
def('book', {
  label: 'Book', snd: 'wood', data: { title: 'Book of Hours', color: '#5a1e2c', o: 'flat', len: 130, th: 30 },
  dims: d => d.o === 'flat' ? { w: d.len, h: d.th } : d.o === 'upright' ? { w: d.th, h: d.len } : { w: d.len * .72, h: d.len },
  fields: [{ k: 'title', t: 'text', l: 'Title' }, { k: 'color', t: 'color', l: 'Binding' }, { k: 'o', t: 'select', l: 'Position', o: [['flat', 'Lying flat (spine)'], ['upright', 'Standing (spine)'], ['cover', 'Standing (cover)']] }, { k: 'len', t: 'range', l: 'Size', min: 70, max: 210, step: 2 }, { k: 'th', t: 'range', l: 'Thickness', min: 12, max: 64, step: 1 }],
  draw(g, d, t, st, sd) {
    const { w, h } = this.dims(d), r = rng(sd + 2);
    const leather = (x, y, ww, hh) => { g.fillStyle = lg(g, x, y, x, y + hh, [[0, shade(d.color, .22)], [.5, d.color], [1, shade(d.color, -.4)]]); rr(g, x, y, ww, hh, 2); g.fill(); g.save(); rr(g, x, y, ww, hh, 2); g.clip(); for (let i = 0; i < 90; i++) { g.fillStyle = r() < .5 ? 'rgba(255,255,255,.07)' : 'rgba(0,0,0,.1)'; g.fillRect(x + r() * ww, y + r() * hh, 1.6, 1.2); } g.restore(); g.strokeStyle = 'rgba(0,0,0,.5)'; g.lineWidth = 1; rr(g, x + .5, y + .5, ww - 1, hh - 1, 2); g.stroke(); };
    const spine = (len, th) => { leather(-len / 2, -th / 2, len, th); g.strokeStyle = '#e6c25a'; g.lineWidth = 1.4; for (const x of [-len * .36, -len * .34, len * .34, len * .36]) { g.beginPath(); g.moveTo(x, -th / 2 + 1); g.lineTo(x, th / 2 - 1); g.stroke(); } g.fillStyle = 'rgba(255,255,255,.12)'; g.fillRect(-len / 2 + 2, -th / 2 + 1, len - 4, 2); fitText(g, d.title, 0, 0, len * .6, Math.min(th * .5, 15), 'italic', '#f0d58a'); };
    if (d.o === 'flat') spine(w, h);
    else if (d.o === 'upright') { g.save(); g.rotate(-Math.PI / 2); spine(h, w); g.restore(); }
    else {
      g.fillStyle = '#efe3c4'; rr(g, -w / 2 + 4, -h / 2 + 3, w - 2, h - 2, 2); g.fill(); g.strokeStyle = 'rgba(90,60,30,.4)'; for (let i = 0; i < 4; i++) { g.beginPath(); g.moveTo(w / 2 - i * 1.2, -h / 2 + 5); g.lineTo(w / 2 - i * 1.2, h / 2); g.stroke(); }
      leather(-w / 2, -h / 2, w - 4, h - 2); g.strokeStyle = '#e6c25a'; g.lineWidth = 1.6; rr(g, -w / 2 + 6, -h / 2 + 6, w - 16, h - 14, 2); g.stroke(); g.lineWidth = .8; rr(g, -w / 2 + 10, -h / 2 + 10, w - 24, h - 22, 2); g.stroke();
      for (const [sx, sy] of [[-1, -1], [1, -1], [-1, 1], [1, 1]]) { g.beginPath(); g.arc((w - 4) / 2 * sx * .0 + sx * (w / 2 - 16) - 2, sy * (h / 2 - 17), 6, 0, Math.PI / 2); g.stroke(); }
      g.beginPath(); g.moveTo(-2, -h * .3); g.lineTo(w * .15, -h * .12); g.lineTo(-2, h * .06); g.lineTo(-w * .19, -h * .12); g.closePath(); g.stroke(); g.beginPath(); g.arc(-2, -h * .12, w * .09, 0, 6.3); g.stroke();
      fitText(g, d.title, -2, h * .26, w - 30, 14, 'italic', '#f0d58a');
    }
  }
});
def('note', {
  label: 'Written intention', snd: 'paper', data: { text: 'May I be at peace.' }, dims: () => ({ w: 98, h: 64 }),
  fields: [{ k: 'text', t: 'textarea', l: 'Intention' }],
  draw(g, d, t, st, sd) {
    const w = 98, h = 64, r = rng(sd + 1);
    g.save(); g.shadowColor = 'rgba(0,0,0,.3)'; g.shadowBlur = 4; g.shadowOffsetY = 1; g.fillStyle = lg(g, -w / 2, -h / 2, w / 2, h / 2, [[0, '#f4e9c8'], [1, '#e0cd9c']]); g.beginPath(); g.moveTo(-w / 2, -h / 2); for (let x = -w / 2; x <= w / 2; x += 7) g.lineTo(x, -h / 2 + r() * 1.6); g.lineTo(w / 2, h / 2); for (let x = w / 2; x >= -w / 2; x -= 7) g.lineTo(x, h / 2 - r() * 1.6); g.closePath(); g.fill(); g.restore();
    g.fillStyle = '#3a2412'; g.font = 'italic 9.5px "Cormorant Garamond", Georgia, serif'; g.textAlign = 'center'; g.textBaseline = 'alphabetic';
    const words = (d.text || '').split(/\s+/), lines = []; let cur = ''; words.forEach(wd => { const tt = cur ? cur + ' ' + wd : wd; if (g.measureText(tt).width > w - 14 && cur) { lines.push(cur); cur = wd; } else cur = tt; }); if (cur) lines.push(cur);
    const show = lines.slice(0, 5), y0 = -((show.length - 1) * 11) / 2 + 3; show.forEach((l, i) => g.fillText(l, 0, y0 + i * 11));
  }
});
let _glowCache = {};
function goldSigil(src) { if (_glowCache[src]) return _glowCache[src]; const im = getImage(src); if (!im) return null; const c = mk(im.width, im.height), g = c.getContext('2d'); g.drawImage(im, 0, 0); g.globalCompositeOperation = 'source-in'; g.fillStyle = '#ffd36a'; g.fillRect(0, 0, c.width, c.height); return _glowCache[src] = c; }
def('sigil', {
  label: 'Sigil', snd: 'paper', data: { src: '', style: 'paper', charged: false }, dims: () => ({ w: 76, h: 76 }),
  fields: [{ k: 'style', t: 'select', l: 'Made on', o: [['paper', 'Parchment'], ['plate', 'Gold plaque']] }, { k: 'charged', t: 'check', l: 'Charged (glowing)' }],
  draw(g, d, t, st, sd) {
    const w = 76, h = 76, im = getImage(d.src);
    if (d.style === 'plate') { g.save(); g.shadowColor = 'rgba(0,0,0,.4)'; g.shadowBlur = 5; g.fillStyle = lg(g, -w / 2, -h / 2, w / 2, h / 2, [[0, '#f6dc84'], [.5, '#b8873a'], [1, '#f0d070']]); rr(g, -w / 2, -h / 2, w, h, 5); g.fill(); g.restore(); g.strokeStyle = 'rgba(60,35,5,.5)'; rr(g, -w / 2 + 4, -h / 2 + 4, w - 8, h - 8, 3); g.stroke(); if (im) { g.globalAlpha = .85; g.drawImage(im, -w * .4, -h * .4, w * .8, h * .8); g.globalAlpha = 1; } }
    else {
      const r = rng(sd + 4); g.save(); g.shadowColor = 'rgba(0,0,0,.35)'; g.shadowBlur = 5; g.fillStyle = lg(g, -w / 2, -h / 2, w / 2, h / 2, [[0, '#f4e9c8'], [1, '#dcc895']]); g.beginPath(); for (let i = 0; i < 28; i++) { const a = i / 28 * 6.283, rad = 1 - (d.charged ? r() * .06 : 0); const x = Math.cos(a), y = Math.sin(a); g.lineTo(clamp(x * 1.5, -1, 1) * w / 2 * rad, clamp(y * 1.5, -1, 1) * h / 2 * rad); } g.closePath(); g.fill(); g.restore();
      if (d.charged) { g.strokeStyle = 'rgba(90,40,10,.55)'; g.lineWidth = 3; g.stroke(); }
      if (im) { g.globalAlpha = .92; g.drawImage(im, -w * .42, -h * .42, w * .84, h * .84); g.globalAlpha = 1; }
    }
    if (d.charged) { const gs = goldSigil(d.src); if (gs) post(g, G => { G.globalCompositeOperation = 'lighter'; G.globalAlpha = .45 + .25 * Math.sin(t * 2 + sd); G.shadowColor = '#ffb040'; G.shadowBlur = 12; G.drawImage(gs, -w * .42, -h * .42, w * .84, h * .84); }); }
  }
});
