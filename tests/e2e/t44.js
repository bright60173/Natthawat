const { chromium } = require('playwright'); const fs=require('fs');
(async()=>{ const SP=process.argv[2]; const b=await chromium.launch(); const p=await b.newPage(); const errs=[]; p.on('pageerror',e=>errs.push(e.message));
  await p.addInitScript(()=>{ window.claude={use:async n=>null}; }); await p.goto('file://'+SP+'/wrapped.html'); await p.waitForTimeout(800);
  const img=await p.evaluate(()=>{ const names=["balance","crowd","earth","wave","volcano","meteor"]; const S=170, cols=6, cv=document.createElement('canvas'); cv.width=S*cols; cv.height=S*Math.ceil(names.length/cols); const c=cv.getContext('2d');
    c.fillStyle="#1d2433"; c.fillRect(0,0,cv.width,cv.height);
    names.forEach((n,i)=>{ const x=(i%cols)*S+S/2, y=Math.floor(i/cols)*S+S/2; c.save(); c.fillStyle=(i+Math.floor(i/cols))%2?"#232b3d":"#2a3448"; c.fillRect(x-S/2,y-S/2,S,S); c.translate(x,y+4); c.scale(1.15,1.15); outline(c,4); try{ PROPS[n](c,1.3); }catch(e){ c.fillStyle="red"; c.fillText(e.message,-60,0); } c.restore(); c.fillStyle="#cfd6e3"; c.font="12px sans-serif"; c.fillText(n,x-S/2+6,y-S/2+16); });
    return cv.toDataURL(); });
  fs.writeFileSync(SP+'/v19-props.png',Buffer.from(img.split(',')[1],'base64')); console.log(JSON.stringify({errs})); await b.close(); })();
