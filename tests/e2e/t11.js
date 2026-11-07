const { chromium } = require('playwright');
(async()=>{ const SP=process.argv[2]; const b=await chromium.launch(); const p=await b.newPage({viewport:{width:1300,height:950}}); const errs=[]; p.on('pageerror',e=>errs.push(e.message));
  await p.goto('file://'+SP+'/wrapped.html'); await p.waitForTimeout(1200); await p.click('#tabStudio');
  const proj={title:"stress",aspect:process.argv[3]||"9:16",music:"upbeat",subStyle:"pop",scenes:[
    {bg:"city",caption:"ถ้ามนุษย์บินได้ทุกคนพร้อมกันทั้งโลก",narration:"ถ้าวันหนึ่ง *มนุษย์ทุกคนบินได้* พร้อมกัน ท้องฟ้าจะ *แน่นยิ่งกว่ารถติด* ในกรุงเทพตอนเย็นวันศุกร์",duration:7,subPos:"top",
      elements:[{type:"character",look:"boy",emotion:"shocked",x:0.5,y:0.8,say:"บินได้แล้ว!"},{type:"text",text:"8,000,000,000 คน",x:0.5,y:0.3,enter:"none"}]},
    {bg:"sky",caption:"แน่นมาก",narration:"*นกทั้งโลก* ตกใจหนีไม่ทัน *เครื่องบิน* ต้องจอดหมด ตำรวจจราจรลอยฟ้าต้องทำงานหนักขึ้นสิบเท่า",duration:7,
      elements:[{type:"character",look:"girl",emotion:"excited",x:0.3,y:0.55,say:"วู้ฮู้!"},{type:"character",look:"robot",emotion:"angry",x:0.7,y:0.8,say:"หยุดเดี๋ยวนี้!"},{type:"emoji",char:"🐦",x:0.8,y:0.3}]},
  ]};
  await p.evaluate(pj=>loadProject(pj),proj);
  const shots=[];
  for(const st of ["pop","karaoke","bounce","classic"]){ await p.evaluate(st=>{ project.subStyle=st; },st);
    for(const t of [1.6,3.4,5.5,8.6,11.5]){ await p.evaluate(t=>drawAt(t),t); const f=`${SP}/x-${st}-${t}.png`; await p.locator('#video').screenshot({path:f}); shots.push(f); } }
  require('fs').writeFileSync(SP+'/shots.txt',shots.join('\n')); console.log(JSON.stringify(errs)); await b.close(); })();
