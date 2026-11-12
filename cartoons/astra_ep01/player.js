// Timeline player: turns the shot list (story/*.js) into frames. draw(t) is deterministic for any t.
'use strict';
const STORY = [];
function scene(def) { STORY.push(def); }
const SPK = { ren: ['เรน', '#ff6a4a'], mira: ['มีรา', '#7fd6ff'], gron: ['โกรน', '#ff3040'], sera: ['ยายเซรา', '#ffc26a'], kid: ['เด็กชาย', '#b8f08a'], man: ['ชาวบ้าน', '#c8c8d8'], king: ['ราชันเงา', '#ff2a2a'], mom: ['เสียงหญิงสาว', '#e8d8ff'] };
function ots(a, b, o = {}) { const dx = b[0] - a[0], dz = b[1] - a[1], L = Math.hypot(dx, dz), ux = dx / L, uz = dz / L; const bk = o.back || 1.2, sd = o.side == null ? 0.6 : o.side; const r = { p: [a[0] - ux * bk - uz * sd, o.y || 1.75, a[1] - uz * bk + ux * sd], l: [b[0] + (o.lx || 0), o.ly || 1.5, b[1] + (o.lz || 0)], fov: o.fov || 32 }; if (o.push) r.p2 = [r.p[0] + ux * o.push, r.p[1], r.p[2] + uz * o.push]; return r; }
function subDur(txt) { return clamp(1.5 + [...txt].length * 0.075, 2.0, 7.5); }
let TL = null;
const TRIM = QS.get('trim') !== '0';
function slowmo(t0, t1, f) { return lt => lt < t0 ? lt : lt < t1 ? t0 + (lt - t0) * f : t0 + (t1 - t0) * f + (lt - t1); }
function buildTimeline() {
  let t = 0, n = 0; const shots = []; const VS = typeof VOICE_SEC !== 'undefined' ? VOICE_SEC : [];
  STORY.forEach((sc, si) => { sc.start = t; sc.shots.forEach(sh => { sh.start = t; sh.si = si; sh.idx = shots.length; sh.sceneId = sc.id; let c = 0.4, pe = -1;
    sh.subs = (sh.sub || []).map(s => { const [who, txt, at0, dur0] = s; let at = at0 != null ? at0 : c; if (TRIM) at = Math.max(at, pe + 0.25); const dur = TRIM && VS[n] ? VS[n] + 0.3 : (dur0 || subDur(txt)); n++; c = at + dur + 0.3; pe = at + dur; return { who, txt, at, dur }; });
    // window of the shot that is actually shown: trims dead air around dialogue and long holds
    let c0 = 0, c1 = sh.d;
    if (sh.cut) { c0 = sh.cut[0]; c1 = sh.cut[1]; }
    else if (TRIM && !sh.keep) { if (sh.subs.length) { c0 = Math.max(0, sh.subs[0].at - (sh.lead == null ? 0.45 : sh.lead)); c1 = pe + (sh.tail == null ? 0.45 : sh.tail); } else if (sh.d > 4.5) c1 = 4.5 + (sh.d - 4.5) * 0.3; }
    sh.c0 = c0; sh.c1 = c1; sh.len = c1 - c0; t += sh.len; shots.push(sh); }); sc.end = t; });
  TL = { shots, total: t }; return TL;
}
function exportCues() { return { total: TL.total, scenes: STORY.map(s => ({ id: s.id, title: s.title, start: s.start, end: s.end })), shots: TL.shots.map(sh => ({ start: sh.start, d: sh.len, scene: sh.sceneId, set: sh.set, L: sh.L, m: sh.m || '',
  sfx: (sh.sfx || []).filter(c => c[0] >= sh.c0 - 0.05 && c[0] < sh.c1).map(c => [Math.max(0, c[0] - sh.c0), c[1], c[2] == null ? 1 : c[2]]), fire: sh._st && typeof sh._st.fire === 'number' ? sh._st.fire : (sh.st && typeof sh.st.fire === 'number' ? sh.st.fire : (sh.st && sh.st.fire ? 0.7 : 0)),
  subs: sh.subs.map(s => ({ who: (SPK[s.who] || [s.who.replace(/^@/, '')])[0], txt: s.txt, at: sh.start + s.at - sh.c0, dur: s.dur })) })) }; }
