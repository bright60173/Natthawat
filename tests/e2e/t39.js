const { chromium } = require('playwright'); const fs=require('fs'); const path=require('path');
(async()=>{ const SP=process.argv[2], GF=SP+'/gf'; const b=await chromium.launch({args:['--enable-unsafe-swiftshader','--use-angle=swiftshader']}); const p=await b.newPage(); const errs=[]; p.on('pageerror',e=>errs.push(e.message));
  await p.route('**/three.js/r128/three.min.js',r=>r.fulfill({contentType:'application/javascript',body:fs.readFileSync(SP+'/three/package/build/three.min.js','utf8')}));
  await p.route(/fonts\.googleapis\.com/,r=>r.fulfill({contentType:'text/css',body:fs.readFileSync(GF+'/all.css','utf8')}));
  await p.route(/fonts\.gstatic\.com/,r=>{ const f=GF+'/'+path.basename(new URL(r.request().url()).pathname); fs.existsSync(f)?r.fulfill({contentType:'font/woff2',body:fs.readFileSync(f)}):r.abort(); });
  await p.addInitScript(()=>{ window.claude={use:async n=>null}; }); await p.goto('file://'+SP+'/wrapped.html'); await p.waitForTimeout(2000);
  const proj={title:"ขายคำตอบ",aspect:"9:16",look:"cinematic",subStyle:"doc",font:"Kanit",music:"calm",scenes:[
   {bg:"warehouse",time:"night",camera:"zoom-in",narration:"ช่าง 3 คน ใช้เวลา 5 ชั่วโมง แต่คุณใช้แค่ 2 นาที",emph:["2 นาที"],subEn:"Three technicians took five hours. You took two minutes.",duration:4,elements:[
     {type:"card",kind:"compare",x:0.5,y:0.2,scale:1,enter:"top",left:{label:"ช่าง 3 คน",value:"5",unit:"ชั่วโมง",note:"ยังไม่ติด",good:false},right:{label:"คุณ",value:"2",unit:"นาที",note:"ซ่อมได้",good:true}},
     {type:"character",look:"boy",emotion:"neutral",x:0.3,y:0.86,scale:1,enter:"left",motion:"walk",toX:0.38},{type:"character",look:"scientist",emotion:"thinking",x:0.72,y:0.86,scale:1,enter:"fade",motion:"none"},{type:"prop",name:"machine",x:0.55,y:0.6,scale:1.1,enter:"fade"}]},
   {bg:"studio",time:"night",camera:"zoom-in",narration:"มีวิธีได้เงินเต็ม ในสองนาทีเท่าเดิม",emph:["เงินเต็ม"],subEn:"There's a way to get paid in full, in the same two minutes.",duration:4,elements:[
     {type:"card",kind:"timer",label:"ใช้เวลา",labelEn:"TIME TAKEN",value:"02:00",x:0.5,y:0.2,enter:"pop"},{type:"card",kind:"stat",label:"ค่าซ่อมที่ได้",labelEn:"WHAT YOU GET PAID",value:"฿15,000",pct:100,x:0.5,y:0.4,enter:"bottom",at:0.5}]},
   {bg:"studio",time:"night",camera:"static",narration:"เจ้าของล้งหน้าเปลี่ยน",emph:["หน้าเปลี่ยน"],subEn:"The owner's face drops.",duration:3,elements:[{type:"character",look:"boy",emotion:"shocked",x:0.5,y:1.25,scale:2.4,enter:"none",motion:"talk"},{type:"prop",name:"gauge",x:0.82,y:0.25,scale:0.7}]}]};
  const r=await p.evaluate(async(proj)=>{ await ensureFont("Kanit"); fontEpoch++; const P=normalizeProject(proj); const rr=new Renderer(document.createElement('canvas')); rr.load(P); BG3D.scale=1;
    const c=document.createElement('canvas'); c.width=270*4; c.height=480; const g=c.getContext('2d'); [0.7,3.2,rr.starts[1]+2.2,rr.starts[2]+1.4].forEach((t,i)=>{ rr.drawFrame(t); g.drawImage(rr.cv,i*270,0,270,480); }); return c.toDataURL(); },proj);
  fs.writeFileSync(SP+'/v18-viralstyle.png',Buffer.from(r.split(',')[1],'base64')); console.log(JSON.stringify({errs})); await b.close(); })();
