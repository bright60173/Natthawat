"""Trailer soundtrack for the Astra teaser: drone -> pulse -> drum montage -> silence -> theme + braams,
episode sound effects remapped to the teaser cuts, character lines and narrator lines on top.
python3 teaser_audio.py teaser_cues.json out.wav"""
import sys, os, json, types, numpy as np
HERE = os.path.dirname(os.path.abspath(__file__))
cues = json.load(open(sys.argv[1])); TOTAL = cues['total']
# reuse the synth library from audio.py (everything above its "assemble" section)
src = open(os.path.join(HERE, 'audio.py'), encoding='utf-8').read().split('# ---------- assemble')[0]
src = src.replace("cues = json.load(open(sys.argv[1])); TOTAL = cues['total']", "TOTAL = %f" % (TOTAL + 1))
full = open(os.path.join(HERE, 'audio.py'), encoding='utf-8').read(); i = full.index('def reverb'); j = full.index('Lc = mix', i); src += '\n' + full[i:j]
L = {}; exec(compile(src, 'audio_lib', 'exec'), L)
SR, N = L['SR'], L['N']; mix = L['mix']; wet = L['wet']; add, fade, lp, nz, tt = L['add'], L['fade'], L['lp'], L['nz'], L['tt']
music = np.zeros(N, np.float32); fxb = np.zeros(N, np.float32); vox = np.zeros(N, np.float32)
def put(buf, x, at, vol=1.0):
    i = int(at * SR)
    if i < 0 or i >= N: return
    n = min(len(x), N - i); buf[i:i + n] += np.asarray(x[:n], np.float32) * vol
def braam(dur=3.0, f=55.0, vol=1.0):
    t = tt(dur); s = np.zeros(len(t), np.float32)
    for r, a in ((1, 1), (2, .6), (1.5, .45), (3, .3), (4.02, .2)):
        ph = 2 * np.pi * f * r * t * (1 + 0.002 * np.sin(2 * np.pi * 3 * t)); s += a * (2 * ((ph / (2 * np.pi)) % 1) - 1)
    env = np.clip(t / 0.03, 0, 1) * np.exp(-t * 0.9); s = lp(np.tanh(s * 1.6), 900, 1) * env
    return fade(L['mx'](s, L['boom'](min(dur, 1.8), 60, 0.6))[:len(s)], 0.005, 0.6) * vol
def hit(vol=1.0): return L['mx'](L['taiko'](1.0, 120, 40, 0.9), L['metal'](700, 0.5, 0.25), L['boom'](0.9, 80, 0.5)) * vol
def riser(dur=3.0):
    t = tt(dur); f = np.linspace(120, 900, len(t)); s = np.sin(2 * np.pi * np.cumsum(f) / SR) * 0.25 + L['whoosh'](dur, 200, 6000) * np.linspace(0.1, 1, len(t))
    return fade(s, 0.2, 0.02)
segs = cues['segs']
def seg_time(i): return segs[i]['start']
# --- music sections -------------------------------------------------------------
first_mont = next(s['start'] for s in segs if s['mont']); last_mont = max(s['start'] + s['d'] for s in segs if s['mont'])
title_t = next(s['start'] for s in segs if s['title'])
act2 = segs[6]['start']
put(music, fade(L['render_music']('dread', act2 + 1)[:int((act2 + 1) * SR)], 1.5, 1.0), 0, 0.5)
put(music, fade(L['render_music']('tension', first_mont - act2 + 0.5)[:int((first_mont - act2 + 0.5) * SR)], 0.8, 0.3), act2, 0.45)
put(music, fade(L['render_music']('battle', last_mont - first_mont)[:int((last_mont - first_mont) * SR)], 0.05, 0.08), first_mont, 0.55)
put(music, fade(L['render_music']('wings', last_mont - first_mont)[:int((last_mont - first_mont) * SR)], 0.05, 0.08), first_mont, 0.35)
end_start = last_mont + 1.1
put(music, fade(L['render_music']('theme', TOTAL - end_start + 1)[:int((TOTAL - end_start) * SR)], 1.5, 2.5), end_start, 0.5)
# --- hits -------------------------------------------------------------------------
for s in segs:
    h = s['hit']; at = s['start']
    if h == 'braam': put(fxb, braam(3.2, 55, 1.0), at, 0.9)
    elif h == 'boom': put(fxb, L['boom'](2.2, 70, 1.0), at, 0.8)
    elif h == 'hit': put(fxb, hit(), at, 0.7)
    elif h == 'impact': put(fxb, hit(1.2), at, 0.8); put(fxb, braam(2.0, 41, 0.7), at, 0.6)
    elif h == 'riser': put(fxb, riser(s['d']), at, 0.5)
    elif h == 'riser2': put(fxb, riser(s['d'] + 0.1), at, 0.7)
    elif h == 'drone': put(fxb, L['SFX']['breath'](), at + 0.2, 0.6)