function findShot(t) { const s = TL.shots; let lo = 0, hi = s.length - 1; while (lo < hi) { const m = (lo + hi + 1) >> 1; if (s[m].start <= t) lo = m; else hi = m - 1; } return s[lo]; }

// ---------- renderer & overlay ----------
let RND, CAM, OUT, OX, GLC; const VIGN = document.createElement('canvas'); const GRAIN = [];
function initPlayer() {
  GLC = document.createElement('canvas'); GLC.width = GLW; GLC.height = GLH;
  RND = new THREE.WebGLRenderer({ canvas: GLC, antialias: AA, preserveDrawingBuffer: true }); RND.setPixelRatio(1); RND.setSize(GLW, GLH, false);
  CAM = new THREE.PerspectiveCamera(40, W / H, 0.05, 1200);
  OUT = document.getElementById('cv'); OUT.width = W; OUT.height = H; OX = OUT.getContext('2d', { willReadFrequently: true }); OX.imageSmoothingQuality = 'high';
  VIGN.width = W; VIGN.height = H; const v = VIGN.getContext('2d'); const g = v.createRadialGradient(W / 2, H / 2, H * 0.35, W / 2, H / 2, H * 1.0); g.addColorStop(0, 'rgba(0,0,0,0)'); g.addColorStop(1, 'rgba(0,0,0,0.75)'); v.fillStyle = g; v.fillRect(0, 0, W, H);
  for (let k = 0; k < 4; k++) { const c = document.createElement('canvas'); c.width = 480; c.height = 270; const x = c.getContext('2d'); const id = x.createImageData(480, 270); for (let i = 0; i < id.data.length; i += 4) { const n = hash(i * 0.37 + k * 999) * 255; id.data[i] = id.data[i + 1] = id.data[i + 2] = n; id.data[i + 3] = 255; } x.putImageData(id, 0, 0); GRAIN.push(c); }
  buildTimeline();
}

// ---------- per-shot fx context ----------
let CUR = null; // {idx, F}
function makeF(sh, S) {
  const objs = []; const cache = {};
  const F = {
    S, sh, shake: 0, flash: 0, flashCol: '#ffffff', lines: 0, rays: 0, raysAt: [W / 2, H / 2], tint: null, dark: 0,
    add(key, fac) { if (!cache[key]) { const o = fac(); cache[key] = o; const obj = o.pts || o; S.scene.add(obj); objs.push(obj); } const o = cache[key]; (o.pts || o).visible = true; return o; },
    ps(key, n, opts) { return F.add(key, () => new PS(n, opts)); },
    hide(key) { if (cache[key]) (cache[key].pts || cache[key]).visible = false; },
    light(i, col, inten, x, y, z, dist) { const p = S.L.pts[i]; p.color.set(col); p.intensity = inten; p.position.set(x, y, z); if (dist) p.distance = dist; },
    joint(id, j) { const a = actor(id); const v = new THREE.Vector3(); (a.J[j] || a.g).getWorldPosition(v); return v; },
    apos(id) { const v = new THREE.Vector3(); actor(id).g.getWorldPosition(v); return v; },
    dispose() { for (const o of objs) S.scene.remove(o); },
  };
  return F;
}

