'use strict';
/* Painterly pass: every place is painted in code, then run through an oil-paint filter
   (Kuwahara), re-stroked with directional brushwork and glazed, so it reads as a Pre-Raphaelite
   canvas rather than clean vector art. */

/* ---------- foreground flora, painted before the filter ---------- */
const BLOOMS = { poppy: ['#e0371f', '#ff7a4a'], iris: ['#5a3cb8', '#a58af0'], daisy: ['#f4f0e4', '#fff'], bluebell: ['#3a52c8', '#8aa0f6'], rose: ['#b81e3c', '#f06a88'], foxglove: ['#b84a8e', '#f0a8d0'], buttercup: ['#f2bc10', '#fff08a'], forget: ['#5a90e8', '#e8f0ff'], lily: ['#fff6ee', '#f4b4c4'] };
function bloom(g, x, y, s, kind, r) {
  const pal = BLOOMS[kind]; g.save(); g.translate(x, y);
  g.strokeStyle = r() < .5 ? '#2f6a30' : '#3f7a38'; g.lineWidth = Math.max(1.2, s * .18); g.beginPath(); g.moveTo(0, 0); g.quadraticCurveTo((r() - .5) * s, s * 1.8, (r() - .5) * s * .8, s * 3.6); g.stroke();
  g.fillStyle = '#3f7a38'; for (const k of [-1, 1]) { g.save(); g.translate((r() - .5) * s * .4, s * (1.4 + r())); g.rotate(k * (.8 + r() * .5)); g.beginPath(); g.ellipse(s * .5 * k, 0, s * .7, s * .2, 0, 0, 6.3); g.fill(); g.restore(); }
  if (kind === 'foxglove') { for (let i = 0; i < 7; i++) { g.fillStyle = pal[i % 2]; g.beginPath(); g.ellipse((i % 2 ? 1 : -1) * s * .3, -s * .3 + i * s * .5, s * .28, s * .4, 0, 0, 6.3); g.fill(); g.fillStyle = 'rgba(40,0,30,.4)'; g.beginPath(); g.arc((i % 2 ? 1 : -1) * s * .3, -s * .1 + i * s * .5, s * .1, 0, 6.3); g.fill(); } }
  else {
    const n = kind === 'daisy' ? 14 : kind === 'poppy' ? 5 : kind === 'iris' ? 6 : kind === 'lily' ? 6 : 5;
    for (let i = 0; i < n; i++) { g.save(); g.rotate(i * 6.283 / n + r() * .3); g.fillStyle = lg(g, 0, 0, 0, -s, [[0, pal[1]], [1, pal[0]]]); g.beginPath(); g.ellipse(0, -s * .55, s * (kind === 'daisy' ? .14 : .4), s * (kind === 'daisy' ? .55 : .6), 0, 0, 6.3); g.fill(); g.strokeStyle = 'rgba(0,0,0,.12)'; g.stroke(); g.restore(); }
    g.fillStyle = kind === 'poppy' ? '#1a1010' : '#f2c230'; g.beginPath(); g.arc(0, 0, s * .2, 0, 6.3); g.fill();
  }
  g.restore();
}
function flowerBed(g, x0, x1, y0, y1, n, r, kinds) {
  const pts = []; for (let i = 0; i < n; i++) pts.push({ x: x0 + (x1 - x0) * r(), y: y0 + (y1 - y0) * Math.pow(r(), .75), k: kinds[(r() * kinds.length) | 0] });
  pts.sort((a, b) => a.y - b.y);
  pts.forEach(p => { const t = (p.y - y0) / (y1 - y0), s = 4 + t * 13; leaves(g, p.x, p.y + s * 3, s * 2.2, ['#2f6a30', '#3f7a38', '#56903f', '#244f26'], 4, r, s * 1.6); bloom(g, p.x, p.y, s, p.k, r); });
}
const addBed = (id, fn) => { const o = BUILD[id]; BUILD[id] = (g, p) => { o(g, p); fn(g, p); }; };
const BED_ALL = ['poppy', 'iris', 'daisy', 'bluebell', 'rose', 'foxglove', 'buttercup', 'forget'];
addBed('greek', (g) => { const r = rng(71); flowerBed(g, 0, 330, 640, 716, 70, r, BED_ALL); flowerBed(g, 950, W, 640, 716, 70, r, BED_ALL); flowerBed(g, 330, 950, 690, 718, 40, r, ['daisy', 'forget', 'buttercup']); });
addBed('circle', (g) => { const r = rng(72); flowerBed(g, 0, W, 650, 718, 160, r, ['poppy', 'daisy', 'bluebell', 'buttercup', 'forget', 'foxglove']); });
addBed('beach', (g) => { const r = rng(73); flowerBed(g, 0, 250, 640, 716, 40, r, ['rose', 'daisy', 'forget']); flowerBed(g, 1030, W, 640, 716, 40, r, ['rose', 'daisy', 'forget']); });
addBed('rotunda', (g) => { const r = rng(74); flowerBed(g, 0, 250, 650, 716, 40, r, ['rose', 'daisy', 'forget']); flowerBed(g, 1030, W, 650, 716, 40, r, ['rose', 'daisy', 'forget']); });
addBed('jungle', (g) => { const r = rng(75); flowerBed(g, 0, 300, 640, 716, 40, r, ['poppy', 'rose', 'buttercup']); flowerBed(g, 980, W, 640, 716, 40, r, ['poppy', 'rose', 'buttercup']); });

