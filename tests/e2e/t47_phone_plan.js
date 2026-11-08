// Second viral study (storm-safety clip): phone-in-hand call screen, notice screen, blueprint house plan, note cards (recap stack).
const { chromium } = require('playwright'); const fs=require('fs');
(async()=>{ const SP=process.argv[2]; const b=await chromium.launch(); const p=await b.newPage(); const errs=[]; p.on('pageerror',e=>errs.push(e.message));
  await p.addInitScript(()=>{ window.claude={use:async n=>null}; }); await p.goto('file://'+SP+'/wrapped.html'); await p.waitForTimeout(1200);
  const proj={title:"t47",look:"doc",subStyle:"doc",scenes:[
    {bg:"nightroom",narration:"มีคนเจ็บฉุกเฉิน โทร 1669",subEn:"Someone hurt? Call 1669.",duration:3,elements:[{type:"card",kind:"phone",value:"1669",label:"การแพทย์ฉุกเฉิน",x:0.5,y:0.42}]},
    {bg:"nightroom",narration:"ฟังประกาศว่าปลอดภัยก่อนออก",duration:3,elements:[{type:"card",kind:"phone",tag:"ประกาศพื้นที่",label:"รอประกาศปลอดภัย",note:"ติดตามข่าวทางการ",x:0.5,y:0.42}]},
    {bg:"blueprint",narration:"เลือกห้องเล็กด้านใน ห่างจากหน้าต่าง",duration:3,elements:[{type:"card",kind:"plan",label:"ห้องเล็กด้านใน ชั้นล่าง",x:0.5,y:0.42},{type:"card",kind:"note",tag:"จุดหลบภัย · SHELTER",label:"ห้องเล็กด้านใน",labelEn:"AWAY FROM WINDOWS",good:true,x:0.4,y:0.13}]},
    {bg:"street",time:"night",effect:"rain",narration:"จำไว้สองเบอร์",duration:3,elements:[{type:"card",kind:"note",tag:"สายด่วน · EMERGENCY",value:"1669",label:"การแพทย์ฉุกเฉิน",labelEn:"EMERGENCY MEDICAL SERVICES",good:false,x:0.5,y:0.22},{type:"card",kind:"note",tag:"สายด่วน · DISASTER",value:"1784",label:"สาธารณภัย",labelEn:"DISASTER RESPONSE",x:0.5,y:0.38}]}]};
  const r=await p.evaluate(async(proj)=>{ const P=normalizeProject(proj); const fixes=directorPass(P); const rr=new Renderer(document.createElement('canvas')); rr.load(P); const shots=[];
    for(let i=0;i<P.scenes.length;i++){ rr.drawFrame(rr.starts[i]+2.2); shots.push(rr.cv.toDataURL('image/jpeg',0.85)); }
    return {shots,kinds:P.scenes.map(s=>s.elements.filter(e=>e.type==="card").map(e=>e.kind).join("+")),bg:P.scenes[2].bg}; },proj);
  r.shots.forEach((d,i)=>fs.writeFileSync(`${SP}/t47_${i+1}.jpg`,Buffer.from(d.split(',')[1],'base64')));
  const checks=[["phone/plan/note kinds kept",r.kinds.join()==="phone,phone,plan+note,note+note"],["blueprint background kept",r.bg==="blueprint"],["no page errors",errs.length===0]];
  checks.forEach(([n,ok])=>console.log((ok?"PASS ":"FAIL ")+n)); if(!checks.every(c=>c[1])) console.log(r.kinds); if(errs.length) console.log(errs); await b.close(); })();
