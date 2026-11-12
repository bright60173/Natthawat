// Character models, edition 2: shaped anime heads (chin, ears, nose), strand hair, lathe-turned bodies and
// layered costumes. Replaces buildHuman() from engine.js; joint names and pivots are unchanged so every pose still works.
'use strict';
const lathe = (pts, seg = 16) => new THREE.LatheGeometry(pts.map(p => new THREE.Vector2(p[0], p[1])), seg);
const HEADGEO = (() => { const r = 0.16, g = new THREE.SphereGeometry(r, 28, 22), p = g.attributes.position;
  for (let i = 0; i < p.count; i++) { let x = p.getX(i), y = p.getY(i), z = p.getZ(i); if (y < 0) { const d = -y / r, f = 1 - 0.46 * Math.pow(d, 1.45); x *= f; z *= f * 0.97; z += 0.016 * d; y *= 1.08; } if (z > 0) z *= 0.93; x *= 0.96; p.setXYZ(i, x, y, z); }
  g.computeVertexNormals(); return g; })();
const STRANDS = {};
function strandGeo(len, w, bend) { const k = len + ':' + w + ':' + bend; if (STRANDS[k]) return STRANDS[k]; const g = new THREE.ConeGeometry(w, len, 5, 5); g.translate(0, len / 2, 0); const p = g.attributes.position;
  for (let i = 0; i < p.count; i++) { const t = p.getY(i) / len; p.setZ(i, p.getZ(i) * 0.55 + bend * t * t * len); } g.computeVertexNormals(); return (STRANDS[k] = g); }
