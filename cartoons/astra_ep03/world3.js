// Episode 3 world: extra cast and props, additions to Valen (dark edge street, roof terrace, herald stage, the old sun), the pale-children ward.
'use strict';
Object.assign(CASTDEF, {
  sol: { name: 'โซเลน', skin: 0xfff2d8, hair: 0xffe9a8, hs: 'long', top: 0xfff4d0, pants: 0xf0e0b0, boots: 0xe8d8a0, cloth: 'robe', cloak: 0xffeec0, eye: 0xffc040, iris: 0xffe080, female: 1, scale: 1.12 },
  marta: { name: 'ป้ามาร์ธา', skin: 0xe2bfa2, hair: 0xb9b5ba, hs: 'bun', top: 0x5f7284, pants: 0x464c58, boots: 0x3a2a1e, cloth: 'robe', cloak: 0xd9d5cc, eye: 0x2b1d14, iris: 0x6a5a4a, female: 1, scale: 0.98 },
  pip: { name: 'พิป', skin: 0xeae6ee, hair: 0x9c98a6, hs: 'messy', top: 0xcfd3dc, pants: 0x8a8e9a, boots: 0x2a2a30, eye: 0x3a3a4a, iris: 0x7a86a8, scale: 0.6 },
  pk2: { name: 'เด็กซีด', skin: 0xe8e4ec, hair: 0x8e8a96, hs: 'short', top: 0xc4c8d2, pants: 0x7e828e, boots: 0x2a2a30, eye: 0x3a3a4a, scale: 0.58 },
  her: { name: 'ผู้ประกาศ', skin: 0x16121a, hair: 0x0a080c, hs: 'hood', top: 0x2a0a10, pants: 0x14080c, boots: 0x0a0608, cloth: 'robe', cloak: 0x6a0a0e, eye: 0xff3030, scale: 1.14 },
  col: { name: 'คนเก็บหนี้', skin: 0xecd0b0, hair: 0xd8c890, hs: 'short', top: 0xe8dcae, pants: 0x8a7a50, boots: 0x5a4a30, cloth: 'coat', cloak: 0xfff0c0, eye: 0x6a4a10, iris: 0xd8a030, scale: 1.06 },
  gran: { name: 'หญิงชรา', skin: 0xd8b498, hair: 0xa8a4a8, hs: 'bun', top: 0x5a4a56, pants: 0x3a3440, boots: 0x2a201a, cloth: 'robe', cloak: 0x4a4250, eye: 0x2b1d14, female: 1, scale: 0.84 },
  lw0: { name: 'คนจุดตะเกียง', skin: 0xd0a080, hair: 0x4a3a2a, hs: 'short', top: 0x54483a, pants: 0x2e2a2a, boots: 0x2a201a, cloth: 'coat', cloak: 0x4e4234, eye: 0x2b1d14, scale: 1.02, simple: 1 },
  lw1: { name: 'คนจุดตะเกียง', skin: 0xe0b898, hair: 0x7a5a3a, hs: 'bun', top: 0x4a4440, pants: 0x2e2a2a, boots: 0x2a201a, cloth: 'coat', cloak: 0x5a4e40, eye: 0x2b1d14, scale: 0.95, simple: 1, female: 1 },
});
Object.assign(SPK, { marta: ['ป้ามาร์ธา', '#bcd0e0'], pip: ['พิป', '#dfe6ff'], her: ['ผู้ประกาศ', '#ff6a6a'], col: ['คนเก็บหนี้', '#ffe9a0'], gran: ['หญิงชรา', '#c8c0d0'], sol: ['โซเลน', '#ffe9a8'] });

