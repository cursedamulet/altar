'use strict';
const { Engine, Bodies, Body, Composite, Events, Mouse, MouseConstraint, Query, Sleeping, Vertices } = Matter;

/* ---------- state ---------- */
const S = {
  place: { id: 'greek', count: 7, mood: 'golden', weather: 'clear' },
  hour: 17.5,
  altar: { type: 'table', w: 540, h: 150, mat: 'marble', trim: true, cloth: { on: true, color: '#7a1e3a', len: 'front', pattern: 'border', trim: '#d9b24c' }, inlay: { kind: 'star', n: 9, inner: .42, color: '#d9b24c' } },
  backdrop: { kind: 'none', color: '#27476b', pattern: 'lattice', w: 360, h: 420, src: '' },
  mix: {}, master: .7, burn: true, autoSound: true, exporting: false,
};
let engine, world, cv, ctx, SC = 1, layerA, ctxA, layerT, ctxT, scenery = null, sel = null, altarBodies = [], mc, dirty = false, started = false, rain = [], motes = [];
const THUMBS = {};

/* ---------- small helpers ---------- */
function toast(msg) { const t = $('#toast'); t.textContent = msg; t.classList.add('on'); clearTimeout(toast.h); toast.h = setTimeout(() => t.classList.remove('on'), 3200); }
const markDirty = () => dirty = true;
const objects = () => Composite.allBodies(world).filter(b => b.plugin && b.plugin.o);
function wakeAll() { Composite.allBodies(world).forEach(b => { if (!b.isStatic) Sleeping.set(b, false); }); }
const Cam = {
  vid: null, on: false,
  async start() { if (this.on) return true; try { const s = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'user', width: 640, height: 640 } }); this.vid = document.createElement('video'); this.vid.playsInline = true; this.vid.muted = true; this.vid.srcObject = s; await this.vid.play(); this.on = true; return true; } catch (e) { toast('Camera not available: ' + (e.message || e.name)); return false; } },
  stop() { if (this.vid && this.vid.srcObject) this.vid.srcObject.getTracks().forEach(t => t.stop()); this.vid = null; this.on = false; },
  ready() { return this.on && this.vid && this.vid.readyState >= 2; },
};
function checkCam() { if (!objects().some(b => b.plugin.o.kind === 'mirror' && b.plugin.o.d.cam)) Cam.stop(); }

/* ---------- physics ---------- */
function initPhysics() {
  engine = Engine.create({ enableSleeping: true, positionIterations: 8, velocityIterations: 6 }); engine.gravity.y = 1.5; world = engine.world;
  Composite.add(world, [Bodies.rectangle(CX, FLOOR + 100, W + 800, 200, { isStatic: true, friction: .9, frictionStatic: 1, label: 'ground' }),
    Bodies.rectangle(-60, 300, 100, 2000, { isStatic: true }), Bodies.rectangle(W + 60, 300, 100, 2000, { isStatic: true })]);
  rebuildAltar();
  const mouse = Mouse.create(cv); mouse.pixelRatio = SC;
  mc = MouseConstraint.create(engine, { mouse, constraint: { stiffness: .2, damping: .12, render: { visible: false } } }); Composite.add(world, mc);
  Events.on(engine, 'beforeUpdate', () => objects().forEach(b => { if (b.speed > 28) Body.setVelocity(b, { x: b.velocity.x * 28 / b.speed, y: b.velocity.y * 28 / b.speed }); if (b.position.y > H + 400) removeBody(b); }));
  const support = new Map();
  const addSup = p => { const A = p.bodyA.parent, B = p.bodyB.parent; for (const [t, u] of [[A, B], [B, A]]) { if (t.isStatic || !t.plugin.o) continue; if (t.position.y < u.position.y && Math.abs(t.bounds.max.y - u.bounds.min.y) < 8) { const lo = Math.max(t.bounds.min.x, u.bounds.min.x), hi = Math.min(t.bounds.max.x, u.bounds.max.x); if (hi <= lo) continue; const e = support.get(t.id) || { b: t, lo: 1e9, hi: -1e9 }; e.lo = Math.min(e.lo, lo); e.hi = Math.max(e.hi, hi); support.set(t.id, e); } } };
  Events.on(engine, 'beforeUpdate', () => support.clear());
  Events.on(engine, 'collisionActive', e => e.pairs.forEach(addSup));
  Events.on(engine, 'afterUpdate', () => support.forEach(e => { const b = e.b, x = b.position.x; if (x < e.lo - 1 || x > e.hi + 1) { const d = x < e.lo ? -1 : 1; Body.setVelocity(b, { x: d * clamp(Math.abs(b.velocity.x) + .7, 0, 3), y: b.velocity.y }); } }));
  Events.on(engine, 'collisionStart', e => { e.pairs.forEach(addSup); for (const p of e.pairs) { const v = Math.hypot(p.bodyA.velocity.x - p.bodyB.velocity.x, p.bodyA.velocity.y - p.bodyB.velocity.y); if (v < 2.2) continue; const a = p.bodyA.parent.plugin.o, b = p.bodyB.parent.plugin.o, sa = a && OBJ[a.kind].snd, sb = b && OBJ[b.kind].snd; Snd.hit(sa === 'glass' || sb === 'glass' ? 'glass' : sa === 'metal' || sb === 'metal' ? 'metal' : sa || sb || 'stone', v); } });
}
function rebuildAltar(prev) {
  altarBodies.forEach(b => Composite.remove(world, b));
  altarBodies = altarRects(S.altar).map(([x, y, w, h]) => Bodies.rectangle(x + w / 2, y + h / 2, w, h, { isStatic: true, friction: .9, frictionStatic: 1, label: 'altar' }));
  Composite.add(world, altarBodies);
  if (prev) {
    const oh = prev.w / 2, nh = S.altar.w / 2;
    objects().forEach(b => { const p = b.position; if (Math.abs(p.x - CX) <= oh + 10 && b.bounds.max.y < FLOOR - 4) { Body.setPosition(b, { x: CX + (p.x - CX) * nh / oh, y: p.y - (S.altar.h - prev.h) - 8 }); Body.setVelocity(b, { x: 0, y: 0 }); } });
  }
  wakeAll();
}

