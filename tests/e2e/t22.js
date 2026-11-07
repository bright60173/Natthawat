const { chromium } = require('playwright'); const fs=require('fs');
(async()=>{ const SP=process.argv[2]; const b=await chromium.launch({args:['--enable-unsafe-swiftshader','--use-angle=swiftshader','--autoplay-policy=no-user-gesture-required']}); const p=await b.newPage({viewport:{width:1300,height:950}}); const errs=[]; p.on('pageerror',e=>errs.push(e.message));
  await p.route('**/three.js/r128/three.min.js',r=>r.fulfill({contentType:'application/javascript',body:fs.readFileSync(SP+'/three/package/build/three.min.js','utf8')}));
  await p.addInitScript(()=>{ window.claude={use:async n=>n==='downloads'?{save:async o=>{ const fr=new FileReader(); fr.onload=()=>window.__b64=fr.result; fr.readAsDataURL(o.data); }}:null}; });
  await p.goto('file://'+SP+'/wrapped.html'); await p.waitForTimeout(1500);
  await p.evaluate(()=>loadProject({title:"ทดสอบ3D",aspect:"9:16",music:"upbeat",subStyle:"pop",scenes:[
    {bg:"city",time:"night",camera:"pan-right",caption:"เมืองยามค่ำ",narration:"เมืองตอนกลางคืน สวยมาก",emph:["สวยมาก"],duration:3,transition:"cut",elements:[{type:"character",look:"girl",emotion:"excited",x:0.4,y:0.82,motion:"talk"}]},
    {bg:"ocean",time:"sunset",camera:"zoom-in",caption:"ทะเลยามเย็น",narration:"คลื่นซัดเบาๆ",duration:3,transition:"whip",elements:[{type:"character",look:"cat",emotion:"happy",x:0.5,y:0.82,motion:"jump"}]}]}));
  await p.click('#tabStudio');
  const ok3=await p.evaluate(()=>({mode:$("bgMode").value,info:$("bgModeInfo").textContent}));
  await p.click('#exportBtn'); await p.waitForSelector('#saveVideoBtn:not([hidden])',{timeout:90000}); await p.click('#saveVideoBtn');
  await p.waitForFunction(()=>window.__b64,null,{timeout:10000}); const b64=await p.evaluate(()=>window.__b64.split(',')[1]); fs.writeFileSync(SP+'/out3d.mp4',Buffer.from(b64,'base64'));
  // toggle 2D works
  await p.selectOption('#bgMode','2d'); const twoD=await p.evaluate(()=>project.bg3d===false);
  console.log(JSON.stringify({errs,ok3,twoD})); await b.close(); })();
