const { chromium } = require('playwright');
const SP=process.argv[2], VARIANT=process.argv[3]||'normal';  // normal | slowvoice | noend
const results=[]; const ok=(n,c,d)=>results.push({n,pass:!!c,d:c?undefined:d});
(async()=>{
  const b=await chromium.launch({args:['--autoplay-policy=no-user-gesture-required']});
  const p=await b.newPage({viewport:{width:1024,height:1366}}); const errs=[]; p.on('pageerror',e=>errs.push(e.message));
  await p.addInitScript((variant)=>{
    window.claude={use:async n=>null};
    let gesture=false; ['pointerdown','click','keydown','touchend'].forEach(ev=>{ addEventListener(ev,()=>{ gesture=true; },true); addEventListener(ev,()=>{ queueMicrotask(()=>gesture=false); },false); });
    const log=window.__tts=[]; let unlocked=false, lastCancel=-1e9, endTimer=0;
    const voices=[{name:"Kanya",lang:"th-TH",localService:true}];
    const DUR=t=>variant==='slowvoice'?t.length*160:t.length*70, NOEND=variant==='noend'; const VOICES=()=>voices;

    const ss=new EventTarget(); const Q=[]; let cur=null, curTimer=0;
    const startNext=()=>{ cur=Q.shift()||null; if(!cur){ ss.speaking=false; return; } ss.speaking=true; const u=cur; const dur=DUR(u.text); log.push({t:performance.now(),text:u.text,spoken:true,voice:u.voice&&u.voice.name,lang:u.lang,rate:u.rate});
      if(!NOEND) curTimer=setTimeout(()=>{ log.push({t:performance.now(),end:u.text}); u.onend&&u.onend(); startNext(); },dur); };
    Object.assign(ss,{speaking:false,pending:false,paused:false,getVoices:()=>VOICES(),
      speak(u){ const now=performance.now(); if(!unlocked&&!gesture){ log.push({t:now,text:u.text,dropped:'no-gesture'}); return; } if(now-lastCancel<50){ log.push({t:now,text:u.text,dropped:'after-cancel'}); return; }
        unlocked=true; Q.push(u); if(!cur) startNext(); },
      cancel(){ lastCancel=performance.now(); log.push({t:lastCancel,cancel:true}); Q.length=0; cur=null; clearTimeout(curTimer); ss.speaking=false; }, resume(){}, pause(){} });
    Object.defineProperty(window,'speechSynthesis',{value:ss,configurable:true});
    window.SpeechSynthesisUtterance=function(t){ this.text=t; };
    // track scene starts as drawn in recording mode
    window.__sceneStarts=[];
  }, VARIANT);
  await p.route(/fonts\.(googleapis|gstatic)\.com/,r=>r.abort());
  await p.goto('file://'+SP+'/wrapped.html'); await p.waitForTimeout(1000);
  await p.evaluate(()=>{ const d=JSON.parse(JSON.stringify(DEMO)); d.scenes=d.scenes.slice(0,3); loadProject(d); }); // shorter clip for the test
  await p.click('#tabStudio'); await p.click('#recModeBtn'); await p.waitForTimeout(200);
  ok('overlay opens with instructions', await p.evaluate(()=>!$("recOv").hidden&&!$("recUi").hidden), '');
  await p.screenshot({path:SP+`/v9-rec-ui.png`});
  // watch the scene index over time
  await p.evaluate(()=>{ const orig=R.drawFrame.bind(R); let last=-1; R.drawFrame=function(t){ if(!$("recOv").hidden){ const i=t>=this.endStart?99:this.sceneAt(t); if(i!==last){ last=i; window.__sceneStarts.push({i,at:performance.now()}); } } return orig(t); }; });
  await p.click('#recGo'); await p.waitForTimeout(1500);
  await p.screenshot({path:SP+`/v9-rec-play.png`});
  ok('close button hidden while recording', await p.evaluate(()=>$('recX').hidden), '');
  const box=await p.evaluate(()=>{ const r=$("recCv").getBoundingClientRect(); return {w:r.width,h:r.height,l:r.left,t:r.top,vw:innerWidth,vh:innerHeight,ratio:r.width/r.height,canvas:$("recCv").width/$("recCv").height}; });
  ok('video fills the screen height with the right shape', Math.abs(box.ratio-box.canvas)<0.01&&box.h>=box.vh-2&&box.l>=0&&box.l+box.w<=box.vw+1, box);
  await p.waitForSelector('#recEnd:not([hidden])',{timeout:120000});
  const log=await p.evaluate(()=>window.__tts), starts=await p.evaluate(()=>window.__sceneStarts), scenes=await p.evaluate(()=>project.scenes.map(s=>s.narration));
  const spoken=log.filter(x=>x.spoken);
  const PH=await p.evaluate(()=>project.scenes.map(s=>phrases(s.narration)));
  ok('first sentence starts on the tap', spoken[0]&&spoken[0].text===PH[0][0], log.slice(0,3));
  ok('every scene is spoken phrase by phrase, nothing dropped', (VARIANT==='noend'?PH.every(ps=>spoken.some(x=>x.text===ps[0])):PH.every(ps=>ps.every(ph=>spoken.some(x=>x.text===ph))))&&!log.some(x=>x.dropped), log.filter(x=>x.dropped));
  if(VARIANT!=='noend'){ ok('long narration is split into several phrases (pauses)', PH.some(ps=>ps.length>1), PH); const ends=log.filter(x=>x.end); let wait=true; for(let k=1;k<scenes.length;k++){ const st=starts.find(x=>x.i===k), lastPh=PH[k-1][PH[k-1].length-1], en=ends.find(x=>x.end===lastPh); if(!st||!en||st.at<en.t) wait=false; }
    ok('each scene waits until the previous sentence has finished', wait, {starts,ends:ends.map(e=>({t:e.t,end:e.end.slice(0,12)}))}); }
  ok('end card plays and the finish message shows', starts.some(x=>x.i===99)&&await p.evaluate(()=>!$("recEnd").hidden), starts);
  ok('audio stopped at the end', await p.evaluate(()=>AU.master===null), '');
  await p.screenshot({path:SP+`/v9-rec-end.png`});
  ok('finish message does not cover the middle of the video', await p.evaluate(()=>{ const r=$('recEnd').getBoundingClientRect(); return r.top>innerHeight*0.7; }), await p.evaluate(()=>$('recEnd').getBoundingClientRect().top));
  await p.click('#recDone'); ok('closing returns to the editing room', await p.evaluate(()=>$("recOv").hidden), '');
  // layout on phone + landscape
  for(const [w,h] of [[390,844],[1366,1024]]){ await p.setViewportSize({width:w,height:h}); await p.click('#recModeBtn'); await p.waitForTimeout(150);
    const bx=await p.evaluate(()=>{ const r=$("recCv").getBoundingClientRect(), u=$("recUi").getBoundingClientRect(); return {cw:r.width,ch:r.height,vw:innerWidth,vh:innerHeight,ui:[u.left,u.top,u.right,u.bottom],ratio:r.width/r.height}; });
    ok(`overlay fits ${w}x${h}`, bx.cw<=bx.vw+1&&bx.ch<=bx.vh+1&&(bx.cw>=bx.vw-2||bx.ch>=bx.vh-2)&&Math.abs(bx.ratio-9/16)<0.01&&bx.ui[0]>=0&&bx.ui[2]<=bx.vw&&bx.ui[1]>=0&&bx.ui[3]<=bx.vh, bx);
    await p.click('#recClose'); }
  ok('no page errors', errs.length===0, errs);
  console.log(`[${VARIANT}]`); console.log(results.map(r=>(r.pass?'PASS ':'FAIL ')+r.n+(r.pass?'':'  '+JSON.stringify(r.d).slice(0,300))).join('\n')); console.log(`${results.filter(r=>r.pass).length}/${results.length} passed`);
  await b.close(); })();
