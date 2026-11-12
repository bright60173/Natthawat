// Edition 2.1 fight-effects upgrade (owner asked for better fight effects/graphics only):
// black flame = dark core + glowing violet fringe + embers, heavier impacts (debris, cracks, double shockwave,
// zoom punch), layered slash trails, glossy blood crystal, clear water with foam, fight atmosphere,
// afterimage trail and a textured village ground. Loaded after fights.js; overrides FX methods.
'use strict';
const FX2 = { PUR: 0x5a14c8, PUR_HOT: 0xb060ff, FIGHT: new Set([4, 5, 6]) };
(() => {
  const old = Object.assign({}, FX);
  // ---- black flame ----
  FX.blackFlame = function (F, key, bases, lt, o = {}) {
    const n = o.n || 260, h = o.h || 0.7, w = o.w || 0.12, k = o.k == null ? 1 : o.k, life = o.life || 0.7, sz = (o.size || 1);
    if (k <= 0) { for (const s of ['g', 'd', 'e', 'm']) F.hide(key + s); return; }
    const blood = o.glow != null; // Gron's blood power keeps a crimson look
    const g = F.ps(key + 'g', n, { soft: 0.0, order: 7 }), d = F.ps(key + 'd', Math.floor(n * 0.7), { blend: 'normal', soft: 0.35, order: 8 });
    const e = F.ps(key + 'e', Math.floor(n * 0.45), { soft: 0.15, order: 9 }), m = F.ps(key + 'm', Math.max(8, Math.floor(n * 0.12)), { soft: 0.0, order: 9 });
    const B = typeof bases === 'function' ? bases : i => bases[i % bases.length]; const T = lt + (o.seed || 0); const dn = Math.min(1, Math.sqrt(260 / n));
    const gc = rgb(blood ? o.glow : FX2.PUR), hc = rgb(blood ? 0xffb090 : FX2.PUR_HOT), core = blood ? [0.16, 0.0, 0.02] : [0.025, 0.0, 0.05];
    g.set((i, p) => { const b = B(i); const ph = flameP(i, T, p, b.x, b.y, b.z, h * k * 1.05, w * 1.15, life, 1); p.s = (0.3 + hash(i) * 0.3) * (1 - ph * 0.75) * sz * k; p.a = Math.sin(Math.PI * ph) * 0.3 * dn; [p.r, p.g, p.b] = gc; });
    d.set((i, p) => { const b = B(i + 7); const ph = flameP(i + 999, T, p, b.x, b.y, b.z, h * 0.8 * k, w * 0.55, life * 0.9, 2); p.s = (0.2 + hash(i + 3) * 0.22) * (1 - ph) * sz * k; p.a = Math.sin(Math.PI * ph) * 0.97; [p.r, p.g, p.b] = core; });
    // hot fringe: licks on the outside of the core, brightest low, tapering up
    e.set((i, p) => { const b = B(i + 31); const ph = flameP(i + 555, T * 1.25, p, b.x, b.y, b.z, h * 0.95 * k, w * 1.0, life * 0.7, 3); const a = hash(i * 2.9) * TAU, r = w * (0.75 + 0.45 * hash(i + 8)) * (1 - ph * 0.6); p.x = b.x + Math.cos(a) * r + Math.sin(T * 9 + i) * 0.02; p.z = b.z + Math.sin(a) * r;
      p.s = (0.07 + hash(i + 5) * 0.09) * (1 - ph * 0.85) * sz * k; p.a = Math.sin(Math.PI * Math.min(1, ph * 1.4)) * 0.75 * dn; [p.r, p.g, p.b] = hc; });
    // embers that escape upward
    m.set((i, p) => { const b = B(i + 77); const L = 1.2 + hash(i) * 0.9; const ph = ((T / L) + hash(i + 2)) % 1; const a = hash(i + 4) * TAU;
      p.x = b.x + Math.cos(a) * (w + ph * 0.5) + Math.sin(T * 3 + i) * 0.12 * ph; p.y = b.y + ph * h * 2.4 * k; p.z = b.z + Math.sin(a) * (w + ph * 0.5); p.s = (0.035 + hash(i + 6) * 0.04) * sz; p.a = (1 - ph) * (0.6 + 0.4 * Math.sin(T * 14 + i)) * k; [p.r, p.g, p.b] = hc; });
  };
  // ---- heavier impact ----
  FX.impact = function (F, c, lt, t0, o = {}) {
    old.impact(F, c, lt, t0, o); const k = lt - t0;
    FX.burst(F, 'idb' + t0, V3(c.x, Math.max(0.2, c.y * 0.5), c.z), lt, t0, { n: 46, col: 0x2a2018, speed: 6.5, size: 0.17, life: 0.9, grav: 13, up: 1, blend: 'normal' });
    FX.dust(F, 'ids' + t0, V3(c.x, 0.15, c.z), lt, t0 + 0.02, { n: 50, speed: 3.2, size: 1.1, life: 1.1 });
    FX.ring(F, 'ir2' + t0, V3(c.x, 0, c.z), lt, t0 + 0.05, { r: (o.r || 6) * 0.55, life: 0.6, col: o.col || 0xffd0a0, a: 0.6 });
    FX.burst(F, 'ihs' + t0, c, lt, t0, { n: 40, col: 0xffffff, speed: 14, size: 0.07, life: 0.25 });
    // glowing ground cracks that cool down
    const cr = F.add('icr' + t0, () => { const gg = new THREE.Group(); const mat = new THREE.MeshBasicMaterial({ color: o.col || 0xff5020, transparent: true, blending: THREE.AdditiveBlending, depthWrite: false });
      for (let i = 0; i < 9; i++) { let a = i / 9 * TAU + hash(i + t0) * 0.5, x = 0, z = 0; for (let j = 0; j < 3; j++) { const L = 0.5 + hash(i * 3 + j) * 0.9; const pl = new THREE.Mesh(new THREE.PlaneGeometry(L, 0.07 - j * 0.015), mat); pl.rotation.x = -Math.PI / 2; pl.rotation.z = -a; pl.position.set(x + Math.cos(a) * L / 2, 0, z + Math.sin(a) * L / 2); pl.userData.j = j; gg.add(pl); x += Math.cos(a) * L; z += Math.sin(a) * L; a += (hash(i * 5 + j) - 0.5) * 0.9; } }
      gg.userData.mat = mat; return gg; });
    if (k < 0 || k > 2.2) { cr.visible = false; } else { cr.position.set(c.x, 0.05, c.z); const g = ease(clamp(k / 0.18)); cr.scale.setScalar(Math.max(0.01, g)); cr.userData.mat.opacity = k < 0.3 ? 1 : 1 - (k - 0.3) / 1.9; }
    if (k >= 0 && k < 0.22) F.punch = Math.max(F.punch || 0, 1 - k / 0.22);
  };
  // ---- layered slash trail: hot white core + coloured blade + wide soft glow ----
  FX.arc = function (F, key, c, r, lt, t0, o = {}) {
    const life = o.life || 0.28; const k = (lt - t0) / life; const sw = o.sweep || 2.6;
    const g = F.add(key, () => { const gg = new THREE.Group(); const mk = (r0, col, op) => { const m = new THREE.Mesh(new THREE.RingGeometry(r0, 1, 48, 1, 0, sw), new THREE.MeshBasicMaterial({ color: col, transparent: true, blending: o.dark ? THREE.NormalBlending : THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide })); m.userData.op = op; return m; };
      gg.add(mk(0.5, o.col || 0xff3020, 0.35)); gg.add(mk(0.74, o.col || 0xff3020, 1)); gg.add(mk(0.93, o.dark ? 0x1a0628 : 0xffffff, 0.95)); gg.children[0].scale.setScalar(1.12); return gg; });
    if (k < 0 || k > 1) { g.visible = false; return; } g.position.set(c.x, c.y, c.z); const tl = o.tilt || [-1.2, 0, 0]; g.rotation.set(tl[0], tl[1], tl[2] + (o.spin || 3) * k); g.scale.setScalar(r * (0.8 + 0.45 * k));
    g.children.forEach((m, i) => { m.material.opacity = Math.pow(1 - k, i === 2 ? 2.2 : 1) * (o.a || 1) * m.userData.op; });
    FX.burst(F, key + 's', V3(c.x, c.y, c.z), lt, t0 + life * 0.3, { n: 24, col: o.col || 0xff6040, speed: 5, size: 0.08, life: 0.35 });
  };
  // ---- blood power: glossy crimson crystal ----
  const BLOODM = () => FX2.bm || (FX2.bm = new THREE.MeshPhongMaterial({ color: 0xb0101c, emissive: 0x5a0008, specular: 0xffc0c0, shininess: 110, flatShading: true }));
  const HALO = (op) => new THREE.MeshBasicMaterial({ color: 0xff1530, transparent: true, opacity: op, blending: THREE.AdditiveBlending, depthWrite: false });
  FX.spear = function (F, key, a, b, lt, t0, dur, o = {}) {
    const g = F.add(key, () => { const gg = new THREE.Group(); const core = new THREE.Mesh(new THREE.ConeGeometry(0.1, 1.9, 5), BLOODM()); core.rotation.x = Math.PI / 2; gg.add(core);
      const hot = new THREE.Mesh(new THREE.ConeGeometry(0.035, 1.7, 5), basic(0xffd0d0)); hot.rotation.x = Math.PI / 2; gg.add(hot); const halo = new THREE.Mesh(new THREE.ConeGeometry(0.24, 2.4, 8), HALO(0.4)); halo.rotation.x = Math.PI / 2; gg.add(halo);
      const tr = new THREE.Mesh(CYL(0.1, 0.0, 2.6, 8, true), HALO(0.35)); tr.rotation.x = -Math.PI / 2; tr.position.z = -2.1; gg.add(tr); return gg; });
    const k = (lt - t0) / dur; if (k < 0 || (k > 1 && !o.stick)) { g.visible = false; return k; } const kk = clamp(k); const p = a.clone().lerp(b, o.ease ? easeIn(kk) : kk); g.position.copy(p); const dir = b.clone().sub(a).normalize(); g.lookAt(p.clone().add(dir)); g.scale.setScalar(o.s || 1); g.children[3].visible = k < 1; return k;
  };
  FX.whip = function (F, key, a, b, u, o = {}) {
    const g = F.add(key, () => { const gg = new THREE.Group(); gg.add(new THREE.Mesh(new THREE.BufferGeometry(), BLOODM())); gg.add(new THREE.Mesh(new THREE.BufferGeometry(), HALO(0.35))); return gg; });
    const mid = a.clone().lerp(b, 0.5).add(V3(0, o.arc == null ? 1.2 : o.arc, 0)); const curve = new THREE.QuadraticBezierCurve3(a, mid, b);
    const pts = []; const n = 24; for (let i = 0; i <= n; i++) { const s = i / n * clamp(u); const p = curve.getPoint(s); p.y += Math.sin(s * 12 - (F._lt || 0) * 10) * 0.05; pts.push(p); } if (pts.length < 2 || u <= 0.02) { g.visible = false; return; }
    const cv = new THREE.CatmullRomCurve3(pts); g.children.forEach((m, i) => { m.geometry.dispose(); m.geometry = new THREE.TubeGeometry(cv, 40, (o.r || 0.05) * (i ? 2.6 : 1), 6, false); });
  };
  FX.cage = function (F, key, c, u, thorn = 0, o = {}) {
    const g = F.add(key, () => { const gg = new THREE.Group(); const m = BLOODM(), m2 = HALO(0.4);
      for (let i = 0; i < 10; i++) { const a = i / 10 * TAU; const b = new THREE.Group(); b.add(new THREE.Mesh(CYL(0.035, 0.06, 2.6, 5), m)); b.add(new THREE.Mesh(CYL(0.1, 0.12, 2.7, 6), m2)); for (let j = 0; j < 4; j++) { const th = new THREE.Mesh(CONE(0.035, 0.38, 4), m); th.position.set(0, -0.9 + j * 0.6, 0); th.rotation.z = Math.PI / 2 * (j % 2 ? 1 : -1); th.rotation.y = a; th.userData.th = 1; b.add(th); } b.userData.a = a; gg.add(b); } return gg; });
    g.position.set(c.x, c.y, c.z); g.children.forEach(b => { const a = b.userData.a; const r = lerp(2.2, o.r || 0.5, ease(u)); b.position.set(Math.cos(a) * r, 1.3, Math.sin(a) * r); b.rotation.set(Math.sin(a) * (1 - u) * 0.6 + Math.sin(a) * 0.1, 0, -Math.cos(a) * (1 - u) * 0.6 - Math.cos(a) * 0.1); b.scale.set(1, clamp(u * 1.5), 1); b.children.forEach(ch => { if (ch.userData.th) ch.scale.setScalar(thorn); }); });
    FX.glow(F, key + 'gl', V3(c.x, c.y + 1.2, c.z), 3.2 * clamp(u), 0xff1020, 0.35);
  };
  // ---- moon-water: clear crescent with white core, foam droplets ----
  FX.blade = function (F, key, a, b, lt, t0, dur) {
    const g = F.add(key, () => { const gg = new THREE.Group(); const add = (r, col, op) => gg.add(new THREE.Mesh(new THREE.TorusGeometry(0.6, r, 6, 32, Math.PI), new THREE.MeshBasicMaterial({ color: col, transparent: true, opacity: op, blending: THREE.AdditiveBlending, depthWrite: false })));
      add(0.16, 0x1a70ff, 0.35); add(0.07, 0x7fd8ff, 0.9); add(0.025, 0xffffff, 1); return gg; });
    const k = (lt - t0) / dur; FX.burst(F, key + 'f', b, lt, t0 + dur, { n: 70, col: 0xc8f0ff, speed: 5, size: 0.12, life: 0.5, grav: 6 });
    if (k < 0 || k > 1) { g.visible = false; return; } const p = a.clone().lerp(b, k); g.position.copy(p); g.lookAt(b); g.rotateX(Math.PI / 2); g.scale.setScalar(1 + k * 0.6);
    const tr = F.ps(key + 't', 60, { soft: 0.1, order: 9 }); const dir = b.clone().sub(a); tr.set((i, q) => { const s = hash(i) * 0.35; const pp = a.clone().lerp(b, Math.max(0, k - s)); q.x = pp.x + (hash(i + 1) - 0.5) * 0.9; q.y = pp.y + (hash(i + 2) - 0.5) * 0.5; q.z = pp.z + (hash(i + 3) - 0.5) * 0.9; q.s = 0.06 + hash(i + 4) * 0.08; q.a = (1 - s / 0.35) * 0.9; q.r = 0.75; q.g = 0.93; q.b = 1; });
  };
  FX.waterWall = function (F, key, c, ang, wdt, hgt, u, o = {}) {
    const m = F.add(key, () => { const geo = new THREE.PlaneGeometry(1, 1, 32, 20); const mat = new THREE.ShaderMaterial({ transparent: true, depthWrite: false, side: THREE.DoubleSide, uniforms: { t: { value: 0 }, col: { value: C(o.col || 0x3aa8ff) }, crack: { value: 0 } },
      vertexShader: 'varying vec2 vU; uniform float t; void main(){ vU=uv; vec3 p=position; p.z+=sin(p.x*12.0+t*5.0)*0.025+sin(p.y*9.0-t*4.0)*0.025; gl_Position=projectionMatrix*modelViewMatrix*vec4(p,1.0); }',
      fragmentShader: 'varying vec2 vU; uniform float t; uniform vec3 col; uniform float crack; float h(vec2 p){return fract(sin(dot(p,vec2(12.9898,78.233)))*43758.5453);} void main(){ float w=sin(vU.y*38.0-t*8.0+sin(vU.x*10.0+t)*2.0)*0.5+0.5; float w2=sin(vU.x*23.0+t*3.0+sin(vU.y*7.0)*3.0)*0.5+0.5; float edge=smoothstep(0.0,0.06,vU.x)*smoothstep(1.0,0.94,vU.x); float top=smoothstep(1.0,0.9,vU.y); float rim=1.0-smoothstep(0.0,0.12,min(vU.x,1.0-vU.x)); float foam=smoothstep(0.86,0.98,vU.y)*(0.6+0.4*w2); float a=(0.22+0.28*w*w2)*edge*top+rim*0.35*top+foam*0.8; vec3 c=col*0.8+vec3(0.7,0.9,1.0)*(pow(w,10.0)*0.7+rim*0.5)+vec3(1.0)*foam; float sp=step(0.996,h(floor(vU*vec2(60.0,40.0))+floor(t*12.0))); c+=vec3(1.0)*sp; a=max(a,sp*top); if(crack>0.0){ float cr=step(0.985-crack*0.1,h(floor(vU*vec2(30.0,20.0)))); c+=vec3(1.0)*cr; a*=1.0-crack*0.6; } gl_FragColor=vec4(c,a); }' });
      return new THREE.Mesh(geo, mat); });
    m.material.uniforms.t.value = F.sh.start + (F._lt || 0); m.material.uniforms.crack.value = o.crack || 0; m.position.set(c.x, c.y + hgt * u / 2, c.z); m.rotation.y = ang; m.scale.set(wdt, Math.max(0.01, hgt * u), 1);
    const sp = F.ps(key + 'sp', 90, { soft: 0.1, order: 9 }); const T = F._lt || 0; sp.set((i, q) => { const ph = ((T * 0.9) + hash(i)) % 1; const x = (hash(i + 1) - 0.5) * wdt; q.x = c.x + Math.cos(ang) * x; q.z = c.z - Math.sin(ang) * x; q.y = c.y + hgt * u * (0.85 + ph * 0.3); q.s = 0.05 + hash(i + 2) * 0.06; q.a = u > 0.1 ? (1 - ph) * 0.8 : 0; q.r = 0.85; q.g = 0.96; q.b = 1; });
  };
  // ---- fight atmosphere: drifting embers, ash and low smoke around the camera ----
  FX.atmo = function (F, lt, t) {
    const cp = F.sh.camPos || V3(0, 2, 0); const cx = cp.x, cz = cp.z;
    const em = F.ps('atE', 260, { soft: 0.1, order: 6 }); em.set((i, p) => { const R = 9; const L = 3 + hash(i) * 3; const ph = ((t / L) + hash(i + 1)) % 1; p.x = cx + (hash(i + 2) - 0.5) * 2 * R + Math.sin(t * 0.9 + i) * 0.5 + ph * 1.5; p.z = cz + (hash(i + 3) - 0.5) * 2 * R; p.y = ph * 6; p.s = 0.03 + hash(i + 4) * 0.05; p.a = Math.sin(Math.PI * ph) * (0.5 + 0.5 * Math.sin(t * 7 + i)); const v = hash(i + 5) < 0.35; p.r = v ? 0.75 : 1; p.g = v ? 0.35 : 0.45; p.b = v ? 1 : 0.15; });
    const sm = F.ps('atS', 34, { blend: 'normal', soft: 0.0, order: 5 }); sm.set((i, p) => { const R = 11; p.x = cx + (hash(i + 7) - 0.5) * 2 * R + Math.sin(t * 0.2 + i) * 1.5 + t * 0.15 % 6; p.z = cz + (hash(i + 8) - 0.5) * 2 * R; p.y = 0.4 + hash(i + 9) * 1.6; p.s = 3 + hash(i + 10) * 3; p.a = 0.12; p.r = 0.07; p.g = 0.05; p.b = 0.07; });
  };
  // ---- village ground texture (dirt, pebbles, worn patches) and plaza cobbles ----
  const texOf = (draw, rep) => { const cv = document.createElement('canvas'); cv.width = cv.height = 512; const x = cv.getContext('2d'); draw(x); const tx = new THREE.CanvasTexture(cv); tx.wrapS = tx.wrapT = THREE.RepeatWrapping; tx.repeat.set(rep, rep); tx.anisotropy = 4; return tx; };
  const dirt = x => { x.fillStyle = '#e8e8e8'; x.fillRect(0, 0, 512, 512); for (let i = 0; i < 1400; i++) { const r = 2 + hash(i) * 26; const v = 170 + Math.floor(hash(i + 1) * 85); x.fillStyle = `rgba(${v},${v},${v - 6},0.35)`; x.beginPath(); x.arc(hash(i + 2) * 512, hash(i + 3) * 512, r, 0, TAU); x.fill(); }
    for (let i = 0; i < 500; i++) { const v = 120 + Math.floor(hash(i + 9) * 60); x.fillStyle = `rgb(${v},${v - 4},${v - 10})`; x.beginPath(); x.ellipse(hash(i + 4) * 512, hash(i + 5) * 512, 1.5 + hash(i + 6) * 3, 1 + hash(i + 7) * 2, hash(i + 8) * 3, 0, TAU); x.fill(); } };
  const cobble = x => { x.fillStyle = '#9a9a9a'; x.fillRect(0, 0, 512, 512); const n = 12, s = 512 / n; for (let j = 0; j < n; j++) for (let i = 0; i < n; i++) { const v = 200 + Math.floor(hash(i * 13 + j) * 55); x.fillStyle = `rgb(${v},${v},${v - 4})`; const o = (j % 2) * s / 2; x.beginPath(); x.roundRect ? x.roundRect(i * s + o + 3, j * s + 3, s - 6, s - 6, 8) : x.rect(i * s + o + 3, j * s + 3, s - 6, s - 6); x.fill(); } };
  const ob = BUILD.village; BUILD.village = function () { const S = ob(); const td = texOf(dirt, 22), tc = texOf(cobble, 5);
    S.scene.traverse(m => { if (!m.isMesh || !m.material || !m.material.isMeshLambertMaterial) return; if (m.material === S.groundMat) { m.material = m.material.clone(); m.material.map = td; S.groundMat = m.material; }
      else if (m.geometry.type === 'CylinderGeometry' && m.geometry.parameters.radiusTop === 7 && m.geometry.parameters.height < 0.1) { m.material = m.material.clone(); m.material.map = tc; } });
    return S; };
  // ---- hook every shot in the fight scenes: atmosphere + afterimage flags ----
  for (const sc of STORY) if (FX2.FIGHT.has(sc.id)) for (const sh of sc.shots) if (sh.set === 'village' || sh.set === 'forest') {
    const f0 = sh.fx; const hot = !!(sh.imp || sh.name || sh.tw || (sh.m && /battle|wings|magic/.test(sh.m)));
    sh.fx = function (F, lt, u, t) { if (f0) f0.call(this, F, lt, u, t); if (hot) FX.atmo(F, lt, t); F.trail = hot ? 0.3 : 0; };
  }
  // ---- 2D post: afterimage trail + zoom punch on impacts ----
  window.POSTFX = function (sh, lt, F, t) {
    const P = window.POSTFX; if (!P.prev) { P.prev = document.createElement('canvas'); P.prev.width = W / 2; P.prev.height = H / 2; P.px = P.prev.getContext('2d'); P.lastT = -1; }
    const cont = Math.abs(t - P.lastT - 1 / FPS) < 1e-3 && P.lastIdx === sh.idx; const moving = (F.lines || 0) > 0 || (F.shake || 0) > 0.05 || (sh.tw && sh.tw(lt) - lt !== 0);
    if (F.trail > 0 && cont) { OX.save(); OX.globalAlpha = F.trail * (moving ? 1.2 : 0.7); OX.globalCompositeOperation = 'lighten'; OX.drawImage(P.prev, 0, 0, W, H); OX.restore(); }
    if (F.punch > 0) { const s = 1 + 0.06 * F.punch; OX.save(); OX.globalAlpha = 0.4 * F.punch; OX.globalCompositeOperation = 'screen'; OX.drawImage(OUT, W * (1 - s) / 2, H * (1 - s) / 2, W * s, H * s); OX.globalAlpha = 0.25 * F.punch; const s2 = 1 + 0.12 * F.punch; OX.drawImage(OUT, W * (1 - s2) / 2, H * (1 - s2) / 2, W * s2, H * s2); OX.restore(); }
    P.px.drawImage(OUT, 0, 0, W / 2, H / 2); P.lastT = t; P.lastIdx = sh.idx; F.punch = 0;
  };
})();