// ---------- actors per frame ----------
function keyed(v, lt, def) { // v: value or [[t,val],...]
  if (!Array.isArray(v) || !Array.isArray(v[0])) return { cur: v == null ? def : v, k: lt, prev: null, since: 1e9 };
  let i = 0; while (i + 1 < v.length && v[i + 1][0] <= lt) i++; return { cur: v[i][1], k: lt - v[i][0], prev: i > 0 ? v[i - 1][1] : null, since: lt - v[i][0], pk: i > 0 ? lt - v[i - 1][0] : 0 };
}
function resolveTarget(tg, lt) { if (typeof tg === 'string' && tg !== 'cam') { const a = ACT[tg]; if (a) { const v = new THREE.Vector3(); a.g.getWorldPosition(v); return v; } } if (Array.isArray(tg)) return new THREE.Vector3(tg[0], tg.length > 2 ? tg[1] : 1.5, tg.length > 2 ? tg[2] : tg[1]); if (tg === 'cam') return CAM.position.clone(); return null; }
function angTo(from, v) { return Math.atan2(v.x - from.x, v.z - from.z); }
function angLerp(a, b, u) { let d = ((b - a + Math.PI) % TAU + TAU) % TAU - Math.PI; return a + d * u; }
const ONSTAGE = new Map();
function snapPose(a) { const o = { _hy: a.J.hip.position.y }; for (const k in a.J) { const j = a.J[k]; if (j && j.isObject3D) o[k] = [j.rotation.x, j.rotation.y, j.rotation.z]; } return o; }
function blendPose(a, A, B, u) { for (const k in B) { if (k === '_hy') continue; const j = a.J[k], p = A[k], q = B[k]; if (j && p) j.rotation.set(lerp(p[0], q[0], u), lerp(p[1], q[1], u), lerp(p[2], q[2], u)); } a.J.hip.position.y = lerp(A._hy, B._hy, u); }
function placeActors(sh, S, lt, rt) { if (rt == null) rt = lt;
  const A = sh.A || {}; for (const k in A) if (!A[k]) delete A[k]; const want = new Set(Object.keys(A));
  for (const [id, sc] of ONSTAGE) if (!want.has(id) || sc !== S.scene) { sc.remove(actor(id).g); ONSTAGE.delete(id); }
  const order = Object.keys(A).sort((a, b) => (typeof A[a].f === 'string' ? 1 : 0) - (typeof A[b].f === 'string' ? 1 : 0));
  for (const id of order) {
    const sp = A[id]; const a = actor(id); if (!ONSTAGE.has(id)) { S.scene.add(a.g); ONSTAGE.set(id, S.scene); }
    const act = keyed(sp.a, lt, 'idle');
    const t0 = sp.t ? sp.t[0] : 0, t1 = sp.t ? sp.t[1] : sh.d; const raw = clamp((lt - t0) / Math.max(0.001, t1 - t0));
    const moving = act.cur === 'walk' || act.cur === 'run' || act.cur === 'march';
    const e = (sp.e || (moving ? 'lin' : 'io')) === 'lin' ? raw : sp.e === 'out' ? easeOut(raw) : sp.e === 'in' ? easeIn(raw) : ease(raw);
    const p = sp.p || [0, 0], p2 = sp.p2 || p; const x = lerp(p[0], p2[0], e), z = lerp(p[1], p2[1], e);
    const y = S.groundY(x, z) + lerp(sp.y || 0, sp.y2 != null ? sp.y2 : (sp.y || 0), e);
    let jy = 0; if (sp.jump) { const [j0, j1, jh] = sp.jump; const jk = (lt - j0) / (j1 - j0); if (jk > 0 && jk < 1) jy = Math.sin(Math.PI * jk) * jh; }
    a.g.position.set(x, y + jy, z);
    if (sp.s) a.g.scale.setScalar(sp.s * (a.d ? (a.d.scale || 1) : 1)); else if (a.d) a.g.scale.setScalar(a.d.scale || 1);
    // facing
    const fk = keyed(sp.f, lt, null); const toAng = v => { if (v == null) return sp.p2 ? Math.atan2(p2[0] - p[0], p2[1] - p[1]) : 0; if (typeof v === 'number') return v; const tv = resolveTarget(v, lt); return tv ? angTo(a.g.position, tv) : 0; };
    let ang = toAng(fk.cur); if (fk.prev != null || (Array.isArray(sp.f) && Array.isArray(sp.f[0]))) { const pa = toAng(fk.prev); ang = angLerp(pa, ang, ease(fk.since / (sp.turn || 0.5))); }
    a.g.rotation.y = ang + (sp.rz ? 0 : 0); a.g.rotation.z = sp.rz || 0; a.g.rotation.x = sp.rx || 0;
    if (a.isWolf) { poseWolf(a, lt + sh.start, act.cur, act.k); a.g.scale.setScalar(sp.s || 1); continue; }
    resetPose(a);
    const dist = Math.hypot(p2[0] - p[0], p2[1] - p[1]) * e; const phase = sp.p2 ? dist * (act.cur === 'run' ? 2.7 : 4.4) + (sp.ph || 0) : (lt + (sp.ph || 0)) * (act.cur === 'run' ? 9 : 5.5);
    pose(a, act.cur, act.k, { phase, dur: sp.dur });
    const BL = sp.bl == null ? 0.2 : sp.bl; if (act.prev != null && act.since < BL && act.prev !== act.cur) { const B = snapPose(a); resetPose(a); pose(a, act.prev, act.pk, { phase, dur: sp.dur }); const A0 = snapPose(a); blendPose(a, A0, B, ease(act.since / BL)); }
    if (sp.look) { const tv = resolveTarget(sp.look, lt); if (tv) { a.g.updateMatrixWorld(); const hp = new THREE.Vector3(); a.J.head.getWorldPosition(hp); let yaw = angTo(hp, tv) - ang; yaw = ((yaw + Math.PI) % TAU + TAU) % TAU - Math.PI; const pit = -Math.atan2(tv.y - hp.y - 0.15, Math.hypot(tv.x - hp.x, tv.z - hp.z)); a.J.head.rotation.y = clamp(yaw, -1.1, 1.1); a.J.head.rotation.x = clamp(pit, -0.6, 0.6); } }
    for (const [key, ax] of [['hx', 'x'], ['hy', 'y']]) { if (sp[key] == null) continue; const hk = keyed(sp[key], lt, 0); a.J.head.rotation[ax] = hk.prev != null ? lerp(hk.prev, hk.cur, ease(hk.since / 0.6)) : hk.cur; }
    if (a.J.cloak) a.J.cloak.rotation.x = (moving ? (act.cur === 'run' ? 0.38 : 0.15) : 0.04) + Math.sin(lt * 2.3 + x) * 0.04 + (sp.wind || 0);
    if (a.J.skirt) a.J.skirt.rotation.x = moving ? 0.08 : 0;
    const mv = moving || act.cur === 'dash' ? (act.cur === 'walk' || act.cur === 'march' ? 0.5 : 1) : 0; if (a.J.hairBack) { a.J.hairBack.rotation.x = 0.04 + mv * 0.55 + Math.sin(lt * 2.9 + x) * (0.03 + mv * 0.06) + (sp.wind || 0); a.J.hairBack.rotation.z = Math.sin(lt * 1.7 + z) * 0.03; } if (a.J.scarf) { a.J.scarf.rotation.x = -0.25 - mv * 0.9 + Math.sin(lt * 4.1 + x) * (0.08 + mv * 0.15); a.J.scarf.rotation.z = Math.sin(lt * 3.3) * 0.1; }
    setEyes(a, sp.eye || null); if (a.J.eyeM) { const bt = (rt + sh.start + hash(id.length * 7.3 + id.charCodeAt(0)) * 4) % 3.7; const bs = bt < 0.14 && !sp.eye ? 0.12 : 1; for (const m of a.J.eyeM) m.scale.y = bs; }
    // props
    for (const slot of ['R', 'L', 'B', 'F']) { const want2 = sp[slot] || null; if ((a.props[slot] || {}).name !== want2) { if (a.props[slot]) a.props[slot].obj.parent.remove(a.props[slot].obj); a.props[slot] = null; if (want2) { const o = makeProp(want2); (slot === 'B' || slot === 'F' ? a.J.torso : a.J['hand' + slot]).add(o); if (slot === 'B') at(o, 0, 0.3, -0.22); if (slot === 'F') at(o, 0, 0.22, 0.12); a.props[slot] = { name: want2, obj: o }; } } }
    // talking
    let talking = false; for (const s of sh.subs) if (s.who === id && rt >= s.at && rt < s.at + s.dur - 0.3) talking = true; setMouth(a, talking, rt);
  }
}

