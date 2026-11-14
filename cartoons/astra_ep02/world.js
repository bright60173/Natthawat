// Episode 2 world: new cast, props, the city of Valen (no sun for 17 years), the lamp house, light-eater beasts.
'use strict';
Object.assign(CASTDEF, {
  jax: { name: 'แจ็กซ์', skin: 0xe9b890, hair: 0xd0642a, hs: 'messy', top: 0x2f6a6a, pants: 0x2a2a34, boots: 0x3a2a1e, cloth: 'coat', cloak: 0x3d4a52, eye: 0x1d3a2b, iris: 0x3aa06a, scale: 0.84 },
  el: { name: 'เอล', skin: 0xf3d2bd, hair: 0x15101a, hs: 'longdark', top: 0xe8ecf5, pants: 0xe8ecf5, boots: 0xd0d4dd, cloth: 'robe', cloak: 0xc7cfe0, eye: 0x6a1a10, iris: 0xb8503a, female: 1, scale: 0.6 },
  theo: { name: 'ธีโอ', skin: 0xd9a988, hair: 0x2a2226, hs: 'short', top: 0x4a3a2c, pants: 0x2e2a2a, boots: 0x2a201a, cloth: 'coat', cloak: 0x5a4632, eye: 0x3a1410, iris: 0xc8542a, scale: 1.1 },
  pk0: { name: 'เด็กซีด', skin: 0xe6e2ea, hair: 0x8a8690, hs: 'messy', top: 0x5a5a6a, pants: 0x3a3a46, boots: 0x2a2a30, eye: 0x3a3a4a, scale: 0.62 },
  pk1: { name: 'เด็กซีด', skin: 0xe9e4ee, hair: 0x9a94a0, hs: 'long', top: 0x6a5a6e, pants: 0x3e3a48, boots: 0x2a2a30, eye: 0x3a3a4a, female: 1, scale: 0.56 },
});
Object.assign(SPK, { jax: ['แจ็กซ์', '#ffb04a'], theo: ['ธีโอ', '#e6c88a'], el: ['เอล', '#e8d8ff'], s0: ['ทหาร', '#ff7a7a'], v3: ['พ่อค้า', '#c8c8d8'] });

// ---------- props ----------
const GLOWTEX = (() => { const c = document.createElement('canvas'); c.width = c.height = 128; const x = c.getContext('2d'); const g = x.createRadialGradient(64, 64, 0, 64, 64, 64); g.addColorStop(0, 'rgba(255,255,255,1)'); g.addColorStop(0.25, 'rgba(255,255,255,0.55)'); g.addColorStop(0.6, 'rgba(255,255,255,0.12)'); g.addColorStop(1, 'rgba(255,255,255,0)'); x.fillStyle = g; x.fillRect(0, 0, 128, 128); return new THREE.CanvasTexture(c); })();
function glowSprite(col, size, op = 0.6) { const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: GLOWTEX, color: col, transparent: true, opacity: op, blending: THREE.AdditiveBlending, depthWrite: false, fog: false })); s.scale.setScalar(size); return s; }
function lanternMesh(lit) { const g = new THREE.Group(); g.add(at(P(BOX(0.13, 0.02, 0.13), 0x2a2420, { olS: 1.1 }), 0, 0.1, 0)); g.add(at(P(BOX(0.13, 0.02, 0.13), 0x2a2420, { olS: 1.1 }), 0, -0.1, 0)); g.add(at(new THREE.Mesh(BOX(0.1, 0.18, 0.1), new THREE.MeshBasicMaterial({ color: lit ? 0xfff0c0 : 0x1a1a22 })), 0, 0, 0));
  for (const [x, z] of [[-1, -1], [1, -1], [-1, 1], [1, 1]]) g.add(at(new THREE.Mesh(BOX(0.014, 0.2, 0.014), toon(0x2a2420)), x * 0.058, 0, z * 0.058)); const r = new THREE.Mesh(new THREE.TorusGeometry(0.04, 0.008, 5, 10), toon(0x2a2420)); at(r, 0, 0.15, 0); g.add(r); if (lit) g.add(glowSprite(0xffe9b0, 1.3, 0.75)); return g; }
