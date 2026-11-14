"""Voice every dialogue line of Astra ep.1 with ElevenLabs (Thai), one mp3 per line.
Run in a cloud session whose environment injects the ElevenLabs key for api.elevenlabs.io
(environment "Natthawat (TikTok access)"):   python3 voice_lines.py
Reads voice_lines.json, writes voice/NN.mp3 + voice/manifest.json (who, voice, seconds). Lines already done are skipped.
"""
import json, os, subprocess, sys
HERE = os.path.dirname(os.path.abspath(__file__)); OUT = os.path.join(HERE, 'voice'); os.makedirs(OUT, exist_ok=True)
MODEL = os.environ.get('MODEL', 'eleven_v4')
API = 'https://api.elevenlabs.io/v1'
def curl(args, binary=False):
    r = subprocess.run(['curl', '-sS', '-H', 'xi-api-key: proxy-injected'] + args, capture_output=True)
    return r.stdout if binary else r.stdout.decode('utf-8', 'replace')
# wanted voice per character: (premade voice names to try in order, gender fallback)
WANT = {
    'เรน': (['Liam', 'Chris', 'Will'], 'male'),
    'มีรา': (['Jessica', 'Laura', 'Sarah'], 'female'),
    'โกรน': (['Clyde', 'Callum', 'Adam'], 'male'),
    'ยายเซรา': (['Matilda', 'Lily', 'Alice'], 'female'),
    'ราชันเงา': (['Daniel', 'George', 'Brian'], 'male'),
    'เสียงหญิงสาว': (['Sarah', 'Charlotte', 'Alice'], 'female'),
    'เด็กชาย': (['Gigi', 'Laura', 'Jessica'], 'female'),
    'ชาวบ้าน': (['Eric', 'Bill', 'Brian'], 'male'),
    'เสียงชายลึกลับ': (['George', 'Brian', 'Daniel'], 'male'),
    'เสียงเด็กหญิง': (['Gigi', 'Lily', 'Laura'], 'female'),
}
SETTINGS = {'โกรน': {'stability': 0.35, 'similarity_boost': 0.8, 'style': 0.5}, 'ราชันเงา': {'stability': 0.55, 'similarity_boost': 0.8, 'style': 0.3},
            'เรน': {'stability': 0.4, 'similarity_boost': 0.8, 'style': 0.45}, 'มีรา': {'stability': 0.45, 'similarity_boost': 0.8, 'style': 0.4}}
def main():
    lines = json.load(open(os.path.join(HERE, 'voice_lines.json'), encoding='utf-8'))
    vs = json.loads(curl([API + '/voices'])).get('voices', [])
    if not vs: sys.exit('ElevenLabs /voices returned nothing: is the key injected for api.elevenlabs.io?')
    byname = {v['name'].split(' ')[0].split('-')[0].strip(): v for v in vs}
    def pick(who):
        names, g = WANT.get(who, (['Liam'], 'male'))
        for n in names:
            if n in byname: return byname[n]['voice_id'], n
        for v in vs:
            if (v.get('labels') or {}).get('gender') == g: return v['voice_id'], v['name']
        return vs[0]['voice_id'], vs[0]['name']
    man_path = os.path.join(OUT, 'manifest.json'); man = json.load(open(man_path, encoding='utf-8')) if os.path.exists(man_path) else {}
    used = 0
    for l in lines:
        k = '%02d' % l['i']; mp3 = os.path.join(OUT, k + '.mp3')
        if k in man and os.path.exists(mp3): continue
        vid, vname = pick(l['who'])
        body = {'text': l['txt'], 'model_id': MODEL, 'language_code': 'th'}
        if l['who'] in SETTINGS: body['voice_settings'] = SETTINGS[l['who']]
        data = curl(['-X', 'POST', '-H', 'Content-Type: application/json', f'{API}/text-to-speech/{vid}?output_format=mp3_44100_128', '-d', json.dumps(body, ensure_ascii=False)], binary=True)
        if len(data) < 2000 or data[:1] == b'{':
            body.pop('language_code', None); data = curl(['-X', 'POST', '-H', 'Content-Type: application/json', f'{API}/text-to-speech/{vid}?output_format=mp3_44100_128', '-d', json.dumps(body, ensure_ascii=False)], binary=True)
        if len(data) < 2000 or data[:1] == b'{':
            json.dump(man, open(man_path, 'w', encoding='utf-8'), ensure_ascii=False, indent=1); sys.exit(f'line {k} failed: {data[:300]!r}')
        open(mp3, 'wb').write(data); used += len(l['txt'])
        sec = float(subprocess.run(['ffprobe', '-v', 'error', '-show_entries', 'format=duration', '-of', 'csv=p=0', mp3], capture_output=True, text=True).stdout.strip() or 0)
        man[k] = {'who': l['who'], 'voice': vname, 'sec': round(sec, 3)}; print(k, l['who'], vname, round(sec, 2), flush=True)
        json.dump(man, open(man_path, 'w', encoding='utf-8'), ensure_ascii=False, indent=1)
    print(json.dumps({'lines': len(man), 'chars_this_run': used}))
if __name__ == '__main__': main()
