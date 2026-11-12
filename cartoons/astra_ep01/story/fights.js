// Edition 2: longer, faster fight choreography spliced into scenes 4-6, attack-name cards, impact frames,
// and per-shot trimming hints. Loaded after s1..s8; dialogue order is untouched (voice lines stay in sync).
const orb = (cx, cz, r, a0, a1, h0, h1, ly, fov = 42) => (lt, u) => { const a = lerp(a0, a1, ease(clamp(u * (orb.k || 1)))); return { p: [cx + Math.cos(a) * r, lerp(h0, h1, u), cz + Math.sin(a) * r], l: [cx, ly, cz], fov }; };
const FT = (d, o) => Object.assign({ d, set: 'village', L: 'battle', m: 'battle', st: BF, keep: 1 }, o);
const GSW = { R: 'bsword', L: 'bsword' };
const HIT = (F, lt, t0, x, y, z, o) => FX.impact(F, V3(x, y, z), lt, t0, o);
(() => {
  const S4 = STORY[3].shots, S5 = STORY[4].shots, S6 = STORY[5].shots, S3 = STORY[2].shots;
  // ---- attack names + impact frames on existing shots ----
  S3[5].name = [1.3, 'สายน้ำจันทรา', 'กำแพงวารี', 1.6, '#2a9cff']; S3[5].cut = [0, 6.2];
  S4[0].name = [3.5, 'พลังโลหิต', 'ฝนหอกแดง', 1.8]; S4[0].lead = 2.6; S4[0].tail = 1.4;
  S4[2].cut = [0.6, 5.2]; S4[3].cut = [1.8, 5.0]; S4[3].imp = [3.4]; S4[6].cut = [0, 3.6]; S4[6].imp = [1.65];
  S4[16].imp = [1.32]; S4[16].cut = [0, 3.4]; S4[16].tw = slowmo(1.3, 1.5, 0.3); S4[16].d += 0.5;
  S4[19].imp = [0.64]; S4[19].tw = slowmo(0.62, 0.8, 0.2); S4[19].cut = [0, 3.6];
  S5[0].name = [2.7, 'พลังโลหิต', 'กรงโลหิต', 1.6]; S5[0].cut = [0, 5.0];
  S5[16].imp = [0.25]; S5[16].tw = slowmo(0.3, 0.9, 0.3); S5[16].cut = [0, 5.4]; S5[16].d += 1.4;
  S5[21].name = [2.5, 'เปลวเพลิงดำ', 'หมาป่าทมิฬ', 1.8]; S5[21].cut = [0, 6.0];
  S6[14].name = [1.2, 'เปลวเพลิงดำ', 'ปีกพิทักษ์', 1.8]; S6[14].cut = [0, 6.5];
  S6[15].imp = [0.3]; S6[15].cut = [0, 3.6];
  for (const k in S5[23].A) if (/^s\d/.test(k)) { S5[23].A[k].a = 'lie'; S5[23].A[k].f = hash(k.charCodeAt(1)) * 6; S5[23].A[k].p = [5 + hash(k.charCodeAt(1) + 2) * 5, hash(k.charCodeAt(1) + 5) * 4]; }
  // keep the lead-in action of dialogue shots whose line starts late
  const LEAD = { 'ฝันเดิมอีกแล้ว': 4.0, 'เฮ้! เป็นอะไร': 2.4, 'พี่เรน ท่านลุง': 1.6, 'พอได้แล้ว เขาไม่': 2.4, 'เจ้าจะหนี': 2.6, 'ช่างน่าประทับใจ': 1.6, 'ถึงเวลาที่เจ้า': 0.8, 'เมื่อดวงอาทิตย์': 1.4, 'จงแสดงเปลวเพลิง': 1.4, 'อย่าให้พวกมันพบ': 1.2, 'พบร่องรอยแล้ว': 1.2, 'ในที่สุดก็พบเจ้า': 1.2, 'จำไว้นะ': 2.2 };
  for (const sc of STORY) for (const sh of sc.shots) if (sh.sub && sh.sub.length) for (const k in LEAD) if (sh.sub[0][1].startsWith(k)) sh.lead = LEAD[k];
  // establishing / mood shots that must keep their full length
  STORY[0].shots[STORY[0].shots.length - 1].cut = [0, 8.5]; for (const sh of STORY[7].shots) if (sh.title) sh.keep = 1;

  // ---- scene 4: Mira cuts down the soldiers that rush her ----
  const M4 = [5.5, -2], RUSH = [[11, -3], [9.4, 1.6], [5.2, 3.6]];
  S4.splice(10, 0,
    FT(1.9, { m: 'magic', st: { fire: 1, debris: true }, L: 'fire', imp: [0.72], name: [0.55, 'สายน้ำจันทรา', 'คมจันทร์เสี้ยว', 1.25, '#2a9cff', 0.3, 0.3], tw: slowmo(0.7, 0.9, 0.3), sfx: [[0, 'runsteps', 0.7], [0.35, 'whoosh', 0.9], [0.5, 'whoosh', 0.9], [0.72, 'slash', 1], [0.8, 'impact', 0.9], [1.2, 'tumble', 0.8]],
      A: Object.assign({ mira: { p: M4, a: [[0, 'idle'], [0.15, 'cast'], [0.5, 'cast2']], f: [[0, 0.2], [0.15, [10, -1]]], turn: 0.2, L: 'crystal' } }, (() => { const A = {}; RUSH.forEach(([x, z], i) => { const dx = x - M4[0], dz = z - M4[1], L = Math.hypot(dx, dz); A['s' + i] = { p: [x, z], p2: [M4[0] + dx / L * 2.4, M4[1] + dz / L * 2.4], t: [0, 0.75], a: [[0, 'run'], [0.72 + i * 0.06, 'fall']], f: Math.atan2(-dx, -dz), ph: i }; }); return A; })()),
      cam: orb(5.5, -2, 6.5, 0.2, 1.3, 1.4, 2.2, 1.1, 46),
      fx: (F, lt) => { const h = F.joint('mira', 'handR'); RUSH.forEach(([x, z], i) => { const tg = F.joint('s' + i, 'torso'); tg.y += 0.3; FX.blade(F, 'bl' + i, h, tg, lt, 0.4 + i * 0.07, 0.3); HIT(F, lt, 0.72 + i * 0.06, tg.x, tg.y, tg.z, { col: 0x9fe4ff, gcol: 0x9fe4ff, r: 4, sparks: { col: 0x9fe4ff } }); }); FX.circle(F, 'ci', V3(M4[0], 0, M4[1]), 2.4, 0x4ab8ff, 0.9, lt * 2); F.light(0, 0x4ab8ff, 3, M4[0], 1.5, M4[1], 9); F.lines = lt > 0.35 && lt < 0.75 ? 0.2 : 0; } }));

  // ---- scene 5: the flame wolf tears through the shadow soldiers ----
  const WS = i => [7.0 + (i % 3) * 1.3, 0.2 + Math.floor(i / 3) * 2.4];
  const charge = i => [2.6 + (i % 3) * 0.9, 2.2 + Math.floor(i / 3) * 1.6];
  S5.splice(23, 0,
    FT(1.3, { m: 'wolf', st: { fire: 0.8, cracks: true, crackAt: R5 }, sfx: [[0, 'march', 1], [0.2, 'shout', 0.7], [0.3, 'growl', 0.8]],
      A: Object.assign({ wolf: { p: [-0.6, 3.6], a: 'crouch', f: [9, 1.5], s: 2.4 }, ren: { p: R5, a: 'stance', f: [9, 1.5], eye: 'gold' } }, (() => { const A = {}; for (let i = 0; i < 6; i++) A['s' + i] = { p: WS(i), p2: charge(i), a: 'run', ph: i }; return A; })()),
      cam: { p: [-3.2, 1.0, 5.6], p2: [-2.6, 1.1, 5.2], l: [4, 1.4, 2.6], fov: 48 }, fx: (F, lt) => { FX.wolfFlame(F, 'wf', lt, 1, 800); ARMFLAME(F, lt); F.lines = 0.15; } }),
    FT(2.6, { m: 'wolf', st: { fire: 0.8, cracks: true, crackAt: R5 }, imp: [0.5], tw: slowmo(0.5, 0.75, 0.22), sfx: [[0, 'roar', 1], [0.2, 'flamewhoosh', 1], [0.5, 'explosion', 1], [0.6, 'impact', 1], [1.6, 'tumble', 0.9], [1.9, 'tumble', 0.8]],
      A: Object.assign({ wolf: { p: [-0.6, 3.6], p2: [7.5, 1.8], t: [0.1, 1.1], a: 'run', f: [9, 1.5], s: 2.4, jump: [0.15, 1.05, 1.4] }, ren: { p: R5, a: 'thrust', f: [9, 1.5], eye: 'gold' } }, (() => { const A = {}; for (let i = 0; i < 6; i++) { const c = charge(i), dz = (i < 3 ? -1 : 1); A['s' + i] = { p: c, p2: [c[0] + 2.5 + hash(i) * 2, c[1] + dz * (2.5 + hash(i + 3) * 2)], t: [0.45 + i * 0.03, 1.0], a: [[0, 'guard'], [0.45 + i * 0.03, 'fall']], f: -Math.PI / 2, e: 'out', jump: [0.45, 0.95, 1.2 + hash(i) * 0.8], rz: 0 }; } return A; })()),
      cam: orb(3.4, 2.6, 8.5, 1.2, 1.9, 1.0, 1.8, 1.5, 50),
      fx: (F, lt) => { FX.wolfFlame(F, 'wf', lt, 1, 900); const w = F.apos('wolf'); HIT(F, lt, 0.5, 3.6, 1.2, 2.8, { col: 0xff3010, gcol: 0xff5030, r: 12, g: 5, shake: 0.3 }); FX.pillar(F, 'pl', V3(3.6, 0, 2.8), lt, 0.5, { h: 4, w: 4, n: 700 }); F.light(0, 0xff2010, 4, w.x, 2, w.z, 14); F.rays = lt > 0.5 && lt < 0.9 ? 0.4 : 0; F.raysAt = [W * 0.5, H * 0.5]; } }),
    FT(1.7, { m: 'wolf', st: { fire: 0.8, cracks: true, crackAt: R5 }, imp: [0.72], tw: slowmo(0.7, 0.86, 0.3), sfx: [[0, 'runsteps', 0.8], [0.6, 'flamewhoosh', 0.9], [0.72, 'punch', 1], [1.2, 'tumble', 0.8]],
      A: { ren: { p: R5, a: [[0, 'stance'], [0.4, 'punch']], f: [[0, [9, 1.5]], [0.2, [-7, 8]]], turn: 0.2, eye: 'gold' }, s0: { p: [-7.6, 8.6], p2: [-4.3, 5.75], t: [0, 0.7], a: [[0, 'run'], [0.74, 'fall']], f: 2.3 } },
      cam: { p: [-1.4, 1.3, 7.6], p2: [-1.8, 1.4, 7.2], l: [-4.2, 1.3, 5.6], fov: 40 },
      fx: (F, lt) => { ARMFLAME(F, lt, 1.3); const h = F.joint('ren', 'handR'); HIT(F, lt, 0.72, h.x - 0.3, h.y, h.z + 0.3, { col: 0xff3010, gcol: 0xff6040, r: 5 }); FX.arc(F, 'ar', h, 1.0, lt, 0.62, { col: 0xff2a10, tilt: [-1.57, 0, 0], life: 0.3 }); } }));

  // ---- scene 6: Ren vs Gron, proper exchanges ----
  const R0 = [3.5, 0.5], G0 = [5, -3.5], G1 = [3.95, -0.55], G2 = [4.7, -2.0], G3 = [5.3, -3.1];
  const REN = (o) => Object.assign({ p: R0, a: 'stance', f: 'gron', eye: 'gold' }, o), GRON = (o) => Object.assign({ p: G0, a: 'stance', f: 'ren' }, GSW, o);
  const duelA = [
    FT(1.15, { sfx: [[0.05, 'dash', 1], [0.1, 'runsteps', 0.8]], A: { ren: REN(), gron: GRON({ p2: G1, t: [0.08, 1.0], a: 'dash', e: 'in' }) },
      cam: { p: [8.6, 0.6, -2.6], p2: [7.0, 0.7, -0.2], l: [5, 1.3, -3.3], l2: [3.9, 1.3, -0.3], fov: 46, e: 'in' }, fx: (F, lt) => { RF(F, lt); F.lines = 0.3; FX.dust(F, 'd', V3(5, 0.1, -3.4), lt, 0.1); } }),
    FT(0.85, { sfx: [[0, 'heartbeat', 0.7]], A: { ren: REN({ a: 'stance', bl: 0 }) }, cam: { f: 'ren', p: [0.42, 1.66, -0.95], p2: [0.36, 1.66, -0.8], l: [0, 1.62, 0], fov: 26 }, still: 1, fx: (F, lt) => { F.light(0, 0xff2010, 2, 3.2, 1.6, 0.2, 4); } }),
    FT(2.3, { imp: [0.3], tw: slowmo(0.3, 0.5, 0.2), sfx: [[0.1, 'whoosh', 0.9], [0.3, 'clash', 1], [0.32, 'explosion', 0.7], [1.3, 'clashgrind', 0.7]], st: Object.assign({}, BF, { crackAt: [3.75, 0] }),
      A: { ren: REN({ a: 'block' }), gron: GRON({ p: G1, a: 'slash2' }) }, cam: orb(3.75, 0, 4.6, 2.2, 3.5, 1.0, 1.5, 1.35, 44),
      fx: (F, lt) => { RF(F, lt, 1.2); HIT(F, lt, 0.3, 3.72, 1.6, 0.05, { col: 0xff5030, r: 9, g: 4, shake: 0.3 }); FX.arc(F, 'ar', V3(3.9, 1.7, -0.3), 1.5, lt, 0.2, { col: 0xff2030, tilt: [-0.4, 0.3, 0.9], life: 0.3 }); FX.cracks(F, 'ck', V3(3.75, 0, 0), clamp((lt - 0.3) / 0.25), 12, 4.5); F.rays = lt > 0.3 && lt < 0.55 ? 0.35 : 0; F.raysAt = [W / 2, H * 0.45]; } }),
    FT(1.25, { imp: [], sfx: [[0.25, 'flamewhoosh', 0.9], [0.32, 'whoosh', 1], [0.5, 'skid', 0.8]], A: { ren: REN({ a: 'punch' }), gron: GRON({ p: G1, p2: G2, t: [0.28, 0.75], a: [[0, 'slash2'], [0.24, 'dodge']], e: 'out', bl: 0.1 }) },
      cam: { p: [2.3, 1.15, 2.0], p2: [2.6, 1.2, 1.6], l: [4.2, 1.35, -0.9], fov: 44 },
      fx: (F, lt) => { RF(F, lt, 1.4); const h = F.joint('ren', 'handR'); FX.arc(F, 'ar', h, 1.3, lt, 0.3, { col: 0xff2a10, tilt: [-1.5, 0, 0.5], life: 0.32, sweep: 3.2 }); FX.blackFlame(F, 'tr', [h], lt, { n: 160, h: 0.5, w: 0.25, k: lt > 0.28 && lt < 0.8 ? 1 : 0, size: 1.3, life: 0.4 }); F.lines = lt > 0.28 && lt < 0.6 ? 0.25 : 0; FX.dust(F, 'd', V3(4.6, 0.1, -1.9), lt, 0.6); } }),
    FT(1.0, { sfx: [[0, 'dash', 0.8], [0.3, 'slash', 1], [0.34, 'whoosh', 0.9]], A: { ren: REN({ a: [[0, 'stance'], [0.26, 'duck']], bl: 0.08 }), gron: GRON({ p: G2, p2: [4.0, -0.6], t: [0, 0.32], a: [[0, 'dash'], [0.28, 'slash']], e: 'in' }) },
      cam: { p: [5.9, 0.6, 1.8], p2: [5.5, 0.7, 1.5], l: [3.8, 1.1, -0.1], fov: 46 },
      fx: (F, lt) => { RF(F, lt); const c = F.joint('gron', 'torso'); c.y += 0.5; FX.arc(F, 'a1', c, 1.9, lt, 0.32, { col: 0xff2030, tilt: [-1.45, 0, 0], life: 0.3, sweep: 4.4, spin: 5 }); FX.arc(F, 'a2', c, 1.6, lt, 0.5, { col: 0xff2030, tilt: [-1.7, 0, 2], life: 0.3, sweep: 4.4, spin: -5 }); F.lines = lt > 0.3 ? 0.2 : 0; } }),
    FT(1.75, { imp: [0.26], tw: slowmo(0.25, 0.42, 0.2), sfx: [[0.15, 'whoosh', 0.9], [0.26, 'punch', 1], [0.3, 'impact', 1], [0.9, 'skid', 0.9]], A: { ren: REN({ a: [[0, 'duck'], [0.04, 'kick']], bl: 0.06 }), gron: GRON({ p: [4.0, -0.6], p2: G3, t: [0.27, 1.0], a: [[0, 'slash'], [0.26, 'stagger']], e: 'out', bl: 0.05 }) },
      cam: orb(3.8, 0, 4.2, 0.4, -0.5, 0.8, 1.2, 1.2, 46),
      fx: (F, lt) => { RF(F, lt); HIT(F, lt, 0.26, 3.95, 1.25, -0.3, { r: 6 }); FX.dust(F, 'd', V3(5.0, 0.1, -2.6), lt, 0.7); } }),
    FT(1.5, { sfx: [[0.1, 'skid', 0.8], [0.6, 'growl_low', 0.7], [0.95, 'dash', 1], [1.38, 'clash', 1]], imp: [1.38],
      A: { ren: REN({ p: R0, p2: [3.6, 0.2], t: [1.2, 1.4], a: [[0, 'stance'], [1.25, 'block']] }), gron: GRON({ p: G3, p2: [4.3, -0.9], t: [0.95, 1.38], a: [[0, 'stagger'], [0.45, 'stance'], [0.95, 'dash'], [1.34, 'slash']], e: 'in' }) },
      cam: { p: [6.8, 0.7, -4.6], p2: [5.4, 1.0, -2.4], l: [5.3, 1.6, -3.1], l2: [4.0, 1.4, -0.5], fov: 42, t: [0.9, 1.4] },
      fx: (F, lt) => { RF(F, lt); HIT(F, lt, 1.38, 3.95, 1.5, -0.35, { col: 0xff5030 }); FX.dust(F, 'd', V3(5.3, 0.1, -3.1), lt, 0.15); } }),
  ];
  const duelB = [
    FT(1.6, { imp: [0.28], sfx: [[0.1, 'riser', 0.5], [0.28, 'flamewhoosh', 1], [0.3, 'explosion', 0.8], [0.6, 'skid', 0.9]], A: { ren: REN({ p: [3.6, 0.2], a: [[0, 'block'], [0.12, 'thrust']] }), gron: GRON({ p: [4.3, -0.9], p2: [5.7, -3.5], t: [0.28, 1.2], a: [[0, 'slash'], [0.28, 'cross']], e: 'out', bl: 0.06 }) },
      cam: { p: [8.6, 1.3, 1.6], p2: [8.2, 1.5, 1.0], l: [4.6, 1.2, -1.4], fov: 46 },
      fx: (F, lt) => { RF(F, lt, 1.5); const h = F.joint('ren', 'handR'), g = F.joint('gron', 'torso'); g.y += 0.4; const k = lt > 0.28 && lt < 1.15 ? 1 : 0; FX.blackFlame(F, 'bl', i => h.clone().lerp(g, hash(i * 0.73)), lt, { n: 600, h: 0.5, w: 0.3, k, size: 1.5, life: 0.35 }); HIT(F, lt, 0.28, 4.1, 1.4, -0.6, { col: 0xff3010, gcol: 0xff5030, r: 8, shake: 0.25 }); FX.dust(F, 'd', V3(5.2, 0.1, -2.6), lt, 0.5); F.light(0, 0xff2010, 4 * k, 4.6, 1.5, -1.5, 10); } }),
    FT(2.35, { tw: slowmo(0.62, 0.86, 0.2), name: [0.7, 'เปลวเพลิงดำ', 'กรงเล็บทมิฬ', 1.4, '#e8121c', 0.3, 0.72], sfx: [[0.1, 'runsteps', 0.8], [0.25, 'jump', 0.9], [0.6, 'riser', 0.7], [1.9, 'flamewhoosh', 1]],
      A: { ren: REN({ p: [3.6, 0.2], p2: [5.1, -2.7], t: [0.05, 1.3], a: [[0, 'run'], [0.25, 'jumpatk']], jump: [0.25, 1.28, 2.7], f: [5.7, -3.5] }), gron: GRON({ p: [5.7, -3.5], a: 'cross', hx: -0.4 }) },
      cam: { p: [6.6, 0.45, -4.9], p2: [6.9, 0.5, -5.2], l: [4.4, 2.7, -1.5], l2: [5.0, 1.6, -2.6], fov: 52, t: [0.9, 2.35] },
      fx: (F, lt) => { RF(F, lt, 1.6); const h = F.joint('ren', 'handR'); FX.claw(F, 'claw', h, V3(5.5, 0.3, -3.3), clamp((lt - 0.95) / 0.3) * (lt < 1.35 ? 1 : 0), lt); FX.blackFlame(F, 'hh', [h, F.joint('ren', 'handL')], lt, { n: 260, h: 0.8, w: 0.3, k: 1, size: 1.5, life: 0.5 }); F.rays = lt > 0.6 && lt < 0.9 ? 0.3 : 0; F.raysAt = [W * 0.45, H * 0.3]; } }),
    FT(1.5, { imp: [0.06], sfx: [[0.05, 'explosion', 1], [0.1, 'flamewhoosh', 1], [0.3, 'rubble', 0.8], [0.2, 'dash', 0.8]], st: Object.assign({}, BF, { crackAt: [5.4, -3.2] }),
      A: { ren: REN({ p: [5.1, -2.7], a: [[0, 'jumpatk'], [0.05, 'duck']], f: [5.7, -3.5], bl: 0.05 }), gron: GRON({ p: [5.7, -3.5], p2: [6.9, -1.5], t: [0, 0.35], a: 'dodge', e: 'out', f: 'ren' }) },
      cam: { p: [5.2, 9.5, -0.6], p2: [5.2, 8.5, -0.9], l: [5.4, 0, -3], fov: 44 },
      fx: (F, lt) => { FX.pillar(F, 'pl', V3(5.5, 0, -3.3), lt, 0.05, { h: 6, w: 2.2, n: 800 }); HIT(F, lt, 0.06, 5.5, 0.4, -3.3, { col: 0xff3010, gcol: 0xff5030, r: 12, g: 5, shake: 0.35, sh: 0.5 }); FX.cracks(F, 'ck', V3(5.5, 0, -3.3), clamp(lt / 0.3), 14, 5); FX.dust(F, 'd', V3(6.8, 0.1, -1.6), lt, 0.3); } }),
    FT(2.5, { imp: [0.5], tw: slowmo(0.48, 0.72, 0.22), sfx: [[0.1, 'dash', 0.9], [0.44, 'slash', 1], [0.5, 'impact', 1], [1.6, 'tumble', 0.9], [1.7, 'groan', 0.8]],
      A: { ren: REN({ p: [5.1, -2.7], p2: [2.4, 1.4], t: [0.5, 1.25], a: [[0, 'duck'], [0.3, 'stance'], [0.5, 'fall']], f: [[0, [5.7, -3.5]], [0.3, 'gron']], turn: 0.15, e: 'out', bl: 0.08 }), gron: GRON({ p: [6.9, -1.5], p2: [5.7, -2.3], t: [0.05, 0.4], a: [[0, 'dash'], [0.3, 'slash2']], e: 'in', bl: 0.06 }) },
      cam: { p: [3.2, 1.1, -5.0], p2: [2.6, 1.3, -4.2], l: [5.3, 1.2, -2.5], l2: [3.6, 0.8, -0.4], fov: 44, t: [0.5, 2.3] },
      fx: (F, lt) => { RF(F, lt, 0.6); const c = F.joint('ren', 'torso'); FX.arc(F, 'ar', V3(5.5, 1.5, -2.5), 1.6, lt, 0.42, { col: 0xff2030, tilt: [-0.6, 0.4, 0.4], life: 0.3 }); HIT(F, lt, 0.5, 5.2, 1.2, -2.6, { col: 0xff2030, gcol: 0xff4050, sparks: { col: 0xd01020, n: 70 } }); } }),
  ];
  const duelC = [
    FT(1.25, { m: 'wings', sfx: [[0, 'dash', 1], [0.1, 'flamewhoosh', 1], [0.2, 'runsteps', 0.8]], A: { ren: REN({ p: [2.6, 0.9], p2: [4.5, 0.05], t: [0.05, 1.1], a: 'dash', f: [5.4, -0.2], e: 'in' }), gron: GRON({ p: [5.4, -0.2], a: 'cross' }), mira: { p: [1.9, 0.2], a: 'kneel', f: 'ren', L: 'crystal' } },
      cam: { f: 'ren', p: [-2.4, 1.5, 1.6], p2: [-1.6, 1.3, 1.1], l: [1.6, 1.3, -0.5], fov: 50 }, fx: (F, lt) => { FX.wings(F, 'wing', 'ren', 1, lt); F.lines = 0.35; F.light(0, 0xff1a10, 3.5, 3.5, 2.2, 0.5, 14); } }),
    FT(1.2, { m: 'wings', imp: [0.3], tw: slowmo(0.3, 0.45, 0.25), sfx: [[0.15, 'whoosh', 0.9], [0.3, 'shatter', 1], [0.3, 'clash', 1], [0.32, 'explosion', 0.7]],
      A: { ren: REN({ p: [4.5, 0.05], a: 'block', f: [5.4, -0.2] }), gron: GRON({ p: [5.4, -0.2], a: [[0, 'cross'], [0.08, 'slash2']] }) }, cam: orb(4.95, -0.08, 3.6, 2.3, 1.5, 1.0, 1.4, 1.5, 44),
      fx: (F, lt) => { FX.wings(F, 'wing', 'ren', 1, lt); if (lt > 0.3) { F.sh.A.gron.R = null; F.sh.A.gron.L = null; } else { F.sh.A.gron.R = 'bsword'; F.sh.A.gron.L = 'bsword'; } HIT(F, lt, 0.3, 4.95, 1.6, -0.08, { col: 0xff2030, gcol: 0xff4050, r: 8, g: 4, sparks: { col: 0xff3040, n: 160, speed: 11 } }); F.light(0, 0xff1a10, 3.5, 4.6, 2.2, 0, 12); } }),
    FT(3.1, { m: 'wings', imp: [0.3], tw: slowmo(0.28, 0.52, 0.14), sfx: [[0.1, 'riser', 0.6], [0.3, 'punch', 1], [0.32, 'explosion', 1], [0.4, 'flamewhoosh', 1], [0.5, 'choir', 0.9]],
      A: { ren: REN({ p: [4.5, 0.05], a: 'uppercut', f: [5.4, -0.2] }), gron: { p: [5.4, -0.2], a: [[0, 'stagger'], [0.3, 'hit']], f: 'ren', jump: [0.3, 1.5, 1.7], bl: 0.05 } },
      cam: orb(4.95, -0.08, 4.8, -0.9, 0.2, 0.5, 1.0, 1.9, 50),
      fx: (F, lt) => { FX.wings(F, 'wing', 'ren', 1, lt); const g = F.joint('gron', 'torso'); HIT(F, lt, 0.3, 5.3, 1.5, -0.15, { col: 0xff3010, gcol: 0xff6040, r: 12, g: 6, shake: 0.35 }); FX.pillar(F, 'pl', V3(5.3, 0, -0.15), lt, 0.3, { h: 7, w: 1.4, n: 700, life: 1.0 }); F.rays = lt > 0.3 && lt < 0.8 ? 0.4 : 0; F.raysAt = [W * 0.5, H * 0.4]; F.light(0, 0xff1a10, 5, 5, 2.5, 0, 16); } }),
  ];
  S6.splice(15, 0, ...duelC);           // before the blast that throws Gron through the wall
  S6.splice(5, 1, ...duelB);            // replaces the old single claw/fall shot
  S6.splice(2, 1, ...duelA);            // replaces the old single clash shot
})();
