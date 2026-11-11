// อาณาจักรอัสตรา ตอนที่ 1 — engine: every frame is built from code (three.js r128 + canvas 2D). No generative AI.
'use strict';
const W = 1920, H = 1080, FPS = 24;
const QS = new URLSearchParams(location.search); const GS = +(QS.get('gs') || 0.6667), AA = QS.get('aa') !== '0'; const ANIME = QS.get('anime') === '1';
const GLW = Math.round(W * GS), GLH = Math.round(H * GS);
const TAU = Math.PI * 2;
const clamp = (x, a = 0, b = 1) => x < a ? a : x > b ? b : x;
const lerp = (a, b, t) => a + (b - a) * t;
const ease = t => { t = clamp(t); return t * t * (3 - 2 * t); };
const easeOut = t => { t = clamp(t); return 1 - (1 - t) * (1 - t); };
const easeIn = t => { t = clamp(t); return t * t; };
const hash = i => { const x = Math.sin(i * 127.1 + 311.7) * 43758.5453; return x - Math.floor(x); };
const noise1 = t => Math.sin(t * 1.7) * 0.5 + Math.sin(t * 3.1 + 1.3) * 0.3 + Math.sin(t * 7.3 + 2.1) * 0.2;
const C = c => new THREE.Color(c);

// ---------- materials ----------
const GRAD = (() => { const d = ANIME ? new Uint8Array([118, 112, 132, 118, 112, 132, 255, 255, 255, 255, 255, 255]) : new Uint8Array([70, 70, 70, 165, 165, 165, 255, 255, 255]); const t = new THREE.DataTexture(d, ANIME ? 4 : 3, 1, THREE.RGBFormat); t.minFilter = t.magFilter = THREE.NearestFilter; t.generateMipmaps = false; t.needsUpdate = true; return t; })();
const MATS = {};
const RIM = { value: new THREE.Color(0x8899ff) }, RIMK = { value: 0.0 };
function toon(color, emissive = 0, extra = {}) {
  const k = color + ':' + emissive + ':' + JSON.stringify(extra);
  if (!MATS[k]) { const m = MATS[k] = new THREE.MeshToonMaterial(Object.assign({ color, gradientMap: GRAD, emissive }, extra));
    if (ANIME) { m.onBeforeCompile = sh => { sh.uniforms.rimCol = RIM; sh.uniforms.rimK = RIMK; sh.fragmentShader = sh.fragmentShader.replace('#include <common>', '#include <common>\nuniform vec3 rimCol; uniform float rimK;').replace('#include <tonemapping_fragment>', 'float rimF = pow(1.0 - clamp(dot(normalize(vViewPosition), normal), 0.0, 1.0), 3.0); gl_FragColor.rgb += rimCol * rimF * rimK;\n#include <tonemapping_fragment>'); }; m.customProgramCacheKey = () => 'rim'; } }
  return MATS[k];
}

function flat(color, emissive = 0, extra = {}) { const k = 'L' + color + ':' + emissive + JSON.stringify(extra); if (!MATS[k]) MATS[k] = new THREE.MeshLambertMaterial(Object.assign({ color, emissive }, extra)); return MATS[k]; }
function basic(color, extra = {}) { const k = 'b' + color + JSON.stringify(extra); if (!MATS[k]) MATS[k] = new THREE.MeshBasicMaterial(Object.assign({ color }, extra)); return MATS[k]; }
const OLM = {};
function outlineMat(th, color = 0x07050a) {
  const k = th + ':' + color; if (OLM[k]) return OLM[k];
  const m = new THREE.MeshBasicMaterial({ color, side: THREE.BackSide });
  m.onBeforeCompile = sh => { sh.vertexShader = sh.vertexShader.replace('#include <begin_vertex>', 'vec3 transformed = position + normal * ' + th.toFixed(4) + ';'); };
  m.customProgramCacheKey = () => 'ol' + th;
  return (OLM[k] = m);
}
// part: toon mesh + inked outline. ol = outline thickness (object space), olS = scale outline for boxy shapes
function P(geom, color, o = {}) {
  const g = new THREE.Group();
  const mat = o.mat || toon(color, o.emis || 0, o.side ? { side: o.side } : {});
  const m = new THREE.Mesh(geom, mat); g.add(m); g.userData.mesh = m;
  if (o.olS) { const ol = new THREE.Mesh(geom, basic(0x07050a, { side: THREE.BackSide })); ol.scale.setScalar(o.olS); g.add(ol); }
  else if (o.ol !== 0) { const ol = new THREE.Mesh(geom, outlineMat(o.ol || 0.014, o.olc)); g.add(ol); }
  return g;
}
function at(obj, x, y, z, s) { obj.position.set(x, y, z); if (s) { if (Array.isArray(s)) obj.scale.set(s[0], s[1], s[2]); else obj.scale.setScalar(s); } return obj; }
function rot(obj, x, y, z) { obj.rotation.set(x, y, z); return obj; }
const SPH = (r, a = 14, b = 12) => new THREE.SphereGeometry(r, a, b);
const CYL = (r1, r2, h, s = 12, open = false) => new THREE.CylinderGeometry(r1, r2, h, s, 1, open);
const BOX = (x, y, z) => new THREE.BoxGeometry(x, y, z);
const CONE = (r, h, s = 8) => new THREE.ConeGeometry(r, h, s);

// ---------- particles (analytic, deterministic) ----------
const PS_VS = `attribute float size; attribute float alpha; attribute vec3 pcol; varying float vA; varying vec3 vC; uniform float scale;
void main(){ vA=alpha; vC=pcol; vec4 mv=modelViewMatrix*vec4(position,1.0); gl_PointSize=min(900.0,size*scale/max(0.05,-mv.z)); gl_Position=projectionMatrix*mv; }`;
const PS_FS = `varying float vA; varying vec3 vC; uniform float soft;
void main(){ vec2 c=gl_PointCoord-0.5; float d=length(c)*2.0; float a=(1.0-smoothstep(soft,1.0,d))*vA; if(a<0.004) discard; gl_FragColor=vec4(vC,a); }`;
class PS {
  constructor(n, o = {}) {
    this.n = n; const g = new THREE.BufferGeometry();
    this.pos = new Float32Array(n * 3); this.size = new Float32Array(n); this.alpha = new Float32Array(n); this.col = new Float32Array(n * 3);
    g.setAttribute('position', new THREE.BufferAttribute(this.pos, 3)); g.setAttribute('size', new THREE.BufferAttribute(this.size, 1));
    g.setAttribute('alpha', new THREE.BufferAttribute(this.alpha, 1)); g.setAttribute('pcol', new THREE.BufferAttribute(this.col, 3));
    const mat = new THREE.ShaderMaterial({ vertexShader: PS_VS, fragmentShader: PS_FS, transparent: true, depthWrite: false,
      blending: o.blend === 'normal' ? THREE.NormalBlending : THREE.AdditiveBlending, uniforms: { scale: { value: GLH * 0.5 * 2.75 }, soft: { value: o.soft == null ? 0.2 : o.soft } } });
    this.pts = new THREE.Points(g, mat); this.pts.frustumCulled = false; this.pts.renderOrder = o.order || 5; this.g = g;
  }
  set(fn) { const o = { x: 0, y: 0, z: 0, s: 0, a: 0, r: 1, g: 1, b: 1 };
    for (let i = 0; i < this.n; i++) { o.s = 0; o.a = 0; fn(i, o); const j = i * 3; this.pos[j] = o.x; this.pos[j + 1] = o.y; this.pos[j + 2] = o.z; this.size[i] = o.s; this.alpha[i] = o.a; this.col[j] = o.r; this.col[j + 1] = o.g; this.col[j + 2] = o.b; }
    for (const k of ['position', 'size', 'alpha', 'pcol']) this.g.attributes[k].needsUpdate = true; }
}
function rgb(c) { const x = C(c); return [x.r, x.g, x.b]; }
// flame particle: i index, t time, base point, height, width; returns phase
function flameP(i, t, o, bx, by, bz, h, w, life = 0.8, seed = 0) {
  const s = hash(i + seed * 101); const L = life * (0.6 + 0.8 * hash(i * 3.3 + seed));
  const ph = ((t / L) + s) % 1; const a = hash(i * 7.1 + seed) * TAU, r = w * Math.sqrt(hash(i * 1.7 + seed)) * (1 - ph * 0.7);
  o.x = bx + Math.cos(a) * r + Math.sin(t * 3 + i) * 0.04 * ph; o.y = by + h * ph; o.z = bz + Math.sin(a) * r;
  return ph;
}

// ---------- characters ----------
const CASTDEF = {
  ren: { name: 'เรน', skin: 0xf0c8a8, hair: 0x17121a, hs: 'spiky', top: 0x5c1a1d, pants: 0x1e1e26, boots: 0x3b2a22, cloth: 'cloak', cloak: 0x2c2e36, eye: 0x3a1410, iris: 0xc8542a },
  mira: { name: 'มีรา', skin: 0xf6d8c4, hair: 0xd8e2f4, hs: 'long', top: 0x2f4f8f, pants: 0x1c2438, boots: 0x2a2f45, cloth: 'coat', cloak: 0x5a6e9e, eye: 0x2a6fd0, iris: 0x3d8fe8, female: 1 },
  gron: { name: 'โกรน', skin: 0x2a1e1e, hair: 0x101014, hs: 'helm', top: 0x16161c, pants: 0x121216, boots: 0x0c0c10, cloth: 'armor', cloak: 0x6a0a0e, eye: 0xff2020, scale: 1.22 },
  sera: { name: 'ยายเซรา', skin: 0xe2b79a, hair: 0xa4a4ac, hs: 'bun', top: 0x5b4636, pants: 0x4a3a2e, boots: 0x2e241c, cloth: 'robe', cloak: 0x6b5442, eye: 0x2b1d14, female: 1, old: 1, scale: 0.92 },
  kid: { name: 'เด็กชาย', skin: 0xf0c4a0, hair: 0x5a3a22, hs: 'messy', top: 0x3f6a3a, pants: 0x4a3a2a, boots: 0x3a2a1e, eye: 0x2b1d14, scale: 0.68 },
  man: { name: 'ชาวบ้าน', skin: 0xd9a988, hair: 0x3b2a1e, hs: 'short', top: 0xb89a6a, pants: 0x3e4a5a, boots: 0x3a2a1e, eye: 0x2b1d14, mark: 1, scale: 1.05 },
  mom: { name: 'แม่', skin: 0xf3d2bd, hair: 0x15101a, hs: 'longdark', top: 0xe8ecf5, pants: 0xe8ecf5, boots: 0xd0d4dd, cloth: 'robe', cloak: 0xc7cfe0, eye: 0x6a1a10, iris: 0xb8503a, female: 1 },
  king: { name: 'ราชันเงา', skin: 0x0a0608, hair: 0x050406, hs: 'hood', top: 0x0b0a0e, pants: 0x0b0a0e, boots: 0x060508, cloth: 'robe', cloak: 0x0d0b10, eye: 0xff1010, scale: 1.45 },
};
const VILLAGER_COLORS = [[0x8a5a3a, 0x3a3a4a], [0x6a7a4a, 0x4a3a2a], [0x9a6a5a, 0x2e3a4a], [0x5a6a8a, 0x3a2e24], [0xa08050, 0x3a3030], [0x7a4a5a, 0x2a2a34]];
function soldierDef(i) { return { name: 'ทหารเงา', skin: 0x111, hair: 0x101014, hs: 'helm', top: 0x141418, pants: 0x101014, boots: 0x0a0a0c, cloth: 'armor', cloak: 0x2a0608, eye: 0xff1a1a, scale: 1.05 + hash(i) * 0.08, simple: 1 }; }
function villagerDef(i) { const c = VILLAGER_COLORS[i % VILLAGER_COLORS.length]; return { name: 'ชาวบ้าน', skin: [0xf0c8a8, 0xd9a988, 0xc89878][i % 3], hair: [0x3b2a1e, 0x1a1414, 0x6a4a2a, 0x8a8a8a][i % 4], hs: i % 2 ? 'short' : 'bun', top: c[0], pants: c[1], boots: 0x3a2a1e, eye: 0x2b1d14, scale: 0.9 + hash(i + 9) * 0.18, simple: 1, female: i % 2 }; }

