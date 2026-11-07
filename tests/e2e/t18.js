// iPad/iOS speech emulation: speech only unlocks inside a tap; speak() right after cancel() is dropped; voices load late.
const { chromium } = require('playwright');
const SP=process.argv[2], PAGE=process.argv[3]||'wrapped.html', NOTHAI=process.argv[4]==='nothai';
const results=[]; const ok=(n,c,d)=>results.push({n,pass:!!c,d:c?undefined:d});
(async()=>{
  const b=await chromium.launch({args:['--autoplay-policy=no-user-gesture-required']}); const p=await b.newPage({viewport:{width:1300,height:950}}); const errs=[]; p.on('pageerror',e=>errs.push(e.message));
  await p.addInitScript((nothai)=>{
    window.claude={use:async n=>null};
    let gesture=false; ['pointerdown','click','keydown','touchend'].forEach(ev=>{ addEventListener(ev,()=>{ gesture=true; },true); addEventListener(ev,()=>{ queueMicrotask(()=>gesture=false); },false); });
    const log=window.__tts=[]; let unlocked=false, lastCancel=-1e9, current=null, endTimer=0;
    const voices=nothai?[{name:"Samantha",lang:"en-US",localService:true}]:[{name:"Samantha",lang:"en-US",localService:true},{name:"Kanya",lang:"th-TH",localService:true},{name:"Narisa (Enhanced)",lang:"th-TH",localService:true}];
    let loaded=false; setTimeout(()=>{ loaded=true; ss.dispatchEvent(new Event('voiceschanged')); },600);
    const DUR=t=>Math.min(4000,t.length*90), NOEND=false; let loaded2=false; const VOICES=()=>loaded?voices:[];

    const ss=new EventTarget(); const Q=[]; let cur=null, curTimer=0;
    const startNext=()=>{ cur=Q.shift()||null; if(!cur){ ss.speaking=false; return; } ss.speaking=true; const u=cur; const dur=DUR(u.text); log.push({t:performance.now(),text:u.text,spoken:true,voice:u.voice&&u.voice.name,lang:u.lang,rate:u.rate});
      if(!NOEND) curTimer=setTimeout(()=>{ log.push({t:performance.now(),end:u.text}); u.onend&&u.onend(); startNext(); },dur); };
    Object.assign(ss,{speaking:false,pending:false,paused:false,getVoices:()=>VOICES(),
      speak(u){ const now=performance.now(); if(!unlocked&&!gesture){ log.push({t:now,text:u.text,dropped:'no-gesture'}); return; } if(now-lastCancel<50){ log.push({t:now,text:u.text,dropped:'after-cancel'}); return; }
        unlocked=true; Q.push(u); if(!cur) startNext(); },
      cancel(){ lastCancel=performance.now(); log.push({t:lastCancel,cancel:true}); Q.length=0; cur=null; clearTimeout(curTimer); ss.speaking=false; }, resume(){}, pause(){} });
    Object.defineProperty(window,'speechSynthesis',{value:ss,configurable:true});
    window.SpeechSynthesisUtterance=function(t){ this.text=t; this.lang=''; this.rate=1; this.pitch=1; this.volume=1; this.voice=null; };
  }, NOTHAI);
  await p.route(/fonts\.(googleapis|gstatic)\.com/,r=>r.abort());
  await p.goto('file://'+SP+'/'+PAGE); await p.waitForTimeout(1200);
  await p.click('#tabStudio'); await p.waitForTimeout(200);
  const scenes=await p.evaluate(()=>project.scenes.map(s=>s.narration));
  // 1) tap play and let the whole clip run
  await p.click('#playBtn'); await p.waitForTimeout(700);
  const toastNow=await p.evaluate(()=>[...document.querySelectorAll('.toast')].map(t=>t.textContent).join('|'));
  await p.waitForFunction(()=>!playing,null,{timeout:60000});
  const log=await p.evaluate(()=>window.__tts);
  const spoken=log.filter(x=>x.spoken).map(x=>x.text), dropped=log.filter(x=>x.dropped);
  ok('first sentence is spoken right after tapping play', spoken[0]===(await p.evaluate(()=>phrases(project.scenes[0].narration)[0])), {first:spoken[0],dropped:dropped.slice(0,3)});
  ok('every scene is spoken during playback (phrase by phrase)', await p.evaluate(sp=>project.scenes.every(s=>phrases(s.narration).every(ph=>sp.includes(ph))),spoken), {spoken:spoken.length,scenes:scenes.length,dropped:dropped.map(d=>d.dropped)});
  ok('no utterance dropped (gesture / cancel bug)', dropped.length===0, dropped.slice(0,4));
  if(!NOTHAI) ok('Thai voice chosen after voices load late', log.filter(x=>x.spoken).every(x=>/th/i.test(x.lang))&&log.filter(x=>x.spoken).some(x=>x.voice==="Narisa (Enhanced)"), log.filter(x=>x.spoken).map(x=>x.voice));
  if(NOTHAI){ ok('warns that the voice will have a foreign accent', toastNow.includes('สำเนียงต่างชาติ'), toastNow); const st=await p.evaluate(()=>$('voiceStatus').textContent); ok('editing room shows how to install a Thai voice', st.includes('เนื้อหาที่พูด')&&st.includes('Enhanced'), st); await p.click('#recModeBtn'); const rv=await p.evaluate(()=>$('recVoice').textContent); ok('recording screen shows the same warning', rv.includes('สำเนียงต่างชาติ'), rv); await p.click('#recClose'); }
  else { const st=await p.evaluate(()=>$('voiceStatus').textContent); ok('status names the Thai voice in use', st.includes('Narisa (Enhanced)'), st); }
  // 2) test button
  if(await p.$('#ttsTest')){ await p.evaluate(()=>window.__tts.length=0); await p.click('#ttsTest'); await p.waitForTimeout(300);
  ok('test button speaks', (await p.evaluate(()=>window.__tts.filter(x=>x.spoken).length))>=1, await p.evaluate(()=>window.__tts)); } else ok('test button exists',false,'missing');
  // 3) scrub to the middle, play: the scene in progress is not restarted mid-sentence, the next one is spoken
  await p.evaluate(()=>{ window.__tts.length=0; drawAt(R.starts[1]+1.5); });
  await p.click('#playBtn'); await p.waitForTimeout(300);
  await p.waitForFunction(()=>playT>R.starts[2]+0.3,null,{timeout:20000}); await p.click('#playBtn');
  const l3=await p.evaluate(()=>window.__tts);
  ok('resuming mid-clip speaks the next scene', l3.some(x=>x.spoken&&scenes[2].startsWith(x.text))&&!l3.some(x=>x.dropped), l3);
  // 4) uploaded voice file -> no synthetic speech
  await p.evaluate(async()=>{ const ac=AU.ensure(); voiceBuf=ac.createBuffer(1,ac.sampleRate,ac.sampleRate); window.__tts.length=0; drawAt(0); });
  await p.click('#playBtn'); await p.waitForTimeout(1500); await p.click('#playBtn');
  ok('no synthetic voice when a real voice file is used', (await p.evaluate(()=>window.__tts.filter(x=>x.spoken).length))===0, await p.evaluate(()=>window.__tts));
  ok('no page errors', errs.length===0, errs);
  console.log(`[${PAGE}${NOTHAI?' no-thai':''}]`); console.log(results.map(r=>(r.pass?'PASS ':'FAIL ')+r.n+(r.pass?'':'  '+JSON.stringify(r.d).slice(0,260))).join('\n')); console.log(`${results.filter(r=>r.pass).length}/${results.length} passed`);
  await b.close(); })();
