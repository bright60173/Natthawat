const { chromium } = require('playwright');
const SP=process.argv[2];
const MOCK=`(()=>{
  const DATA={}; window.__db=DATA; const L=[]; const notify=()=>setTimeout(()=>L.forEach(f=>f()),5);
  const mkDoc=path=>({path,async set(d){ DATA[path]=JSON.parse(JSON.stringify(d)); notify(); },async delete(){ delete DATA[path]; notify(); },collection:sub=>mkCol(path+'/'+sub),
    onSnapshot(next){ const f=()=>next({id:path.split('/').pop(),exists:path in DATA,data:()=>DATA[path],metadata:{fromCache:false}}); L.push(f); f(); return ()=>{}; }});
  const mkCol=path=>({doc:id=>mkDoc(path+'/'+id),onSnapshot(next){ const f=()=>{ const ids=Object.keys(DATA).filter(k=>k.startsWith(path+'/')&&k.split('/').length===path.split('/').length+1); next({docs:ids.map(k=>({id:k.split('/').pop(),exists:true,data:()=>DATA[k]})),metadata:{fromCache:false},docChanges:()=>[]}); }; L.push(f); f(); return ()=>{}; }});
  window.__calls=[]; window.__delay=250;
  const board={title:"ถ้ามนุษย์จำศีลได้",scenes:[{bg:"snow",caption:"จำศีล 3 เดือน!",narration:"ถ้ามนุษย์ *จำศีล* ได้",duration:3,elements:[{type:"character",look:"boy",emotion:"happy",x:0.5,y:0.8},{type:"prop",name:"moon",x:0.7,y:0.35}]},{bg:"room",caption:"ประหยัดค่าไฟ",narration:"เราจะ *ประหยัด* ค่าอาหาร",elements:[{type:"prop",name:"coin",x:0.5,y:0.5}]},{bg:"city",caption:"เมืองเงียบ",narration:"เมืองจะเงียบสนิท",elements:[{type:"prop",name:"building",x:0.3,y:0.6},{type:"prop",name:"moon",x:0.7,y:0.3}]}]};
  window.claude={use:async n=>{
    if(n==='db') return {doc:mkDoc,collection:mkCol}; if(n==='user') return {id:async()=>'u1'}; if(n==='downloads') return {save:async()=>{}}; if(n!=='sample') return null;
    return async (input,opts)=>{ window.__calls.push(input); const sys=input[0].content, last=input[input.length-1].content; let t;
      await new Promise(r=>setTimeout(r,window.__delay));
      if(sys.includes('คุณคือ "น้องโฟลว์"')) t='เลือกแล้ว\\n\`\`\`json\\n{"topic":"ถ้ามนุษย์จำศีลได้","why":"แปลกใหม่ คนอยากรู้","brief":"วัยรุ่น โทนตลก 40 วิ","music":"funny","notes":{"creative":"เน้นมุกค่าไฟ","editor":"ตัดเร็ว"}}\\n\`\`\`';
      else if(sys.includes('คุณคือ "น้องเช็ค"')) t=last.includes('รอบที่ 1')?'\`\`\`json\\n{"pass":false,"score":6,"summary":"ฉาก 2 ภาพน้อย","issues":[{"scene":2,"problem":"เพิ่มตัวละครในฉาก 2","owner":"editor"}],"edits":[{"scene":3,"narration":"เมืองจะ *เงียบสนิท*"}]}\\n\`\`\`':'\`\`\`json\\n{"pass":true,"score":9,"summary":"ดีขึ้นมาก","notes":["hook แรง"],"issues":[]}\\n\`\`\`';
      else if(sys.includes('คุณคือ "พี่มาย"')) t='\`\`\`json\\n{"approved":true,"note":"ปังแน่นอน","post":"ถ้าคนจำศีลได้จะเป็นยังไง? 🐻 #WhatIf #ความรู้รอบตัว"}\\n\`\`\`';
      else if(sys.includes('คุณคือ "น้องพิกเซล"')) t='\`\`\`json\\n'+JSON.stringify(board)+'\\n\`\`\`';
      else if(sys.includes('คุณคือ "น้องคัท"')){ const b=JSON.parse(JSON.stringify(board)); if(last.includes('ส่งคลิปกลับมาให้แก้')) b.scenes[1].elements.push({type:"character",look:"girl",emotion:"excited",x:0.3,y:0.8}); t='\`\`\`json\\n'+JSON.stringify(b)+'\\n\`\`\`'; }
      else if(sys.includes('คุณคือ "น้องเสียง"')) t='\`\`\`json\\n{"lines":[{"scene":1,"text":"ถ้ามนุษย์ *จำศีล* ได้ล่ะ?"}]}\\n\`\`\`';
      else t='**ฉาก 1** บท';
      opts.onText&&opts.onText({text:t,delta:t}); return {text:t,truncated:false}; };
  }};
})();`;
(async()=>{
  const b=await chromium.launch(); const errs=[];
  const p=await b.newPage({viewport:{width:1300,height:1000}});
  p.on('pageerror',e=>errs.push(e.message)); p.on('console',m=>{ if(m.type()==='error') errs.push('c:'+m.text()); });
  await p.addInitScript(MOCK);
  await p.goto('file://'+SP+'/wrapped.html'); await p.waitForTimeout(800);
  await p.screenshot({path:SP+'/v5-home.png'});
  // stop/resume test
  await p.click('#makeBtn'); await p.waitForTimeout(150); await p.click('#stopBtn');
  await p.waitForFunction(()=>!runningRec&&Object.values(recs)[0]?.error,null,{timeout:10000});
  const stopped=await p.evaluate(()=>({err:Object.values(recs)[0].error, out:Object.keys(Object.values(recs)[0].out), resume:!document.getElementById('resumeRow').hidden}));
  await p.click('#resumeBtn');
  await p.waitForTimeout(1700); await p.screenshot({path:SP+'/v5-running.png'});
  await p.waitForFunction(()=>Object.values(recs)[0]?.finishedAt,null,{timeout:30000}); await p.waitForTimeout(1200);
  const r=await p.evaluate(()=>{ const r=Object.values(recs)[0]; return {steps:r.steps,out:Object.keys(r.out),topic:r.topic,title:r.title,qa:r.out.qa,approve:r.out.approve,scene2els:r.project.scenes[1].elements.length,narr3:r.project.scenes[2].narration,log:r.log.map(l=>l.who+': '+l.text),creativeNote:window.__calls.find(c=>c[0].content.includes('คุณคือ "น้องครีม"'))[0].content.includes('เน้นมุกค่าไฟ'),reviewShown:!document.getElementById('reviewCard').hidden,calls:window.__calls.length}; });
  await p.click('#tabStudio'); await p.waitForTimeout(300); await p.locator('#reviewCard').screenshot({path:SP+'/v5-review.png'});
  // coordinator chat sees context
  await p.click('#tabChat'); await p.click('.member.lead'); await p.fill('#input','สรุปงานของทีมตอนนี้ให้หน่อย'); await p.press('#input','Enter'); await p.waitForTimeout(800);
  const ctx=await p.evaluate(()=>window.__calls[window.__calls.length-1][0].content.includes('[ข้อมูลล่าสุดของทีม]'));
  await p.screenshot({path:SP+'/v5-done.png'});
  await p.setViewportSize({width:390,height:844}); await p.waitForTimeout(300);
  const hs=await p.evaluate(()=>document.documentElement.scrollWidth>innerWidth);
  await p.screenshot({path:SP+'/v5-mobile.png',fullPage:true});
  console.log(JSON.stringify({errs,stopped,r,ctx,hs},null,1)); await b.close();
})();
