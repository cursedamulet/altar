'use strict';
/* Sigil workshop: chaos method (Spare), freehand drawing, or upload.
   Nothing is generated for the user: every mark comes from their own intent or hand. */
const GLYPH = {
  A: [[[0, 1], [.5, 0], [1, 1]], [[.2, .62], [.8, .62]]], B: [[[0, 0], [0, 1]], [[0, 0], [.7, 0], [.9, .15], [.9, .35], [.7, .5], [0, .5]], [[.7, .5], [1, .65], [1, .85], [.75, 1], [0, 1]]],
  C: [[[1, .15], [.7, 0], [.3, 0], [0, .25], [0, .75], [.3, 1], [.7, 1], [1, .85]]], D: [[[0, 0], [0, 1]], [[0, 0], [.6, 0], [1, .3], [1, .7], [.6, 1], [0, 1]]],
  E: [[[1, 0], [0, 0], [0, 1], [1, 1]], [[0, .5], [.7, .5]]], F: [[[1, 0], [0, 0], [0, 1]], [[0, .5], [.7, .5]]],
  G: [[[1, .15], [.7, 0], [.3, 0], [0, .25], [0, .75], [.3, 1], [.7, 1], [1, .75], [1, .55], [.55, .55]]], H: [[[0, 0], [0, 1]], [[1, 0], [1, 1]], [[0, .5], [1, .5]]],
  I: [[[.5, 0], [.5, 1]], [[.2, 0], [.8, 0]], [[.2, 1], [.8, 1]]], J: [[[.8, 0], [.8, .75], [.55, 1], [.25, 1], [0, .75]]],
  K: [[[0, 0], [0, 1]], [[1, 0], [0, .55]], [[.3, .35], [1, 1]]], L: [[[0, 0], [0, 1], [1, 1]]], M: [[[0, 1], [0, 0], [.5, .6], [1, 0], [1, 1]]], N: [[[0, 1], [0, 0], [1, 1], [1, 0]]],
  O: [[[.5, 0], [.85, .12], [1, .5], [.85, .88], [.5, 1], [.15, .88], [0, .5], [.15, .12], [.5, 0]]], P: [[[0, 1], [0, 0], [.7, 0], [1, .2], [1, .4], [.7, .6], [0, .6]]],
  Q: [[[.5, 0], [.85, .12], [1, .5], [.85, .88], [.5, 1], [.15, .88], [0, .5], [.15, .12], [.5, 0]], [[.6, .65], [1, 1]]], R: [[[0, 1], [0, 0], [.7, 0], [1, .2], [1, .4], [.7, .6], [0, .6]], [[.5, .6], [1, 1]]],
  S: [[[1, .15], [.7, 0], [.3, 0], [0, .2], [.2, .45], [.8, .55], [1, .8], [.7, 1], [.3, 1], [0, .85]]], T: [[[0, 0], [1, 0]], [[.5, 0], [.5, 1]]],
  U: [[[0, 0], [0, .75], [.3, 1], [.7, 1], [1, .75], [1, 0]]], V: [[[0, 0], [.5, 1], [1, 0]]], W: [[[0, 0], [.25, 1], [.5, .4], [.75, 1], [1, 0]]],
  X: [[[0, 0], [1, 1]], [[1, 0], [0, 1]]], Y: [[[0, 0], [.5, .5], [1, 0]], [[.5, .5], [.5, 1]]], Z: [[[0, 0], [1, 0], [0, 1], [1, 1]]],
};
const SG = { mode: 'chaos', intent: '', noVowels: true, letters: [], strokes: [], upload: null, thresh: 140, lw: 7, ink: '#2a1a10', ring: false, bar: false, dot: false, sel: -1, cur: null, step: 'make', burn: null };
const SZ = 600;
function reduceIntent() {
  let s = SG.intent.toUpperCase().replace(/[^A-Z]/g, ''); if (SG.noVowels) s = s.replace(/[AEIOU]/g, '');
  return [...new Set(s.split(''))];
}
function weave() {
  const ls = reduceIntent(), r = rng([...SG.intent].reduce((a, c) => a * 31 + c.charCodeAt(0) >>> 0, 7));
  SG.letters = ls.map((ch, i) => ({ ch, x: SZ / 2 + (r() - .5) * 150, y: SZ / 2 + (r() - .5) * 150, rot: (r() - .5) * 2.4, sc: .55 + r() * .5, flip: r() < .2 }));
  SG.sel = SG.letters.length ? 0 : -1;
}
function glyphSize(L) { return 200 * L.sc; }
function drawLetter(g, L) {
  const s = glyphSize(L); g.save(); g.translate(L.x, L.y); g.rotate(L.rot); if (L.flip) g.scale(-1, 1);
  (GLYPH[L.ch] || []).forEach(poly => { g.beginPath(); poly.forEach(([x, y], i) => { const px = (x - .5) * s * .7, py = (y - .5) * s; i ? g.lineTo(px, py) : g.moveTo(px, py); }); g.stroke(); });
  g.restore();
}
/* the finished sigil as ink on a transparent square */
function sigilInk(size = SZ, forPreview = false) {
  const c = mk(SZ, SZ), g = c.getContext('2d'); g.lineCap = 'round'; g.lineJoin = 'round'; g.strokeStyle = SG.ink; g.fillStyle = SG.ink; g.lineWidth = SG.lw;
  if (SG.mode === 'chaos') {
    SG.letters.forEach(L => drawLetter(g, L));
    if (SG.letters.length) {
      let minx = 1e9, maxx = -1e9, miny = 1e9, maxy = -1e9; SG.letters.forEach(L => { const s = glyphSize(L) * .6; minx = Math.min(minx, L.x - s); maxx = Math.max(maxx, L.x + s); miny = Math.min(miny, L.y - s); maxy = Math.max(maxy, L.y + s); });
      const cx = (minx + maxx) / 2, cy = (miny + maxy) / 2, rad = Math.min(SZ / 2 - 20, Math.hypot(maxx - minx, maxy - miny) / 2 + 14);
      if (SG.ring) { g.lineWidth = SG.lw * .7; g.beginPath(); g.arc(SZ / 2, SZ / 2, SZ / 2 - 26, 0, 6.3); g.stroke(); }
      if (SG.bar) { g.lineWidth = SG.lw * .8; g.beginPath(); g.moveTo(SZ / 2 - 90, SZ - 40); g.lineTo(SZ / 2 + 90, SZ - 40); g.stroke(); }
      if (SG.dot) { g.beginPath(); g.arc(SZ / 2, 36, SG.lw * 1.3, 0, 6.3); g.stroke(); }
    }
  } else if (SG.mode === 'draw') {
    SG.strokes.concat(SG.cur ? [SG.cur] : []).forEach(st => {
      if (st.length < 2) { if (st[0]) { g.beginPath(); g.arc(st[0][0], st[0][1], SG.lw / 2, 0, 6.3); g.fill(); } return; }
      g.beginPath(); g.moveTo(st[0][0], st[0][1]); for (let i = 1; i < st.length - 1; i++) { const mx = (st[i][0] + st[i + 1][0]) / 2, my = (st[i][1] + st[i + 1][1]) / 2; g.quadraticCurveTo(st[i][0], st[i][1], mx, my); } g.lineTo(st[st.length - 1][0], st[st.length - 1][1]); g.stroke();
    });
  } else if (SG.mode === 'upload' && SG.upload) {
    const key = SG.thresh + SG.ink + SG.upload.src.length;
    if (SG._upKey === key) { g.drawImage(SG._upC, 0, 0); return size === SZ ? c : (() => { const o = mk(size, size); o.getContext('2d').drawImage(c, 0, 0, size, size); return o; })(); }
    const im = SG.upload, k = Math.min((SZ - 60) / im.width, (SZ - 60) / im.height), w = im.width * k, h = im.height * k;
    const t = mk(SZ, SZ), tg = t.getContext('2d', { willReadFrequently: true }); tg.drawImage(im, (SZ - w) / 2, (SZ - h) / 2, w, h);
    const id = tg.getImageData(0, 0, SZ, SZ), d = id.data, ink = h2r(SG.ink);
    for (let i = 0; i < d.length; i += 4) { const lum = .3 * d[i] + .59 * d[i + 1] + .11 * d[i + 2], a = d[i + 3] / 255 * clamp((SG.thresh - lum) / 40 + .5, 0, 1); d[i] = ink[0]; d[i + 1] = ink[1]; d[i + 2] = ink[2]; d[i + 3] = a * 255; }
    tg.putImageData(id, 0, 0); g.drawImage(t, 0, 0); SG._upKey = key; SG._upC = t;
  }
  if (size === SZ) return c; const o = mk(size, size); o.getContext('2d').drawImage(c, 0, 0, size, size); return o;
}
function sigilIsEmpty() { return SG.mode === 'chaos' ? !SG.letters.length : SG.mode === 'draw' ? !SG.strokes.length : !SG.upload; }
function parchment(g, w, h) {
  g.fillStyle = lg(g, 0, 0, w, h, [[0, '#f4e9c8'], [.5, '#ead9a8'], [1, '#d9c08a']]); g.fillRect(0, 0, w, h);
  const r = rng(5); for (let i = 0; i < 260; i++) { g.fillStyle = r() < .5 ? 'rgba(120,80,30,.05)' : 'rgba(255,255,255,.07)'; g.beginPath(); g.arc(r() * w, r() * h, 2 + r() * 20, 0, 6.3); g.fill(); }
  g.fillStyle = rg(g, w / 2, h / 2, w * .3, w * .75, [[0, 'rgba(0,0,0,0)'], [1, 'rgba(90,50,10,.35)']]); g.fillRect(0, 0, w, h);
}