function buildHuman(d) {
  const root = new THREE.Group(); const J = {}; const simple = !!d.simple; const ol = simple ? 0 : (ANIME ? 0.016 : 0.012);
  const hip = new THREE.Group(); hip.position.y = 0.86; root.add(hip); J.hip = hip;
  const torso = new THREE.Group(); hip.add(torso); J.torso = torso;
  torso.add(at(P(SPH(0.15, 12, 8), d.pants, { ol }), 0, 0.03, 0, [1.12, 0.75, 0.85]));
  const chestCol = d.top;
  torso.add(at(P(CYL(d.female ? 0.15 : 0.175, 0.14, 0.46, 12), chestCol, { ol }), 0, 0.27, 0));
  torso.add(at(P(SPH(0.12, 10, 8), chestCol, { ol }), 0, 0.46, 0, [1.55, 0.6, 0.95]));
  // neck & head
  const neck = new THREE.Group(); neck.position.y = 0.52; torso.add(neck); J.neck = neck;
  neck.add(at(P(CYL(0.05, 0.055, 0.1, 8), d.skin, { ol: 0 }), 0, 0.04, 0));
  const head = new THREE.Group(); head.position.y = 0.08; neck.add(head); J.head = head;
  const helm = d.hs === 'helm', hood = d.hs === 'hood';
  head.add(at(P(SPH(0.165, 16, 14), helm ? 0x18181e : d.skin, { ol: 0.012 }), 0, 0.15, 0, [1, 1.07, 1]));
  const eyeMat = new THREE.MeshBasicMaterial({ color: d.eye });
  const eyeMatR = new THREE.MeshBasicMaterial({ color: d.eye });
  J.eyeL = eyeMat; J.eyeR = eyeMatR;
  if (helm) {
    head.add(at(new THREE.Mesh(BOX(0.24, 0.03, 0.06), basic(0xff1a10)), 0, 0.15, 0.14));
    for (const s of [-1, 1]) head.add(rot(at(P(CONE(0.035, 0.2, 6), 0x2a0a0c, { ol: 0.01 }), s * 0.13, 0.3, 0), 0, 0, -s * 0.6));
    head.add(at(P(BOX(0.04, 0.12, 0.3), 0x2a0a0c, { olS: 1.08 }), 0, 0.3, -0.02));
  } else {
    for (const s of [-1, 1]) {
      if (ANIME && !hood) { const tx = eyeTextures(d); const em = new THREE.MeshBasicMaterial({ map: tx.base, transparent: true, depthWrite: false, polygonOffset: true, polygonOffsetFactor: -4 }); em.userData.tx = tx; if (s > 0) J.eyeL = em; else J.eyeR = em;
        const e = new THREE.Mesh(new THREE.PlaneGeometry(0.108, 0.13), em); at(e, s * 0.071, 0.13, 0.151); e.rotation.y = s * 0.42; e.scale.x = s; e.renderOrder = 3; head.add(e); J.animeEyes = 1;
        head.add(rot(at(new THREE.Mesh(BOX(0.062, 0.011, 0.008), basic(d.hair === 0xd8e2f4 ? 0x8a94aa : 0x1a1014)), s * 0.07, 0.205, 0.15), 0, s * 0.42, s * (d.old ? -0.18 : 0.14))); continue; }
      const e = new THREE.Mesh(SPH(0.034, 10, 8), s > 0 ? eyeMat : eyeMatR); at(e, s * 0.064, 0.135, 0.138, [0.8, 1.35, 0.5]); head.add(e);
      if (!hood) { head.add(at(new THREE.Mesh(SPH(0.007, 6, 6), basic(0xffffff)), s * 0.056, 0.152, 0.158));
        head.add(rot(at(new THREE.Mesh(BOX(0.05, 0.009, 0.01), basic(0x1a1014)), s * 0.065, 0.19, 0.152), 0, 0, s * (d.old ? -0.15 : 0.12))); }
    }
    if (!hood) { const mouth = new THREE.Mesh(BOX(0.04, 0.01, 0.01), basic(0x3a1418)); at(mouth, 0, 0.065, 0.158); head.add(mouth); J.mouth = mouth; }
    if (hood) { head.add(at(P(SPH(0.21, 14, 10), d.cloak, { ol: 0.015 }), 0, 0.17, -0.03, [1, 1.15, 1.05])); head.add(at(P(CONE(0.17, 0.3, 10), d.cloak, { ol: 0.012 }), 0, 0.38, -0.05)); head.add(at(new THREE.Mesh(BOX(0.25, 0.18, 0.02), basic(0x000000)), 0, 0.13, 0.16)); for (const s of [-1, 1]) { const e = new THREE.Mesh(SPH(0.026, 8, 6), s > 0 ? eyeMat : eyeMatR); at(e, s * 0.06, 0.15, 0.18, [1.6, 0.6, 0.6]); head.add(e); } }
  }
  // hair
  const hc = d.hair, hp = (g, x, y, z, s, r) => { const m = P(g, hc, { ol: 0.01 }); at(m, x, y, z, s); if (r) rot(m, r[0], r[1], r[2]); head.add(m); return m; };
  if (d.hs === 'spiky') {
    hp(SPH(0.178, 14, 10, 0), 0, 0.185, -0.012, [1.04, 0.95, 1.05]);
    for (let i = 0; i < 9; i++) { const a = -1.9 + i * 0.475; hp(CONE(0.07, 0.24, 6), Math.sin(a) * 0.13, 0.25 + Math.cos(a) * 0.04, -Math.cos(a) * 0.1 - 0.03, 1, [-0.9 * Math.cos(a) - 0.3, 0, -Math.sin(a) * 1.1]); }
    for (let i = 0; i < 5; i++) { const x = -0.11 + i * 0.055; hp(CONE(0.045, 0.16, 5), x, 0.24, 0.12, 1, [2.3, 0, x * 2.5]); }
  } else if (d.hs === 'long' || d.hs === 'longdark') {
    hp(SPH(0.178, 14, 10), 0, 0.18, -0.015, [1.05, 0.98, 1.05]);
    hp(CYL(0.15, 0.07, 0.55, 10), 0, -0.05, -0.1, [0.95, 1, 0.5]);
    for (const s of [-1, 1]) hp(CYL(0.04, 0.025, 0.36, 6), s * 0.14, 0.02, 0.07, 1, [0, 0, s * 0.08]);
    for (let i = 0; i < 4; i++) hp(CONE(0.05, 0.15, 5), -0.09 + i * 0.06, 0.24, 0.125, 1, [2.4, 0, 0]);
    if (d.hs === 'long') { const tie = new THREE.Mesh(SPH(0.03, 8, 6), basic(0x6fd8ff)); at(tie, 0.12, 0.27, -0.07); head.add(tie); }
  } else if (d.hs === 'bun') { hp(SPH(0.172, 14, 10), 0, 0.18, -0.015, [1.03, 0.98, 1.04]); hp(SPH(0.08, 10, 8), 0, 0.3, -0.12); }
  else if (d.hs === 'messy') { hp(SPH(0.176, 12, 10), 0, 0.18, -0.01, [1.04, 0.98, 1.05]); for (let i = 0; i < 6; i++) { const a = i * 1.05; hp(CONE(0.05, 0.14, 5), Math.sin(a) * 0.12, 0.3, Math.cos(a) * 0.1 - 0.02, 1, [Math.cos(a) * 0.8, 0, -Math.sin(a) * 0.8]); } }
  else if (d.hs === 'short') { hp(SPH(0.172, 12, 10), 0, 0.19, -0.015, [1.03, 0.92, 1.04]); }
  // arms
  for (const s of [1, -1]) {
    const k = s > 0 ? 'L' : 'R';
    const sh = new THREE.Group(); sh.position.set(s * 0.215, 0.45, 0); torso.add(sh); J['sh' + k] = sh;
    sh.add(at(P(SPH(0.065, 10, 8), d.top, { ol }), 0, 0, 0));
    sh.add(at(P(CYL(0.055, 0.047, 0.3, 8), d.top, { ol }), 0, -0.15, 0));
    const el = new THREE.Group(); el.position.y = -0.3; sh.add(el); J['el' + k] = el;
    el.add(at(P(CYL(0.046, 0.04, 0.27, 8), d.cloth === 'armor' ? 0x2a0c10 : d.top, { ol }), 0, -0.135, 0));
    const hand = new THREE.Group(); hand.position.y = -0.3; el.add(hand); J['hand' + k] = hand;
    hand.add(at(P(SPH(0.045, 8, 6), d.cloth === 'armor' ? 0x111114 : d.skin, { ol }), 0, 0, 0, [0.9, 1.1, 0.8]));
    if (d.mark && s < 0) { const m = new THREE.Mesh(CYL(0.05, 0.05, 0.06, 10, true), new THREE.MeshBasicMaterial({ color: 0x3aa0ff, side: THREE.DoubleSide })); at(m, 0, -0.14, 0); el.add(m); }
    if (d.cloth === 'armor') sh.add(at(P(SPH(0.11, 10, 8), 0x1c1c22, { ol: 0.012, emis: 0x200000 }), s * 0.02, 0.03, 0, [1.1, 0.7, 1.1]));
  }
  // legs
  for (const s of [1, -1]) {
    const k = s > 0 ? 'L' : 'R';
    const lg = new THREE.Group(); lg.position.set(s * 0.09, 0, 0); hip.add(lg); J['leg' + k] = lg;
    lg.add(at(P(CYL(0.07, 0.058, 0.43, 8), d.pants, { ol }), 0, -0.21, 0));
    const kn = new THREE.Group(); kn.position.y = -0.42; lg.add(kn); J['knee' + k] = kn;
    kn.add(at(P(CYL(0.056, 0.048, 0.4, 8), d.boots, { ol }), 0, -0.2, 0));
    kn.add(at(P(BOX(0.1, 0.06, 0.2), d.boots, { olS: 1.1 }), 0, -0.41, 0.04));
  }
  // clothing
  if (d.cloth === 'cloak') {
    const ck = new THREE.Group(); ck.position.set(0, 0.47, -0.02); torso.add(ck); J.cloak = ck;
    const geo = new THREE.CylinderGeometry(0.2, 0.42, 0.98, 16, 1, true, Math.PI * 0.32, Math.PI * 1.36);
    ck.add(at(P(geo, d.cloak, { ol: 0.012, side: THREE.DoubleSide }), 0, -0.47, 0));
    ck.add(at(P(CYL(0.21, 0.24, 0.12, 14), d.cloak, { ol: 0.012 }), 0, -0.02, 0));
    const scarf = P(new THREE.TorusGeometry(0.1, 0.04, 6, 12), 0x8a1a1a, { ol: 0.01 }); rot(at(scarf, 0, 0.06, 0), Math.PI / 2, 0, 0); ck.add(scarf);
  } else if (d.cloth === 'coat') {
    const sk = new THREE.Group(); sk.position.y = 0.05; torso.add(sk); J.skirt = sk;
    sk.add(at(P(CYL(0.17, 0.33, 0.55, 14, true), d.top, { ol: 0.012, side: THREE.DoubleSide }), 0, -0.27, 0));
    torso.add(at(P(CYL(0.18, 0.18, 0.06, 14), d.cloak, { ol: 0 }), 0, 0.07, 0));
    const ck = new THREE.Group(); ck.position.set(0, 0.47, -0.04); torso.add(ck); J.cloak = ck;
    ck.add(at(P(new THREE.CylinderGeometry(0.2, 0.36, 0.7, 14, 1, true, Math.PI * 0.45, Math.PI * 1.1), d.cloak, { ol: 0.012, side: THREE.DoubleSide }), 0, -0.33, 0));
  } else if (d.cloth === 'robe') {
    const sk = new THREE.Group(); sk.position.y = 0.06; torso.add(sk); J.skirt = sk;
    sk.add(at(P(CYL(0.17, 0.36, 0.86, 14, true), d.cloak, { ol: 0.012, side: THREE.DoubleSide }), 0, -0.43, 0));
  } else if (d.cloth === 'armor') {
    torso.add(at(P(CYL(0.2, 0.16, 0.3, 10), 0x1a1a20, { ol: 0.012, emis: 0x100000 }), 0, 0.33, 0.01));
    torso.add(at(new THREE.Mesh(BOX(0.03, 0.3, 0.02), basic(0xb0101a)), 0, 0.3, 0.205));
    torso.add(at(P(CYL(0.19, 0.24, 0.22, 10, true), 0x1a1a20, { ol: 0.012, side: THREE.DoubleSide }), 0, -0.06, 0));
    if (!d.simple) { const ck = new THREE.Group(); ck.position.set(0, 0.48, -0.1); torso.add(ck); J.cloak = ck; ck.add(at(P(new THREE.PlaneGeometry(0.5, 1.1, 1, 4), d.cloak, { ol: 0, side: THREE.DoubleSide }), 0, -0.55, 0)); }
  }
  let hipY = 0.86;
  if (ANIME && !simple) { const tall = d.old || (d.scale || 1) < 0.8 ? 1.0 : 1.13; for (const k of ['L', 'R']) { J['leg' + k].scale.set(0.86, tall, 0.86); J['sh' + k].scale.set(0.84, 1.04, 0.84); }
    hipY = 0.86 * tall; hip.position.y = hipY; torso.scale.set(0.9, 1.0, 0.9); head.scale.set(1.0, 0.93, 1.0); if ((d.scale || 1) >= 0.8) head.scale.multiplyScalar(0.93); }
  const sc = d.scale || 1; root.scale.setScalar(sc);
  return { g: root, J, d, hipY, props: {} };
}

