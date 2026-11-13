#!/usr/bin/env bash
# สร้างไฟล์ QuantumArena.rbxlx สำหรับเปิดใน Roblox Studio
set -euo pipefail
cd "$(dirname "$0")"
python3 tools/check_skills.py
rojo build default.project.json -o QuantumArena.rbxlx
echo "สร้างไฟล์ QuantumArena.rbxlx เรียบร้อย"
