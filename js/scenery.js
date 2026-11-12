'use strict';
/* Places are painted in code: saturated jewel colour, warm light, dense botanical detail.
   No figures, symbols or iconography are drawn in any place. */
const PLACES = {
  greek: { name: 'Greek temple', count: { label: 'Columns', min: 3, max: 9, def: 7 }, ambient: { wind: .25, birds: .3, drone: .15, bowl: .15 } },
  circle: { name: 'Stone circle', count: { label: 'Standing stones', min: 5, max: 13, def: 9 }, ambient: { wind: .55, birds: .3, drone: .2 } },
  beach: { name: 'Beach', count: { label: 'Palm trees', min: 0, max: 4, def: 2 }, sea: [355, 560], ambient: { waves: .6, wind: .2, birds: .15 } },
  rotunda: { name: 'Round temple by the sea', count: { label: 'Columns', min: 6, max: 16, def: 10 }, sea: [355, 520], ambient: { waves: .5, wind: .2, bowl: .2, drone: .15 } },
  jungle: { name: 'Jungle clearing', count: { label: 'Foliage density', min: 1, max: 5, def: 3 }, ambient: { birds: .5, crickets: .25, stream: .4, drone: .15 } },
  chapel: { name: 'Stone chapel', count: { label: 'Windows', min: 1, max: 5, def: 3 }, ambient: { drone: .45, bowl: .35 } },
};
const MOODS = { golden: 'sepia(.16) saturate(1.2)', verdant: 'saturate(1.35) hue-rotate(-6deg)', silvery: 'saturate(.7) brightness(1.05) hue-rotate(8deg)', rich: 'saturate(1.5) contrast(1.08)' };

