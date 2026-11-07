const { chromium } = require('playwright'); const fs=require('fs'); const { execFileSync }=require('child_process');
(async()=>{ const SP=process.argv[2]; const b=await chromium.launch({args:['--enable-unsafe-swiftshader','--use-angle=swiftshader','--autoplay-policy=no-user-gesture-required']}); const p=await b.newPage({viewport:{width:1300,height:1000}}); const errs=[]; p.on('pageerror',e=>errs.push(e.message));
  let calls=0, sentKey="";
  await p.route('https://api.elevenlabs.io/**',async r=>{ calls++; sentKey=r.request().headers()['xi-api-key']; const out=execFileSync('curl',['-sS','-X','POST','-H','Content-Type: application/json','-H','xi-api-key: proxy-injected',r.request().url(),'-d',r.request().postData()],{maxBuffer:50e6}); r.fulfill({status:200,contentType:'application/json',body:out}); });
  await p.route('**/three.js/r128/three.min.js',r=>r.fulfill({contentType:'application/javascript',body:fs.readFileSync(SP+'/three/package/build/three.min.js','utf8')}));
  await p.addInitScript(()=>{ localStorage.setItem('aioffice2:el_key',JSON.stringify('test-key')); window.claude={use:async n=>n==='downloads'?{save:async o=>{ const fr=new FileReader(); fr.onload=()=>window.__b64=fr.result; fr.readAsDataURL(o.data); }}:null}; });
  await p.goto('file://'+SP+'/wrapped.html'); await p.waitForTimeout(1500);
  const proj=JSON.parse(fs.readFileSync(SP+'/vtest.json','utf8'));
  await p.evaluate(pj=>loadProject(pj,{switchTab:true}),proj); await p.waitForTimeout(500);
  const before=await p.evaluate(()=>({total:R.total,info:$("elInfo").textContent}));
  await p.click('#elGen'); await p.waitForFunction(()=>voiceBuf&&voiceBuf._el,null,{timeout:120000});
  const a=await p.evaluate(()=>({total:R.total,dur:voiceBuf.duration,aligned:project.scenes.map(s=>!!s.align),words:R.subs[0].words.slice(0,4).map(w=>[w.text,+w.from.toFixed(2)]),info:$("elInfo").textContent}));
  const c1=calls; await p.click('#elGen'); await p.waitForTimeout(3000); const c2=calls;
  const reload=await p.evaluate(async pj=>{ voiceBuf=null; loadProject(JSON.parse(JSON.stringify(project))); await new Promise(r=>setTimeout(r,2500)); return !!voiceBuf?._el; },proj);
  const c3=calls;
  // export with the voice
  await p.click('#exportBtn'); await p.waitForSelector('#saveVideoBtn:not([hidden])',{timeout:120000}); await p.click('#saveVideoBtn'); await p.waitForFunction(()=>window.__b64,null,{timeout:20000});
  fs.writeFileSync(SP+'/elapp.webm',Buffer.from((await p.evaluate(()=>window.__b64)).split(',')[1],'base64'));
  // editing a line drops its voice
  const ta=p.locator('#sceneList textarea').nth(1); await ta.fill('ใครควรได้เงินมากกว่ากันแน่?'); await ta.blur(); await p.waitForTimeout(800);
  const edited=await p.evaluate(()=>({voice:!!voiceBuf,align:project.scenes.map(s=>!!s.align),info:$("elInfo").textContent}));
  console.log(JSON.stringify({errs,calls:[c1,c2,c3],sentKey,before,a,reload,edited},null,1)); await b.close(); })();