const makeProp2 = makeProp;
makeProp = function (name) {
  const g = new THREE.Group();
  switch (name) {
    case 'needle': g.add(rot(at(P(CYL(0.006, 0.002, 0.26, 6), 0xd8dce8, { ol: 0.003 }), 0, -0.03, 0.14), 1.57, 0, 0)); g.add(at(new THREE.Mesh(SPH(0.016, 6, 5), basic(0xffd070)), 0, -0.03, 0.27)); g.add(at(glowSprite(0xffc050, 0.3, 0.7), 0, -0.03, 0.27)); return g;
    case 'bread': g.add(at(P(SPH(0.07, 8, 6), 0xc89a5a, { ol: 0.006 }), 0, -0.03, 0.09)); g.children[0].scale.set(1.3, 0.75, 0.9); return g;
    case 'bowl': g.add(at(P(CYL(0.08, 0.05, 0.06, 10), 0x7a6a5a, { ol: 0.006 }), 0, -0.03, 0.1)); return g;
    case 'notice': g.add(rot(at(P(BOX(0.34, 0.46, 0.012), 0xd8c8a0, { olS: 1.04 }), 0, 0.05, 0.14), -0.3, 0, 0)); return g;
    case 'purse': g.add(at(P(SPH(0.06, 8, 6), 0x6a4a2a, { ol: 0.006 }), 0, -0.06, 0.08)); return g;
    case 'jardim': g.add(at(new THREE.Mesh(CYL(0.045, 0.05, 0.14, 10), basic(0x6a6050)), 0, -0.04, 0.08)); g.add(at(P(CYL(0.025, 0.025, 0.04, 8), 0x5a4030, { ol: 0.004 }), 0, 0.05, 0.08)); return g;
  }
  return makeProp2(name);
};

Object.assign(LIGHTS, {
  oldday: { sky: [0x5a90d8, 0xb8d4f0, 0xffe4b8], fog: [0xe0cdb0, 80, 520], hemi: [0xfff4e0, 0x8a7a60, 1.0], dir: [0xfff0d0, 0.9, [10, 14, -4]], grade: [0x201000, 0.04] },
  ward: { sky: [0, 0, 0], fog: [0x0b0d14, 7, 36], hemi: [0xbdd0ea, 0x1a181e, 0.62], dir: [0xd6e0ff, 0.42, [-2, 5, 4]], grade: [0x000a1c, 0.1] },
  roofn: { sky: [0x030309, 0x15122c, 0x4a3850], fog: [0x0a0a16, 14, 190], hemi: [0xa4a4ee, 0x221c2c, 1.05], dir: [0xffc890, 0.36, [-4, 7, 5]], grade: [0x03011a, 0.12], rim: 0.6 },
});