/* ---------- a woodland river, after Ophelia ---------- */
PLACES.river = { name: 'Woodland river', count: { label: 'Water lilies', min: 1, max: 6, def: 3 }, ambient: { stream: .5, birds: .3, wind: .12, crickets: .08, drone: .1 } };
function willow(g, x, top, dir, r) {
  g.fillStyle = lg(g, x - 30, 0, x + 30, 0, [[0, '#6a5238'], [.5, '#4a3826'], [1, '#2a1e14']]);
  g.beginPath(); g.moveTo(x - 26, 640); g.quadraticCurveTo(x - 20, 480, x + dir * 20 - 12, top + 20); g.lineTo(x + dir * 20 + 12, top + 20); g.quadraticCurveTo(x + 22, 480, x + 30, 640); g.closePath(); g.fill();
  leaves(g, x + dir * 60, top, 150, ['#5a8a46', '#7aa656', '#3f6a38', '#98bc68'], 260, r, 28);
  for (let i = 0; i < 90; i++) {
    const sx = x + dir * 40 + (r() - .5) * 300, sy = top + (r() - .3) * 60, len = 150 + r() * 260, ex = sx + (r() - .5) * 30;
    g.strokeStyle = ['#6f9a48', '#86b058', '#4f7a3a', '#a4c470'][(r() * 4) | 0]; g.lineWidth = 1 + r() * 2; g.beginPath(); g.moveTo(sx, sy); g.bezierCurveTo(sx + (r() - .5) * 20, sy + len * .3, ex, sy + len * .7, ex, sy + len); g.stroke();
    for (let j = 0; j < 9; j++) { const u = j / 9; g.fillStyle = g.strokeStyle; g.beginPath(); g.ellipse(lerp(sx, ex, u) + (r() - .5) * 4, sy + len * u, 5, 1.6, 1.2, 0, 6.3); g.fill(); }
  }
}
BUILD.river = (g, o) => {
  const r = rng(61), n = o.count;
  g.fillStyle = lg(g, 0, 0, 0, 430, [[0, '#b4ceb0'], [.6, '#f2dc9a'], [1, '#e8c880']]); g.fillRect(0, 0, W, 430);
  g.fillStyle = rg(g, 780, 150, 10, 420, [[0, 'rgba(255,248,200,.9)'], [1, 'rgba(255,248,200,0)']]); g.fillRect(0, 0, W, 430);
  hills(g, 300, 34, '#86a572', 3, .005); hills(g, 345, 28, '#5f8a56', 4, .007); hills(g, 392, 22, '#3f6e46', 5, .009);
  for (let i = 0; i < 18; i++) leaves(g, r() * W, 290 + r() * 100, 80, ['#4f7a46', '#6f9a58', '#3a6840', '#86b068'], 90, r, 20);
  g.fillStyle = lg(g, 0, 410, 0, 600, [[0, '#3d6a58'], [.5, '#1e3d34'], [1, '#10261f']]); g.fillRect(0, 410, W, 200);
  for (let i = 0; i < 700; i++) { const x = r() * W, y = 415 + r() * 185; g.strokeStyle = ['rgba(120,170,110,.28)', 'rgba(240,210,130,.2)', 'rgba(20,50,40,.35)', 'rgba(150,190,200,.16)'][(r() * 4) | 0]; g.lineWidth = 1 + r() * 3; g.beginPath(); g.moveTo(x, y); g.lineTo(x + (r() - .5) * 10, y + 4 + r() * 14); g.stroke(); }
  for (let i = 0; i < n * 9; i++) {
    const x = 90 + r() * 1100, y = 438 + r() * 150, k = (y - 410) / 190, rx = (14 + r() * 22) * (.6 + k * .9), ry = rx * .3;
    g.save(); g.translate(x, y); g.fillStyle = lg(g, 0, -ry, 0, ry, [[0, '#7fb050'], [1, '#2f6a30']]); g.beginPath(); g.ellipse(0, 0, rx, ry, 0, .25, 6.03); g.lineTo(0, 0); g.fill();
    g.strokeStyle = 'rgba(20,60,20,.35)'; g.lineWidth = 1; for (let v = 0; v < 6; v++) { g.beginPath(); g.moveTo(0, 0); g.lineTo(Math.cos(v + .8) * rx * .9, Math.sin(v + .8) * ry * .9); g.stroke(); }
    if (r() < .32) { g.scale(1, .5); const pr = rx * .55; for (let p = 0; p < 9; p++) { g.save(); g.rotate(p * .7); g.fillStyle = lg(g, 0, 0, 0, -pr, [[0, '#f8d4d8'], [1, '#fffaf4']]); g.beginPath(); g.ellipse(0, -pr * .6, pr * .28, pr * .6, 0, 0, 6.3); g.fill(); g.strokeStyle = 'rgba(150,80,90,.3)'; g.stroke(); g.restore(); } g.fillStyle = '#f2c230'; g.beginPath(); g.arc(0, 0, pr * .2, 0, 6.3); g.fill(); }
    g.restore();
  }
  for (let i = 0; i < 150; i++) { const x = r() < .5 ? r() * 300 : 980 + r() * 300, base = 470 + r() * 140, h = 70 + r() * 160; g.strokeStyle = ['#4a6a30', '#6a8a3a', '#8aa04a', '#3a5a28'][(r() * 4) | 0]; g.lineWidth = 1.5 + r() * 2; g.beginPath(); g.moveTo(x, base); g.quadraticCurveTo(x + (r() - .5) * 30, base - h * .6, x + (r() - .5) * 40, base - h); g.stroke(); if (r() < .2) { g.fillStyle = '#5a3a1e'; g.beginPath(); g.ellipse(x + (r() - .5) * 8, base - h - 8, 3.2, 12, 0, 0, 6.3); g.fill(); } }
  willow(g, 110, 150, 1, r); willow(g, 1180, 130, -1, r);
  g.beginPath(); g.moveTo(0, H); for (let x = 0; x <= W; x += 10) g.lineTo(x, 598 + Math.sin(x * .01) * 8 + Math.sin(x * .027) * 4); g.lineTo(W, H); g.closePath(); g.fillStyle = lg(g, 0, 585, 0, H, [[0, '#527f3c'], [1, '#1e4a22']]); g.fill();
  for (let i = 0; i < 2600; i++) { const y = 600 + Math.pow(r(), .8) * 120, x = r() * W; g.strokeStyle = ['#3c7a30', '#5aa043', '#74b552', '#2d6a2a'][(r() * 4) | 0]; g.lineWidth = 1 + (y - 600) / 40; g.beginPath(); g.moveTo(x, y); g.lineTo(x + (r() - .5) * 6, y - 5 - (y - 600) / 8); g.stroke(); }
  flowerBed(g, 0, W, 612, 716, 190, r, ['poppy', 'daisy', 'forget', 'buttercup', 'foxglove', 'iris', 'rose', 'lily']);
  fern(g, 40, 716, 200, .7, ['#1d4a22', '#2f7a38', '#3f9a44', '#56b050'], r); fern(g, 1240, 716, 200, -.7, ['#1d4a22', '#2f7a38', '#3f9a44', '#56b050'], r);
};
const _dyn = dynamicScenery;
dynamicScenery = function (g, place, t) {
  _dyn(g, place, t);
  if (place.id === 'river') {
    for (let i = 0; i < 70; i++) { const x = (i * 131.7 + Math.sin(t * .15 + i) * 40) % W, y = 424 + ((i * 47.3) % 170), a = Math.max(0, Math.sin(t * .8 + i * 2.1)); g.strokeStyle = `rgba(255,236,170,${a * .22})`; g.lineWidth = 1.2; g.beginPath(); g.moveTo(x, y); g.lineTo(x + 18 + (y - 420) / 10, y); g.stroke(); }
  }
};