// ---------- camera ----------
function placeCamera(sh, lt, u) {
  const c = sh.cam || {}; let p, l, fov;
  if (typeof c === 'function') { const r = c(lt, u); p = r.p; l = r.l; fov = r.fov || 40; }
  else {
    const t0 = c.t ? c.t[0] : 0, t1 = c.t ? c.t[1] : sh.d; const raw = clamp((lt - t0) / Math.max(0.001, t1 - t0)); const e = c.e === 'lin' ? raw : c.e === 'out' ? easeOut(raw) : c.e === 'in' ? easeIn(raw) : ease(raw);
    const P0 = c.p || [0, 2, 8], P1 = c.p2 || P0, L0 = c.l || [0, 1.4, 0], L1 = c.l2 || L0;
    p = [lerp(P0[0], P1[0], e), lerp(P0[1], P1[1], e), lerp(P0[2], P1[2], e)]; l = [lerp(L0[0], L1[0], e), lerp(L0[1], L1[1], e), lerp(L0[2], L1[2], e)];
    if (c.f) { const a = ACT[c.f]; if (a) { const v = a.g.position; p = [p[0] + v.x, p[1] + v.y, p[2] + v.z]; l = [l[0] + v.x, l[1] + v.y, l[2] + v.z]; } }
    fov = lerp(c.fov || 40, c.fov2 || c.fov || 40, e);
  }
  const T = lt + sh.start; const hh = sh.still ? 0 : 0.025;
  CAM.position.set(p[0] + noise1(T * 0.5) * hh, p[1] + noise1(T * 0.43 + 5) * hh, p[2] + noise1(T * 0.37 + 9) * hh);
  CAM.fov = fov; CAM.updateProjectionMatrix(); CAM.lookAt(l[0], l[1], l[2]);
}