function hills(g, base, amp, col, seed, freq = .006) {
  const r = rng(seed), p1 = r() * 6, p2 = r() * 6;
  g.beginPath(); g.moveTo(0, H);
  for (let x = 0; x <= W; x += 8) g.lineTo(x, base + Math.sin(x * freq + p1) * amp + Math.sin(x * freq * 2.3 + p2) * amp * .4);
  g.lineTo(W, H); g.closePath(); g.fillStyle = col; g.fill();
}
function leaves(g, x, y, rad, cols, n, r, len = 22, sq = .8) {
  for (let i = 0; i < n; i++) {
    const a = r() * 6.283, d = Math.sqrt(r()) * rad;
    g.save(); g.translate(x + Math.cos(a) * d, y + Math.sin(a) * d * sq); g.rotate(r() * 6.283);
    g.fillStyle = cols[(r() * cols.length) | 0]; g.beginPath(); g.ellipse(0, 0, len * (.4 + r() * .6), len * .26 * (.5 + r()), 0, 0, 6.283); g.fill(); g.restore();
  }
}
function blossoms(g, x, y, rad, cols, n, r, s = 3) {
  for (let i = 0; i < n; i++) {
    const a = r() * 6.283, d = Math.sqrt(r()) * rad, px = x + Math.cos(a) * d, py = y + Math.sin(a) * d * .8, c = cols[(r() * cols.length) | 0], k = s * (.6 + r() * .8);
    g.fillStyle = c; g.beginPath(); g.arc(px, py, k, 0, 6.3); g.fill(); g.fillStyle = 'rgba(255,255,255,.45)'; g.beginPath(); g.arc(px - k * .3, py - k * .3, k * .35, 0, 6.3); g.fill();
  }
}
function column(g, x, y0, y1, w) {
  const tw = w * .84, cap = 26;
  g.fillStyle = lg(g, x - w / 2, 0, x + w / 2, 0, [[0, '#f6efe0'], [.4, '#e6ddca'], [.8, '#bdb29b'], [1, '#8f8571']]);
  g.beginPath(); g.moveTo(x - tw / 2, y0 + cap); g.lineTo(x + tw / 2, y0 + cap); g.lineTo(x + w / 2, y1); g.lineTo(x - w / 2, y1); g.closePath(); g.fill();
  g.strokeStyle = 'rgba(70,60,40,.2)'; g.lineWidth = 1.2;
  for (let k = 1; k < 7; k++) { const f = k / 7; g.beginPath(); g.moveTo(x - tw / 2 + tw * f, y0 + cap); g.lineTo(x - w / 2 + w * f, y1); g.stroke(); }
  g.fillStyle = lg(g, x - tw * .7, 0, x + tw * .7, 0, [[0, '#f8f2e4'], [.6, '#d9cfba'], [1, '#9c927e']]);
  g.fillRect(x - tw * .72, y0, tw * 1.44, 12);
  g.beginPath(); g.moveTo(x - tw * .56, y0 + 12); g.lineTo(x + tw * .56, y0 + 12); g.lineTo(x + tw * .46, y0 + cap); g.lineTo(x - tw * .46, y0 + cap); g.closePath(); g.fill();
  g.fillStyle = 'rgba(0,0,0,.18)'; g.fillRect(x - tw * .72, y0 + 12, tw * 1.44, 3);
}
function stone(g, x, yb, w, h, r) {
  g.fillStyle = 'rgba(10,30,10,.35)'; g.beginPath(); g.ellipse(x + w * .2, yb, w * .75, w * .13, 0, 0, 6.3); g.fill();
  const pts = [[-.5, 0], [-.46, -.58], [-.36, -.96], [.05, -1], [.4, -.93], [.5, -.45], [.46, 0]];
  g.beginPath(); pts.forEach(([px, py], i) => { const jx = (r() - .5) * .06 * w, jy = (r() - .5) * .04 * h; i ? g.lineTo(x + px * w + jx, yb + py * h + jy) : g.moveTo(x + px * w, yb); });
  g.closePath(); g.fillStyle = lg(g, x - w / 2, 0, x + w / 2, 0, [[0, '#b2ada0'], [.45, '#8d887d'], [1, '#585550']]); g.fill(); g.save(); g.clip();
  for (let i = 0; i < 70; i++) { g.fillStyle = r() < .5 ? 'rgba(200,210,140,.35)' : 'rgba(235,215,150,.28)'; g.beginPath(); g.arc(x + (r() - .5) * w, yb - r() * h, 1 + r() * 3, 0, 6.3); g.fill(); }
  for (let i = 0; i < 5; i++) { g.strokeStyle = 'rgba(30,30,30,.25)'; g.beginPath(); const sx = x + (r() - .5) * w * .8, sy = yb - r() * h; g.moveTo(sx, sy); g.lineTo(sx + (r() - .5) * 12, sy + 14 + r() * 20); g.stroke(); }
  g.fillStyle = lg(g, 0, yb - h * .3, 0, yb, [[0, 'rgba(70,120,50,0)'], [1, 'rgba(70,120,50,.65)']]); g.fillRect(x - w, yb - h * .3, w * 2, h * .3);
  g.restore();
}
function fern(g, x, y, len, ang, cols, r) {
  const cx = x + Math.cos(ang) * len * .5, cy = y - len * .8, ex = x + Math.cos(ang) * len, ey = y - len * .25 + Math.abs(Math.sin(ang)) * len * .3;
  g.strokeStyle = cols[0]; g.lineWidth = 2.5; g.beginPath(); g.moveTo(x, y); g.quadraticCurveTo(cx, cy, ex, ey); g.stroke();
  for (let i = 1; i < 26; i++) {
    const u = i / 26, px = (1 - u) * (1 - u) * x + 2 * u * (1 - u) * cx + u * u * ex, py = (1 - u) * (1 - u) * y + 2 * u * (1 - u) * cy + u * u * ey;
    const tx = 2 * (1 - u) * (cx - x) + 2 * u * (ex - cx), ty = 2 * (1 - u) * (cy - y) + 2 * u * (ey - cy), ta = Math.atan2(ty, tx), l = (1 - u * .7) * len * .22;
    for (const s of [-1, 1]) { g.fillStyle = cols[1 + ((r() * (cols.length - 1)) | 0)]; g.beginPath(); g.ellipse(px + Math.cos(ta + s * 1.3) * l * .5, py + Math.sin(ta + s * 1.3) * l * .5, l * .55, l * .13, ta + s * 1.1, 0, 6.3); g.fill(); }
  }
}
function palm(g, x, yb, dir, r) {
  const tx = x + dir * 70, ty = 300;
  for (let i = 0; i < 40; i++) {
    const u = i / 40, px = (1 - u) * (1 - u) * x + 2 * u * (1 - u) * (x - dir * 20) + u * u * tx, py = (1 - u) * (1 - u) * yb + 2 * u * (1 - u) * (yb - 160) + u * u * ty;
    g.fillStyle = lg(g, px - 9, 0, px + 9, 0, [[0, '#8a6a46'], [1, '#4c3622']]); g.beginPath(); g.ellipse(px, py, 11 - u * 4, 7, 0, 0, 6.3); g.fill();
    g.strokeStyle = 'rgba(40,25,10,.35)'; g.beginPath(); g.moveTo(px - 9, py); g.lineTo(px + 9, py + 2); g.stroke();
  }
  for (let f = 0; f < 11; f++) {
    const a = -Math.PI + f * Math.PI / 10 + (r() - .5) * .2, L = 150 + r() * 50, ex = tx + Math.cos(a) * L, ey = ty + Math.sin(a) * L * .45 + 90;
    const cx = tx + Math.cos(a) * L * .5, cy = ty - 70 - Math.abs(Math.sin(a)) * 40;
    g.strokeStyle = '#2f6a2c'; g.lineWidth = 2.5; g.beginPath(); g.moveTo(tx, ty); g.quadraticCurveTo(cx, cy, ex, ey); g.stroke();
    for (let i = 2; i < 30; i++) {
      const u = i / 30, px = (1 - u) * (1 - u) * tx + 2 * u * (1 - u) * cx + u * u * ex, py = (1 - u) * (1 - u) * ty + 2 * u * (1 - u) * cy + u * u * ey, l = 30 * (1 - u * .5);
      g.strokeStyle = r() < .5 ? '#3b8a38' : '#5aa244'; g.lineWidth = 2; g.beginPath(); g.moveTo(px, py); g.lineTo(px + (r() < .5 ? -1 : 1) * 6, py + l); g.stroke();
    }
  }
  g.fillStyle = '#6a4a2a'; for (let i = 0; i < 4; i++) { g.beginPath(); g.arc(tx - 8 + i * 6, ty + 8, 7, 0, 6.3); g.fill(); }
}
function beachBase(g, o, palms) {
  const r = rng(55), hz = 355;
  g.fillStyle = lg(g, 0, hz, 0, 560, [[0, '#2c6a9c'], [.5, '#2f9ca8'], [1, '#55c4b2']]); g.fillRect(0, hz, W, 220);
  g.fillStyle = '#6b86b4'; g.beginPath(); g.moveTo(0, hz); g.quadraticCurveTo(120, hz - 40, 330, hz - 6); g.lineTo(330, hz + 2); g.lineTo(0, hz + 2); g.fill();
  g.fillStyle = '#7f98c0'; g.beginPath(); g.moveTo(980, hz); g.quadraticCurveTo(1100, hz - 22, 1280, hz - 10); g.lineTo(1280, hz + 2); g.lineTo(980, hz + 2); g.fill();
  for (let c = 0; c < 6; c++) { const cx = r() * W, cy = 70 + r() * 150; for (let i = 0; i < 14; i++) { g.fillStyle = `rgba(255,248,240,${.12 + r() * .12})`; g.beginPath(); g.ellipse(cx + (r() - .5) * 150, cy + (r() - .5) * 26, 40 + r() * 60, 12 + r() * 18, 0, 0, 6.3); g.fill(); } }
  g.beginPath(); g.moveTo(0, H); for (let x = 0; x <= W; x += 10) g.lineTo(x, 560 + Math.sin(x * .004 + 1) * 14 + Math.sin(x * .013) * 4); g.lineTo(W, H); g.closePath();
  g.fillStyle = lg(g, 0, 545, 0, 720, [[0, '#f4e6bd'], [.4, '#e3c995'], [1, '#c9a870']]); g.fill();
  g.strokeStyle = 'rgba(150,120,80,.28)'; g.lineWidth = 16; g.beginPath(); for (let x = 0; x <= W; x += 10) g.lineTo(x, 574 + Math.sin(x * .004 + 1) * 14); g.stroke();
  for (let i = 0; i < 160; i++) { g.fillStyle = r() < .5 ? 'rgba(120,90,60,.35)' : 'rgba(255,250,235,.5)'; g.beginPath(); g.ellipse(r() * W, 600 + r() * 120, 1 + r() * 3, 1 + r() * 1.5, 0, 0, 6.3); g.fill(); }
  const pos = [90, 1190, 230, 1050];
  for (let i = 0; i < palms; i++) palm(g, pos[i], 640 + (i > 1 ? -25 : 0), pos[i] < 640 ? 1 : -1, r);
}
function tholos(g, o) {
  const r = rng(77), n = o.count, cy = 592, rx = 560, ry = 82;
  g.fillStyle = 'rgba(0,0,0,.2)'; g.beginPath(); g.ellipse(CX, cy + 16, rx + 40, ry + 18, 0, 0, 6.3); g.fill();
  g.fillStyle = lg(g, 0, cy - ry, 0, cy + ry, [[0, '#cfc4ad'], [1, '#e9e0cc']]); g.beginPath(); g.ellipse(CX, cy + 6, rx + 24, ry + 10, 0, 0, 6.3); g.fill();
  g.fillStyle = lg(g, 0, cy - ry, 0, cy + ry, [[0, '#d9cfba'], [1, '#f4ecda']]); g.beginPath(); g.ellipse(CX, cy, rx, ry, 0, 0, 6.3); g.fill();
  g.strokeStyle = 'rgba(120,100,70,.2)'; g.lineWidth = 1; for (let k = 1; k < 6; k++) { g.beginPath(); g.ellipse(CX, cy, rx * k / 6, ry * k / 6, 0, 0, 6.3); g.stroke(); }
  const cols = []; for (let i = 0; i < n; i++) { const th = Math.PI * (.05 + .9 * (n === 1 ? .5 : i / (n - 1))); cols.push({ x: CX + Math.cos(th) * rx * .96, yb: cy - Math.sin(th) * ry * .9, s: 1 - .26 * Math.sin(th) }); }
  cols.sort((a, b) => a.yb - b.yb);
  const ent = c => ({ x: c.x, y: c.yb - 400 * c.s });
  const ordered = cols.slice().sort((a, b) => a.x - b.x);
  g.fillStyle = '#e9e0cc';
  for (let i = 0; i < ordered.length - 1; i++) {
    const a = ent(ordered[i]), b = ent(ordered[i + 1]), th = 36 * ordered[i].s;
    g.beginPath(); g.moveTo(a.x, a.y - th); g.lineTo(b.x, b.y - th); g.lineTo(b.x, b.y + 4); g.lineTo(a.x, a.y + 4); g.closePath();
    g.fillStyle = lg(g, 0, a.y - th, 0, a.y + 4, [[0, '#f6efdf'], [.6, '#e0d6c0'], [1, '#b9ae97']]); g.fill();
    g.strokeStyle = 'rgba(80,70,50,.25)'; g.stroke();
  }
  cols.forEach(c => { column(g, c.x, c.yb - 400 * c.s, c.yb, 54 * c.s); });
  const L = ent(ordered[0]), R = ent(ordered[ordered.length - 1]);
  g.fillStyle = '#d9cfba'; g.fillRect(L.x - 36, L.y - 44, 72, 8); g.fillRect(R.x - 36, R.y - 44, 72, 8);
}
function chapelWindow(g, x, top, w, h, r) {
  const pal = ['#8e1f45', '#1f4f9a', '#e0a82e', '#2f8a52', '#6a2f9a', '#c8581e'];
  g.save(); g.beginPath(); g.moveTo(x - w / 2, top + h); g.lineTo(x - w / 2, top + w * .6); g.quadraticCurveTo(x - w / 2, top + 6, x, top); g.quadraticCurveTo(x + w / 2, top + 6, x + w / 2, top + w * .6); g.lineTo(x + w / 2, top + h); g.closePath(); g.clip();
  g.fillStyle = '#1a1410'; g.fillRect(x - w / 2, top, w, h);
  const cw = w / 4, ch = h / 9;
  for (let j = 0; j < 9; j++) for (let i = 0; i < 4; i++) { g.fillStyle = pal[(r() * pal.length) | 0]; g.fillRect(x - w / 2 + i * cw + 1.5, top + j * ch + 1.5, cw - 3, ch - 3); g.fillStyle = 'rgba(255,240,200,.18)'; g.fillRect(x - w / 2 + i * cw + 3, top + j * ch + 3, cw * .4, ch * .4); }
  g.restore();
  g.strokeStyle = '#cfc6b4'; g.lineWidth = 9; g.beginPath(); g.moveTo(x - w / 2, top + h); g.lineTo(x - w / 2, top + w * .6); g.quadraticCurveTo(x - w / 2, top + 6, x, top); g.quadraticCurveTo(x + w / 2, top + 6, x + w / 2, top + w * .6); g.lineTo(x + w / 2, top + h); g.stroke();
}