const RX0 = 15.5, RX1 = 27.5, RZ0 = 34, RZ1 = 40, RY = 9;   // roof terrace behind the alley's dead end
const valen2 = BUILD.valen;
BUILD.valen = function () {
  const S = valen2(); const sc = S.scene;
  // --- the dark edge: the street runs on past the last lit lamps ---
  const ext = new THREE.Mesh(new THREE.PlaneGeometry(30, 6.4), flat(0x24222c)); ext.rotation.x = -Math.PI / 2; at(ext, 91, 0.02, 0); sc.add(ext);
  let hi = 90; for (let x = 78.5; x <= 104; x += 4.3) { for (const sg of [-1, 1]) { const h = tallHouse(sc, x, sg * (6.3 + hash(hi) * 0.6), sg < 0 ? 0 : Math.PI, 1.25 + hash(hi + 1) * 0.2, 1.3 + hash(hi + 2) * 0.5, hi); h.userData.win.color.set(x < 82 && sg > 0 ? 0x4a3420 : 0x100e16); hi += 3; } }
  const line = new THREE.Mesh(new THREE.PlaneGeometry(0.22, 6.4), basic(0xc8b890)); line.rotation.x = -Math.PI / 2; at(line, 84.5, 0.035, 0); sc.add(line);
  S.elamps = []; const mk = (x, z) => { sc.add(at(P(CYL(0.05, 0.08, 3.0, 6), 0x1a181e, { ol: 0.012 }), x, 1.5, z)); sc.add(at(P(BOX(0.5, 0.05, 0.05), 0x1a181e, { olS: 1.0 }), x, 2.95, z)); const mat = new THREE.MeshBasicMaterial({ color: 0x1a1a22, fog: false }); sc.add(at(new THREE.Mesh(BOX(0.26, 0.34, 0.26), mat), x, 2.72, z));
    const spr = glowSprite(0xffc060, 3.4, 0); at(spr, x, 2.72, z); sc.add(spr); const pool = new THREE.Mesh(new THREE.CircleGeometry(3.2, 24), new THREE.MeshBasicMaterial({ map: GLOWTEX, color: 0xffb050, transparent: true, opacity: 0, blending: THREE.AdditiveBlending, depthWrite: false })); pool.rotation.x = -Math.PI / 2; at(pool, x, 0.05, z); sc.add(pool); S.elamps.push({ mat, spr, pool }); };
  mk(74.5, 3.5); mk(81, -3.5); mk(87.5, 3.5);
  sc.add(at(P(BOX(0.9, 1.9, 0.12), 0x33241a, { olS: 1.03 }), 76.2, 0.95, 4.35)); // granny's door
  // --- roof terrace ---
  sc.add(at(P(BOX(RX1 - RX0, RY, RZ1 - RZ0), 0x2a2832, { olS: 1.004 }), (RX0 + RX1) / 2, RY / 2 - 0.01, (RZ0 + RZ1) / 2));
  const deck = new THREE.Mesh(new THREE.PlaneGeometry(RX1 - RX0, RZ1 - RZ0), flat(0x3a3640)); deck.rotation.x = -Math.PI / 2; at(deck, (RX0 + RX1) / 2, RY + 0.01, (RZ0 + RZ1) / 2); sc.add(deck);
  for (const [x, z, w, d] of [[(RX0 + RX1) / 2, RZ0 + 0.12, RX1 - RX0, 0.24], [(RX0 + RX1) / 2, RZ1 - 0.12, RX1 - RX0, 0.24], [RX0 + 0.12, (RZ0 + RZ1) / 2, 0.24, RZ1 - RZ0], [RX1 - 0.12, (RZ0 + RZ1) / 2, 0.24, RZ1 - RZ0]]) sc.add(at(P(BOX(w, 0.45, d), 0x34313c, { olS: 1.01 }), x, RY + 0.22, z));
  for (const [x, z] of [[19.2, 38.6], [20.1, 38.8], [24.6, 35.2]]) sc.add(at(P(BOX(0.7, 0.5, 0.7), 0x5a4632, { olS: 1.03 }), x, RY + 0.25, z));
  sc.add(at(P(BOX(1.1, 0.9, 1.1), 0x3a3038, { olS: 1.02 }), 26.3, RY + 0.45, 39)); sc.add(at(P(CYL(0.25, 0.3, 1.6, 8), 0x2a2630, { ol: 0.02 }), 16.6, RY + 0.8, 39));
  S.roofLamp = new THREE.Group(); S.roofLamp.add(lanternMesh(true)); at(S.roofLamp, 21.6, RY + 0.24, 37.0, 1.6); sc.add(S.roofLamp); S.roofGlow = glowSprite(0xffc878, 4.2, 0.35); at(S.roofGlow, 21.6, RY + 0.5, 37.0); sc.add(S.roofGlow);
  const g0 = S.groundY; S.groundY = (x, z) => (x > RX0 && x < RX1 && z > RZ0 && z < RZ1 ? RY : g0(x, z));
  // --- herald's stage in the plaza ---
  const stg = new THREE.Group(); stg.add(at(P(BOX(3.4, 1.0, 1.8), 0x241c22, { olS: 1.02 }), 0, 0.5, 0)); stg.add(at(P(BOX(1.2, 0.5, 0.5), 0x241c22, { olS: 1.02 }), 0, 0.25, -1.1));
  for (const sx of [-1.9, 1.9]) { stg.add(at(P(CYL(0.05, 0.05, 5.2, 6), 0x15131a, { ol: 0.01 }), sx, 2.6, 0.7)); const b = new THREE.Mesh(new THREE.PlaneGeometry(0.9, 3.0), new THREE.MeshBasicMaterial({ color: 0x7a0c12, side: THREE.DoubleSide })); at(b, sx, 3.5, 0.66); stg.add(b); const cr = new THREE.Mesh(new THREE.RingGeometry(0.16, 0.26, 7), new THREE.MeshBasicMaterial({ color: 0x120608, side: THREE.DoubleSide })); at(cr, sx, 4.1, 0.6); stg.add(cr); }
  at(stg, 0, 0, 4.4); sc.add(stg); S.stage = stg;
  // --- the sun that used to burn on the tower ---
  S.oldSun = glowSprite(0xfff0c0, 150, 0); at(S.oldSun, 150, 89, -40); sc.add(S.oldSun); S.oldSun2 = glowSprite(0xffffff, 46, 0); at(S.oldSun2, 150, 89, -40); sc.add(S.oldSun2);
  // outline for the dead tower so it reads against the night sky
  { const om = new THREE.MeshBasicMaterial({ color: 0x3a2e52, fog: false, side: THREE.BackSide }); const o = new THREE.Group(); o.add(at(new THREE.Mesh(CYL(4.9, 8.1, 81, 10), om), 0, 40, 0)); o.add(at(new THREE.Mesh(CYL(10, 5.9, 4, 10), om), 0, 80, 0)); o.add(at(new THREE.Mesh(SPH(5.3, 14, 10), om), 0, 87, 0)); at(o, 150, 0, -40); sc.add(o); }
  const u0 = S.update;
  S.update = (sh, t, lt) => { u0(sh, t, lt); const st = sh.st || {};
    S.elamps.forEach((l, i) => { const on = (st['e' + i] || 0) * (0.92 + 0.08 * Math.sin(t * 7 + i)); l.mat.color.setRGB(0.1 + on * 0.9, 0.1 + on * 0.84, 0.13 + on * 0.62); l.spr.material.opacity = 0.6 * on; l.pool.material.opacity = 0.3 * on; });
    S.stage.visible = !!st.stage; const k = st.sun || 0; S.oldSun.material.opacity = 0.75 * k; S.oldSun2.material.opacity = k; S.disc.visible = !st.noDisc;
    const rl = st.roofLamp == null ? 1 : st.roofLamp; S.roofLamp.visible = rl > 0; S.roofGlow.material.opacity = 0.35 * rl * (0.9 + 0.1 * Math.sin(t * 6)); };
  return S;
};