const makeProp0 = makeProp;
makeProp = function (name) {
  const g = new THREE.Group();
  switch (name) {
    case 'lantern': g.add(at(lanternMesh(false), 0, -0.12, 0.1)); return g;
    case 'lanternlit': g.add(at(lanternMesh(true), 0, -0.12, 0.1)); return g;
    case 'pole': g.add(at(P(CYL(0.016, 0.016, 2.1, 6), 0x3a2a20, { ol: 0.006 }), 0, 0.55, 0.03)); g.add(at(new THREE.Mesh(SPH(0.035, 8, 6), basic(0xffd080)), 0, 1.62, 0.03)); g.add(at(glowSprite(0xffc060, 0.7, 0.7), 0, 1.62, 0.03)); return g;
    case 'sunjar': g.add(at(new THREE.Mesh(CYL(0.045, 0.05, 0.14, 10), basic(0xffe89a)), 0, -0.04, 0.08)); g.add(at(P(CYL(0.025, 0.025, 0.04, 8), 0x5a4030, { ol: 0.004 }), 0, 0.05, 0.08)); g.add(at(glowSprite(0xffd870, 0.9, 0.7), 0, -0.04, 0.08)); return g;
    case 'scanner': g.add(rot(at(P(CYL(0.02, 0.02, 0.3, 6), 0x2a2a34, { ol: 0.005 }), 0, -0.03, 0.12), 1.57, 0, 0)); g.add(at(new THREE.Mesh(SPH(0.035, 8, 6), basic(0x9fe0ff)), 0, -0.03, 0.29)); g.add(at(glowSprite(0x7fd0ff, 0.6, 0.7), 0, -0.03, 0.29)); return g;
    case 'spear': g.add(at(P(CYL(0.016, 0.016, 2.2, 6), 0x2a2a30, { ol: 0.006 }), 0, 0.5, 0.03)); g.add(at(P(CONE(0.045, 0.25, 6), 0x8a8a96, { ol: 0.006 }), 0, 1.72, 0.03)); return g;
  }
  return makeProp0(name);
};

// ---------- lights ----------
Object.assign(LIGHTS, {
  rim: { sky: [0x06060e, 0x2a2440, 0xd8b48a], fog: [0x4a4258, 60, 420], hemi: [0xffe8d0, 0x3a3040, 0.7], dir: [0xffe0b0, 0.75, [-20, 14, 10]], grade: [0x000010, 0.04] },
  valen: { sky: [0x030308, 0x14122a, 0x4a3c50], fog: [0x0c0b18, 14, 150], hemi: [0x9a9ad8, 0x16121c, 0.6], dir: [0xffc890, 0.42, [4, 8, 6]], grade: [0x04021a, 0.1] },
  alley: { sky: [0x020206, 0x0c0b1c, 0x2a2238], fog: [0x05050c, 6, 60], hemi: [0x7474c8, 0x0a0912, 0.52], dir: [0x8a80e0, 0.3, [-3, 9, -4]], grade: [0x02011a, 0.16], rim: 0.75 },
  lampin: { sky: [0, 0, 0], fog: [0x120c08, 8, 40], hemi: [0xffd8a8, 0x2a1c14, 0.7], dir: [0xffcf90, 0.6, [2, 5, 4]], grade: [0x1a0c00, 0.05] },
});