const EYETEX = {};
function eyeTextures(d) {
  const iris = d.iris || { ren: 0xc2562c }[d.name] || 0x7a5232; const key = iris + ':' + (d.female ? 1 : 0) + ':' + (d.old ? 1 : 0); if (EYETEX[key]) return EYETEX[key];
  const mk = (col, glow) => { const c = document.createElement('canvas'); c.width = 160; c.height = 192; const x = c.getContext('2d'); const cc = C(col), hx = v => '#' + v.getHexString();
    x.save(); x.beginPath(); x.moveTo(12, 96); x.bezierCurveTo(30, 28, 120, 22, 150, 80); x.bezierCurveTo(140, 150, 50, 168, 12, 96); x.closePath(); x.fillStyle = '#fbf8f4'; x.fill(); x.clip();
    const g = x.createLinearGradient(0, 40, 0, 160); g.addColorStop(0, hx(cc.clone().multiplyScalar(0.35))); g.addColorStop(0.55, hx(cc)); g.addColorStop(1, hx(cc.clone().lerp(C(0xffffff), 0.45)));
    x.fillStyle = g; x.beginPath(); x.ellipse(84, 98, 44, 58, 0, 0, TAU); x.fill(); x.fillStyle = glow ? hx(cc.clone().lerp(C(0xffffff), 0.6)) : '#120a10'; x.beginPath(); x.ellipse(84, 100, 17, 26, 0, 0, TAU); x.fill();
    x.fillStyle = 'rgba(0,0,0,0.28)'; x.fillRect(0, 0, 160, 62); x.fillStyle = '#fff'; x.beginPath(); x.ellipse(104, 70, 13, 16, 0.3, 0, TAU); x.fill(); x.beginPath(); x.ellipse(66, 128, 6, 7, 0, 0, TAU); x.fill(); x.restore();
    x.strokeStyle = '#140c12'; x.lineCap = 'round'; x.lineWidth = d.female ? 13 : 11; x.beginPath(); x.moveTo(8, 100); x.bezierCurveTo(28, 26, 122, 18, 154, 78); x.stroke();
    if (d.female) { x.lineWidth = 6; x.beginPath(); x.moveTo(150, 74); x.lineTo(158, 56); x.moveTo(8, 98); x.lineTo(2, 84); x.stroke(); }
    x.lineWidth = 3; x.globalAlpha = 0.6; x.beginPath(); x.moveTo(40, 156); x.quadraticCurveTo(90, 172, 132, 138); x.stroke(); x.globalAlpha = 1;
    if (d.old) { x.lineWidth = 2; x.globalAlpha = 0.5; x.beginPath(); x.moveTo(140, 110); x.lineTo(158, 118); x.moveTo(138, 124); x.lineTo(154, 136); x.stroke(); }
    const t = new THREE.CanvasTexture(c); t.anisotropy = 4; return t; };
  return (EYETEX[key] = { base: mk(iris, 0), gold: mk(0xffc21a, 1), glow: mk(0xff3018, 1) });
}
// ---------- props ----------
function makeProp(name) {
  const g = new THREE.Group();
  switch (name) {
    case 'wrench': g.add(rot(at(P(CYL(0.012, 0.012, 0.2, 6), 0x9aa0a8, { ol: 0.006 }), 0, -0.06, 0.05), 1.2, 0, 0)); break;
    case 'dagger': g.add(rot(at(P(BOX(0.02, 0.28, 0.05), 0xdfe8f0, { olS: 1.1, emis: 0x203040 }), 0, -0.1, 0.1), 1.57, 0, 0)); g.add(rot(at(P(CYL(0.018, 0.018, 0.09, 6), 0x3a2a20, { ol: 0.005 }), 0, -0.02, 0), 1.57, 0, 0)); break;
    case 'crystal': { const m = new THREE.Mesh(new THREE.TorusGeometry(0.06, 0.018, 6, 14, Math.PI * 1.3), basic(0x8fe8ff)); rot(at(m, 0, -0.05, 0.05), 0, 0, 0.6); g.add(m); g.userData.glow = 1; break; }
    case 'staff': g.add(at(P(CYL(0.02, 0.02, 1.6, 6), 0xcfd6e6, { ol: 0.006 }), 0, 0.05, 0)); { const o = new THREE.Mesh(SPH(0.07, 12, 10), basic(0x7fe0ff)); at(o, 0, 0.9, 0); g.add(o); const r = new THREE.Mesh(new THREE.TorusGeometry(0.1, 0.012, 6, 16, Math.PI * 1.4), basic(0xdfe8f5)); at(r, 0, 0.9, 0); g.add(r); } break;
    case 'cane': g.add(at(P(CYL(0.018, 0.018, 0.95, 6), 0x5a3a20, { ol: 0.006 }), 0, -0.4, 0.03)); break;
    case 'crate': g.add(at(P(BOX(0.42, 0.3, 0.32), 0x8a6a42, { olS: 1.04 }), 0, -0.08, 0.22)); break;
    case 'box': g.add(at(P(BOX(0.22, 0.14, 0.16), 0x4a3020, { olS: 1.06 }), 0, -0.02, 0.12)); break;
    case 'pendant': { const m = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.06, 0.015, 16, 1, false, 0, Math.PI), toon(0x111114, 0x300000)); rot(at(m, 0, 0.0, 0.1), 1.57, 0, 0); g.add(m); for (let i = 0; i < 5; i++) { const a = i * Math.PI / 4; const ray = new THREE.Mesh(BOX(0.012, 0.04, 0.01), basic(0x400808)); rot(at(ray, Math.cos(a) * 0.085, 0, 0.1 + Math.sin(a) * 0.085), 1.57, 0, -a + 1.57); g.add(ray); } g.userData.pendant = 1; break; }
    case 'map': { const m = new THREE.Mesh(new THREE.PlaneGeometry(0.42, 0.3), new THREE.MeshBasicMaterial({ map: mapTexture(), side: THREE.DoubleSide })); rot(at(m, -0.0, 0.02, 0.22), -1.1, 0, 0); g.add(m); break; }
    case 'pipe': g.add(rot(at(P(CYL(0.025, 0.025, 0.9, 8), 0x5a5a62, { ol: 0.006 }), 0, 0, 0.3), 1.4, 0, 0)); break;
    case 'bsword': { const m = new THREE.Mesh(new THREE.OctahedronGeometry(0.08, 0), basic(0xff2030)); rot(at(m, 0, -0.05, 0.55), 1.57, 0, 0); m.scale.set(0.5, 7, 0.6); g.add(m); const h = new THREE.Mesh(new THREE.OctahedronGeometry(0.1, 0), basic(0x600008, { transparent: true, opacity: 0.6 })); rot(at(h, 0, -0.05, 0.55), 1.57, 0, 0); h.scale.set(0.8, 7.5, 0.9); g.add(h); break; }
    case 'comm': { const m = new THREE.Mesh(new THREE.OctahedronGeometry(0.05, 0), basic(0xff2020)); at(m, 0, 0.02, 0.06); g.add(m); break; }
    case 'bag': g.add(at(P(BOX(0.3, 0.36, 0.14), 0x5a3a24, { olS: 1.06 }), 0, 0, 0)); break;
    case 'baby': g.add(at(P(SPH(0.16, 12, 10), 0xf2f2f6, { ol: 0.01 }), 0, 0, 0.12, [1, 0.8, 1.6])); g.add(at(P(SPH(0.085, 12, 10), 0xf0c8a8, { ol: 0.01 }), 0, 0.08, 0.3)); break;
  }
  return g;
}
let _mapTex = null;
function mapTexture() {
  if (_mapTex) return _mapTex; const c = document.createElement('canvas'); c.width = 512; c.height = 360; const x = c.getContext('2d');
  x.fillStyle = '#c9b48a'; x.fillRect(0, 0, 512, 360); x.strokeStyle = '#6a4a2a'; x.lineWidth = 3;
  for (let i = 0; i < 40; i++) { x.globalAlpha = 0.15; x.fillStyle = '#7a5a30'; x.beginPath(); x.arc(hash(i) * 512, hash(i + 5) * 360, 10 + hash(i + 9) * 40, 0, TAU); x.fill(); }
  x.globalAlpha = 1; x.beginPath(); x.moveTo(40, 300); x.bezierCurveTo(150, 240, 200, 280, 260, 180); x.bezierCurveTo(300, 120, 400, 140, 470, 60); x.setLineDash([10, 8]); x.stroke(); x.setLineDash([]);
  for (let i = 0; i < 9; i++) { x.beginPath(); const mx = 80 + i * 45, my = 90 + Math.sin(i) * 20; x.moveTo(mx - 18, my + 16); x.lineTo(mx, my - 16); x.lineTo(mx + 18, my + 16); x.stroke(); }
  x.fillStyle = '#1a1010'; x.beginPath(); x.arc(256, 190, 34, Math.PI, 0); x.fill(); for (let i = 0; i < 5; i++) { const a = Math.PI + i * Math.PI / 4; x.fillRect(256 + Math.cos(a) * 44 - 3, 190 + Math.sin(a) * 44 - 3, 6, 6); }
  x.strokeStyle = '#8a1010'; x.lineWidth = 4; x.beginPath(); x.arc(256, 190, 50, 0, TAU); x.stroke();
  x.fillStyle = '#3a2410'; x.font = '24px Kanit'; x.fillText('ลูเมน', 20, 330); x.fillText('นครวาเลน', 380, 50);
  _mapTex = new THREE.CanvasTexture(c); return _mapTex;
}
const PROP_SLOT = { R: 'handR', L: 'handL', back: 'torso' };

// ---------- wolf / beasts ----------
function buildWolf() {
  const g = new THREE.Group(); const J = {}; const m = toon(0x08060a, 0x1a0000); const rim = outlineMat(0.035, 0xff2418);
  const part = (geo, x, y, z, s, r) => { const o = new THREE.Group(); o.add(new THREE.Mesh(geo, m)); o.add(new THREE.Mesh(geo, rim)); at(o, x, y, z, s); if (r) rot(o, r[0], r[1], r[2]); return o; };
  const body = new THREE.Group(); g.add(body); J.body = body; body.position.y = 0.95;
  body.add(part(SPH(0.4, 14, 10), 0, 0, 0, [0.85, 0.8, 1.6]));
  body.add(part(SPH(0.38, 14, 10), 0, 0.12, 0.45, [0.95, 1.0, 1.0]));
  const head = new THREE.Group(); head.position.set(0, 0.35, 0.85); body.add(head); J.head = head;
  head.add(part(SPH(0.24, 12, 10), 0, 0, 0, [0.9, 0.85, 1.1]));
  head.add(part(CONE(0.13, 0.42, 8), 0, -0.05, 0.3, 1, [1.57, 0, 0]));
  const jaw = new THREE.Group(); jaw.position.set(0, -0.12, 0.12); head.add(jaw); J.jaw = jaw; jaw.add(part(CONE(0.09, 0.35, 6), 0, -0.02, 0.18, 1, [1.65, 0, 0]));
  for (const s of [-1, 1]) { head.add(part(CONE(0.08, 0.26, 5), s * 0.13, 0.25, -0.04, 1, [-0.2, 0, -s * 0.25])); const e = new THREE.Mesh(SPH(0.035, 8, 6), basic(0xff3020)); at(e, s * 0.1, 0.06, 0.18, [1.6, 0.6, 0.6]); head.add(e); }
  for (const [k, z] of [['F', 0.5], ['B', -0.45]]) for (const s of [-1, 1]) { const lg = new THREE.Group(); lg.position.set(s * 0.22, -0.1, z); body.add(lg); J['leg' + k + (s > 0 ? 'L' : 'R')] = lg; lg.add(part(CYL(0.09, 0.06, 0.8, 8), 0, -0.4, 0)); lg.add(part(SPH(0.08, 8, 6), 0, -0.82, 0.05, [1, 0.6, 1.5])); }
  const tail = new THREE.Group(); tail.position.set(0, 0.15, -0.6); body.add(tail); J.tail = tail; tail.add(part(CONE(0.14, 0.9, 8), 0, 0, -0.42, 1, [-1.9, 0, 0]));
  return { g, J };
}
function poseWolf(w, t, mode, k) {
  const J = w.J; const ph = t * 9;
  if (mode === 'run') { J.legFL.rotation.x = Math.sin(ph) * 0.8; J.legFR.rotation.x = Math.sin(ph + 0.6) * 0.8; J.legBL.rotation.x = -Math.sin(ph + 1.6) * 0.8; J.legBR.rotation.x = -Math.sin(ph + 2.2) * 0.8; J.body.rotation.x = Math.sin(ph) * 0.08; J.body.position.y = 0.95 + Math.abs(Math.sin(ph)) * 0.15; J.jaw.rotation.x = 0.2; }
  else { for (const k2 of ['legFL', 'legFR', 'legBL', 'legBR']) J[k2].rotation.x = 0; J.body.position.y = 0.95; J.body.rotation.x = 0; }
  if (mode === 'roar') { const r = ease(k / 0.4); J.head.rotation.x = -0.5 * r; J.jaw.rotation.x = 0.7 * r + Math.sin(t * 40) * 0.05 * r; J.body.rotation.x = -0.15 * r; J.legFL.rotation.x = -0.3 * r; J.legFR.rotation.x = -0.3 * r; }
  else if (mode === 'crouch') { J.body.position.y = 0.8; J.head.rotation.x = 0.25; J.jaw.rotation.x = 0.15 + Math.sin(t * 3) * 0.05; }
  J.tail.rotation.y = Math.sin(t * 3) * 0.3;
}