/* ---------- objects ---------- */
function bodyFor(def, d, s, x, y) {
  const { w, h } = def.dims(d), opt = { friction: .7, frictionStatic: .8, restitution: .05, density: .002, sleepThreshold: 80, slop: .04 };
  let body;
  if (def.parts) {
    const parts = def.parts(w, h, d).map(p => { if (p.type === 'rect') return Bodies.rectangle(x + p.x * s, y + p.y * s, p.w * s, p.h * s, opt); const v = p.v.map(q => ({ x: q[0] * s, y: q[1] * s })), c = Vertices.centre(v); return Bodies.fromVertices(x + c.x, y + c.y, [v], opt); });
    body = Body.create(Object.assign({ parts }, opt));
  } else if (def.shape === 'circle') body = Bodies.circle(x, y, w * s / 2, opt);
  else if (def.shape) { const v = hull(def.shape(w, h, d).map(q => ({ x: q[0] * s, y: q[1] * s }))); body = Bodies.fromVertices(x, y, [v], opt); }
  else body = Bodies.rectangle(x, y, w * s, h * s, opt);
  Body.setPosition(body, { x, y }); Body.setInertia(body, Infinity);
  body.plugin.dx = (body.bounds.min.x + body.bounds.max.x) / 2 - body.position.x; body.plugin.dy = (body.bounds.min.y + body.bounds.max.y) / 2 - body.position.y;
  return body;
}
function addObject(kind, d, opts = {}) {
  const def = OBJ[kind], s = opts.s || 1, body = bodyFor(def, d, s, opts.x, opts.y);
  body.plugin.o = { kind, d, s, st: opts.st || {}, seed: opts.seed || (1 + Math.random() * 9999 | 0), acc: 0 };
  Composite.add(world, body); markDirty(); return body;
}
function spawnObject(kind, data, at) {
  if (objects().length > 150) return toast('The altar is full.');
  const def = OBJ[kind], d = Object.assign({}, JSON.parse(JSON.stringify(def.data)), data || {}), { h } = def.dims(d);
  const x = at ? at.x : CX + (Math.random() - .5) * Math.min(S.altar.w * .6, 360), y = at ? at.y : altarTop(S.altar) - h / 2 - 90 - Math.random() * 40;
  const b = addObject(kind, d, { x, y }); select(b); if (def.toggle && d[def.toggle]) Snd.flare(); return b;
}
function rebuild(b) {
  const o = b.plugin.o, def = OBJ[o.kind], p = { x: b.position.x, y: b.position.y }, a = b.angle, bottom = b.bounds.max.y;
  if (mc.body === b) { mc.constraint.bodyB = null; mc.body = null; }
  const nb = bodyFor(def, o.d, o.s, p.x, p.y); nb.plugin.o = o; Body.translate(nb, { x: 0, y: bottom - nb.bounds.max.y });
  Composite.remove(world, b); Composite.add(world, nb); wakeAll(); markDirty(); return nb;
}
function removeBody(b) { if (mc.body === b) { mc.constraint.bodyB = null; mc.body = null; } Composite.remove(world, b); if (sel === b) select(null); wakeAll(); checkCam(); markDirty(); }
function select(b) { sel = b; showInspector(); }
function toggleLit(b) { const o = b.plugin.o, def = OBJ[o.kind]; if (!def.toggle) return; if (!o.d[def.toggle] && (o.st.burn || 0) >= 1) return toast('That candle has burned away.'); o.d[def.toggle] = !o.d[def.toggle]; if (o.d[def.toggle]) Snd.flare(); markDirty(); if (sel === b) showInspector(); }

/* ---------- fields (shared by panels and inspector) ---------- */
function mkField(spec, obj, after) {
  const path = spec.k.split('.'), get = () => path.reduce((a, k) => a[k], obj), set = v => { let a = obj; path.slice(0, -1).forEach(k => a = a[k]); a[path[path.length - 1]] = v; };
  const fire = v => { set(v); if (spec.on) spec.on(obj, v); after && after(spec, v); };
  let ctrl;
  switch (spec.t) {
    case 'select': ctrl = el('select', { onchange: e => fire(e.target.value) }, spec.o.map(([v, l]) => el('option', { value: v, selected: String(v) === String(get()) }, l))); break;
    case 'color': ctrl = el('input', { type: 'color', value: get(), oninput: e => fire(e.target.value) }); break;
    case 'range': { const out = el('span', { class: 'val' }, String(get())); ctrl = el('div', { class: 'rng' }, el('input', { type: 'range', min: spec.min, max: spec.max, step: spec.step || 1, value: get(), oninput: e => { out.textContent = e.target.value; fire(+e.target.value); } }), out); break; }
    case 'text': ctrl = el('input', { type: 'text', value: get(), maxLength: 80, oninput: e => fire(e.target.value) }); break;
    case 'textarea': ctrl = el('textarea', { rows: 3, maxLength: 240, value: get(), oninput: e => fire(e.target.value) }); break;
    case 'check': ctrl = el('input', { type: 'checkbox', checked: !!get(), onchange: e => fire(e.target.checked) }); break;
    case 'file': ctrl = el('input', { type: 'file', accept: spec.accept || 'image/*', onchange: e => { const f = e.target.files[0]; if (!f) return; readImageFile(f, spec.max || 700, !!spec.png, (url, w, h) => { if (spec.set) spec.set(obj, url, w, h); else set(url); after && after(spec, url, true); }); } }); break;
    case 'clear': ctrl = el('button', { onclick: () => { set(''); after && after(spec, '', true); } }, 'Remove'); break;
    case 'camera': ctrl = el('button', { onclick: async () => { if (obj.cam) { obj.cam = false; checkCam(); } else obj.cam = await Cam.start(); after && after(spec, obj.cam, true); } }, obj.cam ? 'Turn camera off' : 'Turn camera on'); break;
  }
  return el('div', { class: 'frow' + (spec.t === 'check' ? ' inline' : '') }, el('label', {}, spec.l), ctrl);
}

