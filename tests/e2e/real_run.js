// Real end-to-end run: the app's Claude calls go to real Claude through the Claude Code CLI.
const { chromium } = require('playwright'); const fs=require('fs'); const { spawn }=require('child_process');
const SP=process.argv[2], OUT=SP+'/real2'; fs.mkdirSync(OUT,{recursive:true});
const log=(o)=>fs.appendFileSync(OUT+'/calls.jsonl',JSON.stringify(o)+'\n');
function llm(msgs,imgs){ imgs=imgs||[]; return new Promise((res,rej)=>{
  const first=msgs[0].content, m=first.match(/^\[บทบาทและคำสั่งงานของคุณ\]\n([\s\S]*?)\n\[จบคำสั่งงาน\]\n\n/); const sys=m?m[1]:"คุณเป็นพนักงานในออฟฟิศ";
  const conv=msgs.map((x,i)=>{ const c=i===0&&m?first.slice(m[0].length):x.content; return (x.role==="user"?"[ข้อความถึงคุณ]\n":"[คำตอบก่อนหน้าของคุณ]\n")+c; }).join("\n\n");
  const prompt=msgs.length>1?conv+"\n\nตอบข้อความล่าสุดถึงคุณ":conv.replace(/^\[ข้อความถึงคุณ\]\n/,"");
  const who=(sys.match(/คุณคือ "([^"]+)"/)||[])[1]||"?"; const t0=Date.now();
  const args=['-p','--system-prompt',sys,'--tools','','--strict-mcp-config','--setting-sources','','--no-session-persistence','--effort','medium']; if(imgs.length) args.push('--input-format','stream-json','--output-format','stream-json','--verbose'); else args.push('--output-format','json');
  const p=spawn('claude',args,{cwd:OUT});
  let out="",err=""; p.stdout.on('data',d=>out+=d); p.stderr.on('data',d=>err+=d); p.stdin.end(imgs.length?JSON.stringify({type:'user',message:{role:'user',content:[...imgs.map(x=>({type:'image',source:{type:'base64',media_type:x.type,data:x.data}})),{type:'text',text:prompt}]}})+'\n':prompt);
  p.on('close',code=>{ try{ const d=imgs.length?JSON.parse(out.trim().split('\n').reverse().find(l=>l.includes('"type":"result"'))):JSON.parse(out); log({who,ms:Date.now()-t0,cost:d.total_cost_usd,len:(d.result||"").length,err:d.is_error||false,imgs:imgs.length}); fs.appendFileSync(OUT+'/transcript.md',`\n\n## ${who} (${((Date.now()-t0)/1000).toFixed(0)}s)\n\n### ข้อความ\n${prompt.slice(0,3000)}\n\n### คำตอบ\n${d.result}\n`); if(d.is_error) rej(new Error(d.result||'error')); else res(d.result||""); }catch(e){ log({who,fail:String(e),err:err.slice(0,300),code}); rej(new Error('cli failed '+code)); } }); }); }
(async()=>{ const b=await chromium.launch({args:['--enable-unsafe-swiftshader','--use-angle=swiftshader']}); const p=await b.newPage({viewport:{width:1300,height:1000}}); const errs=[]; p.on('pageerror',e=>errs.push(e.message));
  await p.route('**/three.js/r128/three.min.js',r=>r.fulfill({contentType:'application/javascript',body:fs.readFileSync(SP+'/three/package/build/three.min.js','utf8')}));
  await p.exposeFunction('__llm',llm);
  await p.addInitScript(()=>{ window.claude={use:async n=>{ if(n==='downloads') return {save:async()=>{}}; if(n!=='sample') return null;
    const f=async(input,opts)=>{ const imgs=[]; for(const b of (opts&&opts.images)||[]){ const d=await new Promise(r=>{ const fr=new FileReader(); fr.onload=()=>r(String(fr.result).split(',')[1]); fr.readAsDataURL(b); }); imgs.push({type:b.type||'image/jpeg',data:d}); } const t=await window.__llm(input.map(x=>({role:x.role,content:x.content})),imgs); opts?.onText&&opts.onText({text:t,delta:t}); return {text:t,truncated:false}; }; f.limits=async()=>({images:true}); return f; }}; });
  await p.goto('file://'+SP+'/wrapped.html'); await p.waitForTimeout(1500);
  const t0=Date.now(); await p.selectOption('#aspect','9:16').catch(()=>{}); await p.click('#makeBtn');
  let last=""; for(;;){ await p.waitForTimeout(15000); const st=await p.evaluate(()=>{ const r=Object.values(recs)[0]; return r?{done:!!r.finishedAt,err:r.error,waiting:r.waiting,steps:Object.keys(r.out||{}),log:(r.log||[]).slice(-1)[0]?.text}:null; });
    const line=JSON.stringify(st); if(line!==last){ console.log(((Date.now()-t0)/1000).toFixed(0)+'s',line); last=line; }
    if(st&&(st.done||st.err)) break; if(Date.now()-t0>55*60000){ console.log('timeout'); break; } }
  const r=await p.evaluate(()=>{ const r=Object.values(recs)[0]; return JSON.parse(JSON.stringify(r)); }); fs.writeFileSync(OUT+'/record.json',JSON.stringify(r,null,1));
  if(r.project) fs.writeFileSync(OUT+'/project.json',JSON.stringify(r.project));
  console.log(JSON.stringify({errs,minutes:((Date.now()-t0)/60000).toFixed(1),error:r.error})); await b.close(); })();
