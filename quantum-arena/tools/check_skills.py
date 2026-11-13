#!/usr/bin/env python3
"""ตรวจว่าสกิลทุกอันใน SkillData มี handler ฝั่ง server ที่ Id ตรงกัน (และไม่มี handler เกิน)"""
import pathlib
import re
import sys

ROOT = pathlib.Path(__file__).resolve().parent.parent
DATA = ROOT / "src" / "shared" / "SkillData"
HANDLERS = ROOT / "src" / "server" / "SkillHandlers"

errors = []
total = 0
for data_file in sorted(DATA.glob("*.lua")):
    text = data_file.read_text(encoding="utf-8")
    sub_id = re.search(r'^\tId = "(\w+)"', text, re.M).group(1)
    if sub_id != data_file.stem:
        errors.append(f"{data_file.name}: Id '{sub_id}' ไม่ตรงกับชื่อไฟล์")
    skills_block = text[text.index("Skills = {"):]
    skill_ids = re.findall(r'\bId = "(\w+)"', skills_block)
    if len(skill_ids) != 5:
        errors.append(f"{sub_id}: มี {len(skill_ids)} สกิล (ต้องมี 5)")
    if len(set(skill_ids)) != len(skill_ids):
        errors.append(f"{sub_id}: มี Id สกิลซ้ำ")
    for field in ("Name", "Description", "Cooldown", "Range", "Targeting", "Icon", "DamageText"):
        count = len(re.findall(rf"\b{field} = ", skills_block))
        if count != len(skill_ids):
            errors.append(f"{sub_id}: ฟิลด์ {field} มี {count} จาก {len(skill_ids)} สกิล")

    handler_file = HANDLERS / f"{sub_id}.lua"
    if not handler_file.exists():
        errors.append(f"{sub_id}: ไม่มีไฟล์ handler {handler_file.name}")
        continue
    handler_ids = re.findall(r"^H\.(\w+) = function", handler_file.read_text(encoding="utf-8"), re.M)
    for skill_id in skill_ids:
        total += 1
        if skill_id not in handler_ids:
            errors.append(f"{sub_id}.{skill_id}: มี data แต่ไม่มี handler")
    for handler_id in handler_ids:
        if handler_id not in skill_ids:
            errors.append(f"{sub_id}.{handler_id}: มี handler แต่ไม่มี data")

if errors:
    print("พบปัญหา:")
    for error in errors:
        print("  -", error)
    sys.exit(1)
print(f"ตรวจแล้ว {total} สกิล: data กับ handler ตรงกันทุกตัว")
