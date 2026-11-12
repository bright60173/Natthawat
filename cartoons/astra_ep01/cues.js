// Export the timeline (shots, sound cues, subtitles) for audio.py and the .srt: node cues.js out.json out.srt
const { chromium } = require('playwright'); const path = require('path'); const fs = require('fs');
(async () => { const [OUT, SRT] = process.argv.slice(2); const b = await chromium.launch({ args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'] }); const p = await b.newPage();
  await p.goto('file://' + path.resolve(__dirname, 'index.html') + '?auto=1'); await p.evaluate(() => window.ready);
  const data = await p.evaluate(() => { TL.shots.forEach(sh => { sh._st = sh._st || sh.st; }); return exportCues(); });
  fs.writeFileSync(OUT, JSON.stringify(data)); const f = t => { const ms = Math.round(t * 1000); const h = String(Math.floor(ms / 3600000)).padStart(2, '0'), m = String(Math.floor(ms / 60000) % 60).padStart(2, '0'), s = String(Math.floor(ms / 1000) % 60).padStart(2, '0'); return `${h}:${m}:${s},${String(ms % 1000).padStart(3, '0')}`; };
  let n = 1, srt = ''; for (const sh of data.shots) for (const s of sh.subs) srt += `${n++}\n${f(s.at)} --> ${f(s.at + s.dur)}\n${s.who}: ${s.txt}\n\n`; if (SRT) fs.writeFileSync(SRT, srt);
  const names = new Set(), moods = new Set(); data.shots.forEach(s => { s.sfx.forEach(x => names.add(x[1])); moods.add(s.m); }); console.log('total', data.total, 'subs', n - 1); console.log([...names].join(' ')); console.log([...moods].join(' ')); await b.close(); })();
