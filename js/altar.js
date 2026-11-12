'use strict';
/* ---------- materials (painted procedurally) ---------- */
const MATS = {
  marble: { name: 'White marble', base: '#ece7dd', kind: 'marble', vein: '#8a8a98' },
  rosemarble: { name: 'Rose marble', base: '#e6c8c2', kind: 'marble', vein: '#a0606a' },
  greenmarble: { name: 'Green marble', base: '#47674f', kind: 'marble', vein: '#d8e6d0' },
  darkstone: { name: 'Dark stone', base: '#3f3f48', kind: 'speckle', spk: '#74748a' },
  mossy: { name: 'Mossy stone', base: '#6e7468', kind: 'speckle', spk: '#5a9048' },
  sandstone: { name: 'Sandstone', base: '#cfae80', kind: 'speckle', spk: '#a8855a' },
  oak: { name: 'Oak wood', base: '#8a5a32', kind: 'wood', grain: '#4e2c12' },
  ebony: { name: 'Ebony wood', base: '#2c201e', kind: 'wood', grain: '#0b0606' },
  amethyst: { name: 'Amethyst crystal', base: '#8a5ac8', kind: 'crystal' },
  quartz: { name: 'Clear quartz', base: '#cfe6f0', kind: 'crystal' },
  rosequartz: { name: 'Rose quartz', base: '#f0b6c8', kind: 'crystal' },
  gold: { name: 'Gold leaf', base: '#d4a838', kind: 'metal' },
  silver: { name: 'Silver', base: '#c3c8d2', kind: 'metal' },
  copper: { name: 'Copper', base: '#b8683a', kind: 'metal' },
};
const _tex = {};
function matTex(id) {
  if (_tex[id]) return _tex[id];
  const m = MATS[id], c = mk(256, 256), g = c.getContext('2d'), r = rng(id.length * 977 + m.base.charCodeAt(2) * 13);
  g.fillStyle = m.base; g.fillRect(0, 0, 256, 256);
  for (let i = 0; i < 60; i++) { g.fillStyle = r() < .5 ? 'rgba(255,255,255,.05)' : 'rgba(0,0,0,.05)'; g.beginPath(); g.arc(r() * 256, r() * 256, 10 + r() * 40, 0, 6.3); g.fill(); }
  if (m.kind === 'marble') {
    for (let i = 0; i < 9; i++) {
      let x = r() * 256, y = r() * 256, a = r() * 6.28; g.beginPath(); g.moveTo(x, y);
      for (let k = 0; k < 44; k++) { a += (r() - .5) * .9; x += Math.cos(a) * 7; y += Math.sin(a) * 7; g.lineTo(x, y); }
      g.strokeStyle = rgba(m.vein, .22 + r() * .25); g.lineWidth = .4 + r() * 2.2; g.stroke();
    }
  } else if (m.kind === 'speckle') {
    for (let i = 0; i < 2400; i++) { g.fillStyle = r() < .5 ? rgba(m.spk, .25 + r() * .3) : 'rgba(0,0,0,.18)'; g.fillRect(r() * 256, r() * 256, 1 + r() * 3, 1 + r() * 2); }
  } else if (m.kind === 'wood') {
    for (let y = 0; y < 256; y += 2) {
      g.beginPath(); const ph = r() * 6, amp = 1 + r() * 3;
      for (let x = 0; x <= 256; x += 8) g.lineTo(x, y + Math.sin(x * .04 + ph) * amp);
      g.strokeStyle = rgba(m.grain, .08 + r() * .3); g.lineWidth = .6 + r() * 1.4; g.stroke();
    }
  } else if (m.kind === 'crystal') {
    g.fillStyle = lg(g, 0, 0, 256, 256, [[0, shade(m.base, .3)], [.5, m.base], [1, shade(m.base, -.35)]]); g.fillRect(0, 0, 256, 256);
    for (let i = 0; i < 46; i++) {
      g.beginPath(); const x = r() * 256, y = r() * 256; g.moveTo(x, y); g.lineTo(x + (r() - .5) * 120, y + (r() - .5) * 120); g.lineTo(x + (r() - .5) * 120, y + (r() - .5) * 120); g.closePath();
      g.fillStyle = r() < .5 ? 'rgba(255,255,255,.14)' : 'rgba(30,0,60,.14)'; g.fill(); g.strokeStyle = 'rgba(255,255,255,.2)'; g.lineWidth = .8; g.stroke();
    }
  } else if (m.kind === 'metal') {
    g.fillStyle = lg(g, 0, 0, 256, 0, [[0, shade(m.base, -.2)], [.2, shade(m.base, .35)], [.45, m.base], [.7, shade(m.base, .25)], [1, shade(m.base, -.25)]]); g.fillRect(0, 0, 256, 256);
    for (let i = 0; i < 1200; i++) { g.fillStyle = r() < .5 ? 'rgba(255,255,255,.08)' : 'rgba(0,0,0,.08)'; g.fillRect(r() * 256, r() * 256, 2, 1); }
  }
  return _tex[id] = c;
}