// ---------- sets ----------
const SKY_VS = `varying vec3 vP; void main(){ vP=normalize(position); gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0); }`;
const SKY_FS = `uniform vec3 top; uniform vec3 mid; uniform vec3 bot; uniform float t; varying vec3 vP;
float h(vec2 p){ return fract(sin(dot(p,vec2(12.9898,78.233)))*43758.5453); }
float n2(vec2 p){ vec2 i=floor(p), f=fract(p); f=f*f*(3.0-2.0*f); return mix(mix(h(i),h(i+vec2(1,0)),f.x),mix(h(i+vec2(0,1)),h(i+vec2(1,1)),f.x),f.y); }
void main(){ float y=vP.y; vec3 c = y>0.0 ? mix(mid, top, pow(clamp(y,0.0,1.0),0.6)) : mix(mid, bot, clamp(-y*3.0,0.0,1.0));
 float cl = n2(vec2(atan(vP.z,vP.x)*3.0 + t*0.01, y*6.0)) * 0.6 + n2(vec2(atan(vP.z,vP.x)*9.0 - t*0.02, y*15.0))*0.4; c *= 0.85 + 0.3*smoothstep(0.35,0.8,cl)*smoothstep(-0.05,0.4,y);
 gl_FragColor=vec4(c,1.0); }`;
function makeSky() {
  const u = { top: { value: C(0x000000) }, mid: { value: C(0x111111) }, bot: { value: C(0x000000) }, t: { value: 0 } };
  const m = new THREE.Mesh(new THREE.SphereGeometry(450, 32, 16), new THREE.ShaderMaterial({ uniforms: u, vertexShader: SKY_VS, fragmentShader: SKY_FS, side: THREE.BackSide, depthWrite: false, fog: false }));
  m.renderOrder = -10; m.userData.u = u; return m;
}
function makeMoon() {
  const g = new THREE.Group();
  const c = document.createElement('canvas'); c.width = c.height = 256; const x = c.getContext('2d');
  const gr = x.createRadialGradient(128, 128, 60, 128, 128, 128); gr.addColorStop(0, 'rgba(255,255,255,0.55)'); gr.addColorStop(1, 'rgba(255,255,255,0)'); x.fillStyle = gr; x.fillRect(0, 0, 256, 256);
  const glow = new THREE.Mesh(new THREE.PlaneGeometry(1, 1), new THREE.MeshBasicMaterial({ map: new THREE.CanvasTexture(c), transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, fog: false, color: 0xffffff }));
  glow.scale.setScalar(3.2); g.add(glow);
  const c2 = document.createElement('canvas'); c2.width = c2.height = 256; const y = c2.getContext('2d'); y.fillStyle = '#fff'; y.beginPath(); y.arc(128, 128, 120, 0, TAU); y.fill();
  for (let i = 0; i < 14; i++) { y.fillStyle = 'rgba(0,0,0,' + (0.06 + hash(i) * 0.1) + ')'; y.beginPath(); y.arc(60 + hash(i + 1) * 140, 60 + hash(i + 2) * 140, 8 + hash(i + 3) * 26, 0, TAU); y.fill(); }
  const disc = new THREE.Mesh(new THREE.PlaneGeometry(1, 1), new THREE.MeshBasicMaterial({ map: new THREE.CanvasTexture(c2), transparent: true, depthWrite: false, fog: false, color: 0xffffff }));
  g.add(disc); g.userData.glow = glow; g.userData.disc = disc; g.renderOrder = -9; glow.renderOrder = -9; disc.renderOrder = -8; return g;
}
function makeStars(n = 900) {
  const ps = new PS(n, { soft: 0.0, order: -9 }); ps.pts.material.fog = false;
  ps.set((i, o) => { const a = hash(i) * TAU, y = 0.08 + hash(i + 3) * 0.9; const r = Math.sqrt(1 - y * y); o.x = Math.cos(a) * r * 400; o.y = y * 400; o.z = Math.sin(a) * r * 400; o.s = 0.9 + hash(i + 7) * 1.6; o.a = 0.4 + hash(i + 9) * 0.6; o.r = o.g = o.b = 1; });
  return ps;
}
function mountains(scene, rad, n, col, hmin, hmax, y0 = -2, seed = 0) {
  const geo = new THREE.ConeGeometry(1, 1, 6); const mat = new THREE.MeshBasicMaterial({ color: col, fog: true });
  const im = new THREE.InstancedMesh(geo, mat, n); const d = new THREE.Object3D();
  for (let i = 0; i < n; i++) { const a = (i / n) * TAU + hash(i + seed) * 0.2; const h = hmin + hash(i * 3 + seed) * (hmax - hmin); const r = rad * (0.9 + hash(i * 5 + seed) * 0.2);
    d.position.set(Math.cos(a) * r, y0 + h / 2, Math.sin(a) * r); d.scale.set(h * (0.9 + hash(i + 11) * 0.8), h, h * (0.9 + hash(i + 13) * 0.8)); d.rotation.y = hash(i + 17) * 3; d.updateMatrix(); im.setMatrixAt(i, d.matrix); }
  scene.add(im); return im;
}
function forest(scene, list, trunkCol = 0xc8ccd8, leafCol = 0x9fb0cc) {
  const n = list.length; const tg = CYL(0.12, 0.2, 1, 6); const lg = new THREE.IcosahedronGeometry(1, 0); const cg = CONE(1, 1, 7);
  const tm = new THREE.InstancedMesh(tg, flat(trunkCol, 0x101418), n); const lm = new THREE.InstancedMesh(lg, flat(leafCol, 0x0a1020, { flatShading: true }), n); const cm = new THREE.InstancedMesh(cg, flat(leafCol, 0x0a1020, { flatShading: true }), n);
  const d = new THREE.Object3D();
  list.forEach(([x, z, s, y = 0], i) => { const h = 4 * s; d.position.set(x, y + h / 2, z); d.scale.set(s, h, s); d.rotation.set(0, 0, 0); d.updateMatrix(); tm.setMatrixAt(i, d.matrix);
    d.position.set(x, y + h * 0.95, z); d.scale.set(1.5 * s, 1.3 * s, 1.5 * s); d.rotation.set(hash(i), hash(i + 1) * 3, 0); d.updateMatrix(); lm.setMatrixAt(i, d.matrix);
    d.position.set(x, y + h * 1.25, z); d.scale.set(1.1 * s, 2.0 * s, 1.1 * s); d.rotation.set(0, hash(i + 2) * 3, 0); d.updateMatrix(); cm.setMatrixAt(i, d.matrix); });
  scene.add(tm, lm, cm); return { tm, lm, cm };
}
function house(scene, x, z, face, s = 1, o = {}) {
  const g = new THREE.Group(); at(g, x, 0, z, s); g.rotation.y = face;
  g.add(at(P(BOX(3, 2.4, 2.6), o.wall || 0x7a5a3c, { olS: 1.012 }), 0, 1.2, 0));
  const roof = P(new THREE.CylinderGeometry(1.75, 1.75, 3.4, 3, 1), o.roof || 0x4a2420, { olS: 1.01 }); rot(at(roof, 0, 2.95, 0), 0, 0, Math.PI / 2); roof.rotation.order = 'ZYX'; roof.rotation.set(Math.PI / 2, 0, Math.PI / 2); roof.scale.set(1, 1, 0.55); g.add(roof);
  g.add(at(new THREE.Mesh(BOX(0.7, 1.3, 0.05), toon(0x2e1c12)), 0.5, 0.65, 1.31));
  const win = new THREE.MeshBasicMaterial({ color: 0x2a1a10 }); g.userData.win = win;
  g.add(at(new THREE.Mesh(BOX(0.6, 0.5, 0.05), win), -0.8, 1.4, 1.31));
  g.add(at(P(BOX(0.25, 0.9, 0.25), 0x3a2a24, { olS: 1.05 }), 0.9, 3.3, -0.4));
  scene.add(g); return g;
}

function addLights(scene) {
  const hemi = new THREE.HemisphereLight(0xffffff, 0x222222, 0.8); const dir = new THREE.DirectionalLight(0xffffff, 0.8); dir.position.set(5, 10, 6);
  const pts = [0, 1].map(() => { const p = new THREE.PointLight(0xff3300, 0, 14, 2); scene.add(p); return p; });
  scene.add(hemi, dir, dir.target); return { hemi, dir, pts };
}

const SETS = {};
function getSet(name) { if (!SETS[name]) SETS[name] = BUILD[name](); return SETS[name]; }
function baseSet() {
  const scene = new THREE.Scene(); scene.fog = new THREE.Fog(0x000000, 10, 120);
  const sky = makeSky(); scene.add(sky); const moon = makeMoon(); moon.visible = false; scene.add(moon); const stars = makeStars(); stars.pts.visible = false; scene.add(stars.pts);
  const L = addLights(scene); return { scene, sky, moon, stars, L, groundY: () => 0, fx: {} };
}
// world-space ambient particles (ash/embers/leaves/dust): analytic around a center
function ambient(set, kind, n, opts = {}) {
  const ps = new PS(n, { blend: kind === 'ash' || kind === 'smoke' ? 'normal' : 'add', soft: kind === 'leaf' ? 0.1 : 0.3, order: 6 }); set.scene.add(ps.pts); set.amb = set.amb || {}; set.amb[kind] = { ps, opts }; return ps;
}
function updAmbient(set, kind, t, cx, cz, on) {
  const A = set.amb && set.amb[kind]; if (!A) return; A.ps.pts.visible = !!on; if (!on) return; const ps = A.ps, o2 = A.opts; const R = o2.r || 14, Hh = o2.h || 9;
  const col = rgb(o2.col || 0xff5020);
  ps.set((i, o) => {
    const fx = hash(i) , fz = hash(i + 0.37), fy = hash(i + 0.71); const sp = o2.sp || 0.5;
    let y = (fy * Hh + (kind === 'ember' ? t * sp * (0.5 + hash(i + 2)) : -t * sp * (0.4 + hash(i + 2)))) % Hh; if (y < 0) y += Hh;
    const wx = Math.sin(t * 0.7 + i) * 0.6 + t * (o2.wind || 0.3);
    let x = ((fx * 2 * R + wx) % (2 * R)); if (x < 0) x += 2 * R; let z = fz * 2 * R;
    o.x = cx - R + x; o.z = cz - R + z; o.y = y + (o2.y0 || 0);
    const edge = Math.min(1, y / 1.0, (Hh - y) / 1.5);
    if (kind === 'ember') { o.s = 0.05 + hash(i + 5) * 0.06; o.a = edge * (0.5 + 0.5 * Math.sin(t * 6 + i)); [o.r, o.g, o.b] = col; }
    else if (kind === 'ash') { o.s = 0.05 + hash(i + 5) * 0.07; o.a = edge * 0.75; o.r = 0.12; o.g = 0.1; o.b = 0.1; }
    else if (kind === 'leaf') { o.s = 0.07 + hash(i + 5) * 0.06; o.a = edge * 0.9; o.r = 0.82; o.g = 0.86; o.b = 0.95; }
    else if (kind === 'dust') { o.s = 0.04 + hash(i + 5) * 0.05; o.a = edge * 0.35; [o.r, o.g, o.b] = col; }
    else if (kind === 'smoke') { o.s = 1.5 + hash(i + 5) * 2.5; o.a = edge * 0.18; o.r = o.g = o.b = 0.06; }
  });
}

// fire emitter pool for a set: positions fixed, toggled by state
function fireField(set, spots, n = 40) {
  const total = spots.length * n; const ps = new PS(total, { soft: 0.1, order: 7 }); const sm = new PS(spots.length * 10, { blend: 'normal', soft: 0.0, order: 6 });
  set.scene.add(ps.pts, sm.pts); set.fire = { ps, sm, spots, n };
}
function updFire(set, t, level) {
  const F = set.fire; if (!F) return; F.ps.pts.visible = F.sm.pts.visible = level > 0; if (level <= 0) return;
  F.ps.set((i, o) => { const si = Math.floor(i / F.n), sp = F.spots[si]; const lv = level * (sp[4] == null ? 1 : sp[4]); const ph = flameP(i, t, o, sp[0], sp[1], sp[2], sp[3] * lv, sp[3] * 0.35, 0.9, si);
    o.s = (0.5 + hash(i) * 0.6) * (1 - ph) * sp[3] * 0.55 * lv; o.a = Math.sin(Math.PI * ph) * 0.9; o.r = 1; o.g = 0.25 + 0.45 * (1 - ph); o.b = 0.05; });
  F.sm.set((i, o) => { const si = Math.floor(i / 10), sp = F.spots[si]; const lv = level * (sp[4] == null ? 1 : sp[4]); const ph = (t * 0.12 + hash(i)) % 1;
    o.x = sp[0] + Math.sin(i + t * 0.3) * 1.2 + ph * 3; o.y = sp[1] + sp[3] * lv + ph * 9; o.z = sp[2] + Math.cos(i) * 1.2; o.s = (2 + ph * 6) * lv; o.a = Math.sin(Math.PI * ph) * 0.5 * lv; o.r = o.g = o.b = 0.05; });
}

