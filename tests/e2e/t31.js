const { chromium } = require('playwright'); const fs=require('fs'); const path=require('path');
(async()=>{ const SP=process.argv[2], GF=SP+'/gf'; const b=await chromium.launch({args:['--enable-unsafe-swiftshader','--use-angle=swiftshader']}); const p=await b.newPage({viewport:{width:1300,height:1100}}); const errs=[]; p.on('pageerror',e=>errs.push(e.message));
  await p.route('**/three.js/r128/three.min.js',r=>r.fulfill({contentType:'application/javascript',body:fs.readFileSync(SP+'/three/package/build/three.min.js','utf8')}));
  await p.route(/fonts\.googleapis\.com/,r=>r.fulfill({contentType:'text/css',body:fs.readFileSync(GF+'/all.css','utf8')}));
  await p.route(/fonts\.gstatic\.com/,r=>{ const f=GF+'/'+path.basename(new URL(r.request().url()).pathname); fs.existsSync(f)?r.fulfill({contentType:'font/woff2',body:fs.readFileSync(f)}):r.abort(); });
  await p.addInitScript(()=>{ window.claude={use:async n=>null}; });
  await p.goto('file://'+SP+'/wrapped.html'); await p.waitForTimeout(2500);
  await p.click('#tabStudio'); await p.waitForTimeout(500);
  const picker=await p.$('#fontChips'); await picker.screenshot({path:SP+'/v13-picker.png'});
  const ids=await p.evaluate(()=>FONT_IDS); const shots=[];
  for(const id of ids){ await p.evaluate(async(id)=>{ const btn=[...document.querySelectorAll('#fontChips .fontc')][FONT_IDS.indexOf(id)]; btn.click(); await ensureFont(id); await new Promise(r=>setTimeout(r,300)); },id);
    const d=await p.evaluate(()=>{ const t=R.starts[1]+2.2; drawAt(t); const c=document.createElement('canvas'); c.width=180; c.height=320; c.getContext('2d').drawImage(R.cv,0,0,180,320); return {img:c.toDataURL(),font:project.font,stored:localStorage.getItem('aioffice2:clipFont'),loaded:document.fonts.check(`800 40px "${project.font}"`,"กข")}; });
    shots.push(d); }
  fs.writeFileSync(SP+'/v13-fonts.json',JSON.stringify(shots.map(s=>({font:s.font,stored:s.stored,loaded:s.loaded}))));
  for(const [i,s] of shots.entries()) fs.writeFileSync(`${SP}/v13-f${i}.png`,Buffer.from(s.img.split(',')[1],'base64'));
  // reload keeps the choice for new clips
  const after=await p.evaluate(()=>normalizeProject({scenes:[{narration:"ทดสอบ"}]}).font);
  console.log(JSON.stringify({errs,after,fonts:shots.map(s=>s.font+":"+(s.loaded?"loaded":"NOT")),stored:shots[shots.length-1].stored})); await b.close(); })();
