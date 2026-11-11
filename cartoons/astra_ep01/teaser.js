// Teaser cut: every segment re-renders a moment of the episode (no burned subtitles, optional new camera, slow motion),
// then trailer overlays (letterbox, text cards, flashes) go on top. drawTeaser(t) is deterministic.
'use strict';
const orbit = (cx, cz, r, a0, a1, h, ly, fov = 40) => (sh, lt, k) => { const a = lerp(a0, a1, k); return { p: [cx + Math.cos(a) * r, h, cz + Math.sin(a) * r], l: [cx, ly, cz], fov }; };
const faceCam = (id, dist, side0, side1) => (sh, lt, k) => { const a = actor(id); const h = new THREE.Vector3(); a.J.head.getWorldPosition(h); h.y += 0.13; const r = a.g.rotation.y; const fx = Math.sin(r), fz = Math.cos(r), sd = lerp(side0, side1, k) * dist;
  return { p: [h.x + fx * dist + fz * sd, h.y - 0.02, h.z + fz * dist - fx * sd], l: [h.x, h.y, h.z], fov: 30 }; };
const TZ = [
  { d: 1.6, black: 1, hit: 'drone' },
  { src: 20.5, d: 3.0, sp: 0.7 },
  { src: 69.6, d: 2.6, voice: '02' },
  { d: 0.5, black: 1, hit: 'boom' },
  { src: 787.0, d: 2.6, sp: 0.5, hit: 'braam', cam: faceCam('ren', 1.0, 0.25, -0.5) },
  { d: 2.3, black: 1, card: [['ในโลกที่พลัง… คือทุกสิ่ง', 76, '#ffffff']], narr: 'N1' },
  { src: 141, d: 2.4, sp: 0.8 },
  { src: 242.0, d: 4.6, voice: '09' },
  { d: 1.6, black: 1, card: [['เด็กที่ไม่มีพลัง…', 76, '#ffffff']], narr: 'N2' },
  { src: 343.8, d: 1.8 },
  { src: 378.6, d: 1.6, card: [['ถูกเลือกโดยเปลวเพลิงต้องห้าม', 64, '#ff5a40']], cardAt: 0.1 },
  { src: 412, d: 2.2, hit: 'boom' },
  { src: 476.2, d: 4.8, voice: '23' },
  { d: 0.7, black: 1, hit: 'braam' },
  { src: 487.9, d: 3.3, voice: '24', hit: 'riser', mont: 1 },
  { src: 494.0, d: 1.3, hit: 'hit', mont: 1 },
  { src: 501.0, d: 1.4, hit: 'hit', mont: 1 },
  { src: 510.8, d: 1.0, hit: 'hit', mont: 1 },
  { src: 529.9, d: 1.0, hit: 'hit', mont: 1 },
  { src: 594.3, d: 1.0, hit: 'hit', mont: 1 },
  { src: 612.0, d: 1.1, hit: 'hit', mont: 1 },
  { src: 679.0, d: 1.3, hit: 'hit', mont: 1 },
  { d: 1.2, black: 1, card: [['เปลวเพลิงต้องห้าม…', 70, '#ff3a2a']], hit: 'riser2', mont: 1 },
  { src: 773.1, d: 3.3, voice: '46', mont: 1 },
  { src: 779.7, d: 2.2, sp: 0.45, hit: 'impact', mont: 1 },
  { src: 814.2, d: 2.4, sp: 0.8, hit: 'hit', mont: 1, cam: orbit(-0.6, 3.6, 7, 0.9, 1.6, 1.0, 2.2, 44) },
  { src: 852.3, d: 1.0, hit: 'hit', mont: 1 },
  { src: 871.0, d: 1.2, hit: 'hit', mont: 1 },
  { src: 931.0, d: 2.8, sp: 0.55, hit: 'hit', mont: 1 },
  { src: 939.8, d: 1.4, hit: 'impact', mont: 1 },
  { d: 1.1, black: 1 },
  { src: 1242.1, d: 3.8, voice: '81' },
  { src: 1366.0, d: 6.2, sp: 0.9, narr: 'N3', narrAt: 0.2 },
  { d: 4.2, black: 1, hit: 'braam', title: 1 },
  { src: 1357.0, d: 4.0, voice: '86' },
  { d: 3.6, black: 1, hit: 'boom', card: [['ตอนที่ 1 — เสียงเรียกจากเถ้าถ่าน', 56, '#ffffff'], ['ดูได้แล้ววันนี้', 40, '#ff5a40', 80, 500]] },
];
let TT = 0; for (const s of TZ) { s.start = TT; TT += s.d; s.sp = s.sp || 1; }
const TEASER = { total: TT, segs: TZ };
const BAR = Math.round((H - W / 2.39) / 2);
function teaserCard(x, lines, a) { x.save(); x.globalAlpha = a; x.textAlign = 'center'; let y0 = H / 2 - (lines.length - 1) * 30;
  lines.forEach(([txt, size, col, dy, w]) => { x.font = (w || 800) + ' ' + size + 'px Kanit'; x.shadowColor = col === '#ffffff' ? 'rgba(255,60,30,0.55)' : 'rgba(255,30,10,0.9)'; x.shadowBlur = 28; x.fillStyle = col; x.fillText(txt, W / 2, y0 + (dy || 0) + size * 0.35); }); x.restore(); }