// ---------- the city ----------
const ALLEY_X = 21.5;
function tallHouse(sc, x, z, face, s, hy, i) { const h = house(sc, x, z, face, s, { wall: [0x3d3a4a, 0x443e48, 0x38364a, 0x4a4250][i % 4], roof: [0x1e1a26, 0x241c28, 0x1a1a24][i % 3] }); h.scale.y *= hy; return h; }
BUILD.valen = function () {
  const S = baseSet(); const sc = S.scene;
  const ground = new THREE.Mesh(new THREE.CircleGeometry(260, 48), flat(0x1c1b24)); ground.rotation.x = -Math.PI / 2; sc.add(ground);
  const street = new THREE.Mesh(new THREE.PlaneGeometry(130, 6.4), flat(0x302e3a)); street.rotation.x = -Math.PI / 2; at(street, 12, 0.02, 0); sc.add(street);
  const lane = new THREE.Mesh(new THREE.PlaneGeometry(3.6, 30), flat(0x24222c)); lane.rotation.x = -Math.PI / 2; at(lane, ALLEY_X, 0.02, 18); sc.add(lane);
  // cobbles: darker joints across the street
  { const im = new THREE.InstancedMesh(new THREE.PlaneGeometry(0.06, 6.4), basic(0x1a1922), 110); const d = new THREE.Object3D(); for (let i = 0; i < 110; i++) { d.position.set(-52 + i * 1.18, 0.03, 0); d.rotation.set(-Math.PI / 2, 0, 0); d.updateMatrix(); im.setMatrixAt(i, d.matrix); } sc.add(im); }
  S.houses = []; let hi = 0;
  for (let x = -30; x <= 74; x += 4.3) { const j = hash(hi + 3);
    S.houses.push(tallHouse(sc, x, -6.3 - j * 0.6, 0, 1.25 + hash(hi) * 0.25, 1.35 + hash(hi + 1) * 0.6, hi)); hi++;
    if (Math.abs(x - ALLEY_X) > 3.4) S.houses.push(tallHouse(sc, x, 6.3 + j * 0.6, Math.PI, 1.25 + hash(hi) * 0.25, 1.35 + hash(hi + 1) * 0.6, hi)); hi++; }
  // alley walls: backs of houses along the lane, dead end
  for (let z = 9; z <= 31; z += 4.2) { S.houses.push(tallHouse(sc, ALLEY_X - 4.0, z, Math.PI / 2, 1.2, 1.7 + hash(z) * 0.4, hi++)); S.houses.push(tallHouse(sc, ALLEY_X + 4.0, z, -Math.PI / 2, 1.2, 1.7 + hash(z + 1) * 0.4, hi++)); }
  sc.add(at(P(BOX(9, 7, 0.8), 0x2a2832, { olS: 1.01 }), ALLEY_X, 3.5, 33));
  for (let i = 0; i < 9; i++) sc.add(at(P(BOX(0.6, 0.5, 0.6), 0x3a3238, { olS: 1.04 }), ALLEY_X + (hash(i) < 0.5 ? -1.2 : 1.2) + (hash(i + 2) - 0.5) * 0.4, 0.25 + (i % 3 === 2 ? 0.5 : 0), 10 + hash(i + 5) * 21));
  S.theoDoor = at(P(BOX(0.9, 1.9, 0.12), 0x3a2416, { olS: 1.03 }), ALLEY_X - 1.75, 0.95, 26); S.theoDoor.rotation.y = Math.PI / 2; sc.add(S.theoDoor);
  // far blocks with lit windows
  { const n = 150; const im = new THREE.InstancedMesh(BOX(1, 1, 1), flat(0x1a1822), n); const wm = new THREE.InstancedMesh(new THREE.PlaneGeometry(0.5, 0.7), new THREE.MeshBasicMaterial({ color: 0xffc070, fog: false, side: THREE.DoubleSide }), n * 3); const d = new THREE.Object3D(); let w = 0;
    for (let i = 0; i < n; i++) { const a = hash(i * 1.3) * TAU, r = 22 + hash(i + 7) * 95; let x = 14 + Math.cos(a) * r * 1.25, z = Math.sin(a) * r; if (Math.abs(z) < 13) z = (z < 0 ? -1 : 1) * (13 + hash(i + 2) * 12); if (Math.abs(x - ALLEY_X) < 8 && z > 0 && z < 40) x += 14; const hh = 5 + hash(i + 4) * 13, ww = 3 + hash(i + 5) * 4;
      d.position.set(x, hh / 2, z); d.rotation.set(0, hash(i + 6) * 0.6, 0); d.scale.set(ww, hh, ww); d.updateMatrix(); im.setMatrixAt(i, d.matrix);
      for (let k = 0; k < 3; k++) { if (hash(i * 3 + k) < 0.45) continue; const sgn = z > 0 ? -1 : 1; d.position.set(x + (hash(i + k * 9) - 0.5) * ww * 0.6, 1.5 + hash(i + k * 5) * (hh - 2.5), z + sgn * (ww / 2 + 0.03)); d.rotation.set(0, 0, 0); d.scale.set(1, 1, 1); d.updateMatrix(); wm.setMatrixAt(w++, d.matrix); } }
    wm.count = w; sc.add(im); sc.add(wm); S.farWin = wm.material; }
  // city wall and gate (west end)
  for (const zz of [-34, 34]) sc.add(at(P(BOX(3.2, 10, 60), 0x25232e, { olS: 1.004 }), -40, 5, zz));
  sc.add(at(P(BOX(3.6, 3.2, 8.6), 0x2a2832, { olS: 1.01 }), -40, 8.4, 0)); for (const zz of [-4.4, 4.4]) sc.add(at(P(BOX(4.2, 11.5, 1.6), 0x302e3a, { olS: 1.01 }), -40, 5.75, zz));
  for (let i = -3; i <= 3; i++) sc.add(at(P(BOX(0.12, 1.6, 0.12), 0x15141a, { olS: 1.0 }), -40, 6.2, i * 0.95));
  sc.add(at(P(BOX(1.3, 0.9, 0.7), 0x3a3038, { olS: 1.03 }), -36.2, 0.45, 2.3)); // guard desk
  // plaza + dry fountain
  const plaza = new THREE.Mesh(CYL(7.5, 7.5, 0.05, 36), flat(0x35333f)); at(plaza, 0, 0.03, 0); sc.add(plaza);
  sc.add(at(P(CYL(1.6, 1.8, 0.5, 18), 0x4a4854, { ol: 0.03 }), 0, 0.25, -1.2)); sc.add(at(P(CYL(0.25, 0.35, 1.5, 10), 0x4a4854, { ol: 0.02 }), 0, 1.0, -1.2)); sc.add(at(P(CYL(0.7, 0.3, 0.2, 14), 0x4a4854, { ol: 0.02 }), 0, 1.8, -1.2));
  // vendor stall
  const stall = new THREE.Group(); stall.add(at(P(BOX(2.2, 0.9, 0.9), 0x4a3626, { olS: 1.03 }), 0, 0.45, 0)); for (const sx of [-1.05, 1.05]) stall.add(at(P(CYL(0.04, 0.04, 2.4, 6), 0x2e2218, { ol: 0.01 }), sx, 1.2, -0.4)); stall.add(rot(at(P(BOX(2.5, 0.05, 1.4), 0x6a2a34, { olS: 1.02 }), 0, 2.35, 0.1), 0.25, 0, 0));
  S.jars = []; for (let i = 0; i < 7; i++) { const m = new THREE.Mesh(CYL(0.06, 0.07, 0.2, 10), basic(0xffe89a)); at(m, -0.85 + i * 0.28, 1.0, 0.1); stall.add(m); const gl = glowSprite(0xffd870, 0.9, 0.5); at(gl, -0.85 + i * 0.28, 1.0, 0.1); stall.add(gl); S.jars.push(gl); }
  at(stall, 7.5, 0, -3.9); sc.add(stall);
  // street lamps
  S.lamps = []; const mkLamp = (x, z, zone) => { sc.add(at(P(CYL(0.05, 0.08, 3.0, 6), 0x1a181e, { ol: 0.012 }), x, 1.5, z)); sc.add(at(P(BOX(0.5, 0.05, 0.05), 0x1a181e, { olS: 1.0 }), x, 2.95, z)); const mat = new THREE.MeshBasicMaterial({ color: 0xfff0c0, fog: false }); sc.add(at(new THREE.Mesh(BOX(0.26, 0.34, 0.26), mat), x, 2.72, z));
    const spr = glowSprite(0xffc060, 3.4, 0.6); at(spr, x, 2.72, z); sc.add(spr); const pool = new THREE.Mesh(new THREE.CircleGeometry(3.2, 24), new THREE.MeshBasicMaterial({ map: GLOWTEX, color: 0xffb050, transparent: true, opacity: 0.3, blending: THREE.AdditiveBlending, depthWrite: false })); pool.rotation.x = -Math.PI / 2; at(pool, x, 0.05, z); sc.add(pool); S.lamps.push({ x, z, mat, spr, pool, zone }); };
  for (let x = -36, i = 0; x <= 72; x += 6.5, i++) { const z = i % 2 ? 3.5 : -3.5; if (Math.abs(x - ALLEY_X) < 2.5 && z > 0) continue; mkLamp(x, z, 'street'); }
  for (const z of [10, 18, 26]) mkLamp(ALLEY_X + (z === 18 ? -1.5 : 1.5), z, 'alley');
  // the dead sun tower, far east
  const tw = new THREE.Group(); const tm = new THREE.MeshBasicMaterial({ color: 0x0b0a12, fog: false }); tw.add(at(new THREE.Mesh(CYL(4, 7, 80, 10), tm), 0, 40, 0)); tw.add(at(new THREE.Mesh(CYL(9, 5, 3, 10), tm), 0, 80, 0)); for (let i = 0; i < 6; i++) { const a = i / 6 * TAU; tw.add(at(new THREE.Mesh(BOX(0.9, 9, 0.9), tm), Math.cos(a) * 7.5, 86, Math.sin(a) * 7.5)); } tw.add(at(new THREE.Mesh(SPH(4.5, 14, 10), new THREE.MeshBasicMaterial({ color: 0x050408, fog: false })), 0, 87, 0)); at(tw, 150, 0, -40); sc.add(tw);
  // the black disc where the sun used to be
  const disc = new THREE.Group(); disc.add(new THREE.Mesh(new THREE.CircleGeometry(46, 64), new THREE.MeshBasicMaterial({ color: 0x000000, fog: false, side: THREE.DoubleSide })));
  const cor = new THREE.Mesh(new THREE.RingGeometry(46, 52, 64), new THREE.MeshBasicMaterial({ color: 0x7a3048, transparent: true, opacity: 0.55, blending: THREE.AdditiveBlending, depthWrite: false, fog: false, side: THREE.DoubleSide })); disc.add(cor);
  const cor2 = new THREE.Mesh(new THREE.RingGeometry(45.5, 46.8, 64), new THREE.MeshBasicMaterial({ color: 0xffb080, transparent: true, opacity: 0.8, blending: THREE.AdditiveBlending, depthWrite: false, fog: false, side: THREE.DoubleSide })); disc.add(cor2);
  const halo = glowSprite(0x5a2848, 210, 0.5); disc.add(halo); at(disc, 150, 215, -40); disc.lookAt(0, 0, 0); sc.add(disc); S.disc = disc; S.cor = cor;
  // crater rim + the ledge the travellers arrive on
  mountains(sc, 235, 44, 0x100f18, 40, 85, 0, 5); mountains(sc, 300, 30, 0x0b0a12, 70, 130, 0, 8);
  sc.add(at(new THREE.Mesh(BOX(46, 44, 46), flat(0x2c2834)), -138, 22, 30)); for (let i = 0; i < 16; i++) sc.add(at(P(BOX(0.6 + hash(i) * 1.6, 0.4 + hash(i + 1) * 1.2, 0.6 + hash(i + 2) * 1.4), 0x343040, { olS: 1.03 }), -150 + hash(i + 3) * 30, 44.3, 10 + hash(i + 4) * 40)); sc.add(at(P(BOX(5, 3.4, 4), 0x343040, { olS: 1.02 }), -126, 45.7, 22)); sc.add(at(P(BOX(3, 2, 3), 0x2e2a38, { olS: 1.02 }), -121, 45, 40));
  S.groundY = (x, z) => (x < -112 ? 44 : 0);
  ambient(S, 'ash', 260, { r: 16, h: 9, sp: 0.18 }); ambient(S, 'dust', 200, { r: 12, h: 6, sp: 0.12, col: 0xffc880 });
  S.update = (sh, t) => { S.sky.userData.u.t.value = t; const st = sh.st || {}; const c = sh.camPos || { x: 0, z: 0 };
    S.lamps.forEach((l, i) => { let on = l.zone === 'street' ? (st.street == null ? 1 : st.street) : (st.alleyLit || 0); if (st.flick && l.zone === 'street') on *= 0.55 + 0.45 * Math.abs(Math.sin(t * (9 + i) + i * 2)); const f = on * (0.92 + 0.08 * Math.sin(t * 7 + i * 1.7)); l.mat.color.setRGB(0.1 + 0.9 * f, 0.1 + 0.84 * f, 0.13 + 0.62 * f); l.spr.material.opacity = 0.6 * f; l.spr.visible = f > 0.02; l.pool.material.opacity = 0.3 * f; });
    for (const h of S.houses) h.userData.win.color.set(st.winOff ? 0x14121a : 0xffb860); S.jars.forEach((g, i) => { g.material.opacity = 0.45 + 0.12 * Math.sin(t * 3 + i); });
    S.cor.material.opacity = 0.45 + 0.12 * Math.sin(t * 0.8); S.theoDoor.visible = !st.doorOpen;
    updAmbient(S, 'ash', t, c.x, c.z, st.ash); updAmbient(S, 'dust', t, c.x, c.z, st.dust); };
  return S;
};