/* ---------- altar geometry (physics rectangles) ---------- */
const ALTAR_TYPES = [['table', 'Table'], ['slab', 'Stone slab'], ['tiered', 'Stepped'], ['pedestal', 'Pedestal']];
function altarTop(a) { return FLOOR - a.h; }
function altarRects(a) {
  const w = a.w, h = a.h, top = FLOOR - h, L = CX - w / 2, R = [];
  const full = a.cloth.on && a.cloth.len === 'floor';
  if (a.type === 'table') {
    const t = Math.min(22, h * .22); R.push([L, top, w, t]);
    if (full) R.push([L + 10, top + t, w - 20, h - t]); else { R.push([L + 14, top + t, 28, h - t]); R.push([L + w - 42, top + t, 28, h - t]); }
  } else if (a.type === 'slab') R.push([L, top, w, h]);
  else if (a.type === 'tiered') { const sh = h / 3; for (let i = 0; i < 3; i++) { const sw = w * (1 - i * .2); R.push([CX - sw / 2, FLOOR - sh * (i + 1), sw, sh]); } }
  else if (a.type === 'pedestal') { R.push([CX - w * .3, FLOOR - 22, w * .6, 22]); R.push([CX - w * .17, top + 26, w * .34, h - 48]); R.push([CX - w / 2, top, w, 26]); }
  return R;
}

