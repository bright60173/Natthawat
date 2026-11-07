// Safari regression test: emulate WebKit ignoring textAlign for Thai, delay web fonts, then check real pixels.
const { chromium } = require('playwright');
const SP=process.argv[2], MODE=process.argv[3]||"fixed";   // "fixed" = current page; "nofix" = page with our alignment patch disabled (proves the test catches the bug)
const results=[]; const ok=(n,c,d)=>results.push({n,pass:!!c,d:c?undefined:d});
(async()=>{
  const b=await chromium.launch(); const p=await b.newPage({viewport:{width:1300,height:950}}); const errs=[]; p.on('pageerror',e=>errs.push(e.message));
  await p.addInitScript((mode)=>{
    window.claude={use:async n=>null};
    const P=CanvasRenderingContext2D.prototype, F=P.fillText, S=P.strokeText, TH=/[฀-๿]/;
    // WebKit-like bug: centred/right alignment ignored for Thai strings (text starts at x)
    const bug=o=>function(t,x,y,m){ if(TH.test(String(t))&&this.textAlign!=="left"&&this.textAlign!=="start"){ const a=this.textAlign; this.textAlign="left"; try{ return m===undefined?o.call(this,t,x,y):o.call(this,t,x,y,m); } finally{ this.textAlign=a; } } return m===undefined?o.call(this,t,x,y):o.call(this,t,x,y,m); };
    P.fillText=bug(F); P.strokeText=bug(S);
    // record what reaches the canvas (after the page's own handling): text, left x, width, font
    const F2=P.fillText; window.__ops=[]; P.fillText=function(t,x,y,m){ if(window.__rec&&this.canvas&&this.canvas.id==="video"){ const tr=this.getTransform(); window.__ops.push({t:String(t),x,y,w:this.measureText(String(t)).width,a:this.textAlign,font:this.font,tx:tr.e,ty:tr.f,sx:tr.a,sy:tr.d,rot:tr.b,fs:String(this.fillStyle)}); } return F2.apply(this,arguments); };
    if(mode==="nofix") window.__nofix=true;
  }, MODE);
  // slow Google Fonts by 2.5 s so the first layout happens with a fallback font (like a slow iPad connection)
  await p.route(/fonts\.(googleapis|gstatic)\.com/, async r=>{ await new Promise(x=>setTimeout(x,2500)); r.continue(); });
  let html=require('fs').readFileSync(SP+'/wrapped.html','utf8');
  if(MODE==="nofix") html=html.replace("P.fillText=wrapDraw(F); P.strokeText=wrapDraw(S);","/*disabled*/");
  require('fs').writeFileSync(SP+'/t17page.html',html);
  await p.goto('file://'+SP+'/t17page.html'); await p.waitForTimeout(300);
  await p.click('#tabStudio');
  // clip like the user's: long-ish caption, long Thai narration with emphasis
  await p.evaluate(()=>loadProject({title:"โลกไม่สะเทือน",aspect:"9:16",subStyle:"pop",endCard:{text:"โลกไม่สะเทือนเลยสักนิด",sub:"คอมเมนต์ + ติดตาม"},scenes:[
    {bg:"space",caption:"เทียบกับโลก",narration:"แต่โลกหนักเป็นล้านล้านล้านเท่า คนไทยทั้งประเทศ",emph:["ล้านล้านล้านเท่า"],duration:5,elements:[{type:"prop",name:"earth",x:0.5,y:0.45,scale:2}]},
    {bg:"sky",caption:"โลกไม่สะเทือน",narration:"ต่อให้คนไทยทั้งประเทศกระโดดพร้อมกัน โลกก็ไม่สะเทือนเลยสักนิด",duration:5,elements:[{type:"character",look:"boy",x:0.5,y:0.8},{type:"prop",name:"sun",x:0.8,y:0.3}]}]}));
  await p.waitForTimeout(3500);   // fonts arrive late
  ok('fonts actually loaded (Thai subset)', await p.evaluate(()=>document.fonts.check("800 40px Kanit","กขค")), '');
  // pixel test: caption must be horizontally centred and inside the frame
  const capBox=async(t)=>p.evaluate((t)=>{ drawAt(t); const cv=document.getElementById('video'), c=cv.getContext('2d'), W=cv.width, H=cv.height; const y0=Math.round(H*0.06), y1=Math.round(H*0.2); const d=c.getImageData(0,y0,W,y1-y0).data;
      let minX=W,maxX=-1; for(let y=0;y<y1-y0;y++) for(let x=0;x<W;x++){ const i=(y*W+x)*4; const r=d[i],g=d[i+1],bb=d[i+2]; if((r>235&&g>235&&bb>235)||(r>240&&g>190&&bb<90)){ if(x<minX)minX=x; if(x>maxX)maxX=x; } }
      return {minX,maxX,W,left:minX,right:W-1-maxX}; },t);
  for(const [t,name] of [[1.5,'scene 1 caption'],[6.5,'scene 2 caption']]){ const bx=await capBox(t); ok(`${name} centred & inside frame`, bx.maxX>0&&bx.left>8&&bx.right>8&&Math.abs(bx.left-bx.right)<0.08*bx.W, bx); }
  // end card centred
  const end=await p.evaluate(()=>{ drawAt(R.endStart+1.5); const cv=document.getElementById('video'),c=cv.getContext('2d'),W=cv.width,H=cv.height; const y0=Math.round(H*0.36),y1=Math.round(H*0.5); const d=c.getImageData(0,y0,W,y1-y0).data; let minX=W,maxX=-1; for(let y=0;y<y1-y0;y++) for(let x=0;x<W;x++){ const i=(y*W+x)*4; if(d[i]>240&&d[i+1]>240&&d[i+2]>240){ if(x<minX)minX=x; if(x>maxX)maxX=x; } } return {left:minX,right:W-1-maxX,W}; });
  ok('end card centred & inside frame', end.left>8&&end.right>8&&Math.abs(end.left-end.right)<0.08*end.W, end);
  // word overlap test for every subtitle style over the whole clip
  for(const style of ["pop","karaoke","bounce","classic"]){
    const bad=await p.evaluate((style)=>{ project.subStyle=style; R.layout(); const issues=[]; const subW=new Set(R.subs.flatMap(S=>S.words.map(w=>w.text)));
      for(let t=0.2;t<R.endStart;t+=0.25){ window.__ops=[]; window.__rec=true; R.drawFrame(t); window.__rec=false;
        const ws=window.__ops.filter(o=>subW.has(o.t)&&o.a!=="center"&&!/^rgba\(10, 6, 20/.test(o.fs)); // skip drop-shadow passes // left-aligned word draws (fill pass of the subtitle)
        // group by line (same y & transform), sort by x, check overlap in screen space
        const lines={}; ws.forEach(o=>{ const k=[o.y.toFixed(0),o.ty.toFixed(0),o.tx.toFixed(0)].join("|"); (lines[k] ||= []).push(o); });
        Object.values(lines).forEach(L=>{ const seen=new Map(); L.forEach(o=>seen.set(o.x.toFixed(1)+o.t,o)); const arr=[...seen.values()].sort((a,b)=>a.x-b.x);
          for(let i=1;i<arr.length;i++){ const prev=arr[i-1], cur=arr[i]; if(cur.x<prev.x+prev.w-1&&cur.x>prev.x+1) issues.push({t:+t.toFixed(2),a:prev.t,b:cur.t,gap:+(cur.x-(prev.x+prev.w)).toFixed(1)}); } });
        const W=R.W; window.__ops.filter(o=>subW.has(o.t)).forEach(o=>{ const sx=o.tx+o.x*o.sx, ex=o.tx+(o.x+o.w)*o.sx; if(sx<-2||ex>W+2) issues.push({t:+t.toFixed(2),off:o.t,sx:+sx.toFixed(0),ex:+ex.toFixed(0)}); });
      }
      return issues.slice(0,6); },style);
    ok(`${style}: no overlapping words, nothing off-screen`, bad.length===0, bad);
  }
  // layout uses the real font: cached pop widths equal a fresh measurement
  const stale=await p.evaluate(()=>{ project.subStyle="pop"; R.layout(); const c=R.c; let worst=0; R.subs.forEach(S=>S.chunks.forEach(ch=>{ const L=R.popLayout(ch); L.lines.forEach(ln=>ln.items.forEach(it=>{ c.font=`800 ${it.f}px Kanit, sans-serif`; const w=c.measureText(it.w.text).width+(it.w.sp?it.f*0.28:0); worst=Math.max(worst,Math.abs(w-it.width)); })); })); return worst; });
  ok('subtitle layout measured with the loaded font', stale<0.5, stale);
  await p.evaluate(()=>drawAt(1.5)); await p.locator('#video').screenshot({path:SP+`/v8-${MODE}-a.png`});
  await p.evaluate(()=>drawAt(3.2)); await p.locator('#video').screenshot({path:SP+`/v8-${MODE}-b.png`});
  await p.evaluate(()=>drawAt(6.5)); await p.locator('#video').screenshot({path:SP+`/v8-${MODE}-c.png`});
  ok('no page errors', errs.length===0, errs);
  console.log(`[${MODE}]`); console.log(results.map(r=>(r.pass?'PASS ':'FAIL ')+r.n+(r.pass?'':'  '+JSON.stringify(r.d).slice(0,300))).join('\n')); console.log(`${results.filter(r=>r.pass).length}/${results.length} passed`);
  await b.close(); })();