/* ---------- inspector ---------- */
const HELP = {
  statue: 'Statues are never drawn for you. Upload your own image of the figure you wish to honour (a transparent PNG works best, or tick “clear plain background”).',
  frame: 'Add your own photograph. It stays on this device.', mirror: 'Your camera image stays on this device and is never recorded or uploaded.',
  jar: 'Choose up to three layers. Write what the jar is for on its label.', sigil: 'Sigils come from the Sigil workshop.',
};
function showInspector() {
  const box = $('#inspector'); if (!sel) { box.hidden = true; return; }
  const o = sel.plugin.o, def = OBJ[o.kind]; box.hidden = false; box.innerHTML = '';
  const after = (spec, v, reinspect) => { sel = rebuild(sel); if (spec.on || reinspect) showInspector(); };
  box.append(el('div', { class: 'ihead' }, el('h3', {}, def.label), el('button', { class: 'x', onclick: () => select(null) }, '×')));
  if (HELP[o.kind]) box.append(el('p', { class: 'help' }, HELP[o.kind]));
  def.fields.forEach(f => box.append(mkField(f, o.d, after)));
  box.append(mkField({ k: 's', t: 'range', l: 'Size', min: .5, max: 2.2, step: .05 }, o, () => { sel = rebuild(sel); }));
  const btns = el('div', { class: 'row wrap' });
  if (def.toggle) btns.append(el('button', { class: 'gold', onclick: () => toggleLit(sel) }, o.d[def.toggle] ? 'Snuff out' : 'Light'));
  if (o.kind === 'candle') btns.append(el('button', { onclick: () => { o.st.burn = 0; o.d.lit = true; Snd.flare(); showInspector(); markDirty(); } }, 'New candle'));
  btns.append(
    el('button', { onclick: () => { const b = addObject(o.kind, JSON.parse(JSON.stringify(o.d)), { x: sel.position.x + 40, y: sel.position.y - 30, s: o.s, st: { burn: 0 } }); select(b); } }, 'Copy'),
    el('button', { class: 'danger', onclick: () => removeBody(sel) }, 'Remove'));
  box.append(btns, el('p', { class: 'help small' }, 'Drag to move. Double-click a flame to light or snuff it.'));
}

