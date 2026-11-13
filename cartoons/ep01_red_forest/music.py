"""Soundtrack for episode 1, synthesised from scratch with numpy (no samples, no AI): python3 music.py out.wav"""
import sys, wave, numpy as np
SR=44100; DUR=39.0; N=int(SR*DUR); t=np.arange(N)/SR; rng=np.random.default_rng(7)
S1,S2,S3,S4,S5,S6,S7,S8=4,8.4,11.4,17.4,20.4,24.4,29.4,36.4
def env(a,b,fi=0.5,fo=0.5): return np.clip((t-a)/fi,0,1)*np.clip((b-t)/fo,0,1)
def lp(x,k):  # one-pole low-pass
    y=np.empty_like(x); acc=0.0
    for i in range(0,len(x),1): acc+=k*(x[i]-acc); y[i]=acc
    return y
def lpf(x,k,passes=1):
    from numpy.lib.stride_tricks import sliding_window_view
    w=max(1,int(1/k)); ker=np.ones(w)/w
    for _ in range(passes): x=np.convolve(x,ker,mode="same")
    return x
def note(freq,at,dur,vol=0.2,decay=3.0,harm=(1,0.4,0.15)):
    out=np.zeros(N); i0=int(at*SR); n=min(N-i0,int(dur*SR));
    if n<=0: return out
    tt=np.arange(n)/SR; s=sum(h*np.sin(2*np.pi*freq*(k+1)*tt) for k,h in enumerate(harm)); out[i0:i0+n]=s*np.exp(-tt*decay)*np.clip(tt/0.005,0,1)*vol; return out
def thump(at,vol=0.6,f0=95,f1=42,dur=0.28):
    out=np.zeros(N); i0=int(at*SR); n=min(N-i0,int(dur*SR));
    if n<=0: return out
    tt=np.arange(n)/SR; f=f1+(f0-f1)*np.exp(-tt*18); out[i0:i0+n]=np.sin(2*np.pi*np.cumsum(f)/SR)*np.exp(-tt*11)*vol; return out
noise=rng.standard_normal(N)
mix=np.zeros(N)
# dark drone (A minor) until the reveal
dr=sum(np.sin(2*np.pi*f*t+p)*a for f,a,p in [(55,0.5,0),(82.4,0.3,1),(110,0.16,2),(130.8,0.1,0.5)])*(0.75+0.25*np.sin(2*np.pi*0.13*t))
mix+=dr*0.22*env(0,S6+1.5,1.5,2.5)
# wind
mix+=lpf(noise,0.02,2)*1.6*(0.25+0.2*np.sin(2*np.pi*0.21*t))*env(0,S5,1.0,2.0)
# lantern goes out: a puff and a falling tone
i0=int(7.2*SR); n=int(0.5*SR); tt=np.arange(n)/SR; mix[i0:i0+n]+=lpf(noise[i0:i0+n],0.05)*2.2*np.exp(-tt*9)+np.sin(2*np.pi*np.cumsum(600*np.exp(-tt*6))/SR)*np.exp(-tt*7)*0.25
# small walking steps in scenes 1-2
for k in range(int((7.2-0.6)/0.39)): mix+=thump(0.6+k*0.39,0.12,160,90,0.08)
# heartbeat: slow in the dark, fast in the chase
b=S2+0.6
while b<S3: mix+=thump(b,0.5)+thump(b+0.22,0.36); b+=1.05
b=S3; step=0.25
while b<S4:
    mix+=thump(b,0.7,110,46,0.2); j=int((b+step/2)*SR); m=int(0.03*SR); mix[j:j+m]+=noise[j:j+m]*0.10*np.exp(-np.arange(m)/SR*120); b+=step
# tense string-like pulse in the chase (A, C, E, F)
for k,f in enumerate([220,261.6,329.6,349.2]*6):
    at=S3+k*0.25
    if at<S4: mix+=note(f,at,0.24,0.10,9,(1,0.6,0.35,0.2))
# riser into the fall, then tumble thuds
i0=int((S4-2.2)*SR); n=int(2.2*SR); tt=np.arange(n)/SR; mix[i0:i0+n]+=lpf(noise[i0:i0+n],0.2)*(tt/2.2)**2*0.5
for at,v in [(S4+0.15,0.9),(S4+0.5,0.6),(S4+0.9,0.75)]: mix+=thump(at,v,80,36,0.4)
# the giant arrives: sub rumble, slow heavy steps, then silence before the light
i0=int((S4+1.2)*SR); i1=int((S5+2.3)*SR); tt=np.arange(i1-i0)/SR; mix[i0:i1]+=np.sin(2*np.pi*38*tt)*0.32*np.clip(tt/2,0,1)*np.clip((tt[-1]-tt)/0.25,0,1)
for at in [S4+1.4,S4+2.1,S4+2.8]: mix+=thump(at,0.8,60,30,0.5)
# the light: bell, then a music-box tune in A major with a warm pad
A,B,Cs,E,Fs=440.0,493.9,554.4,659.3,740.0
mix+=note(E*2,S5+2.5,3.0,0.26,1.6)+note(A*2,S5+2.5,3.0,0.14,1.6)
tune=[(E,0),(A*2,.5),(Cs*2,1),(E*2,1.5),(Cs*2,2.25),(A*2,2.75),(B,3.5),(E*2,4),(Fs*2,4.5),(E*2,5.25),(Cs*2,5.75),(A*2,6.5),(E,7),(A*2,7.5),(Cs*2,8),(E*2,8.5),(A*4,9.25),(E*2,10),(Cs*2,10.5),(A*2,11.25)]
for f,at in tune: mix+=note(f,S6+0.3+at,2.2,0.17,2.4,(1,0.3,0.08))
for f,at in [(A,0),(E,0),(Cs,2.2)]: pass
pad=sum(np.sin(2*np.pi*f*t)*a for f,a in [(110,0.3),(164.8,0.22),(220,0.2),(277.2,0.16),(329.6,0.1)])*(0.8+0.2*np.sin(2*np.pi*0.2*t))
mix+=pad*0.16*env(S5+2.6,DUR,2.5,2.5)
mix+=note(A*2,S8+0.4,2.5,0.2,1.3)+note(Cs*4,S8+0.4,2.5,0.12,1.3)+note(E*2,S8+0.4,2.5,0.14,1.3)
mix*=np.clip(t/0.4,0,1)*np.clip((DUR-t)/1.2,0,1)
mix=np.tanh(mix*1.25); mix/=max(1e-6,np.abs(mix).max()); mix*=0.89
# a little stereo width: delayed copy on the right
d=int(0.012*SR); R=np.concatenate([np.zeros(d),mix[:-d]])*0.9+mix*0.1; L=mix
pcm=(np.stack([L,R],1)*32767).astype(np.int16)
w=wave.open(sys.argv[1] if len(sys.argv)>1 else "music.wav","wb"); w.setnchannels(2); w.setsampwidth(2); w.setframerate(SR); w.writeframes(pcm.tobytes()); w.close(); print("ok",DUR)