const BUILD = {
  void() {
    const S = baseSet(); const sc = S.scene;
    const ground = new THREE.Mesh(new THREE.CircleGeometry(60, 48), flat(0x120c0e)); ground.rotation.x = -Math.PI / 2; sc.add(ground);
    const ring = new THREE.Group(); for (let i = 0; i < 12; i++) { const a = i / 12 * TAU; const h = 2.2 + hash(i) * 1.6; const st = P(BOX(0.7, h, 0.5), 0x4a3a44, { olS: 1.03 }); at(st, Math.cos(a) * 4.5, h / 2, Math.sin(a) * 4.5); st.rotation.y = -a + hash(i + 2) * 0.3; st.rotation.z = (hash(i + 4) - 0.5) * 0.15; ring.add(st); } sc.add(ring);
    sc.add(at(P(CYL(1.3, 1.5, 0.45, 12), 0x302830, { ol: 0.03 }), 0, 0.22, 0));
    const glyph = new THREE.Mesh(new THREE.RingGeometry(1.0, 1.08, 48), basic(0x801010, { side: THREE.DoubleSide })); glyph.rotation.x = -Math.PI / 2; at(glyph, 0, 0.46, 0); sc.add(glyph);
    const baby = makeProp('baby'); at(baby, 0, 0.55, -0.2); sc.add(baby); S.baby = baby;
    // sky crack + giant
    const crack = new THREE.Group(); const cm = basic(0xff2a1a, { fog: false }); let px = -6, py = 30;
    for (let i = 0; i < 16; i++) { const nx = px + 0.8 + hash(i) * 1.4, ny = py + (hash(i + 3) - 0.5) * 2.5; const len = Math.hypot(nx - px, ny - py); const seg = new THREE.Mesh(BOX(len, 0.18, 0.1), cm); at(seg, (px + nx) / 2, (py + ny) / 2, -40); seg.rotation.z = Math.atan2(ny - py, nx - px); crack.add(seg);
      if (i % 3 === 1) { const bl = 2 + hash(i + 8) * 3, ba = -1.2 + hash(i + 9) * 0.8; const b = new THREE.Mesh(BOX(bl, 0.08, 0.1), cm); at(b, nx + Math.cos(ba) * bl / 2, ny + Math.sin(ba) * bl / 2, -40); b.rotation.z = ba; crack.add(b); } px = nx; py = ny; }
    sc.add(crack); S.crack = crack;
    const giant = new THREE.Group(); giant.add(at(new THREE.Mesh(SPH(9, 16, 12), basic(0x040203, { fog: false })), 0, 0, 0, [1, 1.2, 0.6])); for (const s of [-1, 1]) giant.add(at(new THREE.Mesh(SPH(0.9, 10, 8), basic(0xff1a10, { fog: false })), s * 3, 1.5, 5, [1.6, 0.5, 0.3])); for (const s of [-1, 1]) giant.add(rot(at(new THREE.Mesh(CONE(1.2, 7, 6), basic(0x040203, { fog: false })), s * 6, 9, 0), 0, 0, -s * 0.5));
    giant.children.slice().forEach(ch => { if (ch.material.color.getHex() === 0x040203) { const o = new THREE.Mesh(ch.geometry, outlineMat(0.25, 0xa01008)); o.position.copy(ch.position); o.rotation.copy(ch.rotation); o.scale.copy(ch.scale); giant.add(o); } });
    at(giant, 2, 48, -70); sc.add(giant); S.giant = giant;
    const cg = new THREE.Mesh(new THREE.PlaneGeometry(60, 30), new THREE.MeshBasicMaterial({ color: 0x5a0606, transparent: true, opacity: 0.5, blending: THREE.AdditiveBlending, depthWrite: false, fog: false })); at(cg, 4, 32, -75); sc.add(cg); S.cglow = cg;
    const flame = new PS(700, { soft: 0.1, order: 7 }); const flameD = new PS(500, { blend: 'normal', soft: 0.05, order: 8 }); sc.add(flame.pts, flameD.pts); S.flame = flame; S.flameD = flameD;
    ambient(S, 'ember', 500, { r: 16, h: 14, sp: 0.3, col: 0xff4020 }); ambient(S, 'ash', 500, { r: 16, h: 14, sp: 0.25 });
    S.update = (sh, t, lt) => { S.sky.userData.u.t.value = t; updAmbient(S, 'ember', t, 0, 0, true); updAmbient(S, 'ash', t, 0, 0, true);
      const fl = sh.st && sh.st.flame || 0; S.flame.pts.visible = S.flameD.pts.visible = fl > 0;
      if (fl > 0) { S.flame.set((i, o) => { const a = hash(i) * TAU, r = 0.6 + hash(i + 1) * 1.4; const ph = flameP(i, t, o, Math.cos(a) * r, 0.45, Math.sin(a) * r - 0.1, 1.6 * fl, 0.25, 1.0, 3); o.s = (1 - ph) * 0.5 * fl; o.a = Math.sin(Math.PI * ph) * 0.8; o.r = 0.9; o.g = 0.08; o.b = 0.12; });
        S.flameD.set((i, o) => { const a = hash(i + 50) * TAU, r = 0.6 + hash(i + 51) * 1.4; const ph = flameP(i, t, o, Math.cos(a) * r, 0.45, Math.sin(a) * r - 0.1, 1.5 * fl, 0.2, 1.0, 4); o.s = (1 - ph) * 0.32 * fl; o.a = Math.sin(Math.PI * ph) * 0.95; o.r = 0.02; o.g = 0.0; o.b = 0.03; }); }
      S.crack.visible = !!(sh.st && sh.st.crack); const cg = sh.st && sh.st.crack || 0; S.crack.scale.setScalar(0.3 + 0.7 * cg);
      S.cglow.visible = S.crack.visible; S.cglow.material.opacity = 0.6 * cg; S.giant.visible = !!(sh.st && sh.st.giant); S.giant.position.y = 48 - (sh.st && sh.st.giant || 0) * 6;
      S.baby.visible = !(sh.st && sh.st.nobaby); };
    return S;
  },
  room() {
    const S = baseSet(); const sc = S.scene;
    const room = new THREE.Mesh(BOX(7, 3.4, 7), flat(0x5a3e2a, 0, { side: THREE.BackSide })); at(room, 0, 1.7, 0); sc.add(room);
    for (let i = 0; i < 6; i++) sc.add(at(new THREE.Mesh(BOX(7, 0.06, 0.12), toon(0x3a2618)), 0, 0.5 + i * 0.55, -3.45));
    sc.add(at(P(BOX(2.2, 0.45, 1.1), 0x6a4a30, { olS: 1.02 }), -1.6, 0.25, -2.3)); sc.add(at(P(BOX(2.0, 0.15, 1.0), 0xc8c0b0, { olS: 1.02 }), -1.6, 0.55, -2.3)); sc.add(at(P(BOX(0.5, 0.12, 0.7), 0xe8e0d0, { olS: 1.04 }), -2.35, 0.66, -2.3));
    sc.add(at(P(BOX(1.4, 0.8, 0.8), 0x5a3a22, { olS: 1.02 }), 2.2, 0.4, -2.8)); for (let i = 0; i < 6; i++) sc.add(at(P(CYL(0.03, 0.03, 0.3, 6), 0x8a9098, { ol: 0.005 }), 1.8 + i * 0.15, 0.9, -2.7));
    const win = new THREE.Mesh(new THREE.PlaneGeometry(1.2, 1.0), basic(0xffe6c0)); at(win, 0, 1.9, -3.49); sc.add(win);
    const shaft = new THREE.Mesh(new THREE.PlaneGeometry(1.4, 4), new THREE.MeshBasicMaterial({ color: 0xffd8a0, transparent: true, opacity: 0.12, blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide })); rot(at(shaft, 0, 1.2, -2.2), -0.9, 0, 0); sc.add(shaft);
    sc.add(at(P(BOX(0.1, 2.2, 1.0), 0x3a2416, { olS: 1.02 }), 3.45, 1.1, 1.2));
    ambient(S, 'dust', 120, { r: 2.5, h: 3, sp: 0.05, col: 0xffe0b0, wind: 0.05 });
    S.update = (sh, t) => { updAmbient(S, 'dust', t, 0, -1.6, true); }; return S;
  },
  village() {
    const S = baseSet(); const sc = S.scene;
    const top = new THREE.Mesh(new THREE.CircleGeometry(60, 64), flat(0x55604a)); top.rotation.x = -Math.PI / 2; sc.add(top); S.groundMat = top.material;
    const cliff = new THREE.Mesh(CYL(60, 52, 40, 40, true), flat(0x3a3438)); at(cliff, 0, -20, 0); sc.add(cliff);
    const valley = new THREE.Mesh(new THREE.CircleGeometry(400, 32), flat(0x1e2430)); valley.rotation.x = -Math.PI / 2; valley.position.y = -40; sc.add(valley);
    const plaza = new THREE.Mesh(CYL(7, 7, 0.06, 32), flat(0x7a7470)); at(plaza, 0, 0.03, 0); sc.add(plaza);
    const road = new THREE.Mesh(new THREE.PlaneGeometry(56, 3.2), flat(0x6a5a44)); road.rotation.x = -Math.PI / 2; at(road, 32, 0.02, 0); sc.add(road);
    // bell tower
    const tower = new THREE.Group(); for (const [x, z] of [[-1, -1], [1, -1], [-1, 1], [1, 1]]) tower.add(at(P(BOX(0.3, 6, 0.3), 0x5a3a24, { olS: 1.05 }), x * 0.9, 3, z * 0.9));
    tower.add(at(P(BOX(2.6, 0.3, 2.6), 0x4a2a1e, { olS: 1.02 }), 0, 6.1, 0)); tower.add(at(P(CONE(2.0, 1.6, 4), 0x3a1a16, { olS: 1.02 }), 0, 7.0, 0)); tower.children[tower.children.length - 1].rotation.y = Math.PI / 4;
    const bell = new THREE.Group(); bell.position.y = 5.8; bell.add(at(P(CYL(0.25, 0.55, 0.8, 12, true), 0xb08a3a, { ol: 0.02, side: THREE.DoubleSide }), 0, -0.4, 0)); tower.add(bell); S.bell = bell;
    at(tower, 0, 0, -9); sc.add(tower);
    // houses ring
    S.houses = []; const spots = [];
    const hs = [[-9, -4], [-11, 3], [-8, 9], [-2, 12], [6, 11], [11, 6], [-15, -10], [9, -9], [-4, -15], [14, -3], [-17, 2], [17, 12], [3, -16], [-13, 14]];
    hs.forEach(([x, z], i) => { const face = Math.atan2(-x, -z); const h = house(sc, x, z, face, 0.95 + hash(i) * 0.3, { wall: [0x7a5a3c, 0x6e5238, 0x86643e][i % 3] }); S.houses.push(h); spots.push([x, 2.2, z, 2.6, i % 3 === 2 ? 0.6 : 1]); });
    S.home = S.houses[2];
    // well, cart, crates, fences
    sc.add(at(P(CYL(0.9, 0.9, 0.7, 14), 0x6a6666, { ol: 0.03 }), 4, 0.35, -3));
    const cart = new THREE.Group(); cart.add(at(P(BOX(1.6, 0.35, 1.0), 0x8a6a42, { olS: 1.03 }), 0, 0.65, 0)); cart.add(rot(at(P(BOX(1.4, 0.06, 0.08), 0x5a3a24, { olS: 1.05 }), 1.3, 0.6, 0), 0, 0, 0.3));
    const wheelA = P(new THREE.TorusGeometry(0.32, 0.05, 6, 14), 0x4a3020, { ol: 0.01 }); at(wheelA, -0.2, 0.34, 0.55); cart.add(wheelA); const wheelB = P(new THREE.TorusGeometry(0.32, 0.05, 6, 14), 0x4a3020, { ol: 0.01 }); at(wheelB, -0.2, 0.34, -0.55); cart.add(wheelB); S.wheel = wheelB;
    at(cart, 2.5, 0, 2); cart.rotation.y = 0.4; sc.add(cart); S.cart = cart;
    for (let i = 0; i < 8; i++) sc.add(at(P(BOX(0.6, 0.5, 0.6), 0x8a6a42, { olS: 1.04 }), -6 + hash(i) * 2, 0.25 + (i > 4 ? 0.5 : 0), -9 + hash(i + 3) * 2));
    // stone wall (scene 6 crash)
    const wall = new THREE.Group(); for (let i = 0; i < 6; i++) wall.add(at(P(BOX(1.0, 1.4, 0.6), 0x6a6670, { olS: 1.03 }), i * 1.02, 0.7, 0)); at(wall, 2.4, 0, -7); sc.add(wall); S.wall = wall;
    // silver forest around
    const trees = []; for (let i = 0; i < 260; i++) { const a = hash(i) * TAU, r = 22 + hash(i + 1) * 36; const x = Math.cos(a) * r, z = Math.sin(a) * r; if (Math.abs(z) < 3.5 && x > 15) continue; trees.push([x, z, 0.9 + hash(i + 2) * 0.9]); }
    for (let i = 0; i < 160; i++) { const a = hash(i + 500) * TAU, r = 70 + hash(i + 501) * 150; trees.push([Math.cos(a) * r, Math.sin(a) * r, 2 + hash(i + 502) * 1.5, -40]); }
    forest(sc, trees);
    mountains(sc, 260, 40, 0x2a2e3e, 60, 140, -40, 1); mountains(sc, 330, 30, 0x1e2230, 90, 200, -40, 2);
    fireField(S, spots, 36);
    ambient(S, 'ember', 500, { r: 18, h: 12, sp: 0.6, col: 0xff5a20 }); ambient(S, 'ash', 400, { r: 18, h: 12, sp: 0.35 }); ambient(S, 'leaf', 220, { r: 16, h: 9, sp: 0.4 }); ambient(S, 'smoke', 60, { r: 20, h: 14, sp: 0.2, y0: 2 });
    // debris & cracks (aftermath)
    const debris = new THREE.Group(); for (let i = 0; i < 26; i++) { const b = P(BOX(0.2 + hash(i) * 1.6, 0.12, 0.25), 0x2a1a12, { olS: 1.05 }); at(b, (hash(i + 1) - 0.5) * 24, 0.08, (hash(i + 2) - 0.5) * 24); b.rotation.set(hash(i + 3) * 0.4, hash(i + 4) * 3, hash(i + 5) * 0.4); debris.add(b); } sc.add(debris); S.debris = debris;
    const cracks = new THREE.Group(); for (let i = 0; i < 14; i++) { const a = i / 14 * TAU + hash(i) * 0.3, l = 3 + hash(i + 1) * 5; const c = new THREE.Mesh(new THREE.PlaneGeometry(l, 0.12), basic(0x0a0406)); c.rotation.x = -Math.PI / 2; c.rotation.z = -a; at(c, Math.cos(a) * l / 2, 0.07, Math.sin(a) * l / 2); cracks.add(c); } sc.add(cracks); S.cracks = cracks;
    S.update = (sh, t) => {
      S.sky.userData.u.t.value = t; const st = sh.st || {}; const fire = st.fire || 0;
      updFire(S, t, fire); const c = sh.camPos || { x: 0, z: 0 };
      updAmbient(S, 'ember', t, c.x, c.z, fire > 0 || st.embers); updAmbient(S, 'ash', t, c.x, c.z, fire > 0 || st.ash); updAmbient(S, 'leaf', t, c.x, c.z, st.leaves); updAmbient(S, 'smoke', t, c.x, c.z, fire > 0.3 || st.smoke);
      S.debris.visible = !!(st.debris); S.cracks.visible = !!st.cracks; if (st.crackAt) S.cracks.position.set(st.crackAt[0], 0, st.crackAt[1]);
      S.bell.rotation.z = st.bell ? Math.sin(t * 5) * 0.4 : 0;
      for (const h of S.houses) h.userData.win.color.set(st.night ? 0xffb050 : 0x2a1a10);
      S.wall.children.forEach((b, i) => { if (st.wallBroken && i > 1 && i < 4) b.visible = false; else b.visible = true; });
      if (S.wheel) S.wheel.rotation.z = st.fixed ? 0 : 0.6; S.wheel.position.y = st.fixed ? 0.34 : 0.24;
    };
    return S;
  },
  forest() {
    const S = baseSet(); const sc = S.scene;
    const g = new THREE.Mesh(new THREE.PlaneGeometry(300, 300), flat(0x3a4448)); g.rotation.x = -Math.PI / 2; sc.add(g);
    const path = new THREE.Mesh(new THREE.PlaneGeometry(3, 300), flat(0x4e4a40)); path.rotation.x = -Math.PI / 2; at(path, 0, 0.02, 0); sc.add(path);
    const stream = new THREE.Mesh(new THREE.PlaneGeometry(300, 2.4), new THREE.MeshToonMaterial({ color: 0x3a7ab8, emissive: 0x0a2a48, gradientMap: GRAD })); stream.rotation.x = -Math.PI / 2; at(stream, 0, 0.03, -30); sc.add(stream);
    for (let i = 0; i < 10; i++) { const pd = new THREE.Mesh(new THREE.CircleGeometry(0.6 + hash(i) * 0.8, 16), toon(0x4a7aa8, 0x0a1a30)); pd.rotation.x = -Math.PI / 2; at(pd, (hash(i + 1) - 0.5) * 6, 0.03, 10 - i * 7); sc.add(pd); }
    const trees = []; for (let i = 0; i < 420; i++) { const x = (hash(i) - 0.5) * 120, z = (hash(i + 1) - 0.5) * 220; if (Math.abs(x) < 2.6) continue; trees.push([x, z, 0.8 + hash(i + 2) * 1.2]); }
    forest(sc, trees, 0xd4d8e4, 0xa8b6d0);
    for (let i = 0; i < 40; i++) sc.add(at(P(new THREE.DodecahedronGeometry(0.4 + hash(i) * 0.6, 0), 0x5a5e66, { ol: 0.02 }), (hash(i + 3) - 0.5) * 30, 0.2, (hash(i + 4) - 0.5) * 80));
    mountains(sc, 200, 30, 0x2a3040, 50, 100, -5, 3);
    ambient(S, 'leaf', 700, { r: 14, h: 10, sp: 0.9, wind: 0.8 }); ambient(S, 'dust', 200, { r: 12, h: 6, sp: 0.1, col: 0xbfd8ff });
    S.update = (sh, t) => { S.sky.userData.u.t.value = t; const c = sh.camPos || { x: 0, z: 0 }; updAmbient(S, 'leaf', t, c.x, c.z, true); updAmbient(S, 'dust', t, c.x, c.z, true); };
    return S;
  },
  hill() {
    const S = baseSet(); const sc = S.scene;
    const gy = (x, z) => 0.12 * z + Math.sin(x * 0.15) * 0.6 + Math.max(0, Math.abs(x) - 4) * 0.25; S.groundY = gy;
    const geo = new THREE.PlaneGeometry(200, 200, 80, 80); geo.rotateX(-Math.PI / 2); const p = geo.attributes.position; for (let i = 0; i < p.count; i++) p.setY(i, gy(p.getX(i), p.getZ(i))); geo.computeVertexNormals();
    sc.add(new THREE.Mesh(geo, flat(0x2a3038)));
    const pg = new THREE.PlaneGeometry(2.4, 200, 2, 100); pg.rotateX(-Math.PI / 2); const pp = pg.attributes.position; for (let i = 0; i < pp.count; i++) { const x = pp.getX(i) + Math.sin(pp.getZ(i) * 0.08) * 2; pp.setX(i, x); pp.setY(i, gy(x, pp.getZ(i)) + 0.03); }
    sc.add(new THREE.Mesh(pg, flat(0x4a4038))); S.pathX = z => Math.sin(z * 0.08) * 2;
    for (let i = 0; i < 60; i++) { const x = (hash(i) - 0.5) * 40, z = (hash(i + 1) - 0.5) * 120; if (Math.abs(x - Math.sin(z * 0.08) * 2) < 2) continue; sc.add(at(P(new THREE.DodecahedronGeometry(0.3 + hash(i + 2) * 0.9, 0), 0x3e4048, { ol: 0.02 }), x, gy(x, z) + 0.2, z)); }
    const trees = []; for (let i = 0; i < 120; i++) { const x = (hash(i + 7) - 0.5) * 120, z = (hash(i + 8) - 0.5) * 160; if (Math.abs(x) < 8) continue; trees.push([x, z, 0.8 + hash(i + 9), gy(x, z)]); } forest(sc, trees, 0x9aa0b0, 0x5a6478);
    // village lights far below (behind, -z)
    const vl = new PS(160, { soft: 0.0, order: 6 }); vl.set((i, o) => { o.x = (hash(i) - 0.5) * 26; o.z = -70 - hash(i + 1) * 20; o.y = -12 + hash(i + 2) * 3; o.s = 0.25 + hash(i + 3) * 0.3; o.a = 0.6; o.r = 1; o.g = 0.55; o.b = 0.2; }); sc.add(vl.pts);
    const far = mountains(sc, 160, 26, 0x14161f, 40, 80, 0, 5); S.far = far;
    const back = mountains(sc, 240, 20, 0x0c0d14, 80, 140, 0, 6);
    // monster silhouette (walks behind the near ridge on +z side)
    const mon = new THREE.Group(); const mm = basic(0x050407, { fog: false });
    mon.add(at(new THREE.Mesh(SPH(10, 16, 10), mm), 0, 0, 0, [2.2, 1, 1])); mon.add(at(new THREE.Mesh(SPH(5, 12, 8), mm), 20, 4, 0)); for (const s of [-1, 1]) mon.add(rot(at(new THREE.Mesh(CONE(1.5, 9, 5), mm), 20 + s * 2, 11, 0), 0, 0, -s * 0.4 - 0.3));
    for (let i = 0; i < 4; i++) { const lg = new THREE.Mesh(CYL(2, 1.5, 16, 6), mm); at(lg, -12 + i * 8, -12, 0); mon.add(lg); } mon.add(rot(at(new THREE.Mesh(CONE(3, 22, 6), mm), -26, 2, 0), 0, 0, 1.9));
    for (let i = 0; i < 6; i++) mon.add(rot(at(new THREE.Mesh(CONE(1.6, 6, 4), mm), -10 + i * 5, 10, 0), 0, 0, 0.2));
    const eye = new THREE.Mesh(SPH(0.9, 8, 6), basic(0xff2010, { fog: false })); at(eye, 24, 5, 3, [1.5, 0.5, 0.5]); mon.add(eye);
    mon.children.slice().forEach(ch => { if (ch.material === mm) { const o = new THREE.Mesh(ch.geometry, outlineMat(0.35, 0x9a1410)); o.material.fog = false; o.position.copy(ch.position); o.rotation.copy(ch.rotation); o.scale.copy(ch.scale); mon.add(o); } });
    at(mon, -160, 40, -150, 1.5); mon.rotation.y = 0; mon.visible = false; sc.add(mon); S.mon = mon;
    // near ridge in front of the monster (+z)
    const ridge = new THREE.Mesh(new THREE.ConeGeometry(70, 45, 7), basic(0x0a0b10)); at(ridge, 20, 10, 140); sc.add(ridge); const ridge2 = new THREE.Mesh(new THREE.ConeGeometry(60, 40, 6), basic(0x0a0b10)); at(ridge2, -60, 8, 130); sc.add(ridge2);
    ambient(S, 'ember', 160, { r: 12, h: 8, sp: 0.2, col: 0xff3020 }); ambient(S, 'dust', 200, { r: 14, h: 6, sp: 0.05, col: 0xa0b0ff });
    S.update = (sh, t, lt) => { S.sky.userData.u.t.value = t; const c = sh.camPos || { x: 0, z: 0 }; const st = sh.st || {}; updAmbient(S, 'ember', t, c.x, c.z, true); updAmbient(S, 'dust', t, c.x, c.z, true);
      S.mon.visible = st.mon != null; if (st.mon != null) { const u = st.mon; S.mon.position.set(-170 + u * 260, 9 + Math.sin(u * 20) * 1.2, -110); } };
    return S;
  },
  throne() {
    const S = baseSet(); const sc = S.scene;
    const fl = new THREE.Mesh(new THREE.PlaneGeometry(60, 60), new THREE.MeshPhongMaterial({ color: 0x0c0a0e, shininess: 90, specular: 0x401010 })); fl.rotation.x = -Math.PI / 2; sc.add(fl);
    const carpet = new THREE.Mesh(new THREE.PlaneGeometry(2.4, 30), toon(0x4a0608)); carpet.rotation.x = -Math.PI / 2; at(carpet, 0, 0.02, 0); sc.add(carpet);
    for (let i = 0; i < 6; i++) for (const s of [-1, 1]) { sc.add(at(P(CYL(0.6, 0.7, 14, 8), 0x1a161c, { ol: 0.03 }), s * 5, 7, -12 + i * 5)); const br = new PS(30, { soft: 0.1 }); br.pts.userData.b = [s * 3.6, 1.6, -12 + i * 5]; sc.add(br.pts); (S.braz = S.braz || []).push(br); sc.add(at(P(CYL(0.35, 0.2, 1.4, 8), 0x2a2228, { ol: 0.02 }), s * 3.6, 0.7, -12 + i * 5)); }
    const th = new THREE.Group(); th.add(at(P(BOX(3, 0.6, 3), 0x15121a, { olS: 1.02 }), 0, 0.3, 0)); th.add(at(P(BOX(2.2, 0.8, 1.6), 0x0e0c12, { olS: 1.02 }), 0, 1.0, 0)); th.add(at(P(BOX(2.2, 4.5, 0.4), 0x0e0c12, { olS: 1.02 }), 0, 3.0, -0.7));
    for (let i = 0; i < 5; i++) th.add(at(P(CONE(0.22, 1.6 + (i === 2 ? 1 : 0), 4), 0x0e0c12, { ol: 0.02 }), -0.9 + i * 0.45, 5.6 + (i === 2 ? 0.5 : 0), -0.7)); at(th, 0, 0, -16); sc.add(th);
    const back = new THREE.Mesh(new THREE.PlaneGeometry(40, 30), flat(0x0a080c)); at(back, 0, 12, -20); sc.add(back);
    // mural
    const c = document.createElement('canvas'); c.width = 768; c.height = 1024; const x = c.getContext('2d'); x.fillStyle = '#120608'; x.fillRect(0, 0, 768, 1024);
    x.fillStyle = '#2a0a0e'; x.fillRect(260, 120, 250, 860); x.beginPath(); x.moveTo(230, 130); x.lineTo(385, 10); x.lineTo(540, 130); x.fill(); x.fillStyle = '#ff9040'; x.globalAlpha = 0.8; x.fillRect(340, 330, 90, 120); x.globalAlpha = 1;
    x.strokeStyle = '#c0c8e0'; x.fillStyle = '#d8dff0'; x.beginPath(); x.ellipse(385, 365, 16, 20, 0, 0, TAU); x.fill(); x.beginPath(); x.moveTo(365, 385); x.lineTo(405, 385); x.lineTo(420, 450); x.lineTo(350, 450); x.fill(); x.fillStyle = '#1a1014'; x.beginPath(); x.ellipse(385, 360, 18, 16, 0, Math.PI, TAU); x.fill(); x.fillRect(367, 360, 7, 40); x.fillRect(396, 360, 7, 40);
    x.strokeStyle = '#8a1010'; x.lineWidth = 4; for (let i = 0; i < 5; i++) { x.beginPath(); x.moveTo(340 + i * 22, 330); x.lineTo(340 + i * 22, 450); x.stroke(); }
    x.strokeStyle = '#601010'; x.lineWidth = 10; x.strokeRect(20, 20, 728, 984); x.globalAlpha = 0.25; for (let i = 0; i < 200; i++) { x.fillStyle = hash(i) > 0.5 ? '#000' : '#401010'; x.fillRect(hash(i + 1) * 768, hash(i + 2) * 1024, 20, 20); } x.globalAlpha = 1;
    const mural = new THREE.Mesh(new THREE.PlaneGeometry(6, 8), new THREE.MeshBasicMaterial({ map: new THREE.CanvasTexture(c), transparent: true, opacity: 0 })); at(mural, 0, 11.5, -19.6); sc.add(mural); S.mural = mural;
    ambient(S, 'ember', 200, { r: 10, h: 8, sp: 0.15, col: 0xff2010 });
    S.update = (sh, t) => { const st = sh.st || {}; updAmbient(S, 'ember', t, 0, -8, true); S.mural.material.opacity = st.mural || 0;
      for (const br of S.braz) { const b = br.pts.userData.b; br.set((i, o) => { const ph = flameP(i, t, o, b[0], b[1], b[2], 1.0, 0.2, 0.7, i); o.s = (1 - ph) * 0.6; o.a = Math.sin(Math.PI * ph); o.r = 1; o.g = 0.15 + 0.3 * (1 - ph); o.b = 0.05; }); } };
    return S;
  },
};