function drawTeaser(t) {
  let s = TZ[TZ.length - 1]; for (const z of TZ) if (t >= z.start && t < z.start + z.d) { s = z; break; }
  const lt = t - s.start, k = lt / s.d; const x = OX;
  if (s.black) { x.globalAlpha = 1; x.fillStyle = '#000'; x.fillRect(0, 0, W, H); }
  else { window.NOSUB = 1; window.CAMOVR = s.cam ? (sh, l) => s.cam(sh, l, k) : null; draw(s.src + lt * s.sp); }
  // trailer grade: crush blacks a little + letterbox
  if (!s.black) { x.save(); x.globalCompositeOperation = 'multiply'; x.fillStyle = 'rgba(235,225,225,1)'; x.fillRect(0, 0, W, H); x.restore(); }
  x.fillStyle = '#000'; x.fillRect(0, 0, W, BAR); x.fillRect(0, H - BAR, W, BAR);
  // cut flashes on montage hits
  if (s.mont && !s.black && lt < 0.12) { x.save(); x.globalAlpha = 0.5 * (1 - lt / 0.12); x.fillStyle = '#fff'; x.fillRect(0, BAR, W, H - 2 * BAR); x.restore(); }
  // dip in/out of every shot (2 frames) for a punchy cut
  const dip = Math.max(0, 1 - lt / 0.08, 1 - (s.d - lt) / 0.06); if (dip > 0 && !s.black) { x.save(); x.globalAlpha = dip * 0.6; x.fillStyle = '#000'; x.fillRect(0, 0, W, H); x.restore(); }
  if (s.card) { const a0 = s.cardAt || 0; const a = clamp(Math.min((lt - a0) / 0.25, (s.d - lt) / 0.25)); if (a > 0) teaserCard(x, s.card, a); }
  if (s.title) { const a = clamp(Math.min((lt - 0.15) / 0.6, (s.d - lt) / 0.5)); const sc = 1 + lt * 0.02; x.save(); x.translate(W / 2, H / 2); x.scale(sc, sc); x.translate(-W / 2, -H / 2);
    teaserCard(x, [['อาณาจักรอัสตรา', 132, '#ffffff', -40], ['เปลวเพลิงไร้นาม', 72, '#ff3a2a', 70, 500]], a); x.restore(); }
  if (t < 0.4) { x.fillStyle = 'rgba(0,0,0,' + (1 - t / 0.4) + ')'; x.fillRect(0, 0, W, H); }
}
