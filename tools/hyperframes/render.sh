#!/usr/bin/env bash
# Render a clip from the AI office app with HyperFrames (1080x1920 or 1920x1080, 30 fps, with music + sfx).
# Usage: tools/hyperframes/render.sh <project.json> <out.mp4>
# Needs: Node 22+, FFmpeg, Python 3, Playwright (Chromium), and `npm i hyperframes` in $HF_DIR.
set -euo pipefail
HERE="$(cd "$(dirname "$0")" && pwd)"; ROOT="$(cd "$HERE/../.." && pwd)"
PROJ="$(realpath "$1")"; OUT="$(realpath -m "$2")"
WORK="${WORK:-$(mktemp -d)}"; HF_DIR="${HF_DIR:-$WORK/hf}"
mkdir -p "$WORK/proj/lib" "$WORK/proj/assets/fonts" "$WORK/proj/assets/audio"
mkdir -p "$HF_DIR"; [ -f "$HF_DIR/package.json" ] || (cd "$HF_DIR" && npm init -y >/dev/null)
[ -x "$HF_DIR/node_modules/.bin/hyperframes" ] || (cd "$HF_DIR" && npm i hyperframes >/dev/null)
[ -f "$HF_DIR/node_modules/three/build/three.min.js" ] || (cd "$HF_DIR" && npm i three@0.128.0 >/dev/null)
cp "$HF_DIR/node_modules/three/build/three.min.js" "$WORK/proj/lib/three.min.js"
# Thai fonts (Kanit, Itim) as local files so the render needs no network
UA="Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/120 Safari/537.36"
curl -sS -A "$UA" "https://fonts.googleapis.com/css2?family=Itim&family=Kanit:wght@400;600;800&display=swap" -o "$WORK/proj/fonts.css"
for u in $(grep -o "https://fonts.gstatic.com[^)]*" "$WORK/proj/fonts.css" | sort -u); do curl -sS "$u" -o "$WORK/proj/assets/fonts/$(basename "$u")"; done
sed "s#https://fonts.gstatic.com/[^)]*/\([^/)]*\)#assets/fonts/\1#g" "$WORK/proj/fonts.css" > "$WORK/proj/fonts.local.css"
# page wrapper for the audio step
python3 -c "import sys;b=open(sys.argv[1],encoding='utf-8').read();open(sys.argv[2],'w',encoding='utf-8').write('<!doctype html><html><head><meta charset=\"utf-8\"></head><body>'+b+'</body></html>')" "$ROOT/office.html" "$WORK/wrapped.html"
INFO=$(node "$HERE/audio.js" "$WORK" "$PROJ" "$WORK/proj/assets/audio/music.wav")
DUR=$(echo "$INFO" | python3 -c "import json,sys;print(round(json.load(sys.stdin)['total'],2))")
SIZE=$(python3 -c "import json,sys;p=json.load(open(sys.argv[1]));print('1920 1080' if p.get('aspect')=='16:9' else '1080 1920')" "$PROJ")
python3 "$HERE/build.py" "$ROOT/office.html" "$WORK/proj" "$PROJ" $SIZE "$DUR"
(cd "$WORK/proj" && "$HF_DIR/node_modules/.bin/hyperframes" render . -q delivery -o "$OUT" --quiet)
echo "done: $OUT"