// ---------- wanted poster ----------
function posterTexture() { const c = document.createElement('canvas'); c.width = 512; c.height = 704; const x = c.getContext('2d');
  x.fillStyle = '#b9a47c'; x.fillRect(0, 0, 512, 704); for (let i = 0; i < 900; i++) { x.fillStyle = `rgba(60,40,20,${0.03 + hash(i) * 0.06})`; x.fillRect(hash(i + 1) * 512, hash(i + 2) * 704, 2 + hash(i + 3) * 26, 1 + hash(i + 4) * 3); }
  x.strokeStyle = '#3a2a1a'; x.lineWidth = 6; x.strokeRect(18, 18, 476, 668); x.textAlign = 'center'; x.fillStyle = '#5a1410'; x.font = '800 78px Kanit'; x.fillText('ประกาศจับ', 256, 108);
  // portrait: long dark hair, pale face, red-brown eyes
  x.fillStyle = '#17121a'; x.beginPath(); x.ellipse(256, 300, 132, 150, 0, 0, TAU); x.fill(); x.fillRect(124, 300, 264, 190); x.fillStyle = '#e8cfb6'; x.beginPath(); x.ellipse(256, 318, 84, 104, 0, 0, TAU); x.fill();
  x.fillStyle = '#17121a'; x.beginPath(); x.moveTo(170, 300); x.quadraticCurveTo(210, 200, 300, 222); x.quadraticCurveTo(350, 240, 344, 310); x.quadraticCurveTo(300, 250, 236, 262); x.quadraticCurveTo(196, 270, 170, 300); x.fill();
  for (const sx of [-1, 1]) { x.fillStyle = '#fff'; x.beginPath(); x.ellipse(256 + sx * 36, 322, 17, 11, 0, 0, TAU); x.fill(); x.fillStyle = '#a8442e'; x.beginPath(); x.arc(256 + sx * 36, 322, 9, 0, TAU); x.fill(); x.fillStyle = '#1a0806'; x.beginPath(); x.arc(256 + sx * 36, 322, 4, 0, TAU); x.fill(); x.strokeStyle = '#17121a'; x.lineWidth = 4; x.beginPath(); x.moveTo(256 + sx * 16, 306); x.quadraticCurveTo(256 + sx * 36, 298, 256 + sx * 56, 310); x.stroke(); }
  x.strokeStyle = '#8a5a4a'; x.lineWidth = 3; x.beginPath(); x.moveTo(240, 372); x.quadraticCurveTo(256, 378, 272, 372); x.stroke(); x.fillStyle = '#d8dce8'; x.beginPath(); x.moveTo(150, 490); x.quadraticCurveTo(256, 420, 362, 490); x.lineTo(362, 500); x.lineTo(150, 500); x.fill();
  x.fillStyle = '#2a1a10'; x.font = '800 44px Kanit'; x.fillText('ผู้พิทักษ์', 256, 560); x.fillStyle = '#5a1410'; x.font = '800 50px Kanit'; x.fillText('ที่ขโมยตะวัน', 256, 620); x.fillStyle = '#3a2a1a'; x.font = '500 24px Kanit'; x.fillText('พบเห็น แจ้งป้อมหลวง', 256, 664);
  x.strokeStyle = 'rgba(120,10,10,0.85)'; x.lineWidth = 14; x.lineCap = 'round'; x.beginPath(); x.moveTo(120, 190); x.lineTo(400, 470); x.moveTo(396, 196); x.lineTo(128, 462); x.stroke();
  return new THREE.CanvasTexture(c); }