const BUILD = {
  greek(g, o) {
    const r = rng(11), hz = 380;
    g.fillStyle = lg(g, 0, hz - 10, 0, hz + 100, [[0, '#7fb6d2'], [1, '#2f6f96']]); g.fillRect(0, hz - 8, W, 120);
    hills(g, hz - 4, 10, '#8aa0c4', 5, .004); hills(g, 462, 26, '#7ea66a', 21, .006); hills(g, 500, 22, '#5f8e52', 22, .008); hills(g, 535, 14, '#4a7c44', 23, .01);
    for (let i = 0; i < 9; i++) { const x = 60 + r() * 1160, y = 505 + r() * 30; g.strokeStyle = '#4a3a28'; g.lineWidth = 4; g.beginPath(); g.moveTo(x, y + 20); g.quadraticCurveTo(x - 4, y, x + 3, y - 14); g.stroke(); leaves(g, x, y - 20, 26, ['#8ca67c', '#aebe94', '#6f8a64'], 70, r, 12); }
    for (const x of [48, 1232]) { g.fillStyle = lg(g, x - 28, 0, x + 28, 0, [[0, '#244a2a'], [.6, '#1b3a20'], [1, '#12281a']]); g.beginPath(); g.ellipse(x, 420, 28, 150, 0, 0, 6.3); g.fill(); leaves(g, x, 420, 26, ['#2f5f36', '#3a7240', '#1f4526'], 150, r, 14, 5); }
    const n = o.count, x0 = 150, x1 = 1130, base = 585, top = 150;
    g.fillStyle = lg(g, 0, 90, 0, 152, [[0, '#f1e9d8'], [1, '#cfc3ab']]); g.fillRect(50, 100, W - 100, 52);
    g.fillStyle = '#e6dcc7'; g.fillRect(50, 60, W - 100, 40);
    const xs = []; for (let i = 0; i < n; i++) xs.push(n === 1 ? CX : x0 + (x1 - x0) * i / (n - 1));
    const tri = x => { g.fillStyle = '#a89c82'; for (let k = -1; k <= 1; k++) g.fillRect(x + k * 8 - 2, 62, 4, 36); g.fillStyle = 'rgba(0,0,0,.12)'; g.fillRect(x - 14, 62, 28, 36); };
    xs.forEach(x => tri(x)); for (let i = 0; i < n - 1; i++) tri((xs[i] + xs[i + 1]) / 2);
    g.fillStyle = '#f5eee0'; g.fillRect(34, 38, W - 68, 24); g.fillStyle = 'rgba(0,0,0,.2)'; g.fillRect(34, 60, W - 68, 3);
    g.fillStyle = 'rgba(0,0,0,.14)'; g.fillRect(50, 100, W - 100, 4);
    g.fillStyle = lg(g, 0, base, 0, H, [[0, '#efe6d3'], [1, '#c9b99b']]); g.fillRect(0, base, W, H - base);
    xs.forEach(x => column(g, x, top, base, 68));
    g.strokeStyle = 'rgba(100,85,60,.2)'; g.lineWidth = 1;
    for (let k = -9; k <= 9; k++) { g.beginPath(); g.moveTo(CX + k * 70, base); g.lineTo(CX + k * 190, H); g.stroke(); }
    for (let i = 1; i < 6; i++) { g.beginPath(); g.moveTo(0, base + Math.pow(i / 5, 1.7) * 135); g.lineTo(W, base + Math.pow(i / 5, 1.7) * 135); g.stroke(); }
    g.fillStyle = 'rgba(80,60,40,.25)'; g.fillRect(0, base - 2, W, 4);
    for (const x of [xs[0], xs[n - 1]]) { leaves(g, x, base + 6, 54, ['#3f7a3c', '#2f6a30', '#5a9a48', '#27552a'], 120, r, 18); blossoms(g, x, base, 46, ['#d9456f', '#f08aa8', '#f4c0d0', '#fff3f6'], 26, r, 4); }
    leaves(g, 30, 650, 70, ['#3f7a3c', '#2f6a30', '#5a9a48'], 130, r, 22); blossoms(g, 30, 640, 60, ['#d9456f', '#f08aa8', '#fff3f6'], 32, r, 5);
    leaves(g, 1250, 650, 70, ['#3f7a3c', '#2f6a30', '#5a9a48'], 130, r, 22); blossoms(g, 1250, 640, 60, ['#d9456f', '#f08aa8', '#fff3f6'], 32, r, 5);
  },
  circle(g, o) {
    const r = rng(31);
    hills(g, 372, 30, '#8dbb70', 3, .005); hills(g, 425, 26, '#62a050', 4, .006); hills(g, 478, 18, '#468438', 5, .008);
    g.fillStyle = lg(g, 0, 480, 0, H, [[0, '#4e8c3a'], [1, '#2a6228']]); g.fillRect(0, 500, W, H - 500);
    for (let i = 0; i < 3600; i++) { const y = 500 + Math.pow(r(), .8) * 220, x = r() * W, l = 4 + (y - 500) / 14; g.strokeStyle = ['#3c7a30', '#5aa043', '#74b552', '#2d6a2a'][(r() * 4) | 0]; g.lineWidth = 1 + (y - 500) / 120; g.beginPath(); g.moveTo(x, y); g.lineTo(x + (r() - .5) * 6, y - l); g.stroke(); }
    const stones = [];
    const n = o.count;
    for (let i = 0; i < n; i++) { const th = (i + .5) / n * 6.283, s = Math.sin(th); if (s > .4) continue; if (s < 0 && Math.abs(Math.cos(th)) < .42) continue; stones.push({ x: CX + Math.cos(th) * 500, yb: 500 + (s + 1) / 2 * 120 }); }
    stones.push({ x: 556, yb: 506, tri: 1 }, { x: 724, yb: 506, tri: 1 });
    stones.sort((a, b) => a.yb - b.yb);
    stones.forEach(s => { const k = .62 + (s.yb - 500) / 120 * .5, w = (s.tri ? 70 : 62 + r() * 24) * k, h = (s.tri ? 235 : 140 + r() * 80) * k; stone(g, s.x, s.yb, w, h, r); });
    // lintel
    const lt = 506 - 235 * .62 * 1.0 - 4; g.save(); g.fillStyle = lg(g, 0, lt - 22, 0, lt + 10, [[0, '#a8a398'], [1, '#6a665e']]); g.beginPath(); g.moveTo(520, lt + 6); g.lineTo(524, lt - 20); g.lineTo(760, lt - 22); g.lineTo(762, lt + 4); g.closePath(); g.fill(); g.restore();
    for (let i = 0; i < 360; i++) { const y = 560 + r() * 160, x = r() * W; g.fillStyle = ['#fff6a8', '#fff', '#f08ab0', '#8ab4f0', '#f4b84a'][(r() * 5) | 0]; g.beginPath(); g.arc(x, y, 1.4 + (y - 560) / 70, 0, 6.3); g.fill(); }
  },
  beach(g, o) { beachBase(g, o, o.count); },
  rotunda(g, o) { beachBase(g, o, 0); tholos(g, o); },
  jungle(g, o) {
    const r = rng(91), d = o.count;
    g.fillStyle = lg(g, 0, 0, 0, H, [[0, '#cfe9b0'], [.22, '#5f9d52'], [.6, '#1f5a30'], [1, '#10301a']]); g.fillRect(0, 0, W, H);
    g.fillStyle = rg(g, 640, 0, 10, 520, [[0, 'rgba(255,252,210,.95)'], [1, 'rgba(255,252,210,0)']]); g.fillRect(0, 0, W, 520);
    const nt = 4 + d * 2;
    for (let i = 0; i < nt; i++) {
      const x = (i + .5) / nt * W + (r() - .5) * 60, w = 24 + r() * 44, sh = .55 + r() * .45;
      g.fillStyle = lg(g, x - w / 2, 0, x + w / 2, 0, [[0, `rgb(${70 * sh | 0},${52 * sh | 0},${34 * sh | 0})`], [.5, `rgb(${46 * sh | 0},${34 * sh | 0},${22 * sh | 0})`], [1, `rgb(${24 * sh | 0},${18 * sh | 0},${12 * sh | 0})`]]);
      g.beginPath(); g.moveTo(x - w * .5, 0); g.quadraticCurveTo(x - w * .4, 300, x - w * .75, 640); g.lineTo(x + w * .75, 640); g.quadraticCurveTo(x + w * .4, 300, x + w * .5, 0); g.fill();
      for (let k = 0; k < 18; k++) { g.fillStyle = `rgba(80,150,60,${.25 + r() * .3})`; g.beginPath(); g.ellipse(x + (r() - .5) * w, r() * 560, 3 + r() * 6, 8 + r() * 14, 0, 0, 6.3); g.fill(); }
    }
    for (let i = 0; i < 6 + d * 3; i++) { const x = r() * W, l = 120 + r() * 260; g.strokeStyle = '#1d4a22'; g.lineWidth = 2 + r() * 2; g.beginPath(); g.moveTo(x, 0); g.bezierCurveTo(x + 30, l * .4, x - 30, l * .7, x + (r() - .5) * 40, l); g.stroke(); leaves(g, x, l * .6, l * .4, ['#2f7a38', '#3f9a44'], 14, r, 14, 3); }
    for (let c = 0; c < 8 + d * 4; c++) leaves(g, r() * W, r() * 150, 90, ['#2f7a38', '#3f9a44', '#1f5a2c', '#56b050', '#8bd070'], 90, r, 34);
    g.fillStyle = lg(g, 0, 585, 0, H, [[0, '#3a4a24'], [1, '#18240f']]); g.fillRect(0, 585, W, H - 585);
    for (let i = 0; i < 400; i++) { g.fillStyle = r() < .5 ? 'rgba(120,80,30,.4)' : 'rgba(60,110,40,.4)'; g.beginPath(); g.ellipse(r() * W, 590 + r() * 130, 4 + r() * 12, 2 + r() * 4, r() * 3, 0, 6.3); g.fill(); }
    for (let i = 0; i < 6 + d; i++) { const x = i % 2 ? 1280 - r() * 260 : r() * 260; fern(g, x, 700, 220 + r() * 140, (x < 640 ? 1 : -1) * (.5 + r() * .6), ['#1d4a22', '#2f7a38', '#3f9a44', '#56b050'], r); }
    blossoms(g, 120, 640, 80, ['#e0391f', '#ff7a2a', '#f4c030', '#e0438a'], 40, r, 6); blossoms(g, 1160, 650, 90, ['#e0391f', '#ff7a2a', '#f4c030', '#e0438a'], 40, r, 6);
    g.save(); g.globalCompositeOperation = 'lighter';
    for (let i = 0; i < 4; i++) { const x = 220 + i * 260 + r() * 80; g.fillStyle = lg(g, x, 0, x + 140, 560, [[0, 'rgba(255,245,170,.20)'], [1, 'rgba(255,245,170,0)']]); g.beginPath(); g.moveTo(x, 0); g.lineTo(x + 70, 0); g.lineTo(x + 230, 580); g.lineTo(x + 110, 580); g.closePath(); g.fill(); }
    g.restore();
  },
  chapel(g, o) {
    const r = rng(101), n = o.count;
    g.fillStyle = lg(g, 0, 0, 0, 600, [[0, '#4a4238'], [.5, '#8b8070'], [1, '#6e6458']]); g.fillRect(0, 0, W, H);
    for (let y = 0, row = 0; y < 590; y += 38, row++) for (let x = -(row % 2) * 45; x < W; x += 90) { g.fillStyle = r() < .5 ? 'rgba(255,255,255,.04)' : 'rgba(0,0,0,.05)'; g.fillRect(x, y, 90, 38); g.strokeStyle = 'rgba(0,0,0,.16)'; g.strokeRect(x, y, 90, 38); }
    g.fillStyle = lg(g, 0, 585, 0, H, [[0, '#7d7366'], [1, '#463d34']]); g.fillRect(0, 585, W, H - 585);
    g.strokeStyle = 'rgba(0,0,0,.28)'; g.lineWidth = 1; for (let k = -10; k <= 10; k++) { g.beginPath(); g.moveTo(CX + k * 40, 585); g.lineTo(CX + k * 150, H); g.stroke(); }
    for (let i = 1; i < 6; i++) { const y = 585 + Math.pow(i / 5, 1.7) * 135; g.beginPath(); g.moveTo(0, y); g.lineTo(W, y); g.stroke(); }
    g.fillStyle = '#6b1d2e'; g.beginPath(); g.moveTo(500, 585); g.lineTo(780, 585); g.lineTo(920, H); g.lineTo(360, H); g.closePath(); g.fill();
    g.strokeStyle = '#d9b24c'; g.lineWidth = 3; g.beginPath(); g.moveTo(512, 585); g.lineTo(380, H); g.moveTo(768, 585); g.lineTo(900, H); g.stroke();
    const xs = []; for (let i = 0; i < n; i++) xs.push(n === 1 ? CX : 250 + (780) * i / (n - 1));
    const ww = n >= 4 ? 80 : 96, wt = 205;
    xs.forEach(x => chapelWindow(g, x, wt, ww, 280, r));
    if (n >= 3) {
      g.save(); g.beginPath(); g.arc(CX, 100, 72, 0, 6.3); g.clip(); const pal = ['#8e1f45', '#1f4f9a', '#e0a82e', '#2f8a52', '#6a2f9a', '#c8581e'];
      for (let i = 0; i < 12; i++) { g.fillStyle = pal[i % 6]; g.beginPath(); g.moveTo(CX, 100); g.arc(CX, 100, 80, i * Math.PI / 6, (i + 1) * Math.PI / 6); g.fill(); g.fillStyle = pal[(i + 3) % 6]; g.beginPath(); g.moveTo(CX, 100); g.arc(CX, 100, 38, i * Math.PI / 6, (i + 1) * Math.PI / 6); g.fill(); }
      g.strokeStyle = '#1a1410'; g.lineWidth = 3; for (let i = 0; i < 12; i++) { g.beginPath(); g.moveTo(CX, 100); g.lineTo(CX + Math.cos(i * Math.PI / 6) * 80, 100 + Math.sin(i * Math.PI / 6) * 80); g.stroke(); } g.beginPath(); g.arc(CX, 100, 38, 0, 6.3); g.stroke();
      g.fillStyle = '#e0b84a'; g.beginPath(); g.arc(CX, 100, 12, 0, 6.3); g.fill(); g.restore();
      g.strokeStyle = '#cfc6b4'; g.lineWidth = 9; g.beginPath(); g.arc(CX, 100, 72, 0, 6.3); g.stroke();
    }
    g.save(); g.globalCompositeOperation = 'lighter';
    xs.forEach((x, i) => { const c = [[255, 80, 120], [90, 140, 255], [255, 200, 80], [90, 230, 150]][i % 4]; g.fillStyle = lg(g, x, 480, x + 60, 700, [[0, rgb(c, .16)], [1, rgb(c, 0)]]); g.beginPath(); g.moveTo(x - ww / 2, 480); g.lineTo(x + ww / 2, 480); g.lineTo(x + ww / 2 + 160, 700); g.lineTo(x - ww / 2 + 100, 700); g.closePath(); g.fill(); });
    g.restore();
    for (const x of [70, 1210]) {
      column(g, x, 120, 600, 70); g.strokeStyle = '#b8ae9a'; g.lineWidth = 12; g.beginPath(); g.moveTo(x + (x < 640 ? 30 : -30), 125); g.quadraticCurveTo(x + (x < 640 ? 160 : -160), -50, x + (x < 640 ? 360 : -360), 40); g.stroke();
    }
  },
};
function buildScenery(place, scale) {
  const c = mk(W * scale, H * scale), g = c.getContext('2d'); g.scale(scale, scale);
  const tmp = mk(W * scale, H * scale), tg = tmp.getContext('2d'); tg.scale(scale, scale);
  BUILD[place.id](tg, place);
  g.filter = MOODS[place.mood] || 'none'; g.drawImage(tmp, 0, 0, W, H); g.filter = 'none';
  return c;
}

