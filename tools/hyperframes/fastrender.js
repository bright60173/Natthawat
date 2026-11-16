// Render a project straight from the app's renderer: every frame drawn in Chromium, piped to ffmpeg with the finished audio mix.
const { chromium } = require('playwright'); const fs=require('fs'); const { spawn }=require('child_process');
(async()=>{ const [SP,PROJ,AUDIO,OUT]=process.argv.slice(2); const fps=30;
  const b=await chromium.launch(); const p=await b.newPage(); const errs=[]; p.on('pageerror',e=>errs.push(e.message));
  await p.addInitScript(()=>{ window.claude={use:async n=>null}; }); await p.goto('file://'+SP+'/wrapped.html'); await p.waitForTimeout(1500);
  const total=await p.evaluate(async proj=>{ await fontsReady?.(); const P=normalizeProject(proj); window.__rr=new Renderer(document.createElement('canvas')); __rr.load(P); return __rr.total; },JSON.parse(fs.readFileSync(PROJ,'utf8')));
  const n=Math.ceil(total*fps); console.log('total',total,'frames',n);
  const ff=spawn('ffmpeg',['-v','error','-y','-f','image2pipe','-vcodec','mjpeg','-framerate',String(fps),'-i','-','-i',AUDIO,'-map','0:v','-map','1:a','-c:v','libx264','-preset','medium','-crf','20','-pix_fmt','yuv420p','-c:a','aac','-b:a','160k','-shortest','-movflags','+faststart',OUT],{stdio:['pipe','inherit','inherit']});
  for(let i=0;i<n;i+=15){ const batch=await p.evaluate(([a,z,fps])=>{ const out=[]; for(let k=a;k<z;k++){ __rr.drawFrame(k/fps); out.push(__rr.cv.toDataURL('image/jpeg',0.92).split(',')[1]); } return out; },[i,Math.min(n,i+15),fps]);
    for(const d of batch){ if(!ff.stdin.write(Buffer.from(d,'base64'))) await new Promise(r=>ff.stdin.once('drain',r)); } if(i%300===0) console.log('frame',i); }
  ff.stdin.end(); await new Promise(r=>ff.on('close',r)); console.log(JSON.stringify({errs})); await b.close(); })();
