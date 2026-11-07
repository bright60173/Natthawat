const { chromium } = require('playwright'); const fs=require('fs'); const path=require('path');
(async()=>{ const SP=process.argv[2], GF=SP+'/gf', theme=process.argv[3]||'dark'; const b=await chromium.launch({args:['--enable-unsafe-swiftshader','--use-angle=swiftshader']}); const errs=[]; const out={};
  for(const [name,vp] of [["land",{width:1366,height:1024}],["port",{width:820,height:1180}],["phone",{width:390,height:844}]]){
  const p=await b.newPage({viewport:vp,deviceScaleFactor:1}); p.on('pageerror',e=>errs.push(name+':'+e.message));
  await p.route('**/three.js/r128/three.min.js',r=>r.fulfill({contentType:'application/javascript',body:fs.readFileSync(SP+'/three/package/build/three.min.js','utf8')}));
  await p.route(/fonts\.googleapis\.com/,r=>r.fulfill({contentType:'text/css',body:fs.readFileSync(GF+'/all.css','utf8')}));
  await p.route(/fonts\.gstatic\.com/,r=>{ const f=GF+'/'+path.basename(new URL(r.request().url()).pathname); fs.existsSync(f)?r.fulfill({contentType:'font/woff2',body:fs.readFileSync(f)}):r.abort(); });
  await p.addInitScript((th)=>{ window.claude={use:async n=>null}; localStorage.setItem('aioffice2:theme',JSON.stringify(th)); },theme);
  await p.goto('file://'+SP+'/wrapped.html'); await p.waitForTimeout(1500);
  await p.evaluate(()=>{ setStatus("creative","working"); setStatus("hook","working"); });
  for(const v of ["office","chat","studio","lib"]){ await p.evaluate(v=>showTab(v),v); await p.waitForTimeout(700); const t0=Date.now(); try{ await p.screenshot({path:`${SP}/v15-${theme}-${name}-${v}.png`,timeout:15000}); console.log(name,v,"ok",Date.now()-t0); }catch(e){ console.log(name,v,"TIMEOUT", JSON.stringify(await p.evaluate(()=>{ const t=performance.now(); drawOffice(performance.now()); const a=performance.now()-t; const t2=performance.now(); if(typeof drawAt==="function"&&project) drawAt(playT); return {office:a,studio:performance.now()-t2,view:curView}; }))); } }
  out[name]=await p.evaluate(()=>({hs:document.documentElement.scrollWidth>innerWidth, rail:getComputedStyle(document.querySelector('.rail')).position}));
  await p.close(); }
  console.log(JSON.stringify({errs,out})); await b.close(); })();