// ---------- light presets ----------
const LIGHTS = {
  void: { sky: [0x0a0204, 0x3a0810, 0x050102], fog: [0x1a0406, 6, 60], hemi: [0xb05060, 0x200010, 0.85], dir: [0xff4a3a, 1.1, [-4, 6, -5]], grade: [0x200000, 0.0] },
  memory: { sky: [0x200004, 0x400608, 0x100000], fog: [0x300406, 3, 30], hemi: [0xff6060, 0x200000, 0.7], dir: [0xff4030, 1.0, [-4, 6, -5]], grade: [0x500000, 0.25] },
  room: { sky: [0, 0, 0], fog: [0x1a1008, 6, 30], hemi: [0xffd8b0, 0x302018, 0.75], dir: [0xffe0b0, 0.7, [0, 4, -6]], grade: [0x000000, 0] },
  dawn: { sky: [0x4a5a7a, 0xc89a8a, 0x2a2a3a], fog: [0x8a8a9a, 25, 190], hemi: [0xdfe4ff, 0x4a3a30, 0.85], dir: [0xffd0a0, 0.8, [20, 14, -10]], grade: [0x000000, 0] },
  day: { sky: [0x5a6a8a, 0xb8bccb, 0x5a5a6a], fog: [0xa4a8b8, 30, 220], hemi: [0xeef0ff, 0x4a4038, 0.9], dir: [0xfff0e0, 0.85, [12, 20, 8]], grade: [0x000000, 0] },
  omen: { sky: [0x3a2a3a, 0x8a5a5a, 0x2a2228], fog: [0x6a5a60, 20, 170], hemi: [0xffd0d0, 0x3a2a28, 0.8], dir: [0xffb090, 0.75, [12, 20, 8]], grade: [0x300000, 0.08] },
  forest: { sky: [0x3a4a6a, 0x8a96b0, 0x30384a], fog: [0x7a8498, 8, 80], hemi: [0xd0dcff, 0x2a3038, 0.85], dir: [0xd8e4ff, 0.7, [6, 18, 4]], grade: [0x000010, 0.05] },
  fire: { sky: [0x100406, 0x5a1408, 0x200604], fog: [0x3a0e08, 14, 120], hemi: [0xffa070, 0x281010, 0.8], dir: [0xffa060, 0.85, [-10, 12, 6]], grade: [0x400000, 0.08] },
  battle: { sky: [0x0a0204, 0x3a0a08, 0x100204], fog: [0x2a0806, 12, 100], hemi: [0xe8a090, 0x201010, 0.75], dir: [0xffb080, 0.8, [-10, 12, 6]], grade: [0x500000, 0.08] },
  ash: { sky: [0x1a1418, 0x4a3a3a, 0x1a1414], fog: [0x3a3030, 10, 120], hemi: [0xd0b0a0, 0x201818, 0.7], dir: [0xffa070, 0.55, [10, 10, -8]], grade: [0x200808, 0.08] },
  night: { sky: [0x02040e, 0x0e1a34, 0x05060c], fog: [0x0a1020, 12, 160], hemi: [0x8aa0ff, 0x0a0a14, 0.55], dir: [0xa8c0ff, 0.6, [-8, 14, 10]], grade: [0x000010, 0.05] },
  blood: { sky: [0x0a0206, 0x4a1018, 0x05020a], fog: [0x1a0610, 12, 170], hemi: [0xff6a7a, 0x0a0410, 0.6], dir: [0xff3a3a, 0.8, [-8, 14, 30]], grade: [0x300008, 0.1] },
  throne: { sky: [0, 0, 0], fog: [0x080204, 6, 40], hemi: [0x803040, 0x080004, 0.45], dir: [0xff2a20, 0.6, [0, 8, 6]], grade: [0x200000, 0.08] },
};
function applyLight(S, name, k = 1, moon) {
  const L = LIGHTS[name]; const u = S.sky.userData.u; u.top.value.set(L.sky[0]); u.mid.value.set(L.sky[1]); u.bot.value.set(L.sky[2]);
  S.scene.fog.color.set(L.fog[0]); S.scene.fog.near = L.fog[1]; S.scene.fog.far = L.fog[2];
  S.L.hemi.color.set(L.hemi[0]); S.L.hemi.groundColor.set(L.hemi[1]); S.L.hemi.intensity = L.hemi[2] * k; S.L.dir.color.set(L.dir[0]); S.L.dir.intensity = L.dir[1] * k; S.L.dir.position.set(...L.dir[2]);
  RIM.value.set(L.dir[0]).lerp(C(0xffffff), 0.35); RIMK.value = ANIME ? (L.rim == null ? 0.55 : L.rim) : 0;
  const night = name === 'night' || name === 'blood' || name === 'void' || name === 'memory'; S.stars.pts.visible = name === 'night' || name === 'blood';
}

