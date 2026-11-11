// Render a time range to a video-only mp4: node render.js <t0> <t1> <out.mp4>   (frames drawn in Chromium, piped to ffmpeg)
const { chromium } = require('playwright'); const path = require('path'); const { spawn } = require('child_process');
(async () => { const [T0, T1, OUT] = process.argv.slice(2); const b = await chromium.launch({ args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'] });
  const p = await b.newPage({ viewport: { width: 1920, height: 1080 } }); const errs = []; p.on('pageerror', e => errs.push(e.message));
  await p.goto('file://' + path.resolve(__dirname, 'index.html') + '?auto=1&gs=' + (process.env.GS || 1)); await p.evaluate(() => window.ready); const FPS = 24;
  const f0 = Math.round(+T0 * FPS), f1 = Math.round(+T1 * FPS);
  const ff = spawn('ffmpeg', ['-v', 'error', '-y', '-f', 'image2pipe', '-vcodec', 'mjpeg', '-framerate', String(FPS), '-i', '-', '-r', '24', '-c:v', 'libx264', '-preset', 'fast', '-crf', '21', '-pix_fmt', 'yuv420p', '-movflags', '+faststart', OUT], { stdio: ['pipe', 'inherit', 'inherit'] });
  const t = Date.now();
  for (let i = f0; i < f1; i += 8) { const batch = await p.evaluate(([a, z, fps]) => { const out = [], cv = document.getElementById('cv'); for (let k = a; k < z; k++) { drawTeaser(k / fps); out.push(cv.toDataURL('image/jpeg', 0.9).split(',')[1]); } return out; }, [i, Math.min(f1, i + 8), FPS]);
    for (const d of batch) { if (!ff.stdin.write(Buffer.from(d, 'base64'))) await new Promise(r => ff.stdin.once('drain', r)); } if ((i - f0) % 480 === 0) console.log(OUT.split('/').pop(), 'frame', i - f0, '/', f1 - f0, ((Date.now() - t) / 1000).toFixed(0) + 's'); }
  ff.stdin.end(); await new Promise(r => ff.on('close', r)); console.log(JSON.stringify({ out: OUT, errs: errs.slice(0, 5), frames: f1 - f0, sec: (Date.now() - t) / 1000 })); await b.close(); })();
