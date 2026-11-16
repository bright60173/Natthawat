// Illustrated 2D sets (beach, estate, school, nightroom, aerial, street) in day and night with the "doc" look.
const { chromium } = require('playwright'); const fs=require('fs');
(async()=>{ const SP=process.argv[2]; const b=await chromium.launch(); const p=await b.newPage(); const errs=[]; p.on('pageerror',e=>errs.push(e.message));
  await p.addInitScript(()=>{ window.claude={use:async n=>null}; }); await p.goto('file://'+SP+'/wrapped.html'); await p.waitForTimeout(1200);
  const sets=["beach","estate","school","nightroom","aerial","street"];
  const r=await p.evaluate(async(sets)=>{ const out=[]; for(const time of ["day","night"]){ const proj={title:"t46",look:"doc",subStyle:"doc",scenes:sets.map(bg=>({bg,time,narration:"ทดสอบฉาก",duration:2,elements:bg==="aerial"?[]:[{type:"character",look:"boy",x:0.35,y:0.82},{type:"character",look:"girl",x:0.68,y:0.82,flip:true}]}))};
      const P=normalizeProject(proj); const rr=new Renderer(document.createElement('canvas')); rr.load(P); const t0=performance.now();
      for(let i=0;i<P.scenes.length;i++){ rr.drawFrame(rr.starts[i]+1.2); out.push({bg:P.scenes[i].bg,time,img:rr.cv.toDataURL('image/jpeg',0.8)}); } out.push({ms:(performance.now()-t0)/P.scenes.length}); }
    return out; },sets);
  const imgs=r.filter(x=>x.img); imgs.forEach((x,i)=>fs.writeFileSync(`${SP}/t46_${x.bg}_${x.time}.jpg`,Buffer.from(x.img.split(',')[1],'base64')));
  const ms=Math.max(...r.filter(x=>x.ms).map(x=>x.ms));
  const checks=[["all sets kept by normalizeProject",imgs.every(x=>sets.includes(x.bg))&&imgs.length===12],["frames distinct",new Set(imgs.map(x=>x.img.length)).size>=11],["draw time per frame "+ms.toFixed(0)+" ms",ms<120],["no page errors",errs.length===0]];
  checks.forEach(([n,ok])=>console.log((ok?"PASS ":"FAIL ")+n)); if(errs.length) console.log(errs); await b.close(); })();