// ---------- the ward where the pale children sleep ----------
BUILD.ward = function () {
  const S = baseSet(); const sc = S.scene;
  const fl = new THREE.Mesh(new THREE.PlaneGeometry(15, 9.4), flat(0x2c2e36)); fl.rotation.x = -Math.PI / 2; sc.add(fl);
  sc.add(at(P(BOX(15, 4, 0.3), 0x3c4250, { olS: 1.0 }), 0, 2, -4.7)); sc.add(at(P(BOX(0.3, 4, 9.4), 0x363c48, { olS: 1.0 }), -7.5, 2, 0)); sc.add(at(P(BOX(0.3, 4, 9.4), 0x363c48, { olS: 1.0 }), 7.5, 2, 0)); sc.add(at(P(BOX(15, 4, 0.3), 0x30343e, { olS: 1.0 }), 0, 2, 4.7)); sc.add(at(P(BOX(15, 0.2, 9.4), 0x22242c, { olS: 1.0 }), 0, 4.1, 0));
  sc.add(at(P(BOX(0.12, 2.1, 1.0), 0x2a2018, { olS: 1.03 }), 7.36, 1.05, 2.6)); // door
  for (const x of [-4.5, 0, 4.5]) { sc.add(at(new THREE.Mesh(BOX(1.0, 1.3, 0.05), basic(0x05060a)), x, 2.5, -4.53)); sc.add(at(P(BOX(1.16, 0.08, 0.1), 0x24262e, { olS: 1.0 }), x, 1.82, -4.5)); }
  S.beds = []; S.jars = [];
  const bed = (x, z, ry, child) => { const g = new THREE.Group(); g.add(at(P(BOX(0.95, 0.3, 1.9), 0x3a3028, { olS: 1.02 }), 0, 0.2, 0)); g.add(at(P(BOX(0.88, 0.12, 1.82), 0xb8bcc8, { olS: 1.0 }), 0, 0.41, 0)); g.add(at(P(BOX(0.6, 0.1, 0.34), 0xdfe2ea, { olS: 1.02 }), 0, 0.5, -0.7)); g.add(at(P(BOX(0.98, 0.7, 0.08), 0x3a3028, { olS: 1.02 }), 0, 0.45, -0.95));
    if (child) { g.add(at(P(BOX(0.72, 0.16, 1.15), 0x8e96aa, { olS: 1.02 }), 0, 0.53, 0.18)); g.add(at(P(SPH(0.13, 10, 8), 0xe8e4ec, { ol: 0.008 }), 0, 0.6, -0.62)); const hr = P(SPH(0.14, 10, 8), [0x8e8a96, 0x9c98a6, 0x7c7884][child % 3], { ol: 0.008 }); hr.scale.set(1, 0.8, 1); g.add(at(hr, 0, 0.66, -0.68)); }
    g.add(at(P(BOX(0.3, 0.5, 0.3), 0x34302c, { olS: 1.03 }), 0.72, 0.25, -0.7)); const j = new THREE.Mesh(CYL(0.05, 0.055, 0.15, 10), new THREE.MeshBasicMaterial({ color: 0x5a5448 })); at(j, 0.72, 0.58, -0.7); g.add(j); const gl = glowSprite(0xffd870, 1.6, 0); at(gl, 0.72, 0.6, -0.7); g.add(gl); S.jars.push({ j, gl });
    at(g, x, 0, z); g.rotation.y = ry; sc.add(g); S.beds.push(g); };
  [-5.6, -3.4, -1.2, 1.0, 3.2, 5.4].forEach((x, i) => bed(x, -3.5, 0, i === 3 ? 0 : i + 1));   // bed 3 (x=1.0) is Pip's: the actor sits there
  bed(-6.3, 1.2, Math.PI / 2, 7); bed(-6.3, 3.3, Math.PI / 2, 8);
  sc.add(at(P(BOX(1.6, 0.9, 0.7), 0x40362c, { olS: 1.02 }), 5.6, 0.45, 3.9)); for (let i = 0; i < 5; i++) sc.add(at(new THREE.Mesh(CYL(0.06, 0.07, 0.2, 10), basic(i < 1 ? 0xffe89a : 0x5a5448)), 5.0 + i * 0.3, 1.0, 3.9));
  sc.add(at(P(CYL(0.01, 0.01, 1.2, 4), 0x14141a, {}), 0, 3.5, 0)); sc.add(at(lanternMesh(true), 0, 2.8, 0, 1.6)); S.hang = glowSprite(0xcfe0ff, 5.0, 0.3); at(S.hang, 0, 2.8, 0); sc.add(S.hang);
  ambient(S, 'dust', 90, { r: 6, h: 3.6, sp: 0.05, col: 0xcfd8ff });
  S.update = (sh, t) => { const st = sh.st || {}; S.hang.material.opacity = 0.3 * (0.9 + 0.1 * Math.sin(t * 5.1)); S.jars.forEach((o, i) => { const k = st['j' + i] || 0; o.j.material.color.setRGB(0.35 + 0.65 * k, 0.33 + 0.58 * k, 0.28 + 0.32 * k); o.gl.material.opacity = 0.75 * k * (0.9 + 0.1 * Math.sin(t * 4 + i)); }); updAmbient(S, 'dust', t, 0, 0, true); };
  return S;
};

// small helpers for the story files
FX.mark = function (F, id, k, lt, col = 0xffb040) { const p = F.joint(id, 'handR'); FX.glow(F, 'mkA', p, 0.42 * k, col, 0.7 * k); FX.glow(F, 'mkB', p, 0.13 * k, 0xfff0c8, k); F.light(1, col, 1.4 * k, p.x, p.y, p.z, 3.5); };
FX.beam = function (F, key, a, b, k, col = 0xffe0a0, n = 9) { for (let i = 0; i < n; i++) { const u = (i + 0.5) / n; FX.glow(F, key + i, V3(lerp(a.x, b.x, u), lerp(a.y, b.y, u), lerp(a.z, b.z, u)), (1.5 - u * 0.7) * k, col, 0.16 * k); } };