/* ---------- panels ---------- */
const PANELS = {};
function openPanel(name) {
  const p = $('#panel'), same = p.dataset.name === name && !p.hidden; $$('#tabs button').forEach(b => b.classList.toggle('on', !same && b.dataset.p === name));
  if (same) { p.hidden = true; return; } p.hidden = false; p.dataset.name = name; p.innerHTML = ''; PANELS[name](p);
}
const $$ = (s, r = document) => [...r.querySelectorAll(s)];
const sect = (t, ...k) => el('div', { class: 'sect' }, el('h4', {}, t), ...k);
function head(p, title) { p.append(el('div', { class: 'ihead' }, el('h3', {}, title), el('button', { class: 'x', onclick: () => { p.hidden = true; $$('#tabs button').forEach(b => b.classList.remove('on')); } }, '×'))); }
let sceneryTimer = 0;
function rebuildScenery(now) { clearTimeout(sceneryTimer); const go = () => { scenery = buildScenery(S.place, SC); markDirty(); }; now ? go() : sceneryTimer = setTimeout(go, 380); }
function thumb(id) {
  if (THUMBS[id]) return THUMBS[id];
  const c = mk(224, 126), g = c.getContext('2d'); g.fillStyle = lg(g, 0, 0, 0, 126, [[0, '#5a92d8'], [1, '#c4e0f4']]); g.fillRect(0, 0, 224, 126);
  const pl = { id, count: PLACES[id].count.def, mood: 'golden', weather: 'clear' }; g.drawImage(buildScenery(pl, .35), 0, 0, 224, 126); return THUMBS[id] = c;
}
function setPlace(id, keepOpts) {
  S.place = { id, count: PLACES[id].count.def, mood: 'golden', weather: 'clear' }; rebuildScenery(true);
  if (S.autoSound) applyAmbient(PLACES[id].ambient);
}
function applyAmbient(a) { LAYERS_UI.forEach(([k]) => { const v = k === 'fire' ? (S.mix.fire ?? .8) : (a[k] || 0); S.mix[k] = v; Snd.set(k, v); }); if ($('#panel').dataset.name === 'sound' && !$('#panel').hidden) PANELS.sound($('#panel')); }
PANELS.place = p => {
  p.innerHTML = ''; head(p, 'Where your altar stands');
  const grid = el('div', { class: 'cards' });
  Object.keys(PLACES).forEach(id => { const c = thumb(id), cp = mk(224, 126); cp.getContext('2d').drawImage(c, 0, 0); grid.append(el('button', { class: 'card' + (S.place.id === id ? ' on' : ''), onclick: () => { setPlace(id); PANELS.place(p); } }, cp, el('span', {}, PLACES[id].name))); });
  const cnt = PLACES[S.place.id].count;
  p.append(grid, sect('Adjust this place', mkField({ k: 'count', t: 'range', l: cnt.label, min: cnt.min, max: cnt.max, step: 1 }, S.place, () => rebuildScenery()),
    mkField({ k: 'mood', t: 'select', l: 'Mood of the painting', o: [['golden', 'Golden'], ['verdant', 'Verdant'], ['silvery', 'Silvery'], ['rich', 'Jewel-rich']] }, S.place, () => rebuildScenery()),
    mkField({ k: 'weather', t: 'select', l: 'Weather', o: [['clear', 'Clear'], ['mist', 'Mist'], ['rain', 'Rain']] }, S.place, (s, v) => { if (S.autoSound) { S.mix.rain = v === 'rain' ? .5 : 0; Snd.set('rain', S.mix.rain); } markDirty(); })),
    el('p', { class: 'help' }, 'Every place is empty of sacred imagery. You bring your own.'));
};
PANELS.altar = p => {
  head(p, 'The altar'); const a = S.altar, ch = () => { markDirty(); }, geo = (s) => { const prev = JSON.parse(JSON.stringify(PREV)); rebuildAltar(prev); PREV = JSON.parse(JSON.stringify(S.altar)); markDirty(); };
  PREV = JSON.parse(JSON.stringify(a));
  p.append(sect('Shape', mkField({ k: 'type', t: 'select', l: 'Kind', o: ALTAR_TYPES }, a, geo), mkField({ k: 'w', t: 'range', l: 'Length', min: 240, max: 900, step: 10 }, a, geo), mkField({ k: 'h', t: 'range', l: 'Height', min: 60, max: 320, step: 5 }, a, geo),
    mkField({ k: 'mat', t: 'select', l: 'Material', o: Object.entries(MATS).map(([k, m]) => [k, m.name]) }, a, ch), mkField({ k: 'trim', t: 'check', l: 'Gold trim' }, a, ch)),
    sect('Cloth', mkField({ k: 'cloth.on', t: 'check', l: 'Covered with cloth' }, a, geo), mkField({ k: 'cloth.color', t: 'color', l: 'Colour' }, a, ch),
      mkField({ k: 'cloth.len', t: 'select', l: 'Hang', o: [['top', 'Only on top'], ['front', 'Draped at the front'], ['floor', 'To the floor'], ['runner', 'Narrow runner']] }, a, geo),
      mkField({ k: 'cloth.pattern', t: 'select', l: 'Pattern', o: [['plain', 'Plain'], ['border', 'Embroidered border'], ['stripes', 'Stripes'], ['lattice', 'Lattice'], ['dots', 'Dots']] }, a, ch), mkField({ k: 'cloth.trim', t: 'color', l: 'Trim colour' }, a, ch)),
    sect('Inlay', mkField({ k: 'inlay.kind', t: 'select', l: 'Design', o: [['none', 'None'], ['star', 'Star'], ['polygon', 'Polygon'], ['rings', 'Rings'], ['circles', 'Overlapping circles'], ['spiral', 'Spiral']] }, a, ch),
      mkField({ k: 'inlay.n', t: 'range', l: 'Points / sides', min: 3, max: 24, step: 1 }, a, ch), mkField({ k: 'inlay.inner', t: 'range', l: 'Star depth', min: .15, max: .9, step: .01 }, a, ch), mkField({ k: 'inlay.color', t: 'color', l: 'Colour' }, a, ch)));
};
let PREV = null;
PANELS.backdrop = p => {
  head(p, 'Behind the altar'); const b = S.backdrop, ch = () => markDirty();
  p.append(sect('Hanging', mkField({ k: 'kind', t: 'select', l: 'Kind', o: [['none', 'Nothing'], ['tapestry', 'Tapestry'], ['painting', 'Framed painting']] }, b, ch), mkField({ k: 'w', t: 'range', l: 'Width', min: 160, max: 700, step: 10 }, b, ch), mkField({ k: 'h', t: 'range', l: 'Height', min: 160, max: 480, step: 10 }, b, ch),
    mkField({ k: 'color', t: 'color', l: 'Cloth colour' }, b, ch), mkField({ k: 'pattern', t: 'select', l: 'Pattern', o: [['plain', 'Plain'], ['lattice', 'Lattice'], ['stripes', 'Stripes'], ['scales', 'Scales']] }, b, ch)),
    sect('Your image', mkField({ k: 'src', t: 'file', l: 'Upload', max: 900 }, b, ch), mkField({ k: 'src', t: 'clear', l: 'Remove image' }, b, ch),
      el('p', { class: 'help' }, 'Deity, symbol or scene: nothing here is chosen for you. Upload a painting, a tapestry design or any picture that is sacred to you.')));
};
PANELS.sound = p => {
  head(p, 'Sound and light'); const ch = () => markDirty();
  const hour = el('span', { class: 'val' }, fmtHour(S.hour));
  p.append(sect('Time of day', el('div', { class: 'frow' }, el('label', {}, 'Hour'), el('div', { class: 'rng' }, el('input', { type: 'range', min: 0, max: 23.9, step: .1, value: S.hour, oninput: e => { S.hour = +e.target.value; hour.textContent = fmtHour(S.hour); markDirty(); } }), hour))),
    sect('Ambience', mkField({ k: 'master', t: 'range', l: 'Master volume', min: 0, max: 1, step: .01 }, S, (s, v) => Snd.setMaster(S.master)), ...LAYERS_UI.map(([k, l]) => mkField({ k: 'mix.' + k, t: 'range', l, min: 0, max: 1, step: .01 }, S, () => { Snd.set(k, S.mix[k] || 0); markDirty(); })),
      mkField({ k: 'autoSound', t: 'check', l: 'Use a place’s own sounds when I change place' }, S, ch)),
    sect('Candles', mkField({ k: 'burn', t: 'check', l: 'Candles burn down over time' }, S, ch)));
  LAYERS_UI.forEach(([k]) => { if (S.mix[k] === undefined) S.mix[k] = 0; });
};
const fmtHour = h => { const hh = Math.floor(h), mm = Math.round((h - hh) * 60 / 5) * 5 % 60; return `${(hh % 12) || 12}:${String(mm).padStart(2, '0')} ${hh < 12 ? 'am' : 'pm'}`; };
PANELS.intention = p => {
  head(p, 'Write an intention'); const ta = el('textarea', { rows: 4, maxLength: 240, placeholder: 'A prayer, a wish, a thank-you…' });
  p.append(sect('On paper', ta, el('div', { class: 'row' }, el('button', { class: 'gold', onclick: () => { if (!ta.value.trim()) return toast('Write something first.'); spawnObject('note', { text: ta.value.trim() }); ta.value = ''; } }, 'Place on the altar'))),
    el('p', { class: 'help' }, 'Intentions stay on your altar and are saved on this device only.'));
};

