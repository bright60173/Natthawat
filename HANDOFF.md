# AI Office — handoff notes

Read CONVERSATION_LOG.md too: it records everything the owner asked, chose and criticised.

Personal AI office web app (Thai) where a team of 20 AI employees plans, writes,
animates, edits, voices, checks and approves short vertical videos. The owner uses
an iPad (and iPhone) only.

- App (published page): https://claude.ai/artifact/Ed3WjE1vaZMnYs2wvesWLC
- Source: `office.html` (single file). Branch: `claude/personal-office-ai-employee-iwu6wi`
- The published page is `office.html` without the `<!doctype>/<head>/<body>` wrapper
  (strip the first 5 lines, `</head><body>` and the closing `</body></html>`), published
  with capabilities `sample` (images), `db`, `downloads`, `user`.

## Owner preferences (decided in earlier sessions; follow them)

Working style
- Reply in Thai. Act and decide on your own; do not stop to wait for answers ("ทำเองจัดการเอง").
  Ask only for things only the owner can give (keys, taste choices), with clear options.
- Be honest about what was and was not tested; test thoroughly ("ไม่ใช่เทสลวกๆ").
- The owner has only an iPad and an iPhone (Safari / Claude app), no computer.
- Goal: every clip 10/10, especially animation and graphics. Quality over speed.

Clips
- Channel formats: story + lesson (like the viral reference by @promptkub.ai) and what-if / science.
- Use the viral editing style: info cards for numbers, documentary subtitles with English,
  2-4 s shots, close-ups, muted cinematic look where it fits, one focal point per shot.
- Characters keep the original cute cartoon style (do not switch to the "slim" style).
  Clip characters have no outlines.
- Narration is a third-person narrator: characters must NOT lip-sync to it.
- No asterisks or markdown in on-screen text; subtitles must never overlap words or faces
  and must stay in the social safe zone (IG/TikTok UI covers the bottom ~30%).
- Graphics must look professional; the owner called simple shapes "ห่วย". Illustrations,
  not emoji, for the main subject.
- Voice: ElevenLabs Thai; narrator voice not chosen yet (default Liam). Music: lower under
  the voice; the owner may add trending music when posting.
- Font for clip text: picker in Studio (default Kanit).

App UI
- No gradients, no glow, no emoji in UI chrome; must look human-designed, not "AI-made".
  Warm paper theme with one solid accent, line icons, IBM Plex Sans Thai.
- Side navigation rail; office is a flat 2D illustration with outlined cartoon staff (no pixel art).
- Each department has a head and staff.

## What is in the app

- **Team**: 7 departments, each with a head and 1-2 staff (`DEPTS`, `EMPLOYEES`, `STAFF`).
  Pipeline `AUTO_STEPS`: plan → creative (+ table read, 9/10 bar) → animator → editor
  (edit lists via `EDIT_FORMAT`/`mergeEdits`, `staffFallbacks`, `directorPass`) → voice →
  QA (visual review of real frames via `sceneFrames`, up to 2 send-backs, 9/10 bar) →
  approve (one extra fix round if the manager does not approve).
- **Formats**: `story` (story + lesson, viral house style) and `whatif`; both use
  documentary subtitles (`subStyle:"doc"` + `subEn`), info cards and 2-4 s shots.
- **Engine** (`Renderer`): 2D characters (cute style, outlined, no lip sync to narration;
  mouth moves only for a speech bubble), professional prop illustrations (`PROPS_HQ`,
  rotating globe with real continents, tsunami wave, …), info cards (`drawInfoCard`:
  stat / timer / compare), 3D backgrounds (three.js r128 from cdnjs) plus 2D-only
  `studio` / `warehouse`, cinematic look, subtitle placement inside the social safe zone,
  fonts picker (8 Thai fonts).
- **Voice**: ElevenLabs `eleven_v4` (Thai) with character timings (`s.align`), in the app
  (Settings → ElevenLabs key, voice, auto-voice) and in renders.
- **UI**: side rail (Office / Team chat / Studio / Library), warm paper theme + dark mode,
  flat illustrated office (`drawRoom`, `drawPeople`, desk sprite cache).

## Rendering in a cloud session

`tools/hyperframes/render.sh` renders a project JSON to MP4 with HyperFrames
(1080x1920, 30 fps). Needs Node 22+, FFmpeg, Python 3, Playwright Chromium and
`npm i hyperframes` (the script installs it into `$HF_DIR`).

```
VOICE=1 WORK=/tmp/work HF_DIR=/tmp/hf tools/hyperframes/render.sh project.json out.mp4
```

`VOICE=1` (or an ElevenLabs voice id) adds the voiceover; the API key is a network
secret on the cloud environment **"Natthawat (TikTok access)"** for host
`api.elevenlabs.io`, header `xi-api-key`, no prefix (free tier, 10k chars/month).

## Tests (`tests/e2e`)

Playwright scripts. Most take the scratch directory as the first argument and expect:
`wrapped.html` there (build with `python3 tests/e2e/wrap.py office.html <dir>/wrapped.html`),
`three/package/build/three.min.js` (from `npm pack three@0.128.0`), and for some, a
`gf/` folder with Google Fonts CSS and woff2 files. Key suites: `t16` (subtitles,
asterisks, edits: 29 checks), `t17` (Safari text), `t18` (iOS TTS), `t19` (screen
recording mode), `t12`/`t36`/`t43` (team pipeline with mocked Claude), `t40` (no lip
sync), `t41` (in-app ElevenLabs), `t24` (Blender export + `mockbpy`). `real_run.js` runs
the whole team with real Claude through the Claude Code CLI.

## Open items / next steps

1. Run clip #4 end to end with the latest system (house style, new illustrations,
   composition rules, approval loop) and send it with voice.
2. 3D city/meadow backgrounds still look toy-like next to the new illustrations;
   consider illustrated 2D sets per situation with the cinematic look.
3. The owner has not picked a narrator voice yet (default Liam, `TX3LPaxmHKxFdv7VOQHJ`).
4. Unverified on a real iPad: in-app ElevenLabs fetch (claude.ai may block it) and
   video export on iPhone Safari.
5. The owner wants 10/10 clips; send viral reference clips are welcome (TikTok
   blocks automated download, so the owner uploads the video file).
