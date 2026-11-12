// Edition 3 fight rebuild (scenes 4-6 only): toon flame tongues, slash crescents, new flame wolf,
// keyframed fight poses with anticipation / snap / follow-through, and a fight camera director.
'use strict';
(() => {
  const FIGHT = sh => FX2.FIGHT.has(sh.sceneId) && (sh.set === 'village' || sh.set === 'forest');
  const back = u => { u = clamp(u); const c = 1.9; return 1 + (c + 1) * Math.pow(u - 1, 3) + c * Math.pow(u - 1, 2); };
  // ================= toon flame tongues (point sprites with a drawn flame silhouette) =================
  const TG_VS = `attribute float size; attribute float alpha; attribute float seed; attribute vec3 pcol; varying float vA; varying float vS; varying vec3 vC; uniform float scale;
void main(){ vA=alpha; vS=seed; vC=pcol; vec4 mv=modelViewMatrix*vec4(position,1.0); gl_PointSize=min(700.0,size*scale/max(0.05,-mv.z)); gl_Position=projectionMatrix*mv; }`;
  const TG_FS = `varying float vA; varying float vS; varying vec3 vC; uniform float t; uniform vec3 core; uniform vec3 hot;
void main(){ vec2 p=gl_PointCoord; float y=1.0-p.y; float x=(p.x-0.5)*2.0; float ph=vS*37.0;
 float sd=fract(vS*7.0)>0.5?1.0:-1.0; x+=sd*y*y*0.55*(0.6+0.4*sin(t*5.0+ph))+sin(y*6.0+ph+t*10.0)*0.13*y+sin(y*13.0-t*15.0+ph*2.0)*0.05*y;
 float w=pow(y,0.5)*pow(1.0-y,1.15)*1.45+0.012; float d=abs(x)/w; if(d>1.0||vA<0.01) discard;
 float e=d*0.8+y*0.75+0.08*sin(y*18.0+ph); vec3 c=e<0.5?core:(e<0.82?vC:hot); gl_FragColor=vec4(c,vA); }`;
  class Tongues { constructor(n) { this.n = n; const g = new THREE.BufferGeometry(); this.pos = new Float32Array(n * 3); this.size = new Float32Array(n); this.alpha = new Float32Array(n); this.seed = new Float32Array(n); this.col = new Float32Array(n * 3);
      for (let i = 0; i < n; i++) this.seed[i] = hash(i * 3.71 + 0.2);
      g.setAttribute('position', new THREE.BufferAttribute(this.pos, 3)); g.setAttribute('size', new THREE.BufferAttribute(this.size, 1)); g.setAttribute('alpha', new THREE.BufferAttribute(this.alpha, 1)); g.setAttribute('seed', new THREE.BufferAttribute(this.seed, 1)); g.setAttribute('pcol', new THREE.BufferAttribute(this.col, 3));
      this.mat = new THREE.ShaderMaterial({ vertexShader: TG_VS, fragmentShader: TG_FS, transparent: true, depthWrite: false, uniforms: { scale: { value: GLH * 0.5 * 2.75 }, t: { value: 0 }, core: { value: C(0x06000c) }, hot: { value: C(0xd8a8ff) } } });
      this.pts = new THREE.Points(g, this.mat); this.pts.frustumCulled = false; this.pts.renderOrder = 8; this.g = g; }
    set(fn) { const o = { x: 0, y: 0, z: 0, s: 0, a: 0, r: 1, g: 1, b: 1 }; for (let i = 0; i < this.n; i++) { o.s = 0; o.a = 0; fn(i, o); const j = i * 3; this.pos[j] = o.x; this.pos[j + 1] = o.y; this.pos[j + 2] = o.z; this.size[i] = o.s; this.alpha[i] = o.a; this.col[j] = o.r; this.col[j + 1] = o.g; this.col[j + 2] = o.b; }
      for (const k of ['position', 'size', 'alpha', 'pcol']) this.g.attributes[k].needsUpdate = true; } }
  FX.tongues = (F, key, n) => F.add(key, () => new Tongues(n));
  const PAL = { pur: [0x05000a, 0x6420d8, 0xb880ff, 0x4a10b0], blood: [0x2a0006, 0xe01428, 0xffb0a0, 0xa00818], fire: [0xff7a10, 0xffb020, 0xfff0a0, 0xff5010], water: [0x1a6ad0, 0x58c4ff, 0xf0fbff, 0x2a8cff] };
  // generic toon flame: bases(i)->Vector3; o: n,h,w,k,life,size,pal,drift(Vector3)
  FX.toonFlame = function (F, key, bases, lt, o = {}) {
    const n = o.n || 260, h = o.h || 0.7, w = o.w || 0.12, k = o.k == null ? 1 : o.k, life = o.life || 0.7, sz = o.size || 1; const keys = ['T', 'G', 'E'];
    if (k <= 0) { for (const s of keys) F.hide(key + s); return; }
    const pal = PAL[o.pal || 'pur']; const nt = Math.max(10, Math.floor(n * 0.42)); const T = FX.tongues(F, key + 'T', nt), G = F.ps(key + 'G', Math.max(6, Math.floor(n * 0.1)), { soft: 0.0, order: 7 }), E = F.ps(key + 'E', Math.max(8, Math.floor(n * 0.16)), { soft: 0.2, order: 9 });
    T.mat.uniforms.t.value = lt; T.mat.uniforms.core.value.set(pal[0]); T.mat.uniforms.hot.value.set(pal[2]); const B = typeof bases === 'function' ? bases : i => bases[i % bases.length]; const tm = lt + (o.seed || 0); const dr = o.drift;
    const rc = rgb(pal[1]), gc = rgb(pal[3]), hc = rgb(pal[2]); const dn = Math.min(1, Math.sqrt(200 / n));
    T.set((i, p) => { const b = B(i); const ph = flameP(i, tm, p, b.x, b.y, b.z, h * k * 0.75, w, life, 1); if (dr) { p.x += dr.x * ph; p.y += dr.y * ph; p.z += dr.z * ph; }
      const g = Math.sin(Math.PI * Math.pow(ph, 0.55)); p.s = (0.3 + hash(i + 2) * hash(i + 9) * 0.75) * (0.35 + 0.65 * g) * Math.min(2.2, sz * k * (0.1 + h * 0.34)); p.y += p.s * 0.3; p.a = ph > 0.86 ? (1 - ph) / 0.14 : Math.min(1, ph / 0.06); [p.r, p.g, p.b] = rc; });
    G.set((i, p) => { const b = B(i * 5 + 3); p.x = b.x; p.y = b.y + h * k * 0.3; p.z = b.z; p.s = (1.1 + hash(i) * 0.8) * sz * k * (0.35 + h * 0.5); p.a = (0.09 + 0.03 * Math.sin(tm * 11 + i)) * dn; [p.r, p.g, p.b] = gc; });
    E.set((i, p) => { const b = B(i * 3 + 11); const ph = flameP(i + 555, tm * 0.8, p, b.x, b.y, b.z, h * k * 2.2, w * 2.2, life * 1.8, 3); if (dr) { p.x += dr.x * ph * 1.6; p.z += dr.z * ph * 1.6; } p.x += Math.sin(tm * 4 + i) * 0.1 * ph; p.s = (0.035 + hash(i + 5) * 0.05) * sz * (1 - ph * 0.6); p.a = Math.sin(Math.PI * ph) * 0.9; [p.r, p.g, p.b] = hc; });
  };
  const oldBF = FX.blackFlame;
  FX.blackFlame = function (F, key, bases, lt, o = {}) { if (!FIGHT(F.sh)) return oldBF.call(this, F, key, bases, lt, o); for (const s of ['g', 'd', 'e', 'm']) F.hide(key + s); FX.toonFlame(F, key, bases, lt, Object.assign({}, o, { pal: o.glow != null ? 'blood' : 'pur' })); };

  // ================= slash crescent (mesh strip with tapered toon bands) =================
  const CR_GEO = (() => { const n = 48, pos = [], uv = [], idx = []; for (let i = 0; i <= n; i++) { const u = i / n; pos.push(u, 0, 0, u, 1, 0); uv.push(u, 0, u, 1); if (i < n) { const a = i * 2; idx.push(a, a + 1, a + 2, a + 1, a + 3, a + 2); } } const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2)); g.setIndex(idx); return g; })();
  const CR_VS = `varying vec2 vU; uniform float sweep; uniform float head; void main(){ vU=uv; float a=(uv.x-0.5)*sweep+head; float tp=pow(sin(3.14159*uv.x),0.6); float r=1.0-(1.0-uv.y)*0.34*tp; vec3 p=vec3(cos(a)*r,sin(a)*r,0.0); gl_Position=projectionMatrix*modelViewMatrix*vec4(p,1.0); }`;
  const CR_FS = `varying vec2 vU; uniform vec3 col; uniform vec3 hot; uniform float op; uniform float dark; void main(){ float tail=smoothstep(0.0,0.75,vU.x); float v=vU.y; float edge=smoothstep(0.0,0.12,v)*smoothstep(1.0,0.94,v); float a=op*tail*edge; if(a<0.02) discard; vec3 c=v>0.62?hot:(v>0.3?col:mix(col*0.35,vec3(0.02,0.0,0.04),dark)); gl_FragColor=vec4(c,v>0.3?a:a*0.8); }`;
  FX.crescent = function (F, key, c, r, lt, t0, o = {}) { const life = o.life || 0.3; const k = (lt - t0) / life; const m = F.add(key, () => { const mm = new THREE.Mesh(CR_GEO, new THREE.ShaderMaterial({ vertexShader: CR_VS, fragmentShader: CR_FS, transparent: true, depthWrite: false, side: THREE.DoubleSide, uniforms: { sweep: { value: 2.6 }, head: { value: 0 }, col: { value: C(0xffffff) }, hot: { value: C(0xffffff) }, op: { value: 1 }, dark: { value: 0 } } })); mm.frustumCulled = false; mm.renderOrder = 10; return mm; });
    if (k < 0 || k > 1) { m.visible = false; return; } const U = m.material.uniforms; const col = C(o.col || 0xb060ff); U.col.value.copy(col); U.hot.value.copy(col).lerp(C(0xffffff), 0.8); U.dark.value = o.dark ? 1 : 0; U.sweep.value = (o.sweep || 2.6) * Math.min(1, 0.35 + k * 2.2); U.head.value = (o.spin || 3) * easeOut(k) * 0.6; U.op.value = k < 0.5 ? 1 : (1 - k) * 2;
    m.position.set(c.x, c.y, c.z); const tl = o.tilt || [-1.2, 0, 0]; m.rotation.set(tl[0], tl[1], tl[2]); m.scale.setScalar(r * (0.9 + 0.35 * easeOut(k))); };
  const arc2 = FX.arc; FX.arc = function (F, key, c, r, lt, t0, o = {}) { if (!FIGHT(F.sh)) return arc2.call(this, F, key, c, r, lt, t0, o); FX.crescent(F, key + 'c', c, r * 1.15, lt, t0, o); FX.crescent(F, key + 'c2', c, r * 0.9, lt, t0 + 0.03, Object.assign({}, o, { life: (o.life || 0.28) * 0.8 })); };

  // ================= impact extras: star flash + ink spikes + shock dome =================
  const SPK_GEO = (() => { const n = 14, pos = []; for (let i = 0; i < n; i++) { const a = hash(i * 1.3) * TAU, b = (hash(i + 4) - 0.5) * 2.2, L = 0.6 + hash(i + 7) * 0.9, w = 0.035 + hash(i + 9) * 0.05; const d = V3(Math.cos(a) * Math.cos(b), Math.sin(b), Math.sin(a) * Math.cos(b)); const s = V3(-d.z, 0, d.x).normalize().multiplyScalar(w); const p0 = d.clone().multiplyScalar(0.25), p1 = d.clone().multiplyScalar(0.25 + L); pos.push(p0.x + s.x, p0.y + w, p0.z + s.z, p0.x - s.x, p0.y - w, p0.z - s.z, p1.x, p1.y, p1.z); } const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); return g; })();
  const DOME_FS = 'varying vec3 vN; varying vec3 vV; uniform vec3 col; uniform float op; void main(){ float f=pow(1.0-abs(dot(normalize(vN),normalize(vV))),2.2); float a=f*op; if(a<0.01) discard; gl_FragColor=vec4(col+vec3(f*0.5),a); }';
  const DOME_VS = 'varying vec3 vN; varying vec3 vV; void main(){ vN=normalMatrix*normal; vec4 mv=modelViewMatrix*vec4(position,1.0); vV=-mv.xyz; gl_Position=projectionMatrix*mv; }';
  const imp2 = FX.impact; FX.impact = function (F, c, lt, t0, o = {}) { imp2.call(this, F, c, lt, t0, o); if (!FIGHT(F.sh)) return; const k = lt - t0; const col = o.col || 0xffffff;
    const sp = F.add('isk' + t0, () => { const m = new THREE.Mesh(SPK_GEO, new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, side: THREE.DoubleSide, depthWrite: false })); m.renderOrder = 11; return m; });
    if (k < 0 || k > 0.22) sp.visible = false; else { sp.position.copy(c); sp.scale.setScalar((0.7 + k * 9) * (o.g || 2.5) * 0.45); sp.material.opacity = 1 - k / 0.22; sp.material.color.set(k < 0.05 ? 0xffffff : col).lerp(C(0xffffff), 0.5); }
    const dm = F.add('idm' + t0, () => { const m = new THREE.Mesh(SPH(1, 24, 16), new THREE.ShaderMaterial({ vertexShader: DOME_VS, fragmentShader: DOME_FS, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, uniforms: { col: { value: C(col) }, op: { value: 1 } } })); m.renderOrder = 10; return m; });
    if (k < 0 || k > 0.4) dm.visible = false; else { dm.position.copy(c); dm.scale.setScalar(0.3 + easeOut(k / 0.4) * (o.r || 6) * 0.42); dm.material.uniforms.op.value = (1 - k / 0.4) * 0.9; dm.material.uniforms.col.value.set(col); } };
  window.FX3 = { FIGHT, back, PAL };
})();
// ================= the flame wolf: new body, gallop / roar / crouch, body made of fire =================
(() => {
  const oldBuild = buildWolf;
  buildWolf = function () {
    const g = new THREE.Group(); const J = {}; const m = basic(0x0b0714); const rim = outlineMat(0.02, 0x9040f0); const bone = basic(0xf4ecff), glow = basic(0xe8c0ff);
    const part = (geo, x, y, z, s, r, mat) => { const o = new THREE.Group(); o.add(new THREE.Mesh(geo, mat || m)); if (!mat) o.add(new THREE.Mesh(geo, rim)); at(o, x, y, z, s); if (r) rot(o, r[0], r[1], r[2]); return o; };
    const grp = (par, x, y, z) => { const o = new THREE.Group(); o.position.set(x, y, z); par.add(o); return o; };
    const body = grp(g, 0, 0.74, 0); J.body = body;
    const chest = grp(body, 0, 0, 0.3); J.chest = chest; chest.add(part(SPH(0.36, 16, 12), 0, 0.02, 0, [0.92, 1.12, 1.2])); chest.add(part(SPH(0.26, 12, 10), 0, -0.2, 0.12, [0.8, 0.8, 1.0]));
    const loin = grp(body, 0, 0, -0.12); J.loin = loin; loin.add(part(SPH(0.27, 14, 10), 0, 0.03, -0.1, [0.82, 0.86, 1.5])); loin.add(part(SPH(0.3, 14, 10), 0, 0.02, -0.5, [0.95, 1.0, 1.0]));
    // mane spikes along the neck and spine
    for (let i = 0; i < 9; i++) { const u = i / 8; const sp = part(CONE(0.1 - u * 0.04, 0.5 - u * 0.24, 5), 0, 0.3 + (1 - u) * 0.14, 0.42 - u * 1.0, 1, [-1.0 - u * 0.35, 0, 0]); body.add(sp); for (const s of [-1, 1]) if (i < 6) body.add(part(CONE(0.07, 0.36 - u * 0.15, 5), s * 0.2, 0.2 + (1 - u) * 0.08, 0.4 - u * 0.9, 1, [-1.15, 0, -s * 0.7])); }
    const neck = grp(chest, 0, 0.12, 0.26); J.neck = neck; neck.add(part(CYL(0.2, 0.3, 0.4, 10), 0, 0.08, 0.14, 1, [1.05, 0, 0])); for (let i = 0; i < 8; i++) { const a = i / 8 * TAU; neck.add(part(CONE(0.08, 0.36, 4), Math.cos(a) * 0.2, 0.06 + Math.sin(a) * 0.2, 0.06, 1, [-1.57 + Math.sin(a) * 0.55, 0, -Math.cos(a) * 0.55])); }
    const head = grp(neck, 0, 0.2, 0.36); J.head = head; head.scale.setScalar(1.32);
    head.add(part(SPH(0.21, 14, 12), 0, 0, 0, [1.0, 0.86, 1.1])); head.add(part(CYL(0.065, 0.14, 0.42, 7), 0, -0.035, 0.36, [1, 1, 0.8], [1.5, 0, 0])); head.add(part(SPH(0.05, 8, 6), 0, 0.0, 0.57, [1.1, 0.8, 1]));
    head.add(part(BOX(0.34, 0.05, 0.2), 0, 0.1, 0.14, 1, [0.35, 0, 0]));
    for (const s of [-1, 1]) { head.add(part(CONE(0.075, 0.34, 4), s * 0.13, 0.25, -0.08, 1, [-0.35, 0, -s * 0.28])); for (let i = 0; i < 3; i++) head.add(part(CONE(0.055, 0.3 - i * 0.05, 4), s * (0.17 + i * 0.01), -0.02 - i * 0.07, -0.08 - i * 0.02, 1, [-1.3, 0, -s * (1.1 + i * 0.25)]));
      const e = new THREE.Mesh(SPH(0.04, 8, 6), glow); at(e, s * 0.105, 0.055, 0.17, [1.9, 0.55, 0.7]); e.rotation.z = s * 0.45; head.add(e); const eh = new THREE.Mesh(SPH(0.11, 8, 6), new THREE.MeshBasicMaterial({ color: 0x9a40ff, transparent: true, opacity: 0.5, blending: THREE.AdditiveBlending, depthWrite: false })); at(eh, s * 0.105, 0.055, 0.18); head.add(eh);
      for (let i = 0; i < 4; i++) head.add(part(CONE(i === 0 ? 0.022 : 0.014, i === 0 ? 0.12 : 0.06, 4), s * (0.075 - i * 0.004), -0.1, 0.5 - i * 0.075, 1, [Math.PI, 0, 0], bone)); }
    const jaw = grp(head, 0, -0.1, 0.1); J.jaw = jaw; jaw.add(part(CYL(0.05, 0.11, 0.4, 6), 0, -0.02, 0.21, [1, 1, 0.55], [1.56, 0, 0])); jaw.add(part(BOX(0.1, 0.012, 0.3), 0, 0.03, 0.2, 1, null, basic(0x7a2cf0)));
    for (const s of [-1, 1]) for (let i = 0; i < 4; i++) jaw.add(part(CONE(i === 0 ? 0.018 : 0.012, i === 0 ? 0.1 : 0.05, 4), s * (0.06 - i * 0.004), 0.05, 0.38 - i * 0.075, 1, null, bone));
    const leg = (key, par, x, y, z, hind) => { const up = grp(par, x, y, z); J['leg' + key] = up; up.add(part(SPH(0.15, 10, 8), 0, -0.12, hind ? -0.03 : 0, hind ? [0.75, 1.5, 1.25] : [0.7, 1.45, 0.95])); up.add(part(CYL(0.09, 0.065, 0.26, 8), 0, -0.24, 0));
      const lo = grp(up, 0, -0.36, 0); J['kn' + key] = lo; lo.add(part(CYL(0.065, 0.05, 0.3, 8), 0, -0.15, 0)); const paw = grp(lo, 0, -0.3, 0); J['paw' + key] = paw; paw.add(part(SPH(0.1, 8, 6), 0, 0, 0.05, [1.1, 0.6, 1.6])); for (let i = -1; i <= 1; i++) paw.add(part(CONE(0.018, 0.1, 4), i * 0.045, -0.01, 0.19, 1, [1.75, 0, 0], bone)); };
    leg('FL', chest, 0.2, -0.12, 0.08, 0); leg('FR', chest, -0.2, -0.12, 0.08, 0); leg('BL', loin, 0.19, -0.08, -0.52, 1); leg('BR', loin, -0.19, -0.08, -0.52, 1);
    let tp = grp(loin, 0, 0.14, -0.74); J.tail = tp; J.tails = [tp]; for (let i = 0; i < 4; i++) { tp.add(part(CONE(0.19 - i * 0.03, 0.46, 6), 0, 0, -0.16, 1, [-1.57, 0, 0])); if (i < 3) { tp = grp(tp, 0, 0, -0.3); J.tails.push(tp); } }
    return { g, J, v3: 1 };
  };
  const set = (o, x, y, z) => { if (!o) return; if (x != null) o.rotation.x = x; if (y != null) o.rotation.y = y; if (z != null) o.rotation.z = z; };
  poseWolf = function (w, t, mode, k) {
    const HB = 0.74; const J = w.J; if (!w.v3) return; for (const key in J) if (J[key] && J[key].rotation && key !== 'tails') J[key].rotation.set(0, 0, 0); J.body.position.y = HB; J.body.position.z = 0;
    const legs = (key, hip, knee, paw) => { set(J['leg' + key], hip); set(J['kn' + key], knee); set(J['paw' + key], paw); };
    const stand = () => { legs('FL', 0.12, -0.22, 0.1); legs('FR', 0.12, -0.22, 0.1); legs('BL', -0.35, 0.75, -0.4); legs('BR', -0.35, 0.75, -0.4); };
    const br = Math.sin(t * 2.4) * 0.02; let tailUp = 0.25, tailSw = 0.25, tailSp = 3;
    if (mode === 'run') { const ph = t * 11.5; const c = Math.sin(ph), c2 = Math.sin(ph - 0.5), s2 = Math.cos(ph); // rotary gallop: gather / stretch
      const gF = (o) => { const a = Math.sin(ph + o); legs(o ? 'FR' : 'FL', a * 0.95 - 0.1, -0.55 - 0.75 * Math.max(0, -Math.cos(ph + o)), 0.35 * Math.max(0, a)); };
      const gB = (o) => { const a = Math.sin(ph + Math.PI * 0.85 + o); legs(o ? 'BR' : 'BL', a * 0.85 - 0.25, 0.75 + 0.7 * Math.max(0, Math.cos(ph + Math.PI * 0.85 + o)), -0.4 - 0.3 * a); };
      gF(0); gF(0.45); gB(0); gB(0.4);
      J.body.position.y = HB + Math.abs(s2) * 0.16 - 0.05; set(J.body, c2 * 0.11); set(J.chest, -c * 0.16); set(J.loin, c * 0.2); set(J.neck, 0.28 + c * 0.1); set(J.head, 0.12 - c * 0.08); set(J.jaw, 0.38 + Math.sin(ph * 0.5) * 0.08); tailUp = 0.05 + c * 0.12; tailSw = 0.1; }
    else if (mode === 'roar') { const r = back(k / 0.35), q = Math.sin(t * 46) * 0.03 * clamp(k / 0.2); stand(); legs('FL', -0.32 * r, -0.05, 0.3 * r); legs('FR', -0.25 * r, -0.05, 0.25 * r); legs('BL', -0.55, 1.05, -0.5); legs('BR', -0.5, 0.98, -0.5);
      J.body.position.y = HB - 0.06 * r; set(J.body, -0.2 * r + q); set(J.chest, -0.16 * r); set(J.neck, -0.3 * r); set(J.head, -0.3 * r + q, Math.sin(t * 5) * 0.08 * r); set(J.jaw, 0.95 * r + q * 3); tailUp = 0.75; tailSw = 0.5; tailSp = 9; }
    else if (mode === 'crouch') { legs('FL', -0.75, -0.2 + 0.0, 0.9); legs('FR', -0.62, -0.25, 0.85); legs('BL', -0.5, 1.0, -0.5); legs('BR', -0.55, 1.08, -0.52); J.body.position.y = HB - 0.13 + br; set(J.body, 0.26); set(J.chest, 0.14); set(J.neck, 0.2); set(J.head, 0.06 + Math.sin(t * 1.3) * 0.03, Math.sin(t * 0.9) * 0.12); set(J.jaw, 0.22 + Math.abs(Math.sin(t * 7)) * 0.07); tailUp = 0.55; tailSw = 0.6; tailSp = 5; }
    else { stand(); J.body.position.y = HB + br; set(J.neck, -0.1); set(J.head, 0.05, Math.sin(t * 0.7) * 0.2); set(J.jaw, 0.1); }
    J.tails.forEach((o, i) => { o.rotation.x = (i === 0 ? tailUp : tailUp * 0.5) + Math.sin(t * tailSp - i * 0.7) * 0.08; o.rotation.y = Math.sin(t * tailSp - i * 0.9) * tailSw * (0.4 + i * 0.25); });
  };
  const back = FX3.back;
  // body of fire: tongues along spine, mane, tail, legs; flames stream behind when it moves
  FX.wolfFlame = function (F, key, lt, k = 1, n = 900) { const w = actor('wolf'); if (!w.v3) return; const s = w.g.scale.x; if (s < 0.05) { FX.toonFlame(F, key, [V3(0, 0, 0)], lt, { k: 0 }); return; }
    const P = j => { const v = new THREE.Vector3(); j.getWorldPosition(v); return v; }; const J = w.J; const hd = P(J.head), nk = P(J.neck), ch = P(J.chest), lo = P(J.loin), tl = J.tails.map(P), paws = ['FL', 'FR', 'BL', 'BR'].map(q => [P(J['leg' + q]), P(J['paw' + q])]);
    const up = V3(0, 0.3 * s, 0); const spine = [hd.clone().add(up.clone().multiplyScalar(0.7)), nk.clone().add(up), ch.clone().add(up.clone().multiplyScalar(1.3)), lo.clone().add(up), tl[0].clone().add(up.clone().multiplyScalar(0.5))];
    const ang = w.g.rotation.y; const sp = F.sh.A && F.sh.A.wolf && F.sh.A.wolf.p2 ? 1 : 0; const drift = V3(-Math.sin(ang), 0.1, -Math.cos(ang)).multiplyScalar(sp * 1.5 * s);
    const bases = i => { const u = hash(i * 1.37), r = hash(i * 2.11 + 1); let p; if (u < 0.5) { const q = r * (spine.length - 1), a = Math.floor(q); p = spine[a].clone().lerp(spine[Math.min(spine.length - 1, a + 1)], q - a); } else if (u < 0.72) { const q = r * (tl.length - 1), a = Math.floor(q); p = tl[a].clone().lerp(tl[Math.min(tl.length - 1, a + 1)], q - a); } else if (u < 0.9) { const L = paws[i % 4]; p = L[0].clone().lerp(L[1], r); } else p = hd.clone().lerp(ch, r);
      p.x += (hash(i + 5) - 0.5) * 0.22 * s; p.z += (hash(i + 6) - 0.5) * 0.22 * s; return p; };
    FX.toonFlame(F, key, bases, lt, { n: Math.min(n, 520), h: 0.32 * s, w: 0.05 * s, k, size: 0.44 * s, life: 0.5, drift });
    if (F.S.L.pts[2]) F.light(2, 0x8a40ff, 2.2 * k, ch.x, ch.y + 0.5, ch.z, 9); };
})();
// ================= fight poses: keyframes with anticipation -> snap -> overshoot -> settle =================
(() => {
  const back = FX3.back; let NOW = null, FRAME = 0;
  const ST = { T: [0.2, -0.4, 0], H: [-0.05, 0], sL: [-1.05, 0.25], eL: -1.75, sR: [-0.5, -0.3], eR: -2.0, lL: [-0.6, 0.1], kL: 0.8, lR: [0.5, -0.14], kR: 0.6, hy: -0.14, lg: 0 };
  const K = o => Object.assign({}, ST, o);
  const KF = {
    stance: [[0, ST]],
    punch: [[0, ST], [0.24, K({ T: [0.28, -0.95, 0], sR: [0.35, -0.5], eR: -2.3, sL: [-1.2, 0.2], eL: -1.5, hy: -0.2, lg: -0.12 }), 'out'], [0.4, K({ T: [0.32, 0.8, 0], sR: [-1.5, 0.05], eR: -0.02, sL: [0.45, 0.45], eL: -2.1, lL: [-0.9, 0.1], kL: 1.05, lR: [0.8, -0.1], kR: 0.12, hy: -0.24, lg: 0.5 }), 'in'],
      [0.54, K({ T: [0.34, 0.92, 0], sR: [-1.52, 0.1], eR: 0, sL: [0.5, 0.45], eL: -2.1, lL: [-0.92, 0.1], kL: 1.08, lR: [0.82, -0.1], kR: 0.1, hy: -0.25, lg: 0.56 }), 'out'], [1.0, ST]],
    thrust: [[0, ST], [0.12, K({ T: [0.3, -1.0, 0], sR: [0.4, -0.5], eR: -2.3, hy: -0.22, lg: -0.1 }), 'out'], [0.25, K({ T: [0.36, 0.85, 0], sR: [-1.5, 0.05], eR: 0, sL: [0.5, 0.5], eL: -1.9, lL: [-0.95, 0.1], kL: 1.1, lR: [0.85, -0.1], kR: 0.1, hy: -0.27, lg: 0.6 }), 'in'], [0.42, K({ T: [0.38, 0.95, 0], sR: [-1.5, 0.1], eR: 0, sL: [0.55, 0.5], eL: -1.9, lL: [-0.95, 0.1], kL: 1.1, lR: [0.85, -0.1], kR: 0.1, hy: -0.27, lg: 0.64 }), 'out'], [0.95, ST]],
    uppercut: [[0, ST], [0.16, K({ T: [0.6, -0.65, 0], sR: [0.6, -0.3], eR: -1.9, hy: -0.38, lL: [-0.95, 0.1], kL: 1.55, lR: [0.3, -0.1], kR: 1.25 }), 'out'], [0.29, K({ T: [-0.45, 0.75, 0], H: [-0.3, 0], sR: [-2.95, -0.1], eR: -0.45, sL: [0.5, 0.5], eL: -1.4, hy: 0.22, lL: [-0.2, 0.05], kL: 0.2, lR: [0.5, -0.1], kR: 0.9, lg: 0.35 }), 'in'], [0.5, K({ T: [-0.5, 0.85, 0], H: [-0.35, 0], sR: [-3.0, -0.15], eR: -0.3, sL: [0.55, 0.5], eL: -1.4, hy: 0.3, lL: [-0.1, 0.05], kL: 0.3, lR: [0.6, -0.1], kR: 1.1, lg: 0.4 }), 'out'], [1.0, ST]],
    kick: [[0, ST], [0.12, K({ T: [-0.1, -0.4, 0], lR: [-1.3, -0.1], kR: 2.2, lL: [0.1, 0.05], kL: 0.3, sL: [-0.9, 0.5], sR: [0.4, -0.6], hy: -0.04 }), 'out'], [0.23, K({ T: [-0.5, 0.5, 0], lR: [-1.75, -0.15], kR: 0.03, lL: [0.15, 0.05], kL: 0.2, sL: [-0.3, 0.9], eL: -0.6, sR: [0.7, -0.7], eR: -0.5, hy: 0, lg: 0.3 }), 'in'], [0.4, K({ T: [-0.55, 0.55, 0], lR: [-1.8, -0.15], kR: 0, lL: [0.15, 0.05], kL: 0.2, sL: [-0.3, 0.95], eL: -0.6, sR: [0.7, -0.7], eR: -0.5, hy: 0, lg: 0.34 }), 'out'], [0.85, ST]],
    swing: [[0, ST], [0.32, K({ T: [-0.25, 0.75, 0], sR: [-2.7, -0.35], sL: [-2.5, 0.35], eR: -0.7, eL: -0.7, hy: -0.05, lg: -0.12 }), 'out'], [0.49, K({ T: [0.5, -1.0, 0], sR: [-0.9, 0.25], eR: -0.1, sL: [-0.8, -0.2], eL: -0.3, hy: -0.3, lL: [-0.95, 0.1], kL: 1.1, lR: [0.8, -0.1], kR: 0.2, lg: 0.5 }), 'in'], [0.66, K({ T: [0.55, -1.12, 0], sR: [-0.75, 0.3], eR: -0.05, sL: [-0.65, -0.2], eL: -0.25, hy: -0.32, lL: [-0.98, 0.1], kL: 1.12, lR: [0.82, -0.1], kR: 0.2, lg: 0.55 }), 'out'], [1.2, ST]],
    slash2: [[0, ST], [0.18, K({ T: [-0.25, 0.6, 0], sR: [-2.9, -0.3], eR: -0.8, sL: [-0.9, 0.5], eL: -1.2, lg: -0.1 }), 'out'], [0.29, K({ T: [0.55, -0.85, 0], sR: [-0.55, 0.45], eR: -0.05, sL: [0.4, 0.6], eL: -1.0, hy: -0.3, lL: [-0.95, 0.1], kL: 1.1, lR: [0.8, -0.1], kR: 0.2, lg: 0.45 }), 'in'], [0.45, K({ T: [0.6, -0.95, 0], sR: [-0.4, 0.5], eR: 0, sL: [0.45, 0.6], eL: -1.0, hy: -0.32, lL: [-0.98, 0.1], kL: 1.12, lR: [0.82, -0.1], kR: 0.2, lg: 0.5 }), 'out'], [0.9, ST]],
    dodge: [[0, ST], [0.12, K({ T: [-0.6, 0.5, 0], H: [0.3, 0], sL: [0.4, 0.9], eL: -0.5, sR: [0.4, -0.9], eR: -0.5, lL: [-0.3, 0.1], kL: 0.9, lR: [0.7, -0.1], kR: 0.5, hy: -0.22, lg: -0.55 }), 'out'], [0.5, K({ T: [-0.3, 0.3, 0], sL: [0.2, 0.7], eL: -0.8, sR: [0.2, -0.7], eR: -0.8, hy: -0.2, lg: -0.62 })], [0.9, K({ lg: -0.62 })]],
    stagger: [[0, ST], [0.14, K({ T: [-0.5, 0.25, 0.1], H: [-0.4, 0], sL: [0.3, 0.9], eL: -0.6, sR: [0.5, -0.8], eR: -0.4, lL: [0.4, 0.1], kL: 0.3, lR: [-0.3, -0.1], kR: 0.6, hy: -0.08, lg: -0.4 }), 'out'], [0.6, K({ T: [-0.25, 0.15, 0.05], H: [-0.15, 0], sL: [0.1, 0.6], eL: -0.8, sR: [0.2, -0.5], eR: -0.7, lL: [0.3, 0.1], kL: 0.4, lR: [-0.2, -0.1], kR: 0.5, hy: -0.1, lg: -0.6 })], [1.1, K({ lg: -0.6 })]],
    hit: [[0, ST], [0.1, K({ T: [-0.65, -0.3, 0], H: [-0.5, 0], sL: [-0.6, 1.0], eL: -0.4, sR: [-0.6, -1.0], eR: -0.4, lL: [-0.5, 0.1], kL: 0.4, lR: [0.1, -0.1], kR: 0.6, hy: 0.02, lg: -0.35 }), 'out'], [0.6, K({ T: [-0.5, -0.2, 0], H: [-0.35, 0], sL: [-0.3, 0.8], eL: -0.6, sR: [-0.3, -0.8], eR: -0.6, lL: [-0.4, 0.1], kL: 0.5, lR: [0.15, -0.1], kR: 0.6, hy: -0.04, lg: -0.5 })]],
    block: [[0, ST], [0.1, K({ T: [0.3, -0.3, 0], H: [0.1, 0], sR: [-1.7, 0.3], eR: -1.7, sL: [-1.5, -0.3], eL: -1.6, lL: [-0.75, 0.16], kL: 0.95, lR: [0.65, -0.18], kR: 0.5, hy: -0.22, lg: -0.08 }), 'out']],
  };
  const lerpA = (a, b, u) => typeof a === 'number' ? lerp(a, b, u) : a.map((v, i) => lerp(v, b[i], u));
  const pose0 = pose;
  pose = function (a, act, k, st) {
    const kf = NOW && KF[act]; if (!kf || !a.J || !a.J.kneeL) return pose0(a, act, k, st);
    let i = 0; while (i + 1 < kf.length && kf[i + 1][0] <= k) i++; let P;
    if (i + 1 >= kf.length) P = kf[i][1]; else { const A = kf[i], B = kf[i + 1]; let u = (k - A[0]) / (B[0] - A[0]); const e = B[2]; u = e === 'out' ? easeOut(u) : e === 'in' ? u * u * u : e === 'back' ? back(u) : ease(u); P = {}; for (const key in ST) P[key] = lerpA(A[1][key], B[1][key], u); }
    const J = a.J; const bob = Math.sin(k * 5.2 + (a.hipY || 0) * 7) * 0.5 + 0.5, br = act === 'stance' || act === 'block' ? bob : 0;
    J.torso.rotation.set(P.T[0] + br * 0.03, P.T[1], P.T[2]); J.head.rotation.set(P.H[0], -P.T[1] * 0.85 + P.H[1], 0);
    J.shL.rotation.set(P.sL[0] + br * 0.05, 0, P.sL[1]); J.shR.rotation.set(P.sR[0] + br * 0.04, 0, P.sR[1]); J.elL.rotation.x = P.eL; J.elR.rotation.x = P.eR;
    J.legL.rotation.set(P.lL[0], 0, P.lL[1]); J.legR.rotation.set(P.lR[0], 0, P.lR[1]); J.kneeL.rotation.x = P.kL; J.kneeR.rotation.x = P.kR; J.hip.position.y = a.hipY + P.hy - br * 0.025;
    if (a._f !== FRAME) { a._f = FRAME; const ang = a.g.rotation.y; a.g.position.x += Math.sin(ang) * P.lg; a.g.position.z += Math.cos(ang) * P.lg; }
  };
  const pa0 = placeActors; placeActors = function (sh, S, lt, rt) { NOW = FX3.FIGHT(sh) ? sh : null; FRAME++; return pa0(sh, S, lt, rt); };

  // ================= fight camera director =================
  const hp = id => { const v = new THREE.Vector3(); const a = actor(id); (a.J.head || a.g).getWorldPosition(v); return v; };
  const gp = (sh, id, fix) => { if (fix) { const p = sh.A[id].p; return V3(p[0], 0, p[1]); } const v = actor(id).g.position; return V3(v.x, 0, v.z); };
  const TPL = {
    cu(sh, c, lt, u) { const h = hp(c.a), ang = actor(c.a).g.rotation.y + (c.yaw == null ? 0.6 : c.yaw) * (c.side || 1); const d = c.d || 1.8; return { p: [h.x + Math.sin(ang) * d, h.y + (c.h || 0.03), h.z + Math.cos(ang) * d], l: [h.x, h.y - (c.dy || 0.02), h.z], fov: c.fov || 30 }; },
    med(sh, c, lt, u) { const g = gp(sh, c.a, c.fix), ang = actor(c.a).g.rotation.y + (c.yaw == null ? 0.5 : c.yaw) * (c.side || 1); const d = c.d || 3.4; return { p: [g.x + Math.sin(ang) * d, c.h == null ? 1.1 : c.h, g.z + Math.cos(ang) * d], l: [g.x, c.ly || 1.05, g.z], fov: c.fov || 38 }; },
    low(sh, c, lt, u) { const g = gp(sh, c.a, c.fix), ang = actor(c.a).g.rotation.y + (c.yaw == null ? 0.45 : c.yaw) * (c.side || 1); const d = c.d || 2.8; return { p: [g.x + Math.sin(ang) * d, c.h || 0.4, g.z + Math.cos(ang) * d], l: [g.x, c.ly || 1.45, g.z], fov: c.fov || 46 }; },
    two(sh, c, lt, u) { const A = gp(sh, c.a, c.fix), B = gp(sh, c.b, c.fix), M = A.clone().lerp(B, 0.5), D = B.clone().sub(A); const L = D.length(); D.normalize(); const N = V3(-D.z, 0, D.x).multiplyScalar(c.side || 1); const d = (c.d || 2.7) + L * 0.8; const sl = (u - 0.5) * (c.slide == null ? 0.8 : c.slide);
      return { p: [M.x + N.x * d + D.x * sl, c.h || 1.15, M.z + N.z * d + D.z * sl], l: [M.x, c.ly || 1.1, M.z], fov: c.fov || 40 }; },
    ots(sh, c, lt, u) { const A = gp(sh, c.a, c.fix), B = gp(sh, c.b, c.fix), D = B.clone().sub(A).normalize(), N = V3(-D.z, 0, D.x).multiplyScalar(c.side || 1); const bk = c.d || 1.9, so = c.so || 1.0; const hb = c.head ? hp(c.b) : V3(B.x, c.ly || 1.35, B.z);
      return { p: [A.x - D.x * bk + N.x * so, c.h || 1.8, A.z - D.z * bk + N.z * so], l: [hb.x, hb.y, hb.z], fov: c.fov || 40 }; },
    lowtwo(sh, c, lt, u) { const A = gp(sh, c.a, c.fix), B = gp(sh, c.b, c.fix), D = B.clone().sub(A).normalize(), N = V3(-D.z, 0, D.x).multiplyScalar(c.side || 1); const bk = c.d || 2.4, so = c.so || 1.3; return { p: [A.x - D.x * bk + N.x * so, c.h || 0.4, A.z - D.z * bk + N.z * so], l: [B.x, c.ly || 1.4, B.z], fov: c.fov || 52 }; },
    top(sh, c, lt, u) { const A = gp(sh, c.a, c.fix), B = gp(sh, c.b, c.fix), M = A.clone().lerp(B, 0.5), D = B.clone().sub(A).normalize(); const a = (c.spin || 0.5) * u; return { p: [M.x + D.z * 1.6 * Math.cos(a), c.h || 8, M.z + D.x * 1.6 * Math.sin(a) + 1.2], l: [M.x, 0.6, M.z], fov: c.fov || 46 }; },
  };
  TPL.orb = (sh, c, lt, u) => { const A = gp(sh, c.a, c.fix), B = gp(sh, c.b, c.fix), M = A.clone().lerp(B, 0.5); const a = lerp(c.a0, c.a1, ease(u)) + Math.atan2(B.z - A.z, B.x - A.x); return { p: [M.x + Math.cos(a) * c.d, lerp(c.h, c.h2 || c.h, u), M.z + Math.sin(a) * c.d], l: [M.x, c.ly || 1.15, M.z], fov: c.fov || 42 }; };
  const CAMS = {
    '4.7': { t: 'cu', a: 'kid', d: 1.7, fov: 32 }, '4.17': { t: 'two', a: 'gron', b: 'ren', fix: 1, d: 3.4, side: -1, push: 0.12 }, '4.19': { t: 'two', a: 'ren', b: 'gron', d: 2.4, h: 0.8, fov: 44 },
    '4.24': { t: 'two', a: 'ren', b: 'sera', d: 2.6, side: -1 }, '4.26': { t: 'two', a: 'ren', b: 'sera', d: 1.3, h: 1.45, ly: 1.4, fov: 34, slide: 0 }, '4.27': { t: 'cu', a: 'ren', d: 1.6, yaw: 0.8, side: -1 },
    '5.1': { t: 'cu', a: 'gron', d: 2.0, h: -0.35, yaw: 0.5 }, '5.2': { t: 'med', a: 'ren', d: 3.6, h: 1.3, ly: 1.35, yaw: 0.4, push: 0.2 }, '5.7': { t: 'two', a: 'gron', b: 'ren', d: 2.2, h: 1.6, side: -1, push: 0.1 }, '5.10': { t: 'cu', a: 'ren', d: 2.5, fov: 26, side: -1, yaw: 0.3 },
    '5.12': { t: 'low', a: 'gron', d: 2.6, side: -1 }, '5.14': { t: 'med', a: 'ren', d: 4.2, h: 0.7, ly: 1.4, yaw: -0.5, push: 0.3 }, '5.17': { t: 'low', a: 'ren', d: 3.0, yaw: 0.3, push: 0.15 }, '5.20': { t: 'cu', a: 'ren', d: 2.1, yaw: 0.75, fov: 34 },
    '6.1': { t: 'low', a: 'gron', d: 3.0, yaw: -0.5, h: 0.9, push: 0.2 }, '6.3': { t: 'cu', a: 'ren', d: 0.8, yaw: 0.25, h: 0.02, dy: -0.04, fov: 26, push: 0.12 }, '6.4': { t: 'orb', a: 'ren', b: 'gron', d: 3.3, a0: -1.1, a1: -2.1, h: 0.7, h2: 1.4 }, '6.7': { t: 'orb', a: 'ren', b: 'gron', fix: 1, d: 3.2, a0: 1.95, a1: 1.2, h: 0.55, h2: 0.9, fov: 46 }, '6.2': { t: 'two', a: 'gron', b: 'ren', fix: 1, d: 2.6, h: 0.6, fov: 48 }, '6.5': { t: 'two', a: 'ren', b: 'gron', fix: 1, d: 2.4, side: -1, h: 1.0 }, '6.6': { t: 'lowtwo', a: 'ren', b: 'gron', d: 2.2, so: 1.5 },
    '6.8': { t: 'ots', a: 'ren', b: 'gron', d: 2.6, so: 1.4, h: 2.3, fix: 1 }, '6.9': { t: 'ots', a: 'ren', b: 'gron', d: 1.5, so: 1.15, h: 1.75, head: 1, fov: 32, push: 0.1 }, '6.10': { t: 'cu', a: 'ren', d: 1.7, yaw: 1.05, side: -1, fov: 32, push: 0.1 },
    '6.11': { t: 'two', a: 'ren', b: 'gron', fix: 1, d: 2.6, h: 0.8, fov: 46, zoom: [0.28, 0.4] }, '6.12': { t: 'two', a: 'ren', b: 'gron', d: 2.4, h: 0.45, ly: 1.5, fov: 50 }, '6.13': { t: 'top', a: 'ren', b: 'gron', fix: 1, h: 7 }, '6.14': { t: 'two', a: 'gron', b: 'ren', fix: 1, d: 3.2, h: 0.9, side: -1, fov: 46 },
    '6.15': { t: 'med', a: 'ren', d: 2.8, h: 0.5, ly: 0.7, yaw: 0.9, push: 0.15 }, '6.16': { t: 'two', a: 'mira', b: 'gron', d: 2.2, h: 1.3, side: -1 }, '6.18': { t: 'cu', a: 'ren', d: 1.8, h: -0.1, yaw: -0.5 }, '6.21': { t: 'cu', a: 'ren', d: 1.9, yaw: 0.85, h: 0.1, dy: 0.25, fov: 36, push: 0.15 },
    '6.24': { t: 'two', a: 'ren', b: 'gron', fix: 1, d: 2.6, h: 0.6, fov: 48, side: -1 }, '6.25': { t: 'two', a: 'ren', b: 'gron', d: 2.8, h: 1.0, side: -1, fov: 42, zoom: [0.3, 0.42] }, '6.28': { t: 'med', a: 'gron', d: 3.0, h: 1.3, ly: 0.9, yaw: 0.95 },
    '6.30': { t: 'low', a: 'gron', d: 3.6, side: -1, yaw: 0.35, h: 0.6, ly: 1.2, push: 0.15 }, '6.31': { t: 'cu', a: 'gron', d: 2.2, h: -0.3, yaw: 0.9, dy: -0.1, fov: 34 }, '6.32': { t: 'med', a: 'gron', d: 3.2, h: 1.3, ly: 1.3, yaw: 0.15, push: 0.15 }, '6.33': { t: 'low', a: 'gron', d: 2.4, h: 0.5, ly: 1.7, yaw: 0.6, fov: 40, push: 0.1 }, '6.35': { t: 'cu', a: 'gron', d: 1.9, h: -0.2, yaw: 0.35, fov: 32, push: 0.1 },
  };
  const idxOf = sh => { if (sh._ci == null) sh._ci = sh.sceneId + '.' + STORY[sh.si].shots.indexOf(sh); return sh._ci; };
  const ovr0 = window.CAMOVR;
  window.CAMOVR = function (sh, lt) { if (ovr0) return ovr0(sh, lt); if (window.NOCAM3 || !FX3.FIGHT(sh)) return null; const c = CAMS[idxOf(sh)]; if (!c) return null; for (const id of [c.a, c.b]) if (id && !(sh.A && sh.A[id])) return null;
    const u = clamp((lt - sh.c0) / Math.max(0.01, sh.len)); const r = TPL[c.t](sh, c, lt, u); let push = (c.push || 0) * ease(u); if (c.zoom && lt > c.zoom[0]) push += 0.3 * easeOut((lt - c.zoom[0]) / (c.zoom[1] - c.zoom[0]));
    if (push) for (let i = 0; i < 3; i++) r.p[i] = lerp(r.p[i], r.l[i], push); return r; };
  FX3.CAMS = CAMS; FX3.KF = KF;
})();
// ================= burning village + colour grade for the fight scenes =================
(() => {
  for (const sc of STORY) if (FX2.FIGHT.has(sc.id)) for (const sh of sc.shots) if (sh.set === 'village') { const f0 = sh.fx;
    sh.fx = function (F, lt, u, t) { if (f0) f0.call(this, F, lt, u, t); const lv = sh.st && sh.st.fire ? +sh.st.fire : 0; const sp = F.S.fire && F.S.fire.spots; if (!sp || lv <= 0) return;
      FX.toonFlame(F, 'hfire', i => { const q = sp[i % sp.length]; return V3(q[0] + (hash(i * 1.9) - 0.5) * 2.6, q[1] - 0.5 + hash(i * 2.7) * 1.2, q[2] + (hash(i * 3.3) - 0.5) * 2.6); }, t, { n: 520, h: 2.2 * lv, w: 0.3, size: 4.0 * lv, life: 0.9, pal: 'fire' }); }; }
  const post0 = window.POSTFX; let GR = null;
  window.POSTFX = function (sh, lt, F, t) { if (post0) post0(sh, lt, F, t); if (!FX3.FIGHT(sh)) return; const x = OX; if (!GR) { GR = x.createLinearGradient(0, 0, 0, H); GR.addColorStop(0, '#140a38'); GR.addColorStop(0.55, '#5a2a50'); GR.addColorStop(1, '#ff7a28'); }
    x.save(); x.globalCompositeOperation = 'overlay'; x.globalAlpha = 0.22; x.drawImage(OUT, 0, 0); x.globalCompositeOperation = 'soft-light'; x.globalAlpha = 0.5; x.fillStyle = GR; x.fillRect(0, 0, W, H); x.restore(); };
})();
