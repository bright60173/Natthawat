const { chromium } = require('playwright'); const fs=require('fs');
(async()=>{ const SP=process.argv[2]; const b=await chromium.launch({args:['--enable-unsafe-swiftshader','--use-angle=swiftshader']}); const p=await b.newPage({viewport:{width:1300,height:950}}); const errs=[]; p.on('pageerror',e=>errs.push(e.message)); p.on('console',m=>{ if(m.type()==='error') errs.push('c:'+m.text()); });
  await p.route('**/three.js/r128/three.min.js',r=>r.fulfill({contentType:'application/javascript',body:fs.readFileSync(SP+'/three/package/build/three.min.js','utf8')}));
  await p.addInitScript(()=>{ window.claude={use:async n=>null}; });
  await p.goto('file://'+SP+'/wrapped.html'); await p.waitForTimeout(1500);
  const info=await p.evaluate(()=>({three:typeof THREE!=="undefined"&&THREE.REVISION, ok:bg3dInit()}));
  p.on('console',m=>{ if(m.type()==='warning') errs.push('w:'+m.text()); });
  const imgs=[]; const t0=Date.now();
  for(const bg of CAT_BG=["sky","city","ocean","forest","desert","snow","space","room","classroom","lab","abstract"]){
    for(const time of (["space","abstract","lab"].includes(bg)?["day"]:["day","sunset","night"])){
      const d=await p.evaluate(([bg,time])=>{ const pj=normalizeProject({aspect:"9:16",scenes:[{bg,time,caption:"",narration:"ทดสอบฉาก",duration:4,camera:"static",elements:[{type:"character",look:"girl",emotion:"happy",x:0.35,y:0.82,scale:0.9,enter:"none"},{type:"character",look:"boy",emotion:"excited",x:0.68,y:0.84,scale:0.9,enter:"none",flip:true}]}]}); const rr=new Renderer(document.createElement('canvas')); rr.load(pj); rr.drawFrame(2); const c=document.createElement('canvas'); c.width=240; c.height=427; c.getContext('2d').drawImage(rr.cv,0,0,240,427); return c.toDataURL(); },[bg,time]);
      const f=`${SP}/bg3-${bg}-${time}.png`; fs.writeFileSync(f,Buffer.from(d.split(',')[1],'base64')); imgs.push(f); } }
  const ms=Date.now()-t0;
  // frame time for a 720x1280 3D frame
  const perf=await p.evaluate(()=>{ const pj=normalizeProject({aspect:"9:16",scenes:[{bg:"city",time:"night",narration:"x",duration:4,elements:[]}]}); const rr=new Renderer(document.createElement('canvas')); rr.load(pj); rr.drawFrame(0.1); const t=performance.now(); for(let i=0;i<10;i++) rr.drawFrame(0.1+i/30); return (performance.now()-t)/10; });
  fs.writeFileSync(SP+'/bg3list.txt',imgs.join('\n'));
  const failed=await p.evaluate(()=>[...BG3D.failed]); console.log(JSON.stringify({errs,failed,info,imgs:imgs.length,ms,perfMsPerFrame:perf.toFixed(1)})); await b.close(); })();
