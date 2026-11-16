// Render the episode: every frame is drawn by episode.html and piped to ffmpeg together with the soundtrack.
// node render.js <music.wav> <out.mp4>
const { chromium } = require('playwright'); const path=require('path'); const { spawn }=require('child_process');
(async()=>{ const [AUDIO,OUT]=process.argv.slice(2); const b=await chromium.launch(); const p=await b.newPage({viewport:{width:720,height:1280}}); const errs=[]; p.on('pageerror',e=>errs.push(e.message));
  await p.goto('file://'+path.resolve(__dirname,'episode.html')); await p.evaluate(()=>window.ready); const {FPS,DUR}=await p.evaluate(()=>window.EP); const n=Math.round(FPS*DUR);
  const ff=spawn('ffmpeg',['-v','error','-y','-f','image2pipe','-vcodec','mjpeg','-framerate',String(FPS),'-i','-','-i',AUDIO,'-map','0:v','-map','1:a','-c:v','libx264','-preset','medium','-crf','19','-pix_fmt','yuv420p','-c:a','aac','-b:a','160k','-shortest','-movflags','+faststart',OUT],{stdio:['pipe','inherit','inherit']});
  for(let i=0;i<n;i+=12){ const batch=await p.evaluate(([a,z,fps])=>{ const out=[],cv=document.getElementById('cv'); for(let k=a;k<z;k++){ draw(k/fps); out.push(cv.toDataURL('image/jpeg',0.93).split(',')[1]); } return out; },[i,Math.min(n,i+12),FPS]);
    for(const d of batch){ if(!ff.stdin.write(Buffer.from(d,'base64'))) await new Promise(r=>ff.stdin.once('drain',r)); } if(i%120===0) console.log('frame',i,'/',n); }
  ff.stdin.end(); await new Promise(r=>ff.on('close',r)); console.log(JSON.stringify({errs,frames:n})); await b.close(); })();