// ---------- actors registry ----------
const ACT = {};
function actor(id) {
  if (ACT[id]) return ACT[id];
  let d; if (CASTDEF[id]) d = CASTDEF[id]; else if (/^s\d+$/.test(id)) d = soldierDef(+id.slice(1)); else if (/^v\d+$/.test(id)) d = villagerDef(+id.slice(1));
  if (id === 'wolf') { const w = buildWolf(); w.isWolf = 1; w.props = {}; return (ACT[id] = w); }
  const a = buildHuman(d); a.id = id; return (ACT[id] = a);
}

// ---------- posing ----------
function resetPose(a) { const J = a.J; for (const k in J) { const o = J[k]; if (o && o.rotation) o.rotation.set(0, 0, 0); } J.hip.position.y = a.hipY; if (J.mouth) J.mouth.scale.y = 1; }
function pose(a, act, k, st) {
  const J = a.J; const br = Math.sin(k * 2.1) * 0.025; const r = (o, x, y, z) => { if (x != null) o.rotation.x = x; if (y != null) o.rotation.y = y; if (z != null) o.rotation.z = z; };
  const idleArms = () => { r(J.shL, 0.03, null, 0.07 + br); r(J.shR, 0.03, null, -0.07 - br); r(J.elL, -0.15); r(J.elR, -0.15); };
  const kneelLegs = () => { J.hip.position.y = 0.5; r(J.legR, 0.05); r(J.kneeR, 1.55); r(J.legL, -1.45); r(J.kneeL, 1.45); };
  const crouchLegs = () => { J.hip.position.y = 0.5; r(J.legL, -1.1, null, 0.1); r(J.legR, -1.1, null, -0.1); r(J.kneeL, 2.0); r(J.kneeR, 2.0); };
  const walkLegs = (ph, sw, kb) => { r(J.legL, -Math.sin(ph) * sw); r(J.legR, Math.sin(ph) * sw); r(J.kneeL, kb * Math.max(0, Math.sin(ph - 1.2)) + 0.05); r(J.kneeR, kb * Math.max(0, Math.sin(ph + Math.PI - 1.2)) + 0.05); J.hip.position.y = a.hipY - Math.abs(Math.cos(ph)) * (sw * 0.06) ; };
  switch (act) {
    default: case 'idle': idleArms(); r(J.torso, 0.02 + br * 0.3); r(J.head, null, Math.sin(k * 0.37) * 0.07); break;
    case 'talk': idleArms(); r(J.torso, 0.02); r(J.shR, -0.35 + Math.sin(k * 2.3) * 0.15, null, -0.15); r(J.elR, -0.9 + Math.sin(k * 3.1) * 0.2); r(J.head, Math.sin(k * 2.7) * 0.05, Math.sin(k * 0.9) * 0.08); break;
    case 'walk': case 'run': case 'march': { const run = act === 'run'; const ph = st.phase; const sw = run ? 0.95 : act === 'march' ? 0.45 : 0.5;
      walkLegs(ph, sw, run ? 1.5 : 0.7); r(J.shL, Math.sin(ph) * sw * 0.9, null, 0.08); r(J.shR, -Math.sin(ph) * sw * 0.9, null, -0.08); r(J.elL, run ? -1.4 : -0.25); r(J.elR, run ? -1.4 : -0.25); r(J.torso, run ? 0.3 : 0.05, Math.sin(ph) * 0.08); if (run) J.hip.position.y += Math.abs(Math.sin(ph)) * 0.06; break; }
    case 'kneel': kneelLegs(); r(J.torso, 0.2); idleArms(); r(J.shL, -0.4); r(J.elL, -0.5); r(J.head, 0.25); break;
    case 'kneelbow': kneelLegs(); r(J.torso, 0.35); r(J.shL, -0.6); r(J.elL, -0.6); r(J.shR, 0.2, null, -0.1); r(J.head, 0.45); break;
    case 'crouch': crouchLegs(); r(J.torso, 0.55); r(J.shL, -1.0 + Math.sin(k * 5) * 0.12, null, -0.2); r(J.shR, -1.1 + Math.sin(k * 6 + 1) * 0.15, null, 0.2); r(J.elL, -0.5); r(J.elR, -0.6 + Math.sin(k * 7) * 0.2); r(J.head, 0.3); break;
    case 'protect': crouchLegs(); r(J.torso, 0.9); r(J.shL, -1.6, null, 0.6); r(J.shR, -1.6, null, -0.6); r(J.elL, -0.5); r(J.elR, -0.5); r(J.head, -0.1); break;
    case 'lie': J.hip.position.y = 0.16; r(J.hip, -1.52); r(J.shL, 0.2, null, 0.3); r(J.shR, 0.2, null, -0.3); r(J.legL, 0, null, 0.08); r(J.legR, 0, null, -0.08); r(J.head, -0.1, 0.3); break;
    case 'situp': { const u = ease(k / (st.dur || 0.8)); J.hip.position.y = 0.16; r(J.hip, -1.52 * (1 - u)); r(J.legL, -1.52 * u); r(J.legR, -1.52 * u); r(J.shL, -0.3 * u, null, 0.3); r(J.shR, -0.3 * u, null, -0.3); r(J.elL, -0.6 * u); r(J.elR, -0.6 * u); r(J.torso, 0.1 * u + Math.sin(k * 7) * 0.03 * u); break; }
    case 'sitbed': J.hip.position.y = 0.16; r(J.legL, -1.52); r(J.legR, -1.52); r(J.torso, 0.12 + br); r(J.shR, -1.1, null, 0.25); r(J.elR, -1.0); r(J.shL, 0.1, null, 0.2); r(J.head, 0.35); break;
    case 'sit': J.hip.position.y = 0.14; r(J.legL, -1.4, null, 0.15); r(J.legR, -1.4, null, -0.15); r(J.kneeL, 0.6); r(J.kneeR, 0.6); r(J.torso, 0.25 + br); r(J.shL, -0.5, null, 0.1); r(J.shR, -0.5, null, -0.1); r(J.elL, -0.7); r(J.elR, -0.7); r(J.head, 0.3); break;
    case 'cast': idleArms(); r(J.torso, 0.08); r(J.shR, -1.45, null, -0.1); r(J.elR, -0.1); r(J.shL, -0.3 + br); r(J.legL, -0.25); r(J.kneeL, 0.3); r(J.legR, 0.2); break;
    case 'cast2': r(J.torso, 0.1); r(J.shR, -1.5, null, -0.25); r(J.shL, -1.5, null, 0.25); r(J.elR, -0.1); r(J.elL, -0.1); r(J.legL, -0.3); r(J.kneeL, 0.35); r(J.legR, 0.25); break;
    case 'castup': idleArms(); r(J.shL, -2.6, null, 0.2); r(J.elL, -0.2); r(J.head, -0.25); r(J.torso, -0.05); break;
    case 'raise': idleArms(); r(J.shR, -2.95, null, -0.1); r(J.elR, -0.1); r(J.head, -0.2); r(J.torso, -0.05); break;
    case 'point': idleArms(); r(J.shR, -1.5, null, -0.05); r(J.elR, 0); r(J.torso, 0.05); break;
    case 'dagger': idleArms(); r(J.shR, -1.35, null, 0.25); r(J.elR, -0.2); r(J.torso, 0.1); r(J.legL, -0.4); r(J.kneeL, 0.5); r(J.legR, 0.25); break;
    case 'carry': r(J.shL, -0.75, null, -0.1); r(J.shR, -0.75, null, 0.1); r(J.elL, -0.9); r(J.elR, -0.9); r(J.torso, -0.04); break;
    case 'hold': r(J.shL, -0.75, null, -0.25); r(J.shR, -0.75, null, 0.25); r(J.elL, -1.05); r(J.elR, -1.05); r(J.head, 0.38); r(J.torso, 0.08 + br * 0.3); break;
    case 'lookhand': idleArms(); r(J.shR, -1.15, null, 0.3); r(J.elR, -1.35); r(J.head, 0.25, -0.1); r(J.torso, 0.04); break;
    case 'lookup': idleArms(); r(J.head, -0.35, Math.sin(k * 0.4) * 0.05); break;
    case 'cane': r(J.torso, 0.3 + br * 0.3); r(J.head, -0.22); r(J.shR, -0.5, null, -0.12); r(J.elR, -0.4); r(J.shL, 0.1, null, 0.12); r(J.elL, -0.3); break;
    case 'clench': idleArms(); r(J.torso, 0.12); r(J.head, 0.3); r(J.shL, 0.05, null, 0.18 + Math.sin(k * 30) * 0.02); r(J.shR, 0.05, null, -0.18 - Math.sin(k * 31) * 0.02); r(J.elL, -0.3); r(J.elR, -0.3); break;
    case 'shout': r(J.torso, -0.12); r(J.head, -0.25); r(J.shL, -0.3, null, 0.6); r(J.shR, -0.3, null, -0.6); r(J.elL, -0.8); r(J.elR, -0.8); r(J.legL, -0.2); r(J.legR, 0.2); break;
    case 'spread': r(J.torso, -0.05); r(J.shL, -0.3, null, 1.35); r(J.shR, -0.3, null, -1.35); r(J.elL, -0.15); r(J.elR, -0.15); r(J.legL, -0.3, null, 0.1); r(J.legR, 0.3, null, -0.1); r(J.head, -0.1); break;
    case 'guard': r(J.shL, -1.3, null, -0.35); r(J.shR, -1.3, null, 0.35); r(J.elL, -1.4); r(J.elR, -1.4); r(J.torso, 0.15); r(J.legL, -0.4); r(J.kneeL, 0.5); r(J.legR, 0.35); r(J.kneeR, 0.2); r(J.head, 0.15); break;
    case 'block': r(J.shR, -1.65, null, 0.25); r(J.elR, -1.6); r(J.shL, -0.3, null, 0.4); r(J.elL, -0.9); r(J.torso, 0.1); r(J.legL, -0.45); r(J.kneeL, 0.5); r(J.legR, 0.4); r(J.kneeR, 0.3); break;
    case 'stance': r(J.torso, 0.18); r(J.shL, -0.6, null, 0.3); r(J.shR, -0.9, null, -0.2); r(J.elL, -1.2); r(J.elR, -1.3); r(J.legL, -0.45); r(J.kneeL, 0.6); r(J.legR, 0.45); r(J.kneeR, 0.3); J.hip.position.y = a.hipY - 0.06; r(J.head, -0.1); break;
    case 'punch': { const w = clamp(k / 0.3), s2 = clamp((k - 0.3) / 0.12); r(J.torso, 0.1 + 0.15 * s2, -0.5 * w + 0.9 * s2); r(J.shR, -0.4 * w - 1.15 * s2, null, -0.1); r(J.elR, -1.8 * w + 1.75 * s2); r(J.shL, -0.8, null, 0.3); r(J.elL, -1.3); r(J.legL, -0.5); r(J.kneeL, 0.55); r(J.legR, 0.5); r(J.kneeR, 0.25); J.hip.position.y = a.hipY - 0.06; break; }
    case 'swing': { const w = clamp(k / 0.35), s2 = clamp((k - 0.35) / 0.15); r(J.torso, 0.1, 0.6 * w - 1.2 * s2); r(J.shR, -2.4 * w + 1.4 * s2, null, -0.3); r(J.shL, -2.2 * w + 1.3 * s2, null, 0.3); r(J.elR, -0.4); r(J.elL, -0.4); r(J.legL, -0.5); r(J.kneeL, 0.5); r(J.legR, 0.45); break; }
    case 'slash': { const c = Math.sin(k * 7); r(J.torso, 0.15, c * 0.6); r(J.shR, -1.3 + c * 0.7, null, -0.4 - c * 0.3); r(J.shL, -1.3 - c * 0.7, null, 0.4 - c * 0.3); r(J.elR, -0.3); r(J.elL, -0.3); r(J.legL, -0.5); r(J.kneeL, 0.6); r(J.legR, 0.5); r(J.kneeR, 0.3); J.hip.position.y = a.hipY - 0.08; break; }
    case 'throw': { const w = clamp(k / 0.4), s2 = clamp((k - 0.4) / 0.15); r(J.shR, -2.8 * w + 1.4 * s2, null, -0.2); r(J.elR, -0.6 * w + 0.6 * s2); r(J.torso, -0.1 * w + 0.3 * s2, 0.4 * w - 0.6 * s2); idleArms(); r(J.shR, -2.8 * w + 1.4 * s2); break; }
    case 'hit': { const u = clamp(k / 0.25); r(J.torso, -0.5 * u); r(J.head, -0.4 * u); r(J.shL, -0.6 * u, null, 0.8 * u); r(J.shR, -0.6 * u, null, -0.8 * u); r(J.legL, -0.4 * u); break; }
    case 'fall': { if (k < 0.45) { const u = k / 0.45; r(J.torso, -0.6 * u); r(J.head, -0.5); r(J.shL, -1.2 * u, null, 1.0 * u); r(J.shR, -1.2 * u, null, -1.0 * u); r(J.legL, -0.8 * u); r(J.legR, -0.3 * u); J.hip.position.y = a.hipY + Math.sin(u * Math.PI) * 0.3; } else { J.hip.position.y = 0.16; r(J.hip, -1.52); r(J.shL, 0.3, null, 0.9); r(J.shR, 0.1, null, -0.5); r(J.legL, -0.3); r(J.kneeL, 0.6); r(J.head, -0.2, 0.4); } break; }
    case 'getup': { const u = ease(k / (st.dur || 1.4)); J.hip.position.y = lerp(0.16, a.hipY, u); r(J.hip, -1.52 * (1 - u)); r(J.legL, -1.2 * Math.sin(u * Math.PI)); r(J.kneeL, 1.6 * Math.sin(u * Math.PI)); r(J.shR, -0.5, null, -0.4); r(J.torso, 0.3 * Math.sin(u * Math.PI)); break; }
    case 'hurt': kneelLegs(); r(J.torso, 0.3 + Math.sin(k * 3) * 0.02); r(J.shL, -1.0, null, -0.55); r(J.elL, -1.55); r(J.shR, 0.15, null, -0.1); r(J.elR, -0.2); r(J.head, 0.3); break;
    case 'struggle': r(J.torso, 0.05 + Math.sin(k * 13) * 0.04); r(J.shL, -0.4 + Math.sin(k * 11) * 0.1, null, 0.9); r(J.shR, -0.4 + Math.sin(k * 12) * 0.1, null, -0.9); r(J.elL, -1.0); r(J.elR, -1.0); r(J.head, -0.3 + Math.sin(k * 9) * 0.06); J.hip.position.y = a.hipY + 0.25; r(J.legL, 0.15); r(J.legR, -0.1); r(J.kneeL, 0.4); break;
    case 'cry': r(J.torso, 0.25); r(J.head, 0.4 + Math.sin(k * 8) * 0.04); r(J.shL, -2.0, null, -0.4); r(J.shR, -2.0, null, 0.4); r(J.elL, -1.9); r(J.elR, -1.9); break;
    case 'cower': crouchLegs(); r(J.torso, 0.6); r(J.shL, -2.2, null, -0.5); r(J.shR, -2.2, null, 0.5); r(J.elL, -2.0); r(J.elR, -2.0); r(J.head, 0.5); break;
    case 'flinch': r(J.torso, -0.1); r(J.head, 0.2, 0.4); r(J.shL, -1.6, null, -0.3); r(J.elL, -1.8); r(J.shR, -1.4, null, 0.3); r(J.elR, -1.8); break;
    case 'carrybaby': r(J.shL, -0.6, null, -0.3); r(J.shR, -0.7, null, 0.4); r(J.elL, -1.5); r(J.elR, -1.3); r(J.head, 0.35); r(J.torso, 0.05); break;
    case 'reach': r(J.torso, 0.4); r(J.shR, -1.4, null, -0.1); r(J.shL, -1.2, null, 0.1); r(J.head, 0.1); break;
    case 'staff': idleArms(); r(J.shR, -0.25, null, -0.1); r(J.elR, -1.2); break;
    case 'wave': idleArms(); r(J.shR, -2.6 + Math.sin(k * 6) * 0.15, null, -0.5 + Math.sin(k * 6) * 0.25); r(J.elR, -0.3); break;
    case 'throne': J.hip.position.y = 0.45; r(J.legL, -1.5, null, 0.12); r(J.legR, -1.5, null, -0.12); r(J.kneeL, 1.45); r(J.kneeR, 1.45); r(J.torso, -0.08 + br * 0.3); r(J.shL, -0.7, null, 0.25); r(J.shR, -0.7, null, -0.25); r(J.elL, -0.6); r(J.elR, -0.6); break;
    case 'throneraise': J.hip.position.y = 0.45; r(J.legL, -1.5, null, 0.12); r(J.legR, -1.5, null, -0.12); r(J.kneeL, 1.45); r(J.kneeR, 1.45); r(J.torso, -0.05); r(J.shL, -0.7, null, 0.25); r(J.elL, -0.6); r(J.shR, -1.3 - 0.4 * ease(k / 1.2), null, -0.5); r(J.elR, -0.2); break;
    case 'portal': idleArms(); r(J.shR, -1.0, null, -0.1); r(J.elR, -0.2); r(J.torso, 0.25); r(J.head, 0.2); break;
  }
}
function setMouth(a, talking, t) { if (!a.J || !a.J.mouth) return; a.J.mouth.scale.y = talking ? 1 + Math.abs(Math.sin(t * 17) * Math.sin(t * 6.1 + 1)) * 4 : 1; }
function setEyes(a, mode) { if (!a.J || !a.J.eyeL) return; const base = a.d.eye;
  if (a.J.animeEyes) { const L = a.J.eyeL, R = a.J.eyeR; L.color.set(0xffffff); R.color.set(0xffffff); L.map = mode === 'glow' ? L.userData.tx.glow : L.userData.tx.base; R.map = mode === 'gold' ? R.userData.tx.gold : mode === 'glow' ? R.userData.tx.glow : R.userData.tx.base; return; }
  a.J.eyeL.color.set(mode === 'glow' ? 0xff4020 : base); a.J.eyeR.color.set(mode === 'gold' || mode === 'glow' ? 0xffc030 : base); }