/* ---------- shelf ---------- */
const SHELF = [
  ['Light', 'candle', 'My candle', { style: 'drawn' }], ['Light', 'candle', 'Taper candle', { style: 'taper' }], ['Light', 'candle', 'Pillar candle', { style: 'pillar', color: '#efe3c0' }], ['Light', 'candle', 'Tealight', { style: 'tea' }],
  ['Light', 'incense', 'Incense stick', { form: 'stick' }], ['Light', 'incense', 'Incense cone', { form: 'cone' }], ['Light', 'incense', 'Resin', { form: 'resin' }], ['Light', 'brazier', 'Fire bowl', {}],
  ['Flowers', 'vase', 'Roses', { shape: 'amphora', flower: 'rose', bloom: '#c2203f' }], ['Flowers', 'vase', 'Lilies', { shape: 'bottle', flower: 'lily', bloom: '#fffaf0', color: '#2f6a58' }], ['Flowers', 'vase', 'Poppies', { shape: 'urn', flower: 'poppy', bloom: '#e0371f', color: '#8a5a2a' }],
  ['Flowers', 'vase', 'Irises', { shape: 'amphora', flower: 'iris', bloom: '#6a4cc0', color: '#a8892a' }], ['Flowers', 'vase', 'Lavender', { shape: 'bottle', flower: 'lavender', bloom: '#8f6fd0', color: '#e8e0cc' }], ['Flowers', 'vase', 'Sunflowers', { shape: 'urn', flower: 'sunflower', bloom: '#f6c516', count: 5 }],
  ['Flowers', 'vase', 'Wildflowers', { shape: 'bowl', flower: 'wild', count: 10, color: '#6a2f4a' }], ['Flowers', 'vase', 'Peonies', { shape: 'bowl', flower: 'peony', bloom: '#f3a6c0', count: 6, color: '#e8e0cc' }], ['Flowers', 'herbs', 'Sage', { type: 'sage' }], ['Flowers', 'herbs', 'Lavender', { type: 'lavender' }], ['Flowers', 'herbs', 'Rosemary', { type: 'rosemary' }],
  ['Vessels', 'bowl', 'Bowl of water', { content: 'water' }], ['Vessels', 'bowl', 'Bowl of milk', { content: 'milk', mat: 'ceramic' }], ['Vessels', 'bowl', 'Bowl of salt', { content: 'salt', mat: 'blue' }], ['Vessels', 'bowl', 'Bowl of honey', { content: 'honey', mat: 'copper' }], ['Vessels', 'bowl', 'Bowl of earth', { content: 'earth', mat: 'black' }],
  ['Vessels', 'chalice', 'Chalice', {}], ['Vessels', 'jar', 'Spell jar', {}], ['Vessels', 'honey', 'Honey jar', {}],
  ['Stones', 'crystal', 'Amethyst cluster', { form: 'cluster', type: 'amethyst' }], ['Stones', 'crystal', 'Quartz cluster', { form: 'cluster', type: 'quartz' }], ['Stones', 'crystal', 'Rose quartz', { form: 'point', type: 'rose' }], ['Stones', 'crystal', 'Citrine point', { form: 'point', type: 'citrine' }], ['Stones', 'crystal', 'Scrying sphere', { form: 'sphere', type: 'quartz' }],
  ['Stones', 'stone', 'River stone', { type: 'river' }], ['Stones', 'stone', 'Black basalt', { type: 'basalt' }], ['Stones', 'stone', 'Sea glass', { type: 'seaglass' }], ['Stones', 'shell', 'Scallop', { type: 'scallop' }], ['Stones', 'shell', 'Conch', { type: 'spiral' }], ['Stones', 'pile', 'Salt', { mat: 'salt' }], ['Stones', 'pile', 'Earth', { mat: 'earth' }],
  ['Offerings', 'coin', 'Gold coin', { mat: 'gold' }], ['Offerings', 'coin', 'Silver coin', { mat: 'silver' }], ['Offerings', 'ingot', 'Gold bar', { mat: 'gold' }], ['Offerings', 'fruit', 'Pomegranate', { type: 'pomegranate' }], ['Offerings', 'fruit', 'Apple', { type: 'apple' }], ['Offerings', 'fruit', 'Grapes', { type: 'grapes' }], ['Offerings', 'chocolate', 'Chocolate', {}],
  ['Keepsakes', 'frame', 'Photo frame', { style: 'gold' }], ['Keepsakes', 'frame', 'Oval frame', { style: 'oval', ratio: .78 }], ['Keepsakes', 'frame', 'Wooden frame', { style: 'wood' }], ['Keepsakes', 'statue', 'Statue (yours)', {}], ['Keepsakes', 'mirror', 'Mirror', {}],
  ['Keepsakes', 'book', 'Book (spine)', { o: 'flat' }], ['Keepsakes', 'book', 'Book (standing)', { o: 'upright', color: '#1f3a5a', title: 'Prayers' }], ['Keepsakes', 'book', 'Book (cover)', { o: 'cover', color: '#2a4a32', title: 'Grimoire' }], ['Keepsakes', 'note', 'Written intention', {}],
];
function iconFor(e) {
  const def = OBJ[e[1]], d = Object.assign({}, JSON.parse(JSON.stringify(def.data)), e[3]), { w, h } = def.dims(d), ext = (def.ext && def.ext.t) || 0, k = Math.min(54 / w, 54 / (h + ext));
  const c = mk(64, 64), g = c.getContext('2d'), saved = POST.splice(0), prev = S.exporting; S.exporting = true;
  g.save(); g.translate(32, 32 + k * ext / 2); g.scale(k, k); try { def.draw(g, d, 1.3, {}, 7); } catch (err) { console.error(e[2], err); } POST.forEach(f => f(g)); g.restore(); POST.length = 0; saved.forEach(f => POST.push(f)); S.exporting = prev; return c;
}
let shelfCat = 'Light';
function buildShelf() {
  const cats = [...new Set(SHELF.map(e => e[0]))], bar = $('#cats'), items = $('#items'); bar.innerHTML = '';
  cats.forEach(c => bar.append(el('button', { class: c === shelfCat ? 'on' : '', onclick: () => { shelfCat = c; buildShelf(); } }, c)));
  items.innerHTML = '';
  SHELF.forEach((e, i) => { if (e[0] !== shelfCat) return; const ic = iconFor(e); items.append(el('button', { class: 'item', draggable: true, title: e[2], ondragstart: ev => ev.dataTransfer.setData('text/plain', String(i)), onclick: () => spawnObject(e[1], e[3]) }, ic, el('span', {}, e[2]))); });
}