BUILD.lamphouse = function () {
  const S = baseSet(); const sc = S.scene;
  const fl = new THREE.Mesh(new THREE.PlaneGeometry(13, 10), flat(0x3a2c22)); fl.rotation.x = -Math.PI / 2; sc.add(fl);
  for (let i = 0; i < 13; i++) { const pl = new THREE.Mesh(new THREE.PlaneGeometry(0.04, 10), basic(0x241a14)); pl.rotation.x = -Math.PI / 2; at(pl, -6.5 + i, 0.01, 0); sc.add(pl); }
  sc.add(at(P(BOX(13, 4.2, 0.3), 0x4a3a2e, { olS: 1.0 }), 0, 2.1, -5)); sc.add(at(P(BOX(0.3, 4.2, 10), 0x443428, { olS: 1.0 }), -6.5, 2.1, 0)); sc.add(at(P(BOX(0.3, 4.2, 10), 0x443428, { olS: 1.0 }), 6.5, 2.1, 0)); sc.add(at(P(BOX(13, 4.2, 0.3), 0x3e3024, { olS: 1.0 }), 0, 2.1, 5));
  sc.add(at(P(BOX(13, 0.2, 10), 0x2e2218, { olS: 1.0 }), 0, 4.3, 0)); for (let i = -2; i <= 2; i++) sc.add(at(P(BOX(0.25, 0.3, 10), 0x2a1c12, { olS: 1.0 }), i * 2.6, 4.05, 0));
  sc.add(at(P(BOX(1.0, 2.1, 0.12), 0x2e1c12, { olS: 1.03 }), 5.0, 1.05, 4.86)); // door (to the alley)
  // shelves of lamps and sun jars on the left wall
  S.glows = []; for (let r = 0; r < 3; r++) { sc.add(at(P(BOX(0.5, 0.06, 5.6), 0x2e2218, { olS: 1.01 }), -6.1, 1.0 + r * 0.8, -1.0)); for (let i = 0; i < 9; i++) { const z = -3.5 + i * 0.62; if (hash(r * 9 + i) < 0.55) { const lit = hash(r * 7 + i + 3) < 0.3; const m = new THREE.Mesh(CYL(0.07, 0.08, 0.24, 10), basic(lit ? 0xffe89a : 0x5a5248)); at(m, -6.1, 1.16 + r * 0.8, z); sc.add(m); if (lit) { const g = glowSprite(0xffd070, 1.1, 0.5); at(g, -6.05, 1.16 + r * 0.8, z); sc.add(g); S.glows.push(g); } } else sc.add(at(lanternMesh(false), -6.1, 1.14 + r * 0.8, z, 1.3)); } }
  // work table, stools, crates, bunks
  sc.add(at(P(BOX(2.6, 0.1, 1.2), 0x5a4230, { olS: 1.02 }), -1.0, 0.85, -2.6)); for (const [x, z] of [[-2.2, -3.1], [0.2, -3.1], [-2.2, -2.1], [0.2, -2.1]]) sc.add(at(P(BOX(0.1, 0.85, 0.1), 0x3a2a1e, { olS: 1.05 }), x, 0.42, z));
  for (const [x, z] of [[-1.8, -1.4], [-0.2, -1.4], [1.0, -2.6]]) sc.add(at(P(CYL(0.2, 0.22, 0.45, 10), 0x4a3626, { ol: 0.015 }), x, 0.22, z));
  for (let i = 0; i < 6; i++) sc.add(at(P(BOX(0.7, 0.55, 0.7), 0x6a5236, { olS: 1.03 }), 5.6 - (i % 2) * 0.8, 0.28 + Math.floor(i / 2) * 0.56, -4.2 + (i % 2) * 0.1));
  for (const z of [1.2, 3.0]) { sc.add(at(P(BOX(2.0, 0.35, 0.9), 0x3e2e22, { olS: 1.02 }), -5.2, 0.3, z)); sc.add(at(P(BOX(1.9, 0.12, 0.8), 0x8a8478, { olS: 1.0 }), -5.2, 0.52, z)); }
  for (let i = 0; i < 5; i++) { const pm = P(CYL(0.016, 0.016, 2.2, 6), 0x3a2a20, { ol: 0.005 }); rot(at(pm, 3.0 + i * 0.22, 1.1, -4.75), 0.12, 0, 0); sc.add(pm); }
  // hanging lamp over the table
  sc.add(at(P(CYL(0.01, 0.01, 1.3, 4), 0x1a1410, {}), -1.0, 3.55, -2.6)); sc.add(at(lanternMesh(true), -1.0, 2.8, -2.6, 1.8)); S.hang = glowSprite(0xffc878, 5.5, 0.4); at(S.hang, -1.0, 2.8, -2.6); sc.add(S.hang);
  // the old wanted poster on the back wall
  const pm = new THREE.Mesh(new THREE.PlaneGeometry(1.25, 1.72), new THREE.MeshBasicMaterial({ map: posterTexture() })); at(pm, 2.2, 2.0, -4.83); pm.rotation.z = -0.04; sc.add(pm); S.poster = pm; S.posterMat = pm.material;
  ambient(S, 'dust', 120, { r: 6, h: 4, sp: 0.08, col: 0xffd8a0 });
  S.update = (sh, t) => { const st = sh.st || {}; const f = 0.9 + 0.1 * Math.sin(t * 6.3) * Math.sin(t * 2.1); S.hang.material.opacity = 0.42 * f; S.glows.forEach((g, i) => { g.material.opacity = 0.4 + 0.12 * Math.sin(t * 2.5 + i); }); const pk = st.poster == null ? 0.7 : st.poster; S.posterMat.color.setScalar(pk); updAmbient(S, 'dust', t, -1, -2, true); };
  return S;
};

