# อาณาจักรอัสตรา ตอนที่ 2 "นครที่ไม่มีพระอาทิตย์"

ใช้เอนจินของตอนที่ 1 (`../astra_ep01/engine.js, model.js, fx*.js, player.js, audio.py`) ไฟล์ในโฟลเดอร์นี้มีเฉพาะของตอนที่ 2

- `world.js` ตัวละครใหม่ (แจ็กซ์ เอล ธีโอ เด็กซีด โซเลน), พร็อพ (ตะเกียง ไม้จุดตะเกียง ตะวันขวด), ฉาก `valen` (นครวาเลน ถนนตะเกียง ตรอก ประตูเมือง
  หอตะวัน จานดำบนฟ้า ชะง่อนขอบแอ่ง) และ `lamphouse` (โรงตะเกียง + ภาพประกาศจับ), สัตว์กลืนแสง `FX.beast`
- `story/ep2.js` ลำดับช็อต 7 ฉาก (scene id 21–27) ลำดับซับต้องตรงกับ `voice_lines.json`
- `voice_lines.json` บทพูด 50 ประโยค, `voice_lines.py` พากย์ด้วย ElevenLabs (ต้องรันใน environment "Natthawat (TikTok access)")
- `voice_dur.js` ความยาวเสียงต่อประโยค: 1–11 วัดจากไฟล์จริง ที่เหลือเป็นค่าประมาณ

## สถานะเสียงพากย์
โควตา ElevenLabs หมดหลังประโยคที่ 11 (`voice/01–11.mp3`) วิดีโอรุ่นแรกจึงเป็นซับอย่างเดียว เมื่อโควตากลับมา:
`python3 voice_lines.py` (ทำต่อจากประโยค 12) → อัปเดต `voice_dur.js` จาก `voice/manifest.json` → `node cues.js` → เขียน `at` ลง `voice_lines.json`
→ `python3 ../astra_ep01/audio.py cues.json audio.wav` → `python3 mix_voice.py audio.wav audio_voiced.wav` แล้วเรนเดอร์ใหม่ (เวลาช็อตจะขยับตามเสียงจริง)

## เรนเดอร์
```
node cues.js out/cues.json out/astra_ep02_th.srt
python3 ../astra_ep01/audio.py out/cues.json out/audio.wav
AFPS=24 GS=1 node render.js <t0> <t1> out/cNN.mp4     # แบ่งช่วง รันขนาน 3 งาน
```