/* ---------- rendering ---------- */
function drawSky(g, lt, t) {
  const d = lt.d, N = { t: [8, 12, 36], b: [28, 36, 82] }, G = { t: [96, 104, 176], b: [255, 160, 104] }, D = { t: [88, 146, 222], b: [196, 224, 246] };
  const top = d < .5 ? mixc(N.t, G.t, d / .5) : mixc(G.t, D.t, (d - .5) / .5), bot = d < .5 ? mixc(N.b, G.b, d / .5) : mixc(G.b, D.b, (d - .5) / .5);
  g.fillStyle = lg(g, 0, 0, 0, 420, [[0, rgb(top)], [1, rgb(bot)]]); g.fillRect(0, 0, W, H);
  if (d < .5) { const a = (.5 - d) / .5, r = rng(9); for (let i = 0; i < 170; i++) { const x = r() * W, y = r() * 360, tw = .6 + .4 * Math.sin(t * 2 + i); g.fillStyle = `rgba(255,252,235,${a * tw * (.4 + r() * .6)})`; g.fillRect(x, y, 1 + r() * 1.4, 1 + r() * 1.4); } }
  const h = S.hour; g.save(); g.globalCompositeOperation = 'lighter';
  if (h >= 6 && h <= 19.5) { const u = (h - 6) / 13.5, x = 120 + u * 1040, y = 430 - Math.sin(u * Math.PI) * 340; g.fillStyle = rg(g, x, y, 0, 220, [[0, 'rgba(255,240,200,.9)'], [.12, 'rgba(255,220,150,.5)'], [1, 'rgba(255,180,100,0)']]); g.beginPath(); g.arc(x, y, 220, 0, 6.3); g.fill(); g.fillStyle = '#fffbe8'; g.beginPath(); g.arc(x, y, 30, 0, 6.3); g.fill(); }
  else { const u = ((h + 4.5) % 24) / 10.5, x = 140 + u * 1000, y = 430 - Math.sin(u * Math.PI) * 330; g.fillStyle = rg(g, x, y, 0, 120, [[0, 'rgba(200,215,255,.45)'], [1, 'rgba(160,180,255,0)']]); g.beginPath(); g.arc(x, y, 120, 0, 6.3); g.fill(); g.globalCompositeOperation = 'source-over'; g.fillStyle = '#eef0ff'; g.beginPath(); g.arc(x, y, 26, 0, 6.3); g.fill(); g.fillStyle = rgb(mixc(top, bot, clamp((y - 5) / 420, 0, 1)), 1); g.beginPath(); g.arc(x + 11, y - 5, 23, 0, 6.3); g.fill(); }
  g.restore();
}
let paperPat = null; const paperTex = () => { const c = mk(160, 160), g = c.getContext('2d'); g.drawImage(grain, 0, 0); g.globalAlpha = .7; g.fillStyle = g.createPattern(weaveTile(), 'repeat'); g.fillRect(0, 0, 160, 160); return c; };
const bloomC = mk(192, 108), bctx = bloomC.getContext('2d');
const grain = (() => { const c = mk(160, 160), g = c.getContext('2d'), id = g.createImageData(160, 160); for (let i = 0; i < id.data.length; i += 4) { const v = Math.random() * 255; id.data[i] = id.data[i + 1] = id.data[i + 2] = v; id.data[i + 3] = 22; } g.putImageData(id, 0, 0); return c; })();
function render(t) {
  const lt = lightInfo(S.hour), A = ctxA;
  A.setTransform(SC, 0, 0, SC, 0, 0); A.globalCompositeOperation = 'source-over'; A.clearRect(0, 0, W, H);
  if (scenery) A.drawImage(scenery, 0, 0, W, H);
  dynamicScenery(A, S.place, t);
  /* see-through lettering behind everything, in every place */
  A.save(); A.font = 'italic 600 104px "Cormorant Garamond", Georgia, serif'; A.textAlign = 'center'; A.textBaseline = 'middle';
  A.shadowColor = 'rgba(255,240,200,.35)'; A.shadowBlur = 18; A.fillStyle = 'rgba(255,255,255,.2)'; A.fillText('Angel Gabriella', CX, 150);
  A.shadowBlur = 0; A.lineWidth = 1.2; A.strokeStyle = 'rgba(255,255,255,.28)'; A.strokeText('Angel Gabriella', CX, 150); A.restore();
  if (S.place.weather === 'mist') { for (let i = 0; i < 12; i++) { const x = ((i * 233 + t * 9 * (1 + i % 3 * .4)) % (W + 600)) - 300, y = 400 + (i % 5) * 52 + Math.sin(t * .2 + i) * 14; A.globalAlpha = .16; A.drawImage(puff, x - 300, y - 70, 600, 160); } A.globalAlpha = 1; }
  drawBackdrop(A, S.backdrop, t); drawAltar(A, S.altar);
  const objs = objects().sort((a, b) => a.id - b.id), lights = [];
  POST.length = 0;
  for (const b of objs) {
    const o = b.plugin.o, def = OBJ[o.kind];
    if (b.speed < 2.5) { const sw = (b.bounds.max.x - b.bounds.min.x) * .62; A.save(); A.translate(b.position.x, b.bounds.max.y + 1); A.scale(1, .16); A.fillStyle = rg(A, 0, 0, 0, sw, [[0, 'rgba(12,4,4,.5)'], [1, 'rgba(12,4,4,0)']]); A.beginPath(); A.arc(0, 0, sw, 0, 6.3); A.fill(); A.restore(); }
    A.save(); A.translate(b.position.x, b.position.y); A.rotate(b.angle); A.translate(b.plugin.dx, b.plugin.dy); A.scale(o.s, o.s);
    try { def.draw(A, o.d, t, o.st, o.seed); } catch (err) { if (!render.err) { render.err = 1; console.error(o.kind, err); } }
    A.restore();
    const L = def.light && def.light(o.d); if (L) lights.push({ x: b.position.x, y: b.bounds.min.y - ((def.ext && def.ext.t) || 0) * o.s * .35, r: L.r * o.s, w: L.w, seed: o.seed });
  }
  drawSmoke(A);
  // multiply the whole painted scene by the light of the hour
  ctxT.setTransform(1, 0, 0, 1, 0, 0); ctxT.globalCompositeOperation = 'source-over'; ctxT.clearRect(0, 0, layerT.width, layerT.height); ctxT.fillStyle = rgb(lt.c); ctxT.fillRect(0, 0, layerT.width, layerT.height);
  ctxT.globalCompositeOperation = 'destination-in'; ctxT.drawImage(layerA, 0, 0);
  A.setTransform(1, 0, 0, 1, 0, 0); A.globalCompositeOperation = 'multiply'; A.drawImage(layerT, 0, 0); A.globalCompositeOperation = 'source-over';
  const g = ctx; g.setTransform(SC, 0, 0, SC, 0, 0); g.globalCompositeOperation = 'source-over'; g.globalAlpha = 1;
  drawSky(g, lt, t); g.save(); g.globalCompositeOperation = 'overlay'; g.globalAlpha = .9; g.drawImage(skyTex, 0, 0); g.restore(); g.drawImage(layerA, 0, 0, W, H);
  POST.forEach(f => f(g)); POST.length = 0;
  g.save(); g.globalCompositeOperation = 'lighter';
  for (const L of lights) { const fl = .85 + .15 * Math.sin(t * 9 + L.seed) * Math.sin(t * 5.3 + L.seed), a = (.14 + .5 * (1 - lt.d)) * fl * Math.min(1, L.w); g.fillStyle = rg(g, L.x, L.y, 0, L.r, [[0, `rgba(255,190,110,${a})`], [.4, `rgba(255,140,60,${a * .35})`], [1, 'rgba(255,120,40,0)']]); g.beginPath(); g.arc(L.x, L.y, L.r, 0, 6.3); g.fill(); }
  g.restore();
  if (S.place.weather === 'rain') { g.strokeStyle = `rgba(200,215,235,${.2 + lt.d * .2})`; g.lineWidth = 1; g.beginPath(); for (const r of rain) { g.moveTo(r.x, r.y); g.lineTo(r.x - 3, r.y + 16); } g.stroke(); }
  g.save(); g.globalCompositeOperation = 'lighter'; motes.forEach((m, i) => { const x = (m.x + t * m.v) % W, y = m.y + Math.sin(t * .4 + i) * 12; g.fillStyle = `rgba(255,236,190,${(.05 + .25 * lt.d) * (.5 + .5 * Math.sin(t + i))})`; g.beginPath(); g.arc(x, y, m.r, 0, 6.3); g.fill(); }); g.restore();
  bctx.drawImage(cv, 0, 0, 192, 108); g.save(); g.globalCompositeOperation = 'screen'; g.globalAlpha = .3; g.imageSmoothingQuality = 'high'; g.drawImage(bloomC, 0, 0, W, H); g.restore();
  g.globalAlpha = .6; g.fillStyle = paperPat || (paperPat = g.createPattern(paperTex(), 'repeat')); g.fillRect(0, 0, W, H); g.globalAlpha = 1;
  g.fillStyle = rg(g, W / 2, H * .5, H * .45, W * .72, [[0, 'rgba(30,8,14,0)'], [1, 'rgba(30,8,14,.55)']]); g.fillRect(0, 0, W, H);
  if (sel && !S.exporting) { g.save(); g.strokeStyle = 'rgba(255,233,168,.95)'; g.shadowColor = 'rgba(255,220,120,.9)'; g.shadowBlur = 10; g.lineWidth = 1.6; g.setLineDash([6, 4]); g.lineDashOffset = -t * 12; g.beginPath(); (sel.parts.length > 1 ? sel.parts.slice(1) : [sel]).forEach(p => { p.vertices.forEach((v, i) => i ? g.lineTo(v.x, v.y) : g.moveTo(v.x, v.y)); g.closePath(); }); g.stroke(); g.restore(); }
}