const UPV = new THREE.Vector3(0, 1, 0);
function capeGeo(r1, r2, h, a0, al, zig = 0.07, seg = 18) { const g = new THREE.CylinderGeometry(r1, r2, h, seg, 3, true, a0, al); const p = g.attributes.position; for (let i = 0; i < p.count; i++) { if (p.getY(i) < -h / 2 + 0.001) { const a = Math.atan2(p.getX(i), p.getZ(i)); p.setY(i, p.getY(i) + (Math.sin(a * 9) > 0 ? zig : -zig * 0.4)); } } g.computeVertexNormals(); return g; }
function buildHuman(d) {
  const root = new THREE.Group(); const J = {}; const simple = !!d.simple; const ol = simple ? 0 : 0.013; const O = (o = {}) => Object.assign({ ol }, o);
  const helm = d.hs === 'helm', hood = d.hs === 'hood', fem = !!d.female, big = d.cloth === 'armor';
  const tall = d.old || (d.scale || 1) < 0.8 ? 1.0 : 1.1, hipY = 0.86 * tall;
  const hip = new THREE.Group(); hip.position.y = hipY; root.add(hip); J.hip = hip;
  const torso = new THREE.Group(); hip.add(torso); J.torso = torso;
  // ---- torso ----
  const sw = big ? 0.2 : fem ? 0.135 : 0.155, waist = big ? 0.15 : fem ? 0.09 : 0.11, hipw = big ? 0.16 : fem ? 0.125 : 0.12;
  const tg = lathe([[0.02, -0.06], [hipw, -0.02], [hipw * 0.97, 0.08], [waist, 0.2], [sw * 0.9, 0.34], [sw, 0.44], [sw * 0.72, 0.5], [0.055, 0.53]], 18);
  const tm = P(tg, d.top, O()); tm.scale.set(1, 1, 0.68); torso.add(tm);
  torso.add(at(P(SPH(0.12, 12, 10), d.pants, O()), 0, 0.0, 0, [hipw / 0.12 * 1.02, 0.62, 0.72]));
  if (!big && !simple) { torso.add(at(P(CYL(waist * 1.06, waist * 1.1, 0.045, 14), 0x3a2618, { ol: 0 }), 0, 0.13, 0, [1, 1, 0.7])); torso.add(at(new THREE.Mesh(BOX(0.045, 0.05, 0.02), basic(0xc8a040)), 0, 0.13, waist * 0.76)); }
  // ---- neck & head ----
  const neck = new THREE.Group(); neck.position.y = 0.52; torso.add(neck); J.neck = neck; neck.add(at(P(CYL(0.042, 0.05, 0.11, 10), helm ? 0x15151a : d.skin, { ol: 0 }), 0, 0.035, 0));
  const head = new THREE.Group(); head.position.y = 0.08; neck.add(head); J.head = head;
  const eyeMat = new THREE.MeshBasicMaterial({ color: d.eye }), eyeMatR = new THREE.MeshBasicMaterial({ color: d.eye }); J.eyeL = eyeMat; J.eyeR = eyeMatR;
  if (helm) {
    head.add(at(P(SPH(0.17, 18, 14), 0x16161c, { ol: 0.014 }), 0, 0.16, 0, [1, 1.05, 1.05]));
    head.add(at(P(BOX(0.2, 0.2, 0.08), 0x1e1e26, { olS: 1.06 }), 0, 0.1, 0.13)); head.add(at(new THREE.Mesh(BOX(0.25, 0.034, 0.05), basic(0xff1a10)), 0, 0.165, 0.165)); head.add(at(new THREE.Mesh(BOX(0.012, 0.09, 0.04), basic(0x8a0a0a)), 0, 0.09, 0.175));
    for (const s of [-1, 1]) { const hg = new THREE.Group(); hg.position.set(s * 0.14, 0.26, 0); hg.rotation.z = -s * 0.75; hg.add(at(P(strandGeo(simple ? 0.2 : 0.32, 0.05, 0.5), 0x3a0c10, { ol: 0.01 }), 0, 0, 0)); hg.children[0].rotation.y = s > 0 ? Math.PI / 2 : -Math.PI / 2; head.add(hg); }
    head.add(at(P(BOX(0.035, 0.14, 0.34), 0x3a0c10, { olS: 1.08 }), 0, 0.33, -0.02));
  } else if (hood) {
    head.add(at(P(SPH(0.165, 16, 14), d.skin, { ol: 0.012 }), 0, 0.15, 0, [1, 1.07, 1])); head.add(at(P(SPH(0.21, 14, 10), d.cloak, { ol: 0.015 }), 0, 0.17, -0.03, [1, 1.15, 1.05])); head.add(at(P(CONE(0.17, 0.3, 10), d.cloak, { ol: 0.012 }), 0, 0.38, -0.05)); head.add(at(new THREE.Mesh(BOX(0.25, 0.18, 0.02), basic(0x000000)), 0, 0.13, 0.16));
    for (const s of [-1, 1]) { const e = new THREE.Mesh(SPH(0.026, 8, 6), s > 0 ? eyeMat : eyeMatR); at(e, s * 0.06, 0.15, 0.18, [1.6, 0.6, 0.6]); head.add(e); }
  } else {
    const hs = (d.scale || 1) < 0.8 ? 1.0 : 0.9; head.scale.setScalar(hs);
    head.add(at(P(HEADGEO, d.skin, { ol: 0.012 }), 0, 0.15, 0));
    for (const s of [-1, 1]) { head.add(at(P(SPH(0.03, 8, 8), d.skin, { ol: 0.008 }), s * 0.15, 0.13, -0.005, [0.5, 1, 0.8]));
      const tx = eyeTextures(d); const em = new THREE.MeshBasicMaterial({ map: tx.base, transparent: true, depthWrite: false, polygonOffset: true, polygonOffsetFactor: -4 }); em.userData.tx = tx; if (s > 0) J.eyeL = em; else J.eyeR = em;
      const e = new THREE.Mesh(new THREE.PlaneGeometry(fem ? 0.108 : 0.1, fem ? 0.13 : 0.112), em); at(e, s * 0.066, 0.128, 0.128); e.rotation.y = s * 0.44; e.scale.x = s; e.renderOrder = 3; head.add(e); J.animeEyes = 1; (J.eyeM = J.eyeM || []).push(e);
      head.add(rot(at(new THREE.Mesh(BOX(0.06, 0.009, 0.008), basic(d.hair === 0xd8e2f4 ? 0x8a94aa : d.hair === 0xa4a4ac ? 0x7a7a82 : 0x1a1014)), s * 0.066, 0.2 - (d.old ? 0.004 : 0), 0.132), 0, s * 0.44, s * (d.old ? -0.2 : fem ? 0.06 : 0.16))); }
    head.add(rot(at(new THREE.Mesh(CONE(0.011, 0.03, 4), toon(C(d.skin).multiplyScalar(0.86).getHex())), 0, 0.085, 0.142), 1.2, 0, 0));
    const mouth = new THREE.Mesh(BOX(0.034, 0.008, 0.008), basic(0x4a1a1e)); at(mouth, 0, 0.045, 0.129); head.add(mouth); J.mouth = mouth;
    if (fem && !d.old) for (const s of [-1, 1]) { const b = new THREE.Mesh(new THREE.CircleGeometry(0.022, 12), new THREE.MeshBasicMaterial({ color: 0xff8a8a, transparent: true, opacity: 0.35, depthWrite: false })); at(b, s * 0.085, 0.075, 0.118); b.rotation.y = s * 0.7; head.add(b); }
    // ---- hair: cap + strands ----
    const hc = d.hair, hl = C(hc).lerp(C(0xffffff), d.hair === 0xd8e2f4 ? 0.0 : 0.16).getHex(), sh2 = C(hc).multiplyScalar(d.hair === 0xd8e2f4 ? 0.8 : 0.7).getHex();
    { const cap = P(new THREE.SphereGeometry(0.166, 20, 12, 0, TAU, 0, Math.PI * 0.56), hc, { ol: 0.011 }); at(cap, 0, 0.158, -0.022, [1.03, 1.0, 1.05]); cap.rotation.x = -0.42; head.add(cap); }
    const hairBack = new THREE.Group(); hairBack.position.set(0, 0.2, -0.1); head.add(hairBack); J.hairBack = hairBack;
    const strand = (par, x, y, z, dir, len, w, bend, col, roll = 0) => { const m = P(strandGeo(len, w, bend), col == null ? hc : col, { ol: simple ? 0 : 0.009 }); m.position.set(x, y, z); m.quaternion.setFromUnitVectors(UPV, new THREE.Vector3(dir[0], dir[1], dir[2]).normalize()); m.rotateY(roll); par.add(m); return m; };
    const style = d.hs;
    if (style === 'spiky') {
      for (let i = 0; i < 9; i++) { const a = i / 9 * TAU + 0.2, up = 0.55 + hash(i) * 0.5; strand(head, Math.sin(a) * 0.09, 0.27, Math.cos(a) * 0.08 - 0.02, [Math.sin(a) * 0.9, up, Math.cos(a) * 0.9 - 0.25], 0.2 + hash(i + 3) * 0.08, 0.06, 0.25, i % 3 === 0 ? hl : hc, a); }
      for (let i = 0; i < 8; i++) { const a = Math.PI + (i - 3.5) * 0.3; strand(head, Math.sin(a) * 0.14, 0.17 - Math.abs(i - 3.5) * 0.008, Math.cos(a) * 0.14 - 0.01, [Math.sin(a) * 1.0, -0.25 - hash(i) * 0.3, Math.cos(a) * 1.0], 0.2 + hash(i + 5) * 0.07, 0.062, 0.3, i % 2 ? sh2 : hc, a); }
      for (const s of [-1, 1]) for (let i = 0; i < 2; i++) strand(head, s * 0.15, 0.2 - i * 0.04, 0.03 - i * 0.03, [s * 0.75, -0.75, 0.15], 0.16, 0.05, 0.35, hc, s * 1.2);
      [[-0.11, -0.7, 0.1], [-0.065, -0.3, 0.085], [-0.02, 0.25, 0.1], [0.03, -0.2, 0.08], [0.075, 0.4, 0.085], [0.115, 0.8, 0.1]].forEach(([x, tx, len], i) => strand(head, x, 0.292, 0.118, [tx * 0.4, -1, 0.5], len, 0.042, -0.3, i === 2 ? hl : hc, 0));
      strand(head, 0.01, 0.31, 0.02, [0.3, 1, 0.5], 0.13, 0.025, 0.9, hc);
    } else if (style === 'long' || style === 'longdark') {
      for (let i = 0; i < 9; i++) { const u = (i - 4) / 4; strand(hairBack, u * 0.13, 0, -0.02 - (1 - u * u) * 0.04, [u * 0.22, -1, -0.12], 0.7 - Math.abs(u) * 0.14 + hash(i) * 0.06, 0.07, 0.12, i % 3 === 1 ? sh2 : hc, 0); }
      for (const s of [-1, 1]) { strand(head, s * 0.145, 0.2, 0.04, [s * 0.12, -1, 0.12], 0.44, 0.045, 0.1, hc, 0); strand(head, s * 0.155, 0.2, -0.02, [s * 0.18, -1, -0.05], 0.36, 0.05, 0.1, sh2, 0); }
      for (let i = 0; i < 8; i++) { const u = (i - 3.5) / 3.5; strand(head, u * 0.115, 0.292, 0.122 - u * u * 0.04, [u * 0.14, -1, 0.42], 0.07 + (i % 2) * 0.018 + Math.abs(u) * 0.045, 0.04, -0.25, hc, 0); }
      if (style === 'long') { const tie = new THREE.Mesh(new THREE.TorusGeometry(0.035, 0.012, 6, 14, Math.PI * 1.3), basic(0x8fe8ff)); at(tie, 0.13, 0.27, 0.03); tie.rotation.set(0.2, 0.9, 0.5); head.add(tie); }
    } else if (style === 'bun') { hp2(head, P(SPH(0.075, 12, 10), hc, { ol: 0.01 }), 0, 0.31, -0.11); for (let i = 0; i < 6; i++) { const u = (i - 2.5) / 2.5; strand(head, u * 0.11, 0.292, 0.118 - u * u * 0.03, [u * 0.6, -1, 0.4], 0.055, 0.045, -0.2, hc, 0); } for (const s of [-1, 1]) strand(head, s * 0.15, 0.19, 0.02, [s * 0.1, -1, 0], 0.13, 0.04, 0.1, hc); }
    else { const n = style === 'messy' ? 10 : 7; for (let i = 0; i < n; i++) { const a = i / n * TAU; strand(head, Math.sin(a) * 0.1, 0.26, Math.cos(a) * 0.09 - 0.02, [Math.sin(a), style === 'messy' ? 0.5 : 0.1, Math.cos(a) - 0.2], style === 'messy' ? 0.14 : 0.1, 0.05, 0.3, hc, a); }
      for (let i = 0; i < 5; i++) { const u = (i - 2) / 2; strand(head, u * 0.1, 0.292, 0.12, [u * 0.5, -1, 0.45], 0.065, 0.045, -0.25, hc, 0); } }
  }
  // ---- arms ----
  const sx = big ? 0.24 : fem ? 0.165 : 0.19, sleeve = d.cloth === 'armor' ? 0x1c1c22 : d.top;
  for (const s of [1, -1]) { const k = s > 0 ? 'L' : 'R';
    const sh = new THREE.Group(); sh.position.set(s * sx, 0.445, 0); torso.add(sh); J['sh' + k] = sh; const aw = big ? 1.35 : fem ? 0.82 : 1;
    sh.add(at(P(SPH(0.058 * aw, 10, 8), sleeve, O()), 0, 0, 0)); sh.add(at(P(CYL(0.05 * aw, 0.041 * aw, 0.29, 10), sleeve, O()), 0, -0.15, 0));
    const el = new THREE.Group(); el.position.y = -0.3; sh.add(el); J['el' + k] = el; el.add(at(P(SPH(0.042 * aw, 8, 8), sleeve, { ol: 0 }), 0, 0, 0));
    const fore = big ? 0x2a0c10 : d.id === 'ren' && s < 0 ? 0xe8e0d4 : fem ? d.skin : sleeve; el.add(at(P(CYL(0.041 * aw * (big ? 1.25 : 1), 0.031 * aw * (big ? 1.2 : 1), 0.26, 10), fore, O()), 0, -0.135, 0));
    if (d.id === 'ren' && s < 0) for (let i = 0; i < 3; i++) el.add(at(new THREE.Mesh(CYL(0.04 - i * 0.003, 0.039 - i * 0.003, 0.012, 10, true), toon(0xb8ae9e)), 0, -0.07 - i * 0.065, 0));
    if (fem && !d.old) el.add(at(P(CYL(0.037, 0.034, 0.07, 10), d.cloak, { ol: 0 }), 0, -0.23, 0));
    const hand = new THREE.Group(); hand.position.y = -0.3; el.add(hand); J['hand' + k] = hand; const hcol = big ? 0x111114 : d.skin;
    hand.add(at(P(SPH(0.036 * aw, 10, 8), hcol, O()), 0, -0.012, 0, [0.85, 1.25, 0.55])); hand.add(rot(at(P(SPH(0.014 * aw, 6, 6), hcol, { ol: 0 }), -s * 0.0, -0.005, 0.028, [1, 1.8, 1]), 0.6, 0, 0));
    if (d.mark && s < 0) { const m = new THREE.Mesh(CYL(0.046, 0.046, 0.06, 10, true), new THREE.MeshBasicMaterial({ color: 0x3aa0ff, side: THREE.DoubleSide })); at(m, 0, -0.14, 0); el.add(m); }
    if (big) { const pd = new THREE.Group(); pd.position.set(s * 0.03, 0.05, 0); sh.add(pd); pd.add(at(P(SPH(0.115, 12, 8), 0x1c1c22, { ol: 0.013, emis: 0x180000 }), 0, 0, 0, [1.15, 0.7, 1.15])); if (!simple) { pd.add(rot(at(P(CONE(0.035, 0.16, 5), 0x3a0c10, { ol: 0.01 }), s * 0.06, 0.09, 0), 0, 0, -s * 0.5)); pd.add(at(new THREE.Mesh(new THREE.TorusGeometry(0.11, 0.008, 4, 16), basic(0xa0101a)), 0, -0.02, 0)); pd.children[2].rotation.x = Math.PI / 2; } }
  }
  // ---- legs ----
  for (const s of [1, -1]) { const k = s > 0 ? 'L' : 'R'; const lw = big ? 1.3 : fem ? 0.88 : 1;
    const lg = new THREE.Group(); lg.position.set(s * (big ? 0.1 : 0.075), 0, 0); lg.scale.set(1, tall, 1); hip.add(lg); J['leg' + k] = lg;
    lg.add(at(P(CYL(0.072 * lw, 0.052 * lw, 0.43, 10), fem && d.cloth === 'coat' ? d.skin : d.pants, O()), 0, -0.21, 0));
    const kn = new THREE.Group(); kn.position.y = -0.42; lg.add(kn); J['knee' + k] = kn; kn.add(at(P(SPH(0.052 * lw, 8, 8), d.boots, { ol: 0 }), 0, 0, 0));
    kn.add(at(P(CYL(0.052 * lw, 0.04 * lw, 0.38, 10), d.boots, O()), 0, -0.19, 0)); kn.add(at(P(CYL(0.058 * lw, 0.054 * lw, 0.05, 10), C(d.boots).multiplyScalar(1.5).getHex(), { ol: 0 }), 0, -0.04, 0));
    kn.add(at(P(SPH(0.055 * lw, 10, 8), d.boots, O()), 0, -0.4, 0.045, [0.9, 0.62, 1.9]));
    if (big && !simple) kn.add(at(P(BOX(0.09, 0.2, 0.03), 0x2a0c10, { olS: 1.06 }), 0, -0.14, 0.055));
  }
  // ---- costumes ----
  const cloth = d.cloth;
  if (cloth === 'cloak') {
    torso.add(at(P(CYL(0.075, 0.095, 0.1, 12, true), d.cloak, O({ side: THREE.DoubleSide })), 0, 0.53, -0.005));
    const ck = new THREE.Group(); ck.position.set(0, 0.48, -0.02); torso.add(ck); J.cloak = ck;
    ck.add(at(P(capeGeo(0.19, 0.44, 1.02, Math.PI * 0.36, Math.PI * 1.28), d.cloak, O({ side: THREE.DoubleSide })), 0, -0.5, 0));
    ck.add(at(P(capeGeo(0.19, 0.27, 0.2, Math.PI * 0.3, Math.PI * 1.4, 0.03), C(d.cloak).multiplyScalar(1.25).getHex(), O({ side: THREE.DoubleSide })), 0, -0.09, 0.0));
    const scarf = P(new THREE.TorusGeometry(0.085, 0.04, 8, 14), 0x9a1c1e, O()); rot(at(scarf, 0, 0.02, 0.005), Math.PI / 2, 0, 0); ck.add(scarf);
    const tail = new THREE.Group(); tail.position.set(0.06, 0.0, -0.09); ck.add(tail); J.scarf = tail; tail.add(at(P(BOX(0.075, 0.42, 0.018), 0x9a1c1e, { olS: 1.06 }), 0, -0.2, -0.02)); tail.rotation.x = -0.25;
  } else if (cloth === 'coat') {
    const sk = new THREE.Group(); sk.position.y = 0.1; torso.add(sk); J.skirt = sk;
    sk.add(at(P(lathe([[waist * 1.05, 0], [0.19, -0.2], [0.3, -0.5], [0.31, -0.52]], 18), d.top, O({ side: THREE.DoubleSide })), 0, 0, 0, [1, 1, 0.82])); sk.add(at(P(lathe([[0.3, -0.5], [0.325, -0.56]], 18), d.cloak === 0x5a6e9e ? 0xe6ecf8 : d.cloak, { ol: 0, side: THREE.DoubleSide }), 0, 0, 0, [1, 1, 0.82]));
    torso.add(at(new THREE.Mesh(BOX(0.022, 0.3, 0.012), toon(0xe6ecf8)), 0, 0.28, sw * 0.6)); torso.add(at(P(CYL(0.07, 0.09, 0.09, 12, true), 0xe6ecf8, O({ side: THREE.DoubleSide })), 0, 0.525, 0));
    const ck = new THREE.Group(); ck.position.set(0, 0.48, -0.02); torso.add(ck); J.cloak = ck; ck.add(at(P(capeGeo(0.17, 0.33, 0.62, Math.PI * 0.42, Math.PI * 1.16, 0.05), d.cloak, O({ side: THREE.DoubleSide })), 0, -0.3, 0)); ck.add(at(P(capeGeo(0.15, 0.2, 0.1, 0, TAU, 0.015), 0x8fa4d0, O({ side: THREE.DoubleSide })), 0, -0.035, 0.01));
    const gem = new THREE.Mesh(new THREE.TorusGeometry(0.03, 0.01, 6, 12, Math.PI * 1.3), basic(0x8fe8ff)); at(gem, 0, 0.42, sw * 0.66); gem.rotation.z = 0.6; torso.add(gem);
  } else if (cloth === 'robe') {
    const sk = new THREE.Group(); sk.position.y = 0.1; torso.add(sk); J.skirt = sk; sk.add(at(P(lathe([[waist * 1.05, 0], [0.2, -0.3], [0.3, -0.86 * tall], [0.31, -0.9 * tall]], 16), d.cloak, O({ side: THREE.DoubleSide })), 0, 0, 0, [1, 1, 0.85]));
    if (!hood) torso.add(at(P(capeGeo(0.17, 0.27, 0.3, 0, TAU, 0.03), C(d.cloak).multiplyScalar(0.8).getHex(), O({ side: THREE.DoubleSide })), 0, 0.36, 0));
  } else if (cloth === 'armor') {
    torso.add(at(P(lathe([[0.13, 0.16], [0.2, 0.3], [0.215, 0.44], [0.12, 0.5]], 14), 0x1c1c24, O({ emis: 0x100000 })), 0, 0, 0.01, [1, 1, 0.75])); torso.add(at(new THREE.Mesh(BOX(0.03, 0.3, 0.02), basic(0xb0101a)), 0, 0.32, 0.165)); for (const y of [0.18, 0.1]) torso.add(at(P(CYL(0.16, 0.165, 0.06, 12), 0x24242c, { ol: 0 }), 0, y, 0, [1, 1, 0.72]));
    torso.add(at(P(capeGeo(0.17, 0.25, 0.26, 0, TAU, 0.03, 12), 0x1a1a20, O({ side: THREE.DoubleSide })), 0, -0.1, 0, [1, 1, 0.8]));
    if (!simple) { const ck = new THREE.Group(); ck.position.set(0, 0.5, -0.1); torso.add(ck); J.cloak = ck; ck.add(at(P(capeGeo(0.24, 0.5, 1.25, Math.PI * 0.55, Math.PI * 0.9, 0.1), d.cloak, O({ side: THREE.DoubleSide })), 0, -0.6, 0.1)); }
  } else { torso.add(at(P(capeGeo(waist * 1.1, hipw * 1.5, 0.22, 0, TAU, 0.02, 12), d.top, O({ side: THREE.DoubleSide })), 0, 0.02, 0, [1, 1, 0.75])); if (d.mark) torso.add(at(P(lathe([[waist * 1.08, 0.2], [sw * 0.95, 0.36], [sw * 1.04, 0.45]], 12), 0x6a4a30, O()), 0, 0, 0, [1, 1, 0.7])); }
  root.scale.setScalar(d.scale || 1);
  return { g: root, J, d, hipY, props: {} };
}
function hp2(par, m, x, y, z) { m.position.set(x, y, z); par.add(m); return m; }
// give the cast their ids (used for costume details) and nicer iris colours
for (const k in CASTDEF) CASTDEF[k].id = k;
Object.assign(CASTDEF.sera, { iris: 0x8a6a4a }); Object.assign(CASTDEF.kid, { iris: 0x7a5a2a }); Object.assign(CASTDEF.man, { iris: 0x6a5038 });