// ---------- light-eater beasts ----------
function buildBeast() { const g = new THREE.Group(); const m = new THREE.MeshBasicMaterial({ color: 0x05040a }); const rim = new THREE.MeshBasicMaterial({ color: 0x3a2470, side: THREE.BackSide }); const part = (geo, x, y, z, sx, sy, sz, par = g) => { const o = new THREE.Group(); const a = new THREE.Mesh(geo, m); const b = new THREE.Mesh(geo, rim); b.scale.setScalar(1.07); o.add(a, b); o.position.set(x, y, z); o.scale.set(sx, sy, sz); par.add(o); return o; };
  part(SPH(0.5, 12, 10), 0, 0.85, -0.1, 1.0, 0.75, 1.5); part(SPH(0.42, 12, 10), 0, 1.0, 0.55, 1.0, 0.85, 1.0);
  const head = new THREE.Group(); head.position.set(0, 1.05, 1.0); g.add(head); part(SPH(0.3, 12, 10), 0, 0, 0.1, 1.05, 0.85, 1.25, head); const jaw = part(SPH(0.24, 10, 8), 0, -0.2, 0.2, 1.0, 0.35, 1.3, head);
  for (const sx of [-1, 1]) { const e = new THREE.Mesh(SPH(0.045, 8, 6), new THREE.MeshBasicMaterial({ color: 0xe8f4ff, fog: false })); e.position.set(sx * 0.13, 0.08, 0.38); e.scale.set(1.5, 0.6, 1); head.add(e); const gl = glowSprite(0xa8b8ff, 0.55, 0.8); gl.position.copy(e.position); head.add(gl); part(CONE(0.07, 0.3, 5), sx * 0.2, 0.3, -0.05, 1, 1, 1, head).rotation.set(-0.5, 0, sx * -0.4); }
  for (let i = 0; i < 6; i++) part(CONE(0.1, 0.5 - i * 0.04, 5), 0, 1.3 - i * 0.03, 0.4 - i * 0.28, 1, 1, 1).rotation.x = -0.5;
  const legs = []; for (const [x, z] of [[-0.3, 0.55], [0.3, 0.55], [-0.3, -0.6], [0.3, -0.6]]) { const l = new THREE.Group(); l.position.set(x, 0.8, z); g.add(l); part(CYL(0.1, 0.06, 0.8, 6), 0, -0.4, 0, 1, 1, 1, l); legs.push(l); }
  const tail = new THREE.Group(); tail.position.set(0, 0.95, -0.8); g.add(tail); part(CONE(0.12, 1.0, 5), 0, 0, -0.45, 1, 1, 1, tail).rotation.x = -1.57;
  g.userData = { head, jaw, legs, tail, m, rim }; return g; }