/* animated parts that sit on the cached scenery */
function dynamicScenery(g, place, t) {
  const sea = PLACES[place.id].sea;
  if (sea) {
    const [y0, y1] = sea;
    for (let i = 0; i < 16; i++) {
      const u = i / 15, y = y0 + (y1 - y0) * Math.pow(u, 1.6), amp = 1 + u * 5;
      g.strokeStyle = `rgba(255,255,255,${.08 + u * .22})`; g.lineWidth = .8 + u * 2.4; g.beginPath();
      for (let x = 0; x <= W; x += 12) { const yy = y + Math.sin(x * .012 * (1 - u * .5) + t * (.6 + u * .5) + i * 1.7) * amp; x ? g.lineTo(x, yy) : g.moveTo(x, yy); }
      g.stroke();
    }
    const fy = y1 + 12 + Math.sin(t * .5) * 8;
    g.fillStyle = lg(g, 0, fy - 14, 0, fy + 12, [[0, 'rgba(255,255,255,0)'], [.5, 'rgba(255,255,255,.55)'], [1, 'rgba(255,255,255,0)']]);
    g.beginPath(); g.moveTo(0, fy - 14); for (let x = 0; x <= W; x += 12) g.lineTo(x, fy - 14 + Math.sin(x * .02 + t) * 4); g.lineTo(W, fy + 12); g.lineTo(0, fy + 12); g.fill();
    for (let i = 0; i < 40; i++) { const x = (i * 97.3) % W, y = y0 + 6 + ((i * 53.1) % (y1 - y0 - 20)), a = Math.max(0, Math.sin(t * 2.4 + i * 3.1)); g.fillStyle = `rgba(255,255,255,${a * .5})`; g.fillRect(x, y, 6 + (y - y0) / 20, 1.3); }
  }
}

