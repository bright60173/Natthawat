const { chromium } = require('playwright'); const fs=require('fs');
(async()=>{ const SP=process.argv[2]; const b=await chromium.launch({args:['--enable-unsafe-swiftshader','--use-angle=swiftshader']}); const p=await b.newPage(); const errs=[]; p.on('pageerror',e=>errs.push(e.message));
  await p.route('**/three.js/r128/three.min.js',r=>r.fulfill({contentType:'application/javascript',body:fs.readFileSync(SP+'/three/package/build/three.min.js','utf8')}));
  await p.addInitScript(()=>{ window.claude={use:async n=>null}; });
  await p.goto('file://'+SP+'/wrapped.html'); await p.waitForTimeout(2500);
  const proj=JSON.parse(fs.readFileSync(SP+'/real/project.json','utf8'));
  const r=await p.evaluate((proj)=>{ const P=normalizeProject(proj); const rr=new Renderer(document.createElement('canvas')); rr.load(P); const W=rr.W;
    // every text element must stay inside the frame
    const outs=[]; P.scenes.forEach((s,i)=>s.elements.forEach(el=>{ if(el.type!=="text") return; const q=rr.textRect(s,el); if(q.x0<-1||q.x1>W+1) outs.push(`ฉาก ${i+1}: ${el.text} (${q.x0.toFixed(0)}..${q.x1.toFixed(0)})`); }));
    const c=document.createElement('canvas'); c.width=180*6; c.height=320; const g=c.getContext('2d');
    [0,0.6,rr.starts[3]+2,rr.starts[4]+2,rr.starts[1]+3,rr.starts[9]+3].forEach((t,i)=>{ rr.drawFrame(t); g.drawImage(rr.cv,i*180,0,180,320); });
    rr.drawFrame(0); const d=rr.c.getImageData(0,0,W,rr.H).data; let white=0; for(let k=0;k<d.length;k+=4*97) if(d[k]>245&&d[k+1]>245&&d[k+2]>245) white++;
    return {img:c.toDataURL(),outs,whiteFrac:white/(d.length/(4*97)),qa:qaAuto(P)}; },proj);
  fs.writeFileSync(SP+'/v12-fix.png',Buffer.from(r.img.split(',')[1],'base64'));
  const checks=[["no text runs off screen",r.outs.length===0],["frame 0 is not a white flash",r.whiteFrac<0.3],["QA flags cluttered scenes",r.qa.some(x=>x.includes("รก")||x.includes("แน่น"))],["no page errors",errs.length===0]];
  checks.forEach(([n,ok])=>console.log((ok?"PASS ":"FAIL ")+n)); console.log(JSON.stringify({outs:r.outs,white:r.whiteFrac.toFixed(2),qa:r.qa})); await b.close(); })();