/* ---------- workshop UI ---------- */
const Lib = { items: [], async load() { this.items = (await DB.get('sigils')) || []; }, save() { DB.set('sigils', this.items); } };
let sgCanvas, sgCtx, sgBody, sgRaf = 0;
function openSigil() {
  const root = $('#sigil'); root.hidden = false; renderSigilUI(); if (!sgRaf) sgLoop();
}
function closeSigil() { $('#sigil').hidden = true; cancelAnimationFrame(sgRaf); sgRaf = 0; Snd.burnBoost = 0; }
function renderSigilUI() {
  const root = $('#sigil'); root.innerHTML = '';
  const tab = (id, label) => el('button', { class: 'tab' + (SG.mode === id && SG.step === 'make' ? ' on' : ''), onclick: () => { SG.mode = id; SG.step = 'make'; renderSigilUI(); } }, label);
  sgCanvas = el('canvas', { width: SZ, height: SZ, class: 'sgcv' }); sgCtx = sgCanvas.getContext('2d');
  const side = el('div', { class: 'sgside' });
  const card = el('div', { class: 'sgcard' }, el('div', { class: 'sghead' }, el('h2', {}, 'Sigil workshop'), el('button', { class: 'x', onclick: closeSigil }, '×')),
    el('div', { class: 'tabs' }, tab('chaos', 'Chaos method'), tab('draw', 'Draw'), tab('upload', 'Upload'), el('button', { class: 'tab' + (SG.step === 'lib' ? ' on' : ''), onclick: () => { SG.step = 'lib'; renderSigilUI(); } }, 'Library')),
    el('div', { class: 'sgbody' }, el('div', { class: 'sgstage' }, sgCanvas), side));
  root.append(card);
  if (SG.step === 'lib') return buildLib(side);
  if (SG.step === 'charge') return buildCharge(side);
  if (SG.mode === 'chaos') buildChaos(side); else if (SG.mode === 'draw') buildDraw(side); else buildUpload(side);
  const common = el('div', { class: 'row' }, label('Ink'), el('input', { type: 'color', value: SG.ink, oninput: e => SG.ink = e.target.value }), label('Line'), el('input', { type: 'range', min: 2, max: 18, value: SG.lw, oninput: e => SG.lw = +e.target.value }));
  side.append(common, el('div', { class: 'row' }, el('button', { onclick: saveToLib }, 'Save to library'), el('button', { class: 'gold', onclick: startCharge }, 'Charge with fire →')));
}
const label = t => el('label', {}, t);
function buildChaos(side) {
  const inp = el('input', { type: 'text', placeholder: 'e.g. I am calm and protected', value: SG.intent, oninput: e => { SG.intent = e.target.value; updateChips(); } });
  const chips = el('div', { class: 'chips' });
  function updateChips() { chips.innerHTML = ''; reduceIntent().forEach(ch => chips.append(el('span', { class: 'chip' }, ch))); }
  updateChips();
  side.append(el('p', { class: 'help' }, 'Write your intent as a statement. Repeated letters' + (SG.noVowels ? ' and vowels' : '') + ' are struck out, then the remaining letters are woven into one mark.'), inp,
    el('label', { class: 'chk' }, el('input', { type: 'checkbox', checked: SG.noVowels, onchange: e => { SG.noVowels = e.target.checked; updateChips(); } }), ' Also remove vowels'), chips,
    el('div', { class: 'row' }, el('button', { onclick: () => { weave(); renderSigilUI(); } }, SG.letters.length ? 'Weave again' : 'Weave the letters'), el('button', { onclick: () => { if (SG.sel >= 0) { SG.letters.splice(SG.sel, 1); SG.sel = SG.letters.length ? 0 : -1; renderSigilUI(); } } }, 'Remove letter')));
  if (SG.letters.length) {
    const L = () => SG.letters[SG.sel];
    side.append(el('p', { class: 'help' }, 'Drag letters on the paper. Select one, then turn, resize or flip it until the shapes become a single glyph.'),
      el('div', { class: 'row' }, label('Turn'), el('input', { type: 'range', min: -3.14, max: 3.14, step: .02, value: L() ? L().rot : 0, oninput: e => L() && (L().rot = +e.target.value) })),
      el('div', { class: 'row' }, label('Size'), el('input', { type: 'range', min: .25, max: 1.6, step: .02, value: L() ? L().sc : 1, oninput: e => L() && (L().sc = +e.target.value) }), el('button', { onclick: () => L() && (L().flip = !L().flip) }, 'Flip')),
      el('div', { class: 'row' }, el('label', { class: 'chk' }, el('input', { type: 'checkbox', checked: SG.ring, onchange: e => SG.ring = e.target.checked }), ' Ring'), el('label', { class: 'chk' }, el('input', { type: 'checkbox', checked: SG.bar, onchange: e => SG.bar = e.target.checked }), ' Bar'), el('label', { class: 'chk' }, el('input', { type: 'checkbox', checked: SG.dot, onchange: e => SG.dot = e.target.checked }), ' Dot')));
  }
  let drag = null;
  const pt = e => { const r = sgCanvas.getBoundingClientRect(); return [(e.clientX - r.left) / r.width * SZ, (e.clientY - r.top) / r.height * SZ]; };
  sgCanvas.onpointerdown = e => { const [x, y] = pt(e); let best = -1, bd = 1e9; SG.letters.forEach((L, i) => { const d = Math.hypot(L.x - x, L.y - y); if (d < glyphSize(L) * .55 && d < bd) { best = i; bd = d; } }); if (best >= 0) { SG.sel = best; drag = [x - SG.letters[best].x, y - SG.letters[best].y]; sgCanvas.setPointerCapture(e.pointerId); } };
  sgCanvas.onpointermove = e => { if (!drag) return; const [x, y] = pt(e), L = SG.letters[SG.sel]; L.x = x - drag[0]; L.y = y - drag[1]; };
  sgCanvas.onpointerup = () => { if (drag) { drag = null; renderSigilUI(); } };
}
function buildDraw(side) {
  side.append(el('p', { class: 'help' }, 'Draw your sigil freehand on the paper.'), el('div', { class: 'row' }, el('button', { onclick: () => { SG.strokes.pop(); } }, 'Undo'), el('button', { onclick: () => { SG.strokes = []; } }, 'Clear')));
  const pt = e => { const r = sgCanvas.getBoundingClientRect(); return [(e.clientX - r.left) / r.width * SZ, (e.clientY - r.top) / r.height * SZ]; };
  sgCanvas.onpointerdown = e => { SG.cur = [pt(e)]; sgCanvas.setPointerCapture(e.pointerId); };
  sgCanvas.onpointermove = e => { if (SG.cur) SG.cur.push(pt(e)); };
  sgCanvas.onpointerup = () => { if (SG.cur) { SG.strokes.push(SG.cur); SG.cur = null; } };
}
function buildUpload(side) {
  side.append(el('p', { class: 'help' }, 'Upload a photo or scan of a sigil you have already made (dark marks on light paper work best).'),
    el('input', { type: 'file', accept: 'image/*', onchange: e => { const f = e.target.files[0]; if (!f) return; readImageFile(f, 900, true, url => { const im = new Image(); im.onload = () => { SG.upload = im; }; im.src = url; }); } }),
    el('div', { class: 'row' }, label('Threshold'), el('input', { type: 'range', min: 40, max: 230, value: SG.thresh, oninput: e => SG.thresh = +e.target.value })));
  sgCanvas.onpointerdown = sgCanvas.onpointermove = sgCanvas.onpointerup = null;
}
function saveToLib() {
  if (sigilIsEmpty()) return toast('Make a sigil first.');
  Lib.items.unshift({ id: Date.now(), src: sigilInk(300).toDataURL('image/png'), intent: SG.mode === 'chaos' ? SG.intent : '', charged: false, date: new Date().toLocaleDateString() }); Lib.save(); toast('Saved to your library.');
}
function buildLib(side) {
  sgCanvas.onpointerdown = sgCanvas.onpointermove = sgCanvas.onpointerup = null;
  if (!Lib.items.length) side.append(el('p', { class: 'help' }, 'Your saved sigils will be kept here, on this device.'));
  const grid = el('div', { class: 'libgrid' });
  Lib.items.forEach(it => {
    grid.append(el('div', { class: 'libitem' }, el('img', { src: it.src }), el('div', { class: 'small' }, it.intent || 'Sigil', it.charged ? ' ✦' : ''),
      el('div', { class: 'row' }, el('button', { onclick: () => placeSigil(it.src, it.charged) }, 'Place'), el('button', { onclick: () => { const im = new Image(); im.onload = () => { SG.mode = 'upload'; SG.upload = im; SG.ink = '#2a1a10'; SG.thresh = 200; SG.step = 'make'; renderSigilUI(); }; im.src = it.src; } }, 'Use'),
        el('button', { class: 'x2', onclick: () => { Lib.items = Lib.items.filter(i => i !== it); Lib.save(); renderSigilUI(); } }, 'Delete'))));
  });
  side.append(grid);
}
function placeSigil(src, charged) { spawnObject('sigil', { src, style: charged ? 'plate' : 'paper', charged: !!charged }); toast(charged ? 'Charged sigil placed on your altar.' : 'Sigil placed on your altar.'); closeSigil(); }