/* ---------- backdrop: tapestry or painting, filled by the user's own image ---------- */
function drawBackdrop(g, b, t) {
  if (b.kind === 'none') return;
  const w = b.w, h = b.h, x = CX - w / 2, y = 62, img = getImage(b.src);
  if (b.kind === 'tapestry') {
    g.fillStyle = lg(g, 0, y - 14, 0, y, [[0, '#e6c26a'], [1, '#7a5a1e']]); rr(g, x - 16, y - 12, w + 32, 12, 6); g.fill();
    g.fillStyle = '#d9b24c'; for (const sx of [x - 20, x + w + 20]) { g.beginPath(); g.arc(sx, y - 6, 9, 0, 6.3); g.fill(); }
    g.save(); g.shadowColor = 'rgba(0,0,0,.45)'; g.shadowBlur = 14; g.shadowOffsetY = 6; g.fillStyle = b.color; g.fillRect(x, y, w, h); g.restore();
    g.fillStyle = lg(g, x, 0, x + w, 0, [[0, 'rgba(255,255,255,.1)'], [.5, 'rgba(0,0,0,0)'], [1, 'rgba(0,0,0,.28)']]); g.fillRect(x, y, w, h);
    const bd = 20; g.fillStyle = shade(b.color, -.25); g.fillRect(x, y, w, bd); g.fillRect(x, y + h - bd, w, bd); g.fillRect(x, y, bd, h); g.fillRect(x + w - bd, y, bd, h);
    g.fillStyle = '#d9b24c'; for (let i = 0; i < w / 22; i++) { for (const yy of [y + bd / 2, y + h - bd / 2]) { g.save(); g.translate(x + 12 + i * 22, yy); g.rotate(.785); g.fillRect(-3, -3, 6, 6); g.restore(); } }
    for (let i = 0; i < h / 22; i++) for (const xx of [x + bd / 2, x + w - bd / 2]) { g.save(); g.translate(xx, y + 12 + i * 22); g.rotate(.785); g.fillRect(-3, -3, 6, 6); g.restore(); }
    g.strokeStyle = '#d9b24c'; g.lineWidth = 2; g.strokeRect(x + bd, y + bd, w - bd * 2, h - bd * 2);
    const ix = x + bd + 8, iy = y + bd + 8, iw = w - bd * 2 - 16, ih = h - bd * 2 - 16;
    g.save(); g.beginPath(); g.rect(ix, iy, iw, ih); g.clip();
    if (img) { const k = Math.max(iw / img.width, ih / img.height); g.drawImage(img, ix + (iw - img.width * k) / 2, iy + (ih - img.height * k) / 2, img.width * k, img.height * k); }
    else {
      g.fillStyle = shade(b.color, -.08); g.fillRect(ix, iy, iw, ih); g.strokeStyle = 'rgba(217,178,76,.55)'; g.fillStyle = 'rgba(217,178,76,.4)'; g.lineWidth = 1.2;
      if (b.pattern === 'lattice') for (let k = -ih; k < iw; k += 30) { g.beginPath(); g.moveTo(ix + k, iy); g.lineTo(ix + k + ih, iy + ih); g.moveTo(ix + k + ih, iy); g.lineTo(ix + k, iy + ih); g.stroke(); }
      else if (b.pattern === 'stripes') for (let k = 0; k < iw; k += 26) g.fillRect(ix + k, iy, 8, ih);
      else if (b.pattern === 'scales') for (let yy = 0; yy < ih + 20; yy += 16) for (let xx = (yy / 16 % 2) * 14; xx < iw + 28; xx += 28) { g.beginPath(); g.arc(ix + xx, iy + yy, 14, 0, Math.PI); g.stroke(); }
    }
    g.fillStyle = 'rgba(0,0,0,.07)'; for (let yy = iy; yy < iy + ih; yy += 3) g.fillRect(ix, yy, iw, 1);
    g.fillStyle = lg(g, 0, iy, 0, iy + ih, [[0, 'rgba(0,0,0,.28)'], [.08, 'rgba(0,0,0,0)'], [.92, 'rgba(0,0,0,0)'], [1, 'rgba(0,0,0,.25)']]); g.fillRect(ix, iy, iw, ih);
    g.restore();
    g.strokeStyle = '#d9b24c'; g.lineWidth = 1.6; for (let xx = x + 4; xx < x + w; xx += 6) { g.beginPath(); g.moveTo(xx, y + h); g.lineTo(xx + Math.sin(xx) * .8, y + h + 12); g.stroke(); }
  } else {
    const m = 20;
    g.save(); g.shadowColor = 'rgba(0,0,0,.5)'; g.shadowBlur = 16; g.shadowOffsetY = 7;
    g.fillStyle = lg(g, x, y, x + w, y + h, [[0, '#f0cf6a'], [.4, '#a8791f'], [.7, '#e8c25a'], [1, '#7a5418']]); g.fillRect(x - m, y - m, w + m * 2, h + m * 2); g.restore();
    g.strokeStyle = 'rgba(60,35,5,.55)'; g.lineWidth = 2; g.strokeRect(x - m + 4, y - m + 4, w + m * 2 - 8, h + m * 2 - 8); g.strokeRect(x - 5, y - 5, w + 10, h + 10);
    g.fillStyle = '#f6dc84'; for (const [cx, cy] of [[x - m, y - m], [x + w + m, y - m], [x - m, y + h + m], [x + w + m, y + h + m]]) { g.beginPath(); g.arc(cx, cy, 12, 0, 6.3); g.fill(); g.strokeStyle = 'rgba(60,35,5,.6)'; g.stroke(); g.fillStyle = '#a8791f'; g.beginPath(); g.arc(cx, cy, 5, 0, 6.3); g.fill(); g.fillStyle = '#f6dc84'; }
    g.fillStyle = '#17110e'; g.fillRect(x - 4, y - 4, w + 8, h + 8);
    g.save(); g.beginPath(); g.rect(x, y, w, h); g.clip();
    if (img) { const k = Math.max(w / img.width, h / img.height); g.drawImage(img, x + (w - img.width * k) / 2, y + (h - img.height * k) / 2, img.width * k, img.height * k); }
    else { g.fillStyle = lg(g, x, y, x + w, y + h, [[0, '#4a3b34'], [1, '#2a201c']]); g.fillRect(x, y, w, h); }
    g.fillStyle = rg(g, x + w / 2, y + h / 2, h * .3, h * .8, [[0, 'rgba(0,0,0,0)'], [1, 'rgba(0,0,0,.4)']]); g.fillRect(x, y, w, h);
    g.restore();
    g.strokeStyle = '#7a5a1e'; g.lineWidth = 1.5; g.beginPath(); g.moveTo(x + w * .2, y - m); g.lineTo(CX, y - m - 36); g.lineTo(x + w * .8, y - m); g.stroke();
  }
}
