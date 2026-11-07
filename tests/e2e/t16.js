const { chromium } = require('playwright');
const SP=process.argv[2];
// Shared in-memory "cloud" so two browser contexts can sync; canvas text interception to see exactly what gets drawn.
const INIT=(seed)=>`(()=>{
  window.__drawn=[]; const rec=(t)=>{ if(window.__rec) window.__drawn.push(String(t)); };
  const F=CanvasRenderingContext2D.prototype.fillText, S=CanvasRenderingContext2D.prototype.strokeText;
  CanvasRenderingContext2D.prototype.fillText=function(t,...a){ if(this.canvas&&this.canvas.id==="video") rec(t); return F.call(this,t,...a); };
  CanvasRenderingContext2D.prototype.strokeText=function(t,...a){ if(this.canvas&&this.canvas.id==="video") rec(t); return S.call(this,t,...a); };
  const DATA=${JSON.stringify(seed||{})}; window.__db=DATA; const L=[]; const notify=()=>setTimeout(()=>L.forEach(f=>f()),5);
  const mkDoc=path=>({path,async set(d){ DATA[path]=JSON.parse(JSON.stringify(d)); notify(); },async delete(){ delete DATA[path]; notify(); },collection:sub=>mkCol(path+'/'+sub),
    onSnapshot(next){ const f=()=>next({id:path.split('/').pop(),exists:path in DATA,data:()=>DATA[path],metadata:{fromCache:false}}); L.push(f); f(); return ()=>{}; }});
  const mkCol=path=>({doc:id=>mkDoc(path+'/'+id),onSnapshot(next){ const f=()=>{ const ids=Object.keys(DATA).filter(k=>k.startsWith(path+'/')&&k.split('/').length===path.split('/').length+1); next({docs:ids.map(k=>({id:k.split('/').pop(),exists:true,data:()=>DATA[k]})),metadata:{fromCache:false},docChanges:()=>[]}); }; L.push(f); f(); return ()=>{}; }});
  const STAR={title:"**ถ้าโลกร้อนขึ้น 2 องศา**",aspect:"9:16",scenes:[
    {bg:"sky",caption:"*ร้อนจัด*",narration:"โลกร้อนขึ้น *2 องศา* แล้วนะ",duration:3,elements:[{type:"character",look:"boy",x:0.5,y:0.8,say:"*ร้อน*!"},{type:"text",text:"**2°C**",x:0.5,y:0.42}]},
    {bg:"city",caption:"**น้ำท่วม**",narration:"**น้ำแข็ง** ละลาย *เร็วมาก",duration:3,elements:[{type:"prop",name:"ice",x:0.5,y:0.5},{type:"prop",name:"drop",x:0.3,y:0.4}]},
    {bg:"ocean",caption:"ทางออก",narration:"เราช่วยได้ด้วยการ *ประหยัดไฟ*",duration:3,elements:[{type:"prop",name:"lightbulb",x:0.5,y:0.45},{type:"character",look:"girl",x:0.3,y:0.8}]}]};
  window.claude={use:async n=>{
    if(n==='db') return {doc:mkDoc,collection:mkCol}; if(n==='user') return {id:async()=>'u1'}; if(n==='downloads') return {save:async o=>{ window.__saved=o.filename; }}; if(n!=='sample') return null;
    return async (input,opts)=>{ const sys=input[0].content, last=input[input.length-1].content; let t;
      if(sys.includes('คุณคือ "น้องโฟลว์"')) t='\`\`\`json\\n{"topic":"**โลกร้อน 2 องศา**","why":"*สำคัญ*","brief":"**วัยรุ่น** โทนจริงจัง","music":"tense","notes":{"creative":"*เน้นตัวเลข*"}}\\n\`\`\`';
      else if(sys.includes('คุณคือ "น้องเช็ค"')) t='\`\`\`json\\n{"pass":true,"score":8,"summary":"**ดี**","notes":["*hook ดี*"],"issues":[],"title":"**โลกร้อน 2 องศา จะเป็นยังไง?**","edits":[{"scene":3,"caption":"*ช่วยกัน*","narration":"เราช่วยได้ด้วยการ *ปิดไฟ* ที่ไม่ใช้"}]}\\n\`\`\`';
      else if(sys.includes('คุณคือ "พี่มาย"')) t='\`\`\`json\\n{"approved":true,"note":"*ดีมาก*","post":"**โลกร้อน** แล้วเราทำอะไรได้? #โลกร้อน"}\\n\`\`\`';
      else if(sys.includes('คุณคือ "น้องพิกเซล"')||sys.includes('คุณคือ "น้องคัท"')) t='\`\`\`json\\n'+JSON.stringify(STAR)+'\\n\`\`\`';
      else if(sys.includes('คุณคือ "น้องเสียง"')) t='\`\`\`json\\n{"lines":[{"scene":1,"text":"โลกเราร้อนขึ้น *2 องศา* แล้วนะ!","emotion":"*จริงจัง*"},{"scene":2,"text":"น้ำแข็งขั้วโลก **ละลาย** เร็วมาก"}]}\\n\`\`\`';
      else t='บท *ทดสอบ*';
      opts.onText&&opts.onText({text:t,delta:t}); return {text:t,truncated:false}; };
  }};
})();`;
const results=[]; const ok=(name,cond,detail)=>{ results.push({name,pass:!!cond,detail:cond?undefined:detail}); };
(async()=>{
  const b=await chromium.launch(); const errs=[];
  const ctxA=await b.newContext({viewport:{width:1300,height:950}}); const p=await ctxA.newPage();
  p.on('pageerror',e=>errs.push('A:'+e.message));
  await p.addInitScript(INIT(null));
  await p.goto('file://'+SP+'/wrapped.html'); await p.waitForTimeout(1200);
  const starsInUI=()=>p.evaluate(()=>{ const bad=[]; const txt=document.body.innerText;
    // visible text outside chat history (chat shows raw AI replies by design)
    for(const sel of ['#paneStudio','#paneLib','.mission','#team','#toasts','#reviewCard']) { const el=document.querySelector(sel); if(el&&/\*/.test(el.innerText)) bad.push(sel+':'+(el.innerText.match(/.{0,25}\*.{0,25}/)||[''])[0]); }
    [...document.querySelectorAll('#sceneList textarea,#sceneList input')].forEach((el,i)=>{ if(/\*/.test(el.value)) bad.push('field'+i+':'+el.value); });
    return bad; });
  const projStars=()=>p.evaluate(()=>JSON.stringify(project).match(/[^"]{0,20}\*[^"]{0,20}/g)||[]);
  const drawnFor=async(fn)=>{ await p.evaluate(()=>{ window.__drawn=[]; window.__rec=true; }); await fn(); const d=await p.evaluate(()=>{ window.__rec=false; return window.__drawn; }); return d; };

  // ---- C. full team run where every AI output contains asterisks
  await p.click('#makeBtn');
  await p.waitForFunction(()=>Object.values(recs)[0]?.finishedAt,null,{timeout:30000}); await p.waitForTimeout(1500);
  ok('C1 project data has no asterisks', (await projStars()).length===0, await projStars());
  ok('C2 visible UI has no asterisks after team run', (await starsInUI()).length===0, await starsInUI());
  const rr=await p.evaluate(()=>{ const r=Object.values(recs)[0]; return {title:r.title,topic:r.topic,post:r.out.approve.post,qa:r.out.qa.summary,emph:project.scenes.map(s=>s.emph),narr:project.scenes.map(s=>s.narration)}; });
  ok('C3 record title/topic/post/qa clean', !/\*/.test(JSON.stringify([rr.title,rr.topic,rr.post,rr.qa])), rr);
  ok('C4 emphasis kept as data', rr.emph[0].includes('2 องศา')&&rr.emph[2].includes('ปิดไฟ'), rr.emph);
  ok('C5 voice + QA edits applied', rr.narr[0]==='โลกเราร้อนขึ้น 2 องศา แล้วนะ!'&&rr.narr[2].startsWith('เราช่วยได้ด้วยการ ปิดไฟ'), rr.narr);
  await p.click('#tabOffice'); for(const st of ['plan','creative','animator','editor','voice','qa','approve']){ await p.click(`#steps li[data-s=${st}]`); await p.waitForTimeout(120); }
  ok('C6 step output panels clean', !(await p.evaluate(()=>/\*/.test(document.getElementById('outBody').innerText))), 'approve panel');
  // every frame of the clip
  let drawn=await drawnFor(async()=>{ await p.evaluate(()=>{ for(let t=0;t<R.total;t+=0.1) R.drawFrame(t); }); });
  ok('C7 no asterisk drawn in any frame', drawn.length>50&&!drawn.some(x=>x.includes('*')), drawn.filter(x=>x.includes('*')).slice(0,5));
  ok('C8 emphasised words still highlighted', await p.evaluate(()=>R.subs[0].words.some(w=>w.emph)), '');

  // ---- B. editing like a person
  await p.click('#tabStudio'); await p.waitForTimeout(200);
  const scene=i=>p.locator('#sceneList .scene').nth(i);
  // B1 type into narration without leaving the field
  await scene(1).locator('textarea').click(); await p.keyboard.press('Control+A'); await p.keyboard.type('ข้อความใหม่ทดสอบการแก้ไข');
  await p.waitForTimeout(450);
  let st=await p.evaluate(()=>({sub:R.subs[1].words.map(w=>w.text).join(''),proj:project.scenes[1].narration,t:playT,start:R.starts[1],end:R.starts[2]}));
  ok('B1 subtitle updates while typing (no blur)', st.sub==='ข้อความใหม่ทดสอบการแก้ไข'&&st.proj===st.sub, st);
  ok('B2 preview jumps to the edited scene', st.t>=st.start&&st.t<st.end, st);
  drawn=await drawnFor(async()=>{ await p.evaluate(()=>drawAt(playT)); });
  ok('B3 preview frame shows new text', drawn.join('|').includes('ข้อความ')||drawn.join('|').includes('ใหม่'), drawn);
  // B4 shorten narration -> duration shrinks
  const d0=await p.evaluate(()=>project.scenes[1].duration);
  await scene(1).locator('textarea').fill('สั้น'); await scene(1).locator('textarea').blur(); await p.waitForTimeout(300);
  const d1=await p.evaluate(()=>project.scenes[1].duration);
  ok('B4 shorter narration shortens scene', d1<d0&&d1>=2.2, {d0,d1});
  // B5 user types asterisks -> converted to emphasis, field cleaned on blur
  await scene(1).locator('textarea').fill('ทดลอง *คำเน้นใหม่* ดู'); await scene(1).locator('textarea').blur(); await p.waitForTimeout(300);
  st=await p.evaluate(()=>({v:document.querySelectorAll('#sceneList .scene')[1].querySelector('textarea').value,e:document.querySelectorAll('#sceneList .scene')[1].querySelector('[data-k=emph]').value,emph:project.scenes[1].emph}));
  ok('B5 typed asterisks become emphasis, field clean', st.v==='ทดลอง คำเน้นใหม่ ดู'&&st.emph.includes('คำเน้นใหม่')&&st.e.includes('คำเน้นใหม่'), st);
  // B6 edit emphasis field: clear it
  await scene(1).locator('[data-k=emph]').fill(''); await scene(1).locator('[data-k=emph]').press('Enter'); await p.waitForTimeout(300);
  ok('B6 clearing emphasis field removes emphasis', await p.evaluate(()=>project.scenes[1].emph.length===0&&!R.subs[1].words.some(w=>w.emph)), '');
  // B7 caption via Enter
  await scene(0).locator('[data-k=caption]').fill('หัวข้อแก้แล้ว'); await scene(0).locator('[data-k=caption]').press('Enter'); await p.waitForTimeout(300);
  drawn=await drawnFor(async()=>{ await p.evaluate(()=>drawAt(R.starts[0]+1)); });
  ok('B7 caption change drawn', drawn.some(x=>x.includes('หัวข้อแก้แล้ว')), drawn.slice(0,8));
  // B8 emphasis toggle off
  await p.click('#subStyles .chip:has-text("เน้นคำสำคัญ")'); await p.waitForTimeout(200);
  ok('B8 emphasis toggle off', await p.evaluate(()=>project.emphOn===false&&R.subs.every(S=>!S.words.some(w=>w.emph))&&R.emphTimes().length===0), '');
  await p.click('#subStyles .chip:has-text("เน้นคำสำคัญ")'); await p.waitForTimeout(200);
  ok('B9 emphasis toggle back on', await p.evaluate(()=>project.emphOn!==false&&R.subs[0].words.some(w=>w.emph)), '');
  // B10 edit while playing
  await p.click('#restartBtn'); await p.click('#playBtn'); await p.waitForTimeout(300);
  await scene(2).locator('textarea').fill('แก้ระหว่างเล่น'); await scene(2).locator('textarea').blur();
  drawn=await drawnFor(async()=>{ await p.waitForFunction(()=>playT>R.starts[2]+1.0,null,{timeout:20000}); });
  await p.click('#playBtn');
  ok('B10 edit during playback shows when that scene plays', drawn.join('').includes('แก้ระหว่างเล่น')||drawn.join('').includes('ระหว่าง'), drawn.slice(-10));
  // B11 persisted: wait for debounce, reload
  await p.waitForTimeout(1500);
  const snapBefore=await p.evaluate(()=>project.scenes.map(s=>[s.caption,s.narration,(s.emph||[]).join(',')]));
  await p.reload(); await p.waitForTimeout(1500);
  const snapAfter=await p.evaluate(()=>project.scenes.map(s=>[s.caption,s.narration,(s.emph||[]).join(',')]));
  ok('B11 edits survive reload', JSON.stringify(snapBefore)===JSON.stringify(snapAfter), {snapBefore,snapAfter});
  // B12 reopen from library
  await p.click('#tabLib'); await p.click('.rec .tools button:has-text("เปิด")'); await p.waitForTimeout(400);
  ok('B12 edits survive reopening from library', JSON.stringify(await p.evaluate(()=>project.scenes.map(s=>[s.caption,s.narration,(s.emph||[]).join(',')])))===JSON.stringify(snapBefore), '');
  // B13 demo edit becomes a saved clip
  const nBefore=await p.evaluate(()=>Object.keys(recs).length);
  await p.click('#tabLib'); await p.click('#demoBtn'); await p.waitForTimeout(300);
  ok('B13a demo fields have no asterisks', await p.evaluate(()=>![...document.querySelectorAll('#sceneList textarea,#sceneList input')].some(el=>/\*/.test(el.value))), '');
  await scene(0).locator('textarea').fill('เดโมที่ฉันแก้'); await scene(0).locator('textarea').blur(); await p.waitForTimeout(1200);
  ok('B13b editing demo saves a new clip', await p.evaluate(n=>Object.keys(recs).length===n+1&&!!openRecId,nBefore), '');
  await p.reload(); await p.waitForTimeout(1500);
  ok('B13c demo edit survives reload', await p.evaluate(()=>project.scenes[0].narration==='เดโมที่ฉันแก้'), await p.evaluate(()=>project.scenes[0].narration));
  // B14 export contains the edit and no asterisks
  await p.evaluate(()=>{ const r=Object.values(recs).find(x=>x.out?.approve); openRec(r.id); project.scenes=project.scenes.slice(0,2); relayout(); });
  await p.click('#tabStudio');
  await scene(0).locator('textarea').fill('ข้อความในวิดีโอที่ส่งออก'); await scene(0).locator('textarea').blur(); await p.waitForTimeout(300);
  drawn=await drawnFor(async()=>{ await p.click('#exportBtn'); await p.waitForSelector('#saveVideoBtn:not([hidden])',{timeout:60000}); });
  ok('B14 exported video frames show the edit', drawn.join('').includes('ข้อความ')&&drawn.includes('ส่ง')&&drawn.includes('ออก')&&(await p.evaluate(()=>R.subs[0].chunks.some(c=>c.words.map(w=>w.text).join('').includes('ส่งออก')))), {uniq:[...new Set(drawn)].slice(0,40), subs:await p.evaluate(()=>R.subs[0].chunks.map(c=>c.words.map(w=>w.text).join('')))});
  ok('B15 exported video has no asterisks', !drawn.some(x=>x.includes('*')), drawn.filter(x=>x.includes('*')));
  // ---- D. second device sees edits, clean
  await p.waitForTimeout(1500);
  const dbData=await p.evaluate(()=>window.__db);
  const q=await (await b.newContext({viewport:{width:390,height:844}})).newPage(); q.on('pageerror',e=>errs.push('B:'+e.message));
  await q.addInitScript(INIT(dbData)); await q.goto('file://'+SP+'/wrapped.html'); await q.waitForTimeout(1500);
  const other=await q.evaluate(()=>{ const r=Object.values(recs).find(x=>x.out?.approve); const p=normalizeProject(r.project); return {n0:p.scenes[0].narration,stars:/\*/.test(JSON.stringify(p))}; });
  ok('D1 second device gets the edit', other.n0==='ข้อความในวิดีโอที่ส่งออก', other);
  ok('D2 second device data clean', !other.stars, other);
  // F. subtitle chunk quality over many Thai sentences
  const frag=await p.evaluate(()=>{ const S=["ข้อความในวิดีโอที่ส่งออก","ถ้าวันหนึ่งโลกหยุดหมุนแค่หนึ่งวินาที จะเกิดอะไรขึ้น?","น้ำทะเลก็ไม่หยุดตาม กลายเป็นคลื่นยักษ์ถล่มทุกชายฝั่ง","เพราะโลกหนักมาก ไม่มีแรงไหนหยุดมันได้ในพริบตา สบายใจได้!","แมวกินปลา","ทุกอย่างบนพื้นโลกยังพุ่งไปข้างหน้า ด้วยความเร็ว 1,670 กิโลเมตรต่อชั่วโมง","ไปโรงเรียนกัน","คนไทยกินข้าววันละสามมื้อ แต่ถ้าจำศีลได้จะประหยัดไปครึ่งปี","AI ทำงานแทนเราได้ไหม","ตกใจหนีไม่ทัน"];
    const bad=[]; S.forEach(t=>{ const pj=normalizeProject({scenes:[{narration:t,emph:[t.split(" ")[0].slice(0,4)],elements:[]}]}); const rr=new Renderer(document.createElement("canvas")); rr.load(pj); const ch=rr.subs[0].chunks.map(c=>c.words.map(w=>w.text).join("")); if(ch.join("")!==t.replace(/\s+/g,"")) bad.push({t,ch,why:"text lost"}); if(ch.length>1&&ch.some(c=>c.replace(/[\u0E31\u0E34-\u0E3A\u0E47-\u0E4E]/g,"").length<5)) bad.push({t,ch,why:"tiny fragment"}); }); return bad; });
  ok('F1 no tiny subtitle fragments, no lost text', frag.length===0, frag);
  ok('E no page errors', errs.length===0, errs);
  const failed=results.filter(r=>!r.pass);
  console.log(results.map(r=>(r.pass?'PASS ':'FAIL ')+r.name+(r.pass?'':'  '+JSON.stringify(r.detail).slice(0,400))).join('\n'));
  console.log(`\n${results.length-failed.length}/${results.length} passed`);
  await b.close();
})();