/* ---------- charging with fire ---------- */
function startCharge() {
  if (sigilIsEmpty()) return toast('Make a sigil first.');
  SG.step = 'charge'; SG.inkImg = sigilInk(SZ); SG.burn = { state: 'wait', r: 0, p: null, ash: [], t: 0 };
  const b = mk(SZ, SZ); parchment(b.getContext('2d'), SZ, SZ); SG.paper = b;
  renderSigilUI();
}
function buildCharge(side) {
  side.append(el('p', { class: 'help' }, 'Hold your intention in mind. When you are ready, touch a corner of the paper to the flame by clicking on its edge.'));
  const out = el('div', { class: 'outcome', hidden: true }, el('p', { class: 'help' }, 'It is done. What would you like to do with the charged sigil?'),
    el('button', { class: 'gold', onclick: () => finishCharge('mark') }, 'Keep it on the altar as a glowing mark'),
    el('button', { onclick: () => finishCharge('ash') }, 'Leave its ashes in a bowl'),
    el('button', { onclick: () => finishCharge('release') }, 'Release it'));
  side.append(out, el('button', { onclick: () => { SG.step = 'make'; Snd.burnBoost = 0; renderSigilUI(); } }, '← Back'));
  const pt = e => { const r = sgCanvas.getBoundingClientRect(); return [(e.clientX - r.left) / r.width * SZ, (e.clientY - r.top) / r.height * SZ]; };
  sgCanvas.onpointerdown = e => { if (SG.burn.state !== 'wait') return; const p = pt(e); SG.burn = { state: 'burn', r: 0, p, ash: [], t: 0 }; Snd.init(); Snd.flare(); Snd.burnBoost = 8; };
  sgCanvas.onpointermove = sgCanvas.onpointerup = null;
}
function finishCharge(how) {
  const charged = sigilInk(300).toDataURL('image/png');
  if (how === 'mark') { Lib.items.unshift({ id: Date.now(), src: charged, intent: SG.mode === 'chaos' ? SG.intent : '', charged: true, date: new Date().toLocaleDateString() }); Lib.save(); placeSigil(charged, true); }
  else if (how === 'ash') { Lib.items.unshift({ id: Date.now(), src: charged, intent: SG.mode === 'chaos' ? SG.intent : '', charged: true, date: new Date().toLocaleDateString() }); Lib.save(); spawnObject('bowl', { mat: 'black', content: 'ash' }); toast('A bowl of ashes has been placed on your altar.'); closeSigil(); }
  else { toast('Released.'); closeSigil(); }
}
function sgLoop() {
  sgRaf = requestAnimationFrame(sgLoop); const g = sgCtx; if (!g || !sgCanvas.isConnected) return; const t = performance.now() / 1000;
  g.clearRect(0, 0, SZ, SZ);
  if (SG.step === 'charge') {
    const b = SG.burn, tmp = SG.tmp || (SG.tmp = mk(SZ, SZ)), tg = tmp.getContext('2d');
    tg.globalCompositeOperation = 'source-over'; tg.clearRect(0, 0, SZ, SZ); tg.drawImage(SG.paper, 0, 0); tg.drawImage(SG.inkImg, 0, 0);
    if (b.state === 'burn') {
      b.r += 2.2 + b.r * .004; const jag = a => 1 + Math.sin(a * 7 + b.r * .05) * .06 + Math.sin(a * 17 + b.r * .09) * .04 + Math.sin(a * 3) * .05;
      tg.globalCompositeOperation = 'destination-out'; tg.beginPath(); for (let i = 0; i <= 72; i++) { const a = i / 72 * 6.283, rad = b.r * jag(a); i ? tg.lineTo(b.p[0] + Math.cos(a) * rad, b.p[1] + Math.sin(a) * rad) : tg.moveTo(b.p[0] + Math.cos(a) * rad, b.p[1] + Math.sin(a) * rad); } tg.fill();
      tg.globalCompositeOperation = 'source-atop'; const br = tg.createRadialGradient(b.p[0], b.p[1], b.r * .97, b.p[0], b.p[1], b.r + 30); br.addColorStop(0, 'rgba(25,8,0,.95)'); br.addColorStop(.45, 'rgba(70,30,8,.6)'); br.addColorStop(1, 'rgba(70,30,8,0)'); tg.fillStyle = br; tg.fillRect(0, 0, SZ, SZ);
      g.fillStyle = '#1a1210'; g.fillRect(0, 0, SZ, SZ); g.drawImage(tmp, 0, 0);
      g.globalCompositeOperation = 'lighter'; for (let i = 0; i < 26; i++) { const a = Math.random() * 6.283, rad = b.r * jag(a) + 2, x = b.p[0] + Math.cos(a) * rad, y = b.p[1] + Math.sin(a) * rad; if (x < -10 || y < -10 || x > SZ + 10 || y > SZ + 10) continue; flame(g, x, y, .5 + Math.random() * .5, t + i, i); }
      const ee = g.createRadialGradient(b.p[0], b.p[1], b.r * .9, b.p[0], b.p[1], b.r + 10); ee.addColorStop(0, 'rgba(255,120,20,0)'); ee.addColorStop(.6, 'rgba(255,160,40,.6)'); ee.addColorStop(1, 'rgba(255,60,0,0)'); g.fillStyle = ee; g.fillRect(0, 0, SZ, SZ);
      g.globalCompositeOperation = 'source-over';
      if (Math.random() < .5) b.ash.push({ x: b.p[0] + (Math.random() - .5) * b.r * 2, y: b.p[1] + (Math.random() - .5) * b.r * 2, vy: -20 - Math.random() * 40, life: 1 });
      if (b.r > (b.far = b.far || Math.max(...[[0, 0], [SZ, 0], [0, SZ], [SZ, SZ]].map(c => Math.hypot(c[0] - b.p[0], c[1] - b.p[1]))) + 40)) { b.state = 'done'; Snd.burnBoost = 0; $('.outcome').hidden = false; }
    } else if (b.state === 'wait') {
      g.drawImage(tmp, 0, 0); g.fillStyle = 'rgba(255,230,160,.9)'; g.font = 'italic 20px "Cormorant Garamond", Georgia, serif'; g.textAlign = 'center'; g.fillText('click the paper’s edge to light it', SZ / 2, SZ - 20);
    } else {
      g.fillStyle = '#2a2018'; g.fillRect(0, 0, SZ, SZ); g.fillStyle = 'rgba(255,200,120,.9)'; g.font = 'italic 26px "Cormorant Garamond", Georgia, serif'; g.textAlign = 'center'; g.fillText('Charged.', SZ / 2, SZ / 2);
      const gl = SG.inkImg; g.save(); g.globalCompositeOperation = 'lighter'; g.globalAlpha = .35 + .2 * Math.sin(t * 2); g.drawImage(gl, 0, 0); g.restore();
    }
    for (let i = b.ash.length - 1; i >= 0; i--) { const a = b.ash[i]; a.y += a.vy * .016; a.x += Math.sin(t * 3 + i) * .4; a.life -= .012; if (a.life <= 0) { b.ash.splice(i, 1); continue; } g.fillStyle = `rgba(40,30,25,${a.life * .8})`; g.fillRect(a.x, a.y, 2.2, 1.6); }
    return;
  }
  parchment(g, SZ, SZ);
  if (SG.mode === 'chaos' && SG.sel >= 0 && SG.letters[SG.sel]) { const L = SG.letters[SG.sel]; g.strokeStyle = 'rgba(160,70,30,.4)'; g.setLineDash([5, 5]); g.lineWidth = 1.5; g.beginPath(); g.arc(L.x, L.y, glyphSize(L) * .55, 0, 6.3); g.stroke(); g.setLineDash([]); }
  if (SG.step === 'make') g.drawImage(sigilInk(SZ), 0, 0);
}