put(fxb, riser(2.5), first_mont - 2.5, 0.5)
put(fxb, braam(4.0, 49, 1.2), title_t + 0.1, 1.0)
put(fxb, L['boom'](3.0, 50, 1.2), segs[-1]['start'] + 0.05, 0.9)
# --- episode sound effects mapped onto each cut ---------------------------------------
SFX = L['SFX']; VOXISH = L['VOXISH']
for s in segs:
    if s['black'] or s['src'] is None: continue
    a, b = s['src'], s['src'] + s['d'] * s['sp']
    for sh in cues['shots']:
        for c in sh['sfx']:
            et = sh['start'] + c[0]
            if a - 0.05 <= et < b and c[1] in SFX:
                try: x = np.asarray(SFX[c[1]](), np.float32)
                except Exception: continue
                if s['sp'] < 0.8: x = lp(x, 1800, 1)  # slow motion: darker
                vol = (c[2] if len(c) > 2 else 1.0) * (0.25 if c[1] in VOXISH else 0.5)
                put(fxb, x[:int((s['start'] + s['d'] - (s['start'] + (et - a) / s['sp'])) * SR) + int(0.4 * SR)], s['start'] + (et - a) / s['sp'], vol)
# --- voices ---------------------------------------------------------------------------
lines = {('%02d' % l['i']): l for l in json.load(open(os.path.join(HERE, 'voice_lines.json'), encoding='utf-8'))}
import subprocess
def mp3(p):
    r = subprocess.run(['ffmpeg', '-v', 'error', '-i', p, '-f', 's16le', '-ac', '1', '-ar', str(SR), '-'], capture_output=True, check=True)
    x = np.frombuffer(r.stdout, np.int16).astype(np.float32) / 32768; return x / max(1e-4, np.abs(x).max()) * 0.85
busy = np.zeros(N, np.float32)
def voice_at(x, at, gain=1.0):
    put(vox, x, at, gain); i = int(at * SR); busy[i:i + len(x)] = 1
for s in segs:
    if s['voice']:
        l = lines[s['voice']]; x = mp3(os.path.join(HERE, 'voice', s['voice'] + '.mp3')); voice_at(x, s['start'] + (l['at'] - 0.05 - s['src']) / s['sp'])
    if s['narr']:
        p = os.path.join(HERE, 'teaser_voice', s['narr'] + '.mp3')
        if os.path.exists(p): voice_at(L['lp'](mp3(p), 7000, 1) * 1.0, s['start'] + s['narrAt'], 1.05)
        else: print('missing narrator', p)
voice_at(mp3(os.path.join(HERE, 'voice', '01.mp3')), segs[1]['start'] + 0.3, 0.9)  # "เมื่อดวงอาทิตย์ดับสูญ..." over the opening
k = int(0.2 * SR); env = np.convolve(np.convolve(busy, np.ones(k) / k, 'same'), np.ones(k) / k, 'same'); duck = 1 - 0.6 * np.clip(env, 0, 1)
# trailer silence before the last act
s0 = int(last_mont * SR); s1 = int(end_start * SR); music[s0:s1] *= 0; fxb[s0 + int(0.3 * SR):s1] *= 0.1
bed = music * duck + fxb * (1 - 0.35 * np.clip(env, 0, 1))
wetb = bed * 0.35 + vox * 0.12
Lc = bed + vox + L['reverb'](wetb, 1) * 0.5; Rc = bed + vox + L['reverb'](wetb, 2) * 0.5
st = np.stack([Lc, Rc], 1)[:int(TOTAL * SR)]
st = np.tanh(st * 1.4) / np.tanh(1.4); st *= 0.95 / max(1e-6, np.abs(st).max())
import wave
w = wave.open(sys.argv[2], 'wb'); w.setnchannels(2); w.setsampwidth(2); w.setframerate(SR); w.writeframes((st * 32767).astype(np.int16).tobytes()); w.close()
print('ok', TOTAL)