// ---------- overlay ----------
function wrapText(x, txt, maxW) { const words = txt.split(' '); const lines = []; let cur = ''; for (const w of words) { const tst = cur ? cur + ' ' + w : w; if (x.measureText(tst).width > maxW && cur) { lines.push(cur); cur = w; } else cur = tst; } if (cur) lines.push(cur); return lines; }
function drawSubs(sh, lt) {
  for (const s of sh.subs) { if (lt < s.at || lt > s.at + s.dur) continue; const a = clamp(Math.min((lt - s.at) / 0.15, (s.at + s.dur - lt) / 0.2));
    const [nm, col] = SPK[s.who] || [s.who.replace(/^@/, ''), '#d8d0e0']; const x = OX; x.save(); x.globalAlpha = a; x.textAlign = 'center'; x.lineJoin = 'round';
    x.font = '800 50px Kanit'; const lines = wrapText(x, s.txt, 1560); let y = H - 70 - (lines.length - 1) * 64;
    x.font = '500 34px Kanit'; x.lineWidth = 7; x.strokeStyle = 'rgba(0,0,0,0.9)'; x.strokeText(nm, W / 2, y - 62); x.fillStyle = col; x.fillText(nm, W / 2, y - 62);
    x.font = '800 50px Kanit'; for (const ln of lines) { x.lineWidth = 10; x.strokeStyle = 'rgba(0,0,0,0.92)'; x.strokeText(ln, W / 2, y); x.fillStyle = '#fff'; x.fillText(ln, W / 2, y); y += 64; } x.restore(); }
}
function speedLines(alpha, cx, cy, col, t) { const x = OX; x.save(); x.globalAlpha = alpha; x.fillStyle = col; for (let i = 0; i < 90; i++) { const a = hash(i + Math.floor(t * 12) * 0.13) * TAU, r0 = 260 + hash(i + 3) * 380, r1 = 1500; const w = 0.004 + hash(i + 7) * 0.012; x.beginPath(); x.moveTo(cx + Math.cos(a - w) * r1, cy + Math.sin(a - w) * r1); x.lineTo(cx + Math.cos(a) * r0, cy + Math.sin(a) * r0); x.lineTo(cx + Math.cos(a + w) * r1, cy + Math.sin(a + w) * r1); x.fill(); } x.restore(); }
function overlay(sh, lt, F, t) {
  if (ANIME) { if (!overlay.sm) { overlay.sm = document.createElement('canvas'); overlay.sm.width = 480; overlay.sm.height = 270; overlay.sx = overlay.sm.getContext('2d'); }
    const sx = overlay.sx; sx.filter = 'blur(5px) brightness(1.15) contrast(1.35)'; sx.drawImage(OUT, 0, 0, 480, 270); OX.save(); OX.globalCompositeOperation = 'screen'; OX.globalAlpha = 0.32; OX.drawImage(overlay.sm, 0, 0, W, H); OX.restore(); }
  const x = OX; const L = LIGHTS[sh.L || 'day'] || LIGHTS.day; const gr = sh.grade || L.grade;
  if (gr && gr[1] > 0) { x.save(); x.globalAlpha = Math.min(1, gr[1] * 0.9); x.fillStyle = '#' + C(gr[0]).getHexString(); x.fillRect(0, 0, W, H); x.restore(); }
  if (F.rays > 0) speedLines(F.rays, F.raysAt[0], F.raysAt[1], F.raysCol || '#ff2a1a', t);
  if (F.lines > 0) speedLines(F.lines, W / 2, H / 2, '#ffffff', t);
  x.drawImage(VIGN, 0, 0);
  if (sh.bars) { x.fillStyle = '#000'; x.fillRect(0, 0, W, 110); x.fillRect(0, H - 110, W, 110); }
  const wl = lt - sh.c0, len = sh.len;
  if (sh.imp) for (const it of sh.imp) if (lt >= it && lt < it + 0.085) { x.save(); x.globalCompositeOperation = 'difference'; x.fillStyle = '#fff'; x.fillRect(0, 0, W, H); x.restore(); speedLines(0.6, W / 2, H / 2, '#000', t); }
  let fade = 0; if (sh.fadeIn && wl < sh.fadeIn) fade = 1 - wl / sh.fadeIn; if (sh.fadeOut && wl > len - sh.fadeOut) fade = Math.max(fade, (wl - (len - sh.fadeOut)) / sh.fadeOut); fade = Math.max(fade, F.dark || 0);
  if (sh.flash) for (const [ft, fd, fc] of sh.flash) { if (lt >= ft && lt < ft + fd) { F.flash = Math.max(F.flash, 1 - (lt - ft) / fd); F.flashCol = fc || '#ffffff'; } }
  if (F.flash > 0) { x.save(); x.globalAlpha = clamp(F.flash); x.fillStyle = F.flashCol; x.fillRect(0, 0, W, H); x.restore(); }
  if (fade > 0) { x.save(); x.globalAlpha = clamp(fade); x.fillStyle = '#000'; x.fillRect(0, 0, W, H); x.restore(); }
  if (window.NOSUB) return;
  if (sh.title) sh.title(x, sh.keep || sh.cut ? lt : wl, sh.keep || sh.cut ? sh.d : len);
  if (sh.name) { const [n0, small, big, nd = 1.6, col = '#e8121c', px = 0.68, py = 0.6] = sh.name; const k = lt - n0; if (k > 0 && k < nd) { const a = clamp(Math.min(k / 0.08, (nd - k) / 0.2)), pop = 1 + Math.max(0, 0.2 - k) * 2.2; x.save(); x.globalAlpha = a; x.translate(W * px, H * py); x.rotate(-0.08); x.scale(pop, pop); x.textAlign = 'center'; x.lineJoin = 'round';
    if (small) { x.font = '500 46px Kanit'; x.lineWidth = 10; x.strokeStyle = '#000'; x.strokeText(small, 0, -96); x.fillStyle = '#fff'; x.fillText(small, 0, -96); }
    x.font = '800 124px Kanit'; x.lineWidth = 22; x.strokeStyle = '#000'; x.strokeText(big, 0, 30); x.lineWidth = 8; x.strokeStyle = '#fff'; x.strokeText(big, 0, 30); x.fillStyle = col; x.fillText(big, 0, 30); x.restore(); } }
  drawSubs(sh, lt);
}
function titleCard(lines, o = {}) { return (x, lt, d) => { const a = clamp(Math.min((lt - (o.at || 0)) / 1.0, (d - lt) / 1.0)); if (a <= 0) return; x.save(); x.globalAlpha = a; x.textAlign = 'center'; lines.forEach(([txt, size, col, dy, w]) => { x.font = (w || 800) + ' ' + size + 'px Kanit'; x.lineJoin = 'round'; x.lineWidth = size * 0.16; x.strokeStyle = 'rgba(0,0,0,0.85)'; x.strokeText(txt, W / 2, H / 2 + dy); x.fillStyle = col; x.shadowColor = o.glow || 'rgba(255,40,20,0.7)'; x.shadowBlur = o.blur == null ? 30 : o.blur; x.fillText(txt, W / 2, H / 2 + dy); x.shadowBlur = 0; }); x.restore(); }; }

