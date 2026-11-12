'use strict';
/* The name behind the altar, lettered differently for each place so it belongs to the scene:
   carved in stone, written in sand, gilded on a chapel wall, mirrored in the river, and so on. */
const NAME = 'Angel Gabriella';
const LF = {
  cinzel: '600 SZpx "Cinzel", "Cormorant Garamond", Georgia, serif',
  uncial: 'SZpx "Uncial Antiqua", "Cormorant Garamond", Georgia, serif',
  dancing: '700 SZpx "Dancing Script", "Cormorant Garamond", cursive',
  vibes: 'SZpx "Great Vibes", "Cormorant Garamond", cursive',
  pirata: 'SZpx "Pirata One", "Cormorant Garamond", Georgia, serif',
  marcellus: 'SZpx "Marcellus", "Cormorant Garamond", Georgia, serif',
};
const lfont = (g, k, size) => { g.font = LF[k].replace('SZ', size); };
/* canvas text only uses a web font once it has been asked for */
try { Object.keys(LF).forEach(k => document.fonts.load(LF[k].replace('SZ', 40), NAME)); } catch (e) { }
/* letter-spaced text, centred on cx; fn draws one character at (x, y) */
function spaced(g, text, cx, y, sp, fn) {
  const ch = [...text], ws = ch.map(c => g.measureText(c).width), total = ws.reduce((a, b) => a + b, 0) + sp * (ch.length - 1);
  let x = cx - total / 2; g.textAlign = 'left'; ch.forEach((c, i) => { fn(c, x, y, i); x += ws[i] + sp; }); return total;
}
const LETTERING = {
  /* carved into the architrave of the temple */
  greek(g) {
    lfont(g, 'cinzel', 36);
    spaced(g, NAME.toUpperCase(), CX, 127, 9, (c, x, y) => { g.fillStyle = 'rgba(255,252,240,.75)'; g.fillText(c, x, y + 1.5); g.fillStyle = 'rgba(104,86,58,.78)'; g.fillText(c, x, y); });
  },
  /* old uncial letters hanging in the mist over the stones */
  circle(g, p, t) {
    lfont(g, 'uncial', 76); g.textAlign = 'center';
    g.shadowColor = 'rgba(214,255,206,.7)'; g.shadowBlur = 22 + Math.sin(t * .8) * 7; g.fillStyle = 'rgba(255,255,255,.28)'; g.fillText(NAME, CX, 150);
    g.shadowBlur = 0; g.lineWidth = 1; g.strokeStyle = 'rgba(255,255,255,.32)'; g.strokeText(NAME, CX, 150);
  },
  /* written in the sand with a fingertip */
  beach(g) {
    lfont(g, 'dancing', 62); g.textAlign = 'center'; g.lineJoin = 'round';
    g.fillStyle = 'rgba(255,249,228,.6)'; g.fillText(NAME, CX + 1.6, 688.4);
    g.fillStyle = g.strokeStyle = 'rgba(122,86,46,.5)'; g.lineWidth = 1.6; g.fillText(NAME, CX, 686); g.strokeText(NAME, CX, 686);
  },
  /* gold inlaid in the marble floor of the round temple */
  rotunda(g) {
    lfont(g, 'cinzel', 30); g.translate(CX, 663); g.scale(1, .78);
    const w = spaced(g, NAME.toUpperCase(), 0, 0, 9, (c, x, y) => { g.fillStyle = 'rgba(255,250,232,.8)'; g.fillText(c, x, y + 1.4); g.fillStyle = 'rgba(176,128,44,.85)'; g.fillText(c, x, y); });
    g.fillStyle = 'rgba(176,128,44,.8)'; for (const sgn of [-1, 1]) { g.save(); g.translate(sgn * (w / 2 + 20), 0); g.rotate(.785); g.fillRect(-3.5, -3.5, 7, 7); g.restore(); }
  },
  /* sunlight through the leaves, with fireflies */
  jungle(g, p, t) {
    g.globalCompositeOperation = 'lighter'; lfont(g, 'vibes', 112); g.textAlign = 'center';
    g.shadowColor = 'rgba(196,255,120,.85)'; g.shadowBlur = 26; g.fillStyle = 'rgba(226,255,170,.5)'; g.fillText(NAME, CX, 250); g.shadowBlur = 0;
    for (let i = 0; i < 16; i++) { const x = CX + Math.sin(i * 12.9) * 340 + Math.sin(t * .3 + i) * 10, y = 250 + Math.cos(i * 7.3) * 78 + Math.sin(t * .6 + i * 2) * 8, a = Math.max(0, Math.sin(t * 1.7 + i * 2.4)) * .8; g.fillStyle = rg(g, x, y, 0, 7, [[0, `rgba(235,255,170,${a})`], [1, 'rgba(200,255,120,0)']]); g.beginPath(); g.arc(x, y, 7, 0, 6.3); g.fill(); }
  },
  /* gold leaf blackletter either side of the rose window */
  chapel(g, p) {
    lfont(g, 'pirata', 64); g.textAlign = 'center'; const y = 104;
    const put = (s, x) => { g.shadowColor = 'rgba(0,0,0,.55)'; g.shadowBlur = 6; g.shadowOffsetY = 2; g.fillStyle = lg(g, 0, y - 30, 0, y + 30, [[0, 'rgba(255,238,166,.88)'], [.5, 'rgba(218,174,74,.84)'], [1, 'rgba(146,100,32,.84)']]); g.fillText(s, x, y); g.shadowColor = 'transparent'; g.lineWidth = 1; g.strokeStyle = 'rgba(52,28,6,.45)'; g.strokeText(s, x, y); };
    if (p.count >= 3) { const [a, b] = NAME.split(' '); put(a, 446); put(b, 842); } else put(NAME, CX);
  },
  /* cream script in the evening sky, mirrored in the water */
  river(g, p, t) {
    lfont(g, 'vibes', 104); g.textAlign = 'center';
    g.save(); g.translate(CX + Math.sin(t * .7) * 3, 452); g.scale(1, -.58); g.fillStyle = `rgba(255,240,200,${.2 + .05 * Math.sin(t * 1.1)})`; g.fillText(NAME, 0, 0); g.restore();
    g.shadowColor = 'rgba(150,104,36,.6)'; g.shadowBlur = 12; g.fillStyle = 'rgba(255,250,230,.78)'; g.fillText(NAME, CX, 150);
  },
  /* sunset colours, shimmering like a mirage */
  desert(g, p, t) {
    lfont(g, 'marcellus', 84); g.shadowColor = 'rgba(255,170,90,.6)'; g.shadowBlur = 14;
    g.fillStyle = lg(g, 0, 108, 0, 192, [[0, 'rgba(255,238,184,.7)'], [1, 'rgba(240,128,78,.62)']]);
    spaced(g, NAME, CX, 150, 3, (c, x, y, i) => g.fillText(c, x, y + Math.sin(t * 1.4 + i * .55) * 1.7));
  },
};
function drawLettering(g, place, t) {
  g.save(); g.textBaseline = 'middle';
  try { (LETTERING[place.id] || LETTERING.river)(g, place, t); } catch (e) { }
  g.restore();
}
