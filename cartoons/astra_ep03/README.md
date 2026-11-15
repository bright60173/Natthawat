# อาณาจักรอัสตรา ตอนที่ 3 "หนี้แสงตะวัน"

ใช้เอนจินของตอนที่ 1 (`../astra_ep01/`) และโลกของตอนที่ 2 (`../astra_ep02/world.js`) ไฟล์ในโฟลเดอร์นี้มีเฉพาะของตอนที่ 3

- `world3.js` ตัวละครใหม่ (ป้ามาร์ธา พิป ผู้ประกาศ คนเก็บหนี้ หญิงชรา คนจุดตะเกียง โซเลน), พร็อพ (เข็มสัก ขนมปัง ประกาศ), ส่วนต่อเติมของฉาก `valen`
  (ถนนชายขอบความมืด x 74–104 กับตะเกียง `st.e0–e2`, ดาดฟ้าโรงตะเกียง x 15.5–27.5 z 34–40 สูง 9, เวทีผู้ประกาศ `st.stage`, ตะวันดวงเก่า `st.sun`/`st.noDisc`),
  ฉาก `ward` (โรงพักเด็กซีด ขวดข้างเตียง `st.j0–j7`), `FX.mark`, `FX.beam`
- `story/ep3a.js, ep3b.js, ep3c.js` 10 ฉาก (scene id 31–40) 169 ช็อต 131 ประโยค ลำดับซับต้องตรงกับ `voice_lines.json`
- `voice_dur.js` ความยาวเสียงต่อประโยค ตอนนี้เป็นค่าประมาณทั้งหมด (ยังไม่ได้พากย์ โควตา ElevenLabs หมดตั้งแต่ตอนที่ 2)

ข้อควรระวัง: ถ้าตัวละครสองตัวตั้ง `f` ชี้หากันด้วยชื่อ (`f: 'ren'` กับ `f: 'theo'`) ตัวหนึ่งจะหันผิดทาง ให้ใส่พิกัดแทนอย่างน้อยหนึ่งฝั่ง

## พากย์เสียงภายหลัง
รันใน environment "Natthawat (TikTok access)": `python3 voice_lines.py` → อัปเดต `voice_dur.js` จาก `voice/manifest.json` → `node cues.js` → เขียน `at` ลง
`voice_lines.json` → `python3 ../astra_ep01/audio.py cues.json audio.wav` → `python3 mix_voice.py audio.wav audio_voiced.wav` แล้วเรนเดอร์ใหม่

## เรนเดอร์
```
node cues.js out/cues.json out/astra_ep03_th.srt
python3 ../astra_ep01/audio.py out/cues.json out/audio.wav
AFPS=24 GS=1 node render.js <t0> <t1> out/cNN.mp4     # รันขนาน 2 งานเร็วกว่า 3 งาน (3 งานแย่ง CPU กันจนช้าลงเกินเท่าตัว)
```
