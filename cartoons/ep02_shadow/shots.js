// Contact sheet of chosen moments: node shots.js <out prefix> <t1,t2,...>
const { chromium } = require('playwright'); const fs=require('fs'); const path=require('path');
(async()=>{ const [OUT,TS]=process.argv.slice(2); const b=await chromium.launch(); const p=await b.newPage({viewport:{width:720,height:1280}}); const errs=[]; p.on('pageerror',e=>errs.push(e.message));
  await p.goto('file://'+path.resolve(__dirname,'episode.html')); await p.evaluate(()=>window.ready);
  for(const t of TS.split(',').map(Number)){ const d=await p.evaluate(t=>{ draw(t); return document.getElementById('cv').toDataURL('image/jpeg',0.85); },t); fs.writeFileSync(`${OUT}_${t.toFixed(1).padStart(5,'0')}.jpg`,Buffer.from(d.split(',')[1],'base64')); }
  console.log(JSON.stringify({errs})); await b.close(); })();
