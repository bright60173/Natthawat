"""Trailer narrator lines (deep male voice) with ElevenLabs: python3 voice_narrator.py  -> teaser_voice/N1.mp3 ...
Run in a session whose environment injects the ElevenLabs key for api.elevenlabs.io."""
import json, os, subprocess, sys
HERE = os.path.dirname(os.path.abspath(__file__)); OUT = os.path.join(HERE, 'teaser_voice'); os.makedirs(OUT, exist_ok=True)
API = 'https://api.elevenlabs.io/v1'; MODEL = os.environ.get('MODEL', 'eleven_v4')
def curl(a, b=False):
    r = subprocess.run(['curl', '-sS', '-H', 'xi-api-key: proxy-injected'] + a, capture_output=True); return r.stdout if b else r.stdout.decode('utf-8', 'replace')
vs = json.loads(curl([API + '/voices'])).get('voices', [])
names = {v['name'].split(' ')[0].split('-')[0]: v for v in vs}
pick = next((names[n] for n in ['Brian', 'Adam', 'Bill', 'George'] if n in names), None) or next(v for v in vs if (v.get('labels') or {}).get('gender') == 'male')
for l in json.load(open(os.path.join(HERE, 'narrator_lines.json'), encoding='utf-8')):
    body = {'text': l['txt'], 'model_id': MODEL, 'language_code': 'th', 'voice_settings': {'stability': 0.6, 'similarity_boost': 0.8, 'style': 0.35}}
    d = curl(['-X', 'POST', '-H', 'Content-Type: application/json', f"{API}/text-to-speech/{pick['voice_id']}?output_format=mp3_44100_128", '-d', json.dumps(body, ensure_ascii=False)], True)
    if len(d) < 2000 or d[:1] == b'{':
        body.pop('language_code'); d = curl(['-X', 'POST', '-H', 'Content-Type: application/json', f"{API}/text-to-speech/{pick['voice_id']}?output_format=mp3_44100_128", '-d', json.dumps(body, ensure_ascii=False)], True)
    if len(d) < 2000 or d[:1] == b'{': sys.exit(f"N{l['i']} failed: {d[:300]!r}")
    open(os.path.join(OUT, f"N{l['i']}.mp3"), 'wb').write(d); print('N%d' % l['i'], pick['name'], len(d))