/* ---------- oil-paint filter ---------- */
function kuwahara(d, w, h, R) {
  const W1 = w + 1, N = W1 * (h + 1), sR = new Float64Array(N), sG = new Float64Array(N), sB = new Float64Array(N), sL = new Float64Array(N), sQ = new Float64Array(N);
  for (let y = 0; y < h; y++) {
    let a = 0, b = 0, c = 0, l = 0, q = 0;
    for (let x = 0; x < w; x++) {
      const i = (y * w + x) * 4, r = d[i], g = d[i + 1], bl = d[i + 2], L = .3 * r + .59 * g + .11 * bl; a += r; b += g; c += bl; l += L; q += L * L;
      const k = (y + 1) * W1 + x + 1, u = y * W1 + x + 1; sR[k] = sR[u] + a; sG[k] = sG[u] + b; sB[k] = sB[u] + c; sL[k] = sL[u] + l; sQ[k] = sQ[u] + q;
    }
  }
  const out = new Uint8ClampedArray(d.length), S = (arr, x0, y0, x1, y1) => arr[(y1 + 1) * W1 + x1 + 1] - arr[y0 * W1 + x1 + 1] - arr[(y1 + 1) * W1 + x0] + arr[y0 * W1 + x0];
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
    let best = 1e18, bx0 = 0, by0 = 0, bx1 = 0, by1 = 0;
    for (let q = 0; q < 4; q++) {
      const x0 = Math.max(0, q & 1 ? x : x - R), x1 = Math.min(w - 1, q & 1 ? x + R : x), y0 = Math.max(0, q & 2 ? y : y - R), y1 = Math.min(h - 1, q & 2 ? y + R : y), n = (x1 - x0 + 1) * (y1 - y0 + 1);
      const m = S(sL, x0, y0, x1, y1) / n, v = S(sQ, x0, y0, x1, y1) / n - m * m; if (v < best) { best = v; bx0 = x0; by0 = y0; bx1 = x1; by1 = y1; }
    }
    const n = (bx1 - bx0 + 1) * (by1 - by0 + 1), i = (y * w + x) * 4;
    out[i] = S(sR, bx0, by0, bx1, by1) / n; out[i + 1] = S(sG, bx0, by0, bx1, by1) / n; out[i + 2] = S(sB, bx0, by0, bx1, by1) / n; out[i + 3] = d[i + 3];
  }
  return out;
}
let _weave = null;
function weaveTile() {
  if (_weave) return _weave; const c = mk(6, 6), g = c.getContext('2d'); g.fillStyle = 'rgba(0,0,0,.09)'; g.fillRect(0, 0, 3, 3); g.fillRect(3, 3, 3, 3); g.fillStyle = 'rgba(255,255,255,.07)'; g.fillRect(3, 0, 3, 3); g.fillRect(0, 3, 3, 3); return _weave = c;
}
function paintify(src, scale) {
  const ww = Math.min(W, src.width), hh = Math.round(ww * H / W), k = ww / W, rad = Math.max(1, Math.round(3 * k));
  const work = mk(ww, hh), wg = work.getContext('2d', { willReadFrequently: true });
  wg.fillStyle = lg(wg, 0, 0, 0, hh, [[0, '#8fb8e0'], [1, '#e8e4c8']]); wg.fillRect(0, 0, ww, hh); wg.drawImage(src, 0, 0, ww, hh);
  const orig = wg.getImageData(0, 0, ww, hh), alpha = mk(ww, hh), ag = alpha.getContext('2d', { willReadFrequently: true }); ag.drawImage(src, 0, 0, ww, hh); const A = ag.getImageData(0, 0, ww, hh).data;
  const filt = kuwahara(orig.data, ww, hh, rad); for (let i = 3; i < filt.length; i += 4) filt[i] = A[i];
  const fc = mk(ww, hh), fg = fc.getContext('2d'); fg.putImageData(new ImageData(filt, ww, hh), 0, 0);
  const res = mk(src.width, src.height), g = res.getContext('2d'), up = src.width / ww; g.imageSmoothingQuality = 'high'; g.drawImage(fc, 0, 0, res.width, res.height);
  // directional brush strokes along the edges of the image
  const r = rng(404), N = Math.round(30000 * (ww * hh) / (W * H)), L = (x, y) => { const i = (clamp(y, 0, hh - 1) * ww + clamp(x, 0, ww - 1)) * 4; return .3 * filt[i] + .59 * filt[i + 1] + .11 * filt[i + 2]; };
  g.lineCap = 'round';
  for (let i = 0; i < N; i++) {
    const x = (r() * ww) | 0, y = (r() * hh) | 0, p = (y * ww + x) * 4; if (filt[p + 3] < 230) continue;
    const gx = L(x + 2, y) - L(x - 2, y), gy = L(x, y + 2) - L(x, y - 2), ang = Math.atan2(gy, gx) + Math.PI / 2 + (r() - .5) * .9, len = (5 + r() * 11) * k * up * .5, j = (r() - .5) * 18;
    g.strokeStyle = `rgba(${clamp(filt[p] + j + 3, 0, 255) | 0},${clamp(filt[p + 1] + j, 0, 255) | 0},${clamp(filt[p + 2] + j - 3, 0, 255) | 0},${.35 + r() * .3})`;
    g.lineWidth = (2 + r() * 3.2) * k * up; g.beginPath(); g.moveTo(x * up - Math.cos(ang) * len, y * up - Math.sin(ang) * len); g.lineTo(x * up + Math.cos(ang) * len, y * up + Math.sin(ang) * len); g.stroke();
  }
  // glaze: a warm veil, then canvas weave, only where there is paint
  g.globalCompositeOperation = 'source-atop'; g.fillStyle = 'rgba(255,196,120,.07)'; g.fillRect(0, 0, res.width, res.height);
  g.fillStyle = g.createPattern(weaveTile(), 'repeat'); g.fillRect(0, 0, res.width, res.height);
  g.globalCompositeOperation = 'source-over';
  return res;
}
const _build = buildScenery;
buildScenery = function (place, scale) { return paintify(_build(place, scale), scale); };

/* a painted sky texture: soft broad strokes, laid over the live sky gradient */
const skyTex = (() => { const c = mk(W, 440), g = c.getContext('2d'), r = rng(31); g.lineCap = 'round'; for (let i = 0; i < 1400; i++) { const x = r() * W, y = r() * 440, l = 40 + r() * 110, light = r() < .5; g.strokeStyle = light ? `rgba(255,255,255,${.05 + r() * .09})` : `rgba(0,0,30,${.03 + r() * .06})`; g.lineWidth = 10 + r() * 20; g.beginPath(); g.moveTo(x, y); g.lineTo(x + l, y + (r() - .5) * 14); g.stroke(); } return c; })();
