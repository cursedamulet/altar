'use strict';
const W = 1280, H = 720, FLOOR = 640, CX = 640;
const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
const lerp = (a, b, t) => a + (b - a) * t;
const mixc = (a, b, t) => [lerp(a[0], b[0], t), lerp(a[1], b[1], t), lerp(a[2], b[2], t)];
const rgb = (c, a = 1) => `rgba(${c[0] | 0},${c[1] | 0},${c[2] | 0},${a})`;
const h2r = h => { h = h.replace('#', ''); if (h.length === 3) h = h.replace(/./g, '$&$&'); const n = parseInt(h, 16); return [n >> 16 & 255, n >> 8 & 255, n & 255]; };
const shade = (h, f) => f >= 0 ? rgb(mixc(h2r(h), [255, 255, 255], f)) : rgb(mixc(h2r(h), [0, 0, 0], -f));
const rgba = (h, a) => rgb(h2r(h), a);
function rng(seed) { let s = seed >>> 0; return () => { s = (s + 0x6D2B79F5) >>> 0; let t = s; t = Math.imul(t ^ t >>> 15, t | 1); t ^= t + Math.imul(t ^ t >>> 7, t | 61); return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }
function mk(w, h) { const c = document.createElement('canvas'); c.width = w; c.height = h; return c; }
function lg(g, x0, y0, x1, y1, stops) { const k = g.createLinearGradient(x0, y0, x1, y1); stops.forEach(([o, c]) => k.addColorStop(o, c)); return k; }
function rg(g, x, y, r0, r1, stops) { const k = g.createRadialGradient(x, y, r0, x, y, r1); stops.forEach(([o, c]) => k.addColorStop(o, c)); return k; }
function rr(g, x, y, w, h, r) { r = Math.min(r, w / 2, h / 2); g.beginPath(); g.moveTo(x + r, y); g.arcTo(x + w, y, x + w, y + h, r); g.arcTo(x + w, y + h, x, y + h, r); g.arcTo(x, y + h, x, y, r); g.arcTo(x, y, x + w, y, r); g.closePath(); }
const $ = (s, r = document) => r.querySelector(s);
function el(tag, props, ...kids) {
  const e = document.createElement(tag);
  if (props) for (const k in props) {
    if (k === 'class') e.className = props[k];
    else if (k.startsWith('on')) e.addEventListener(k.slice(2), props[k]);
    else if (k === 'style') e.style.cssText = props[k];
    else e[k] = props[k];
  }
  kids.flat().forEach(c => e.append(c));
  return e;
}
function hull(P) {
  P = P.slice().sort((a, b) => a.x - b.x || a.y - b.y);
  const cr = (o, a, b) => (a.x - o.x) * (b.y - o.y) - (a.y - o.y) * (b.x - o.x);
  const lo = []; for (const p of P) { while (lo.length >= 2 && cr(lo[lo.length - 2], lo[lo.length - 1], p) <= 0) lo.pop(); lo.push(p); }
  const up = []; for (let i = P.length - 1; i >= 0; i--) { const p = P[i]; while (up.length >= 2 && cr(up[up.length - 2], up[up.length - 1], p) <= 0) up.pop(); up.push(p); }
  up.pop(); lo.pop(); return lo.concat(up);
}

/* time of day: d = 0 (night) .. 1 (day), c = multiply tint */
function lightInfo(h) {
  const d = clamp(Math.cos((h - 13) * Math.PI / 12) * 1.5 + .25, 0, 1);
  const night = [64, 76, 140], gold = [255, 176, 128], day = [255, 250, 242];
  const c = d < .5 ? mixc(night, gold, d / .5) : mixc(gold, day, (d - .5) / .5);
  return { d, c };
}

/* images from data URLs */
const IMG = new Map();
function getImage(src) {
  if (!src) return null;
  let e = IMG.get(src);
  if (!e) { const im = new Image(); e = { im, ok: false }; im.onload = () => e.ok = true; im.src = src; IMG.set(src, e); }
  return e.ok ? e.im : null;
}
/* remove a plain background by flood fill from the borders */
const PROC = new Map();
function keyedImage(src, tol) {
  const im = getImage(src); if (!im) return null;
  if (!tol) return im;
  const k = src + '|' + tol; if (PROC.has(k)) return PROC.get(k);
  const c = mk(im.width, im.height), g = c.getContext('2d', { willReadFrequently: true });
  g.drawImage(im, 0, 0);
  const id = g.getImageData(0, 0, c.width, c.height), d = id.data, w = c.width, h = c.height;
  const px = (x, y) => (y * w + x) * 4;
  const corners = [px(0, 0), px(w - 1, 0), px(0, h - 1), px(w - 1, h - 1)];
  const bg = [0, 1, 2].map(i => corners.reduce((a, o) => a + d[o + i], 0) / 4);
  const seen = new Uint8Array(w * h), stack = [];
  const near = o => Math.hypot(d[o] - bg[0], d[o + 1] - bg[1], d[o + 2] - bg[2]);
  const push = (x, y) => { if (x < 0 || y < 0 || x >= w || y >= h) return; const i = y * w + x; if (seen[i]) return; if (near(i * 4) > tol) return; seen[i] = 1; stack.push(i); };
  for (let x = 0; x < w; x++) { push(x, 0); push(x, h - 1); }
  for (let y = 0; y < h; y++) { push(0, y); push(w - 1, y); }
  while (stack.length) { const i = stack.pop(), x = i % w, y = (i / w) | 0; d[i * 4 + 3] = 0; push(x + 1, y); push(x - 1, y); push(x, y + 1); push(x, y - 1); }
  g.putImageData(id, 0, 0);
  PROC.set(k, c); return c;
}
/* read an uploaded file, shrink it, hand back a data URL */
function readImageFile(file, maxDim, png, cb) {
  const fr = new FileReader();
  fr.onload = () => {
    const im = new Image();
    im.onload = () => {
      const k = Math.min(1, maxDim / Math.max(im.width, im.height));
      const c = mk(Math.max(1, Math.round(im.width * k)), Math.max(1, Math.round(im.height * k)));
      c.getContext('2d').drawImage(im, 0, 0, c.width, c.height);
      const keep = png || /png|webp|gif/.test(file.type);
      cb(keep ? c.toDataURL('image/png') : c.toDataURL('image/jpeg', .88), c.width, c.height);
    };
    im.src = fr.result;
  };
  fr.readAsDataURL(file);
}

/* storage */
const DB = {
  open() { return new Promise((res, rej) => { const r = indexedDB.open('altar', 1); r.onupgradeneeded = () => r.result.createObjectStore('kv'); r.onsuccess = () => res(r.result); r.onerror = () => rej(r.error); }); },
  async get(k) {
    try { const db = await this.open(); return await new Promise((res, rej) => { const q = db.transaction('kv').objectStore('kv').get(k); q.onsuccess = () => res(q.result); q.onerror = () => rej(q.error); }); }
    catch (e) { try { return JSON.parse(localStorage.getItem('altar.' + k)); } catch (_) { return null; } }
  },
  async set(k, v) {
    try { const db = await this.open(); await new Promise((res, rej) => { const tx = db.transaction('kv', 'readwrite'); tx.objectStore('kv').put(v, k); tx.oncomplete = res; tx.onerror = () => rej(tx.error); }); }
    catch (e) { try { localStorage.setItem('altar.' + k, JSON.stringify(v)); } catch (_) { } }
  }
};