/* ---------- main loop ---------- */
let last = 0, acc = 0;
function frame(ts) {
  requestAnimationFrame(frame); const t = ts / 1000, dt = Math.min(.1, (ts - last) / 1000 || .016); last = ts;
  if (!started) { render(t); return; }
  acc += dt; let steps = 0; while (acc >= 1 / 60 && steps++ < 6) { Engine.update(engine, 1000 / 60); acc -= 1 / 60; } if (steps >= 6) acc = 0;
  let fire = 0;
  for (const b of objects()) {
    const o = b.plugin.o, def = OBJ[o.kind]; if (def.update) def.update(b, o, dt, t);
    if (def.emit && o.d.lit) { o.acc = (o.acc || 0) + dt * (def.big && def.big(o.d) ? 7 : 9); while (o.acc >= 1) { o.acc -= 1; const e = def.emit(o.d), c = Math.cos(b.angle), s = Math.sin(b.angle), lx = b.plugin.dx + e.x * o.s, ly = b.plugin.dy + e.y * o.s; emitSmoke(b.position.x + lx * c - ly * s, b.position.y + lx * s + ly * c, o.kind === 'brazier' ? '#bdb5aa' : o.d.smoke, def.big && def.big(o.d)); } }
    if (o.kind === 'candle' && o.d.lit) fire += o.d.style === 'tea' ? .2 : o.d.style === 'pillar' ? .5 : .3; if (o.kind === 'brazier' && o.d.lit) fire += 4;
  }
  Snd.setFire(fire); updateSmoke(dt, t);
  if (S.place.weather === 'rain') { while (rain.length < 220) rain.push({ x: Math.random() * W, y: Math.random() * H, v: 700 + Math.random() * 300 }); rain.forEach(r => { r.y += r.v * dt; r.x -= 120 * dt; if (r.y > H) { r.y = -20; r.x = Math.random() * W + 100; } }); }
  render(t);
}
function fit() {
  const st = $('#stage'), sw = st.clientWidth, sh = st.clientHeight, k = Math.min(sw / W, sh / H);
  cv.style.width = W * k + 'px'; cv.style.height = H * k + 'px';
}

