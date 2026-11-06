const { chromium } = require('playwright'); const fs=require('fs');
(async()=>{ const SP=process.argv[2], projFile=process.argv[3], out=process.argv[4]; const b=await chromium.launch(); const p=await b.newPage(); const errs=[]; p.on('pageerror',e=>errs.push(e.message));
  await p.addInitScript(()=>{ window.claude={use:async n=>null}; });
  await p.goto('file://'+SP+'/wrapped.html'); await p.waitForTimeout(800);
  const proj=fs.readFileSync(projFile,'utf8');
  const r=await p.evaluate(async(proj)=>{ const P=normalizeProject(JSON.parse(proj)); const rr=new Renderer(document.createElement('canvas')); rr.load(P); const total=rr.total, sr=48000;
    const oc=new OfflineAudioContext(2,Math.ceil(total*sr),sr); const eng=new AudioEngine(); eng.ac=oc; eng.noise=eng.makeNoise(); oc.resume=()=>Promise.resolve();
    eng.start(P,0,{length:total}); const buf=await oc.startRendering();
    const n=buf.length, data=new DataView(new ArrayBuffer(44+n*4)); const w=(o,s)=>[...s].forEach((c,i)=>data.setUint8(o+i,c.charCodeAt(0)));
    w(0,"RIFF"); data.setUint32(4,36+n*4,true); w(8,"WAVE"); w(12,"fmt "); data.setUint32(16,16,true); data.setUint16(20,1,true); data.setUint16(22,2,true); data.setUint32(24,sr,true); data.setUint32(28,sr*4,true); data.setUint16(32,4,true); data.setUint16(34,16,true); w(36,"data"); data.setUint32(40,n*4,true);
    const L=buf.getChannelData(0), R2=buf.getChannelData(1); let peak=0; for(let i=0;i<n;i++){ peak=Math.max(peak,Math.abs(L[i])); data.setInt16(44+i*4,Math.max(-1,Math.min(1,L[i]))*32767,true); data.setInt16(46+i*4,Math.max(-1,Math.min(1,R2[i]))*32767,true); }
    const bytes=new Uint8Array(data.buffer); let s=""; for(let i=0;i<bytes.length;i+=32768) s+=String.fromCharCode.apply(null,bytes.subarray(i,i+32768)); return {b64:btoa(s),total,peak}; },proj);
  fs.writeFileSync(out,Buffer.from(r.b64,'base64')); console.log(JSON.stringify({errs,total:r.total,peak:r.peak})); await b.close(); })();
