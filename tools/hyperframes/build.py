import sys,re
src,outdir,proj_json,W,H,DUR=sys.argv[1],sys.argv[2],sys.argv[3],int(sys.argv[4]),int(sys.argv[5]),sys.argv[6]
s=open(src,encoding='utf-8').read()
body=s.split('<body>',1)[1].rsplit('</body>',1)[0]
head=s.split('<head>',1)[1].split('</head>',1)[0]
styles=''.join(re.findall(r'<style>[\s\S]*?</style>',head))
# classic inline scripts of the app = the engine (skip text/plain templates and external src)
scripts=re.findall(r'<script(\s[^>]*)?>([\s\S]*?)</script>',body)
engine='\n;\n'.join(code for attrs,code in scripts if not attrs or ('src=' not in attrs and 'text/plain' not in attrs and 'module' not in attrs))
markup=re.sub(r'<script[\s\S]*?</script>','',body)
open(outdir+'/lib/engine.js','w',encoding='utf-8').write(engine)
fonts=open(outdir+'/fonts.local.css',encoding='utf-8').read()
proj=open(proj_json,encoding='utf-8').read()
driver=f'''(function(){{
  const W={W},H={H};
  const P=normalizeProject({proj});
  const cv=document.getElementById("hfcv"); const rr=new Renderer(cv); rr.load(P);
  for(const c of [rr.cv,rr.bufA,rr.bufB]){{ c.width=W; c.height=H; }} rr.W=W; rr.H=H; rr.layout();
  const ready=(async()=>{{ try{{ await Promise.all(["400","600","800"].map(w=>document.fonts.load(w+" 40px Kanit","กขค Abc"))); await document.fonts.load("40px Itim","กขค"); }}catch(e){{}} fontEpoch++; rr.layout();
    BG3D.scale=1; BG3D.w=0; P.scenes.forEach((s,i)=>{{ try{{ bg3dFrame(s,0.05,i,W,H); }}catch(e){{}} }}); }})();
  window.__hf=window.__hf||{{}}; window.__hf.buildReady=window.__hf.buildReady||{{}}; window.__hf.buildReady["ai-office"]=ready;
  let q=Promise.resolve();
  window.addEventListener("hf-seek",e=>{{ const t=e.detail.time; q=q.catch(()=>{{}}).then(()=>ready).then(()=>rr.drawFrame(Math.min(t,rr.total-0.001))); e.detail.waitUntil(q); }});
  ready.then(()=>rr.drawFrame(0));
}})();
'''
open(outdir+'/lib/driver.js','w',encoding='utf-8').write(driver)
html=f'''<!doctype html>
<html lang="th">
<head>
<meta charset="UTF-8" />
<meta name="viewport" content="width={W}, height={H}" />
<title>AI Office clip</title>
<style>{fonts}</style>

<style>html,body{{width:{W}px!important;height:{H}px!important;overflow:hidden!important;margin:0!important;padding:0!important;background:#000!important}} #appdom{{display:none!important}} #root{{position:relative;width:100%;height:100%}} #hfcv{{position:absolute;inset:0;width:100%;height:100%;display:block}}</style>
</head>
<body>
<div id="root" data-composition-id="main" data-start="0" data-duration="{DUR}" data-width="{W}" data-height="{H}" data-no-timeline>
<canvas id="hfcv" class="clip" data-start="0" data-duration="{DUR}" data-track-index="1"></canvas>
<audio id="music" class="clip" src="assets/audio/music.wav" data-start="0" data-duration="{DUR}" data-track-index="2" data-volume="1"></audio>
</div>
<div id="appdom" hidden>{markup}</div>
<script src="lib/three.min.js"></script>
<script src="lib/engine.js"></script>
<script src="lib/driver.js"></script>
</body>
</html>
'''
open(outdir+'/index.html','w',encoding='utf-8').write(html)
