"""Soundtrack for episode 2, synthesised from scratch with numpy (no samples, no AI): python3 music.py out.wav"""
import sys, wave, numpy as np
SR=44100; DUR=46.0; N=int(SR*DUR); t=np.arange(N)/SR; rng=np.random.default_rng(11)
S1,S2,S3,S4,S5,S6,S7,S8=4,8.5,14,19.5,24.5,30.5,36.5,42.5
def env(a,b,fi=0.5,fo=0.5): return np.clip((t-a)/fi,0,1)*np.clip((b-t)/fo,0,1)
def lpf(x,k,passes=1):
    w=max(1,int(1/k)); ker=np.ones(w)/w
    for _ in range(passes): x=np.convolve(x,ker,mode="same")
    return x
def note(freq,at,dur,vol=0.2,decay=3.0,harm=(1,0.4,0.15)):
    out=np.zeros(N); i0=int(at*SR); n=min(N-i0,int(dur*SR))
    if n<=0: return out
    tt=np.arange(n)/SR; s=sum(h*np.sin(2*np.pi*freq*(k+1)*tt) for k,h in enumerate(harm)); out[i0:i0+n]=s*np.exp(-tt*decay)*np.clip(tt/0.005,0,1)*vol; return out
def thump(at,vol=0.6,f0=95,f1=42,dur=0.28):
    out=np.zeros(N); i0=int(at*SR); n=min(N-i0,int(dur*SR))
    if n<=0: return out
    tt=np.arange(n)/SR; f=f1+(f0-f1)*np.exp(-tt*18); out[i0:i0+n]=np.sin(2*np.pi*np.cumsum(f)/SR)*np.exp(-tt*11)*vol; return out
noise=rng.standard_normal(N); mix=np.zeros(N)
D,F,A,C,E,G=146.8,174.6,220.0,261.6,329.6,392.0
# warm dusk pad (D minor 9) – whole clip, dips in the shade
pad=sum(np.sin(2*np.pi*f*t+i)*a for i,(f,a) in enumerate([(73.4,0.35),(110,0.25),(146.8,0.2),(174.6,0.14),(220,0.12),(329.6,0.06)]))*(0.8+0.2*np.sin(2*np.pi*0.17*t))
mix+=pad*0.17*(env(0,S3+0.5,2,1.5)+env(S4+1,DUR,2.5,2.5))
# evening wind
mix+=lpf(noise,0.02,2)*1.2*(0.25+0.15*np.sin(2*np.pi*0.19*t))*env(0,S5,1.5,2)
# slow guitar-like plucks in the opening
for k,f in enumerate([D,A,F*2,E*2,D,A,C*2,A]):
    at=0.6+k*0.95
    if at<S2: mix+=note(f,at,2.0,0.12,2.2,(1,0.5,0.2,0.1))
# running: soft paws + rising pulse that speeds up as the shadow stretches
b=S1+0.4; step=0.36
while b<S3:
    mix+=thump(b,0.22,170,90,0.07); step=max(0.2,step*0.985); b+=step
for k in range(int((S3-S2)/0.25)):
    at=S2+k*0.25; mix+=note([D,F,A,C*1.0][k%4]*2,at,0.22,0.06+0.05*k/22,9,(1,0.6,0.3))
i0=int((S3-1.6)*SR); n=int(1.6*SR); tt=np.arange(n)/SR; mix[i0:i0+n]+=lpf(noise[i0:i0+n],0.2)*(tt/1.6)**2*0.45
# shade under the tree: hush, low drone, one heartbeat
dr=sum(np.sin(2*np.pi*f*t)*a for f,a in [(36.7,0.5),(55,0.25)])
mix+=dr*0.3*env(S3,S4+0.5,0.4,1.5)
for at in [S3+1.0,S3+2.1,S3+3.2]: mix+=thump(at,0.45)+thump(at+0.22,0.3)
# stopping: a single low bell
mix+=note(D,S4+2.6,4,0.22,0.9)+note(A,S4+2.6,4,0.12,0.9)
# sitting together at sunset: gentle melody in D major-ish
mel=[(A*2,0),(D*2*1.0,0.7),(E*2,1.4),(F*2*1.06,2.1),(E*2,3.2),(D*2,3.9),(A*2,4.6),(G*2,5.6),(F*2*1.06,6.3),(E*2,7.0),(D*2,8.2),(A*2,9.2),(D*4,10.2)]
for f,at in mel: mix+=note(f,S5+0.6+at,2.4,0.14,2.0,(1,0.3,0.08))
# night: music box
box=[(D*4,0),(A*2,.5),(F*2*1.06,1),(D*4,1.5),(E*4,2.2),(A*2,2.7),(D*4,3.4),(F*4*1.06,4.0),(E*4,4.6),(D*4,5.2)]
for f,at in box: mix+=note(f,S6+0.4+at,1.8,0.1,3.0,(1,0.2))
# psychology card: soft low hit + sustained chord, then resolution
mix+=thump(S7+0.35,0.5,70,32,0.6)+note(D/2*2,S7+0.35,5,0.18,0.6)
for f in [D,F*1.06,A,D*2]: mix+=note(f,S8+0.2,3.6,0.1,0.8)
mix+=note(D*4,S8+0.2,3,0.08,1.4)+note(A*4,S8+0.9,2.6,0.06,1.4)
mix*=np.clip(t/0.4,0,1)*np.clip((DUR-t)/1.5,0,1)
mix=np.tanh(mix*1.25); mix/=max(1e-6,np.abs(mix).max()); mix*=0.89
d=int(0.012*SR); R=np.concatenate([np.zeros(d),mix[:-d]])*0.9+mix*0.1; L=mix
pcm=(np.stack([L,R],1)*32767).astype(np.int16)
w=wave.open(sys.argv[1] if len(sys.argv)>1 else "music.wav","wb"); w.setnchannels(2); w.setsampwidth(2); w.setframerate(SR); w.writeframes(pcm.tobytes()); w.close(); print("ok",DUR)
