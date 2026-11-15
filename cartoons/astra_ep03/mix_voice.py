"""Mix the ElevenLabs lines (voice/NN.mp3) into the soundtrack: each line starts at its subtitle time
(pushed later if the previous line is still talking), music/effects duck under the voice.
python3 mix_voice.py <audio.wav> <out.wav>"""
import json, os, subprocess, sys, wave, numpy as np
HERE = os.path.dirname(os.path.abspath(__file__)); SR = 44100
def load_wav(p):
    w = wave.open(p); n = w.getnframes(); ch = w.getnchannels(); x = np.frombuffer(w.readframes(n), np.int16).astype(np.float32) / 32768; return x.reshape(-1, ch)
def load_mp3(p):
    r = subprocess.run(['ffmpeg', '-v', 'error', '-i', p, '-f', 's16le', '-ac', '1', '-ar', str(SR), '-'], capture_output=True, check=True)
    return np.frombuffer(r.stdout, np.int16).astype(np.float32) / 32768
bed = load_wav(sys.argv[1]); N = len(bed)
lines = json.load(open(os.path.join(HERE, 'voice_lines.json'), encoding='utf-8'))
voice = np.zeros(N, np.float32); busy = np.zeros(N, np.float32); prev_end = 0; placed = []
for l in lines:
    p = os.path.join(HERE, 'voice', '%02d.mp3' % l['i'])
    if not os.path.exists(p): print('missing', p); continue
    x = load_mp3(p); x = x / max(1e-4, np.abs(x).max()) * 0.8
    at = max(l['at'] - 0.05, prev_end + 0.12); i = int(at * SR); n = min(len(x), N - i)
    if n <= 0: continue
    voice[i:i + n] += x[:n]; busy[i:i + n] = 1; prev_end = at + len(x) / SR; placed.append((l['i'], round(at - l['at'], 2)))
late = [p for p in placed if p[1] > 0.6]
# ducking envelope: smooth 'busy' (attack/release ~0.25 s), music down to 35 %
k = int(0.25 * SR); env = np.convolve(busy, np.ones(k) / k, 'same'); env = np.convolve(env, np.ones(k) / k, 'same')
duck = 1 - 0.65 * np.clip(env, 0, 1)
out = bed * duck[:, None] + voice[:, None] * 0.95
out = np.tanh(out * 1.2) / np.tanh(1.2); out *= 0.95 / max(1e-6, np.abs(out).max())
w = wave.open(sys.argv[2], 'wb'); w.setnchannels(2); w.setsampwidth(2); w.setframerate(SR); w.writeframes((out * 32767).astype(np.int16).tobytes()); w.close()
print(json.dumps({'lines': len(placed), 'pushed_late_over_0.6s': late[:20]}))
