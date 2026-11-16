// New viral-style elements: icon-array, bar and lesson cards, source lines, punch subtitles, place/clock chips.
const { chromium } = require('playwright'); const fs=require('fs');
(async()=>{ const SP=process.argv[2]; const b=await chromium.launch(); const p=await b.newPage(); const errs=[]; p.on('pageerror',e=>errs.push(e.message));
  await p.addInitScript(()=>{ window.claude={use:async n=>null}; }); await p.goto('file://'+SP+'/wrapped.html'); await p.waitForTimeout(1200);
  const proj={title:"t45",format:"story",subStyle:"doc",scenes:[
    {bg:"studio",narration:"ตอนคุณอยู่บางแสน",subEn:"while at Bang Saen",tag:"หาดบางแสน · ชลบุรี",clock:"10:39",duration:3,elements:[{type:"character",look:"boy",x:0.5,y:0.82},{type:"card",kind:"bars",label:"ความเร็ว",rows:[{label:"คุณวิ่ง",value:"~4 ม./วิ",pct:45},{label:"น้ำสึนามิ",value:"8 ม./วิ",pct:95,good:false}],src:"วัดจากสึนามิญี่ปุ่น 2554",x:0.5,y:0.2}]},
    {bg:"studio",narration:"บ้านไม้เสียหาย 8 ใน 10",subEn:"8 in 10 wood houses hit",punch:true,duration:3,elements:[{type:"card",kind:"icons",icon:"house",label:"สึนามิ 2547 · บ้านไม้",value:"8",total:10,unit:"เสียหาย",good:false,src:"ที่มา: Suppasri et al. 2011",x:0.5,y:0.3}]},
    {bg:"studio",narration:"จำไว้ข้อเดียว",duration:3,elements:[{type:"card",kind:"lesson",strike:"อย่าดูแค่ว่า ท่วมไหม",label:"ดูว่าน้ำจะไปไหน",labelEn:"Don't just ask if it floods. Ask where the water goes.",x:0.5,y:0.38}]}]};
  const r=await p.evaluate(async(proj)=>{ const P=normalizeProject(proj); const rr=new Renderer(document.createElement('canvas')); rr.load(P); const shots=[];
    for(let i=0;i<P.scenes.length;i++){ rr.drawFrame(rr.starts[i]+P.scenes[i].duration-0.1); shots.push(rr.cv.toDataURL('image/jpeg',0.85)); }
    const s=P.scenes; return {shots,kinds:s.map(x=>x.elements.find(e=>e.type==="card")?.kind),punch:s[1].punch,tag:s[0].tag,clock:s[0].clock,src:s[1].elements[0].src,rows:s[0].elements[1].rows.length,strike:s[2].elements[0].strike,
      prompt:typeof VIRAL_RULES==="string"&&STORY_FORMAT.includes("kind lesson")&&WHATIF_FORMAT.includes("punch")}; },proj);
  r.shots.forEach((d,i)=>fs.writeFileSync(`${SP}/t45_${i+1}.jpg`,Buffer.from(d.split(',')[1],'base64')));
  const checks=[["card kinds parsed",r.kinds.join()==="bars,icons,lesson"],["punch/tag/clock kept",r.punch===true&&!!r.tag&&r.clock==="10:39"],["source line kept",/Suppasri/.test(r.src)],["bar rows kept",r.rows===2],["lesson strike kept",!!r.strike],["viral rules in both formats",r.prompt],["no page errors",errs.length===0]];
  checks.forEach(([n,ok])=>console.log((ok?"PASS ":"FAIL ")+n)); if(errs.length) console.log(errs); await b.close(); })();
