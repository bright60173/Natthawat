"""Thai voiceover for an AI office clip with ElevenLabs.

Reads a project JSON, speaks every scene's narration with character timings,
writes a project whose scenes carry the timings (subtitles and lip sync follow
the real voice, scene length follows the audio) and one voice track (WAV).

Usage: python3 voice.py <project.json> <out_dir> [voice_id] [model_id]
The API key is sent by the environment's network proxy for api.elevenlabs.io.
"""
import base64, json, os, re, subprocess, sys

VOICE_LEAD = 0.15     # seconds of silence before each scene's line (matches the renderer)
END_PAD = 0.35        # breath after the line

CACHE = os.environ.get("VOICE_CACHE") or os.path.expanduser("~/.cache/aioffice-voice")

def tts(text, voice, model, out_mp3):
    """Cached by (voice, model, text): re-cutting a clip never spends ElevenLabs characters on lines that did not change."""
    import hashlib, shutil
    os.makedirs(CACHE, exist_ok=True)
    key = hashlib.sha1(f"{voice}|{model}|{text}".encode("utf-8")).hexdigest()
    cj, cm = os.path.join(CACHE, key + ".json"), os.path.join(CACHE, key + ".mp3")
    if os.path.exists(cj) and os.path.exists(cm):
        shutil.copy(cm, out_mp3); d = json.load(open(cj, encoding="utf-8")); return d["c"], d["s"], d["e"]
    c, st, en = tts_fetch(text, voice, model, out_mp3)
    shutil.copy(out_mp3, cm); json.dump({"c": c, "s": st, "e": en}, open(cj, "w", encoding="utf-8"), ensure_ascii=False)
    return c, st, en

def tts_fetch(text, voice, model, out_mp3):
    body = json.dumps({"text": text, "model_id": model})
    r = subprocess.run(["curl", "-sS", "-X", "POST", "-H", "Content-Type: application/json", "-H", "xi-api-key: proxy-injected",
                        f"https://api.elevenlabs.io/v1/text-to-speech/{voice}/with-timestamps?output_format=mp3_44100_128", "-d", body],
                       capture_output=True, text=True, check=True)
    d = json.loads(r.stdout)
    if "audio_base64" not in d:
        raise SystemExit(f"ElevenLabs error: {r.stdout[:300]}")
    open(out_mp3, "wb").write(base64.b64decode(d["audio_base64"]))
    a = d.get("alignment") or {}
    return a.get("characters", []), a.get("character_start_times_seconds", []), a.get("character_end_times_seconds", [])

def dur(path):
    return float(subprocess.run(["ffprobe", "-v", "error", "-show_entries", "format=duration", "-of", "csv=p=0", path], capture_output=True, text=True).stdout.strip())

def main():
    src, out = sys.argv[1], sys.argv[2]
    voice = sys.argv[3] if len(sys.argv) > 3 else "TX3LPaxmHKxFdv7VOQHJ"
    model = sys.argv[4] if len(sys.argv) > 4 else "eleven_v4"
    os.makedirs(out, exist_ok=True)
    p = json.load(open(src, encoding="utf-8"))
    t, parts, chars = 0.0, [], 0
    for i, s in enumerate(p["scenes"]):
        text = re.sub(r"\*", "", str(s.get("narration", ""))).strip()
        s["narration"] = text
        if not text:
            t += float(s.get("duration", 3)); continue
        mp3 = os.path.join(out, f"scene{i+1:02d}.mp3")
        say = re.sub(r"\*", "", str(s.get("speak") or text)).strip()  # spoken form (e.g. digits read out); subtitles keep narration
        ch, st, en = tts(say, voice, model, mp3); chars += len(say)
        if say == text and "".join(ch) == text and len(st) == len(text):
            s["align"] = {"s": [round(x, 3) for x in st], "e": [round(x, 3) for x in en]}
            s["duration"] = round(max(VOICE_LEAD + max(en) + float(s.get("pad", END_PAD)), float(s.get("hold", 0))), 3)
        else:  # timings do not line up with the text: keep the estimate, still fit the audio
            s.pop("align", None); s["duration"] = round(max(float(s.get("duration", 3)), VOICE_LEAD + dur(mp3) + float(s.get("pad", END_PAD))), 3)
        parts.append((mp3, t + VOICE_LEAD)); t += s["duration"]
    json.dump(p, open(os.path.join(out, "project_voiced.json"), "w", encoding="utf-8"), ensure_ascii=False)
    # one voice track: each line placed at its scene start
    args = ["ffmpeg", "-v", "error", "-y"]
    for mp3, _ in parts: args += ["-i", mp3]
    flt = "".join(f"[{k}:a]adelay={int(at*1000)}|{int(at*1000)}[a{k}];" for k, (_, at) in enumerate(parts))
    flt += "".join(f"[a{k}]" for k in range(len(parts))) + f"amix=inputs={len(parts)}:normalize=0[v]"
    subprocess.run(args + ["-filter_complex", flt, "-map", "[v]", "-ar", "48000", "-ac", "2", os.path.join(out, "voice.wav")], check=True)
    print(json.dumps({"scenes": len(p["scenes"]), "voiced": len(parts), "characters": chars, "seconds": round(t, 2)}))

if __name__ == "__main__":
    main()
