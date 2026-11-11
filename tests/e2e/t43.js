const { chromium } = require('playwright');
const SP=process.argv[2];
const MOCK=`(()=>{
  window.__calls=[]; let qaRound=0;
  const board={title:"ถ้ามนุษย์จำศีลได้",music:"funny",scenes:[
    {bg:"snow",camera:"static",transition:"cut",caption:"จำศีล 3 เดือน!",narration:"ถ้ามนุษย์ จำศีล ได้",emph:["จำศีล"],duration:3,elements:[{type:"character",look:"boy",emotion:"happy",x:0.5,y:0.8},{type:"character",look:"girl",emotion:"happy",x:0.55,y:0.8}]},
    {bg:"room",camera:"static",transition:"cut",caption:"ประหยัดค่าไฟ",narration:"เราจะประหยัดค่าอาหาร",emph:["ประหยัด"],duration:4,elements:[{type:"prop",name:"coin",x:0.5,y:0.5},{type:"character",look:"cat",x:0.4,y:0.8}]},
    {bg:"city",camera:"static",transition:"cut",caption:"เมืองทั้งเมืองจะเงียบสนิทไปเลยนะ",narration:"เมืองจะเงียบสนิท",emph:[],duration:4,elements:[{type:"prop",name:"building",x:0.5,y:0.6},{type:"character",look:"robot",x:0.3,y:0.8}]},
    {bg:"forest",camera:"static",transition:"cut",caption:"ฤดูใบไม้ผลิ",narration:"แล้วตื่นมาตอนใบไม้ผลิ",emph:["ใบไม้ผลิ"],duration:4,elements:[{type:"prop",name:"tree",x:0.5,y:0.6},{type:"character",look:"girl",x:0.6,y:0.8}]},
    {bg:"sky",camera:"static",transition:"cut",caption:"คุณจะจำศีลไหม?",narration:"คุณอยากจำศีลไหม",emph:["จำศีล"],duration:4,elements:[{type:"character",look:"boy",x:0.5,y:0.8},{type:"prop",name:"sun",x:0.7,y:0.3}]}]};
  window.claude={use:async n=>{ if(n==='downloads') return {save:async()=>{}}; if(n!=='sample') return null;
    const f=async (input,opts)=>{ window.__calls.push(input); if(opts&&opts.images) (window.__imgs=window.__imgs||[]).push({who:(input[0].content.match(/คุณคือ "([^"]+)"/)||[])[1],n:opts.images.length,type:opts.images[0]&&opts.images[0].type,size:opts.images[0]&&opts.images[0].size}); const sys=input[0].content, last=input[input.length-1].content; let t='ok';
      await new Promise(r=>setTimeout(r,60));
      const who=(sys.match(/คุณคือ "([^"]+)"/)||[])[1];
      if(who==='น้องโฟลว์') t='\`\`\`json\\n{"topic":"ถ้ามนุษย์จำศีลได้","why":"แปลก","brief":"วัยรุ่น 40 วิ","music":"funny","notes":{}}\\n\`\`\`';
      else if(who==='น้องฮุค'||who==='น้องสตอรี่') t=last.includes('ให้คะแนนตามเกณฑ์')?(who==='น้องฮุค'?'hook ยังอ่อน\\n\`\`\`json\\n{"score":6,"fixes":["ฉาก 1 hook ควรมีตัวเลข"]}\\n\`\`\`':'\`\`\`json\\n{"score":9,"fixes":[]}\\n\`\`\`'):'ไอเดีย';
      else if(who==='น้องครีม') t=last.includes('ทีมอ่านบทของเธอแล้ว')?'**ฉาก 1** บทแก้แล้ว':'**ฉาก 1** บทร่าง';
      else if(who==='น้องคัท'&&(last.includes('ส่งคลิปกลับมาให้แก้')||last.includes('ยังไม่อนุมัติ'))){ t='แก้แล้ว\\n\`\`\`json\\n{"scenes":[{"scene":2,"elements":[{"type":"prop","name":"coin","x":0.5,"y":0.5},{"type":"character","look":"cat","x":0.4,"y":0.8},{"type":"character","look":"girl","x":0.7,"y":0.8}]}]}\\n\`\`\`'; }
      else if(who==='น้องพิกเซล'||who==='น้องคัท'){ const b=JSON.parse(JSON.stringify(board)); t='\`\`\`json\\n'+JSON.stringify(b)+'\\n\`\`\`'; }
      else if(who==='น้องซับ') t='\`\`\`json\\n{"subStyle":"pop","scenes":[{"scene":3,"emph":["เงียบสนิท"],"caption":"เมืองเงียบกริบ","subPos":"top"}]}\\n\`\`\`';
      else if(who==='น้องจังหวะ') t='\`\`\`json\\n{"scenes":[{"scene":2,"transition":"whip"},{"scene":3,"transition":"glitch"}]}\\n\`\`\`';
      else if(who==='น้องเพลง') t='\`\`\`json\\n{"music":"upbeat","sfx":[{"scene":1,"sfx":"boom"}]}\\n\`\`\`';
      else if(who==='น้องเช็ค'){ qaRound++; t=qaRound===1?'\`\`\`json\\n{"pass":false,"score":6,"issues":[{"scene":2,"problem":"ภาพน้อย"}]}\\n\`\`\`':qaRound===2?'\`\`\`json\\n{"pass":true,"score":7,"issues":[{"scene":4,"problem":"ยังยืด"}]}\\n\`\`\`':'\`\`\`json\\n{"pass":true,"score":9,"issues":[]}\\n\`\`\`'; }
      else if(who==='พี่มาย'){ window.__mgr=(window.__mgr||0)+1; t=window.__mgr===1?'\`\`\`json\\n{"approved":false,"note":"ฉาก 3 รก ขอโล่งกว่านี้","post":"โพสต์ร่าง"}\\n\`\`\`':'\`\`\`json\\n{"approved":true,"note":"ผ่านแล้ว","post":"โพสต์จริง"}\\n\`\`\`'; }
      else if(who==='น้องเสียง') t='\`\`\`json\\n{"lines":[]}\\n\`\`\`';
      opts.onText&&opts.onText({text:t,delta:t}); return {text:t,truncated:false}; }; f.limits=async()=>({images:true}); return f; }};
})();`;
(async()=>{ const b=await chromium.launch(); const errs=[]; const p=await b.newPage({viewport:{width:1300,height:1000}});
  p.on('pageerror',e=>errs.push(e.message)); await p.addInitScript(MOCK);
  await p.goto('file://'+SP+'/wrapped.html'); await p.waitForTimeout(800);
  await p.click('#makeBtn'); await p.waitForFunction(()=>Object.values(recs)[0]?.finishedAt||Object.values(recs)[0]?.error,null,{timeout:60000}); await p.waitForTimeout(500);
  const r=await p.evaluate(()=>{ const r=Object.values(recs)[0], P=r.project, calls=window.__calls.map(c=>((c[0].content.match(/คุณคือ "([^"]+)"/)||[])[1]));
    const tiers=[]; return {error:r.error, tableread:r.out.tableread, revised:window.__calls.some(c=>c[c.length-1].content.includes('ทีมอ่านบทของเธอแล้ว')), creativeFinal:String(r.out.creative).slice(0,30),
      cap3:P.scenes[2].caption, emph3:P.scenes[2].emph, trans:P.scenes.map(x=>x.transition), cams:P.scenes.map(x=>x.camera), s1chars:P.scenes[0].elements.filter(e=>e.type==="character").map(e=>e.x), polish:r.out.polish,
      qaRounds:r.out.qa.rounds, qaScore:r.out.qa.score, music:P.music, s2els:P.scenes[1].elements.length, edLen:Math.max(...window.__calls.filter(c=>c[0].content.includes('คุณคือ "น้องคัท"')).map(c=>c[c.length-1].content.length)), sfx1:P.scenes[0].sfx, nCalls:calls.length, who:[...new Set(calls)].join(","), staffQuick:false, imgs:window.__imgs, mgrFix:window.__calls.some(c=>c[0].content.includes('คุณคือ "น้องคัท"')&&c[c.length-1].content.includes("ยังไม่อนุมัติ")), appr:r.out.approve }; });
  // step output UI for creative and editor
  await p.evaluate(()=>{ viewStep="creative"; userPicked=true; outKey=""; renderJob(); }); const ui1=await p.evaluate(()=>document.getElementById('outBody').innerText.slice(0,400));
  await p.evaluate(()=>{ viewStep="editor"; userPicked=true; outKey=""; renderJob(); }); const ui2=await p.evaluate(()=>document.getElementById('outBody').innerText.slice(0,500));
  const checks=[["finished without error",!r.error],["table read scored",r.tableread?.scores?.length===2],["low score triggered revision",r.revised&&r.tableread.revised&&r.creativeFinal.includes("แก้แล้ว")],
    ["captions cleared by the house style (viral layout)",r.cap3===""],["missing emphasis filled from subs plan",JSON.stringify(r.emph3)==='["เงียบสนิท"]'],
    ["transitions varied",new Set(r.trans.slice(1)).size>=2],["first camera not static",r.cams[0]!=="static"],["no repeated camera back to back",r.cams.every((c,i)=>i===0||c!==r.cams[i-1])],["has a wide 3D move",r.cams.some(c=>c==="drone"||c==="orbit")],
    ["overlapping characters spread",Math.abs(r.s1chars[0]-r.s1chars[1])>=0.2],["QA sent back twice",r.qaRounds===3&&r.qaScore===9],["edit list merged (scene 2 has 3 elements)",r.s2els===3],["editor prompt is compact",r.edLen<12000],["music staff applied",r.music==="upbeat"&&r.sfx1==="boom"],
    ["creative output shows table read",ui1.includes("อ่านบทร่วมกันในแผนก")],["editor output shows polish",ui2.includes("เกลางานรอบสุดท้าย")],["visual checker received real frames",(r.imgs||[]).filter(x=>x.who==="น้องตาไว").length>=2&&(r.imgs||[])[0]?.n>=5&&(r.imgs||[])[0]?.type==="image/jpeg"&&(r.imgs||[])[0]?.size>3000],["manager rejection sends the clip back to the editor",r.mgrFix],["approved after the fix",r.appr&&r.appr.approved===true&&r.appr.rounds===1&&r.appr.post==="โพสต์จริง"],["no page errors",errs.length===0]];
  checks.forEach(([n,ok])=>console.log((ok?"PASS ":"FAIL ")+n)); console.log(checks.filter(c=>c[1]).length+"/"+checks.length+" passed");
  console.log(JSON.stringify({r,errs},null,0).slice(0,1500)); await b.close(); })();