/* ---------- drawing ---------- */
function slabFill(g, x, y, w, h, mat, r = 2) {
  g.save(); rr(g, x, y, w, h, r); g.fillStyle = g.createPattern(matTex(mat), 'repeat'); g.fill(); g.clip();
  g.fillStyle = lg(g, x, y, x + w, y, [[0, 'rgba(255,255,255,.2)'], [.3, 'rgba(255,255,255,0)'], [.8, 'rgba(0,0,0,.12)'], [1, 'rgba(0,0,0,.32)']]); g.fillRect(x, y, w, h);
  g.fillStyle = lg(g, x, y, x, y + h, [[0, 'rgba(255,255,255,.28)'], [.1, 'rgba(255,255,255,0)'], [.85, 'rgba(0,0,0,0)'], [1, 'rgba(0,0,0,.3)']]); g.fillRect(x, y, w, h);
  g.restore();
  g.strokeStyle = 'rgba(0,0,0,.4)'; g.lineWidth = 1; rr(g, x + .5, y + .5, w - 1, h - 1, r); g.stroke();
}
function clothRange(a) {
  const w = a.w, c = a.cloth, top = FLOOR - a.h;
  let x0 = CX - w / 2 - 8, x1 = CX + w / 2 + 8, t = Math.min(22, a.h * .22), yTop = top - 3, yBot;
  if (a.type === 'tiered') { const sw = w * .6; if (c.len !== 'floor') { x0 = CX - sw / 2 - 6; x1 = CX + sw / 2 + 6; } yTop = FLOOR - a.h - 3; }
  if (a.type === 'pedestal' && c.len === 'floor') { x0 = CX - w * .25; x1 = CX + w * .25; }
  if (c.len === 'top') yBot = top + 12;
  else if (c.len === 'front') yBot = top + t + Math.min(.8 * (a.h - t), a.type === 'tiered' ? a.h / 3 + 16 : 110);
  else if (c.len === 'floor') yBot = FLOOR - 3;
  else { yBot = top + Math.min(a.h * .9, 170); x0 = CX - w * .13; x1 = CX + w * .13; }
  return { x0, x1, yTop, yBot };
}
function drawCloth(g, a) {
  const c = a.cloth, { x0, x1, yTop, yBot } = clothRange(a), w = x1 - x0, folds = Math.max(3, Math.round(w / 55));
  const hy = x => yBot + Math.sin((x - x0) / w * folds * 6.283) * 4;
  g.save();
  // top lip
  g.fillStyle = shade(c.color, .12); rr(g, x0 - 2, yTop, w + 4, 9, 4); g.fill();
  g.beginPath(); g.moveTo(x0, yTop + 6); g.lineTo(x1, yTop + 6);
  for (let x = x1; x >= x0; x -= 5) g.lineTo(x, hy(x));
  g.closePath(); g.fillStyle = lg(g, 0, yTop, 0, yBot, [[0, shade(c.color, .08)], [1, shade(c.color, -.18)]]); g.fill(); g.save(); g.clip();
  for (let i = 0; i < folds * 2; i++) {
    const fx = x0 + w * (i + .5) / (folds * 2), fw = w / (folds * 2);
    g.fillStyle = lg(g, fx - fw / 2, 0, fx + fw / 2, 0, [[0, 'rgba(0,0,0,.2)'], [.5, i % 2 ? 'rgba(255,255,255,.14)' : 'rgba(255,255,255,.07)'], [1, 'rgba(0,0,0,.18)']]);
    g.fillRect(fx - fw / 2, yTop, fw, yBot - yTop + 12);
  }
  g.strokeStyle = rgba(c.trim, .75); g.fillStyle = rgba(c.trim, .5);
  if (c.pattern === 'border') { g.lineWidth = 1.6; g.beginPath(); g.moveTo(x0, yTop + 18); g.lineTo(x1, yTop + 18); g.stroke(); g.beginPath(); for (let x = x0; x <= x1; x += 4) { const y = hy(x) - 14; x === x0 ? g.moveTo(x, y) : g.lineTo(x, y); } g.stroke(); g.lineWidth = .8; g.beginPath(); for (let x = x0; x <= x1; x += 4) { const y = hy(x) - 20; x === x0 ? g.moveTo(x, y) : g.lineTo(x, y); } g.stroke(); }
  else if (c.pattern === 'stripes') { for (let x = x0 + 14; x < x1; x += 28) g.fillRect(x, yTop, 7, yBot - yTop + 12); }
  else if (c.pattern === 'lattice') { g.lineWidth = .9; for (let k = -(yBot - yTop); k < w; k += 26) { g.beginPath(); g.moveTo(x0 + k, yTop); g.lineTo(x0 + k + (yBot - yTop), yBot + 10); g.moveTo(x0 + k + (yBot - yTop), yTop); g.lineTo(x0 + k, yBot + 10); g.stroke(); } }
  else if (c.pattern === 'dots') { for (let y = yTop + 20; y < yBot; y += 22) for (let x = x0 + 12 + ((y / 22 | 0) % 2) * 11; x < x1; x += 22) { g.beginPath(); g.arc(x, y, 2.2, 0, 6.3); g.fill(); } }
  g.restore();
  g.strokeStyle = rgba(c.trim, .95); g.lineWidth = 1.2;
  if (c.fringe !== false) for (let x = x0 + 2; x < x1; x += 4) { g.beginPath(); g.moveTo(x, hy(x)); g.lineTo(x + Math.sin(x) * .8, hy(x) + 8); g.stroke(); }
  g.restore();
}
function drawInlay(g, cx, cy, r, inl) {
  if (inl.kind === 'none' || r < 14) return;
  g.save(); g.translate(cx, cy); g.strokeStyle = inl.color; g.fillStyle = rgba(inl.color, .22); g.lineWidth = 2.4; g.lineJoin = 'round'; g.shadowColor = 'rgba(0,0,0,.45)'; g.shadowBlur = 3; g.shadowOffsetY = 1;
  const n = clamp(inl.n | 0, 3, 24);
  if (inl.kind === 'star') {
    g.beginPath(); for (let i = 0; i < n * 2; i++) { const rad = (i % 2 ? inl.inner : 1) * r * .9, a = -Math.PI / 2 + i * Math.PI / n; g.lineTo(Math.cos(a) * rad, Math.sin(a) * rad); }
    g.closePath(); g.fill(); g.stroke(); g.lineWidth = 1.3; g.beginPath(); g.arc(0, 0, r, 0, 6.3); g.stroke();
  } else if (inl.kind === 'polygon') {
    for (let k = 0; k < 2; k++) { g.beginPath(); for (let i = 0; i < n; i++) { const a = -Math.PI / 2 + i * 6.283 / n + k * Math.PI / n, rad = r * (k ? .62 : .95); g.lineTo(Math.cos(a) * rad, Math.sin(a) * rad); } g.closePath(); if (!k) g.fill(); g.stroke(); }
  } else if (inl.kind === 'rings') {
    for (let i = 1; i <= 3; i++) { g.lineWidth = i === 3 ? 2.6 : 1.4; g.beginPath(); g.arc(0, 0, r * i / 3, 0, 6.3); g.stroke(); } g.beginPath(); g.arc(0, 0, 3, 0, 6.3); g.fill();
  } else if (inl.kind === 'circles') {
    g.lineWidth = 1.5; const rr_ = r / 2; g.beginPath(); g.arc(0, 0, rr_, 0, 6.3); g.stroke(); for (let i = 0; i < 6; i++) { g.beginPath(); g.arc(Math.cos(i * 1.047) * rr_, Math.sin(i * 1.047) * rr_, rr_, 0, 6.3); g.stroke(); } g.beginPath(); g.arc(0, 0, r, 0, 6.3); g.stroke();
  } else if (inl.kind === 'spiral') {
    g.beginPath(); for (let a = 0; a < 6.283 * 3.2; a += .1) { const rad = a / (6.283 * 3.2) * r; g.lineTo(Math.cos(a) * rad, Math.sin(a) * rad); } g.stroke();
  }
  g.restore();
}
function drawAltar(g, a) {
  const w = a.w, h = a.h, top = FLOOR - h, L = CX - w / 2, m = a.mat;
  // soft shadow on the ground
  g.save(); g.fillStyle = rg(g, CX, FLOOR + 6, 10, w * .62, [[0, 'rgba(0,0,0,.5)'], [1, 'rgba(0,0,0,0)']]); g.translate(0, FLOOR + 6); g.scale(1, .12); g.translate(0, -(FLOOR + 6)); g.beginPath(); g.arc(CX, FLOOR + 6, w * .62, 0, 6.3); g.fill(); g.restore();
  let face = null; // region for the inlay
  const t = Math.min(22, h * .22);
  if (a.type === 'table') {
    const full = a.cloth.on && (a.cloth.len === 'floor');
    if (!full) {
      slabFill(g, L + 14, top + t, 28, h - t, m, 3); slabFill(g, L + w - 42, top + t, 28, h - t, m, 3);
      slabFill(g, L + 8, FLOOR - 10, 40, 10, m, 2); slabFill(g, L + w - 48, FLOOR - 10, 40, 10, m, 2);
      const ah = Math.min(h - t - 6, 74); slabFill(g, L + 42, top + t, w - 84, ah, m, 2);
      face = { cx: CX, cy: top + t + ah / 2, w: w - 84, h: ah };
    }
    slabFill(g, L, top, w, t, m, 4);
    if (a.trim) { g.fillStyle = 'rgba(224,190,92,.9)'; g.fillRect(L + 1, top + t - 3, w - 2, 2); }
  } else if (a.type === 'slab') {
    slabFill(g, L, top, w, h, m, 3); g.fillStyle = 'rgba(255,255,255,.14)'; g.fillRect(L + 2, top + 2, w - 4, 8);
    if (a.trim) { g.fillStyle = 'rgba(224,190,92,.9)'; g.fillRect(L + 1, top + 12, w - 2, 2); g.fillRect(L + 1, FLOOR - 14, w - 2, 2); }
    face = { cx: CX, cy: top + 14 + (h - 14) / 2, w, h: h - 14 };
  } else if (a.type === 'tiered') {
    const sh = h / 3;
    for (let i = 0; i < 3; i++) { const sw = w * (1 - i * .2); slabFill(g, CX - sw / 2, FLOOR - sh * (i + 1), sw, sh, m, 2); if (a.trim) { g.fillStyle = 'rgba(224,190,92,.85)'; g.fillRect(CX - sw / 2 + 1, FLOOR - sh * (i + 1) + 1, sw - 2, 2); } }
    face = { cx: CX, cy: FLOOR - sh / 2, w, h: sh };
  } else if (a.type === 'pedestal') {
    slabFill(g, CX - w * .3, FLOOR - 22, w * .6, 22, m, 3); slabFill(g, CX - w * .17, top + 26, w * .34, h - 48, m, 2);
    g.strokeStyle = 'rgba(0,0,0,.2)'; g.lineWidth = 1.2; for (let i = 1; i < 6; i++) { const x = CX - w * .17 + w * .34 * i / 6; g.beginPath(); g.moveTo(x, top + 30); g.lineTo(x, FLOOR - 26); g.stroke(); }
    slabFill(g, CX - w / 2, top, w, 26, m, 4); slabFill(g, CX - w * .22, top + 26, w * .44, 8, m, 2);
    if (a.trim) { g.fillStyle = 'rgba(224,190,92,.9)'; g.fillRect(CX - w / 2 + 1, top + 22, w - 2, 2); }
    face = { cx: CX, cy: top + 26 + (h - 48) / 2, w: w * .34, h: h - 60 };
  }
  if (a.cloth.on) {
    drawCloth(g, a); const cr = clothRange(a);
    if (a.cloth.len !== 'top') face = { cx: (cr.x0 + cr.x1) / 2, cy: (top + 30 + cr.yBot - 18) / 2, w: cr.x1 - cr.x0, h: cr.yBot - 18 - top - 30 };
    else if (a.type === 'table') face = null;
  }
  if (face && a.inlay.kind !== 'none') drawInlay(g, face.cx, face.cy, Math.min(face.h * .44, face.w * .4, 110), a.inlay);
}