// pos: Vector3 on the ground, ang: facing, o: { s: size, run: 0..1 leg speed, k: 1 → 0 dissolving, snarl }
FX.beast = function (F, key, pos, ang, t, o = {}) { const g = F.add(key, buildBeast); const U = g.userData; const k = o.k == null ? 1 : o.k; if (k <= 0.01) { g.visible = false; return; } const s = (o.s || 1) * (0.55 + 0.45 * k);
  g.position.set(pos.x, pos.y + (o.y || 0), pos.z); g.rotation.set(o.rx || 0, ang, 0); g.scale.set(s, s * (0.9 + 0.1 * k), s); const run = o.run || 0; const ph = t * (4 + run * 9) + (o.ph || 0);
  U.legs.forEach((l, i) => { l.rotation.x = Math.sin(ph + (i % 3 ? Math.PI : 0)) * (0.15 + run * 0.7); }); U.head.rotation.set(Math.sin(t * 1.3 + (o.ph || 0)) * 0.12 - (o.snarl ? 0.15 : 0), Math.sin(t * 0.9 + (o.ph || 0) * 2) * 0.25, 0); U.jaw.rotation.x = (o.snarl ? 0.45 : 0.1) + Math.sin(t * 5) * 0.05; U.tail.rotation.set(0, Math.sin(t * 3 + (o.ph || 0)) * 0.4, 0); g.children[0].position.y = 0.85 + Math.sin(ph * 2) * 0.03 * (1 + run); };
