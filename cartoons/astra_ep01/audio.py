"""Soundtrack for Astra ep.1, synthesised from scratch with numpy (no samples, no AI).
python3 audio.py cues.json out.wav        (cues.json comes from: node cues.js cues.json subs.srt)"""
import sys, json, wave, numpy as np
SR = 44100
rng = np.random.default_rng(11)
cues = json.load(open(sys.argv[1])); TOTAL = cues['total']; N = int(SR * (TOTAL + 2))
mix = np.zeros(N, np.float32); wet = np.zeros(N, np.float32)

def box(x, w):
    w = max(1, int(w))
    if w <= 1: return x
    c = np.cumsum(np.concatenate(([0.0], x.astype(np.float64)))); y = (c[w:] - c[:-w]) / w
    return np.concatenate((np.full(w // 2, y[0]), y, np.full(len(x) - len(y) - w // 2, y[-1]))).astype(np.float32)
def lp(x, fc, passes=2):
    w = max(1, int(SR / (2.2 * fc)))
    for _ in range(passes): x = box(x, w)
    return x
def hp(x, fc): return x - lp(x, fc)
def bp(x, lo, hi): return lp(hp(x, lo), hi)
def nz(n): return rng.standard_normal(n).astype(np.float32)
def tt(dur): return np.arange(int(dur * SR), dtype=np.float32) / SR
def add(buf, x, at, vol=1.0, send=0.25):
    i = int(at * SR)
    if i >= N or i < 0: return
    n = min(len(x), N - i); buf[i:i + n] += x[:n] * vol
    if send and buf is mix: wet[i:i + n] += x[:n] * vol * send
def fade(x, a=0.01, b=0.05):
    n = len(x); ia, ib = min(n, int(a * SR)), min(n, int(b * SR)); x = x.copy()
    if ia: x[:ia] *= np.linspace(0, 1, ia)
    if ib: x[-ib:] *= np.linspace(1, 0, ib)
    return x
def hz(semi, base=220.0): return base * 2 ** (semi / 12)

# ---------- instruments ----------
def pluck(f, dur, bright=1.0):
    t = tt(dur); s = sum(np.sin(2 * np.pi * f * (k + 1) * t) * a for k, a in enumerate([1, 0.5 * bright, 0.25 * bright, 0.1 * bright]))
    return fade(s * np.exp(-t * (3.5 / max(0.3, dur) + 1.5)), 0.004, 0.03)
def flute(f, dur):
    t = tt(dur); vib = 1 + 0.004 * np.sin(2 * np.pi * 5.2 * t) * np.clip(t / 0.3, 0, 1)
    ph = 2 * np.pi * f * np.cumsum(vib) / SR; s = np.sin(ph) + 0.25 * np.sin(2 * ph) + 0.08 * np.sin(3 * ph) + bp(nz(len(t)), 1500, 5000) * 0.03
    return fade(s, 0.06, min(0.25, dur * 0.4))
def pad(freqs, dur, bright=0.5):
    t = tt(dur); s = np.zeros(len(t), np.float32)
    for f in freqs:
        for det in (-0.004, 0.003):
            ph = 2 * np.pi * f * (1 + det) * t + rng.uniform(0, 6)
            s += np.sin(ph) + bright * 0.4 * np.sin(2 * ph) + bright * 0.2 * np.sin(3 * ph)
    return fade(s / (len(freqs) * 2), min(1.2, dur * 0.3), min(1.5, dur * 0.3)) * (0.85 + 0.15 * np.sin(2 * np.pi * 0.2 * t))
def choir(freqs, dur):
    t = tt(dur); s = np.zeros(len(t), np.float32)
    for f in freqs:
        vib = 1 + 0.005 * np.sin(2 * np.pi * (4.5 + rng.uniform(0, 1)) * t + rng.uniform(0, 6)); ph = 2 * np.pi * f * np.cumsum(vib) / SR
        s += sum(np.sin(ph * k) * a for k, a in [(1, 1), (2, 0.6), (3, 0.5), (4, 0.25), (5, 0.12)])
    return fade(lp(s / len(freqs), 1800, 1), min(0.8, dur * 0.3), min(1.2, dur * 0.3))
def taiko(vol=1.0, f0=110, f1=45, dur=0.6):
    t = tt(dur); f = f1 + (f0 - f1) * np.exp(-t * 14); s = np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-t * 6) + lp(nz(len(t)), 900) * np.exp(-t * 30) * 0.6
    return s * vol
def snare(vol=1.0):
    t = tt(0.18); return (bp(nz(len(t)), 800, 6000) * np.exp(-t * 28) + np.sin(2 * np.pi * 190 * t) * np.exp(-t * 40) * 0.5) * vol
def bass(f, dur):
    t = tt(dur); return fade((np.sin(2 * np.pi * f * t) + 0.4 * np.sin(4 * np.pi * f * t) + 0.15 * np.sin(6 * np.pi * f * t)) * np.exp(-t * 2.2 / max(dur, 0.2)), 0.008, 0.05)
def strings_trem(freqs, dur, rate=11):
    t = tt(dur); s = np.zeros(len(t), np.float32)
    for f in freqs:
        ph = 2 * np.pi * f * t; s += sum(np.sin(ph * k + rng.uniform(0, 6)) / k for k in range(1, 7))
    return fade(lp(s / len(freqs), 2500, 1) * (0.6 + 0.4 * np.sin(2 * np.pi * rate * t) ** 2), 0.15, 0.3)

# ---------- music ----------
AM = [0, 2, 3, 5, 7, 8, 10]  # A natural minor
CH = {'Am': [0, 3, 7], 'F': [-4, 0, 3], 'C': [3, 7, 10], 'G': [-2, 2, 5], 'Dm': [5, 8, 12], 'E': [-5, -1, 2], 'Em': [-5, -2, 2], 'Bb': [1, 5, 8], 'Adim': [0, 3, 6]}
THEME = [(0, 1.5), (3, .5), (7, 2), (5, 1), (3, 1), (2, 1.5), (0, .5), (-2, 2), (0, 1.5), (3, .5), (8, 2), (7, 1), (5, 1), (7, 3), (None, 1),
         (12, 1.5), (10, .5), (8, 2), (7, 1), (5, 1), (3, 1.5), (5, .5), (7, 2), (5, 1.5), (3, .5), (2, 2), (0, 4)]
MOODS = {  # bpm, chords (4 beats each), layers
    'dream': dict(bpm=50, ch=['Am', 'F', 'Am', 'Em'], pad=.5, choir=.25, bell=.15, low=.3),
    'dread': dict(bpm=56, ch=['Am', 'Adim', 'Bb', 'Adim'], pad=.45, low=.6, trem=.25, pulse=.3),
    'morning': dict(bpm=66, ch=['Am', 'C', 'F', 'G'], pad=.3, arp=.25),
    'tension': dict(bpm=84, ch=['Am', 'Am', 'F', 'E'], pad=.3, pulse=.4, trem=.15, low=.3),
    'theme': dict(bpm=72, ch=['Am', 'F', 'C', 'G', 'Dm', 'Am', 'F', 'E'], pad=.4, arp=.25, mel=.5, choir=.2, drum='slow'),
    'village': dict(bpm=92, ch=['C', 'G', 'Am', 'F'], arp=.4, pad=.2, mel2=.3),
    'sad': dict(bpm=54, ch=['Am', 'F', 'Dm', 'E'], pad=.4, piano=.4),
    'sera': dict(bpm=58, ch=['Dm', 'Am', 'F', 'E'], pad=.4, piano=.25, low=.2),
    'chase': dict(bpm=138, ch=['Am', 'Am', 'F', 'G'], pulse=.5, drum='fast', trem=.3, arp=.25),
    'magic': dict(bpm=100, ch=['F', 'C', 'G', 'Am'], arp=.45, pad=.35, bell=.3, choir=.15),
    'mystery': dict(bpm=60, ch=['Am', 'Bb', 'Am', 'E'], pad=.4, bell=.25, low=.3),
    'villain': dict(bpm=64, ch=['Am', 'Adim', 'Am', 'Bb'], low=.7, pulse=.35, trem=.2, drum='doom'),
    'resolve': dict(bpm=76, ch=['F', 'G', 'Am', 'Am', 'F', 'G', 'C', 'E'], pad=.45, arp=.3, drum='slow', mel=.3),
    'battle': dict(bpm=150, ch=['Am', 'Am', 'F', 'E', 'Am', 'G', 'F', 'E'], pulse=.55, drum='battle', trem=.4, brass=.35),
    'memory': dict(bpm=50, ch=['Am', 'F'], pad=.4, choir=.4, bell=.2, rev=1),
    'inner': dict(bpm=48, ch=['Am', 'F', 'Dm', 'Am'], pad=.35, choir=.2, low=.25),
    'awaken': dict(bpm=80, ch=['Am', 'F', 'G', 'E'], pad=.5, choir=.5, drum='doom', trem=.4, low=.5, brass=.3),
    'wolf': dict(bpm=150, ch=['Am', 'F', 'G', 'Am'], pulse=.55, drum='battle', choir=.4, brass=.45, trem=.3),
    'wings': dict(bpm=76, ch=['F', 'G', 'Am', 'C', 'F', 'G', 'Am', 'Am'], pad=.5, choir=.55, mel=.5, drum='slow', arp=.25, brass=.25),
    'king': dict(bpm=50, ch=['Am', 'Bb', 'Adim', 'Am'], low=.8, choir=.2, pulse=.15, trem=.12),
    'aftermath': dict(bpm=52, ch=['Am', 'F', 'Am', 'Em'], pad=.4, low=.3),
    'warm': dict(bpm=66, ch=['F', 'C', 'Dm', 'Am'], pad=.35, piano=.35, arp=.15),
    'silence': dict(bpm=50, ch=['Am'], pad=.12),
    'night': dict(bpm=58, ch=['Am', 'C', 'F', 'Em'], pad=.35, piano=.25, bell=.15),
    'hope': dict(bpm=70, ch=['F', 'G', 'C', 'Am'], pad=.4, arp=.3, piano=.25, mel2=.25),
    'journey': dict(bpm=84, ch=['Am', 'F', 'C', 'G'], pad=.4, arp=.35, mel=.45, drum='slow'),
    'credits': dict(bpm=72, ch=['Am', 'F', 'C', 'G', 'Dm', 'Am', 'F', 'E'], pad=.4, arp=.3, mel=.5, choir=.25, drum='slow'),
    'post': dict(bpm=46, ch=['Am', 'Adim'], low=.6, choir=.15, bell=.12),
}
def render_music(mood, dur):
    M = MOODS.get(mood)
    if not M: return np.zeros(int(dur * SR), np.float32)
    n = int((dur + 3) * SR); out = np.zeros(n, np.float32); beat = 60.0 / M['bpm']; bar = beat * 4; nb = int(dur / bar) + 2
    def put(x, at, vol):
        i = int(at * SR)
        if i < n: m = min(len(x), n - i); out[i:i + m] += x[:m] * vol
    for b in range(nb):
        ch = CH[M['ch'][b % len(M['ch'])]]; t0 = b * bar
        if M.get('pad'): put(pad([hz(s - 12) for s in ch] + [hz(ch[0] - 24)], bar * 1.25), t0, M['pad'] * 0.5)
        if M.get('choir'): put(choir([hz(s) for s in ch] + [hz(ch[1] + 12)], bar * 1.2), t0, M['choir'] * 0.3)
        if M.get('low'): put(lp(pad([hz(ch[0] - 36), hz(ch[0] - 24), hz(ch[0] - 24 + 7) * 0.5], bar * 1.2, 1.0), 300, 1), t0, M['low'] * 0.9)
        if M.get('trem'): put(strings_trem([hz(s) for s in ch], bar * 1.05), t0, M['trem'] * 0.35)
        if M.get('brass') and b % 2 == 0:
            t = tt(bar * 0.9); f = hz(ch[0] - 12); s = sum(np.sin(2 * np.pi * f * k * t) / k for k in range(1, 9)) + sum(np.sin(2 * np.pi * f * 1.5 * k * t) / k for k in range(1, 6)) * 0.6
            put(fade(lp(s, 1400, 1) * np.clip(t / 0.08, 0, 1) * np.exp(-t * 0.8), 0.01, 0.2), t0, M['brass'] * 0.3)
        if M.get('pulse'):
            for k in range(8): put(bass(hz(ch[0] - 24), beat * 0.5), t0 + k * beat * 0.5, M['pulse'] * (0.55 if k % 2 else 0.8))
        if M.get('arp'):
            seq = [ch[0], ch[1], ch[2], ch[1] + 12, ch[2], ch[1], ch[0] + 12, ch[2]]
            for k in range(8): put(pluck(hz(seq[k]), beat * 1.2), t0 + k * beat * 0.5, M['arp'] * 0.35)
        if M.get('piano'):
            for k, s in enumerate([ch[0] - 12, ch[2] - 12, ch[1], ch[2]]): put(pluck(hz(s), beat * 2.5, 0.5), t0 + k * beat, M['piano'] * 0.5)
        if M.get('bell') and b % 2 == 0:
            put(pluck(hz(ch[2] + 12), 2.5, 1.5) + 0, t0 + beat * 0.5, M['bell'] * 0.4); put(pluck(hz(ch[0] + 24), 2.5, 1.5), t0 + beat * 2.5, M['bell'] * 0.3)
        d = M.get('drum')
        if d == 'slow':
            put(taiko(), t0, 0.5); put(taiko(0.7), t0 + beat * 2.5, 0.4)
        elif d == 'doom':
            put(taiko(1, 90, 36, 1.0), t0, 0.8)
            if b % 2: put(taiko(0.8, 90, 36, 0.8), t0 + beat * 3, 0.6); put(taiko(0.8, 90, 36, 0.8), t0 + beat * 3.5, 0.6)
        elif d == 'fast':
            for k in range(8):
                if k in (0, 3, 6): put(taiko(0.8, 120, 55, 0.3), t0 + k * beat * 0.5, 0.5)
                if k in (2, 6): put(snare(0.5), t0 + k * beat * 0.5, 0.35)
        elif d == 'battle':
            pat = [1, 0, .5, .7, 1, 0, .6, 0, 1, .5, 0, .7, 1, 0, .8, .8]
            for k, v in enumerate(pat):
                if v: put(taiko(v, 115, 48, 0.35), t0 + k * beat * 0.25, 0.6)
                if k in (4, 12): put(snare(0.8), t0 + k * beat * 0.25, 0.45)
    for key, inst, oct_, vol in (('mel', flute, 12, 0.32), ('mel2', pluck, 12, 0.3)):
        if M.get(key):
            t0 = bar * (2 if dur > bar * 6 else 0); k = 0
            while t0 < dur - 1:
                s, bts = THEME[k % len(THEME)]; d = bts * beat
                if s is not None: put(inst(hz(s + oct_), d * 1.05), t0, M[key] * vol)
                t0 += d; k += 1
    return out[:int(dur * SR) + SR]

# ---------- sound effects ----------
def mx(*xs):
    out = np.zeros(max(len(x) for x in xs), np.float32)
    for x in xs: out[:len(x)] += x
    return out
def whoosh(dur=0.7, lo=300, hi=3000, up=True):
    n = int(dur * SR); x = nz(n); t = np.linspace(0, 1, n); e = np.sin(np.pi * t) ** 2
    a = lp(x, lo); b = bp(x, lo, hi); return (a * (1 - t if up else t) + b * (t if up else 1 - t)) * e * 1.6
def boom(dur=1.8, f0=70, vol=1.0):
    t = tt(dur); f = 30 + (f0 - 30) * np.exp(-t * 6); s = np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-t * 2.5) + lp(nz(len(t)), 500) * np.exp(-t * 4) * 1.2 + bp(nz(len(t)), 800, 5000) * np.exp(-t * 14) * 0.5
    return fade(s * vol, 0.002, 0.2)
def rumble(dur=3.5):
    t = tt(dur); return fade(lp(nz(len(t)), 70) * 5 * (0.6 + 0.4 * np.sin(2 * np.pi * 0.7 * t)), 0.6, 1.2)
def roar(dur=2.6, f=70, vol=1.0):
    t = tt(dur); u = t / dur; fr = f * (1 + 0.6 * np.sin(np.pi * u)) * (1 + 0.04 * np.sin(2 * np.pi * 27 * t)); ph = 2 * np.pi * np.cumsum(fr) / SR
    s = sum(np.sin(ph * k) / k ** 0.8 for k in range(1, 14)); s = s * (0.6 + 0.4 * np.sin(2 * np.pi * 31 * t)) + lp(nz(len(t)), 900) * 2.0
    return fade(lp(np.tanh(s * 0.9), 1500, 1) * np.sin(np.pi * u) ** 0.6 * vol, 0.05, 0.4)
def bell(f=311, dur=3.5):
    t = tt(dur); return sum(np.sin(2 * np.pi * f * r * t) * a * np.exp(-t * d) for r, a, d in [(1, 1, 1.0), (2.0, .6, 1.4), (2.76, .5, 1.8), (5.4, .25, 3.0), (8.9, .12, 5)]) * 0.5
def chime(dur=2.0):
    out = np.zeros(int(dur * SR), np.float32)
    for k, s in enumerate([12, 19, 24, 31]):
        x = pluck(hz(s, 440), 1.2, 1.5); i = int(k * 0.09 * SR); out[i:i + len(x)] += x[:len(out) - i] * 0.4
    return out
def click(f=1800, dur=0.06, vol=1): t = tt(dur); return (np.sin(2 * np.pi * f * t) + bp(nz(len(t)), 1000, 6000)) * np.exp(-t * 60) * vol
def thud(vol=1.0, f=80): t = tt(0.35); return (np.sin(2 * np.pi * (f * np.exp(-t * 8) + 35) * t) * np.exp(-t * 12) + lp(nz(len(t)), 700) * np.exp(-t * 25)) * vol
def steps(n=4, gap=0.5, vol=1.0, f=90):
    out = np.zeros(int((n * gap + 0.4) * SR), np.float32)
    for k in range(n):
        x = mx(thud(vol * rng.uniform(0.7, 1), f * rng.uniform(0.9, 1.1)) * 0.6, click(900, 0.04, 0.15)); i = int(k * gap * SR); out[i:i + len(x)] += x
    return out
def metal(f=900, dur=0.8, vol=1.0):
    t = tt(dur); return sum(np.sin(2 * np.pi * f * r * t + rng.uniform(0, 6)) * np.exp(-t * d) for r, d in [(1, 5), (1.51, 6), (2.3, 8), (3.17, 9), (4.4, 12), (5.9, 14)]) * 0.25 * vol + bp(nz(len(t)), 2000, 9000) * np.exp(-t * 40) * 0.5 * vol
def shatter(dur=1.2):
    out = bp(nz(int(dur * SR)), 2500, 11000) * np.exp(-tt(dur) * 5) * 0.9
    for _ in range(26):
        x = click(rng.uniform(2500, 7000), 0.08, 0.5); i = int(rng.uniform(0, dur * 0.7) * SR); out[i:i + len(x)] += x[:len(out) - i]
    return out
def water(dur=1.4, rise=True):
    n = int(dur * SR); t = np.linspace(0, 1, n); x = bp(nz(n), 500, 7000) * np.sin(np.pi * t) ** 1.2; g = np.sin(2 * np.pi * np.cumsum(300 + 900 * (t if rise else 1 - t) + 80 * np.sin(2 * np.pi * 9 * t * dur)) / SR) * 0.15 * np.sin(np.pi * t)
    return x * 1.3 + g
def flame(dur=1.4, vol=1.0):
    n = int(dur * SR); t = np.linspace(0, 1, n); x = lp(nz(n), 1200) * 2.4 * (0.6 + 0.4 * np.sin(2 * np.pi * 13 * t * dur + 3 * np.sin(2 * np.pi * 3 * t * dur))); return fade(mx(x * np.exp(-t * 2.2) * vol, boom(1.2, 55, 0.5) if dur >= 1.2 else x[:1] * 0)[:n], 0.02, 0.3)
def crackle(dur):
    n = int(dur * SR); x = lp(nz(n), 500) * 0.8 * (0.7 + 0.3 * np.sin(2 * np.pi * 0.4 * tt(dur)[:n])); k = rng.random(n) < (14.0 / SR); imp = np.zeros(n, np.float32); imp[k] = rng.uniform(0.3, 1, k.sum()); x += hp(lp(np.convolve(imp, np.exp(-np.arange(300) / 40.0), 'same').astype(np.float32), 5000, 1), 900) * 1.8
    return x
def wind(dur, lo=200, hi=900, gust=0.15):
    t = tt(dur); x = bp(nz(len(t)), lo, hi) * (0.55 + 0.45 * np.sin(2 * np.pi * gust * t + rng.uniform(0, 6)) * np.sin(2 * np.pi * gust * 0.37 * t + 1)) ; return x * 2.2
def heartbeat(vol=1.0):
    out = np.zeros(int(1.0 * SR), np.float32)
    for at, v in ((0, 1), (0.28, 0.7)):
        x = thud(v * vol, 60); i = int(at * SR); out[i:i + len(x)] += x
    return lp(out, 220, 1) * 2.5
def vox(f0=220, f1=180, dur=0.6, form=(700, 1200), noise=0.15, vib=0.0):
    t = tt(dur); u = t / dur; fr = (f0 + (f1 - f0) * u) * (1 + vib * np.sin(2 * np.pi * 6 * t)); ph = 2 * np.pi * np.cumsum(fr) / SR
    src = sum(np.sin(ph * k) / k for k in range(1, 20)); s = bp(src, form[0] * 0.7, form[0] * 1.4) * 1.5 + bp(src, form[1] * 0.8, form[1] * 1.3) + bp(nz(len(t)), 1500, 6000) * noise
    return fade(s * np.sin(np.pi * u) ** 0.5, 0.03, dur * 0.3) * 0.6
def breathy(dur=1.6, vol=1.0): n = int(dur * SR); t = np.linspace(0, 1, n); return bp(nz(n), 600, 3500) * np.sin(np.pi * t) ** 2 * 0.9 * vol
def crowd(dur=5.0):
    n = int(dur * SR); x = bp(nz(n), 300, 2200) * 1.2
    for _ in range(int(dur * 5)):
        v = vox(rng.uniform(140, 380), rng.uniform(120, 420), rng.uniform(0.2, 0.5), (rng.uniform(500, 900), rng.uniform(1100, 1800)), 0.2) * rng.uniform(0.15, 0.4); i = int(rng.uniform(0, dur - 0.6) * SR); x[i:i + len(v)] += v
    return fade(lp(x, 2500, 1), 0.5, 1.0) * 0.5
def seq(fn, times):
    L = int((max(times) + 3) * SR); out = np.zeros(L, np.float32)
    for at in times:
        x = fn(); i = int(at * SR); m = min(len(x), L - i); out[i:i + m] += x[:m]
    return out
def portal(dur=4.0, up=True):
    t = tt(dur); u = t / dur; f = 60 + 90 * (u if up else 1 - u); s = np.sin(2 * np.pi * np.cumsum(f) / SR) * 0.8 + np.sin(2 * np.pi * np.cumsum(f * 1.498) / SR) * 0.5 + bp(nz(len(t)), 300, 1500) * 0.6 * (0.5 + 0.5 * np.sin(2 * np.pi * 7 * t)); return fade(s, 0.4, 0.8) * 0.7
SFX = {
    'breath': lambda: breathy(2.2, 0.5), 'gasp': lambda: fade(whoosh(0.45, 800, 5000), 0.01, 0.1) * 0.6, 'whisper': lambda: breathy(3.5, 0.5) * (0.6 + 0.4 * np.sin(2 * np.pi * 3 * tt(3.5))),
    'chime': chime, 'magicreveal': lambda: np.concatenate((chime(1.2), chime(2.0))), 'ignite': lambda: flame(1.3, 0.8), 'flare': lambda: flame(1.0, 0.7), 'flamewhoosh': lambda: flame(2.2, 1.2), 'flameloop': lambda: flame(4.0, 0.5),
    'rumble': rumble, 'crack': lambda: np.concatenate((shatter(0.5) * 0.7, boom(1.6, 60) * 0.9)), 'stonecrack': lambda: boom(0.9, 90, 0.7) + np.pad(shatter(0.5) * 0.3, (0, int(0.9 * SR) - int(0.5 * SR))),
    'growl': lambda: roar(3.0, 42, 0.9), 'growl_low': lambda: roar(2.2, 38, 0.6), 'roar': lambda: roar(3.2, 68), 'farroar': lambda: lp(roar(4.5, 55), 700) * 1.2, 'wolfhowl': lambda: roar(2.6, 95) + np.pad(vox(300, 520, 1.6, (600, 1100), 0.1, 0.02) * 0.6, (int(0.4 * SR), int(0.6 * SR))),
    'steps': lambda: steps(5, 0.48, 0.7), 'runsteps': lambda: steps(10, 0.27, 0.8), 'heavysteps': lambda: steps(6, 0.75, 1.4, 60), 'march': lambda: steps(10, 0.5, 1.2, 70), 'hooves': lambda: steps(18, 0.17, 1.0, 110), 'giantsteps': lambda: boom(1.6, 45, 1.3), 'cane': lambda: click(600, 0.07, 0.8),
    'cloth': lambda: whoosh(0.4, 400, 2500) * 0.4, 'paper': lambda: whoosh(0.5, 1500, 7000) * 0.35, 'door': lambda: thud(1.0, 120) + np.pad(click(400, 0.1, 0.5), (0, int(0.35 * SR) - int(0.1 * SR))),
    'boom': boom, 'explosion': lambda: boom(2.8, 85, 1.4), 'impact': lambda: thud(1.5, 70), 'punch': lambda: thud(1.6, 95) + np.pad(click(1200, 0.05, 0.6), (0, int(0.35 * SR) - int(0.05 * SR))), 'thunk': lambda: thud(0.8, 130), 'clunk': lambda: metal(400, 0.4, 0.8) + np.pad(thud(0.8), (0, int(0.4 * SR) - int(0.35 * SR))), 'clank': lambda: metal(1300, 0.35, 0.6),
    'tumble': lambda: seq(lambda: thud(rng.uniform(0.5, 1), rng.uniform(70, 120)), [0, 0.22, 0.5, 0.85])[:int(1.6 * SR)], 'cratedrop': lambda: thud(1.2, 100) + lp(nz(int(0.35 * SR)), 2000) * np.exp(-tt(0.35) * 15), 'woodcrash': lambda: boom(1.0, 100, 0.8) + np.pad(shatter(0.7) * 0.25, (0, int(1.0 * SR) - int(0.7 * SR))), 'wallcrash': lambda: boom(2.0, 80, 1.3), 'rubble': lambda: seq(lambda: thud(rng.uniform(0.3, 0.9), rng.uniform(60, 160)), list(np.sort(rng.uniform(0, 1.6, 14))))[:int(2.6 * SR)], 'creak': lambda: vox(140, 210, 0.9, (500, 1500), 0.05, 0.03) * 0.5, 'boxopen': lambda: click(500, 0.1, 0.8),
    'bell': bell, 'skywhoosh': lambda: whoosh(3.0, 200, 2500) * 1.2, 'whoosh': whoosh, 'dash': lambda: whoosh(0.35, 500, 5000), 'arrow': lambda: whoosh(0.3, 1500, 8000) * 0.9, 'whip': lambda: np.concatenate((whoosh(0.3, 800, 6000), click(3000, 0.05, 1.5))), 'jump': lambda: whoosh(0.5, 300, 2000) * 0.6, 'skid': lambda: fade(bp(nz(int(0.6 * SR)), 700, 4000) * np.exp(-tt(0.6) * 4), 0.01, 0.1) * 0.9,
    'shing': lambda: metal(2400, 0.9, 0.9), 'clash': lambda: metal(1500, 0.7, 1.3) + np.pad(thud(0.8), (0, int(0.7 * SR) - int(0.35 * SR))), 'clashgrind': lambda: fade(metal(1700, 1.5, 0.5) + bp(nz(int(1.5 * SR)), 3000, 9000) * 0.25, 0.01, 0.4), 'slash': lambda: np.concatenate((whoosh(0.2, 1000, 7000), metal(2000, 0.4, 0.7))), 'swordplant': lambda: metal(700, 0.9, 1.0) + np.pad(thud(1.3), (0, int(0.9 * SR) - int(0.35 * SR))), 'armorcrack': lambda: metal(500, 0.6, 0.8) + np.pad(shatter(0.5) * 0.3, (0, int(0.6 * SR) - int(0.5 * SR))),
    'shatter': shatter, 'crystal': lambda: chime(1.4) + shatter(1.4)[:int(1.4 * SR)] * 0.2, 'waterrise': lambda: water(1.6), 'splash': lambda: water(0.8, False) * 0.9,
    'bloodform': lambda: fade(water(1.6) * 0.5 + lp(nz(int(1.6 * SR)), 300) * 1.5 * np.linspace(0.2, 1, int(1.6 * SR)), 0.1, 0.3), 'cageclose': lambda: metal(600, 1.0, 1.0) + np.pad(whoosh(0.4), (0, int(1.0 * SR) - int(0.4 * SR))), 'thorns': lambda: seq(lambda: click(rng.uniform(1500, 3500), 0.07, 0.8), list(np.sort(rng.uniform(0, 1.0, 12))))[:int(1.6 * SR)], 'bonecrack': lambda: seq(lambda: click(rng.uniform(500, 1200), 0.06, 1.2), [0, 0.12, 0.3])[:int(0.8 * SR)], 'sizzle': lambda: fade(bp(nz(int(2.0 * SR)), 3000, 10000) * 0.4, 0.2, 0.8), 'clench': lambda: lp(nz(int(0.4 * SR)), 500) * np.exp(-tt(0.4) * 8) * 1.5,
    'heartbeat': heartbeat, 'riser': lambda: fade(whoosh(4.5, 150, 4000) * np.linspace(0.2, 1.4, int(4.5 * SR)) + np.sin(2 * np.pi * np.cumsum(np.linspace(80, 520, int(4.5 * SR))) / SR) * np.linspace(0, 0.4, int(4.5 * SR)), 0.3, 0.05), 'flashback': lambda: whoosh(1.2, 500, 8000, False) + chime(1.2)[:int(1.2 * SR)] * 0.5,
    'fire': lambda: crackle(6.0), 'wind': lambda: fade(wind(6.0), 1, 2), 'forestwind': lambda: fade(wind(8.0, 400, 2500, 0.25), 1, 2), 'nightwind': lambda: fade(wind(9.0, 150, 700, 0.1), 1.5, 2.5), 'crickets': lambda: fade(np.sin(2 * np.pi * 4300 * tt(8.0)) * (np.sin(2 * np.pi * 38 * tt(8.0)) > 0.3) * (np.sin(2 * np.pi * 1.7 * tt(8.0)) > 0) * 0.08, 1, 2),
    'birds': lambda: seq(lambda: mx(whoosh(0.25, 2000, 8000) * 0.5, vox(2200, 2900, 0.18, (2500, 4000), 0.1) * 0.3), list(np.sort(rng.uniform(0, 3.5, 30))))[:int(5 * SR)],
    'crowd': crowd, 'scream': lambda: vox(520, 620, 0.9, (900, 1700), 0.25, 0.01) * 0.5 + crowd(2.0)[:int(0.9 * SR)] * 0.6, 'shout': lambda: vox(260, 330, 0.7, (800, 1400), 0.25) * 0.7, 'groan': lambda: vox(150, 110, 0.7, (600, 1100), 0.2) * 0.6, 'cry': lambda: seq(lambda: vox(480, 380, 0.35, (900, 1900), 0.2, 0.02) * 0.4, [0, 0.5, 0.95, 1.6])[:int(2.6 * SR)], 'kidcry': lambda: lp(seq(lambda: vox(480, 380, 0.35, (900, 1900), 0.2, 0.02) * 0.4, [0, 0.5, 0.95, 1.6])[:int(2.6 * SR)], 1200),
    'laugh': lambda: seq(lambda: vox(420, 360, 0.16, (900, 1800), 0.15) * 0.45, [0, 0.2, 0.4, 0.62])[:int(1.4 * SR)], 'laugh_low': lambda: seq(lambda: vox(105, 90, 0.2, (500, 1000), 0.2) * 0.8, [0, 0.27, 0.54, 0.83, 1.15])[:int(2.0 * SR)],
    'commcrackle': lambda: fade(bp(nz(int(1.2 * SR)), 1500, 6000) * (rng.random(int(1.2 * SR)) < 0.3) * 0.8 + np.sin(2 * np.pi * 1200 * tt(1.2)) * 0.08, 0.02, 0.2), 'portal': lambda: portal(4.5), 'portalclose': lambda: portal(2.5, False), 'cavedrone': lambda: fade(lp(nz(int(9 * SR)), 90) * 4 + np.sin(2 * np.pi * 55 * tt(9)) * 0.35 + np.sin(2 * np.pi * 82.2 * tt(9)) * 0.15, 2, 3),
    'eyeopen': lambda: boom(1.5, 60, 0.9) + np.pad(metal(3000, 1.0, 0.4), (0, int(1.5 * SR) - int(1.0 * SR))), 'choir': lambda: choir([hz(0), hz(3), hz(7), hz(12)], 4.0) * 0.6,
}
VOXISH = {'scream', 'shout', 'groan', 'cry', 'kidcry', 'laugh', 'laugh_low', 'crowd', 'creak', 'whisper', 'breath', 'gasp'}

# ---------- assemble ----------
shots = cues['shots']
# music spans
i = 0; print('music...', flush=True)
while i < len(shots):
    j = i; m = shots[i]['m']
    while j + 1 < len(shots) and shots[j + 1]['m'] == m: j += 1
    t0 = shots[i]['start']; dur = shots[j]['start'] + shots[j]['d'] - t0
    if m:
        x = render_music(m, dur); x = fade(x[:int((dur + 0.8) * SR)], 0.5, 1.3); add(mix, x, max(0, t0 - 0.15), 0.42, 0.35)
    i = j + 1
# ambience spans
print('ambience...', flush=True)
def amb_key(s):
    if s['fire'] > 0: return 'fire'
    return {'village': 'wind', 'forest': 'forest', 'hill': 'night', 'void': 'void', 'room': 'room', 'throne': 'cave'}[s['set']]
i = 0
while i < len(shots):
    j = i; k = amb_key(shots[i])
    while j + 1 < len(shots) and amb_key(shots[j + 1]) == k: j += 1
    t0 = shots[i]['start']; dur = shots[j]['start'] + shots[j]['d'] - t0
    if k == 'fire': x = crackle(dur + 0.5) * 0.35 + wind(dur + 0.5, 150, 600) * 0.12
    elif k == 'wind': x = wind(dur + 0.5) * 0.12
    elif k == 'forest': x = wind(dur + 0.5, 400, 2500, 0.25) * 0.16
    elif k == 'night': x = wind(dur + 0.5, 150, 700, 0.1) * 0.14
    elif k == 'void': x = lp(nz(int((dur + 0.5) * SR)), 80) * 1.5
    elif k == 'cave': x = lp(nz(int((dur + 0.5) * SR)), 90) * 1.5
    else: x = lp(nz(int((dur + 0.5) * SR)), 300) * 0.08
    add(mix, fade(x, 0.6, 0.6), t0, 1.0, 0.1); i = j + 1
print('sfx...', flush=True)
for s in shots:
    for c in s['sfx']:
        at, name = c[0], c[1]; vol = c[2] if len(c) > 2 else 1.0
        fn = SFX.get(name)
        if not fn: print('missing sfx', name); continue
        try: x = np.asarray(fn(), np.float32)
        except Exception as e: print('sfx error', name, e); continue
        add(mix, x, s['start'] + at, vol * (0.3 if name in VOXISH else 0.55), 0.3)
# reverb (overlap-add FFT convolution), slightly different tail left/right
print('reverb...', flush=True)
def reverb(x, seed):
    r = np.random.default_rng(seed); L = int(2.2 * SR); ir = r.standard_normal(L).astype(np.float32) * np.exp(-np.arange(L) / (0.55 * SR)); ir = lp(ir, 5000, 1); ir /= np.sqrt((ir ** 2).sum())
    B = 1 << 19; nf = 1 << int(np.ceil(np.log2(B + L))); IR = np.fft.rfft(ir, nf); out = np.zeros(len(x) + nf, np.float32)
    for a in range(0, len(x), B): out[a:a + nf] += np.fft.irfft(np.fft.rfft(x[a:a + B], nf) * IR, nf).astype(np.float32)
    return out[:len(x)]
Lc = mix + reverb(wet, 1) * 0.5; Rc = mix + reverb(wet, 2) * 0.5
st = np.stack([Lc, Rc], 1)[:int(TOTAL * SR)]
# master: gentle compression by slow gain riding + soft clip
envp = box(np.abs(st).max(1), SR * 0.4) + 1e-4; gain = np.clip(0.16 / envp, 0.5, 2.2); gain = box(gain, SR * 0.5); st *= gain[:, None]
st = np.tanh(st * 1.5) / np.tanh(1.5); st *= 0.92 / max(1e-6, np.abs(st).max())
w = wave.open(sys.argv[2], 'wb'); w.setnchannels(2); w.setsampwidth(2); w.setframerate(SR); w.writeframes((st * 32767).astype(np.int16).tobytes()); w.close()
print('ok', TOTAL, 's')
