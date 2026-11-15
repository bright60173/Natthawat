// Still frames for checking: node shots.js <out_prefix> <t1,t2,...> [scale]
const { chromium } = require('playwright'); const path = require('path'); const fs = require('fs');
(async () => { const [pre, ts, sc] = process.argv.slice(2); const b = await chromium.launch({ args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'] });
  const p = await b.newPage({ viewport: { width: 1920, height: 1080 } }); const errs = []; p.on('pageerror', e => errs.push(e.message)); p.on('console', m => { if (m.type() === 'error') errs.push(m.text()); });
  await p.goto('file://' + path.resolve(__dirname, 'index.html') + '?auto=1'); await p.evaluate(() => window.ready);
  console.log('total', await p.evaluate(() => TL.total));
  const times = /^sc/.test(ts) ? await p.evaluate(([n, f]) => STORY[n - 1].shots.map(sh => +(sh.start + sh.len * f).toFixed(2)), [+ts.slice(2).split('@')[0], +(ts.split('@')[1] || 0.5)]) : ts.split(',').map(Number); console.log(times.join(','));
  for (const t of times) { const d = await p.evaluate(([t, s]) => { draw(t); const c = document.createElement('canvas'); c.width = 1920 * s; c.height = 1080 * s; c.getContext('2d').drawImage(document.getElementById('cv'), 0, 0, c.width, c.height); return c.toDataURL('image/jpeg', 0.85).split(',')[1]; }, [t, +(sc || 0.5)]);
    fs.writeFileSync(`${pre}_${t}.jpg`, Buffer.from(d, 'base64')); }
  console.log(JSON.stringify(errs.slice(0, 10))); await b.close(); })();