// dark motes pulled off a dying beast
FX.dissolve = function (F, key, c, lt, t0, o = {}) { const n = o.n || 120; const g = F.ps(key, n, { blend: 'normal', soft: 0.3, order: 9 }); const k = lt - t0; g.set((i, p) => { if (k < 0 || k > 1.6) { p.a = 0; return; } const a = hash(i) * TAU, r = hash(i + 1) * 0.8, u = k / 1.6; p.x = c.x + Math.cos(a) * r * (1 + u * 1.6); p.z = c.z + Math.sin(a) * r * (1 + u * 1.6); p.y = c.y + 0.3 + hash(i + 2) * 1.0 + u * (1.0 + hash(i + 3) * 2.2); p.s = (0.12 + hash(i + 4) * 0.2) * (1 - u); p.a = (1 - u) * 0.9; p.r = 0.04; p.g = 0.02; p.b = 0.09; }); };
// eyes opening in the dark: list of [x,y,z]
FX.eyes = function (F, key, list, lt, t0, o = {}) { list.forEach((e, i) => { const k = clamp((lt - t0 - i * (o.gap == null ? 0.18 : o.gap)) / 0.25); const bl = Math.sin(lt * 1.7 + i * 2.3) > 0.96 ? 0.1 : 1; for (const sx of [-1, 1]) FX.glow(F, key + i + sx, V3(e[0] + sx * 0.13 * (o.dx == null ? 1 : o.dx), e[1], e[2] + sx * 0.13 * (o.dz || 0)), 0.2 * k * bl, 0xc8d8ff, 0.95 * k); }); };
// Ren's lightless flame on one arm (+ small aura on the ground)
FX.renArm = function (F, lt, k, side = 'R') { FX.blackFlame(F, 'ra' + side, FX.armBases(F, 'ren', side), lt, { n: 300, h: 0.55, w: 0.1, k, size: 1.0 }); };
