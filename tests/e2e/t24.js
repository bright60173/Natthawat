const { chromium } = require('playwright'); const fs=require('fs');
(async()=>{ const SP=process.argv[2], AS=process.argv[3]||"9:16"; const b=await chromium.launch({args:['--enable-unsafe-swiftshader','--use-angle=swiftshader']}); const p=await b.newPage({viewport:{width:1300,height:950}}); const errs=[]; p.on('pageerror',e=>errs.push(e.message)); p.on('console',m=>{if(m.type()==='error')errs.push('console:'+m.text())});
  await p.route('**/three.js/r128/three.min.js',r=>r.fulfill({contentType:'application/javascript',body:fs.readFileSync(SP+'/three/package/build/three.min.js','utf8')}));
  await p.addInitScript(()=>{ window.claude={use:async n=>n==='downloads'?{save:async o=>{ window.__name=o.filename; const fr=new FileReader(); fr.onload=()=>window.__b64=fr.result; fr.readAsDataURL(o.data); }}:null}; });
  await p.goto('file://'+SP+'/wrapped.html'); await p.waitForTimeout(1500);
  await p.evaluate((AS)=>loadProject({title:"ทดสอบ ''' Blender\\",aspect:AS,music:"upbeat",subStyle:"pop",scenes:[
    {bg:"city",time:"night",camera:"pan-right",caption:"เมืองยามค่ำ",narration:"เมืองตอนกลางคืน สวยมาก",emph:["สวยมาก"],duration:3,transition:"cut",elements:[{type:"character",look:"girl",emotion:"excited",x:0.4,y:0.82,motion:"talk",say:"ว้าว!"},{type:"emoji",emoji:"🌙",x:0.7,y:0.2}]},
    {bg:"ocean",time:"sunset",camera:"zoom-in",caption:"ทะเลยามเย็น",narration:"คลื่นซัดเบาๆ",duration:3,transition:"whip",elements:[{type:"character",look:"cat",emotion:"happy",x:0.5,y:0.82,motion:"jump"},{type:"text",text:"สวยจัง",x:0.5,y:0.3}]},
    {bg:"space",time:"night",camera:"orbit",caption:"อวกาศ",narration:"ไปอวกาศกัน",duration:2.5,elements:[{type:"prop",name:"rocket",x:0.5,y:0.6,motion:"rise"}]},
    {bg:"forest",time:"day",camera:"drone",caption:"ป่า",narration:"เดินในป่า",duration:2,elements:[{type:"character",look:"boy",x:0.5,y:0.85,motion:"walk"}]}]}),AS);
  await p.click('#tabStudio'); await p.click('#blenderBtn');
  await p.waitForFunction(()=>window.__b64,null,{timeout:120000});
  const r=await p.evaluate(()=>({name:window.__name,b64:window.__b64.split(',')[1],btn:$("blenderBtn").textContent,dis:$("blenderBtn").disabled}));
  fs.writeFileSync(SP+'/blender_out.zip',Buffer.from(r.b64,'base64'));
  console.log(JSON.stringify({errs,name:r.name,btn:r.btn,dis:r.dis,size:r.b64.length}));
  await b.close(); })();