/* ---------- save / load ---------- */
function serialize() {
  return { v: 1, place: S.place, hour: S.hour, altar: S.altar, backdrop: S.backdrop, mix: S.mix, master: S.master, burn: S.burn, autoSound: S.autoSound,
    objects: objects().map(b => { const o = b.plugin.o; return { kind: o.kind, d: o.d, s: o.s, seed: o.seed, burn: o.st.burn || 0, x: b.position.x, y: b.position.y, a: b.angle }; }) };
}
async function saveNow() { if (!dirty || !started) return; dirty = false; await DB.set('state', serialize()); }
function restore(st) {
  Object.assign(S.place, st.place); S.hour = st.hour ?? S.hour; Object.assign(S.altar, st.altar); S.altar.cloth = Object.assign({}, S.altar.cloth, st.altar.cloth); S.altar.inlay = Object.assign({}, S.altar.inlay, st.altar.inlay);
  Object.assign(S.backdrop, st.backdrop); S.mix = st.mix || {}; S.master = st.master ?? .7; S.burn = st.burn !== false; S.autoSound = st.autoSound !== false;
  rebuildAltar(); rebuildScenery(true);
  (st.objects || []).forEach(e => { if (!OBJ[e.kind]) return; if (e.kind === 'mirror') e.d.cam = false; addObject(e.kind, Object.assign({}, OBJ[e.kind].data, e.d), { x: e.x, y: e.y, s: e.s, seed: e.seed, st: { burn: e.burn } }); });
  dirty = false;
}
function savePicture() {
  S.exporting = true; const prev = sel; sel = null; render(performance.now() / 1000);
  const url = cv.toDataURL('image/png'); S.exporting = false; sel = prev;
  /* shown on the page so it can be saved from anywhere, including a shared link where downloads are blocked */
  const box = el('div', { class: 'shot', onclick: e => { if (e.target === box) box.remove(); } }, el('div', { class: 'sgcard' }, el('div', { class: 'sghead' }, el('h2', {}, 'Your altar'), el('button', { class: 'x', onclick: () => box.remove() }, '×')),
    el('img', { src: url, alt: 'Picture of your altar' }), el('p', { class: 'help' }, 'To keep this picture, press and hold it (or right-click it) and choose Save image.')));
  document.body.append(box);
}

/* ---------- start ---------- */
function startGame(saved) {
  started = true; $('#intro').hidden = true; Snd.init(); Snd.setMaster(S.master);
  LAYERS_UI.forEach(([k]) => Snd.set(k, S.mix[k] || 0));
  if (!saved) { applyAmbient(PLACES[S.place.id].ambient); openPanel('altar'); toast('Choose things from the shelf below, or drag them onto the altar.'); }
  markDirty();
}
function evPt(e) { const r = cv.getBoundingClientRect(); return { x: (e.clientX - r.left) / r.width * W, y: (e.clientY - r.top) / r.height * H }; }
function bodyAt(p) { const hit = Query.point(objects(), p); return hit.length ? hit[hit.length - 1] : null; }
async function boot() {
  cv = $('#cv'); SC = clamp(window.devicePixelRatio || 1, 1, 1.5); cv.width = W * SC; cv.height = H * SC; ctx = cv.getContext('2d');
  layerA = mk(W * SC, H * SC); ctxA = layerA.getContext('2d'); layerT = mk(W * SC, H * SC); ctxT = layerT.getContext('2d');
  for (let i = 0; i < 40; i++) motes.push({ x: Math.random() * W, y: 80 + Math.random() * 560, v: 4 + Math.random() * 8, r: .8 + Math.random() * 1.6 });
  initPhysics(); fit(); addEventListener('resize', fit);
  cv.addEventListener('pointerdown', e => { const p = evPt(e); select(bodyAt(p)); });
  addEventListener('pointerup', () => { if (started) wakeAll(); });
  cv.addEventListener('dblclick', e => { const b = bodyAt(evPt(e)); if (b) toggleLit(b); });
  cv.addEventListener('dragover', e => e.preventDefault());
  cv.addEventListener('drop', e => { e.preventDefault(); const i = +e.dataTransfer.getData('text/plain'); if (SHELF[i]) spawnObject(SHELF[i][1], SHELF[i][3], evPt(e)); });
  addEventListener('keydown', e => { if (/input|textarea|select/i.test(e.target.tagName) || !sel) return; if (e.key === 'Delete' || e.key === 'Backspace') { removeBody(sel); e.preventDefault(); } });
  const tabs = [['place', 'Place'], ['altar', 'Altar'], ['backdrop', 'Backdrop'], ['sound', 'Sound & light'], ['intention', 'Intention']];
  tabs.forEach(([id, l]) => $('#tabs').append(el('button', { 'data-p': id, onclick: () => openPanel(id) }, l)));
  $('#tabs').append(el('button', { onclick: openSigil }, 'Sigils'));
  $('#btnShot').onclick = savePicture;
  $('#btnClear').onclick = e => { const b = e.currentTarget; clearTimeout(b._t); if (b.dataset.sure) { delete b.dataset.sure; b.textContent = 'Clear'; objects().forEach(removeBody); } else { b.dataset.sure = 1; b.textContent = 'Really clear?'; b._t = setTimeout(() => { delete b.dataset.sure; b.textContent = 'Clear'; }, 3000); } };
  buildShelf(); await Lib.load();
  scenery = buildScenery(S.place, SC);
  requestAnimationFrame(frame);
  // intro
  const saved = await DB.get('state'), cards = $('#introCards');
  Object.keys(PLACES).forEach((id, i) => setTimeout(() => { const c = thumb(id), cp = mk(224, 126); cp.getContext('2d').drawImage(c, 0, 0); cards.append(el('button', { class: 'card', onclick: () => { setPlace(id); startGame(false); } }, cp, el('span', {}, PLACES[id].name))); }, 30 * i));
  if (saved && saved.objects) $('#introSaved').append(el('button', { class: 'gold', onclick: () => { restore(saved); startGame(true); } }, 'Return to your altar'));
  setInterval(saveNow, 4000); addEventListener('beforeunload', () => { if (dirty) DB.set('state', serialize()); });
  window.__altar = { S, spawnObject, objects, setPlace, startGame, openPanel, serialize, restore };
}
addEventListener('DOMContentLoaded', boot);