// ---------- main draw ----------
function draw(t) {
  const sh = findShot(Math.min(t, TL.total - 1e-4)); const lt = sh.c0 + (t - sh.start); const u = lt / sh.d; const wt = sh.tw ? sh.tw(lt) : lt;
  const S = getSet(sh.set);
  if (!CUR || CUR.idx !== sh.idx) { if (CUR) CUR.F.dispose(); CUR = { idx: sh.idx, F: makeF(sh, S) }; }
  const F = CUR.F; F.shake = 0; F.flash = 0; F.lines = 0; F.rays = 0; F.dark = 0; for (const p of S.L.pts) p.intensity = 0;
  applyLight(S, sh.L || 'day', sh.Lk == null ? 1 : sh.Lk);
  if (sh.moon) { const m = sh.moon; S.moon.visible = true; S.moon.position.set(m.p[0], m.p[1], m.p[2]); S.moon.scale.setScalar(m.s || 30); const red = typeof m.red === 'function' ? m.red(lt, u) : (m.red || 0);
    S.moon.userData.disc.material.color.copy(C(0xf4f0ff).lerp(C(0xff2a1a), red)); S.moon.userData.glow.material.color.copy(C(0x8090c0).lerp(C(0xff1a0a), red)); S.moon.lookAt(0, 0, 0); } else S.moon.visible = false;
  placeActors(sh, S, wt, lt); S.scene.updateMatrixWorld();
  placeCamera(sh, lt, u); if (window.CAMOVR) { const c = window.CAMOVR(sh, lt); if (c) { CAM.position.set(c.p[0], c.p[1], c.p[2]); CAM.fov = c.fov || CAM.fov; CAM.updateProjectionMatrix(); CAM.lookAt(c.l[0], c.l[1], c.l[2]); } } sh.camPos = CAM.position;
  sh._st = sh._st || sh.st || {}; const st = {}; for (const k in sh._st) { const v = sh._st[k]; st[k] = typeof v === 'function' ? v(lt, u) : v; } sh.st = st;
  S.update(sh, sh.tw ? sh.start + wt : t, wt);
  S.scene.updateMatrixWorld();
  F._lt = wt; F.rt = lt; if (sh.fx) sh.fx(F, wt, wt / sh.d, t);
  if (F.shake > 0) { const s = F.shake; CAM.position.x += noise1(t * 31) * s; CAM.position.y += noise1(t * 27 + 3) * s; CAM.rotation.z += noise1(t * 23 + 7) * s * 0.3; }
  RND.render(S.scene, CAM);
  OX.globalAlpha = 1; OX.globalCompositeOperation = 'source-over'; if (QS.get('blit') === 'direct') OX.drawImage(GLC, 0, 0, W, H);
  else { const gl = RND.getContext(); if (!draw.buf) { draw.buf = new Uint8ClampedArray(GLW * GLH * 4); draw.tmp = document.createElement('canvas'); draw.tmp.width = GLW; draw.tmp.height = GLH; draw.tx = draw.tmp.getContext('2d', { willReadFrequently: true }); draw.id = new ImageData(draw.buf, GLW, GLH); }
    gl.readPixels(0, 0, GLW, GLH, gl.RGBA, gl.UNSIGNED_BYTE, draw.buf); draw.tx.putImageData(draw.id, 0, 0); OX.save(); OX.setTransform(1, 0, 0, -1, 0, H); OX.drawImage(draw.tmp, 0, 0, W, H); OX.restore(); }
  overlay(sh, lt, F, t);
}
window.EP = { FPS, W, H, get DUR() { return TL.total; } };
